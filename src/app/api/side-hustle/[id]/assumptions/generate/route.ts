import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { generateAssumptions } from '@/lib/side-hustle-api'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const allowed = await rateLimit(`ai:${user.id}`, 10, 60)
  if (!allowed) return NextResponse.json({ error: 'Limite atteinte — 10 générations par minute maximum.' }, { status: 429 })

  const { consumeTokens } = await import('@/lib/tokens')
  const tokenCheck = await consumeTokens(user.id, 'sidehustle')
  if (!tokenCheck.success) {
    return NextResponse.json({ error: tokenCheck.error, code: 'INSUFFICIENT_TOKENS' }, { status: 402 })
  }

  const svc = createServiceClient()

  const { data: project } = await svc
    .from('sidehustle_projects')
    .select('id, name, description, objective, stage, concept, bmc')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })

  let generated
  try {
    generated = await generateAssumptions(project)
  } catch (e) {
    console.error('[assumptions/generate] Claude error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 502 })
  }

  if (!Array.isArray(generated) || generated.length === 0) {
    return NextResponse.json({ error: 'Réponse Claude invalide' }, { status: 502 })
  }

  // Fetch existing to preserve initial_value
  const { data: existing } = await svc
    .from('side_hustle_assumptions')
    .select('category, key, initial_value')
    .eq('project_id', id)

  const existingMap = new Map((existing ?? []).map(r => [`${r.category}:${r.key}`, r.initial_value]))

  const rows = generated.map(a => ({
    project_id:          id,
    category:            a.category,
    key:                 a.key,
    value:               a.value,
    unit:                a.unit ?? null,
    initial_value:       existingMap.get(`${a.category}:${a.key}`) ?? a.value,
    is_key:              a.is_key,
    order_index:         a.order_index,
    generated_by_claude: true,
    updated_at:          new Date().toISOString(),
  }))

  const { error } = await svc
    .from('side_hustle_assumptions')
    .upsert(rows, { onConflict: 'project_id,category,key' })

  if (error) {
    console.error('[assumptions/generate] upsert error:', error.message)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  // Invalidate existing forecasts since assumptions changed
  await svc
    .from('side_hustle_forecasts')
    .update({ is_current: false })
    .eq('project_id', id)

  const { data: saved } = await svc
    .from('side_hustle_assumptions')
    .select('id, category, key, value, unit, initial_value, is_key, order_index, updated_at')
    .eq('project_id', id)
    .order('category')
    .order('order_index')

  return NextResponse.json({ assumptions: saved ?? [], tokensLeft: tokenCheck.tokensLeft })
}
