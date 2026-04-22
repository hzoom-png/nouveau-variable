import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SUBSCRIPTION, N1_RATE } from '@/lib/constants'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function N1Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: referrals } = await supabase
    .from('referrals')
    .select('*, profiles!referrals_referee_id_fkey(id, first_name, last_name, is_active, created_at, rank)')
    .eq('referrer_id', user.id)
    .eq('level', 1)
    .order('created_at', { ascending: false })

  const commPerN1 = SUBSCRIPTION * N1_RATE

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>{referrals?.length ?? 0} filleul(s) direct(s)</div>
        </div>
        <div style={{ background: 'var(--green-pale)', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', color: '#43695A', fontWeight: 600 }}>
          Commission : {commPerN1.toFixed(0)} € / filleul actif / mois
        </div>
      </div>

      {!referrals?.length && (
        <div style={{ background: 'white', borderRadius: '14px', padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
          <p style={{ fontWeight: 600 }}>Pas encore de filleuls N1</p>
          <p style={{ fontSize: '14px' }}>Partage ton lien d&apos;affiliation depuis la page Mon affiliation</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {referrals?.map((r: Record<string, unknown>) => {
          const profile = r.profiles as Record<string, unknown> | null
          if (!profile) return null
          const initials = `${String(profile.first_name ?? '')[0] ?? ''}${String(profile.last_name ?? '')[0] ?? ''}`.toUpperCase()
          const isActive = profile.is_active as boolean
          const createdAt = profile.created_at as string

          return (
            <div key={String(r.id)} style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '11px', flexShrink: 0,
                background: '#43695A', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '16px',
              }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
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
                  <div style={{ fontSize: '13px', color: '#43695A', fontWeight: 600 }}>
                    +{commPerN1.toFixed(0)} €/mois
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
