import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getN2Rate, N2_TIERS, SUBSCRIPTION } from '@/lib/constants'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function N2Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Count N1 to determine rate
  const { count: n1Count } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id)
    .eq('level', 1)
    .eq('is_active', true)

  const n1 = n1Count ?? 0
  const n2Rate = getN2Rate(n1)
  const commPerN2 = SUBSCRIPTION * (n2Rate / 100)
  const nextTier = N2_TIERS.find(t => t.min > n1)

  const { data: referrals } = await supabase
    .from('referrals')
    .select('*, profiles!referrals_referee_id_fkey(id, first_name, last_name, is_active, created_at, referred_by), profiles!referrals_referrer_id_fkey(first_name, last_name)')
    .eq('referrer_id', user.id)
    .eq('level', 2)
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Rate banner */}
      <div style={{ background: 'var(--white)', borderRadius: '14px', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>
              Taux N2 actuel : <span style={{ color: '#43695A' }}>{n2Rate}%</span>
            </div>
            {nextTier && (
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                {nextTier.min - n1} filleuls N1 supplémentaires pour passer à {nextTier.rate}%
              </div>
            )}
          </div>
          <div style={{ background: 'var(--green-pale)', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', color: '#43695A', fontWeight: 600 }}>
            +{commPerN2.toFixed(2)} € / filleul actif / mois
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {N2_TIERS.map(tier => (
            <div key={tier.min} style={{ flex: 1 }}>
              <div style={{ height: '6px', borderRadius: '4px', background: n1 >= tier.min ? '#43695A' : 'var(--border)' }} />
              <div style={{ fontSize: '10px', textAlign: 'center', color: n1 >= tier.min ? '#43695A' : 'var(--light)', marginTop: '3px' }}>{tier.rate}%</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--muted)' }}>
        {referrals?.length ?? 0} filleul(s) N2
      </div>

      {!referrals?.length && (
        <div style={{ background: 'var(--white)', borderRadius: '14px', padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌐</div>
          <p style={{ fontWeight: 600 }}>Pas encore de filleuls N2</p>
          <p style={{ fontSize: '14px' }}>Tes filleuls N1 doivent à leur tour parrainer des membres</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {referrals?.map((r: Record<string, unknown>) => {
          const profile = r['profiles!referrals_referee_id_fkey'] as Record<string, unknown> | null
          if (!profile) return null
          const initials = `${String(profile.first_name ?? '')[0] ?? ''}${String(profile.last_name ?? '')[0] ?? ''}`.toUpperCase()
          const isActive = profile.is_active as boolean
          const createdAt = r.created_at as string

          return (
            <div key={String(r.id)} style={{ background: 'var(--white)', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '11px', flexShrink: 0,
                background: '#4B7BF5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '16px',
              }}>{initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
                  {String(profile.first_name)} {String(profile.last_name)}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Inscrit le {format(new Date(createdAt), 'd MMM yyyy', { locale: fr })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                  background: isActive ? 'var(--green-pale)' : 'var(--border)',
                  color: isActive ? '#43695A' : 'var(--muted)',
                }}>
                  {isActive ? '● Actif' : '○ Inactif'}
                </div>
                {isActive && (
                  <div style={{ fontSize: '13px', color: '#4B7BF5', fontWeight: 600 }}>
                    +{commPerN2.toFixed(2)} €/mois
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
