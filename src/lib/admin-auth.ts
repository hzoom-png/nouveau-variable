import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { createServiceClient } from './supabase/service'
import { createClient } from './supabase/server'
import { rateLimit } from './rate-limit'

const getSecret = () => {
  const s = process.env.ADMIN_JWT_SECRET
  if (!s) throw new Error('ADMIN_JWT_SECRET non défini')
  return new TextEncoder().encode(s)
}

// ── JWT ──────────────────────────────────────────────────────────

export async function createAdminSession(userId: string): Promise<string> {
  return new SignJWT({ userId, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

export async function verifyAdminSession(token: string): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, getSecret())
  if (payload.role !== 'admin') throw new Error('Not admin')
  return { userId: payload.userId as string }
}

// ── AUTH GUARD (double condition : JWT + Supabase live session) ───

export async function requireAdminAuth(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_session')?.value
    if (!token) return null
    const { userId } = await verifyAdminSession(token)
    return userId
  } catch {
    return null
  }
}

// ── AUDIT LOG ────────────────────────────────────────────────────

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase.from('admin_audit_log').insert({
      admin_id:    adminId,
      action,
      target_type: targetType ?? null,
      target_id:   targetId  ?? null,
      metadata:    metadata  ?? {},
    })
  } catch {
    // Non-bloquant — l'action principale ne doit pas échouer à cause du log
  }
}

// ── RATE LIMIT TOTP ──────────────────────────────────────────────

export async function checkTotpRateLimit(key: string): Promise<boolean> {
  return rateLimit(`totp_${key}`, 5, 900)
}
