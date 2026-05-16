import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const Schema = z.object({
  candidatureId: z.string().uuid(),
  is_founder:    z.boolean(),
})

export async function POST(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const { candidatureId, is_founder } = parsed.data
  const svc = createServiceClient()

  const { error } = await svc.from('candidatures').update({
    is_founder,
    founder_activated_at: is_founder ? new Date().toISOString() : null,
  }).eq('id', candidatureId)

  if (error) {
    console.error('[toggle-founder]', error.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  await logAdminAction(
    adminId,
    is_founder ? 'enable_founder_mode' : 'disable_founder_mode',
    'candidature',
    candidatureId,
    { is_founder }
  )

  return NextResponse.json({
    id:         candidatureId,
    is_founder,
    message:    is_founder ? 'Mode founder activé' : 'Mode founder révoqué',
  })
}
