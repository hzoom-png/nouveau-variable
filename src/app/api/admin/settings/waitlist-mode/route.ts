import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { setWaitlistMode } from '@/lib/settings'

export async function POST(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled doit être un booléen' }, { status: 400 })
  }

  await setWaitlistMode(body.enabled)

  await logAdminAction(adminId, 'waitlist_mode_toggled', 'settings', undefined, { waitlist_mode: body.enabled })
  console.log('[ADMIN] waitlist_mode toggled', { enabled: body.enabled })

  return NextResponse.json({ success: true, waitlist_mode: body.enabled })
}
