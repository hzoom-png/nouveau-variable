import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SUBSCRIPTION_HT, N1_RATE, N3_RATE, getN2Rate } from '@/lib/constants'
import { AffiliationPageClient, type ReferralEntry } from './AffiliationPageClient'

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

  const { data: rawReferrals } = await supabase
    .from('referrals')
    .select('id, level, created_at, profiles!referrals_referee_id_fkey(first_name, last_name, is_active, is_founder)')
    .eq('referrer_id', user.id)
    .in('level', [1, 2, 3])
    .order('level', { ascending: true })
    .order('created_at', { ascending: false })

  const referrals: ReferralEntry[] = (rawReferrals ?? []).flatMap((r: Record<string, unknown>) => {
    const p = r['profiles!referrals_referee_id_fkey'] as Record<string, unknown> | null
    if (!p) return []
    return [{
      id:         String(r.id),
      level:      (r.level as 1 | 2 | 3),
      first_name: String(p.first_name ?? ''),
      last_name:  String(p.last_name ?? ''),
      is_active:  (p.is_active as boolean) || (p.is_founder as boolean),
      created_at: String(r.created_at),
    }]
  })

  const countActive = (level: 1 | 2 | 3) => referrals.filter(r => r.level === level && r.is_active).length
  const countTotal  = (level: 1 | 2 | 3) => referrals.filter(r => r.level === level).length

  const n1Active = countActive(1)
  const n2Active = countActive(2)
  const n3Active = countActive(3)
  const n1Total  = countTotal(1)
  const n2Total  = countTotal(2)
  const n3Total  = countTotal(3)

  const n2RatePercent = getN2Rate(n1Active)
  const isN3Eligible  = !!profile.n3_eligible_since || !!profile.is_founder

  const commN1 = n1Active * SUBSCRIPTION_HT * N1_RATE
  const commN2 = n2Active * SUBSCRIPTION_HT * (n2RatePercent / 100)
  const commN3 = isN3Eligible ? n3Active * SUBSCRIPTION_HT * N3_RATE : 0

  return (
    <AffiliationPageClient
      n1Active={n1Active}   n1Total={n1Total}
      n2Active={n2Active}   n2Total={n2Total}
      n3Active={n3Active}   n3Total={n3Total}
      n2RatePercent={n2RatePercent}
      isN3Eligible={isN3Eligible}
      n3EligibleSince={profile.n3_eligible_since ?? null}
      subscriptionStart={profile.subscription_start ?? null}
      referralCode={profile.referral_code ?? ''}
      affiliateLink={profile.referral_code ? `https://nouveauvariable.fr/?ref=${profile.referral_code}` : ''}
      commN1={commN1}
      commN2={commN2}
      commN3={commN3}
      referrals={referrals}
    />
  )
}
