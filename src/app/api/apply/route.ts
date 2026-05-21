import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'
import { escHtml } from '@/lib/html-escape'
import { rateLimit } from '@/lib/rate-limit'
import { sendWaitlistBienvenueEmail, sendCandidatureRecueEmail } from '@/lib/email'
import { getClubSettings } from '@/lib/settings'
import { notifySlack } from '@/lib/slack'

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin':  process.env.ALLOWED_ORIGIN ?? 'https://nouveauvariable.fr',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: getCorsHeaders() })
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

async function generateReferralCode(svc: ReturnType<typeof createServiceClient>): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = ''
    for (let i = 0; i < 8; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)]
    const { data } = await svc.from('candidatures').select('id').eq('code_parrain', code).maybeSingle()
    if (!data) return code
  }
  throw new Error('Impossible de générer un code parrain unique')
}

const PROJET_BESOINS = ['investisseur', 'clients', 'partenaires', 'expertise', 'autre'] as const

const Schema = z.object({
  firstname:          z.string().min(1).max(100),
  lastname:           z.string().min(1).max(100),
  email:              z.string().email().max(254),
  phone:              z.string().max(30).optional().or(z.literal('')),
  city:               z.string().min(1).max(100),
  role:               z.string().min(1).max(100),
  sector:             z.string().min(1).max(200),
  xp:                 z.string().max(50).optional().or(z.literal('')),
  why:                z.string().min(1).max(2000),
  referral:           z.string().max(50).optional().or(z.literal('')),
  projet_nom:         z.string().min(1).max(200).optional(),
  projet_website:     z.string().url().max(500).optional().or(z.literal('')),
  projet_concept:     z.string().min(10).max(500).optional(),
  projet_avancement:  z.enum(['idee', 'mvp', 'lancement', 'croissance', 'mature']).optional(),
  projet_besoins:     z.array(z.enum(PROJET_BESOINS)).min(1).optional(),
}).refine(d => {
  const hasAny = d.projet_nom || d.projet_concept || d.projet_avancement || d.projet_besoins?.length
  if (!hasAny) return true
  return !!(d.projet_nom && d.projet_concept && d.projet_avancement && d.projet_besoins?.length)
}, { message: 'Tous les champs projet sont requis si vous renseignez un projet' })

export async function POST(request: NextRequest) {
  const CORS = getCorsHeaders()

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ipAllowed = await rateLimit(`apply:${ip}`, 3, 3600)
  if (!ipAllowed) {
    return NextResponse.json({ error: 'Trop de candidatures depuis cette IP. Réessaie dans 1 heure.' }, { status: 429, headers: CORS })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400, headers: CORS })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400, headers: CORS })
  }

  const { firstname, lastname, phone, city, role, sector, xp, why, referral,
          projet_nom, projet_website, projet_concept, projet_avancement, projet_besoins } = parsed.data
  const email = parsed.data.email.toLowerCase().trim()
  const fullName = `${firstname} ${lastname}`.trim()

  const svc = createServiceClient()

  const { data: existingRows } = await svc
    .from('candidatures')
    .select('id, status, blocked')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)

  const existing = existingRows?.[0] ?? null

  if (existing) {
    if (existing.blocked) {
      return NextResponse.json(
        { error: 'blocked', message: 'Cet email ne peut plus soumettre de candidature.' },
        { status: 403, headers: CORS }
      )
    }
    if (existing.status !== 'rejected') {
      return NextResponse.json(
        { error: 'already_exists', message: 'Une candidature existe déjà pour cet email.' },
        { status: 409, headers: CORS }
      )
    }
    // Rejet non bloqué → on laisse repostuler, on nettoie l'ancienne candidature
    await svc.from('candidatures').delete().eq('id', existing.id)
  }

  const code_parrain = await generateReferralCode(svc)

  const { data: inserted, error: insertError } = await svc.from('candidatures').insert({
    full_name:          fullName,
    email,
    phone:              phone              || null,
    city,
    role,
    sector,
    experience:         xp                || null,
    motivation:         why,
    referral_code:      referral           || null,
    code_parrain,
    projet_nom:         projet_nom         || null,
    projet_website:     projet_website     || null,
    projet_concept:     projet_concept     || null,
    projet_avancement:  projet_avancement  || null,
    projet_besoins:     projet_besoins     ?? null,
    status:             'received',
  }).select('id').single()

  if (insertError) {
    console.error('[apply] Supabase insert error:', insertError.code)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500, headers: CORS })
  }

  // Compteur waitlist pour l'email de confirmation
  const { count } = await svc
    .from('candidatures')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'received', 'reviewed'])

  const currentCount = count ?? 0

  // Notif admin
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to:      [{ email: adminEmail }],
        sender:  { email: process.env.BREVO_SENDER_EMAIL!, name: 'Nouveau Variable' },
        subject: `Nouvelle candidature — ${escHtml(fullName)} (${currentCount}/100)`,
        htmlContent: `
          <h2>Nouvelle candidature reçue</h2>
          <table style="font-family:sans-serif;border-collapse:collapse">
            <tr><td style="padding:4px 12px 4px 0;color:#888">Nom</td><td>${escHtml(fullName)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#888">Email</td><td>${escHtml(email)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#888">Code parrain</td><td>${escHtml(code_parrain)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#888">Téléphone</td><td>${escHtml(phone || '—')}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#888">Ville</td><td>${escHtml(city)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#888">Rôle</td><td>${escHtml(role)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#888">Secteur</td><td>${escHtml(sector)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#888">Expérience</td><td>${escHtml(xp || '—')}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#888">Parrainage reçu</td><td>${escHtml(referral || '—')}</td></tr>
            ${projet_nom ? `<tr><td style="padding:4px 12px 4px 0;color:#888">Projet</td><td>${escHtml(projet_nom)}</td></tr>` : ''}
          </table>
          <h3>Motivation</h3>
          <p>${escHtml(why)}</p>
        `,
      }),
    }).catch(() => null)
  }

  // Email confirmation candidat (fire & forget)
  const settings = await getClubSettings()
  if (settings.waitlist_mode) {
    console.log('[APPLY] Waitlist mode ON → sending waitlist email', { email })
    sendWaitlistBienvenueEmail({ email, prenom: firstname, code_parrain })
      .catch(err => console.error('[apply] Email waitlist:', err))
  } else {
    console.log('[APPLY] Waitlist mode OFF → sending candidature_recue email', { email })
    sendCandidatureRecueEmail({ email, prenom: firstname, code_parrain, current_count: String(currentCount) })
      .catch(err => console.error('[apply] Email candidature_recue:', err))
  }

  // Ajout à la liste Brevo waitlist
  const listId = parseInt(process.env.BREVO_LIST_ID_WAITLIST ?? '0')
  if (listId) {
    fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        attributes: { PRENOM: firstname, CODE_PARRAIN: code_parrain },
        listIds: [listId],
      }),
    }).catch(() => null)
  }

  // Slack — fire & forget
  notifySlack({
    title: '🆕 Nouvelle candidature',
    description: `${fullName} — ${currentCount} en attente`,
    fields: [
      { title: 'Email',      value: email },
      { title: 'Rôle',       value: role },
      { title: 'Ville',      value: city },
      { title: 'Expérience', value: xp || '—' },
      { title: 'Parrainage', value: referral || 'Aucun' },
    ],
    color: '#36a64f',
  }).catch(() => null)

  return NextResponse.json(
    { success: true, candidatureId: inserted.id, code_parrain, message: 'Candidature reçue ✓' },
    { headers: CORS }
  )
}
