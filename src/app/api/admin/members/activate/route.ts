import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const Schema = z.object({
  memberId: z.string().uuid(),
  activate: z.boolean(),
})

export async function POST(request: NextRequest) {
  // Double vérification : JWT admin_session + session Supabase live
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const { memberId, activate } = parsed.data

  const svc = createServiceClient()
  const { error } = await svc.from('profiles').update({
    is_manually_activated: activate,
    is_active:             activate,
  }).eq('id', memberId)

  if (error) {
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  await logAdminAction(adminId, 'manual_activation', 'profile', memberId, { activate })

  return NextResponse.json({ success: true })
}
