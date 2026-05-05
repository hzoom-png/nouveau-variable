import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'
import { escHtml } from '@/lib/html-escape'
import { rateLimit } from '@/lib/rate-limit'

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

const Schema = z.object({
  firstname:  z.string().min(1).max(100),
  lastname:   z.string().min(1).max(100),
  email:      z.string().email().max(254),
  phone:      z.string().max(30).optional().or(z.literal('')),
  city:       z.string().max(100).optional().or(z.literal('')),
  role:       z.string().max(100).optional().or(z.literal('')),
  sector:     z.string().max(200).optional().or(z.literal('')),
  xp:         z.string().max(50).optional().or(z.literal('')),
  why:        z.string().max(2000).optional().or(z.literal('')),
  referral:   z.string().max(50).optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  const CORS = getCorsHeaders()

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ipAllowed = await rateLimit(`apply:${ip}`, 5, 300)
  if (!ipAllowed) {
    return NextResponse.json({ error: 'Trop de candidatures depuis cette IP. Réessaie dans 5 minutes.' }, { status: 429, headers: CORS })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400, headers: CORS })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400, headers: CORS })
  }

  const { firstname, lastname, email, phone, city, role, sector, xp, why, referral } = parsed.data
  const fullName = `${firstname} ${lastname}`.trim()

  const svc = createServiceClient()

  const { error: insertError } = await svc.from('candidatures').insert({
    full_name:     fullName,
    email,
    phone:         phone    || null,
    city:          city     || null,
    role:          role     || null,
    sector:        sector   || null,
    experience:    xp       || null,
    motivation:    why      || null,
    referral_code: referral || null,
    status:        'received',
  })

  if (insertError) {
    console.error('[apply] Supabase insert error:', insertError.code)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500, headers: CORS })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.error('[apply] ADMIN_EMAIL non défini')
  } else {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to:      [{ email: adminEmail }],
        sender:  { email: 'noreply@nouveauvariable.fr', name: 'Nouveau Variable' },
        subject: `Nouvelle candidature — ${escHtml(fullName)}`,
        htmlContent: `
          <h2>Nouvelle candidature reçue</h2>
          <table style="font-family:sans-serif;border-collapse:collapse">
            <tr><td style="padding:4px 12px 4px 0;color:#888">Nom</td><td>${escHtml(fullName)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#888">Email</td><td>${escHtml(email)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#888">Téléphone</td><td>${escHtml(phone || '—')}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#888">Ville</td><td>${escHtml(city || '—')}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#888">Rôle</td><td>${escHtml(role || '—')}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#888">Secteur</td><td>${escHtml(sector || '—')}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#888">Expérience</td><td>${escHtml(xp || '—')}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#888">Parrainage</td><td>${escHtml(referral || '—')}</td></tr>
          </table>
          <h3>Motivation</h3>
          <p>${escHtml(why || '—')}</p>
        `,
      }),
    }).catch(() => null)
  }

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to:      [{ email, name: fullName }],
      sender:  { email: 'club@nouveauvariable.fr', name: 'Nouveau Variable' },
      subject: 'Ta candidature Nouveau Variable',
      htmlContent: `
        <p>Bonjour ${escHtml(firstname)},</p>
        <p>Nous avons bien reçu ta candidature pour rejoindre Nouveau Variable.</p>
        <p>Chaque dossier est examiné manuellement. Tu recevras une réponse sous 48h.</p>
        <p>À très vite,<br>L'équipe Nouveau Variable</p>
      `,
    }),
  }).catch(() => null)

  return NextResponse.json({ success: true }, { headers: CORS })
}
