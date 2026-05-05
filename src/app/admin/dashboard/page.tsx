'use client'

import { useEffect, useState } from 'react'

const C = {
  card:    '#1A2820',
  border:  'rgba(255,255,255,0.07)',
  green:   '#2F5446',
  greenL:  '#4A8C6F',
  text:    '#F7FAF8',
  text2:   '#4B6358',
  text3:   '#7FAF97',
}

type Stats = {
  activeMembers: number
  pendingCandidatures: number
  mrr: number
  arr: number
  mrrByMonth: { month: string; mrr: number }[]
  topTools: { name: string; count: number }[]
  recentCandidatures: { full_name: string; email: string; created_at: string }[]
  recentMembers: { first_name: string; last_name: string; created_at: string; plan_id: string | null }[]
}

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: '20px 24px',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.text2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: C.text3, marginTop: 6 }}>{sub}</p>}
    </div>
  )
}

function MrrChart({ data }: { data: { month: string; mrr: number }[] }) {
  const max = Math.max(...data.map(d => d.mrr), 1)
  const W = 520, H = 120, PAD = 28

  if (!data.length) return null

  const points = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1 || 1)) * (W - PAD * 2),
    y: H - PAD - ((d.mrr / max) * (H - PAD * 2)),
    ...d,
  }))

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${path} L${points.at(-1)!.x.toFixed(1)},${H} L${points[0].x.toFixed(1)},${H} Z`

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W }}>
        <defs>
          <linearGradient id="mrr-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.greenL} stopOpacity="0.35" />
            <stop offset="100%" stopColor={C.greenL} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#mrr-grad)" />
        <path d={path} fill="none" stroke={C.greenL} strokeWidth="2" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill={C.greenL} />
            <text x={p.x} y={H - 4} textAnchor="middle" fontSize="9" fill={C.text2}>
              {new Date(p.month + '-01').toLocaleDateString('fr-FR', { month: 'short' })}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .finally(() => setLoading(false))
  }, [])

  const section = (title: string) => (
    <p style={{ fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
      {title}
    </p>
  )

  if (loading) return (
    <div style={{ padding: 40, color: C.text2 }}>Chargement…</div>
  )

  if (!stats) return (
    <div style={{ padding: 40, color: '#E05252' }}>Erreur chargement</div>
  )

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 28 }}>Dashboard</h1>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <KPI label="Membres actifs"   value={fmt(stats.activeMembers)} />
        <KPI label="MRR"              value={fmtEur(stats.mrr)} sub="hors TVA" />
        <KPI label="ARR"              value={fmtEur(stats.arr)} />
        <KPI label="Candidatures"     value={fmt(stats.pendingCandidatures)} sub="en attente" />
      </div>

      {/* MRR Chart */}
      {stats.mrrByMonth.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px', marginBottom: 32 }}>
          {section('Évolution MRR')}
          <MrrChart data={stats.mrrByMonth} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
        {/* Top outils */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          {section('Outils populaires')}
          {stats.topTools.length === 0 && <p style={{ color: C.text2, fontSize: 13 }}>Aucune donnée</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.topTools.map((t, i) => {
              const max = stats.topTools[0]?.count ?? 1
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: C.text }}>{t.name}</span>
                    <span style={{ fontSize: 12, color: C.text2 }}>{t.count}</span>
                  </div>
                  <div style={{ height: 3, background: C.border, borderRadius: 2 }}>
                    <div style={{ height: 3, background: C.greenL, borderRadius: 2, width: `${(t.count / max) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Candidatures récentes */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          {section('Dernières candidatures')}
          {stats.recentCandidatures.length === 0 && <p style={{ color: C.text2, fontSize: 13 }}>Aucune candidature</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.recentCandidatures.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{c.full_name}</p>
                  <p style={{ fontSize: 11, color: C.text2 }}>{c.email}</p>
                </div>
                <span style={{ fontSize: 11, color: C.text2 }}>{fmtDate(c.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nouveaux membres */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
        {section('Nouveaux membres')}
        {stats.recentMembers.length === 0 && <p style={{ color: C.text2, fontSize: 13 }}>Aucun membre récent</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {stats.recentMembers.map((m, i) => (
            <div key={i} style={{
              background: '#111D18', border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '12px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{m.first_name} {m.last_name}</p>
                <p style={{ fontSize: 11, color: C.text2 }}>{m.plan_id ?? 'Aucun plan'}</p>
              </div>
              <span style={{ fontSize: 11, color: C.text2 }}>{fmtDate(m.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
