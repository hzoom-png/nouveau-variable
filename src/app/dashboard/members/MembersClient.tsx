'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MemberProfile } from '@/lib/types'
import { MEETING_TYPES } from '@/lib/constants'
import { MeetingModal } from '@/components/meetings/MeetingModal'

const RANK_BG: Record<string, string> = {
  explorateur: 'var(--green-3)',
  connecteur:  '#EEF4FF',
  amplificateur: 'var(--amber-2)',
}
const RANK_COLOR: Record<string, string> = {
  explorateur: 'var(--green)',
  connecteur:  '#4B7BF5',
  amplificateur: 'var(--amber)',
}

interface Props {
  members: MemberProfile[]
  currentUserId: string
  currentUserPoints: number
}

function minCost(m: MemberProfile): number {
  const types = (m.meeting_types ?? []) as Array<keyof typeof MEETING_TYPES>
  if (!types.length) return 8
  return Math.min(...types.map(t => MEETING_TYPES[t]?.points ?? 15))
}

function MemberInitials({ m }: { m: MemberProfile }) {
  const initials = `${m.first_name?.[0] ?? ''}${m.last_name?.[0] ?? ''}`.toUpperCase()
  const bg = RANK_COLOR[m.rank] ?? 'var(--green)'
  if (m.avatar_url) {
    return <img src={m.avatar_url} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  }
  return <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '13px', fontWeight: 800, color: '#fff', background: bg }}>{initials}</span>
}

