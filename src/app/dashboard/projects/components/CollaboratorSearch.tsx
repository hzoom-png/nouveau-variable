'use client'

import { useState, useEffect, useRef } from 'react'
import type { ProjectCollaborator } from '../types'

interface Props {
  projectId?: string
  currentUserId: string
  selected: ProjectCollaborator[]
  onChange: (collabs: ProjectCollaborator[]) => void
}

export function CollaboratorSearch({ currentUserId, selected, onChange }: Props) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<ProjectCollaborator['profile'][]>([])
  const [loading, setLoading] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setLoading(true)
      const r = await fetch(`/api/members/search?q=${encodeURIComponent(query)}`)
      const d = await r.json()
      const excluded = new Set([currentUserId, ...selected.map(s => s.user_id)])
      setResults((d.members ?? []).filter((m: ProjectCollaborator['profile']) => !excluded.has(m.id)))
      setLoading(false)
    }, 300)
  }, [query, selected, currentUserId])

  function add(profile: ProjectCollaborator['profile']) {
    onChange([...selected, { id: crypto.randomUUID(), user_id: profile.id, profile }])
    setQuery('')
    setResults([])
  }

  function remove(userId: string) {
    onChange(selected.filter(s => s.user_id !== userId))
  }

  const avatar = (profile: ProjectCollaborator['profile'], size: number) => {
    const initials = ((profile.first_name?.[0] ?? '') + (profile.last_name?.[0] ?? '')).toUpperCase()
    return profile.avatar_url
      ? <img src={profile.avatar_url} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} alt="" />
      : (
        <div style={{
          width: size, height: size, borderRadius: '50%', background: 'var(--green)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {initials || '?'}
        </div>
      )
  }

  return (
    <div>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {selected.map(c => (
            <div key={c.user_id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '4px 10px 4px 6px',
            }}>
              {avatar(c.profile, 20)}
              <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                {c.profile.display_name || `${c.profile.first_name ?? ''} ${c.profile.last_name ?? ''}`.trim()}
              </span>
              <button
                type="button"
                onClick={() => remove(c.user_id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 16, lineHeight: 1, padding: '0 0 0 2px' }}
              >×</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <input
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--white)', border: '1.5px solid var(--border)',
            borderRadius: 'var(--r-sm)', padding: '10px 13px', fontSize: 14,
            color: 'var(--text)', fontFamily: 'inherit', outline: 'none',
          }}
          placeholder="Rechercher par nom ou code parrain…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoComplete="off"
        />
        {(results.length > 0 || loading) && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)', marginTop: 4,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)', overflow: 'hidden',
          }}>
            {loading && (
              <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-3)' }}>Recherche…</div>
            )}
            {results.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => add(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 14px', background: 'none',
                  border: 'none', borderBottom: '1px solid var(--border)',
                  cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {avatar(m, 28)}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                    {m.display_name || `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim()}
                  </p>
                  {m.referral_code && (
                    <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>#{m.referral_code}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
