import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const Schema = z.object({ commissionId: z.string().uuid() })

export async function POST(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const svc = createServiceClient()
  const { error } = await svc.from('commissions')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', parsed.data.commissionId)

  if (error) {
    console.error('[admin/commissions/mark-paid] Erreur:', error.message)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  await logAdminAction(adminId, 'mark_commission_paid', 'commission', parsed.data.commissionId)
  return NextResponse.json({ success: true })
}
