'use client'

import type { Project } from '../types'
import { STAGE_CONFIG, NEED_CONFIG } from '../types'

interface Props {
  project: Project
  onClick: () => void
  onSave: () => void
  isMine?: boolean
}

export function ProjectCard({ project, onClick, onSave, isMine }: Props) {
  const stage = STAGE_CONFIG[project.stage]
  const initials = project.author
    ? `${project.author.first_name?.[0] ?? ''}${project.author.last_name?.[0] ?? ''}`.toUpperCase()
    : '?'

  return (
    <div className="project-card" onClick={onClick}>
      {/* Color strip */}
      <div style={{ height: '6px', background: project.cover_color, flexShrink: 0 }} />

      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: 'var(--r-sm)', flexShrink: 0,
            background: project.cover_color, display: 'grid', placeItems: 'center',
            overflow: 'hidden',
          }}>
            {project.logo_url
              ? <img src={project.logo_url} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '14px', fontWeight: 800, color: '#fff' }}>{project.title[0]?.toUpperCase()}</span>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)', lineHeight: 1.3, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{project.sector}</div>
          </div>
          {/* Save button */}
          {!isMine && (
            <button
              onClick={e => { e.stopPropagation(); onSave() }}
              title={project.is_saved ? 'Retirer des favoris' : 'Sauvegarder'}
              style={{ flexShrink: 0, color: project.is_saved ? project.cover_color : 'var(--text-3)', transition: '.15s', fontSize: '16px', padding: '2px' }}
            >
              {project.is_saved ? '★' : '☆'}
            </button>
          )}
        </div>

        {project.tagline && (
          <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.tagline}
          </p>
        )}

        {/* Stage badge */}
        <span style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '2px 9px', borderRadius: 'var(--r-full)', fontSize: '10px', fontWeight: 700, background: stage.bg, color: stage.color }}>
          {stage.label}
        </span>

        {/* Needs pills */}
        {!!project.needs?.length && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {project.needs.slice(0, 3).map(n => (
              <span key={n} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: 'var(--r-full)', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                {NEED_CONFIG[n]?.emoji} {NEED_CONFIG[n]?.label}
              </span>
            ))}
            {project.needs.length > 3 && (
              <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: 'var(--r-full)', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
                +{project.needs.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: 'var(--r-sm)', background: project.cover_color,
            display: 'grid', placeItems: 'center', fontSize: '9px', fontWeight: 800, color: '#fff', fontFamily: 'Jost, sans-serif',
            overflow: 'hidden', flexShrink: 0,
          }}>
            {project.author?.avatar_url
              ? <img src={project.author.avatar_url} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
            {project.author?.first_name} {project.author?.last_name?.[0]}.
          </span>
          {!!project.collaborators?.length && (
            <div style={{ display: 'flex', marginLeft: '4px' }}>
              {project.collaborators.slice(0, 3).map((c, i) => {
                const ci = ((c.profile.first_name?.[0] ?? '') + (c.profile.last_name?.[0] ?? '')).toUpperCase()
                return (
                  <div key={c.user_id} style={{
                    width: '18px', height: '18px', borderRadius: '50%', background: project.cover_color,
                    display: 'grid', placeItems: 'center', fontSize: '7px', fontWeight: 800, color: '#fff',
                    overflow: 'hidden', flexShrink: 0, border: '1.5px solid var(--white)',
                    marginLeft: i === 0 ? 0 : '-5px',
                  }}>
                    {c.profile.avatar_url
                      ? <img src={c.profile.avatar_url} alt={ci} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : ci || '?'}
                  </div>
                )
              })}
              {project.collaborators.length > 3 && (
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', background: 'var(--surface)',
                  display: 'grid', placeItems: 'center', fontSize: '7px', fontWeight: 700, color: 'var(--text-3)',
                  border: '1.5px solid var(--border)', marginLeft: '-5px', flexShrink: 0,
                }}>
                  +{project.collaborators.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
          {project.contacts_count ?? 0} contact{(project.contacts_count ?? 0) !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
