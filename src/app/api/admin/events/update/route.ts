import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const Schema = z.object({
  id:              z.string().uuid(),
  title:           z.string().min(1).max(200).optional(),
  description:     z.string().max(5000).optional(),
  event_date:      z.string().optional(),
  location:        z.string().max(300).optional(),
  location_url:    z.string().max(500).optional(),
  cover_image_url: z.string().max(500).optional(),
  max_attendees:   z.number().int().positive().optional(),
  is_published:    z.boolean().optional(),
})

export async function PATCH(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const { id, ...updates } = parsed.data
  const svc = createServiceClient()
  const { error } = await svc.from('events').update(updates).eq('id', id)
  if (error) {
    console.error('[admin/events/update] Erreur:', error.message)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  await logAdminAction(adminId, 'update_event', 'event', id)
  return NextResponse.json({ success: true })
}
