import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberProfile } from '@/lib/types'
import MembersClient from './MembersClient'

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('points_balance').eq('id', user.id).single()

  const { data: members } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role_title, rank, cities, sectors, meeting_types, missions_count, rating, avatar_url, tagline, bio, slug, profile_visible')
    .eq('is_active', true)
    .neq('id', user.id)
    .order('created_at', { ascending: false })

  return (
    <MembersClient
      members={(members ?? []) as MemberProfile[]}
      currentUserId={user.id}
      currentUserPoints={profile?.points_balance ?? 0}
    />
  )
}
