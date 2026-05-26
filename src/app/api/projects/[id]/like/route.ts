import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { awardPoints } from '@/lib/points-service'

export async function POST(
  _request: NextRequest,
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

  // Insert like (UNIQUE constraint prevents duplicates)
  const { error } = await service
    .from('project_interactions')
    .insert({
      project_id: projectId,
      user_id: user.id,
      type: 'like',
    })

  if (error?.code === '23505') {
    // Unique constraint violation — already liked
    return NextResponse.json(
      { error: 'Vous avez déjà aimé ce projet', code: 'ALREADY_LIKED' },
      { status: 409 }
    )
  }

  if (error) {
    console.error('[POST /api/projects/[id]/like] insert error:', error.code)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  // Award points (fire & forget)
  awardPoints(user.id, 2, 'like_given', projectId).catch(err =>
    console.error('[like] awardPoints error:', err)
  )

  // Get updated like count
  const { count } = await service
    .from('project_interactions')
    .select('id', { count: 'exact' })
    .eq('project_id', projectId)
    .eq('type', 'like')

  return NextResponse.json({ success: true, likeCount: count ?? 0 })
}
