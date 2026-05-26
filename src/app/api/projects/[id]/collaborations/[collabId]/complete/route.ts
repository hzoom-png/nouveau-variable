import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { awardPoints } from '@/lib/points-service'

export async function PUT(
  _request: NextRequest,
  context: { params: Promise<{ id: string; collabId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: projectId, collabId } = await context.params

  const service = createServiceClient()

  // Verify caller is project owner
  const { data: project } = await service
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_id !== user.id) {
    return NextResponse.json(
      { error: 'Non autorisé — vous devez être propriétaire du projet' },
      { status: 403 }
    )
  }

  // Get collaboration details
  const { data: collab } = await service
    .from('project_interactions')
    .select('id, user_id, collab_status')
    .eq('id', collabId)
    .eq('project_id', projectId)
    .eq('type', 'collaboration')
    .single()

  if (!collab) {
    return NextResponse.json({ error: 'Collaboration non trouvée' }, { status: 404 })
  }

  if (collab.collab_status !== 'active') {
    return NextResponse.json(
      { error: 'Cette collaboration ne peut pas être complétée' },
      { status: 400 }
    )
  }

  // Update collaboration status
  const { error: updateErr } = await service
    .from('project_interactions')
    .update({
      collab_status: 'completed',
      collab_completed_at: new Date().toISOString(),
    })
    .eq('id', collabId)

  if (updateErr) {
    console.error('[PUT complete] update error:', updateErr.code)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  // Award bonus points to collaborator
  awardPoints(collab.user_id, 50, 'collaboration_completed', projectId).catch(err =>
    console.error('[complete] awardPoints error:', err)
  )

  return NextResponse.json({ success: true })
}
