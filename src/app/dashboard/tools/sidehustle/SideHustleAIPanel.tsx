'use client'

import { useState, useEffect } from 'react'

type Assumption = {
  id: string
  category: string
  key: string
  value: string
  unit?: string | null
  initial_value?: string | null
  is_key: boolean
  order_index: number
}

type ForecastPeriod = {
  period: string
  mrr?: number
  cashflow: number
  status: 'negative' | 'breakeven' | 'positive'
}

type ForecastSummary = {
  total_revenue: number
  total_cost: number
  breakeven_month?: number | null
  final_status: string
}

type AiForecast = {
  id: string
  duration_months: number
  granularity: string
  forecast_data: ForecastPeriod[]
  forecast_summary: ForecastSummary
  generated_at: string
}

interface Props {
  projectId: string
  onClose: () => void
}

const STATUS_COLOR: Record<string, string> = {
  positive: 'var(--green)',
  negative: '#dc2626',
  breakeven: '#f59e0b',
}

export default function SideHustleAIPanel({ projectId, onClose }: Props) {
  const [tab, setTab]             = useState<'assumptions' | 'forecast'>('assumptions')
  const [assumptions, setAssumptions] = useState<Assumption[]>([])
  const [forecasts,   setForecasts]   = useState<AiForecast[]>([])
  const [loading,     setLoading]     = useState(true)
  const [generating,  setGenerating]  = useState(false)
  const [error,       setError]       = useState('')
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [duration,    setDuration]    = useState(12)
  const [granularity, setGranularity] = useState<'monthly' | 'quarterly' | 'annual'>('monthly')

  useEffect(() => {
    fetch(`/api/side-hustle/${projectId}`)
      .then(r => r.json())
      .then(d => {
        setAssumptions(d.assumptions ?? [])
        setForecasts(d.forecasts ?? [])
      })
      .catch(() => setError('Impossible de charger les données'))
      .finally(() => setLoading(false))
  }, [projectId])

  async function generateAssumptions() {
    setGenerating(true); setError('')
    try {
      const r = await fetch(`/api/side-hustle/${projectId}/assumptions/generate`, { method: 'POST' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Erreur')
      setAssumptions(d.assumptions ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur génération')
    } finally { setGenerating(false) }
  }

  async function updateAssumption(id: string, value: string) {
    try {
      const r = await fetch(`/api/side-hustle/${projectId}/assumptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Erreur')
      setAssumptions(prev => prev.map(a => a.id === id ? d.assumption : a))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur mise à jour')
    } finally { setEditingId(null) }
  }

  async function generateForecast() {
    setGenerating(true); setError('')
    try {
      const r = await fetch(`/api/side-hustle/${projectId}/forecasts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_months: duration, granularity }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Erreur')
      if (d.forecast) {
        setForecasts(prev => [d.forecast, ...prev.filter(f => !(f.duration_months === duration && f.granularity === granularity))])
      }
      setTab('forecast')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur génération prévisionnel')
    } finally { setGenerating(false) }
  }

  const byCategory: Record<string, Assumption[]> = {}
  for (const a of assumptions) {
    if (!byCategory[a.category]) byCategory[a.category] = []
    byCategory[a.category].push(a)
  }

  const activeForecast = forecasts.find(f => f.duration_months === duration && f.granularity === granularity) ?? forecasts[0] ?? null

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(1,39,34,.5)', zIndex: 200 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(720px, 94vw)', maxHeight: '86vh', background: 'var(--white)', borderRadius: 'var(--r-lg)', boxShadow: '0 20px 60px rgba(0,0,0,.14)', zIndex: 201, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Hypothèses & Prévisionnel</h2>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 16, color: 'var(--text-2)' }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {(['assumptions', 'forecast'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', transition: '.15s',
                color: tab === t ? 'var(--green)' : 'var(--text-3)',
                borderBottom: tab === t ? '2px solid var(--green)' : '2px solid transparent' }}>
              {t === 'assumptions'
                ? `Hypothèses${assumptions.length ? ` (${assumptions.length})` : ''}`
                : 'Prévisionnel IA'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 'var(--r-sm)', padding: '10px 14px', fontSize: 13, color: '#B91C1C', marginBottom: 16 }}>
              {error}
              <button onClick={() => setError('')} style={{ marginLeft: 10, fontSize: 12, color: '#B91C1C', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>Fermer</button>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)', fontSize: 14 }}>Chargement…</div>
          ) : tab === 'assumptions' ? (
            /* ── HYPOTHESES TAB ── */
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
                <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>Clique sur une valeur pour la modifier. ★ = hypothèse clé.</p>
                <button onClick={generateAssumptions} disabled={generating}
                  style={{ padding: '8px 16px', borderRadius: 'var(--r-full)', background: 'var(--green)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {generating ? 'Génération…' : assumptions.length ? '↺ Régénérer' : 'Générer les hypothèses'}
                </button>
              </div>

              {assumptions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>Aucune hypothèse générée</p>
                  <p style={{ fontSize: 13 }}>Claude va analyser ton projet et extraire les hypothèses financières clés.</p>
                </div>
              ) : (
                Object.entries(byCategory).map(([cat, rows]) => (
                  <div key={cat} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--green)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {cat}
                      <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-3)', textTransform: 'none' }}>{rows.length} hypothèse{rows.length > 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                      {rows.map((a, i) => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', background: a.is_key ? 'var(--green-3,#EAF2EE)' : 'transparent', gap: 10 }}>
                          <div style={{ flex: 1, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}>
                            {a.is_key && <span style={{ fontSize: 10, color: 'var(--green)', marginRight: 5 }}>★</span>}
                            {a.key}
                          </div>
                          {editingId === a.id ? (
                            <InlineInput
                              defaultValue={a.value}
                              unit={a.unit}
                              onSave={val => updateAssumption(a.id, val)}
                              onCancel={() => setEditingId(null)}
                            />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              {a.initial_value && a.initial_value !== a.value && (
                                <span style={{ fontSize: 11, color: 'var(--text-3)', textDecoration: 'line-through' }}>{a.initial_value}</span>
                              )}
                              <button onClick={() => setEditingId(a.id)}
                                style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px', borderRadius: 'var(--r-sm)', transition: '.1s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--green-3,#EAF2EE)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                {a.value}{a.unit ? ` ${a.unit}` : ''}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            /* ── FORECAST TAB ── */
            <>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                {/* Duration selector */}
                <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 'var(--r-sm)' }}>
                  {([12, 24, 36] as const).map(d => (
                    <button key={d} onClick={() => setDuration(d)}
                      style={{ padding: '5px 12px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', transition: '.15s', background: duration === d ? 'var(--white)' : 'transparent', color: duration === d ? 'var(--green)' : 'var(--text-3)', boxShadow: duration === d ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}>
                      {d}M
                    </button>
                  ))}
                </div>
                {/* Granularity selector */}
                <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 'var(--r-sm)' }}>
                  {(['monthly', 'quarterly', 'annual'] as const).map(g => (
                    <button key={g} onClick={() => setGranularity(g)}
                      style={{ padding: '5px 10px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', transition: '.15s', background: granularity === g ? 'var(--white)' : 'transparent', color: granularity === g ? 'var(--green)' : 'var(--text-3)', boxShadow: granularity === g ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}>
                      {g === 'monthly' ? 'Mensuel' : g === 'quarterly' ? 'Trimestriel' : 'Annuel'}
                    </button>
                  ))}
                </div>
                <button onClick={generateForecast} disabled={generating || assumptions.length === 0}
                  style={{ padding: '8px 16px', borderRadius: 'var(--r-full)', background: 'var(--green)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: (generating || assumptions.length === 0) ? 'not-allowed' : 'pointer', opacity: (generating || assumptions.length === 0) ? 0.6 : 1 }}>
                  {generating ? 'Génération…' : activeForecast ? '↺ Régénérer' : 'Générer le prévisionnel'}
                </button>
              </div>

              {assumptions.length === 0 && (
                <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 'var(--r-sm)', padding: '10px 14px', fontSize: 13, color: '#92400E', marginBottom: 16 }}>
                  Génère d&apos;abord les hypothèses dans l&apos;onglet &ldquo;Hypothèses&rdquo; avant de créer un prévisionnel.
                </div>
              )}

              {!activeForecast ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📈</div>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>Aucun prévisionnel généré</p>
                  <p style={{ fontSize: 13 }}>Sélectionne la durée et la granularité, puis clique sur &ldquo;Générer&rdquo;.</p>
                </div>
              ) : (
                <>
                  {/* KPI Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
                    {[
                      { label: 'Revenu total',  value: `${(activeForecast.forecast_summary?.total_revenue ?? 0).toLocaleString('fr-FR')} €` },
                      { label: 'Coûts totaux',  value: `${(activeForecast.forecast_summary?.total_cost ?? 0).toLocaleString('fr-FR')} €` },
                      { label: 'Rentabilité',   value: activeForecast.forecast_summary?.breakeven_month ? `Mois ${activeForecast.forecast_summary.breakeven_month}` : 'Non atteinte' },
                    ].map(kpi => (
                      <div key={kpi.label} style={{ background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{kpi.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)' }}>{kpi.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Forecast table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: 'var(--surface)' }}>
                          {['Période', 'MRR', 'Cashflow', 'Status'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeForecast.forecast_data.map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '7px 12px', fontFamily: 'var(--font-jost)', fontWeight: 600 }}>{row.period}</td>
                            <td style={{ padding: '7px 12px', color: 'var(--text-2)' }}>{row.mrr != null ? `${row.mrr.toLocaleString('fr-FR')} €` : '—'}</td>
                            <td style={{ padding: '7px 12px', fontWeight: 600, color: STATUS_COLOR[row.status] ?? 'var(--text)' }}>
                              {row.cashflow.toLocaleString('fr-FR')} €
                            </td>
                            <td style={{ padding: '7px 12px' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: `${STATUS_COLOR[row.status] ?? '#888'}18`, color: STATUS_COLOR[row.status] ?? '#888' }}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
                    Généré le {new Date(activeForecast.generated_at).toLocaleDateString('fr-FR')}
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

function InlineInput({ defaultValue, unit, onSave, onCancel }: { defaultValue: string; unit?: string | null; onSave: (v: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState(defaultValue)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <input autoFocus value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(val); if (e.key === 'Escape') onCancel() }}
        style={{ width: 72, fontSize: 13, fontWeight: 700, padding: '3px 8px', border: '1.5px solid var(--green)', borderRadius: 'var(--r-sm)', outline: 'none', fontFamily: 'inherit', color: 'var(--green)' }} />
      {unit && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{unit}</span>}
      <button onClick={() => onSave(val)} style={{ fontSize: 11, padding: '3px 8px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontWeight: 700 }}>✓</button>
      <button onClick={onCancel} style={{ fontSize: 11, padding: '3px 8px', background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', cursor: 'pointer' }}>✕</button>
    </div>
  )
}
