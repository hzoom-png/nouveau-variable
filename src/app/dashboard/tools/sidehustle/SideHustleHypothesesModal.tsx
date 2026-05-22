'use client'

import { useState, useMemo } from 'react'

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Hypotheses {
  price: number
  conv: number
  lifetime: number
  cac: number
  fixed: number
}

interface Limits {
  price:    { min: number; max: number }
  conv:     { min: number; max: number }
  lifetime: { min: number; max: number }
  cac:      { min: number; max: number }
  fixed:    { min: number; max: number }
}

interface SliderConfig {
  key: keyof Hypotheses
  label: string
  fmt: (v: number) => string
  step: number
}

/* ── Constants ──────────────────────────────────────────────────────────── */
const SLIDERS: SliderConfig[] = [
  { key: 'price',    label: 'Prix moyen',            fmt: v => `${v}€/mois`, step: 1    },
  { key: 'conv',     label: 'Taux de conversion',    fmt: v => `${v}%`,      step: 0.5  },
  { key: 'lifetime', label: 'Durée client',           fmt: v => `${v} mois`,  step: 1    },
  { key: 'cac',      label: "Coût d'acquisition",    fmt: v => `${v}€`,      step: 10   },
  { key: 'fixed',    label: 'Charge fixe / mois',    fmt: v => `${v}€`,      step: 50   },
]

const DEFAULT_HYPOTHESES: Hypotheses = {
  price: 49, conv: 2, lifetime: 12, cac: 300, fixed: 1500,
}

const DEFAULT_LIMITS: Limits = {
  price:    { min: 9,   max: 499   },
  conv:     { min: 0.5, max: 20    },
  lifetime: { min: 1,   max: 48    },
  cac:      { min: 0,   max: 5000  },
  fixed:    { min: 0,   max: 10000 },
}

/* ── Forecast computation ───────────────────────────────────────────────── */
function computeForecasts(price: number, conv: number, lifetime: number, cac: number, fixed: number) {
  const budget = fixed * 0.35
  const baseNew = Math.max(0.5, budget / cac)
  let customers = 0
  const all: { m: number; mrr: number; cumul: number }[] = []
  let cumul = 0
  for (let m = 1; m <= 24; m++) {
    if (m === 1) { all.push({ m, mrr: 0, cumul: 0 }); continue }
    const newCust = baseNew * (1 + (m - 2) * 0.1) * (conv / 2)
    const churn   = customers / (lifetime * 1.2)
    customers = Math.max(0, customers + newCust - churn)
    const mrr = Math.round(customers) * price
    cumul += mrr
    all.push({ m, mrr, cumul })
  }
  return [1, 2, 3, 6, 12, 24].map(m => {
    const d = all.find(x => x.m === m)!
    const status =
      d.mrr === 0              ? 'Développement'
      : d.mrr < fixed * 0.3   ? 'Lancement'
      : d.mrr < fixed         ? 'Croissance'
      : d.mrr < fixed * 2     ? 'Scaling'
      :                          'Rentable'
    return { ...d, status }
  })
}

/* ── EditableValue (click label to type) ────────────────────────────────── */
function EditableValue({ value, fmt, onSave }: { value: number; fmt: (v: number) => string; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState('')

  const commit = (raw: string) => {
    setEditing(false)
    const n = parseFloat(raw)
    if (!isNaN(n)) onSave(n)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => commit(val)}
        onKeyDown={e => { if (e.key === 'Enter') commit(val); if (e.key === 'Escape') setEditing(false) }}
        style={{ width: 74, fontSize: 13, fontWeight: 700, padding: '2px 6px', border: '1.5px solid var(--green)', borderRadius: 4, outline: 'none', fontFamily: 'inherit', color: 'var(--green)', textAlign: 'right', background: 'var(--green-3)' }}
      />
    )
  }
  return (
    <span
      onClick={() => { setEditing(true); setVal(String(value)) }}
      title="Cliquer pour modifier"
      style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', cursor: 'text', padding: '2px 6px', borderRadius: 4, transition: 'background .12s' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--green-3)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {fmt(value)}
    </span>
  )
}

