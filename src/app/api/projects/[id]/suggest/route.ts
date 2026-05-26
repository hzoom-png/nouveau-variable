import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { awardPoints } from '@/lib/points-service'
import { z } from 'zod'

const Schema = z.object({
  content: z.string().min(10).max(500),
  type: z.enum(['improvement', 'question', 'issue', 'resource']),
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: projectId } = await context.params

  // Verify user is active
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('id', user.id)
    .single()

  if (!profile?.is_active) {
    return NextResponse.json(
      { error: 'Compte inactif ou supprimé' },
      { status: 403 }
    )
  }

  let rawBody: unknown
  try { rawBody = await request.json() } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = Schema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  const { content, type } = parsed.data

  const service = createServiceClient()

  // Check if project exists
  const { data: project } = await service
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 })
  }

  // Insert suggestion (UNIQUE constraint limits to 1 per project per user)
  const { data: suggestion, error } = await service
    .from('project_interactions')
    .insert({
      project_id: projectId,
      user_id: user.id,
      type: 'suggestion',
      suggestion_content: content,
      suggestion_type: type,
    })
    .select()
    .single()

  if (error?.code === '23505') {
    return NextResponse.json(
      { error: 'Vous avez déjà fait une suggestion sur ce projet', code: 'ALREADY_SUGGESTED' },
      { status: 409 }
    )
  }

  if (error) {
    console.error('[POST /api/projects/[id]/suggest] insert error:', error.code)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  // Award points (fire & forget)
  awardPoints(user.id, 5, 'suggestion_given', projectId).catch(err =>
    console.error('[suggest] awardPoints error:', err)
  )

  return NextResponse.json({ success: true, suggestion })
}
