import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SideHustleClient from './SideHustleClient'

export default async function SideHustlePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: projects } = await supabase
    .from('sidehustle_projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: memberProjects } = await supabase
    .from('projects')
    .select('id, title, description')
    .eq('author_id', user.id)
    .limit(10)

  return (
    <SideHustleClient
      userId={user.id}
      initialProjects={projects ?? []}
      memberProjects={memberProjects ?? []}
    />
  )
}
