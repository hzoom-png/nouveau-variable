import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

const STAGE_MAP: Record<string, string> = {
  idea:       'idee',
  validation: 'idee',
  build:      'construction',
  launch:     'lancement',
  growth:     'croissance',
}

const VALID_SECTORS = [
  'SaaS B2B', 'Marketplace', 'Fintech', 'Healthtech', 'Edtech',
  'Retail / E-commerce', 'RH / Recrutement', 'PropTech', 'LegalTech',
  'Marketing / Growth', 'Data / IA', 'Cybersécurité', 'Logistique', 'Industrie',
  'Consulting / Services', 'Media / Contenu', 'Dev web / Agence', 'Autre',
]

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: { sector?: string; help_needed?: { type: string; description?: string }[] } = {}
  try { body = await req.json() } catch { /* use defaults */ }

  const sector = typeof body.sector === 'string' && VALID_SECTORS.includes(body.sector)
    ? body.sector
    : 'Autre'

  const helpNeeded = Array.isArray(body.help_needed) ? body.help_needed : []

  const svc = createServiceClient()

  const { data: sh } = await svc
    .from('sidehustle_projects')
    .select('id, name, description, objective, concept, stage, project_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!sh) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })

  if (sh.project_id) {
    return NextResponse.json({ project_id: sh.project_id, action: 'already_linked' })
  }

  // Map help_needed tags → project needs
  const HELP_TO_NEED: Record<string, string> = {
    client_pilote: 'client',
    apporteur:     'partenaire',
    partenaire:    'partenaire',
    revendeur:     'partenaire',
    associe:       'associe',
    investisseur:  'investisseur',
    mentor:        'conseil',
    autre:         'partenaire',
  }
  const needs = [...new Set(helpNeeded.map(t => HELP_TO_NEED[t.type]).filter(Boolean))]

  const { data: project, error } = await svc
    .from('projects')
    .insert({
      user_id:     user.id,
      title:       sh.name,
      tagline:     sh.description ? String(sh.description).slice(0, 300) : null,
      sector,
      stage:       STAGE_MAP[sh.stage] ?? 'idee',
      needs:       needs.length > 0 ? needs : [],
      cover_color: '#2F5446',
      is_active:   true,
      what:        sh.concept ?? null,
      why:         sh.objective ?? null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[push-to-projects] insert error:', error.message)
    return NextResponse.json({ error: 'Erreur lors de la création du projet' }, { status: 500 })
  }

  await svc
    .from('sidehustle_projects')
    .update({ project_id: project.id })
    .eq('id', id)

  return NextResponse.json({ project_id: project.id, action: 'created' })
}
