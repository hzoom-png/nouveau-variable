import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const Schema = z.object({
  memberId: z.string().uuid(),
  action: z.enum(['toggle_active', 'add_tokens', 'remove_tokens', 'add_points', 'remove_points']),
  amount: z.number().int().positive().optional(),
  reason: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const { memberId, action, amount, reason } = parsed.data
  const svc = createServiceClient()

  const { data: member } = await svc.from('profiles').select('is_active, tokens_balance, points_balance').eq('id', memberId).single()
  if (!member) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })

  if (action === 'toggle_active') {
    const { error } = await svc.from('profiles').update({ is_active: !member.is_active }).eq('id', memberId)
    if (error) {
      console.error('[admin/members/update] toggle error:', error.message)
      return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
    }
    await logAdminAction(adminId, action, 'member', memberId, { new_value: !member.is_active })
  }

  if (action === 'add_tokens' || action === 'remove_tokens') {
    if (!amount) return NextResponse.json({ error: 'Montant requis' }, { status: 400 })
    const delta = action === 'add_tokens' ? amount : -amount
    const newBalance = Math.max(0, (member.tokens_balance ?? 0) + delta)

    await svc.from('tokens_transactions').insert({
      user_id:     memberId,
      tool_name:   'admin_adjustment',
      tokens_used: -delta,
      description: reason ?? `Ajustement admin (${action})`,
    })
    const { error } = await svc.from('profiles').update({ tokens_balance: newBalance }).eq('id', memberId)
    if (error) {
      console.error('[admin/members/update] tokens error:', error.message)
      return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
    }
    await logAdminAction(adminId, action, 'member', memberId, { amount, reason, new_balance: newBalance })
  }

  if (action === 'add_points' || action === 'remove_points') {
    if (!amount) return NextResponse.json({ error: 'Montant requis' }, { status: 400 })
    const delta      = action === 'add_points' ? amount : -amount
    const newBalance = Math.max(0, (member.points_balance ?? 0) + delta)
    const { error }  = await svc.from('profiles').update({ points_balance: newBalance }).eq('id', memberId)
    if (error) {
      console.error('[admin/members/update] points error:', error.message)
      return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
    }
    await logAdminAction(adminId, action, 'member', memberId, { amount, reason, new_balance: newBalance })
  }

  return NextResponse.json({ success: true })
}
