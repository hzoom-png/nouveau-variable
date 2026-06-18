import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SUBSCRIPTION_HT, N1_RATE, N2_RATE, N3_RATE } from '@/lib/constants'
import { AffiliationPageClient } from './AffiliationPageClient'

export default async function AffiliationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code, subscription_start, n3_eligible_since, is_founder')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/auth/login')

  const [{ count: n1Count }, { count: n2Count }, { count: n3Count }] = await Promise.all([
    supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('referrer_id', user.id).eq('level', 1).eq('is_active', true),
    supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('referrer_id', user.id).eq('level', 2).eq('is_active', true),
    supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('referrer_id', user.id).eq('level', 3).eq('is_active', true),
  ])

  const n1 = n1Count ?? 0
  const n2 = n2Count ?? 0
  const n3 = n3Count ?? 0

  const isN3Eligible = !!profile.n3_eligible_since || !!profile.is_founder

  return (
    <AffiliationPageClient
      n1={n1} n2={n2} n3={n3}
      isN3Eligible={isN3Eligible}
      n3EligibleSince={profile.n3_eligible_since ?? null}
      subscriptionStart={profile.subscription_start ?? null}
      affiliateLink={profile.referral_code ? `https://nouveauvariable.fr/?ref=${profile.referral_code}` : ''}
      commN1={n1 * SUBSCRIPTION_HT * N1_RATE}
      commN2={n2 * SUBSCRIPTION_HT * N2_RATE}
      commN3={isN3Eligible ? n3 * SUBSCRIPTION_HT * N3_RATE : 0}
    />
  )
}
