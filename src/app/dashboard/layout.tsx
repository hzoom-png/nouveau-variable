import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
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

  if (!profile) {
    const admin = createServiceClient()
    const email = user.email ?? ''

    // Try to pre-fill from an accepted candidature matching this email
    const { data: cand } = await admin
      .from('candidatures')
      .select('full_name, city, role, phone, referral_code')
      .eq('email', email)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nameParts = (cand?.full_name as string | null)?.trim().split(' ') ?? []
    const firstName = nameParts[0] || email.split('@')[0]
    const lastName = nameParts.slice(1).join(' ')
    const generatedCode = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '') || email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')

    await admin.from('profiles').insert({
      id: user.id,
      email,
      first_name: firstName,
      last_name:  lastName,
      role_title: (cand?.role as string | null) ?? '',
      cities:     (cand?.city as string | null) ? [cand!.city] : [],
      sectors:    [],
      phone:      (cand?.phone as string | null) ?? '',
      referred_by:   (cand?.referral_code as string | null) ?? '',
      referral_code: generatedCode,
      points_balance:       97,
      onboarding_completed: false,
    })
    const { data: created } = await admin.from('profiles').select('*').eq('id', user.id).single()
    profile = created
  }

  if (!profile) redirect('/auth/login')

  return (
    <DashboardShell profile={profile} stripeUrl={process.env.STRIPE_PAYMENT_BASE_URL ?? ''}>
      {children}
    </DashboardShell>
  )
}
