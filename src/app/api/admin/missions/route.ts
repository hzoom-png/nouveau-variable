import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const svc = createServiceClient()
  const { data, error } = await svc
    .from('missions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/missions] GET:', error.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  return NextResponse.json({ missions: data ?? [] })
}

export async function POST(req: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const svc = createServiceClient()

  const { data, error } = await svc
    .from('missions')
    .insert({ ...body, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) {
    console.error('[admin/missions] POST:', error.message)
    return NextResponse.json({ error: 'Erreur création' }, { status: 500 })
  }

  return NextResponse.json({ mission: data }, { status: 201 })
}
