import { createServerClient } from '@supabase/ssr'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const Schema = z.object({
  email:     z.string().email().max(254).trim().toLowerCase(),
  password:  z.string().min(8).max(128),
  firstName: z.string().min(1).max(50).trim(),
  lastName:  z.string().min(1).max(50).trim(),
  roleTitle: z.string().max(100).trim().optional(),
  cities:    z.array(z.string().max(100)).max(5).optional(),
  sectors:   z.array(z.string().max(100)).max(10).optional(),
  refCode:   z.string().max(50).optional(),
})

export async function POST(request: NextRequest) {
  let rawBody: unknown
  try { rawBody = await request.json() } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = Schema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  const { email, password, firstName, lastName, roleTitle, cities, sectors, refCode } = parsed.data

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: userData, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError) {
    // Normalise les messages Supabase Auth pour éviter de fuiter des détails d'infra
    const msg = createError.message.toLowerCase()
    const userMsg = msg.includes('already') || msg.includes('existe')
      ? 'Un compte existe déjà avec cet email.'
      : 'Impossible de créer le compte. Vérifie tes informations.'
    return NextResponse.json({ error: userMsg }, { status: 400 })
  }

  const user = userData.user
  if (!user) {
    return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 })
  }

  // Referral lookup
  const bypassCodes = process.env.BYPASS_REFERRAL_CODES?.split(',').map(c => c.trim().toUpperCase()) ?? []
  const isGodmode = refCode ? bypassCodes.includes(refCode.toUpperCase()) : false
  let referrerId: string | null = null
  let referrerReferredBy: string | null = null

  if (!isGodmode && refCode) {
    const { data: referrer } = await admin
      .from('profiles')
      .select('id, referred_by')
      .eq('referral_code', refCode.trim().toLowerCase())
      .single()
    if (referrer) {
      referrerId = referrer.id
      referrerReferredBy = referrer.referred_by ?? null
    }
  }

  const referralCode = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '')
  const profilePayload: Record<string, unknown> = {
    id: user.id,
    email,
    first_name: firstName,
    last_name:  lastName,
    role_title: roleTitle ?? '',
    cities:     cities ?? [],
    sectors:    sectors ?? [],
    referral_code:        referralCode,
    points_balance:       97,
    onboarding_completed: true,
  }
  if (referrerId) profilePayload.referred_by = referrerId

  await admin.from('profiles').insert(profilePayload)

  if (referrerId) {
    await admin.from('referrals').insert({ referrer_id: referrerId, referee_id: user.id, level: 1, commission_rate: 40 })
    if (referrerReferredBy) {
      await admin.from('referrals').insert({ referrer_id: referrerReferredBy, referee_id: user.id, level: 2, commission_rate: 5 })
    }
  }

  const response = NextResponse.json({ ok: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (signInError) {
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  return response
}
