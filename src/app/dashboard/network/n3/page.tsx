import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SUBSCRIPTION_HT, N3_RATE, N3_UNLOCK_MONTHS } from '@/lib/constants'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

function monthsSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 0
  const ms = Date.now() - new Date(dateStr).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 30.44))
}

export default async function N3Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_start, n3_eligible_since, is_founder')
    .eq('id', user.id)
    .single()

  const isN3Eligible    = !!profile?.n3_eligible_since || !!profile?.is_founder
  const monthsSubscribed = monthsSince(profile?.subscription_start)
  const monthsLeft       = Math.max(0, N3_UNLOCK_MONTHS - monthsSubscribed)
  const commPerN3        = SUBSCRIPTION_HT * N3_RATE

  const { data: referrals } = await supabase
    .from('referrals')
    .select('*, profiles!referrals_referee_id_fkey(id, first_name, last_name, is_active, is_founder, created_at)')
    .eq('referrer_id', user.id)
    .eq('level', 3)
    .order('created_at', { ascending: false })

  const activeCount = (referrals ?? []).filter((r: Record<string, unknown>) => {
    const p = r['profiles!referrals_referee_id_fkey'] as { is_active?: boolean; is_founder?: boolean } | null
    return p?.is_active === true || p?.is_founder === true
  }).length

  return (
    <div style={{ maxWidth: '800px' }}>

      {/* Eligibility banner */}
      {!isN3Eligible ? (
        <div style={{ background: '#FEF3E2', border: '1.5px solid #F0C07A', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <span style={{ fontSize: '32px', flexShrink: 0 }}>🔒</span>
            <div>
              <div style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: '18px', color: '#C8790A', marginBottom: '8px' }}>
                Niveau 3 — Débloqué à 6 mois
              </div>
              <div style={{ fontSize: '14px', color: '#8B6914', lineHeight: 1.6, marginBottom: '16px' }}>
                Pour toucher des commissions sur tes filleuls N3, tu dois avoir
                6 mois d&apos;abonnement consécutif. Plus tu restes membre, plus ton réseau devient rentable.
              </div>
              {profile?.subscription_start ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ flex: 1, height: '8px', borderRadius: '99px', background: 'rgba(200,121,10,0.15)', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (monthsSubscribed / N3_UNLOCK_MONTHS) * 100)}%`, height: '100%', background: '#C8790A', borderRadius: '99px', transition: 'width .3s' }} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#C8790A', whiteSpace: 'nowrap' }}>
                      {monthsSubscribed}/{N3_UNLOCK_MONTHS} mois
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#8B6914' }}>
                    {monthsLeft > 0 ? (
                      <>Encore <strong>{monthsLeft} mois</strong> avant le déblocage du N3.</>
                    ) : (
                      <>Mise à jour en cours — ton N3 sera débloqué prochainement.</>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#8B6914' }}>
                  Abonne-toi pour démarrer le décompte des 6 mois.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: '#e8f5ef', border: '1.5px solid #56b791', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <span style={{ fontSize: '32px', flexShrink: 0 }}>🏆</span>
            <div>
              <div style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: '18px', color: '#024f41', marginBottom: '4px' }}>
                Niveau 3 débloqué !
              </div>
              {profile.n3_eligible_since && (
                <div style={{ fontSize: '13px', color: '#1a7b5e', marginBottom: '8px' }}>
                  Actif depuis le {format(new Date(profile.n3_eligible_since), 'd MMMM yyyy', { locale: fr })}
                </div>
              )}
              <div style={{ fontSize: '14px', color: '#1a7b5e' }}>
                Tu touches <strong>{commPerN3.toFixed(2)} €</strong> HT par filleul N3 actif chaque mois.
                {activeCount > 0 && (
                  <> Soit <strong>{(activeCount * commPerN3).toFixed(0)} €</strong>/mois sur tes {activeCount} filleul{activeCount > 1 ? 's' : ''} N3 actif{activeCount > 1 ? 's' : ''}.</>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rate info */}
      <div style={{ background: 'var(--white)', borderRadius: '14px', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: '16px', color: 'var(--text)' }}>
            Taux N3 : <span style={{ color: '#C8790A' }}>5%</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
            {(referrals ?? []).length} filleul(s) N3 au total · {activeCount} actif(s)
          </div>
        </div>
        <div style={{ background: '#FEF3E2', border: '1px solid #F0C07A', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', color: '#C8790A', fontWeight: 600 }}>
          {isN3Eligible ? `${commPerN3.toFixed(2)} € / filleul actif / mois` : 'Non débloqué'}
        </div>
      </div>

      {/* Empty state */}
      {!(referrals ?? []).length && (
        <div style={{ background: 'var(--white)', borderRadius: '14px', padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌐</div>
          <p style={{ fontWeight: 600 }}>Pas encore de filleuls N3</p>
          <p style={{ fontSize: '14px' }}>
            Tes filleuls N2 doivent à leur tour parrainer des membres.<br />
            Chaque filleul N2 qui parraine = un filleul N3 pour toi.
          </p>
        </div>
      )}

      {/* Referrals list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {(referrals ?? []).map((r: Record<string, unknown>) => {
          const p = r['profiles!referrals_referee_id_fkey'] as Record<string, unknown> | null
          if (!p) return null
          const initials   = `${String(p.first_name ?? '')[0] ?? ''}${String(p.last_name ?? '')[0] ?? ''}`.toUpperCase()
          const isActive   = (p.is_active as boolean) || (p.is_founder as boolean)
          const createdAt  = r.created_at as string

          return (
            <div key={String(r.id)} style={{ background: 'var(--white)', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '11px', flexShrink: 0,
                background: '#C8790A', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: '16px',
              }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                  {String(p.first_name ?? '')} {String(p.last_name ?? '')}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Inscrit le {format(new Date(createdAt), 'd MMM yyyy', { locale: fr })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                  background: isActive ? 'var(--green-pale)' : 'var(--border)',
                  color: isActive ? '#43695A' : 'var(--muted)',
                }}>
                  {isActive ? '● Actif' : '○ Inactif'}
                </div>
                {isActive && isN3Eligible && (
                  <div style={{ fontSize: '13px', color: '#C8790A', fontWeight: 600 }}>
                    +{commPerN3.toFixed(2)} €/mois
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
