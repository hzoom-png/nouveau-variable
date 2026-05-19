import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status   = searchParams.get('status')
  const priority = searchParams.get('priority')
  const type     = searchParams.get('type')
  const search   = searchParams.get('search')
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit    = 20

  const svc = createServiceClient()
  let q = svc
    .from('support_tickets')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status)   q = q.eq('status', status)
  if (priority) q = q.eq('priority', priority)
  if (type)     q = q.eq('ticket_type', type)
  if (search)   q = q.or(`user_email.ilike.%${search}%,user_name.ilike.%${search}%,subject.ilike.%${search}%`)

  const { data, count, error } = await q
  if (error) {
    console.error('[admin/support/tickets] GET error:', error.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  return NextResponse.json({
    tickets: data ?? [],
    count: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}
