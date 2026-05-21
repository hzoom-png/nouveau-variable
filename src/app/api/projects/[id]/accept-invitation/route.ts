import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: projectId } = await params
  if (!/^[0-9a-f-]{36}$/.test(projectId)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }

  const service = createServiceClient()

  // Vérifie qu'une invitation pending existe pour cet utilisateur
  const { data: invite, error: fetchErr } = await service
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('member_id', user.id)
    .eq('status', 'pending')
    .single()

  if (fetchErr || !invite) {
    return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 })
  }

  // Passe le statut à accepted
  const { error: updateErr } = await service
    .from('project_members')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('id', invite.id)

  if (updateErr) {
    console.error('[accept-invitation] update error:', updateErr.code)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  // Ajoute dans project_collaborators pour l'affichage public
  await service
    .from('project_collaborators')
    .upsert({ project_id: projectId, user_id: user.id, role: 'participant' })

  console.log('[PROJECT_INVITATION_ACCEPTED]', { project_id: projectId, member_id: user.id })
  return NextResponse.json({ status: 'accepted' })
}
