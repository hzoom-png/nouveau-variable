import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const svc = createServiceClient()

  const { data, error } = await svc
    .from('missions')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[admin/missions] PATCH:', error.message)
    return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 })
  }

  return NextResponse.json({ mission: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const svc = createServiceClient()

  const { error } = await svc.from('missions').delete().eq('id', id)

  if (error) {
    console.error('[admin/missions] DELETE:', error.message)
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
