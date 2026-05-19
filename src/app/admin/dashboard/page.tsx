'use client'

import { useEffect, useState, useCallback } from 'react'

const C = {
  bg:      '#0F1C17',
  card:    '#1A2820',
  border:  'rgba(255,255,255,0.07)',
  green:   '#2F5446',
  greenL:  '#4A8C6F',
  amber:   '#C8790A',
  error:   '#E05252',
  text:    '#F7FAF8',
  text2:   '#4B6358',
  text3:   '#7FAF97',
  input:   '#111D18',
}

// ─── Types ────────────────────────────────────────────────────────

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

type Cand = {
  id: string
  full_name: string
  email: string
  phone: string | null
  city: string | null
  role: string | null
  sector: string | null
  experience: string | null
  motivation: string | null
  referral_code: string | null
  status: string
  admin_note: string | null
  created_at: string
  is_founder?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  received: { label: 'Reçue',    color: '#4B6358', bg: 'rgba(75,99,88,0.15)'    },
  reviewed: { label: 'En cours', color: '#C8790A', bg: 'rgba(200,121,10,0.12)'  },
  accepted: { label: 'Acceptée', color: '#4A8C6F', bg: 'rgba(74,140,111,0.15)'  },
  rejected: { label: 'Refusée',  color: '#E05252', bg: 'rgba(224,82,82,0.12)'   },
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#4B6358', bg: 'rgba(75,99,88,0.15)' }
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: cfg.bg, color: cfg.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      {cfg.label}
    </span>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.text2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: C.text3, marginTop: 6 }}>{sub}</p>}
    </div>
  )
}

// ─── MRR chart ────────────────────────────────────────────────────

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

