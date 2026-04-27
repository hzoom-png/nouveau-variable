import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { MAX_CITIES, MAX_SECTORS } from '@/lib/constants'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()

  if (body.bio && body.bio.length > 400) {
    return NextResponse.json({ error: 'La bio ne peut pas dépasser 400 caractères' }, { status: 400 })
  }
  if (body.tagline && body.tagline.length > 100) {
    return NextResponse.json({ error: 'Le tagline ne peut pas dépasser 100 caractères' }, { status: 400 })
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
    'display_name', 'tagline', 'role_type', 'services', 'links', 'track_record', 'profile_visible',
  ]
  const update: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) {
      // Skip empty strings for constrained enum fields to avoid CHECK violations
      if ((field === 'commercial_type' || field === 'role_type') && body[field] === '') continue
      update[field] = body[field]
    }
  }

  // Auto-generate slug if the profile doesn't have one yet
  const { data: current } = await supabase
    .from('profiles')
    .select('slug, first_name, last_name')
    .eq('id', user.id)
    .single()

  if (!current?.slug) {
    const fn = (update.first_name as string) ?? current?.first_name ?? ''
    const ln = (update.last_name as string) ?? current?.last_name ?? ''
    if (fn || ln) {
      const { data: generatedSlug } = await supabase.rpc('generate_slug', {
        name: `${fn}-${ln}`.trim().replace(/^-|-$/g, ''),
      })
      if (generatedSlug) update.slug = generatedSlug
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Handle availability slots (separate table)
  if (Array.isArray(body.availability_slots)) {
    await supabase.from('availability_slots').delete().eq('user_id', user.id)
    if (body.availability_slots.length > 0) {
      await supabase.from('availability_slots').insert(
        body.availability_slots.map((s: { day_of_week: number; time_label: string }) => ({
          user_id: user.id,
          day_of_week: s.day_of_week,
          time_label: s.time_label,
        }))
      )
    }
  }

  return NextResponse.json({ profile: data })
}
