export type CallObjective =
  | 'rdv'
  | 'qualification'
  | 'barrage'
  | 'relance'
  | 'closing'
  | 'cold'

export type ContactType =
  | 'decision_maker'
  | 'manager'
  | 'secretary'
  | 'technical'
  | 'user'

export interface RepliqueConfig {
  product: string
  valueprop: string
  contact_type: ContactType
  contact_role: string
  company_sector: string
  company_size: string
  objective: CallObjective
  context?: string
  known_pain?: string
  previous_contact?: boolean
}

export interface ScriptBlock {
  id: string
  type: 'hook' | 'pitch' | 'question' | 'objection' | 'rebound' | 'cta' | 'barrage' | 'closing'
  label: string
  content: string
  tip?: string
  duration?: string
}

export interface ObjectionCard {
  objection: string
  rebound: string
  tone_tip: string
}

export interface RepliqueScript {
  id: string
  config: RepliqueConfig
  blocks: ScriptBlock[]
  objections: ObjectionCard[]
  dos: string[]
  donts: string[]
  estimated_duration: string
  difficulty: 'facile' | 'moyen' | 'difficile'
  created_at: string
}
