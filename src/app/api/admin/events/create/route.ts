import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const Schema = z.object({
  title:           z.string().min(1).max(200),
  description:     z.string().max(5000).optional(),
  event_date:      z.string(),
  location:        z.string().max(300).optional(),
  location_url:    z.string().max(500).optional(),
  cover_image_url: z.string().max(500).optional(),
  max_attendees:   z.number().int().positive().optional(),
  is_published:    z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const svc = createServiceClient()
  const { data, error } = await svc.from('events')
    .insert({ ...parsed.data, created_by: adminId })
    .select('id').single()

  if (error) {
    console.error('[admin/events/create] Erreur:', error.message)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  await logAdminAction(adminId, 'create_event', 'event', data.id, { title: parsed.data.title })
  return NextResponse.json({ success: true, id: data.id })
}