/* ── EditableLimit (click min/max to type) ──────────────────────────────── */
function EditableLimit({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState('')

  const commit = (raw: string) => {
    setEditing(false)
    const n = parseFloat(raw)
    if (!isNaN(n)) onSave(n)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => commit(val)}
        onKeyDown={e => { if (e.key === 'Enter') commit(val); if (e.key === 'Escape') setEditing(false) }}
        style={{ width: 44, fontSize: 10, padding: '1px 4px', border: '1px solid var(--green)', borderRadius: 3, outline: 'none', fontFamily: 'inherit', color: 'var(--green)', textAlign: 'center' }}
      />
    )
  }
  return (
    <span
      onClick={() => { setEditing(true); setVal(String(value)) }}
      title="Cliquer pour modifier la borne"
      style={{ fontSize: 10, color: 'var(--text-3)', cursor: 'pointer', padding: '1px 3px', transition: 'color .1s' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--green)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
    >
      {value}
    </span>
  )
}

/* ── ForecastChart (bar chart modal) ────────────────────────────────────── */
function ForecastChart({ price, conv, lifetime, cac, fixed, onClose }: {
  price: number; conv: number; lifetime: number; cac: number; fixed: number; onClose: () => void
}) {
  const months: number[] = []
  let customers = 0
  const budget = fixed * 0.35
  const baseNew = Math.max(0.5, budget / cac)
  for (let m = 1; m <= 12; m++) {
    if (m === 1) { months.push(0); continue }
    const newCust = baseNew * (1 + (m - 2) * 0.1) * (conv / 2)
    const churn   = customers / (lifetime * 1.2)
    customers = Math.max(0, customers + newCust - churn)
    months.push(Math.round(customers) * price)
  }
  const maxVal = Math.max(1, ...months)

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(1,39,34,.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', borderRadius: 'var(--r-lg)', padding: '28px 32px', width: 'min(560px, 94vw)', boxShadow: '0 24px 64px rgba(0,0,0,.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>Évolution MRR — 12 mois</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-3)', padding: 4 }}>✕</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, marginBottom: 6 }}>
          {months.map((v, i) => (
            <div key={i} style={{
              flex: 1,
              height: `${Math.max(3, (v / maxVal) * 130)}px`,
              background: v > fixed ? 'var(--green)' : v > 0 ? `rgba(54,166,79,${(0.3 + (v / maxVal) * 0.7).toFixed(2)})` : 'var(--border)',
              borderRadius: '3px 3px 0 0',
              transition: 'height .5s',
              position: 'relative',
            }}>
              {v > fixed && (
                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: 'var(--green)' }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          {Array.from({ length: 12 }, (_, i) => `M${i + 1}`).map(m => (
            <span key={m} style={{ fontSize: 9, color: 'var(--text-3)' }}>{m}</span>
          ))}
        </div>
        <div style={{ padding: '12px 16px', background: 'var(--surface)', borderRadius: 'var(--r-md)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>
            Basé sur <strong style={{ color: 'var(--text)' }}>{price}€/mois</strong>, taux de conversion <strong style={{ color: 'var(--text)' }}>{conv}%</strong>, CAC <strong style={{ color: 'var(--text)' }}>{cac}€</strong>.
            {months[11] > fixed && <span style={{ color: 'var(--green)' }}> Seuil de rentabilité atteint ✓</span>}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Main modal ─────────────────────────────────────────────────────────── */
export default function SideHustleHypothesesModal({ onClose }: { onClose: () => void }) {
  const [hyp, setHyp] = useState<Hypotheses>(DEFAULT_HYPOTHESES)
  const [limits, setLimits] = useState<Limits>(DEFAULT_LIMITS)
  const [showChart, setShowChart] = useState(false)

  const forecasts = useMemo(
    () => computeForecasts(hyp.price, hyp.conv, hyp.lifetime, hyp.cac, hyp.fixed),
    [hyp]
  )

  const updateHyp = (key: keyof Hypotheses, raw: number) => {
    const lim = limits[key]
    const v = Math.min(lim.max, Math.max(lim.min, raw))
    setHyp(prev => ({ ...prev, [key]: v }))
  }

  const updateLimit = (key: keyof Limits, bound: 'min' | 'max', raw: number) => {
    setLimits(prev => ({ ...prev, [key]: { ...prev[key], [bound]: raw } }))
    if (bound === 'min' && hyp[key] < raw) setHyp(prev => ({ ...prev, [key]: raw }))
    if (bound === 'max' && hyp[key] > raw) setHyp(prev => ({ ...prev, [key]: raw }))
  }

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .sh-hyp-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(1,39,34,.5)', zIndex: 200 }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'min(920px, 96vw)', maxHeight: '88vh',
        background: 'var(--white)', borderRadius: 'var(--r-lg)',
        boxShadow: '0 20px 60px rgba(0,0,0,.16)', zIndex: 201,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
            Prévisionnel financier — Modulable
          </h2>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 16, color: 'var(--text-2)', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div className="sh-hyp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* ── LEFT: Sliders ── */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: '20px 22px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 22 }}>
                Hypothèses clés
              </p>

              {SLIDERS.map(({ key, label, fmt, step }) => {
                const lim = limits[key]
                const value = hyp[key]
                return (
                  <div key={key} style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
                      <EditableValue value={value} fmt={fmt} onSave={v => updateHyp(key, v)} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <EditableLimit value={lim.min} onSave={v => updateLimit(key, 'min', v)} />
                      <input
                        type="range"
                        min={lim.min}
                        max={lim.max}
                        step={step}
                        value={value}
                        onChange={e => updateHyp(key, Number(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--green)', cursor: 'pointer' }}
                      />
                      <EditableLimit value={lim.max} onSave={v => updateLimit(key, 'max', v)} />
                    </div>
                  </div>
                )
              })}

              <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5, marginTop: 4 }}>
                Clique sur une valeur ou une borne pour la modifier directement.
              </p>
            </div>

            {/* ── RIGHT: Forecast table ── */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: '20px 22px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>
                Prévisions (mise à jour en temps réel)
              </p>

              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'var(--white)' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 1fr 88px', background: 'var(--green-3)' }}>
                  {['Mois', 'MRR', 'Cumul', 'Statut'].map(h => (
                    <div key={h} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                      {h}
                    </div>
                  ))}
                </div>
                {/* Rows */}
                {forecasts.map((row, i) => {
                  const statusColor =
                    row.status === 'Rentable'       ? 'var(--green)'
                    : row.status === 'Développement' ? 'var(--text-3)'
                    :                                  'var(--text-2)'
                  const statusBg =
                    row.status === 'Rentable'       ? 'var(--green-3)'
                    : row.status === 'Développement' ? 'rgba(0,0,0,.04)'
                    :                                  'rgba(47,84,70,.07)'
                  return (
                    <div key={row.m} style={{ display: 'grid', gridTemplateColumns: '44px 1fr 1fr 88px', borderTop: '1px solid var(--border)', background: i % 2 ? 'var(--surface)' : 'var(--white)', transition: 'background .15s' }}>
                      <div style={{ padding: '10px', fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>M{row.m}</div>
                      <div style={{ padding: '10px', fontSize: 12, fontWeight: 700, color: row.mrr > 0 ? 'var(--green)' : 'var(--text-3)', transition: 'color .3s' }}>
                        {row.mrr.toLocaleString('fr-FR')} €
                      </div>
                      <div style={{ padding: '10px', fontSize: 12, color: 'var(--text-2)', transition: 'color .3s' }}>
                        {row.cumul > 0 ? `${row.cumul.toLocaleString('fr-FR')} €` : '—'}
                      </div>
                      <div style={{ padding: '10px' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: statusBg, color: statusColor, transition: 'background .3s, color .3s', whiteSpace: 'nowrap' }}>
                          {row.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => setShowChart(true)}
                style={{ marginTop: 14, width: '100%', padding: '10px', background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', transition: 'border-color .15s, color .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
              >
                Voir le graphique détaillé →
              </button>
            </div>
          </div>
        </div>
      </div>

      {showChart && (
        <ForecastChart
          price={hyp.price} conv={hyp.conv} lifetime={hyp.lifetime}
          cac={hyp.cac} fixed={hyp.fixed}
          onClose={() => setShowChart(false)}
        />
      )}
    </>
  )
}
