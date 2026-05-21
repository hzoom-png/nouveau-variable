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

type CommissionRequest = {
  id: string
  month_year: string
  status: 'pending' | 'facture_recue' | 'validee' | 'payee' | 'rejetee'
  revenue_earned: number | null
  commission_amount: number | null
  submitted_at: string | null
  validated_at: string | null
  payment_date: string | null
  payment_reference: string | null
  admin_notes: string | null
  rejection_reason: string | null
  facture_url: string | null
  affiliate: { id: string; prenom: string; nom: string; email: string } | null
}

type StatusFilter = '' | 'facture_recue' | 'validee' | 'payee' | 'rejetee'

const STATUS_LABELS: Record<string, string> = {
  pending:       'En attente',
  facture_recue: 'Facture reçue',
  validee:       'Validée',
  payee:         'Payée',
  rejetee:       'Rejetée',
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:       { bg: 'rgba(200,121,10,0.15)', color: '#C8790A' },
  facture_recue: { bg: 'rgba(74,140,111,0.2)',  color: '#4A8C6F' },
  validee:       { bg: 'rgba(75,123,245,0.2)',  color: '#4B7BF5' },
  payee:         { bg: 'rgba(47,84,70,0.3)',    color: '#4A8C6F' },
  rejetee:       { bg: 'rgba(224,82,82,0.2)',   color: '#E05252' },
}

function fmtEur(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('fr-FR')
}

type Modal =
  | { type: 'validate'; request: CommissionRequest }
  | { type: 'reject';   request: CommissionRequest }
  | { type: 'pay';      request: CommissionRequest }

