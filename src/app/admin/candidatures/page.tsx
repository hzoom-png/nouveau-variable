'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminHeader } from '../_components/AdminHeader'

const C = {
  bg:     '#0F1C17',
  card:   '#1A2820',
  border: 'rgba(255,255,255,0.07)',
  green:  '#2F5446',
  greenL: '#4A8C6F',
  amber:  '#C8790A',
  error:  '#E05252',
  text:   '#F7FAF8',
  text2:  '#4B6358',
  input:  '#111D18',
}

type Status = 'received' | 'reviewed' | 'accepted' | 'rejected'

type Candidature = {
  id: string
  full_name: string
  email: string
  phone: string | null
  company: string | null
  city: string | null
  role: string | null
  experience: string | null
  motivation: string | null
  referral_code: string | null
  linkedin_url: string | null
  status: Status
  admin_note: string | null
  created_at: string
}

const COLUMNS: { key: Status; label: string; color: string; bgHex: string }[] = [
  { key: 'received', label: 'Reçue',    color: '#4B6358', bgHex: 'rgba(75,99,88,0.1)' },
  { key: 'reviewed', label: 'En cours', color: '#C8790A', bgHex: 'rgba(200,121,10,0.08)' },
  { key: 'accepted', label: 'Acceptée', color: '#4A8C6F', bgHex: 'rgba(74,140,111,0.1)' },
  { key: 'rejected', label: 'Rejetée',  color: '#E05252', bgHex: 'rgba(224,82,82,0.08)' },
]

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
}

function StatusPill({ status }: { status: Status }) {
  const col = COLUMNS.find(c => c.key === status)!
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10,
      background: col.bgHex, color: col.color,
      letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>
      {col.label}
    </span>
  )
}

const inputSt: React.CSSProperties = {
  background: C.input, border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: 8, padding: '9px 12px', fontSize: 13,
  color: C.text, fontFamily: 'Inter, sans-serif', outline: 'none',
}

const btnPrimary: React.CSSProperties = {
  padding: '9px 18px', borderRadius: 8, background: C.green,
  border: 'none', color: C.text, fontSize: 13, fontWeight: 600,
  fontFamily: 'Inter, sans-serif', cursor: 'pointer',
}

