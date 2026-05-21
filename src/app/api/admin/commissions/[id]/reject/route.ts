import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, TEMPLATE_IDS } from '@/lib/email'
import { z } from 'zod'

const Schema = z.object({
  rejection_reason: z.string().min(1),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Raison de rejet requise' }, { status: 400 })

  const { rejection_reason } = parsed.data
  const svc = createServiceClient()

  const { data: request, error: fetchError } = await svc
    .from('commission_requests')
    .select('id, status, month_year, affiliate_id')
    .eq('id', id)
    .single()

  if (fetchError || !request) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  }
  if (!['facture_recue', 'pending'].includes(request.status)) {
    return NextResponse.json({ error: `Impossible de rejeter (statut actuel: ${request.status})` }, { status: 409 })
  }

  const { error: updateError } = await svc
    .from('commission_requests')
    .update({
      status:           'rejetee',
      rejection_reason,
      validated_at:     new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    console.error('[admin/commissions/reject] Update error:', updateError.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  // Email affilié (fire & forget)
  const { data: profile } = await svc
    .from('profiles')
    .select('email, first_name')
    .eq('id', request.affiliate_id)
    .single()

  if (profile) {
    sendEmail({
      to:         { email: profile.email, name: profile.first_name ?? '' },
      templateId: TEMPLATE_IDS.COMMISSION_REJETEE,
      params: {
        prenom:           profile.first_name ?? '',
        month_year:       request.month_year,
        rejection_reason,
      },
      tags: ['commission', 'rejetee'],
    }).catch(err => console.error('[admin/commissions/reject] Email error:', err))
  }

  await logAdminAction(adminId, 'reject_commission', 'commission_request', id, { rejection_reason })
  console.log('[admin/commissions/reject]', { id, adminId })
  return NextResponse.json({ status: 'rejetee' })
}
