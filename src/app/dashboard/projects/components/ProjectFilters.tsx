'use client'

import type { ProjectFilters } from '../hooks/useProjects'
import type { ProjectNeed, ProjectStage } from '../types'
import { STAGE_CONFIG, NEED_CONFIG, SECTORS } from '../types'

interface Props {
  filters: ProjectFilters
  onChange: (f: ProjectFilters) => void
  total: number
}

const ALL_NEEDS = Object.keys(NEED_CONFIG) as ProjectNeed[]
const ALL_STAGES = Object.keys(STAGE_CONFIG) as ProjectStage[]

const selectStyle: React.CSSProperties = {
  padding: '8px 13px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--border)',
  background: 'var(--white)', fontSize: '13px', color: 'var(--text)', cursor: 'pointer', outline: 'none',
}

export function ProjectFiltersBar({ filters, onChange, total }: Props) {
  function setField<K extends keyof ProjectFilters>(key: K, val: ProjectFilters[K]) {
    onChange({ ...filters, [key]: val })
  }

  function toggleNeed(need: ProjectNeed) {
    const has = filters.needs.includes(need)
    setField('needs', has ? filters.needs.filter(n => n !== need) : [...filters.needs, need])
  }

  const hasFilters = filters.search || filters.sector || filters.stage || filters.needs.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
      {/* Row 1 */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={filters.search}
          onChange={e => setField('search', e.target.value)}
          placeholder="Rechercher un projet…"
          style={{ ...selectStyle, flex: '1', minWidth: '160px', maxWidth: '260px' }}
        />
        <select value={filters.sector} onChange={e => setField('sector', e.target.value)} style={selectStyle}>
          <option value="">Tous les secteurs</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.stage} onChange={e => setField('stage', e.target.value as ProjectStage | '')} style={selectStyle}>
          <option value="">Toutes les étapes</option>
          {ALL_STAGES.map(s => <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>)}
        </select>
        <span style={{ fontSize: '12px', color: 'var(--text-3)', marginLeft: 'auto' }}>
          {total} projet{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Row 2 — needs pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, marginRight: '2px' }}>Besoins :</span>
        {ALL_NEEDS.map(n => {
          const active = filters.needs.includes(n)
          return (
            <button
              key={n}
              onClick={() => toggleNeed(n)}
              style={{
                padding: '4px 11px', borderRadius: 'var(--r-full)', fontSize: '11px', fontWeight: 600,
                border: '1.5px solid', cursor: 'pointer', transition: '.14s',
                borderColor: active ? 'var(--green)' : 'var(--border)',
                background: active ? 'var(--green-3)' : 'var(--white)',
                color: active ? 'var(--green)' : 'var(--text-2)',
              }}
            >
              {NEED_CONFIG[n].emoji} {NEED_CONFIG[n].label}
            </button>
          )
        })}
        {hasFilters && (
          <button
            onClick={() => onChange({ search: '', sector: '', stage: '', needs: [] })}
            style={{ fontSize: '11px', color: 'var(--text-3)', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none', padding: '0 4px' }}
          >
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  )
}
