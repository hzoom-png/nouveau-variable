import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const PatchSchema = z.object({
  name:        z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).trim().optional(),
  objective:   z.string().max(1000).trim().optional(),
  stage:       z.enum(['idea', 'validation', 'build', 'launch', 'growth']).optional(),
  concept:     z.string().max(5000).trim().optional(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const svc = createServiceClient()

  const { data: project } = await svc
    .from('sidehustle_projects')
    .select('id, name, description, objective, stage, concept, target_date, roadmap, bmc, forecast, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })

  const [{ data: assumptions }, { data: forecasts }] = await Promise.all([
    svc.from('side_hustle_assumptions')
      .select('id, category, key, value, unit, initial_value, is_key, order_index, updated_at')
      .eq('project_id', id)
      .order('category')
      .order('order_index'),
    svc.from('side_hustle_forecasts')
      .select('id, duration_months, granularity, forecast_data, forecast_summary, assumptions_hash, is_current, generated_at')
      .eq('project_id', id)
      .eq('is_current', true)
      .order('duration_months'),
  ])

  return NextResponse.json({ project, assumptions: assumptions ?? [], forecasts: forecasts ?? [] })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const parsed = PatchSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide', details: parsed.error.issues }, { status: 400 })

  if (Object.keys(parsed.data).length === 0) return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })

  const svc = createServiceClient()

  const { data: existing } = await svc
    .from('sidehustle_projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })

  const { data: updated, error } = await svc
    .from('sidehustle_projects')
    .update(parsed.data)
    .eq('id', id)
    .select('id, name, description, objective, stage, concept, target_date, updated_at')
    .single()

  if (error) {
    console.error('[side-hustle/[id]] PATCH error:', error.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  return NextResponse.json({ project: updated })
}
