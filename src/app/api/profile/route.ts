import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { MAX_CITIES, MAX_SECTORS } from '@/lib/constants'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()

  // Validate
  if (body.bio && body.bio.length > 160) {
    return NextResponse.json({ error: 'La bio ne peut pas dépasser 160 caractères' }, { status: 400 })
  }
  if (body.cities && body.cities.length > MAX_CITIES) {
    return NextResponse.json({ error: `Maximum ${MAX_CITIES} villes` }, { status: 400 })
  }
  if (body.sectors && body.sectors.length > MAX_SECTORS) {
    return NextResponse.json({ error: `Maximum ${MAX_SECTORS} secteurs` }, { status: 400 })
  }

  const allowedFields = [
    'first_name', 'last_name', 'phone', 'bio', 'role_title',
    'cities', 'sectors', 'commercial_type', 'meeting_types',
    'available_days', 'max_meetings_per_week',
    'notif_meeting_request', 'notif_new_referral', 'notif_commission', 'notif_newsletter',
  ]
  const update: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) update[field] = body[field]
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}
