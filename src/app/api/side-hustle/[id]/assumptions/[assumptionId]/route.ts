import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const Schema = z.object({
  value: z.string().min(1).max(500).trim(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; assumptionId: string }> },
) {
  const { id, assumptionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const parsed = Schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const svc = createServiceClient()

  // Verify assumption belongs to this project
  const { data: assumption } = await svc
    .from('side_hustle_assumptions')
    .select('id, project_id')
    .eq('id', assumptionId)
    .eq('project_id', id)
    .single()

  if (!assumption) return NextResponse.json({ error: 'Hypothèse introuvable' }, { status: 404 })

  // Verify project belongs to user
  const { data: project } = await svc
    .from('sidehustle_projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { data: updated, error } = await svc
    .from('side_hustle_assumptions')
    .update({ value: parsed.data.value, updated_at: new Date().toISOString() })
    .eq('id', assumptionId)
    .select('id, category, key, value, unit, initial_value, is_key, order_index, updated_at')
    .single()

  if (error) {
    console.error('[assumptions/[assumptionId]] PATCH error:', error.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  // Invalidate forecasts so next GET shows them as stale
  await svc
    .from('side_hustle_forecasts')
    .update({ is_current: false })
    .eq('project_id', id)

  return NextResponse.json({ assumption: updated })
}
