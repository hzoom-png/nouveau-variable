'use client'

import { useState } from 'react'
import { Profile } from '@/lib/types'
import { MEETING_TYPES } from '@/lib/constants'
import { MeetingModal } from '@/components/meetings/MeetingModal'

const RANK_COLORS: Record<string, string> = {
  explorateur: '#4B7BF5',
  connecteur: '#43695A',
  amplificateur: '#E8A020',
}

interface Props {
  members: Profile[]
  currentUserId: string
  currentUserPoints: number
}

export default function MembersClient({ members, currentUserId, currentUserPoints }: Props) {
  const [cityFilter, setCityFilter] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null)

  const allCities = Array.from(new Set(members.flatMap(m => m.cities ?? []))).sort()
  const allSectors = Array.from(new Set(members.flatMap(m => m.sectors ?? []))).sort()

  const filtered = members.filter(m => {
    if (cityFilter && !(m.cities ?? []).includes(cityFilter)) return false
    if (sectorFilter && !(m.sectors ?? []).includes(sectorFilter)) return false
    return true
  })

  // Min points cost for this member
  function minCost(m: Profile): number {
    const types = (m.meeting_types ?? []) as Array<keyof typeof MEETING_TYPES>
    if (!types.length) return 8
    return Math.min(...types.map(t => MEETING_TYPES[t]?.points ?? 15))
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <select
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'white', fontSize: '14px', color: 'var(--text)', cursor: 'pointer' }}
        >
          <option value="">Toutes les villes</option>
          {allCities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={sectorFilter}
          onChange={e => setSectorFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'white', fontSize: '14px', color: 'var(--text)', cursor: 'pointer' }}
        >
          <option value="">Tous les secteurs</option>
          {allSectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ fontSize: '14px', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
          {filtered.length} membre(s)
        </div>
      </div>

      {!filtered.length && (
        <div style={{ background: 'white', borderRadius: '14px', padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
          <p style={{ fontWeight: 600 }}>Aucun membre trouvé</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {filtered.map(m => {
          const initials = `${m.first_name?.[0] ?? ''}${m.last_name?.[0] ?? ''}`.toUpperCase()
          const rankColor = RANK_COLORS[m.rank] || '#43695A'
          const cost = minCost(m)

          return (
            <div key={m.id} style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
              {/* Banner */}
              <div style={{ height: '64px', background: rankColor, position: 'relative' }}>
                <div style={{
                  position: 'absolute', bottom: '-20px', left: '16px',
                  width: '44px', height: '44px', borderRadius: '11px',
                  background: rankColor, border: '3px solid white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 800, fontSize: '16px',
                }}>{initials}</div>
              </div>

              <div style={{ padding: '28px 16px 16px' }}>
                <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
                  {m.first_name} {m.last_name}
                </div>
                {m.role_title && (
                  <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '10px' }}>{m.role_title}</div>
                )}

                {/* Cities */}
                {(m.cities ?? []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                    {(m.cities ?? []).map(c => (
                      <span key={c} style={{ background: 'var(--green-pale)', color: '#43695A', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>{c}</span>
                    ))}
                  </div>
                )}

                {/* Sectors */}
                {(m.sectors ?? []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                    {(m.sectors ?? []).map(s => (
                      <span key={s} style={{ background: 'var(--border)', color: 'var(--muted)', borderRadius: '6px', padding: '2px 8px', fontSize: '11px' }}>{s}</span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', fontSize: '12px', color: 'var(--muted)' }}>
                  <span>🤝 {m.missions_count} missions</span>
                  {m.rating > 0 && <span>⭐ {m.rating.toFixed(1)}</span>}
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    À partir de <strong style={{ color: '#43695A' }}>{cost} pts</strong>
                  </span>
                  <button
                    onClick={() => setSelectedMember(m)}
                    style={{
                      padding: '7px 14px', borderRadius: '8px', background: '#43695A',
                      color: 'white', fontWeight: 600, fontSize: '13px', border: 'none', cursor: 'pointer',
                    }}
                  >
                    Inviter →
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedMember && (
        <MeetingModal
          recipient={selectedMember}
          currentUserPoints={currentUserPoints}
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          onSuccess={() => setSelectedMember(null)}
        />
      )}
    </div>
  )
}
