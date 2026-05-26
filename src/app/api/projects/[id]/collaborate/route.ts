import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const Schema = z.object({
  message: z.string().min(10).max(300),
  domain: z.string().min(1).max(100),
  availability: z.enum(['immediate', '2-4weeks', 'flexible']),
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

  const { message, domain, availability } = parsed.data

  const service = createServiceClient()

  // Check if project exists and get owner
  const { data: project } = await service
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 })
  }

  // Prevent user from collaborating on their own project
  if (project.user_id === user.id) {
    return NextResponse.json(
      { error: 'Vous ne pouvez pas collaborer sur votre propre projet' },
      { status: 400 }
    )
  }

  // Check if already collaborating
  const { data: existing } = await service
    .from('project_interactions')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .eq('type', 'collaboration')
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'Vous avez déjà proposé une collaboration', code: 'ALREADY_COLLABORATING' },
      { status: 409 }
    )
  }

  // Insert collaboration request
  const { data: collab, error } = await service
    .from('project_interactions')
    .insert({
      project_id: projectId,
      user_id: user.id,
      type: 'collaboration',
      collab_domain: domain,
      collab_message: message,
      collab_availability: availability,
      collab_status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('[POST /api/projects/[id]/collaborate] insert error:', error.code)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  // TODO: Send SMS to project owner via src/lib/sms.ts

  return NextResponse.json({ success: true, collaboration: collab })
}
