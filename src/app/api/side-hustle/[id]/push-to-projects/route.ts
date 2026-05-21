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

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

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

  const { data: project, error } = await svc
    .from('projects')
    .insert({
      user_id:     user.id,
      title:       sh.name,
      tagline:     sh.description ? String(sh.description).slice(0, 300) : null,
      sector:      'Autre',
      stage:       STAGE_MAP[sh.stage] ?? 'idee',
      needs:       [],
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
