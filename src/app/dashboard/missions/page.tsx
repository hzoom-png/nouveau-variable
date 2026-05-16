'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDashboard } from '@/lib/dashboard-context'

const CAT_FILTERS = [
  { value: 'all',             label: 'Toutes'            },
  { value: 'closing',         label: 'Closing'           },
  { value: 'apport_affaires', label: "Apport d'affaires" },
  { value: 'freelance',       label: 'Freelance'         },
  { value: 'conseil',         label: 'Conseil'           },
  { value: 'formation',       label: 'Formation'         },
  { value: 'affiliation',     label: 'Affiliation'       },
  { value: 'autre',           label: 'Autre'             },
]

const CAT_LABEL: Record<string, string> = Object.fromEntries(CAT_FILTERS.slice(1).map(c => [c.value, c.label]))

interface Mission {
  id: string
  title: string
  company?: string
  description?: string
  category?: string
  remuneration?: string
  location?: string
  remote?: boolean
  url_source?: string
  tags?: string[]
  created_at: string
}

interface DetailModal {
  mission: Mission
}

export default function MissionsPage() {
  const { isInactive } = useDashboard()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [detail, setDetail]     = useState<DetailModal | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('missions')
      .select('id, title, company, description, category, remuneration, location, remote, url_source, tags, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setMissions((data as Mission[]) ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = filter === 'all' ? missions : missions.filter(m => m.category === filter)

  function openDetail(m: Mission) {
    if (m.url_source) {
      window.open(m.url_source, '_blank', 'noopener,noreferrer')
    } else {
      setDetail({ mission: m })
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Chargement…</span>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Category pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        {CAT_FILTERS.map(c => (
          <button
            key={c.value}
            onClick={() => setFilter(c.value)}
            style={{
              padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: '.12s',
              background: filter === c.value ? '#024f41' : 'var(--surface)',
              color: filter === c.value ? '#fff' : 'var(--text-2)',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: '#9BB5AA', textAlign: 'center', padding: '60px 0' }}>
          {missions.length === 0
            ? 'Les premières missions arrivent bientôt.'
            : 'Aucune mission dans cette catégorie.'}
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {filtered.map(m => (
            <div
              key={m.id}
              style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {/* Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {m.category && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: '#e8f5ef', color: '#024f41' }}>
                    {CAT_LABEL[m.category] ?? m.category}
                  </span>
                )}
                {m.remote && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                    Remote
                  </span>
                )}
              </div>

              {/* Title + company */}
              <div>
                <div style={{ fontFamily: 'Plus Jakarta Sans, Jost, sans-serif', fontSize: 16, fontWeight: 700, color: '#012722', lineHeight: 1.3, marginBottom: 3 }}>
                  {m.title}
                </div>
                {m.company && (
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#4B6358' }}>{m.company}</div>
                )}
              </div>

              {/* Description */}
              {m.description && (
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any }}>
                  {m.description}
                </p>
              )}

              {/* Remuneration */}
              {m.remuneration && (
                <div style={{ fontSize: 13, fontWeight: 600, color: '#024f41' }}>{m.remuneration}</div>
              )}

              {/* CTA */}
              {isInactive ? (
                <a
                  href="/subscribe"
                  style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--border)', color: 'var(--text-3)', fontSize: 12, fontWeight: 600, textDecoration: 'none', marginTop: 4 }}
                >
                  Activer pour accéder →
                </a>
              ) : (
                <button
                  onClick={() => openDetail(m)}
                  style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 'var(--r-sm)', background: '#024f41', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Jost, sans-serif', marginTop: 4 }}
                >
                  Voir la mission →
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail modal (no url_source) */}
      {detail && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setDetail(null)}
        >
          <div
            style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', maxWidth: 540, width: '100%', padding: '28px 28px 24px', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {detail.mission.category && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: '#e8f5ef', color: '#024f41' }}>
                  {CAT_LABEL[detail.mission.category] ?? detail.mission.category}
                </span>
              )}
              {detail.mission.remote && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>Remote</span>
              )}
            </div>
            <div style={{ fontFamily: 'Plus Jakarta Sans, Jost, sans-serif', fontSize: 20, fontWeight: 700, color: '#012722', marginBottom: 6 }}>
              {detail.mission.title}
            </div>
            {detail.mission.company && (
              <div style={{ fontSize: 13, color: '#4B6358', marginBottom: 14 }}>{detail.mission.company}</div>
            )}
            {detail.mission.remuneration && (
              <div style={{ fontSize: 14, fontWeight: 600, color: '#024f41', marginBottom: 14 }}>{detail.mission.remuneration}</div>
            )}
            {detail.mission.description && (
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 18 }}>
                {detail.mission.description}
              </p>
            )}
            <button
              onClick={() => setDetail(null)}
              style={{ padding: '9px 18px', borderRadius: 'var(--r-sm)', background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
