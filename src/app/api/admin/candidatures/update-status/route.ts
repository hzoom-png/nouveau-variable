import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'
import { sendEmail, TEMPLATE_IDS } from '@/lib/email'

const Schema = z.object({
  id:         z.string().uuid(),
  status:     z.enum(['received', 'reviewed', 'accepted', 'rejected']),
  admin_note: z.string().max(2000).optional(),
})

export async function POST(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const { id, status, admin_note } = parsed.data
  const svc = createServiceClient()

  const update: Record<string, unknown> = { status }
  if (admin_note !== undefined) update.admin_note = admin_note

  const { error } = await svc.from('candidatures').update(update).eq('id', id)
  if (error) {
    console.error('[admin/candidatures/update-status] Erreur:', error.message)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  if (status === 'rejected') {
    const { data: cand } = await svc
      .from('candidatures')
      .select('email, full_name')
      .eq('id', id)
      .single()

    if (cand) {
      const prenom = (cand.full_name as string).trim().split(' ')[0] ?? ''
      await sendEmail({
        to: { email: cand.email as string, name: cand.full_name as string },
        templateId: TEMPLATE_IDS.CANDIDATURE_REFUSEE,
        params: { prenom },
        tags: ['candidature', 'refus'],
      })
    }
  }

  await logAdminAction(adminId, 'update_candidature_status', 'candidature', id, { status, admin_note })

  return NextResponse.json({ success: true })
}
