'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project, ProjectCollaborator, ProjectNeed, ProjectStage } from '../types'

export interface ProjectFilters {
  search: string
  sector: string
  stage: ProjectStage | ''
  needs: ProjectNeed[]
}

const PAGE_SIZE = 24

export function useProjects(currentUserId: string) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<ProjectFilters>({ search: '', sector: '', stage: '', needs: [] })
  const prevFilters = useRef(filters)

  const load = useCallback(async (pageIdx: number, f: ProjectFilters) => {
    setLoading(true)
    const supabase = createClient()

    let q = supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(pageIdx * PAGE_SIZE, (pageIdx + 1) * PAGE_SIZE - 1)

    if (f.sector) q = q.eq('sector', f.sector)
    if (f.stage) q = q.eq('stage', f.stage)
    if (f.search) q = q.ilike('title', `%${f.search}%`)
    if (f.needs.length) q = q.overlaps('needs', f.needs)

    const { data, count, error } = await q

    if (error) { console.error('[useProjects] query error:', error); setLoading(false); return }

    const rows = data ?? []
    if (!rows.length) {
      setProjects(prev => pageIdx === 0 ? [] : prev)
      setHasMore(false)
      setLoading(false)
      return
    }

    // Fetch author profiles separately (avoids FK join issue with auth.users)
    const authorIds = [...new Set(rows.map(r => r.user_id as string))]
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role_title, rank, slug')
      .in('id', authorIds)
    const authorMap = Object.fromEntries((authors ?? []).map(a => [a.id, a]))

    // Fetch saves for current user
    const { data: saves } = await supabase
      .from('project_saves')
      .select('project_id')
      .eq('user_id', currentUserId)
      .in('project_id', rows.map(r => r.id))
    const savedIds = new Set((saves ?? []).map(s => s.project_id as string))

    // Fetch collaborators separately (avoids FK join issue with auth.users)
    const projectIds = rows.map(r => r.id as string)
    const { data: collabRows } = await supabase
      .from('project_collaborators')
      .select('project_id, id, user_id, role')
      .in('project_id', projectIds)
    const collabProfiles: Record<string, { id: string; display_name: string; first_name?: string; last_name?: string; avatar_url?: string; role_title?: string; slug?: string }> = {}
    const collabUserIds = [...new Set((collabRows ?? []).map(c => c.user_id as string))]
    if (collabUserIds.length) {
      const { data: cp } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, last_name, avatar_url, role_title, slug')
        .in('id', collabUserIds)
      ;(cp ?? []).forEach(p => { collabProfiles[p.id] = p })
    }
    const collabsByProject: Record<string, ProjectCollaborator[]> = {}
    ;(collabRows ?? []).forEach(c => {
      if (!collabsByProject[c.project_id]) collabsByProject[c.project_id] = []
      collabsByProject[c.project_id].push({ ...c, profile: collabProfiles[c.user_id] ?? { id: c.user_id, display_name: '' } } as ProjectCollaborator)
    })

    const assembled: Project[] = rows.map(r => ({
      ...r,
      author: authorMap[r.user_id as string] ?? undefined,
      is_saved: savedIds.has(r.id),
      collaborators: collabsByProject[r.id] ?? [],
    }))

    setProjects(prev => pageIdx === 0 ? assembled : [...prev, ...assembled])
    setHasMore((count ?? 0) > (pageIdx + 1) * PAGE_SIZE)
    setLoading(false)
  }, [currentUserId])

  useEffect(() => {
    const changed = JSON.stringify(filters) !== JSON.stringify(prevFilters.current)
    if (changed) {
      prevFilters.current = filters
      setPage(0)
      load(0, filters)
    }
  }, [filters, load])

  useEffect(() => {
    load(0, filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function loadMore() {
    const next = page + 1
    setPage(next)
    load(next, filters)
  }

  const toggleSave = useCallback(async (projectId: string) => {
    const supabase = createClient()
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    const wasSaved = project.is_saved

    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, is_saved: !wasSaved, saves_count: (p.saves_count ?? 0) + (wasSaved ? -1 : 1) } : p
    ))

    if (wasSaved) {
      await supabase.from('project_saves').delete()
        .eq('project_id', projectId).eq('user_id', currentUserId)
    } else {
      await supabase.from('project_saves').insert({ project_id: projectId, user_id: currentUserId })
    }
  }, [projects, currentUserId])

  const updateProjectLocally = useCallback((id: string, patch: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
  }, [])

  return { projects, loading, hasMore, loadMore, filters, setFilters, toggleSave, updateProjectLocally, reload: () => load(0, filters) }
}
