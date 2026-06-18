import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SUBSCRIPTION_HT, N1_RATE, N2_RATE, N3_RATE } from '@/lib/constants'
import { CopyButton } from '@/components/ui/CopyButton'
import { AffiliationSimulator } from '@/components/affiliation/AffiliationSimulator'
import { AffiliationPipe } from '@/components/affiliation/AffiliationPipe'

export default async function AffiliationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code, subscription_start, n3_eligible_since')
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

  const isN3Eligible = !!profile.n3_eligible_since

  const commN1 = n1 * SUBSCRIPTION_HT * N1_RATE
  const commN2 = n2 * SUBSCRIPTION_HT * N2_RATE
  const commN3 = isN3Eligible ? n3 * SUBSCRIPTION_HT * N3_RATE : 0

  const affiliateLink = profile.referral_code
    ? `https://nouveauvariable.fr/?ref=${profile.referral_code}`
    : ''

  const kpis = [
    { label: 'Filleuls N1 actifs',    value: String(n1), color: '#43695A' },
    { label: 'Filleuls N2 actifs',    value: String(n2), color: '#4B7BF5' },
    { label: 'Filleuls N3 actifs',    value: isN3Eligible ? String(n3) : '–', color: '#C8790A' },
    { label: 'Commission N1 / mois',  value: `${commN1.toFixed(0)} €`, color: '#43695A' },
    { label: 'Commission N2 / mois',  value: `${commN2.toFixed(2)} €`, color: '#4B7BF5' },
    { label: 'Commission N3 / mois',  value: isN3Eligible ? `${commN3.toFixed(2)} €` : 'Débloqué à 6 mois', color: '#C8790A' },
  ]

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: 'var(--white)', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, marginBottom: '8px' }}>{k.label}</div>
            <div style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: '24px', color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* N3 eligibility banner */}
      {!isN3Eligible && (
        <div style={{ background: '#FEF3E2', border: '1.5px solid #F0C07A', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🔒</span>
          <div>
            <div style={{ fontWeight: 600, color: '#C8790A', fontSize: '14px' }}>Niveau 3 non encore débloqué</div>
            <div style={{ fontSize: '13px', color: '#8B6914' }}>
              Le N3 se débloque après 6 mois d&apos;abonnement consécutif. Plus tu restes, plus tu gagnes.{' '}
              <a href="/dashboard/network/n3" style={{ color: '#C8790A', fontWeight: 600 }}>Voir les détails →</a>
            </div>
          </div>
        </div>
      )}

      {isN3Eligible && (
        <div style={{ background: '#e8f5ef', border: '1.5px solid #56b791', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🏆</span>
          <div>
            <div style={{ fontWeight: 600, color: '#024f41', fontSize: '14px' }}>Niveau 3 débloqué !</div>
            <div style={{ fontSize: '13px', color: '#1a7b5e' }}>
              Tu touches 5% du HT sur chaque filleul N3 actif.{' '}
              <a href="/dashboard/network/n3" style={{ color: '#024f41', fontWeight: 600 }}>Voir mon réseau N3 →</a>
            </div>
          </div>
        </div>
      )}

      <AffiliationPipe />

      <AffiliationSimulator
        n1Actifs={n1}
        n3Actifs={n3}
        isN3Eligible={isN3Eligible}
        n3EligibleSince={profile.n3_eligible_since}
        subscriptionStart={profile.subscription_start}
      />

      {/* Affiliate link */}
      <div style={{ background: 'var(--white)', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
        <div style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: '16px', color: 'var(--text)', marginBottom: '12px' }}>
          Ton lien d&apos;affiliation
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{
            flex: 1, background: 'var(--off)', border: '1.5px solid var(--border)',
            borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: 'var(--text)',
            fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {affiliateLink || 'Complète ton profil pour obtenir ton code'}
          </div>
          {affiliateLink && <CopyButton text={affiliateLink} />}
        </div>

        {affiliateLink && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(affiliateLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: '#0077B5', color: 'white', textDecoration: 'none' }}
            >LinkedIn</a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent('Rejoins le club Nouveau Variable : ' + affiliateLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: '#25D366', color: 'white', textDecoration: 'none' }}
            >WhatsApp</a>
            <a
              href={`mailto:?subject=Rejoins Nouveau Variable&body=${encodeURIComponent('Je t\'invite à rejoindre le club : ' + affiliateLink)}`}
              style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: 'var(--off)', color: 'var(--text)', textDecoration: 'none', border: '1.5px solid var(--border)' }}
            >Email</a>
          </div>
        )}
      </div>
    </div>
  )
}
