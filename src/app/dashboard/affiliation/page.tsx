import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getN2Rate, SUBSCRIPTION, N1_RATE } from '@/lib/constants'
import { CopyButton } from '@/components/ui/CopyButton'
import { AffiliationSimulator } from '@/components/affiliation/AffiliationSimulator'

export default async function AffiliationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { count: n1Count } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id)
    .eq('level', 1)
    .eq('is_active', true)

  const { count: n2Count } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id)
    .eq('level', 2)
    .eq('is_active', true)

  const n1 = n1Count ?? 0
  const n2 = n2Count ?? 0
  const n2Rate = getN2Rate(n1)
  const commN1 = n1 * SUBSCRIPTION * N1_RATE
  const commN2 = n2 * SUBSCRIPTION * (n2Rate / 100)

  const affiliateLink = profile.referral_code
    ? `https://nouveauvariable.fr/?ref=${profile.referral_code}`
    : ''

  const kpis = [
    { label: 'Filleuls N1 actifs', value: String(n1), color: '#43695A' },
    { label: 'Filleuls N2 actifs', value: String(n2), color: '#4B7BF5' },
    { label: 'Commission N1 / mois', value: `${commN1.toFixed(0)} €`, color: '#43695A' },
    { label: 'Commission N2 / mois', value: `${commN2.toFixed(2)} €`, color: '#E8A020' },
  ]

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: 'var(--white)', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, marginBottom: '8px' }}>{k.label}</div>
            <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 800, fontSize: '28px', color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <AffiliationSimulator n1Actifs={n1} />

      {/* Affiliate link */}
      <div style={{ background: 'var(--white)', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
        <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '12px' }}>
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
