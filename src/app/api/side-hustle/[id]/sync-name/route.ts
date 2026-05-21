import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const svc = createServiceClient()

  const { data: sh } = await svc
    .from('sidehustle_projects')
    .select('id, name, project_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!sh) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
  if (!sh.project_id) return NextResponse.json({ error: 'Aucun projet lié' }, { status: 400 })

  const { error } = await svc
    .from('projects')
    .update({ title: sh.name })
    .eq('id', sh.project_id)

  if (error) {
    console.error('[sync-name] update error:', error.message)
    return NextResponse.json({ error: 'Erreur lors de la synchro' }, { status: 500 })
  }

  return NextResponse.json({ synced: true, new_title: sh.name })
}
