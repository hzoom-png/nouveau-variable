import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const svc = createServiceClient()
  const { data, error } = await svc
    .from('club_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ settings: data ?? {} })
}

export async function POST(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body invalide' }, { status: 400 })

  const svc = createServiceClient()

  const { error } = await svc.from('club_settings').upsert({
    id:               1,
    max_members:      body.max_members ?? 1000,
    admin_email:      body.admin_email ?? '',
    welcome_message:  body.welcome_message ?? '',
    applications_open: body.applications_open ?? true,
    updated_at:       new Date().toISOString(),
  }, { onConflict: 'id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction(adminId, 'settings_updated', 'settings', undefined, body)
  return NextResponse.json({ success: true })
}
