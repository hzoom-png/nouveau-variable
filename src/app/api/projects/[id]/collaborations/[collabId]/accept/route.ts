import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { awardPoints } from '@/lib/points-service'
import { sendEmail, TEMPLATE_IDS } from '@/lib/email'

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

  if (collab.collab_status !== 'pending') {
    return NextResponse.json(
      { error: 'Cette collaboration ne peut pas être acceptée' },
      { status: 400 }
    )
  }

  // Update collaboration status
  const { error: updateErr } = await service
    .from('project_interactions')
    .update({
      collab_status: 'active',
      collab_accepted_at: new Date().toISOString(),
    })
    .eq('id', collabId)

  if (updateErr) {
    console.error('[PUT accept] update error:', updateErr.code)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  // Award points: owner +30, proposer +50
  awardPoints(user.id, 30, 'meeting_accepted', projectId).catch(err =>
    console.error('[accept] owner awardPoints error:', err)
  )

  awardPoints(collab.user_id, 50, 'collaboration_accepted', projectId).catch(err =>
    console.error('[accept] proposer awardPoints error:', err)
  )

  // Send email to proposer
  const { data: proposerProfile } = await service
    .from('profiles')
    .select('email, first_name')
    .eq('id', collab.user_id)
    .single()

  if (proposerProfile?.email) {
    sendEmail({
      to: { email: proposerProfile.email, name: proposerProfile.first_name },
      templateId: TEMPLATE_IDS.COLLABORATION_ACCEPTED,
      params: {
        prenom: proposerProfile.first_name,
        project_id: projectId,
      },
    }).catch(err => console.error('[accept] email error:', err))
  }

  return NextResponse.json({ success: true })
}
