import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (!profile) redirect('/auth/login')

  // Fallback: check is_founder_mode in candidatures if profiles.is_founder is false
  let isFounder = profile.is_founder
  if (!isFounder) {
    const { data: cand } = await supabase
      .from('candidatures')
      .select('is_founder_mode')
      .eq('user_id', user.id)
      .maybeSingle()
    if (cand?.is_founder_mode === true) isFounder = true
  }

  return <ProfileClient profile={{ ...profile, is_founder: isFounder }} />
}
