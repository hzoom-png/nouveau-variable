'use client'

import type { TerrainProspect } from '../types'

const PRIORITY_STYLES = {
  hot:  { bg: 'var(--red-2)',    text: 'var(--red)',    label: '🔥 Hot' },
  warm: { bg: 'var(--amber-2)',  text: 'var(--amber)',  label: '⚡ Warm' },
  cold: { bg: 'var(--surface-2)', text: 'var(--text-3)', label: '❄ Cold' },
}

function scoreColor(score: number) {
  if (score >= 75) return 'var(--green)'
  if (score >= 50) return 'var(--amber)'
  return 'var(--text-3)'
}
function scoreBg(score: number) {
  if (score >= 75) return 'var(--green-3)'
  if (score >= 50) return 'var(--amber-2)'
  return 'var(--surface-2)'
}

interface Props { prospect: TerrainProspect }

export default function TerrainRow({ prospect: p }: Props) {
  const ps = PRIORITY_STYLES[p.priority]

  return (
    <tr className="tr-row">
      {/* Company */}
      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
        <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{p.company}</div>
        {p.sector && p.sector !== '—' && (
          <div style={{ display: 'inline-block', marginTop: '4px', background: 'var(--green-3)', color: 'var(--green-2)', fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: 'var(--r-full)', border: '1px solid var(--green-4)' }}>
            {p.sector}
          </div>
        )}
      </td>

      {/* Contact / Role */}
      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{p.contact !== '—' ? p.contact : <span style={{ color: 'var(--text-3)' }}>—</span>}</div>
        {p.role && p.role !== '—' && (
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{p.role}</div>
        )}
      </td>

      {/* Signal */}
      <td style={{ padding: '12px 16px', verticalAlign: 'top', maxWidth: '220px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>{p.signal}</div>
      </td>

      {/* Score */}
      <td style={{ padding: '12px 16px', verticalAlign: 'top', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: scoreBg(p.score), color: scoreColor(p.score), fontFamily: "'Jost', sans-serif", fontSize: '13px', fontWeight: 800 }}>
          {p.score}
        </div>
      </td>

      {/* Priority */}
      <td style={{ padding: '12px 16px', verticalAlign: 'top', textAlign: 'center' }}>
        <span style={{ display: 'inline-block', background: ps.bg, color: ps.text, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--r-full)' }}>
          {ps.label}
        </span>
      </td>

      {/* Action */}
      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5, fontStyle: 'italic' }}>{p.action}</div>
      </td>
    </tr>
  )
}
