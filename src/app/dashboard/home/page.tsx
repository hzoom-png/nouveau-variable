import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getN2Rate, SUBSCRIPTION, N1_RATE } from '@/lib/constants'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { count: n1Count } = await supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('referrer_id', user.id).eq('level', 1).eq('is_active', true)
  const { count: n2Count } = await supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('referrer_id', user.id).eq('level', 2).eq('is_active', true)

  const n1 = n1Count ?? 0
  const n2 = n2Count ?? 0
  const n2Rate = getN2Rate(n1)
  const commN1 = n1 * SUBSCRIPTION * N1_RATE
  const commN2 = n2 * SUBSCRIPTION * (n2Rate / 100)
  const totalComm = commN1 + commN2

  const { data: transactions } = await supabase.from('points_transactions').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(5)

  const steps = [
    { label: 'Compte créé', done: true },
    { label: 'Profil complété', done: !!(profile.first_name && profile.bio && profile.cities?.length) },
    { label: 'Première rencontre', done: profile.missions_count > 0 },
    { label: 'Premier filleul', done: n1 > 0 },
  ]

  const kpis = [
    { label: 'REVENUS AFFILIATION', value: `${totalComm.toFixed(0)} €`, sub: '/mois', featured: true },
    { label: 'FILLEULS N1', value: String(n1), sub: 'actifs' },
    { label: 'FILLEULS N2', value: String(n2), sub: 'actifs' },
    { label: 'POINTS', value: String(profile.points_balance), sub: 'disponibles' },
  ]

  const txTypeLabel: Record<string, string> = {
    subscription_credit: 'Crédit abonnement',
    meeting_request_debit: 'Demande RDV',
    meeting_accept_credit: 'RDV accepté',
    bonus_recruitment: 'Bonus recrutement',
    admin_adjustment: 'Ajustement',
    network_credit: 'Crédit réseau',
  }

  return (
    <div>
      {/* Welcome banner */}
      <div style={{ background: 'var(--green)', borderRadius: 'var(--r-lg)', padding: '24px 28px', color: '#fff', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-30px', top: '-30px', width: '140px', height: '140px', background: 'rgba(255,255,255,.04)', borderRadius: '50%' }} />
        <div style={{ fontFamily: 'var(--font-jost)', fontSize: '17px', fontWeight: 800, marginBottom: '4px', position: 'relative' }}>
          Bonjour, {profile.first_name} 👋
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)', marginBottom: '18px', position: 'relative', lineHeight: 1.5 }}>
          Rang : <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{profile.rank}</strong> · {profile.points_balance} pts disponibles
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', position: 'relative' }}>
          {steps.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                background: s.done ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.1)',
                border: `2px solid ${s.done ? '#fff' : 'rgba(255,255,255,.3)'}`,
                display: 'grid', placeItems: 'center', fontSize: '9px', fontWeight: 700,
                color: s.done ? 'var(--green)' : '#fff', flexShrink: 0,
              }}>
                {s.done ? '✓' : ''}
              </div>
              <span style={{ fontSize: '12px', color: s.done ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.6)', fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '13px', marginBottom: '24px' }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: k.featured ? 'var(--green)' : 'var(--white)',
            border: `1px solid ${k.featured ? 'var(--green)' : 'var(--border)'}`,
            borderRadius: 'var(--r-lg)', padding: '16px 18px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: k.featured ? 'rgba(255,255,255,.6)' : 'var(--text-3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
              {k.label}
            </div>
            <div style={{ fontFamily: 'var(--font-jost)', fontSize: '24px', fontWeight: 800, color: k.featured ? '#fff' : 'var(--text)', lineHeight: 1, letterSpacing: '-.02em' }}>
              {k.value}
            </div>
            <div style={{ fontSize: '11px', color: k.featured ? 'rgba(255,255,255,.6)' : 'var(--text-3)', marginTop: '5px' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Activity + Rank */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '18px' }}>
        {/* Activity */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-jost)', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Activité récente</span>
          </div>
          {!transactions?.length && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>Aucune activité</div>
          )}
          {transactions?.map(tx => (
            <div key={String(tx.id)} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, background: tx.amount > 0 ? 'var(--green)' : 'var(--amber)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{txTypeLabel[String(tx.transaction_type)] || String(tx.transaction_type)}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{format(new Date(String(tx.created_at)), 'd MMM à HH:mm', { locale: fr })}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-jost)', fontSize: '13px', fontWeight: 700, color: Number(tx.amount) > 0 ? 'var(--green)' : 'var(--amber)', flexShrink: 0 }}>
                {Number(tx.amount) > 0 ? '+' : ''}{String(tx.amount)} pts
              </div>
            </div>
          ))}
        </div>

        {/* Rank */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-jost)', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Mon rang</span>
          </div>
          <div style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--green-3)', borderRadius: 'var(--r-md)', padding: '10px 13px', marginBottom: '14px' }}>
              <span style={{ fontSize: '18px' }}>
                {profile.rank === 'amplificateur' ? '🚀' : profile.rank === 'connecteur' ? '🌐' : '🧭'}
              </span>
              <div>
                <div style={{ fontFamily: 'var(--font-jost)', fontSize: '14px', fontWeight: 700, color: 'var(--green)', textTransform: 'capitalize' }}>{profile.rank}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: '1px' }}>
                  {profile.rank === 'explorateur' ? '→ Connecteur à 10 filleuls' : profile.rank === 'connecteur' ? '→ Amplificateur à 30 filleuls' : 'Rang maximum atteint'}
                </div>
              </div>
            </div>
            {[
              { label: 'Filleuls N1', val: n1, max: profile.rank === 'explorateur' ? 10 : 30 },
              { label: 'Commission N2', val: `${n2Rate}%`, max: null },
              { label: 'Rencontres', val: profile.missions_count, max: null },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-2)', marginBottom: '5px' }}>
                  <span>{item.label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{item.val}{item.max ? ` / ${item.max}` : ''}</span>
                </div>
                {item.max && (
                  <div style={{ height: '5px', background: 'var(--surface-2)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
                    <div style={{ height: '5px', background: 'var(--green)', borderRadius: 'var(--r-full)', width: `${Math.min(100, (Number(item.val) / item.max) * 100)}%`, transition: 'width 1s cubic-bezier(.16,1,.3,1)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
