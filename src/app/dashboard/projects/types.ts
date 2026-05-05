export type ProjectStage = 'idee' | 'construction' | 'lancement' | 'croissance' | 'recherche'
export type ProjectNeed = 'associe' | 'investisseur' | 'client' | 'partenaire' | 'conseil' | 'talent' | 'prestataire'
export type FundingType = 'bootstrap' | 'love_money' | 'pre_seed' | 'seed' | 'serie_a' | 'non_applicable'

export interface ProjectAuthor {
  id: string
  first_name: string
  last_name: string
  avatar_url?: string
  role_title?: string
  rank?: string
  slug?: string
}

export interface ProjectCollaborator {
  id: string
  user_id: string
  role?: string
  profile: {
    id: string
    display_name: string
    first_name?: string
    last_name?: string
    avatar_url?: string
    referral_code?: string
    role_title?: string
    slug?: string
  }
}

export interface Project {
  id: string
  user_id: string
  title: string
  tagline?: string
  sector: string
  stage: ProjectStage
  needs: ProjectNeed[]
  funding_type?: FundingType
  cover_color: string
  logo_url?: string
  website_url?: string
  logo_url_full?: string
  social_links?: {
    linkedin?: string
    twitter?: string
    instagram?: string
    tiktok?: string
    youtube?: string
  }
  what?: string
  how?: string
  why?: string
  tags?: string[]
  is_active: boolean
  contacts_count?: number
  saves_count?: number
  is_saved?: boolean
  created_at: string
  author?: ProjectAuthor
  collaborators?: ProjectCollaborator[]
}

export interface ProjectContact {
  id: string
  project_id: string
  user_id: string
  need: ProjectNeed
  message: string
  created_at: string
  sender?: {
    first_name: string
    last_name: string
    avatar_url?: string
    role_title?: string
  }
}

export const STAGE_CONFIG: Record<ProjectStage, { label: string; color: string; bg: string }> = {
  idee:         { label: 'Idée',           color: '#C8790A', bg: '#FDF3E0' },
  construction: { label: 'En construction', color: '#2563EB', bg: '#EFF6FF' },
  lancement:    { label: 'Lancement',       color: '#7C3AED', bg: '#F5F3FF' },
  croissance:   { label: 'Croissance',      color: '#2F5446', bg: '#EAF2EE' },
  recherche:    { label: 'En recherche',    color: '#B91C1C', bg: '#FEF2F2' },
}

export const NEED_CONFIG: Record<ProjectNeed, { label: string; emoji: string }> = {
  associe:      { label: 'Associé·e',       emoji: '🤝' },
  investisseur: { label: 'Investisseur',    emoji: '💰' },
  client:       { label: 'Clients pilotes', emoji: '🎯' },
  partenaire:   { label: 'Partenaire',      emoji: '🔗' },
  conseil:      { label: 'Conseil',         emoji: '🧠' },
  talent:       { label: 'Talent',          emoji: '⚡' },
  prestataire:  { label: 'Prestataire',     emoji: '🛠️' },
}

export const FUNDING_TYPES: Record<FundingType, string> = {
  bootstrap:      'Bootstrapé',
  love_money:     'Love money',
  pre_seed:       'Pré-seed',
  seed:           'Seed',
  serie_a:        'Série A+',
  non_applicable: 'Non applicable',
}

export const SECTORS = [
  'SaaS B2B', 'Marketplace', 'Fintech', 'Healthtech', 'Edtech',
  'Retail / E-commerce', 'RH / Recrutement', 'PropTech', 'LegalTech',
  'Marketing / Growth', 'Data / IA', 'Cybersécurité', 'Logistique', 'Industrie',
  'Consulting / Services', 'Media / Contenu', 'Dev web / Agence', 'Autre',
]

export const COVER_COLORS = [
  '#2F5446', '#1E3A5F', '#4A1942', '#7C3AED',
  '#B91C1C', '#C8790A', '#0F766E', '#1D4ED8',
  '#047857', '#9D174D', '#374151', '#713F12',
]
