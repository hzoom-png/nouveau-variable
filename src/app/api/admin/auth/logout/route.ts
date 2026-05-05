import { NextResponse } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'

export async function POST() {
  const adminId = await requireAdminAuth()
  if (adminId) await logAdminAction(adminId, 'admin_logout')

  const res = NextResponse.json({ success: true })
  res.cookies.set('admin_session', '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   0,
    path:     '/',
  })
  return res
}
