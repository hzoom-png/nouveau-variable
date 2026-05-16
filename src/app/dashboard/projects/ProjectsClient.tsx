'use client'

import { useRef, useState } from 'react'
import type { Profile } from '@/lib/types'
import type { Project } from './types'
import { useProjects } from './hooks/useProjects'
import { useMyProjects } from './hooks/useMyProjects'
import { useProjectMatches } from './hooks/useProjectMatches'
import { ProjectCard } from './components/ProjectCard'
import { ProjectModal } from './components/ProjectModal'
import { ProjectFiltersBar } from './components/ProjectFilters'
import { ProjectMatchBanner } from './components/ProjectMatchBanner'
import { MyProjectsPanel } from './components/MyProjectsPanel'
import { ProjectEmptyState } from './components/ProjectEmptyState'
import { useDashboard } from '@/lib/dashboard-context'
import { LockedSection } from '@/components/LockedSection'

interface Props {
  profile: Profile
}

export default function ProjectsClient({ profile }: Props) {
  const { isInactive, userEmail } = useDashboard()
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showMyProjects, setShowMyProjects] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const matchRef = useRef<HTMLDivElement>(null)

  const { projects, loading, hasMore, loadMore, filters, setFilters, toggleSave, reload } = useProjects(profile.id)
  const { myProjects, loading: myLoading, createProject, updateProject, toggleActive, deleteProject, getContacts } = useMyProjects(profile.id)
  const matches = useProjectMatches(projects, profile)

  const authorName = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()

  function handleContactSent() {
    if (selectedProject) {
      reload()
    }
  }

  async function handleCreateProject(data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'contacts_count' | 'saves_count' | 'is_saved' | 'author'>) {
    await createProject(data)
    reload()
  }

  async function handleUpdateProject(id: string, fields: Partial<Project>) {
    await updateProject(id, fields)
    reload()
  }

  function handleScrollToMatches() {
    matchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (isInactive) return <LockedSection feature="Les Projets sont réservés aux membres actifs" email={userEmail} />

  const myProjectIds = new Set(myProjects.map(p => p.id))

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: '22px', color: 'var(--text)', marginBottom: '4px' }}>Projets</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>Découvrez les projets de la communauté et proposez votre aide</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => { setShowMyProjects(true); setShowNewForm(false) }}
            style={{ padding: '9px 16px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--border)', background: 'var(--white)', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', transition: '.14s' }}
          >
            Mes projets {myProjects.length > 0 && `(${myProjects.length})`}
          </button>
          <button
            onClick={() => { setShowMyProjects(true); setShowNewForm(true) }}
            style={{ padding: '9px 18px', borderRadius: 'var(--r-sm)', background: 'var(--green)', color: '#fff', fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer', transition: '.15s' }}
          >
            + Partager un projet
          </button>
        </div>
      </div>

      {/* Match banner */}
      <ProjectMatchBanner matches={matches} onScrollToMatch={handleScrollToMatches} />

      {/* Filters */}
      <ProjectFiltersBar filters={filters} onChange={setFilters} total={projects.length} />

      {/* Grid */}
      {loading && !projects.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="project-card-skeleton" style={{ height: '220px', borderRadius: 'var(--r-lg)', background: 'var(--surface)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      ) : !projects.length ? (
        <ProjectEmptyState onCreateProject={() => { setShowMyProjects(true); setShowNewForm(true) }} />
      ) : (
        <>
          {/* Matches section */}
          {matches.length > 0 && (
            <div ref={matchRef}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '12px' }}>
                Projets pour vous
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px', marginBottom: '32px' }}>
                {matches.slice(0, 4).map(p => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    onClick={() => setSelectedProject(p)}
                    onSave={() => toggleSave(p.id)}
                    isMine={myProjectIds.has(p.id)}
                  />
                ))}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '12px' }}>
                Tous les projets
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {projects.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() => setSelectedProject(p)}
                onSave={() => toggleSave(p.id)}
                isMine={myProjectIds.has(p.id)}
              />
            ))}
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                onClick={loadMore}
                disabled={loading}
                style={{ padding: '10px 28px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--border)', background: 'var(--white)', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer' }}
              >
                {loading ? 'Chargement…' : 'Voir plus'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Project modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          currentUserId={profile.id}
          isMine={myProjectIds.has(selectedProject.id)}
          onClose={() => setSelectedProject(null)}
          onSave={() => toggleSave(selectedProject.id)}
          onContactSent={handleContactSent}
        />
      )}

      {/* My projects panel */}
      {showMyProjects && (
        <MyProjectsPanel
          myProjects={myProjects}
          loading={myLoading}
          currentUserId={profile.id}
          authorName={authorName}
          onCreateProject={handleCreateProject}
          onUpdateProject={handleUpdateProject}
          onToggleActive={toggleActive}
          onDeleteProject={deleteProject}
          onGetContacts={getContacts}
          onClose={() => { setShowMyProjects(false); setShowNewForm(false) }}
          showForm={showNewForm}
          onFormClose={() => setShowNewForm(false)}
        />
      )}
    </div>
  )
}
