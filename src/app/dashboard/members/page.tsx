import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MembersClient from './MembersClient'

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('points_balance').eq('id', user.id).single()

  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .neq('id', user.id)
    .order('created_at', { ascending: false })

  return (
    <MembersClient
      members={members ?? []}
      currentUserId={user.id}
      currentUserPoints={profile?.points_balance ?? 0}
    />
  )
}