// ─── Main page ────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats]       = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Candidatures
  const [cands, setCands]       = useState<Cand[]>([])
  const [candsLoading, setCandsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [selected, setSelected] = useState<Cand | null>(null)
  const [note, setNote]         = useState('')
  const [working, setWorking]   = useState(false)
  const [actionMsg, setActionMsg] = useState('')
  const [actionErr, setActionErr] = useState('')

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .finally(() => setStatsLoading(false))
  }, [])

  const loadCands = useCallback(async () => {
    setCandsLoading(true)
    try {
      const url = statusFilter === 'pending'
        ? '/api/admin/candidatures/list'
        : `/api/admin/candidatures/list?status=${statusFilter}`
      const r = await fetch(url)
      const d = await r.json()
      let list: Cand[] = d.candidatures ?? []
      if (statusFilter === 'pending') {
        list = list.filter((c: Cand) => c.status === 'received' || c.status === 'reviewed')
      }
      setCands(list)
    } catch { /* ignore */ }
    setCandsLoading(false)
  }, [statusFilter])

  useEffect(() => { loadCands() }, [loadCands])

  function openCand(c: Cand) {
    setSelected(c)
    setNote(c.admin_note ?? '')
    setActionMsg('')
    setActionErr('')
  }

  async function accept(c: Cand) {
    setWorking(true)
    setActionErr('')
    setActionMsg('')
    const res = await fetch('/api/admin/candidatures/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidatureId: c.id }),
    })
    if (res.ok) {
      setActionMsg(`Email envoyé à ${c.full_name.split(' ')[0]}`)
      await loadCands()
      setSelected(prev => prev?.id === c.id ? { ...prev, status: 'accepted' } : prev)
    } else {
      const d = await res.json()
      setActionErr(d.error ?? 'Erreur')
    }
    setWorking(false)
  }

  async function reject(c: Cand) {
    setWorking(true)
    setActionErr('')
    setActionMsg('')
    const res = await fetch('/api/admin/candidatures/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, status: 'rejected', admin_note: note }),
    })
    if (res.ok) {
      setActionMsg('Email de refus envoyé')
      await loadCands()
      setSelected(prev => prev?.id === c.id ? { ...prev, status: 'rejected' } : prev)
    } else {
      const d = await res.json()
      setActionErr(d.error ?? 'Erreur')
    }
    setWorking(false)
  }

  async function setReviewed(c: Cand) {
    setWorking(true)
    const res = await fetch('/api/admin/candidatures/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, status: 'reviewed', admin_note: note }),
    })
    if (res.ok) {
      await loadCands()
      setSelected(prev => prev?.id === c.id ? { ...prev, status: 'reviewed' } : prev)
    }
    setWorking(false)
  }

  async function resendAcceptance(c: Cand) {
    setWorking(true)
    setActionErr('')
    setActionMsg('')
    const res = await fetch('/api/admin/candidatures/resend-acceptance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidatureId: c.id }),
    })
    if (res.ok) {
      setActionMsg(`Mail d'acceptation renvoyé à ${c.full_name.split(' ')[0]}`)
    } else {
      const d = await res.json()
      setActionErr(d.error ?? 'Erreur')
    }
    setWorking(false)
  }

  async function saveNote(c: Cand) {
    await fetch('/api/admin/candidatures/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, status: c.status, admin_note: note }),
    })
  }

  const section = (title: string) => (
    <p style={{ fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
      {title}
    </p>
  )

  const inputSt: React.CSSProperties = {
    background: C.input, border: `1px solid rgba(255,255,255,0.1)`,
    borderRadius: 8, padding: '8px 12px', fontSize: 13,
    color: C.text, fontFamily: 'Inter, sans-serif', outline: 'none',
  }

  const filterBtn = (val: string, label: string) => (
    <button
      key={val}
      onClick={() => setStatusFilter(val)}
      style={{
        padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
        fontFamily: 'Inter, sans-serif', cursor: 'pointer',
        background: statusFilter === val ? 'rgba(47,84,70,0.3)' : 'transparent',
        border: `1px solid ${statusFilter === val ? C.green : 'rgba(255,255,255,0.1)'}`,
        color: statusFilter === val ? C.text : C.text2,
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 28 }}>Dashboard</h1>

      {/* KPIs */}
      {!statsLoading && stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <KPI label="Membres actifs"   value={fmt(stats.activeMembers)} />
            <KPI label="MRR"              value={fmtEur(stats.mrr)} sub="hors TVA" />
            <KPI label="ARR"              value={fmtEur(stats.arr)} />
            <KPI label="Candidatures"     value={fmt(stats.pendingCandidatures)} sub="en attente" />
          </div>

          {stats.mrrByMonth.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 32 }}>
              {section('Évolution MRR')}
              <MrrChart data={stats.mrrByMonth} />
            </div>
          )}
        </>
      )}

      {/* ── CANDIDATURES ────────────────────────────────────────────── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Candidatures {!candsLoading && `— ${cands.length}`}
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            {filterBtn('pending',  'En attente')}
            {filterBtn('received', 'Reçues')}
            {filterBtn('reviewed', 'En cours')}
            {filterBtn('accepted', 'Acceptées')}
            {filterBtn('rejected', 'Refusées')}
            {filterBtn('',         'Toutes')}
          </div>
        </div>

        {candsLoading ? (
          <p style={{ color: C.text2, fontSize: 13 }}>Chargement…</p>
        ) : cands.length === 0 ? (
          <p style={{ color: C.text2, fontSize: 13 }}>Aucune candidature</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Nom', 'Rôle', 'Ville', 'Statut', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cands.map(c => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 12px' }}>
                      <p style={{ fontWeight: 600, color: C.text }}>{c.full_name}</p>
                      <p style={{ fontSize: 11, color: C.text2 }}>{c.email}</p>
                    </td>
                    <td style={{ padding: '10px 12px', color: C.text2 }}>{c.role ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.text2 }}>{c.city ?? '—'}</td>
                    <td style={{ padding: '10px 12px' }}><StatusPill status={c.status} /></td>
                    <td style={{ padding: '10px 12px', color: C.text2, fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(c.created_at)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button
                          onClick={() => openCand(c)}
                          style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text2, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                        >
                          Voir
                        </button>
                        {c.status !== 'accepted' && (
                          <button
                            onClick={() => { openCand(c); }}
                            style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(74,140,111,0.15)', border: `1px solid rgba(74,140,111,0.3)`, color: C.greenL, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                            title="Accepter"
                          >
                            ✓
                          </button>
                        )}
                        {c.status !== 'rejected' && (
                          <button
                            onClick={() => { openCand(c); }}
                            style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(224,82,82,0.1)', border: `1px solid rgba(224,82,82,0.25)`, color: C.error, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                            title="Refuser"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats bas */}
      {!statsLoading && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
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

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
            {section('Nouveaux membres')}
            {stats.recentMembers.length === 0 && <p style={{ color: C.text2, fontSize: 13 }}>Aucun membre récent</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.recentMembers.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
      )}

      {/* ── MODAL DÉTAIL CANDIDATURE ─────────────────────────────── */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background: C.card, border: `1px solid ${C.green}`, borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{selected.full_name}</h2>
                <p style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: C.text2, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}><StatusPill status={selected.status} /></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              {[
                ['Téléphone', selected.phone ?? '—'],
                ['Ville',     selected.city ?? '—'],
                ['Rôle',      selected.role ?? '—'],
                ['Secteur',   selected.sector ?? '—'],
                ['Expérience',selected.experience ?? '—'],
                ['Parrain',   selected.referral_code ?? 'Aucun'],
                ['Reçue le',  fmtDate(selected.created_at)],
              ].map(([k, v]) => (
                <div key={k}>
                  <p style={{ fontSize: 10, color: C.text2, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{k}</p>
                  <p style={{ fontSize: 13, color: C.text }}>{v}</p>
                </div>
              ))}
            </div>

            {selected.motivation && (
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 10, color: C.text2, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Motivation</p>
                <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6, whiteSpace: 'pre-wrap', background: C.input, borderRadius: 8, padding: '10px 12px' }}>{selected.motivation}</p>
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 10, color: C.text2, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Note admin</p>
              <textarea
                style={{ width: '100%', boxSizing: 'border-box', background: C.input, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: C.text, fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'vertical', minHeight: 72 }}
                placeholder="Note interne…"
                value={note}
                onChange={e => setNote(e.target.value)}
                onBlur={() => saveNote(selected)}
              />
            </div>

            {actionErr && <p style={{ color: C.error, fontSize: 12, marginBottom: 10 }}>{actionErr}</p>}
            {actionMsg && <p style={{ color: C.greenL, fontSize: 12, marginBottom: 10 }}>✓ {actionMsg}</p>}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selected.status !== 'accepted' && (
                <button
                  onClick={() => accept(selected)}
                  disabled={working}
                  style={{ padding: '9px 18px', borderRadius: 8, background: C.greenL, border: 'none', color: C.text, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: working ? 'wait' : 'pointer' }}
                >
                  {working ? '…' : '✓ Accepter — envoyer email'}
                </button>
              )}
              {selected.status !== 'rejected' && (
                <button
                  onClick={() => reject(selected)}
                  disabled={working}
                  style={{ padding: '9px 18px', borderRadius: 8, background: 'rgba(224,82,82,0.12)', border: `1px solid rgba(224,82,82,0.3)`, color: C.error, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: working ? 'wait' : 'pointer' }}
                >
                  {working ? '…' : 'Refuser — envoyer email'}
                </button>
              )}
              {selected.status === 'received' && (
                <button
                  onClick={() => setReviewed(selected)}
                  disabled={working}
                  style={{ padding: '9px 18px', borderRadius: 8, background: 'rgba(200,121,10,0.12)', border: `1px solid rgba(200,121,10,0.3)`, color: C.amber, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: working ? 'wait' : 'pointer' }}
                >
                  Marquer en cours
                </button>
              )}
              {selected.status === 'accepted' && !selected.is_founder && (
                <button
                  onClick={() => resendAcceptance(selected)}
                  disabled={working}
                  style={{ padding: '9px 18px', borderRadius: 8, background: 'rgba(74,140,111,0.08)', border: `1px solid rgba(74,140,111,0.3)`, color: C.greenL, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: working ? 'wait' : 'pointer' }}
                >
                  {working ? '…' : 'Renvoyer le mail d\'acceptation'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
