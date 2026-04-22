import { createServerClient } from '@supabase/ssr'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password, firstName, lastName, roleTitle, cities, sectors, refCode } = body

  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  // Admin client — bypasses email confirmation so the user can log in immediately
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Create user with email already confirmed
  const { data: userData, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  const user = userData.user
  if (!user) {
    return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 })
  }

  // Referral lookup
  const isGodmode = (refCode ?? '').toUpperCase() === 'GODMODE'
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

  // Create profile
  const referralCode = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '')
  const profilePayload: Record<string, unknown> = {
    id: user.id,
    email,
    first_name: firstName,
    last_name: lastName,
    role_title: roleTitle ?? '',
    cities: cities ?? [],
    sectors: sectors ?? [],
    referral_code: referralCode,
    points_balance: 97,
    onboarding_completed: true,
  }
  if (referrerId) profilePayload.referred_by = referrerId

  await admin.from('profiles').insert(profilePayload)

  // Referral records
  if (referrerId) {
    await admin.from('referrals').insert({ referrer_id: referrerId, referee_id: user.id, level: 1, commission_rate: 40 })
    if (referrerReferredBy) {
      await admin.from('referrals').insert({ referrer_id: referrerReferredBy, referee_id: user.id, level: 2, commission_rate: 5 })
    }
  }

  // Sign in and write session cookies to the response
  const response = NextResponse.json({ ok: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
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
    return NextResponse.json({ error: signInError.message }, { status: 500 })
  }

  return response
}
