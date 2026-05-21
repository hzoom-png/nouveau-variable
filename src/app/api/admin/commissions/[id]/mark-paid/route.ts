import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, TEMPLATE_IDS } from '@/lib/email'
import { z } from 'zod'

const Schema = z.object({
  payment_reference: z.string().min(1),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Référence de paiement requise' }, { status: 400 })

  const { payment_reference } = parsed.data
  const svc = createServiceClient()

  const { data: request, error: fetchError } = await svc
    .from('commission_requests')
    .select('id, status, month_year, commission_amount, affiliate_id')
    .eq('id', id)
    .single()

  if (fetchError || !request) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  }
  if (request.status !== 'validee') {
    return NextResponse.json({ error: `Impossible de marquer payé (statut actuel: ${request.status})` }, { status: 409 })
  }

  const now = new Date().toISOString()
  const { error: updateError } = await svc
    .from('commission_requests')
    .update({
      status:            'payee',
      payment_date:      now,
      payment_reference,
    })
    .eq('id', id)

  if (updateError) {
    console.error('[admin/commissions/mark-paid] Update error:', updateError.message)
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
      templateId: TEMPLATE_IDS.COMMISSION_PAYEE,
      params: {
        prenom:            profile.first_name ?? '',
        month_year:        request.month_year,
        commission_amount: (request.commission_amount ?? 0).toFixed(2),
        payment_reference,
        payment_date:      new Date(now).toLocaleDateString('fr-FR'),
      },
      tags: ['commission', 'payee'],
    }).catch(err => console.error('[admin/commissions/mark-paid] Email error:', err))
  }

  await logAdminAction(adminId, 'mark_commission_paid', 'commission_request', id, { payment_reference })
  console.log('[admin/commissions/mark-paid]', { id, payment_reference, adminId })
  return NextResponse.json({ status: 'payee', payment_date: now, payment_reference })
}
