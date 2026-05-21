import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'crypto'
import { rateLimit } from '@/lib/rate-limit'
import { generateForecast } from '@/lib/side-hustle-api'

const Schema = z.object({
  duration_months: z.number().refine(v => [12, 24, 36, 48, 60].includes(v), 'Durée invalide (12, 24, 36, 48 ou 60)'),
  granularity:     z.enum(['monthly', 'quarterly', 'annual']),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const allowed = await rateLimit(`ai:${user.id}`, 10, 60)
  if (!allowed) return NextResponse.json({ error: 'Limite atteinte — 10 générations par minute maximum.' }, { status: 429 })

  const parsed = Schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide', details: parsed.error.issues }, { status: 400 })

  const { duration_months, granularity } = parsed.data

  const { consumeTokens } = await import('@/lib/tokens')
  const tokenCheck = await consumeTokens(user.id, 'sidehustle')
  if (!tokenCheck.success) {
    return NextResponse.json({ error: tokenCheck.error, code: 'INSUFFICIENT_TOKENS' }, { status: 402 })
  }

  const svc = createServiceClient()

  const { data: project } = await svc
    .from('sidehustle_projects')
    .select('id, name, description, stage')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })

  const { data: assumptions } = await svc
    .from('side_hustle_assumptions')
    .select('category, key, value, unit')
    .eq('project_id', id)
    .order('category')
    .order('order_index')

  if (!assumptions || assumptions.length === 0) {
    return NextResponse.json({ error: 'Génère d\'abord les hypothèses avant le prévisionnel.' }, { status: 400 })
  }

  const assumptionsHash = createHash('md5')
    .update(JSON.stringify(assumptions.map(a => ({ k: `${a.category}:${a.key}`, v: a.value }))))
    .digest('hex')

  let result
  try {
    result = await generateForecast({ project, assumptions, duration_months, granularity })
  } catch (e) {
    console.error('[forecasts/generate] Claude error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 502 })
  }

  if (!result?.forecast_data || !Array.isArray(result.forecast_data)) {
    return NextResponse.json({ error: 'Réponse Claude invalide' }, { status: 502 })
  }

  const { data: forecast, error } = await svc
    .from('side_hustle_forecasts')
    .upsert({
      project_id:       id,
      duration_months,
      granularity,
      forecast_data:    result.forecast_data,
      forecast_summary: result.forecast_summary,
      assumptions_hash: assumptionsHash,
      is_current:       true,
      generated_at:     new Date().toISOString(),
    }, { onConflict: 'project_id,duration_months,granularity' })
    .select('id, duration_months, granularity, forecast_data, forecast_summary, assumptions_hash, is_current, generated_at')
    .single()

  if (error) {
    console.error('[forecasts/generate] upsert error:', error.message)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  return NextResponse.json({ forecast, tokensLeft: tokenCheck.tokensLeft })
}
