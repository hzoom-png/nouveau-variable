'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MemberProfile } from '@/lib/types'
import { MeetingRequestModal } from '@/components/meetings/MeetingRequestModal'

interface Props {
  members: MemberProfile[]
  currentUserId: string
  currentUserPoints: number
}

const RANK_COLOR: Record<string, string> = {
  explorateur:   'var(--green)',
  connecteur:    '#4B7BF5',
  amplificateur: 'var(--amber)',
}

export default function MembersClient({ members, currentUserId, currentUserPoints }: Props) {
  const [cityFilter, setCityFilter]     = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [search, setSearch]             = useState('')
  const [drawerMember, setDrawerMember] = useState<MemberProfile | null>(null)
  const [meetingTarget, setMeetingTarget] = useState<MemberProfile | null>(null)

  const allCities  = Array.from(new Set(members.flatMap(m => m.cities   ?? []))).sort()
  const allSectors = Array.from(new Set(members.flatMap(m => m.sectors  ?? []))).sort()

  const filtered = members.filter(m => {
    if (cityFilter   && !(m.cities   ?? []).includes(cityFilter))   return false
    if (sectorFilter && !(m.sectors  ?? []).includes(sectorFilter)) return false
    if (search) {
      const q    = search.toLowerCase()
      const full = `${m.first_name} ${m.last_name} ${m.role_title ?? ''}`.toLowerCase()
      if (!full.includes(q)) return false
    }
    return true
  })

  const sel: React.CSSProperties = {
    padding: '8px 13px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--border)',
    background: 'var(--white)', fontSize: '13px', color: 'var(--text)', cursor: 'pointer', outline: 'none',
  }

  return (
    <>
      <style>{`
        .mc-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 900px) { .mc-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .mc-grid { grid-template-columns: 1fr; } }

        .mc-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          transition: transform .16s, box-shadow .16s;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .mc-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(15,28,23,0.10);
        }

        .drawer-backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.32); z-index: 99; }
        .drawer-backdrop.open { display: block; }
        .member-drawer {
          position: fixed; top: 0; right: -400px; width: 360px; max-width: 100vw;
          height: 100vh; background: var(--white); border-left: 1px solid var(--border);
          z-index: 100; transition: right .26s cubic-bezier(.4,0,.2,1);
          display: flex; flex-direction: column; overflow: hidden;
        }
        .member-drawer.open { right: 0; }
        .drawer-banner {
          height: 100px; flex-shrink: 0; position: relative;
          display: flex; align-items: flex-end; padding: 0 20px 0;
        }
        .drawer-av {
          width: 72px; height: 72px; border-radius: 50%;
          border: 3px solid var(--white);
          overflow: hidden;
          display: grid; place-items: center;
          font-family: Jost, sans-serif; font-size: 22px; font-weight: 800; color: #fff;
          transform: translateY(36px);
          flex-shrink: 0;
        }
      `}</style>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher…"
          style={{ ...sel, flex: '1', minWidth: '140px', maxWidth: '220px' }}
        />
        <select value={cityFilter}   onChange={e => setCityFilter(e.target.value)}   style={sel}>
          <option value="">Toutes les villes</option>
          {allCities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={sel}>
          <option value="">Tous les secteurs</option>
          {allSectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: '12px', color: 'var(--text-3)', marginLeft: 'auto' }}>
          {filtered.length} membre{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {!filtered.length && (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--r-lg)', padding: '48px', textAlign: 'center', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
          <p style={{ fontWeight: 600 }}>Aucun membre trouvé</p>
        </div>
      )}

      {/* Grid */}
      <div className="mc-grid">
        {filtered.map(m => {
          const initials = `${m.first_name?.[0] ?? ''}${m.last_name?.[0] ?? ''}`.toUpperCase()
          const avColor  = RANK_COLOR[m.rank] ?? 'var(--green)'
          const tags     = [...(m.sectors ?? []), ...(m.cities ?? [])]
          const maxTags  = 2
          const extra    = tags.length > maxTags ? tags.length - maxTags : 0

          return (
            <div key={m.id} className="mc-card" onClick={() => setDrawerMember(m)} style={{ position: 'relative' }}>
              {/* Member number */}
              {m.member_number != null && (
                <div style={{ position: 'absolute', top: '10px', right: '12px', fontFamily: 'Jost, sans-serif', fontSize: '11px', fontWeight: 700, color: 'var(--text-3)' }}>
                  #{String(m.member_number).padStart(3, '0')}
                </div>
              )}
              {/* Avatar */}
              <div style={{ padding: '24px 24px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: m.avatar_url ? 'transparent' : 'var(--green-3)',
                  border: `2px solid var(--green-4)`,
                  overflow: 'hidden', display: 'grid', placeItems: 'center',
                  marginBottom: '12px', flexShrink: 0,
                }}>
                  {m.avatar_url
                    ? <img src={m.avatar_url} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '22px', fontWeight: 800, color: avColor }}>{initials}</span>
                  }
                </div>

                <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '4px', textAlign: 'center' }}>
                  {m.first_name} {m.last_name}
                </div>

                {(m.tagline || m.role_title) && (
                  <div style={{
                    fontSize: '12px', color: 'var(--text-2)', fontStyle: 'italic',
                    textAlign: 'center', lineHeight: 1.4, marginBottom: '10px',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {m.tagline || m.role_title}
                  </div>
                )}

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', marginBottom: '12px' }}>
                  {tags.slice(0, maxTags).map(t => (
                    <span key={t} style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', background: 'var(--green-3)', color: 'var(--green)' }}>{t}</span>
                  ))}
                  {extra > 0 && (
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>+{extra} autres</span>
                  )}
                </div>
              </div>

              {/* Footer CTA */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={e => { e.stopPropagation(); setMeetingTarget(m) }}
                  style={{
                    width: '100%', background: 'var(--green)', color: '#fff',
                    padding: '9px', borderRadius: '99px',
                    fontFamily: 'Jost, sans-serif', fontSize: '12px', fontWeight: 700,
                    border: 'none', cursor: 'pointer', transition: '.14s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--green-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--green)'}
                >
                  Proposer un RDV
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Drawer backdrop */}
      <div className={`drawer-backdrop${drawerMember ? ' open' : ''}`} onClick={() => setDrawerMember(null)} />

      {/* Drawer */}
      <aside className={`member-drawer${drawerMember ? ' open' : ''}`}>
        {drawerMember && (() => {
          const m        = drawerMember
          const initials = `${m.first_name?.[0] ?? ''}${m.last_name?.[0] ?? ''}`.toUpperCase()
          const avColor  = RANK_COLOR[m.rank] ?? 'var(--green)'
          const bannerBg = `${avColor}22`

          return (
            <>
              <div className="drawer-banner" style={{ background: bannerBg }}>
                <button
                  onClick={() => setDrawerMember(null)}
                  style={{ position: 'absolute', top: '12px', right: '14px', width: '28px', height: '28px', borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,.85)', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: '16px', color: 'var(--text-2)' }}
                >×</button>
                <div className="drawer-av" style={{ background: m.avatar_url ? 'transparent' : avColor }}>
                  {m.avatar_url
                    ? <img src={m.avatar_url} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials
                  }
                </div>
              </div>

              <div style={{ padding: '44px 20px 20px', flex: 1, overflowY: 'auto' }}>
                <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: '18px', color: 'var(--text)', marginBottom: '3px' }}>
                  {m.first_name} {m.last_name}
                </div>
                {m.tagline && <div style={{ fontSize: '13px', color: 'var(--text-2)', fontStyle: 'italic', marginBottom: '4px' }}>{m.tagline}</div>}
                {m.role_title && !m.tagline && <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '4px' }}>{m.role_title}</div>}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', margin: '10px 0 14px' }}>
                  {(m.cities ?? []).map(c => (
                    <span key={c} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '99px', background: 'var(--green-3)', color: 'var(--green)' }}>{c}</span>
                  ))}
                  {(m.sectors ?? []).map(s => (
                    <span key={s} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '99px', background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>{s}</span>
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

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setMeetingTarget(m); setDrawerMember(null) }}
                    style={{ flex: 1, background: 'var(--green)', color: '#fff', padding: '12px', borderRadius: '99px', fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer', transition: '.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--green-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--green)'}
                  >
                    Proposer un RDV
                  </button>
                  {m.slug && (
                    <Link
                      href={`/p/${m.slug}`}
                      target="_blank"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '99px', border: '1.5px solid var(--border)', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', textDecoration: 'none', transition: '.15s' }}
                    >
                      Voir le profil
                    </Link>
                  )}
                </div>
              </div>
            </>
          )
        })()}
      </aside>

      {meetingTarget && (
        <MeetingRequestModal
          recipient={meetingTarget}
          currentUserPoints={currentUserPoints}
          isOpen={!!meetingTarget}
          onClose={() => setMeetingTarget(null)}
          onSuccess={() => setMeetingTarget(null)}
        />
      )}
    </>
  )
}
