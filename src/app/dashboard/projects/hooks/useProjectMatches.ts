'use client'

import { useMemo } from 'react'
import type { Project } from '../types'

interface UserProfile {
  sectors?: string[]
  role_type?: string
  commercial_context?: { sector?: string; icp?: string }
  rank?: string
}

function scoreProject(project: Project, user: UserProfile): number {
  let score = 0

  // Sector match
  const userSectors = [
    ...(user.sectors ?? []),
    user.commercial_context?.sector,
  ].filter(Boolean) as string[]

  if (userSectors.some(s => project.sector.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(project.sector.toLowerCase()))) {
    score += 40
  }

  // Need match based on role
  const roleNeedMap: Record<string, string[]> = {
    salarie: ['conseil', 'talent'],
    freelance: ['client', 'prestataire', 'partenaire'],
    entrepreneur: ['client', 'investisseur', 'associe', 'partenaire'],
    dirigeant: ['client', 'partenaire', 'conseil', 'investisseur'],
  }
  const relevantNeeds = roleNeedMap[user.role_type ?? ''] ?? []
  const needOverlap = (project.needs ?? []).filter(n => relevantNeeds.includes(n))
  score += needOverlap.length * 20

  // Recency bonus (last 7 days = +10, last 30 days = +5)
  const ageMs = Date.now() - new Date(project.created_at).getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  if (ageDays < 7) score += 10
  else if (ageDays < 30) score += 5

  return score
}

export function useProjectMatches(projects: Project[], user: UserProfile | null) {
  const matches = useMemo(() => {
    if (!user || !projects.length) return []
    return projects
      .map(p => ({ project: p, score: scoreProject(p, user) }))
      .filter(({ score }) => score >= 30)
      .sort((a, b) => b.score - a.score)
      .map(({ project }) => project)
  }, [projects, user])

  return matches
}
