import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('affiliation_pipe')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { first_name, last_name, email, phone, linkedin_url, role, has_project, notes, reminder_at } = body

  if (!first_name?.trim()) return NextResponse.json({ error: 'Prénom requis' }, { status: 400 })

  const validStages = ['a_contacter', 'contacte', 'interresse', 'inscrit', 'membre']
  const stage = validStages.includes(body.stage) ? body.stage : 'a_contacter'

  const { data, error } = await supabase
    .from('affiliation_pipe')
    .insert({
      user_id: user.id,
      first_name: first_name.trim(),
      last_name: last_name || null,
      email: email || null,
      phone: phone || null,
      linkedin_url: linkedin_url || null,
      role: role || null,
      has_project: has_project ?? false,
      notes: notes || null,
      reminder_at: reminder_at || null,
      stage,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
