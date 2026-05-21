import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, TEMPLATE_IDS } from '@/lib/email'
import { z } from 'zod'

const Schema = z.object({
  commission_amount: z.number().positive(),
  admin_notes:       z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const { commission_amount, admin_notes } = parsed.data
  const svc = createServiceClient()

  // Vérifier que la demande existe et est validable
  const { data: request, error: fetchError } = await svc
    .from('commission_requests')
    .select('id, status, month_year, affiliate_id')
    .eq('id', id)
    .single()

  if (fetchError || !request) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  }
  if (request.status !== 'facture_recue') {
    return NextResponse.json({ error: `Impossible de valider (statut actuel: ${request.status})` }, { status: 409 })
  }

  const now = new Date().toISOString()
  const { error: updateError } = await svc
    .from('commission_requests')
    .update({
      status:            'validee',
      commission_amount,
      admin_notes:       admin_notes ?? null,
      validated_at:      now,
    })
    .eq('id', id)

  if (updateError) {
    console.error('[admin/commissions/validate] Update error:', updateError.message)
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
      templateId: TEMPLATE_IDS.COMMISSION_VALIDEE,
      params: {
        prenom:            profile.first_name ?? '',
        month_year:        request.month_year,
        commission_amount: commission_amount.toFixed(2),
      },
      tags: ['commission', 'validee'],
    }).catch(err => console.error('[admin/commissions/validate] Email error:', err))
  }

  await logAdminAction(adminId, 'validate_commission', 'commission_request', id, { commission_amount })
  console.log('[admin/commissions/validate]', { id, commission_amount, adminId })
  return NextResponse.json({ status: 'validee', commission_amount })
}
