'use client'

import { useEffect, useState, useCallback } from 'react'

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
  text3:  '#7FAF97',
  input:  '#111D18',
}

const TYPE_LABELS: Record<string, string> = {
  bug: 'Bug', feature: 'Suggestion', billing: 'Facturation', general: 'Question', other: 'Autre',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: 'Ouvert',    color: '#E05252', bg: 'rgba(224,82,82,0.12)'   },
  in_progress: { label: 'En cours',  color: '#C8790A', bg: 'rgba(200,121,10,0.12)'  },
  resolved:    { label: 'Résolu',    color: '#4A8C6F', bg: 'rgba(74,140,111,0.15)'  },
  closed:      { label: 'Fermé',     color: '#4B6358', bg: 'rgba(75,99,88,0.15)'    },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:    { label: 'Faible',  color: '#4B6358' },
  medium: { label: 'Moyen',   color: '#C8790A' },
  high:   { label: 'Urgent',  color: '#E05252' },
}

type Ticket = {
  id: string
  user_email: string
  user_name: string
  ticket_type: string
  subject: string
  message: string
  status: string
  priority: string
  admin_response: string | null
  created_at: string
  resolved_at: string | null
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: C.text2, bg: 'rgba(75,99,88,0.15)' }
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: cfg.bg, color: cfg.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      {cfg.label}
    </span>
  )
}

