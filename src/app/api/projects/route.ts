import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const Schema = z.object({
  id:           z.string().uuid().optional(),
  title:        z.string().min(1).max(150).trim(),
  tagline:      z.string().max(300).trim().optional().nullable(),
  sector:       z.string().min(1).max(100),
  stage:        z.string().min(1).max(50),
  needs:        z.array(z.string().max(100)).max(20).optional(),
  funding_type: z.string().max(50).optional().nullable(),
  cover_color:  z.string().regex(/^#[0-9a-fA-F]{6}$/).or(z.string().max(50)),
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

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let rawBody: unknown
  try { rawBody = await request.json() } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = Schema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  const { collaborators, id, ...fields } = parsed.data

  const service = createServiceClient()
  const projectId = id ?? crypto.randomUUID()

  const { data: project, error } = await service
    .from('projects')
    .insert({ id: projectId, user_id: user.id, ...fields, is_active: true })
    .select()
    .single()

  if (error) {
    console.error('[POST /api/projects] insert error:', error.code)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  if (collaborators && collaborators.length > 0) {
    const { error: collabError } = await service
      .from('project_collaborators')
      .insert(collaborators.map(c => ({ project_id: projectId, user_id: c.user_id, role: c.role ?? null })))
    if (collabError) console.error('[POST /api/projects] collaborators error:', collabError.code)
  }

  return NextResponse.json({ project })
}
