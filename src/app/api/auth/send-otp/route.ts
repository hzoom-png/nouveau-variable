import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

const Schema = z.object({ phone: z.string().min(10).max(20) })

export async function POST(req: NextRequest) {
  // Rate limit 1 — par IP : 5 OTP par heure
  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown').slice(0, 50)
  const ipAllowed = await rateLimit(`otp:ip:${ip}`, 5, 3600)
  if (!ipAllowed) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessaie dans 1h.' }, { status: 429 })
  }

  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Numéro invalide' }, { status: 400 })

  const { phone } = parsed.data

  // Rate limit 2 — par numéro : 3 OTP par 10 minutes
  const phoneAllowed = await rateLimit(`otp:phone:${phone}`, 3, 600)
  if (!phoneAllowed) {
    return NextResponse.json({ error: 'Trop de codes envoyés à ce numéro. Attends 10 min.' }, { status: 429 })
  }

  // Rate limit 3 — global : 200 OTP par minute (garde-fou coût Twilio)
  const globalAllowed = await rateLimit('otp:global', 200, 60)
  if (!globalAllowed) {
    return NextResponse.json({ error: 'Service temporairement indisponible.' }, { status: 503 })
  }

  // Access gate — server-side avec service client (bypass RLS)
  const last9 = phone.replace(/\D/g, '').slice(-9)
  const svc = createServiceClient()

  const { data: candidature } = await svc
    .from('candidatures')
    .select('status, is_founder, is_founder_mode')
    .ilike('phone', `%${last9}`)
    .maybeSingle()

  // Founders can also exist in profiles without a candidature row
  const { data: profile } = !candidature
    ? await svc.from('profiles').select('is_founder').ilike('phone', `%${last9}`).maybeSingle()
    : { data: null }

  const isFounder =
    candidature?.is_founder === true ||
    candidature?.is_founder_mode === true ||
    profile?.is_founder === true

  const isAccepted = candidature?.status === 'accepted'

  if (!isFounder && !isAccepted) {
    if (!candidature) {
      return NextResponse.json(
        { error: 'Aucune candidature trouvée. Merci de candidater d\'abord.' },
        { status: 403 }
      )
    }
    if (candidature.status === 'rejected') {
      return NextResponse.json(
        { error: 'Votre candidature n\'a pas pu être approuvée. Contactez support.' },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: 'Candidature en cours de traitement. Vous recevrez un email dès validation.' },
      { status: 403 }
    )
  }

  const masked = phone.slice(0, 6) + '****'

  console.log('[OTP] Send attempt', { phone: masked, isFounder, ts: new Date().toISOString() })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase.auth.signInWithOtp({ phone })

  if (error) {
    // Surface the raw Supabase/Twilio error in Vercel logs for diagnosis.
    // Twilio trial error codes to watch: 21214 = unverified number, 21211 = invalid format.
    console.error('[OTP] Send failed', {
      phone: masked,
      message: error.message,
      status: error.status,
    })

    const isTwilioTrial = error.message.toLowerCase().includes('unverified')
      || error.message.includes('21214')

    return NextResponse.json(
      {
        error: isTwilioTrial
          ? 'Numéro non vérifié sur le compte Twilio trial. Contacte-nous pour activer ton accès.'
          : 'Impossible d\'envoyer le SMS : ' + error.message,
        code: isTwilioTrial ? 'TWILIO_TRIAL_UNVERIFIED' : 'SMS_SEND_FAILED',
      },
      { status: 400 }
    )
  }

  console.log('[OTP] SMS queued', { phone: masked })
  return NextResponse.json({ success: true })
}
