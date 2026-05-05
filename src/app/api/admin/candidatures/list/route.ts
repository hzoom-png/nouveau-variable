import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // null = all

  const svc = createServiceClient()
  let q = svc.from('candidatures').select('*').order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) {
    console.error('[admin/candidatures/list] Erreur:', error.message)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ candidatures: data ?? [] })
}
