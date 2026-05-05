'use client'

import { useState, useEffect } from 'react'
import type { Project, ProjectContact } from '../types'
import { STAGE_CONFIG, NEED_CONFIG } from '../types'
import { ProjectForm } from './ProjectForm'

interface Props {
  myProjects: Project[]
  loading: boolean
  currentUserId: string
  authorName: string
  onCreateProject: (data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'contacts_count' | 'saves_count' | 'is_saved' | 'author'>) => Promise<void>
  onUpdateProject: (id: string, fields: Partial<Project>) => Promise<void>
  onToggleActive: (id: string) => Promise<void>
  onDeleteProject: (id: string) => Promise<void>
  onGetContacts: (projectId: string) => Promise<ProjectContact[]>
  onClose: () => void
  showForm?: boolean
  onFormClose?: () => void
}

export function MyProjectsPanel({
  myProjects, loading, currentUserId, authorName,
  onCreateProject, onUpdateProject, onToggleActive, onDeleteProject, onGetContacts,
  onClose, showForm, onFormClose,
}: Props) {
  const [editing, setEditing] = useState<Project | null>(null)
  const [contacts, setContacts] = useState<Record<string, ProjectContact[]>>({})
  const [expandedContacts, setExpandedContacts] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(showForm ?? false)

  useEffect(() => {
    if (showForm) setShowNewForm(true)
  }, [showForm])

  async function loadContacts(projectId: string) {
    if (contacts[projectId]) {
      setExpandedContacts(expandedContacts === projectId ? null : projectId)
      return
    }
    const data = await onGetContacts(projectId)
    setContacts(c => ({ ...c, [projectId]: data }))
    setExpandedContacts(projectId)
  }

  function handleCloseForm() {
    setShowNewForm(false)
    setEditing(null)
    onFormClose?.()
  }

  async function handleCreate(data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'contacts_count' | 'saves_count' | 'is_saved' | 'author'>) {
    await onCreateProject(data)
    handleCloseForm()
  }

  async function handleUpdate(data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'contacts_count' | 'saves_count' | 'is_saved' | 'author'>) {
    if (!editing) return
    await onUpdateProject(editing.id, data)
    handleCloseForm()
  }

  return (
    <>
      <div className="project-modal-backdrop" onClick={onClose} />
      <aside className="my-projects-panel">
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: '16px', color: 'var(--text)' }}>Mes projets</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!showNewForm && !editing && (
              <button
                onClick={() => setShowNewForm(true)}
                style={{ background: 'var(--green)', color: '#fff', padding: '7px 14px', borderRadius: 'var(--r-sm)', fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '12px', border: 'none', cursor: 'pointer' }}
              >
                + Nouveau
              </button>
            )}
            <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: 'var(--r-sm)', background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: '16px', color: 'var(--text-2)' }}>×</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* New / edit form */}
          {(showNewForm || editing) && (
            <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--surface)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '16px' }}>
                {editing ? 'Modifier le projet' : 'Nouveau projet'}
              </div>
              <ProjectForm
                initial={editing ?? undefined}
                currentUserId={currentUserId}
                authorName={authorName}
                onSubmit={editing ? handleUpdate : handleCreate}
                onCancel={handleCloseForm}
                submitLabel={editing ? 'Enregistrer' : 'Publier'}
              />
            </div>
          )}

          {loading && <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: '24px' }}>Chargement…</div>}

          {!loading && !myProjects.length && !showNewForm && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚀</div>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Pas encore de projet</div>
              <div style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px' }}>Partagez vos projets avec la communauté</div>
              <button onClick={() => setShowNewForm(true)} style={{ background: 'var(--green)', color: '#fff', padding: '10px 22px', borderRadius: 'var(--r-sm)', fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
                Créer mon premier projet →
              </button>
            </div>
          )}

          {/* Project list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myProjects.map(project => {
              const stage = STAGE_CONFIG[project.stage]
              return (
                <div key={project.id} style={{ background: 'var(--white)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', overflow: 'hidden', opacity: project.is_active ? 1 : 0.6 }}>
                  {/* Color strip */}
                  <div style={{ height: '4px', background: project.cover_color }} />
                  <div style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '2px' }}>{project.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '6px' }}>{project.sector}</div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 'var(--r-full)', fontSize: '10px', fontWeight: 700, background: stage.bg, color: stage.color }}>
                            {stage.label}
                          </span>
                          {!project.is_active && (
                            <span style={{ padding: '2px 8px', borderRadius: 'var(--r-full)', fontSize: '10px', fontWeight: 700, background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                              En pause
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Needs */}
                    {!!project.needs?.length && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                        {project.needs.map(n => (
                          <span key={n} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: 'var(--r-full)', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
                            {NEED_CONFIG[n]?.emoji} {NEED_CONFIG[n]?.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button onClick={() => { setEditing(project); setShowNewForm(false) }} style={{ fontSize: '11px', padding: '5px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer' }}>
                        Modifier
                      </button>
                      <button onClick={() => onToggleActive(project.id)} style={{ fontSize: '11px', padding: '5px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer' }}>
                        {project.is_active ? 'Mettre en pause' : 'Réactiver'}
                      </button>
                      <button onClick={() => loadContacts(project.id)} style={{ fontSize: '11px', padding: '5px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer' }}>
                        Contacts ({project.contacts_count ?? 0})
                      </button>
                      {confirmDelete === project.id ? (
                        <>
                          <button onClick={() => { onDeleteProject(project.id); setConfirmDelete(null) }} style={{ fontSize: '11px', padding: '5px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--red)', background: 'var(--red-2)', color: 'var(--red)', cursor: 'pointer', fontWeight: 700 }}>
                            Confirmer
                          </button>
                          <button onClick={() => setConfirmDelete(null)} style={{ fontSize: '11px', padding: '5px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer' }}>
                            Annuler
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(project.id)} style={{ fontSize: '11px', padding: '5px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-3)', cursor: 'pointer' }}>
                          Supprimer
                        </button>
                      )}
                    </div>

                    {/* Contacts list */}
                    {expandedContacts === project.id && contacts[project.id] && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '8px' }}>Contacts reçus</div>
                        {!contacts[project.id].length && (
                          <div style={{ fontSize: '13px', color: 'var(--text-3)', fontStyle: 'italic' }}>Aucun contact pour l'instant</div>
                        )}
                        {contacts[project.id].map(c => (
                          <div key={c.id} style={{ marginBottom: '10px', padding: '10px', background: 'var(--surface)', borderRadius: 'var(--r-sm)' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>
                                {c.sender?.first_name} {c.sender?.last_name}
                              </span>
                              <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: 'var(--r-full)', background: 'var(--green-3)', color: 'var(--green)', fontWeight: 600 }}>
                                {NEED_CONFIG[c.need]?.emoji} {NEED_CONFIG[c.need]?.label}
                              </span>
                            </div>
                            {c.sender?.role_title && <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '6px' }}>{c.sender.role_title}</div>}
                            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>{c.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </aside>
    </>
  )
}
