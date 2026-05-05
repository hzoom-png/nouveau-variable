import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const svc = createServiceClient()
  const { data, error } = await svc
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })

  if (error) {
    console.error('[admin/events/list] Erreur:', error.message)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
  return NextResponse.json({ events: data ?? [] })
}
