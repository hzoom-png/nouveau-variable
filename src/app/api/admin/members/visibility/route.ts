import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const Schema = z.object({
  memberId: z.string().uuid(),
  visible: z.boolean(),
})

export async function POST(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const { memberId, visible } = parsed.data
  const svc = createServiceClient()

  const { error } = await svc.from('profiles')
    .update({ profile_visible: visible })
    .eq('id', memberId)

  if (error) {
    console.error('[admin/members/visibility] Erreur:', error.message)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  await logAdminAction(adminId, 'toggle_visibility', 'member', memberId, { visible })

  return NextResponse.json({ success: true })
}
