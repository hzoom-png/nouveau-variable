import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import DashboardShell from './DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Auto-create a minimal profile if it doesn't exist yet
  if (!profile) {
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const email = user.email ?? ''
    const namePart = email.split('@')[0]
    const fallback = {
      id: user.id,
      email,
      first_name: namePart,
      last_name: '',
      role_title: '',
      cities: [],
      sectors: [],
      referral_code: namePart.toLowerCase().replace(/[^a-z0-9]/g, ''),
      points_balance: 97,
      onboarding_completed: false,
    }
    await admin.from('profiles').insert(fallback)
    const { data: created } = await admin.from('profiles').select('*').eq('id', user.id).single()
    profile = created
  }

  if (!profile) redirect('/auth/login')

  return <DashboardShell profile={profile}>{children}</DashboardShell>
}
