import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createAdminSession, checkTotpRateLimit, logAdminAction } from '@/lib/admin-auth'
import * as OTPAuth from 'otpauth'
import { z } from 'zod'

const Schema = z.object({ token: z.string().length(6).regex(/^\d{6}$/) })

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
    if (!checkTotpRateLimit(ip)) {
      return NextResponse.json({ error: 'Trop de tentatives. Attends 15 minutes.' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
    }

    const parsed = Schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Code invalide' }, { status: 400 })

    const svc = createServiceClient()
    const { data: rec } = await svc
      .from('admin_totp').select('secret').eq('user_id', user.id).single()

    if (!rec) {
      return NextResponse.json({ error: 'TOTP non configuré', setup_required: true }, { status: 404 })
    }

    const totp = new OTPAuth.TOTP({
      issuer:    'NouveauVariable',
      label:     'Admin',
      algorithm: 'SHA1',
      digits:    6,
      period:    30,
      secret:    OTPAuth.Secret.fromBase32(rec.secret),
    })

    const delta = totp.validate({ token: parsed.data.token, window: 1 })
    if (delta === null) {
      return NextResponse.json({ error: 'Code incorrect' }, { status: 401 })
    }

    await svc.from('admin_totp').update({ verified: true }).eq('user_id', user.id)

    const token = await createAdminSession(user.id)
    await logAdminAction(user.id, 'admin_login')

    const res = NextResponse.json({ success: true })
    res.cookies.set('admin_session', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   60 * 60 * 8,
      path:     '/',
    })
    return res
  } catch (err) {
    console.error('[Admin Auth] Erreur verify-totp:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
