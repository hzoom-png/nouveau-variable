import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'
import { AvailabilitySlot } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: slots }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('availability_slots').select('*').eq('user_id', user.id),
  ])

  if (!profile) redirect('/auth/login')

  return <ProfileClient profile={profile} slots={(slots ?? []) as AvailabilitySlot[]} />
}
