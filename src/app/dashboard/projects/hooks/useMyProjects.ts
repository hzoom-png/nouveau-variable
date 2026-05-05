'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project, ProjectContact, ProjectCollaborator } from '../types'

export function useMyProjects(userId: string) {
  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) { console.error('[useMyProjects] query error:', error); setLoading(false); return }

    const rows = data ?? []

    // Fetch collaborators separately (avoids FK join issue with auth.users)
    const projectIds = rows.map(p => p.id as string)
    let collabsByProject: Record<string, ProjectCollaborator[]> = {}
    if (projectIds.length) {
      const { data: collabRows } = await supabase
        .from('project_collaborators')
        .select('project_id, id, user_id, role')
        .in('project_id', projectIds)
      const collabUserIds = [...new Set((collabRows ?? []).map(c => c.user_id as string))]
      const collabProfiles: Record<string, { id: string; display_name: string; first_name?: string; last_name?: string; avatar_url?: string; referral_code?: string; role_title?: string; slug?: string }> = {}
      if (collabUserIds.length) {
        const { data: cp } = await supabase
          .from('profiles')
          .select('id, display_name, first_name, last_name, avatar_url, referral_code, role_title, slug')
          .in('id', collabUserIds)
        ;(cp ?? []).forEach(p => { collabProfiles[p.id] = p })
      }
      ;(collabRows ?? []).forEach(c => {
        if (!collabsByProject[c.project_id]) collabsByProject[c.project_id] = []
        collabsByProject[c.project_id].push({ ...c, profile: collabProfiles[c.user_id] ?? { id: c.user_id, display_name: '' } } as ProjectCollaborator)
      })
    }

    setMyProjects(rows.map(p => ({
      ...p,
      collaborators: collabsByProject[p.id] ?? [],
    })))
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const createProject = useCallback(async (
    fields: Omit<Project, 'id' | 'user_id' | 'created_at' | 'contacts_count' | 'saves_count' | 'is_saved' | 'author'>
  ): Promise<string | null> => {
    const id = crypto.randomUUID()

    // Optimistic update
    const optimistic: Project = {
      ...fields, id, user_id: userId,
      created_at: new Date().toISOString(),
      contacts_count: 0, saves_count: 0,
    }
    setMyProjects(prev => [optimistic, ...prev])

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...fields }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
      console.error('[createProject] error:', err)
      setMyProjects(prev => prev.filter(p => p.id !== id))
      return null
    }

    await load()
    return id
  }, [userId, load])

  const updateProject = useCallback(async (id: string, fields: Partial<Project>) => {
    // Optimistic update
    setMyProjects(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p))

    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
      console.error('[updateProject] error:', err)
      await load()
    } else if (fields.collaborators !== undefined) {
      await load()
    }
  }, [load])

  const toggleActive = useCallback(async (id: string) => {
    const project = myProjects.find(p => p.id === id)
    if (!project) return
    await updateProject(id, { is_active: !project.is_active })
  }, [myProjects, updateProject])

  const deleteProject = useCallback(async (id: string) => {
    setMyProjects(prev => prev.filter(p => p.id !== id))

    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
      console.error('[deleteProject] error:', err)
      await load()
    }
  }, [load])

  const getContacts = useCallback(async (projectId: string): Promise<ProjectContact[]> => {
    const supabase = createClient()
    const { data } = await supabase
      .from('project_contacts')
      .select('*, sender:profiles!project_contacts_user_id_fkey(first_name, last_name, avatar_url, role_title)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    return data ?? []
  }, [])

  return { myProjects, loading, createProject, updateProject, toggleActive, deleteProject, getContacts, reload: load }
}
