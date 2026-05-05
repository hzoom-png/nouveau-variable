'use client'

import type { Project } from '../types'
import { STAGE_CONFIG, NEED_CONFIG, FUNDING_TYPES } from '../types'
import { ProjectContactForm } from './ProjectContactForm'

interface Props {
  project: Project
  currentUserId: string
  isMine: boolean
  onClose: () => void
  onSave: () => void
  onContactSent: () => void
}

export function ProjectModal({ project, currentUserId, isMine, onClose, onSave, onContactSent }: Props) {
  const stage = STAGE_CONFIG[project.stage]
  const initials = project.author
    ? `${project.author.first_name?.[0] ?? ''}${project.author.last_name?.[0] ?? ''}`.toUpperCase()
    : '?'

  return (
    <>
      <div className="project-modal-backdrop" onClick={onClose} />
      <aside className="project-modal">
        {/* Header with cover color */}
        <div style={{ background: project.cover_color, padding: '20px 20px 32px', position: 'relative', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '12px', right: '14px', width: '28px', height: '28px',
              borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,.2)', border: 'none',
              display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: '16px', color: '#fff',
            }}
          >×</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,.15)',
              border: '2px solid rgba(255,255,255,.3)', display: 'grid', placeItems: 'center', overflow: 'hidden',
            }}>
              {project.logo_url
                ? <img src={project.logo_url} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '20px', fontWeight: 800, color: '#fff' }}>{project.title[0]?.toUpperCase()}</span>
              }
            </div>
            <div>
              <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: '18px', color: '#fff', lineHeight: 1.2 }}>
                {project.title}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.75)', marginTop: '2px' }}>{project.sector}</div>
            </div>
          </div>
          {project.tagline && (
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.85)', marginTop: '12px', lineHeight: 1.6 }}>
              {project.tagline}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Author + meta */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: 'var(--r-sm)', background: project.cover_color,
                display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0,
              }}>
                {project.author?.avatar_url
                  ? <img src={project.author.avatar_url} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '11px', fontWeight: 800, color: '#fff' }}>{initials}</span>
                }
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  {project.author?.first_name} {project.author?.last_name}
                </div>
                {project.author?.role_title && (
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{project.author.role_title}</div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: '11px', fontWeight: 700, background: stage.bg, color: stage.color }}>
                {stage.label}
              </span>
              {!isMine && (
                <button
                  onClick={onSave}
                  title={project.is_saved ? 'Retirer des favoris' : 'Sauvegarder'}
                  style={{ fontSize: '18px', color: project.is_saved ? project.cover_color : 'var(--text-3)', transition: '.15s', padding: '4px' }}
                >
                  {project.is_saved ? '★' : '☆'}
                </button>
              )}
            </div>
          </div>

          {/* Needs */}
          {!!project.needs?.length && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>Recherche</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {project.needs.map(n => (
                  <span key={n} style={{ padding: '4px 11px', borderRadius: 'var(--r-full)', fontSize: '12px', fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                    {NEED_CONFIG[n]?.emoji} {NEED_CONFIG[n]?.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Funding */}
          {project.funding_type && project.funding_type !== 'non_applicable' && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'var(--surface)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Financement · </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{FUNDING_TYPES[project.funding_type]}</span>
            </div>
          )}

          {/* Sections */}
          {project.what && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>Le projet</div>
              <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.7 }}>{project.what}</p>
            </div>
          )}

          {project.how && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>Business model</div>
              <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.7 }}>{project.how}</p>
            </div>
          )}

          {project.why && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>Pourquoi ça va marcher</div>
              <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.7 }}>{project.why}</p>
            </div>
          )}

          {/* Tags */}
          {!!project.tags?.length && (
            <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {project.tags.map(t => (
                <span key={t} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--r-full)', background: 'var(--green-3)', color: 'var(--green)', fontWeight: 600 }}>
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Collaborators */}
          {!!project.collaborators?.length && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '10px' }}>Équipe</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {project.collaborators.map(c => {
                  const name = c.profile.display_name || `${c.profile.first_name ?? ''} ${c.profile.last_name ?? ''}`.trim()
                  const colInitials = ((c.profile.first_name?.[0] ?? '') + (c.profile.last_name?.[0] ?? '')).toUpperCase()
                  return (
                    <div key={c.user_id} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: project.cover_color, display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {c.profile.avatar_url
                          ? <img src={c.profile.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '10px', fontWeight: 800, color: '#fff' }}>{colInitials || '?'}</span>
                        }
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{name}</div>
                        {c.role && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{c.role}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Links */}
          {(project.website_url || (project.social_links && Object.values(project.social_links).some(Boolean))) && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '10px' }}>Liens</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {project.website_url && (
                  <a href={project.website_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600, textDecoration: 'none', padding: '4px 10px', borderRadius: 'var(--r-full)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                    🌐 Site web
                  </a>
                )}
                {project.social_links?.linkedin && (
                  <a href={project.social_links.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600, textDecoration: 'none', padding: '4px 10px', borderRadius: 'var(--r-full)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                    LinkedIn
                  </a>
                )}
                {project.social_links?.twitter && (
                  <a href={project.social_links.twitter} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600, textDecoration: 'none', padding: '4px 10px', borderRadius: 'var(--r-full)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                    X / Twitter
                  </a>
                )}
                {project.social_links?.instagram && (
                  <a href={project.social_links.instagram} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600, textDecoration: 'none', padding: '4px 10px', borderRadius: 'var(--r-full)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                    Instagram
                  </a>
                )}
                {project.social_links?.tiktok && (
                  <a href={project.social_links.tiktok} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600, textDecoration: 'none', padding: '4px 10px', borderRadius: 'var(--r-full)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                    TikTok
                  </a>
                )}
                {project.social_links?.youtube && (
                  <a href={project.social_links.youtube} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600, textDecoration: 'none', padding: '4px 10px', borderRadius: 'var(--r-full)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                    YouTube
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Contact form */}
          {!isMine && !!project.needs?.length && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '4px' }}>
              <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '14px' }}>
                Proposer mon aide
              </div>
              <ProjectContactForm project={project} currentUserId={currentUserId} onSuccess={onContactSent} />
            </div>
          )}

          {isMine && (
            <div style={{ padding: '14px', background: 'var(--surface)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>C'est votre projet · Gérez-le depuis le panneau <strong>Mes projets</strong></div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
