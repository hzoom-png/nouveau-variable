'use client'

import { useRouter } from 'next/navigation'
import type { TerrainProspect } from '../types'
import TerrainRow from './TerrainRow'

interface Props {
  prospects: TerrainProspect[]
}

function exportCsv(prospects: TerrainProspect[]) {
  const headers = ['Entreprise', 'Contact', 'Rôle', 'Secteur', 'Signal', 'Score', 'Priorité', 'Action']
  const rows = prospects.map(p => [
    p.company, p.contact, p.role, p.sector, p.signal, String(p.score), p.priority, p.action,
  ].map(v => `"${v.replace(/"/g, '""')}"`).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `terrain-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function TerrainTable({ prospects }: Props) {
  const router = useRouter()
  const hot  = prospects.filter(p => p.priority === 'hot').length
  const warm = prospects.filter(p => p.priority === 'warm').length
  const cold = prospects.filter(p => p.priority === 'cold').length

  function addToKeyaccount(p: TerrainProspect) {
    localStorage.setItem('ka_prefill', JSON.stringify({ company: p.company, sector: p.sector !== '—' ? p.sector : '' }))
    router.push('/dashboard/tools/keyaccount?from=terrain')
  }

  return (
    <div>
      {/* Stats bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '5px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
          <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>{prospects.length} prospect{prospects.length > 1 ? 's' : ''}</span>
          {hot > 0 && <><span style={{ color: 'var(--text-3)' }}>·</span><span style={{ color: 'var(--red)' }}>{hot} hot</span></>}
          {warm > 0 && <><span style={{ color: 'var(--text-3)' }}>·</span><span style={{ color: 'var(--amber)' }}>{warm} warm</span></>}
          {cold > 0 && <><span style={{ color: 'var(--text-3)' }}>·</span><span style={{ color: 'var(--text-3)' }}>{cold} cold</span></>}
        </div>
        <button
          onClick={() => exportCsv(prospects)}
          className="tbtn-secondary"
          style={{ marginLeft: 'auto', padding: '5px 14px', fontSize: '12px' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M6 1v7M3 5l3 3 3-3M1 10h10"/>
          </svg>
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
            <thead>
              <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                {['Entreprise', 'Contact', 'Signal', 'Score', 'Priorité', 'Action', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Score' || h === 'Priorité' ? 'center' : 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prospects.map((p, i) => (
                <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }} className="tr-row">
                  {/* Company */}
                  <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{p.company}</div>
                    {p.sector && p.sector !== '—' && (
                      <div style={{ display: 'inline-block', marginTop: '4px', background: 'var(--green-3)', color: 'var(--green-2)', fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: 'var(--r-full)', border: '1px solid var(--green-4)' }}>
                        {p.sector}
                      </div>
                    )}
                  </td>

                  {/* Contact */}
                  <td style={{ padding: '12px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      {p.contact !== '—' ? p.contact : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </div>
                    {p.role && p.role !== '—' && (
                      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{p.role}</div>
                    )}
                  </td>

                  {/* Signal */}
                  <td style={{ padding: '12px 16px', verticalAlign: 'top', maxWidth: '240px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>{p.signal}</div>
                  </td>

                  {/* Score */}
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                    <CircularGauge score={p.score} />
                  </td>

                  {/* Priority */}
                  <td style={{ padding: '12px 16px', verticalAlign: 'top', textAlign: 'center' }}>
                    <PriorityBadge priority={p.priority} />
                  </td>

                  {/* Action */}
                  <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5, fontStyle: 'italic', minWidth: '140px' }}>{p.action}</div>
                  </td>

                  {/* Keyaccount CTA */}
                  <td style={{ padding: '12px 12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => addToKeyaccount(p)}
                      style={{ background: 'var(--green-3)', color: 'var(--green)', border: '1px solid var(--green-4)', padding: '5px 10px', borderRadius: 'var(--r-sm)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: '.14s' }}
                      onMouseOver={e => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.color = '#fff' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'var(--green-3)'; e.currentTarget.style.color = 'var(--green)' }}
                    >
                      + Keyaccount
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function CircularGauge({ score }: { score: number }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--text-3)'
  return (
    <div style={{ position: 'relative', width: '48px', height: '48px', margin: '0 auto' }}>
      <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(.16,1,.3,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: 800, color }}>
        {score}
      </div>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: 'hot' | 'warm' | 'cold' }) {
  const s = {
    hot:  { bg: 'var(--red-2)',     text: 'var(--red)',    label: '🔥 Hot' },
    warm: { bg: 'var(--amber-2)',   text: 'var(--amber)',  label: '⚡ Warm' },
    cold: { bg: 'var(--surface-2)', text: 'var(--text-3)', label: '❄ Cold' },
  }[priority]
  return (
    <span style={{ display: 'inline-block', background: s.bg, color: s.text, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--r-full)' }}>
      {s.label}
    </span>
  )
}
