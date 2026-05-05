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

type Commission = {
  id: string
  referrer_id: string
  referrer_name: string
  referred_id: string
  referred_name: string
  level: number
  amount: number
  month: string
  status: 'pending' | 'paid'
  paid_at: string | null
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function getLast6Months(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(d.toISOString().slice(0, 7))
  }
  return months
}

function exportCSV(commissions: Commission[]) {
  const rows = [
    ['Période', 'Affilié', 'Bénéficiaire', 'Niveau', 'Montant', 'Statut'],
    ...commissions.map(c => [c.month, c.referrer_name, c.referred_name, String(c.level), String(c.amount), c.status]),
  ]
  const csv = rows.map(r => r.join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `commissions-${new Date().toISOString().slice(0, 7)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading]   = useState(true)
  const [monthFilter, setMonthFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'pending' | 'paid'>('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [working, setWorking]   = useState(false)

  const months = getLast6Months()

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/admin/affiliations/list')
    const d = await r.json()
    const raw: Commission[] = (d.commissions ?? []).map((c: Record<string, unknown>) => ({
      id:            c.id as string,
      referrer_id:   c.affiliate_id as string,
      referrer_name: c.affiliate_name as string,
      referred_id:   '',
      referred_name: '',
      level:         1,
      amount:        Number(c.amount ?? 0),
      month:         c.month as string,
      status:        c.status as 'pending' | 'paid',
      paid_at:       (c.paid_at as string | null) ?? null,
    }))
    setCommissions(raw)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = commissions.filter(c => {
    if (monthFilter && c.month !== monthFilter) return false
    if (statusFilter && c.status !== statusFilter) return false
    return true
  })

  const pendingTotal = filtered.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0)
  const paidMonthly  = filtered.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0)

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    const pendingIds = filtered.filter(c => c.status === 'pending').map(c => c.id)
    if (selected.size === pendingIds.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(pendingIds))
    }
  }

  async function markPaid(ids: string[]) {
    setWorking(true)
    await Promise.all(ids.map(id =>
      fetch('/api/admin/commissions/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionId: id }),
      })
    ))
    setSelected(new Set())
    await load()
    setWorking(false)
  }

  const inputSt: React.CSSProperties = {
    background: C.input, border: `1px solid rgba(255,255,255,0.1)`,
    borderRadius: 8, padding: '8px 12px', fontSize: 12,
    color: C.text, fontFamily: 'Inter, sans-serif', outline: 'none',
  }

  const btnPrimary: React.CSSProperties = {
    padding: '9px 18px', borderRadius: 8, background: C.green,
    border: 'none', color: C.text, fontSize: 13, fontWeight: 600,
    fontFamily: 'Inter, sans-serif', cursor: 'pointer',
  }

  const btnGhost: React.CSSProperties = {
    ...btnPrimary, background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)', color: C.text2,
  }

  const pendingRows = filtered.filter(c => c.status === 'pending')

  const action = (
    <div style={{ display: 'flex', gap: 8 }}>
      {selected.size > 0 && (
        <button
          style={{ ...btnPrimary, background: C.greenL }}
          onClick={() => markPaid(Array.from(selected))}
          disabled={working}
        >
          Marquer {selected.size} payée{selected.size > 1 ? 's' : ''}
        </button>
      )}
      <button style={btnGhost} onClick={() => exportCSV(filtered)}>
        Exporter CSV
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: C.bg }}>
      <AdminHeader title="Commissions" action={action} />

      <div style={{ padding: '28px 40px', maxWidth: 1100 }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} style={inputSt}>
            <option value="">Tous les mois</option>
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as '' | 'pending' | 'paid')} style={inputSt}>
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="paid">Payé</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.text2 }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.text2 }}>Aucune commission</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: '12px 16px', width: 32 }}>
                    <input
                      type="checkbox"
                      checked={selected.size === pendingRows.length && pendingRows.length > 0}
                      onChange={toggleAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  {['Période', 'Affilié', 'Niveau', 'Montant', 'Statut', 'Date paiement', ''].map(h => (
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
                      {c.status === 'pending' && (
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: C.text2 }}>{c.month}</td>
                    <td style={{ padding: '12px 16px', color: C.text, fontWeight: 500 }}>{c.referrer_name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 10, background: 'rgba(47,84,70,0.2)', color: C.greenL, padding: '2px 7px', borderRadius: 6, fontWeight: 700 }}>
                        N{c.level}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: C.text }}>{fmtEur(c.amount)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10,
                        background: c.status === 'paid' ? 'rgba(47,84,70,0.25)' : 'rgba(200,121,10,0.2)',
                        color: c.status === 'paid' ? C.greenL : C.amber,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>
                        {c.status === 'paid' ? 'Payée' : 'En attente'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: C.text2, fontSize: 12 }}>
                      {c.paid_at ? new Date(c.paid_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {c.status === 'pending' && (
                        <button
                          onClick={() => markPaid([c.id])}
                          disabled={working}
                          style={{
                            padding: '5px 12px', borderRadius: 6,
                            background: 'rgba(47,84,70,0.2)',
                            border: `1px solid ${C.green}`,
                            color: C.greenL, fontSize: 11, fontWeight: 600,
                            fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                          }}
                        >
                          {working ? '…' : 'Marquer payée'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 24px', flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.amber, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Total en attente
            </p>
            <p style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{fmtEur(pendingTotal)}</p>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 24px', flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.greenL, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Total payé (sélection)
            </p>
            <p style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{fmtEur(paidMonthly)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
