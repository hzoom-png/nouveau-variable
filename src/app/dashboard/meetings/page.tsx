import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MeetingsClient from './MeetingsClient'

export default async function MeetingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Pending received
  const { data: pending } = await supabase
    .from('meeting_requests')
    .select('*, requester:profiles!meeting_requests_requester_id_fkey(*)')
    .eq('recipient_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Confirmed/completed
  const { data: confirmed } = await supabase
    .from('meeting_requests')
    .select('*, requester:profiles!meeting_requests_requester_id_fkey(*), recipient:profiles!meeting_requests_recipient_id_fkey(*)')
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .in('status', ['confirmed', 'completed'])
    .order('created_at', { ascending: false })

  return (
    <MeetingsClient
      pendingRequests={pending ?? []}
      confirmedMeetings={confirmed ?? []}
      currentUserId={user.id}
    />
  )
}
