import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'
import { randomBytes } from 'crypto'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Seuls les emails admin autorisés peuvent configurer le TOTP
  const authorizedAdmins = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) ?? []
  if (!authorizedAdmins.includes((user.email ?? '').toLowerCase())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const svc = createServiceClient()

  const { data: existing } = await svc
    .from('admin_totp').select('verified').eq('user_id', user.id).single()

  if (existing?.verified) {
    return NextResponse.json({ error: 'TOTP déjà configuré' }, { status: 409 })
  }

  const totp = new OTPAuth.TOTP({
    issuer:    'NouveauVariable',
    label:     'Admin',
    algorithm: 'SHA1',
    digits:    6,
    period:    30,
    secret:    OTPAuth.Secret.fromHex(randomBytes(20).toString('hex')),
  })

  await svc.from('admin_totp').upsert(
    { user_id: user.id, secret: totp.secret.base32, verified: false },
    { onConflict: 'user_id' }
  )

  const qr = await QRCode.toDataURL(totp.toString())
  return NextResponse.json({ qr, secret: totp.secret.base32 })
}