export default function CommissionsPage() {
  const [items, setItems]           = useState<CommissionRequest[]>([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('facture_recue')
  const [offset, setOffset]         = useState(0)
  const [modal, setModal]           = useState<Modal | null>(null)
  const [working, setWorking]       = useState(false)

  // Validate form state
  const [validateAmount, setValidateAmount] = useState('')
  const [validateNotes, setValidateNotes]   = useState('')
  // Reject form state
  const [rejectReason, setRejectReason]     = useState('')
  // Pay form state
  const [payRef, setPayRef]                 = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ offset: String(offset) })
    if (statusFilter) params.set('status', statusFilter)
    const r = await fetch(`/api/admin/commissions/list?${params}`)
    const d = await r.json()
    setItems(d.items ?? [])
    setTotal(d.total ?? 0)
    setLoading(false)
  }, [statusFilter, offset])

  useEffect(() => { load() }, [load])

  function openValidate(req: CommissionRequest) {
    setValidateAmount(String(req.revenue_earned ?? ''))
    setValidateNotes('')
    setModal({ type: 'validate', request: req })
  }
  function openReject(req: CommissionRequest) {
    setRejectReason('')
    setModal({ type: 'reject', request: req })
  }
  function openPay(req: CommissionRequest) {
    setPayRef('')
    setModal({ type: 'pay', request: req })
  }

  async function submitValidate() {
    if (!modal || modal.type !== 'validate') return
    const amount = parseFloat(validateAmount)
    if (isNaN(amount) || amount <= 0) return
    setWorking(true)
    await fetch(`/api/admin/commissions/${modal.request.id}/validate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commission_amount: amount, admin_notes: validateNotes }),
    })
    setModal(null)
    await load()
    setWorking(false)
  }

  async function submitReject() {
    if (!modal || modal.type !== 'reject' || !rejectReason.trim()) return
    setWorking(true)
    await fetch(`/api/admin/commissions/${modal.request.id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejection_reason: rejectReason }),
    })
    setModal(null)
    await load()
    setWorking(false)
  }

  async function submitPay() {
    if (!modal || modal.type !== 'pay' || !payRef.trim()) return
    setWorking(true)
    await fetch(`/api/admin/commissions/${modal.request.id}/mark-paid`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_reference: payRef }),
    })
    setModal(null)
    await load()
    setWorking(false)
  }

  const pendingTotal  = items.filter(i => i.status === 'facture_recue').reduce((s, i) => s + (i.revenue_earned ?? 0), 0)
  const validatedTotal = items.filter(i => i.status === 'validee').reduce((s, i) => s + (i.commission_amount ?? 0), 0)

  const inputSt: React.CSSProperties = {
    background: C.input, border: `1px solid rgba(255,255,255,0.1)`,
    borderRadius: 8, padding: '8px 12px', fontSize: 13,
    color: C.text, fontFamily: 'Inter, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box',
  }
  const btnPrimary: React.CSSProperties = {
    padding: '9px 18px', borderRadius: 8, background: C.green,
    border: 'none', color: C.text, fontSize: 13, fontWeight: 600,
    fontFamily: 'Inter, sans-serif', cursor: 'pointer',
  }
  const btnDanger: React.CSSProperties = {
    ...btnPrimary, background: 'rgba(224,82,82,0.2)', border: `1px solid ${C.error}`, color: C.error,
  }
  const btnGhost: React.CSSProperties = {
    ...btnPrimary, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: C.text2,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: C.bg }}>
      <AdminHeader title="Commissions" />

      <div style={{ padding: '28px 40px', maxWidth: 1200 }}>
        {/* Filtres */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['', 'facture_recue', 'validee', 'payee', 'rejetee'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setOffset(0) }}
              style={{
                ...btnGhost,
                ...(statusFilter === s ? { background: C.green, color: C.text, border: `1px solid ${C.green}` } : {}),
                fontSize: 12,
              }}
            >
              {s === '' ? 'Toutes' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.text2 }}>Chargement…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.text2 }}>Aucune demande</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Affilié', 'Mois', 'Montant déclaré', 'À payer', 'Statut', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(req => {
                  const sc = STATUS_COLORS[req.status] ?? STATUS_COLORS.pending
                  return (
                    <tr key={req.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: C.text }}>
                          {req.affiliate ? `${req.affiliate.prenom} ${req.affiliate.nom}` : '—'}
                        </div>
                        <div style={{ fontSize: 11, color: C.text2 }}>{req.affiliate?.email ?? ''}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: C.text2 }}>{req.month_year}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: C.text }}>{fmtEur(req.revenue_earned)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: C.greenL }}>{fmtEur(req.commission_amount)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, letterSpacing: '0.06em', textTransform: 'uppercase', background: sc.bg, color: sc.color }}>
                          {STATUS_LABELS[req.status] ?? req.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: C.text2, fontSize: 12 }}>
                        {fmtDate(req.submitted_at)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {req.facture_url && (
                            <a
                              href={req.facture_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: C.text2, fontSize: 11, fontWeight: 600, textDecoration: 'none' }}
                            >
                              PDF
                            </a>
                          )}
                          {req.status === 'facture_recue' && (
                            <>
                              <button onClick={() => openValidate(req)} style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(47,84,70,0.2)', border: `1px solid ${C.green}`, color: C.greenL, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                Valider
                              </button>
                              <button onClick={() => openReject(req)} style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(224,82,82,0.1)', border: `1px solid ${C.error}`, color: C.error, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                Rejeter
                              </button>
                            </>
                          )}
                          {req.status === 'validee' && (
                            <button onClick={() => openPay(req)} style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(75,123,245,0.2)', border: '1px solid #4B7BF5', color: '#4B7BF5', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                              Marquer payé
                            </button>
                          )}
                          {req.status === 'payee' && req.payment_reference && (
                            <span style={{ fontSize: 11, color: C.text2 }}>Réf: {req.payment_reference}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <button onClick={() => setOffset(Math.max(0, offset - 20))} disabled={offset === 0} style={btnGhost}>← Précédent</button>
            <span style={{ color: C.text2, fontSize: 13, alignSelf: 'center' }}>{offset + 1}–{Math.min(offset + 20, total)} sur {total}</span>
            <button onClick={() => setOffset(offset + 20)} disabled={offset + 20 >= total} style={btnGhost}>Suivant →</button>
          </div>
        )}

        {/* Totaux */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 24px', flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.amber, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Factures à valider</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{fmtEur(pendingTotal)}</p>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 24px', flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#4B7BF5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Validées, à payer</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{fmtEur(validatedTotal)}</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div
          onClick={() => setModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, width: 420, maxWidth: '90vw' }}
          >
            {modal.type === 'validate' && (
              <>
                <h3 style={{ color: C.text, margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>Valider la commission</h3>
                <p style={{ color: C.text2, fontSize: 13, margin: '0 0 20px' }}>
                  {modal.request.affiliate?.prenom} — {modal.request.month_year}
                  <br />Montant déclaré : {fmtEur(modal.request.revenue_earned)}
                </p>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: C.text2, fontWeight: 600, display: 'block', marginBottom: 6 }}>MONTANT À VERSER (€)</label>
                  <input type="number" step="0.01" value={validateAmount} onChange={e => setValidateAmount(e.target.value)} style={inputSt} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, color: C.text2, fontWeight: 600, display: 'block', marginBottom: 6 }}>NOTES ADMIN (optionnel)</label>
                  <textarea value={validateNotes} onChange={e => setValidateNotes(e.target.value)} rows={3} style={{ ...inputSt, resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setModal(null)} style={btnGhost}>Annuler</button>
                  <button onClick={submitValidate} disabled={working} style={btnPrimary}>{working ? '…' : 'Valider'}</button>
                </div>
              </>
            )}

            {modal.type === 'reject' && (
              <>
                <h3 style={{ color: C.error, margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>Rejeter la demande</h3>
                <p style={{ color: C.text2, fontSize: 13, margin: '0 0 20px' }}>
                  {modal.request.affiliate?.prenom} — {modal.request.month_year}
                </p>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, color: C.text2, fontWeight: 600, display: 'block', marginBottom: 6 }}>RAISON DU REJET</label>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} placeholder="Ex: Montant déclaré ne correspond pas à la facture…" style={{ ...inputSt, resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setModal(null)} style={btnGhost}>Annuler</button>
                  <button onClick={submitReject} disabled={working || !rejectReason.trim()} style={btnDanger}>{working ? '…' : 'Rejeter'}</button>
                </div>
              </>
            )}

            {modal.type === 'pay' && (
              <>
                <h3 style={{ color: C.text, margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>Marquer comme payé</h3>
                <p style={{ color: C.text2, fontSize: 13, margin: '0 0 20px' }}>
                  {modal.request.affiliate?.prenom} — {modal.request.month_year}
                  <br />Montant : {fmtEur(modal.request.commission_amount)}
                </p>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, color: C.text2, fontWeight: 600, display: 'block', marginBottom: 6 }}>RÉFÉRENCE VIREMENT</label>
                  <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Ex: VIR20260515-001" style={inputSt} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setModal(null)} style={btnGhost}>Annuler</button>
                  <button onClick={submitPay} disabled={working || !payRef.trim()} style={{ ...btnPrimary, background: '#4B7BF5', border: '1px solid #4B7BF5' }}>{working ? '…' : 'Confirmer paiement'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
