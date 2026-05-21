import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const Schema = z.object({ phone: z.string().min(10).max(20) })

export async function POST(req: NextRequest) {
  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Numéro invalide' }, { status: 400 })

  const { phone } = parsed.data
  const masked = phone.slice(0, 6) + '****'

  console.log('[OTP] Send attempt', { phone: masked, ts: new Date().toISOString() })

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