export default function MembersClient({ members, currentUserId, currentUserPoints }: Props) {
  const [cityFilter, setCityFilter] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [search, setSearch] = useState('')
  const [drawerMember, setDrawerMember] = useState<MemberProfile | null>(null)
  const [meetingTarget, setMeetingTarget] = useState<MemberProfile | null>(null)

  const allCities = Array.from(new Set(members.flatMap(m => m.cities ?? []))).sort()
  const allSectors = Array.from(new Set(members.flatMap(m => m.sectors ?? []))).sort()

  const filtered = members.filter(m => {
    if (cityFilter && !(m.cities ?? []).includes(cityFilter)) return false
    if (sectorFilter && !(m.sectors ?? []).includes(sectorFilter)) return false
    if (search) {
      const q = search.toLowerCase()
      const full = `${m.first_name} ${m.last_name} ${m.role_title ?? ''}`.toLowerCase()
      if (!full.includes(q)) return false
    }
    return true
  })

  const selectStyle: React.CSSProperties = {
    padding: '8px 13px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--border)',
    background: 'var(--white)', fontSize: '13px', color: 'var(--text)', cursor: 'pointer',
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher…"
          style={{ ...selectStyle, flex: '1', minWidth: '140px', maxWidth: '220px' }}
        />
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} style={selectStyle}>
          <option value="">Toutes les villes</option>
          {allCities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={selectStyle}>
          <option value="">Tous les secteurs</option>
          {allSectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: '12px', color: 'var(--text-3)', marginLeft: 'auto' }}>{filtered.length} membre{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {!filtered.length && (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--r-lg)', padding: '48px', textAlign: 'center', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
          <p style={{ fontWeight: 600 }}>Aucun membre trouvé</p>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
        {filtered.map(m => {
          const initials = `${m.first_name?.[0] ?? ''}${m.last_name?.[0] ?? ''}`.toUpperCase()
          const bannerBg = RANK_BG[m.rank] ?? 'var(--green-3)'
          const avBg = RANK_COLOR[m.rank] ?? 'var(--green)'
          const cost = minCost(m)

          return (
            <div key={m.id} className="mc-card" onClick={() => setDrawerMember(m)}>
              {/* Banner */}
              <div className="mc-card-banner" style={{ background: bannerBg }}>
                <div className="mc-card-av" style={{ background: avBg }}>
                  {m.avatar_url
                    ? <img src={m.avatar_url} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials
                  }
                </div>
              </div>

              <div style={{ padding: '26px 14px 0' }}>
                <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '1px' }}>
                  {m.first_name} {m.last_name}
                </div>
                {m.role_title && (
                  <div style={{ fontSize: '11px', color: 'var(--text-2)', marginBottom: '8px' }}>{m.role_title}</div>
                )}
                {m.tagline && !m.role_title && (
                  <div style={{ fontSize: '11px', color: 'var(--text-2)', marginBottom: '8px' }}>{m.tagline}</div>
                )}

                {/* Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                  {(m.cities ?? []).slice(0, 1).map(c => (
                    <span key={c} style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: 'var(--r-full)', background: 'var(--green-3)', color: 'var(--green)' }}>{c}</span>
                  ))}
                  {(m.sectors ?? []).slice(0, 2).map(s => (
                    <span key={s} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: 'var(--r-full)', background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>{s}</span>
                  ))}
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', paddingTop: '10px', borderTop: '1px solid var(--border)', marginBottom: '0' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Jost, sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{m.missions_count}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.07em' }}>Missions</div>
                  </div>
                  {m.rating > 0 && (
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Jost, sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{m.rating.toFixed(1)}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.07em' }}>Note</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '10px 14px', background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>À partir de <strong style={{ color: 'var(--green)' }}>{cost} pts</strong></span>
                <button
                  onClick={e => { e.stopPropagation(); setMeetingTarget(m) }}
                  style={{ background: 'var(--green-3)', color: 'var(--green)', border: '1px solid var(--green-4)', padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: '11px', fontWeight: 700, transition: '.14s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--green-3)'; e.currentTarget.style.color = 'var(--green)' }}
                >
                  Inviter →
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Backdrop + Drawer ── */}
      <div className={`drawer-backdrop${drawerMember ? ' open' : ''}`} onClick={() => setDrawerMember(null)} />
      <aside className={`member-drawer${drawerMember ? ' open' : ''}`}>
        {drawerMember && (() => {
          const m = drawerMember
          const initials = `${m.first_name?.[0] ?? ''}${m.last_name?.[0] ?? ''}`.toUpperCase()
          const bannerBg = RANK_BG[m.rank] ?? 'var(--green-3)'
          const avBg = RANK_COLOR[m.rank] ?? 'var(--green)'
          const cost = minCost(m)

          return (
            <>
              <div className="drawer-banner" style={{ background: bannerBg }}>
                <button
                  onClick={() => setDrawerMember(null)}
                  style={{ position: 'absolute', top: '12px', right: '14px', width: '28px', height: '28px', borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,.8)', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: '16px', color: 'var(--text-2)' }}
                >×</button>
                <div className="drawer-av" style={{ background: avBg }}>
                  {m.avatar_url
                    ? <img src={m.avatar_url} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials
                  }
                </div>
              </div>

              <div style={{ padding: '32px 20px 20px', flex: 1, overflowY: 'auto' }}>
                <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: '18px', color: 'var(--text)', marginBottom: '3px' }}>
                  {m.first_name} {m.last_name}
                </div>
                {m.tagline && <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '4px' }}>{m.tagline}</div>}
                {m.role_title && !m.tagline && <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '4px' }}>{m.role_title}</div>}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', margin: '10px 0 14px' }}>
                  {(m.cities ?? []).map(c => (
                    <span key={c} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: 'var(--r-full)', background: 'var(--green-3)', color: 'var(--green)' }}>{c}</span>
                  ))}
                  {(m.sectors ?? []).map(s => (
                    <span key={s} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: 'var(--r-full)', background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>{s}</span>
                  ))}
                </div>

                {m.bio && (
                  <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.7, marginBottom: '16px' }}>{m.bio}</p>
                )}

                <div style={{ display: 'flex', gap: '24px', padding: '14px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Jost, sans-serif', fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>{m.missions_count}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.07em' }}>Missions</div>
                  </div>
                  {m.rating > 0 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Jost, sans-serif', fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>{m.rating.toFixed(1)}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.07em' }}>Note</div>
                    </div>
                  )}
                </div>

                {m.slug && (
                  <Link
                    href={`/p/${m.slug}`}
                    target="_blank"
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 14px', background: 'var(--surface)', borderRadius: 'var(--r-sm)', textDecoration: 'none', marginBottom: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--green)" strokeWidth="1.5"><path d="M4.5 1H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V7M6.5 1H11v4.5M11 1L5 7"/></svg>
                    Voir le profil public
                  </Link>
                )}

                <button
                  onClick={() => { setMeetingTarget(m); setDrawerMember(null) }}
                  style={{ width: '100%', background: 'var(--green)', color: '#fff', padding: '12px', borderRadius: 'var(--r-sm)', fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', transition: '.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--green-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--green)'}
                >
                  Inviter à se rencontrer · à partir de {cost} pts →
                </button>
              </div>
            </>
          )
        })()}
      </aside>

      {meetingTarget && (
        <MeetingModal
          recipient={meetingTarget}
          currentUserPoints={currentUserPoints}
          isOpen={!!meetingTarget}
          onClose={() => setMeetingTarget(null)}
          onSuccess={() => setMeetingTarget(null)}
        />
      )}
    </div>
  )
}
