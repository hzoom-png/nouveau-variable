import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // 'active' | 'inactive' | null = all

  const svc = createServiceClient()
  let q = svc
    .from('projects')
    .select('id, title, tagline, sector, stage, is_active, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status === 'active') q = q.eq('is_active', true)
  if (status === 'inactive') q = q.eq('is_active', false)

  const { data: projects, error } = await q
  if (error) {
    console.error('[admin/projects] GET error:', error.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  const userIds = [...new Set((projects ?? []).map(p => p.user_id).filter(Boolean))]
  const { data: profiles } = userIds.length
    ? await svc.from('profiles').select('id, first_name, last_name').in('id', userIds)
    : { data: [] }

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const result = (projects ?? []).map(p => ({
    ...p,
    profiles: profileMap[p.user_id] ?? null,
  }))

  return NextResponse.json({ projects: result })
}

export async function POST(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.projectId || !body?.action) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const svc = createServiceClient()
  const { projectId, action } = body

  if (action === 'delete') {
    const { error } = await svc.from('projects').delete().eq('id', projectId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logAdminAction(adminId, 'project_deleted', 'project', projectId)
    return NextResponse.json({ success: true })
  }

  if (action === 'toggle') {
    const { data: proj, error: fetchErr } = await svc.from('projects').select('is_active').eq('id', projectId).single()
    if (fetchErr || !proj) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
    const { error } = await svc.from('projects').update({ is_active: !proj.is_active }).eq('id', projectId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logAdminAction(adminId, proj.is_active ? 'project_unpublished' : 'project_published', 'project', projectId)
    return NextResponse.json({ success: true, is_active: !proj.is_active })
  }

  if (action === 'create') {
    const { userId, title, tagline, sector, stage, what } = body
    if (!userId || !title?.trim() || !sector?.trim() || !stage?.trim()) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }
    const { data: profile } = await svc.from('profiles').select('id').eq('id', userId).maybeSingle()
    if (!profile) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })
    const { data: project, error: createErr } = await svc.from('projects').insert({
      user_id:      userId,
      title:        title.trim(),
      tagline:      tagline?.trim() || null,
      sector:       sector.trim(),
      stage:        stage.trim(),
      what:         what?.trim() || null,
      cover_color:  '#2F5446',
      is_active:    true,
    }).select().single()
    if (createErr) {
      console.error('[admin/projects] create error:', createErr.message)
      return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
    }
    await logAdminAction(adminId, 'project_created', 'project', project.id, { title, userId })
    return NextResponse.json({ success: true, project })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