function PriorityDot({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] ?? { label: priority, color: C.text2 }
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function SupportTicketsPage() {
  const [tickets, setTickets]     = useState<Ticket[]>([])
  const [loading, setLoading]     = useState(true)
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [statusFilter,   setStatusFilter]   = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [typeFilter,     setTypeFilter]     = useState('')
  const [search,         setSearch]         = useState('')

  const [selected,  setSelected]  = useState<Ticket | null>(null)
  const [response,  setResponse]  = useState('')
  const [working,   setWorking]   = useState(false)
  const [actionMsg, setActionMsg] = useState('')
  const [actionErr, setActionErr] = useState('')

  const load = useCallback(async (p = page) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '20' })
    if (statusFilter)   params.set('status',   statusFilter)
    if (priorityFilter) params.set('priority', priorityFilter)
    if (typeFilter)     params.set('type',     typeFilter)
    if (search)         params.set('search',   search)
    try {
      const r = await fetch(`/api/admin/support/tickets?${params}`)
      const d = await r.json()
      setTickets(d.tickets ?? [])
      setTotal(d.count ?? 0)
      setTotalPages(d.totalPages ?? 1)
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, statusFilter, priorityFilter, typeFilter, search])

  useEffect(() => { load(1); setPage(1) }, [statusFilter, priorityFilter, typeFilter]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(page) }, [page]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(1); setPage(1) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openTicket(t: Ticket) {
    setSelected(t)
    setResponse('')
    setActionMsg('')
    setActionErr('')
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setWorking(true)
    setActionErr('')
    setActionMsg('')
    const res = await fetch(`/api/admin/support/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      await load(page)
      setSelected(prev => prev?.id === id ? { ...prev, ...body } as Ticket : prev)
    } else {
      const d = await res.json()
      setActionErr(d.error ?? 'Erreur')
    }
    setWorking(false)
    return res.ok
  }

  async function sendResponse() {
    if (!selected || !response.trim()) return
    const ok = await patch(selected.id, { admin_response: response.trim() })
    if (ok) {
      setActionMsg('Réponse envoyée par email')
      setResponse('')
    }
  }

  async function resolve() {
    if (!selected) return
    const ok = await patch(selected.id, { status: 'resolved' })
    if (ok) setActionMsg('Ticket marqué résolu')
  }

  async function setInProgress() {
    if (!selected) return
    const ok = await patch(selected.id, { status: 'in_progress' })
    if (ok) setActionMsg('Statut mis à jour')
  }

  async function setHighPriority() {
    if (!selected) return
    const ok = await patch(selected.id, { priority: 'high' })
    if (ok) setActionMsg('Priorité haute définie')
  }

  const inputSt: React.CSSProperties = {
    background: C.input, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8,
    padding: '7px 11px', fontSize: 12, color: C.text, fontFamily: 'Inter, sans-serif',
    outline: 'none',
  }

  const filterBtn = (active: boolean, label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
        fontFamily: 'Inter, sans-serif', cursor: 'pointer',
        background: active ? 'rgba(47,84,70,0.3)' : 'transparent',
        border: `1px solid ${active ? C.green : 'rgba(255,255,255,0.1)'}`,
        color: active ? C.text : C.text2,
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>
          Support {!loading && <span style={{ fontSize: 14, fontWeight: 500, color: C.text2, marginLeft: 8 }}>{total} ticket{total !== 1 ? 's' : ''}</span>}
        </h1>
      </div>

      {/* Filters */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <input
          style={{ ...inputSt, width: 200 }}
          placeholder="Rechercher…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { load(1); setPage(1) } }}
        />
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {filterBtn(statusFilter === '', 'Tous',      () => setStatusFilter(''))}
          {filterBtn(statusFilter === 'open',        'Ouvert',   () => setStatusFilter('open'))}
          {filterBtn(statusFilter === 'in_progress', 'En cours', () => setStatusFilter('in_progress'))}
          {filterBtn(statusFilter === 'resolved',    'Résolu',   () => setStatusFilter('resolved'))}
          {filterBtn(statusFilter === 'closed',      'Fermé',    () => setStatusFilter('closed'))}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {filterBtn(priorityFilter === '',       'Toutes priorités', () => setPriorityFilter(''))}
          {filterBtn(priorityFilter === 'high',   'Urgent',           () => setPriorityFilter('high'))}
          {filterBtn(priorityFilter === 'medium', 'Moyen',            () => setPriorityFilter('medium'))}
          {filterBtn(priorityFilter === 'low',    'Faible',           () => setPriorityFilter('low'))}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {filterBtn(typeFilter === '',        'Tous types',  () => setTypeFilter(''))}
          {filterBtn(typeFilter === 'bug',     'Bug',         () => setTypeFilter('bug'))}
          {filterBtn(typeFilter === 'feature', 'Suggestion',  () => setTypeFilter('feature'))}
          {filterBtn(typeFilter === 'billing', 'Facturation', () => setTypeFilter('billing'))}
          {filterBtn(typeFilter === 'general', 'Question',    () => setTypeFilter('general'))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ color: C.text2, fontSize: 13, padding: 24 }}>Chargement…</p>
        ) : tickets.length === 0 ? (
          <p style={{ color: C.text2, fontSize: 13, padding: 24 }}>Aucun ticket</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Nom', 'Email', 'Type', 'Sujet', 'Statut', 'Priorité', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>{t.user_name}</td>
                    <td style={{ padding: '10px 14px', color: C.text2, fontSize: 12 }}>{t.user_email}</td>
                    <td style={{ padding: '10px 14px', color: C.text2 }}>{TYPE_LABELS[t.ticket_type] ?? t.ticket_type}</td>
                    <td style={{ padding: '10px 14px', color: C.text, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</td>
                    <td style={{ padding: '10px 14px' }}><StatusPill status={t.status} /></td>
                    <td style={{ padding: '10px 14px' }}><PriorityDot priority={t.priority} /></td>
                    <td style={{ padding: '10px 14px', color: C.text2, fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(t.created_at)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        onClick={() => openTicket(t)}
                        style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text2, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                      >
                        Ouvrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '14px 0', borderTop: `1px solid ${C.border}` }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '5px 14px', borderRadius: 6, background: 'transparent', border: `1px solid ${C.border}`, color: page === 1 ? C.text2 : C.text, fontSize: 12, cursor: page === 1 ? 'default' : 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              ← Précédent
            </button>
            <span style={{ fontSize: 12, color: C.text2 }}>Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '5px 14px', borderRadius: 6, background: 'transparent', border: `1px solid ${C.border}`, color: page === totalPages ? C.text2 : C.text, fontSize: 12, cursor: page === totalPages ? 'default' : 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              Suivant →
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background: C.card, border: `1px solid ${C.green}`, borderRadius: 16, padding: 28, width: '100%', maxWidth: 580, maxHeight: '92vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>{selected.subject}</h2>
                <p style={{ fontSize: 12, color: C.text2 }}>{selected.user_name} · {selected.user_email}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: C.text2, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <StatusPill status={selected.status} />
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'rgba(75,99,88,0.15)', color: PRIORITY_CONFIG[selected.priority]?.color ?? C.text2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {PRIORITY_CONFIG[selected.priority]?.label ?? selected.priority}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'rgba(75,99,88,0.15)', color: C.text2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {TYPE_LABELS[selected.ticket_type] ?? selected.ticket_type}
              </span>
              <span style={{ fontSize: 10, color: C.text2, padding: '3px 0' }}>{fmtDate(selected.created_at)}</span>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Message</p>
              <p style={{ fontSize: 13, color: C.text, lineHeight: 1.65, whiteSpace: 'pre-wrap', background: C.input, borderRadius: 8, padding: '10px 12px' }}>{selected.message}</p>
            </div>

            {/* Previous response */}
            {selected.admin_response && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.greenL, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Réponse précédente</p>
                <p style={{ fontSize: 13, color: C.text, lineHeight: 1.65, whiteSpace: 'pre-wrap', background: 'rgba(74,140,111,0.08)', borderRadius: 8, padding: '10px 12px', border: `1px solid rgba(74,140,111,0.2)` }}>{selected.admin_response}</p>
              </div>
            )}

            {/* Response textarea */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                {selected.admin_response ? 'Nouvelle réponse' : 'Réponse'}
              </p>
              <textarea
                style={{ width: '100%', boxSizing: 'border-box', background: C.input, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: C.text, fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'vertical', minHeight: 90 }}
                placeholder="Tape ta réponse ici…"
                value={response}
                onChange={e => { setResponse(e.target.value); setActionMsg(''); setActionErr('') }}
              />
            </div>

            {actionErr && <p style={{ color: C.error, fontSize: 12, marginBottom: 10 }}>{actionErr}</p>}
            {actionMsg && <p style={{ color: C.greenL, fontSize: 12, marginBottom: 10 }}>✓ {actionMsg}</p>}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={sendResponse}
                disabled={working || !response.trim()}
                style={{ padding: '9px 16px', borderRadius: 8, background: response.trim() ? C.greenL : 'rgba(74,140,111,0.2)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: working || !response.trim() ? 'default' : 'pointer' }}
              >
                {working ? '…' : 'Répondre — envoyer email'}
              </button>
              {selected.status !== 'resolved' && selected.status !== 'closed' && (
                <button
                  onClick={resolve}
                  disabled={working}
                  style={{ padding: '9px 16px', borderRadius: 8, background: 'rgba(74,140,111,0.1)', border: `1px solid rgba(74,140,111,0.3)`, color: C.greenL, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: working ? 'wait' : 'pointer' }}
                >
                  Marquer résolu
                </button>
              )}
              {selected.status === 'open' && (
                <button
                  onClick={setInProgress}
                  disabled={working}
                  style={{ padding: '9px 16px', borderRadius: 8, background: 'rgba(200,121,10,0.1)', border: `1px solid rgba(200,121,10,0.3)`, color: C.amber, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: working ? 'wait' : 'pointer' }}
                >
                  En cours
                </button>
              )}
              {selected.priority !== 'high' && (
                <button
                  onClick={setHighPriority}
                  disabled={working}
                  style={{ padding: '9px 16px', borderRadius: 8, background: 'rgba(224,82,82,0.1)', border: `1px solid rgba(224,82,82,0.25)`, color: C.error, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: working ? 'wait' : 'pointer' }}
                >
                  Priorité haute
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
