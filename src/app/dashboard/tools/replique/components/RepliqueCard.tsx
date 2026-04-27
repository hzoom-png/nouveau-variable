'use client'

import type { RepliqueScript } from '../types'

const OBJECTIVE_LABELS: Record<string, string> = {
  rdv: 'Prise de RDV', qualification: 'Qualification', barrage: 'Barrage',
  relance: 'Relance', closing: 'Closing', cold: 'Cold Call',
}
const CONTACT_LABELS: Record<string, string> = {
  decision_maker: 'Décideur', manager: 'Manager', secretary: 'Secrétaire',
  technical: 'Profil tech', user: 'Utilisateur',
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'aujourd\'hui'
  if (days === 1) return 'hier'
  return `il y a ${days} jours`
}

interface Props { script: RepliqueScript; onReload: (s: RepliqueScript) => void }

export default function RepliqueCard({ script, onReload }: Props) {
  const { config } = script
  const label = `${OBJECTIVE_LABELS[config.objective] ?? config.objective} · ${CONTACT_LABELS[config.contact_type] ?? config.contact_type}${config.company_sector ? ` · ${config.company_sector}` : ''}`

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface)', borderRadius: 'var(--r-sm)', gap: '10px', flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{formatRelative(script.created_at)}</div>
      </div>
      <button
        onClick={() => onReload(script)}
        style={{ padding: '5px 13px', borderRadius: 'var(--r-sm)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: 'var(--white)', border: '1.5px solid var(--border)', color: 'var(--text-2)', transition: '.14s', flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--green-3)'; e.currentTarget.style.color = 'var(--green)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.color = 'var(--text-2)' }}
      >
        Recharger
      </button>
    </div>
  )
}
