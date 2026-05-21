import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, TEMPLATE_IDS } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import { encryptIban } from '@/lib/encryption'
import { z } from 'zod'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

function isPdf(buf: Buffer): boolean {
  return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46
}

const MonthYearSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Format attendu: YYYY-MM')

export async function POST(req: NextRequest) {
  // Auth
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Rate limit: max 5 soumissions par heure par affilié
  const allowed = await rateLimit(`commission_submit_${user.id}`, 5, 3600)
  if (!allowed) {
    return NextResponse.json({ error: 'Trop de requêtes, réessayez dans une heure' }, { status: 429 })
  }

  const formData = await req.formData()
  const monthYear     = formData.get('month_year') as string | null
  const revenueStr    = formData.get('revenue_earned') as string | null
  const file          = formData.get('facture') as File | null
  const iban          = formData.get('iban') as string | null
  const accountHolder = formData.get('account_holder') as string | null

  // Validation
  const monthParsed = MonthYearSchema.safeParse(monthYear)
  if (!monthParsed.success) {
    return NextResponse.json({ error: 'Format month_year invalide (attendu: YYYY-MM)' }, { status: 400 })
  }

  const revenueEarned = parseFloat(revenueStr ?? '')
  if (isNaN(revenueEarned) || revenueEarned <= 0) {
    return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
  }

  if (!file) {
    return NextResponse.json({ error: 'Facture PDF requise' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Fichier trop lourd (max 5 Mo)' }, { status: 413 })
  }

  const buf = Buffer.from(await file.arrayBuffer())
  if (!isPdf(buf)) {
    return NextResponse.json({ error: 'Le fichier doit être un PDF' }, { status: 415 })
  }

  const svc = createServiceClient()

  // Vérifier que l'affilié est actif
  const { data: profile } = await svc
    .from('profiles')
    .select('id, first_name, last_name, email, is_active, referral_code')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) {
    return NextResponse.json({ error: 'Compte inactif' }, { status: 403 })
  }

  // Vérifier doublon (une seule soumission par mois)
  const { count: existing } = await svc
    .from('commission_requests')
    .select('id', { count: 'exact', head: true })
    .eq('affiliate_id', user.id)
    .eq('month_year', monthYear)

  if ((existing ?? 0) > 0) {
    return NextResponse.json({ error: 'Demande déjà soumise pour ce mois' }, { status: 409 })
  }

  // Upload PDF dans Supabase Storage
  const storagePath = `commissions/${user.id}/${monthYear}.pdf`
  const { error: uploadError } = await svc.storage
    .from('commissions')
    .upload(storagePath, buf, { contentType: 'application/pdf', upsert: true })

  if (uploadError) {
    console.error('[commission/submit] Storage upload error:', uploadError.message)
    return NextResponse.json({ error: 'Erreur upload fichier' }, { status: 500 })
  }

  const { data: { publicUrl } } = svc.storage.from('commissions').getPublicUrl(storagePath)

  const now = new Date().toISOString()

  // Insérer la demande
  const { data: request, error: insertError } = await svc
    .from('commission_requests')
    .insert({
      affiliate_id:        user.id,
      month_year:          monthYear,
      status:              'facture_recue',
      revenue_earned:      revenueEarned,
      facture_path:        storagePath,
      facture_url:         publicUrl,
      facture_received_at: now,
      submitted_at:        now,
    })
    .select('id')
    .single()

  if (insertError || !request) {
    console.error('[commission/submit] Insert error:', insertError?.message)
    return NextResponse.json({ error: 'Erreur enregistrement' }, { status: 500 })
  }

  // Sauvegarder les coordonnées bancaires (upsert) — IBAN chiffré AES-256-GCM
  if (iban) {
    const encryptedIban = encryptIban(iban.replace(/\s/g, ''))
    await svc.from('affiliate_banking_info').upsert({
      affiliate_id:        user.id,
      iban:                encryptedIban,
      account_holder_name: accountHolder ?? '',
      payment_method:      'bank_transfer',
      updated_at:          now,
    }, { onConflict: 'affiliate_id' })
  }

  // Email admin (fire & forget)
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@nouveauvariable.fr'
  sendEmail({
    to:         { email: adminEmail, name: 'Admin NV' },
    templateId: TEMPLATE_IDS.COMMISSION_FACTURE_ADMIN,
    params: {
      affiliate_prenom: profile.first_name ?? '',
      affiliate_nom:    profile.last_name ?? '',
      month_year:       monthYear!,
      revenue_earned:   revenueEarned.toFixed(2),
      facture_url:      publicUrl,
      id:               request.id,
      lien_admin:       `https://app.nouveauvariable.fr/admin/commissions`,
    },
    tags: ['commission', 'facture-recue'],
  }).catch(err => console.error('[commission/submit] Email admin error:', err))

  console.log('[commission/submit]', { status: 'ok', id: request.id, affiliate: user.id, month: monthYear })
  return NextResponse.json({ id: request.id, status: 'facture_recue' })
}
