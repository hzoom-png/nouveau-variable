import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const ALLOWED_PIPE_FIELDS = [
    'first_name', 'last_name', 'email', 'phone', 'linkedin_url',
    'role', 'has_project', 'notes', 'reminder_at', 'stage', 'company',
  ]
  const safeUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const field of ALLOWED_PIPE_FIELDS) {
    if (field in body) safeUpdate[field] = body[field]
  }

  const { data, error } = await supabase
    .from('affiliation_pipe')
    .update(safeUpdate)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params

  const { error } = await supabase
    .from('affiliation_pipe')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