export default function CandidaturesPage() {
  const [items, setItems]         = useState<Candidature[]>([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<Candidature | null>(null)
  const [note, setNote]           = useState('')
  const [working, setWorking]     = useState(false)
  const [error, setError]         = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [view, setView]           = useState<'table' | 'kanban'>('table')
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | Status>('')

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/admin/candidatures/list')
    const d = await r.json()
    setItems(d.candidatures ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function open(c: Candidature) {
    setSelected(c)
    setNote(c.admin_note ?? '')
    setError('')
    setSuccessMsg('')
  }

  async function updateStatus(c: Candidature, status: Status) {
    setWorking(true)
    setError('')
    const res = await fetch('/api/admin/candidatures/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, status, admin_note: note }),
    })
    if (res.ok) {
      await load()
      setSelected(prev => prev?.id === c.id ? { ...prev, status, admin_note: note } : prev)
    } else {
      const d = await res.json()
      setError(d.error ?? 'Erreur')
    }
    setWorking(false)
  }

  async function accept(c: Candidature) {
    setWorking(true)
    setError('')
    setSuccessMsg('')
    const res = await fetch('/api/admin/candidatures/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidatureId: c.id }),
    })
    if (res.ok) {
      const firstName = c.full_name.split(' ')[0]
      setSuccessMsg(`Email et SMS envoyés à ${firstName}`)
      await load()
      setSelected(prev => prev?.id === c.id ? { ...prev, status: 'accepted' } : prev)
    } else {
      const d = await res.json()
      setError(d.error ?? 'Erreur')
    }
    setWorking(false)
  }

  async function saveNote() {
    if (!selected) return
    await fetch('/api/admin/candidatures/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, status: selected.status, admin_note: note }),
    })
  }

  const counts = {
    received: items.filter(i => i.status === 'received').length,
    reviewed: items.filter(i => i.status === 'reviewed').length,
    accepted: items.filter(i => i.status === 'accepted').length,
    rejected: items.filter(i => i.status === 'rejected').length,
  }

  const filtered = items.filter(c => {
    const q = search.toLowerCase()
    if (q && !c.full_name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q) && !(c.company ?? '').toLowerCase().includes(q)) return false
    if (statusFilter && c.status !== statusFilter) return false
    return true
  })

  const byStatus = (s: Status) => filtered.filter(i => i.status === s)

  const btnSmStyle = (bg: string, color = C.text): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 6, background: bg,
    border: 'none', color, fontSize: 11, fontWeight: 600,
    fontFamily: 'Inter, sans-serif', cursor: 'pointer',
  })

  const pills = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {COLUMNS.map(col => (
        <span key={col.key} style={{ fontSize: 11, color: col.color, background: col.bgHex, padding: '3px 10px', borderRadius: 12, fontWeight: 600 }}>
          {counts[col.key]} {col.label.toLowerCase()}{counts[col.key] > 1 ? 's' : ''}
        </span>
      ))}
    </div>
  )

  const viewToggle = (
    <div style={{ display: 'flex', background: C.input, borderRadius: 8, padding: 3, gap: 3 }}>
      {(['table', 'kanban'] as const).map(v => (
        <button
          key={v}
          onClick={() => setView(v)}
          style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            background: view === v ? C.green : 'transparent',
            border: 'none', color: view === v ? C.text : C.text2,
            fontFamily: 'Inter, sans-serif', cursor: 'pointer',
          }}
        >
          {v === 'table' ? 'Tableau' : 'Kanban'}
        </button>
      ))}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: C.bg }}>
      <AdminHeader title="Candidatures" subtitle={`${items.length} au total`} />

      <div style={{ padding: '24px 40px' }}>
        {/* Sub-header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          {pills}
          {viewToggle}
        </div>

        {/* Filters (table only) */}
        {view === 'table' && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              style={{ ...inputSt, minWidth: 220 }}
              placeholder="Rechercher nom, email, entreprise…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as '' | Status)} style={inputSt}>
              <option value="">Tous les statuts</option>
              {COLUMNS.map(col => (
                <option key={col.key} value={col.key}>{col.label}</option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <p style={{ color: C.text2 }}>Chargement…</p>
        ) : view === 'table' ? (
          /* TABLE VIEW */
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.text2 }}>Aucune candidature</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['Nom', 'Entreprise', 'Rôle', 'Parrain', 'Statut', 'Date', ''].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ fontWeight: 600, color: C.text }}>{c.full_name}</p>
                        <p style={{ fontSize: 11, color: C.text2 }}>{c.email}</p>
                      </td>
                      <td style={{ padding: '12px 16px', color: C.text2 }}>{c.company ?? '—'}</td>
                      <td style={{ padding: '12px 16px', color: C.text }}>{c.role ?? '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {c.referral_code ? (
                          <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.greenL, background: 'rgba(47,84,70,0.15)', padding: '2px 6px', borderRadius: 4 }}>
                            {c.referral_code}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}><StatusPill status={c.status} /></td>
                      <td style={{ padding: '12px 16px', color: C.text2, fontSize: 12 }}>{fmtDate(c.created_at)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => open(c)}
                          style={{ ...btnPrimary, padding: '6px 14px', fontSize: 12 }}
                        >
                          Voir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* KANBAN VIEW */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, overflowX: 'auto' }}>
            {COLUMNS.map(col => (
              <div key={col.key} style={{ minWidth: 200 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                  padding: '8px 10px', borderRadius: 8, background: col.bgHex,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: col.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: col.color, letterSpacing: '0.1em', textTransform: 'uppercase', flex: 1 }}>
                    {col.label}
                  </span>
                  <span style={{ fontSize: 10, color: C.text2, background: C.input, borderRadius: 10, padding: '1px 6px' }}>
                    {byStatus(col.key).length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {byStatus(col.key).map(c => (
                    <div
                      key={c.id}
                      onClick={() => open(c)}
                      style={{
                        background: C.card, border: `1px solid ${C.border}`,
                        borderLeft: `3px solid ${col.color}`,
                        borderRadius: 10, padding: '12px', cursor: 'pointer',
                      }}
                    >
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{c.full_name}</p>
                      {c.company && <p style={{ fontSize: 11, color: C.text2 }}>{c.company}</p>}
                      {c.role && <p style={{ fontSize: 11, color: C.greenL, marginTop: 4 }}>{c.role}</p>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                        {c.referral_code && <span style={{ fontSize: 10, color: C.text2, fontFamily: 'monospace' }}>ref: {c.referral_code}</span>}
                        <span style={{ fontSize: 10, color: C.text2, marginLeft: 'auto' }}>{fmtDate(c.created_at)}</span>
                      </div>
                    </div>
                  ))}
                  {byStatus(col.key).length === 0 && (
                    <div style={{ height: 60, border: `1px dashed ${C.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, color: C.text2 }}>Aucune</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background: C.card, border: `1px solid ${C.green}`, borderRadius: 16, padding: 28, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{selected.full_name}</h2>
                <p style={{ fontSize: 12, color: C.text2 }}>{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: C.text2, fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <StatusPill status={selected.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              {[
                ['Téléphone', selected.phone ?? '—'],
                ['Ville', selected.city ?? '—'],
                ['Entreprise', selected.company ?? '—'],
                ['Rôle', selected.role ?? '—'],
                ['Expérience', selected.experience ?? '—'],
                ['Code parrain', selected.referral_code ?? 'Aucun'],
                ['Reçue le', fmtDate(selected.created_at)],
                ['LinkedIn', selected.linkedin_url ? 'Oui' : '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p style={{ fontSize: 10, color: C.text2, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{k}</p>
                  <p style={{ fontSize: 13, color: C.text }}>{v}</p>
                </div>
              ))}
            </div>

            {selected.linkedin_url && (
              <div style={{ marginBottom: 16 }}>
                <a href={selected.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.greenL }}>
                  Voir profil LinkedIn →
                </a>
              </div>
            )}

            {selected.motivation && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, color: C.text2, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Motivation</p>
                <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selected.motivation}</p>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, color: C.text2, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Note admin</p>
              <textarea
                style={{ width: '100%', boxSizing: 'border-box', background: C.input, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: C.text, fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'vertical', minHeight: 80 }}
                placeholder="Note interne…"
                value={note}
                onChange={e => setNote(e.target.value)}
                onBlur={saveNote}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, color: C.text2, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Changer le statut</p>
              <select
                value={selected.status}
                onChange={e => updateStatus(selected, e.target.value as Status)}
                style={{ ...inputSt, width: '100%', boxSizing: 'border-box' }}
              >
                {COLUMNS.map(col => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
            </div>

            {error && <p style={{ color: C.error, fontSize: 12, marginBottom: 12 }}>{error}</p>}
            {successMsg && <p style={{ color: C.greenL, fontSize: 12, marginBottom: 12 }}>✓ {successMsg}</p>}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selected.status !== 'accepted' && (
                <button
                  style={{ ...btnPrimary, background: C.greenL }}
                  onClick={() => accept(selected)}
                  disabled={working}
                >
                  {working ? '…' : '✓ Accepter & notifier'}
                </button>
              )}
              {selected.status !== 'rejected' && (
                <button
                  style={{ ...btnPrimary, background: 'rgba(224,82,82,0.15)', color: C.error, border: `1px solid rgba(224,82,82,0.3)` }}
                  onClick={() => updateStatus(selected, 'rejected')}
                  disabled={working}
                >
                  Refuser
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
