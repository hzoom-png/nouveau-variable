import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const UpdateSchema = z.object({
  title:        z.string().min(1).max(150).trim().optional(),
  tagline:      z.string().max(300).trim().optional().nullable(),
  sector:       z.string().max(100).optional(),
  stage:        z.string().max(50).optional(),
  needs:        z.array(z.string().max(100)).max(20).optional(),
  funding_type: z.string().max(50).optional().nullable(),
  cover_color:  z.string().max(50).optional(),
  logo_url:     z.string().url().max(500).optional().nullable(),
  website_url:  z.string().url().max(500).optional().nullable(),
  social_links: z.record(z.string(), z.string().max(500)).optional().nullable(),
  what:         z.string().max(2000).trim().optional().nullable(),
  how:          z.string().max(2000).trim().optional().nullable(),
  why:          z.string().max(2000).trim().optional().nullable(),
  tags:         z.array(z.string().max(50)).max(20).optional(),
  collaborators: z.array(z.object({
    user_id: z.string().uuid(),
    role:    z.string().max(100).optional(),
  })).max(20).optional(),
})

async function getOwned(userId: string, projectId: string) {
  const service = createServiceClient()
  const { data } = await service
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .single()
  if (!data) return null
  if (data.user_id !== userId) return null
  return data
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  // Validate id is UUID format
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }

  const owned = await getOwned(user.id, id)
  if (!owned) return NextResponse.json({ error: 'Projet introuvable ou accès refusé' }, { status: 403 })

  let rawBody: unknown
  try { rawBody = await request.json() } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = UpdateSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  const { collaborators, ...fields } = parsed.data
  const service = createServiceClient()

  const { error } = await service.from('projects').update(fields).eq('id', id)
  if (error) {
    console.error('[PATCH /api/projects/:id] error:', error.code)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  if (collaborators !== undefined) {
    await service.from('project_collaborators').delete().eq('project_id', id)
    if (collaborators.length > 0) {
      await service.from('project_collaborators').insert(
        collaborators.map(c => ({ project_id: id, user_id: c.user_id, role: c.role ?? null }))
      )
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }

  const owned = await getOwned(user.id, id)
  if (!owned) return NextResponse.json({ error: 'Projet introuvable ou accès refusé' }, { status: 403 })

  const service = createServiceClient()
  const { error } = await service.from('projects').delete().eq('id', id)
  if (error) {
    console.error('[DELETE /api/projects/:id] error:', error.code)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
