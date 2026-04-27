export type ContactType = 'champion' | 'decision' | 'blocker' | 'neutral'
export type Stage = 'Qualification' | 'Démo' | 'Proposition' | 'Négociation' | 'Closing'

export interface MeddiccItem {
  l: string
  n: string
  done: boolean
}

export interface MeddiccSection {
  cat: string
  items: MeddiccItem[]
}

export interface KaContact {
  id: string
  name: string
  role: string
  email: string
  notes: string
  type: ContactType
  x: number
  y: number
  checks: MeddiccSection[]
}

export interface KaAccount {
  id: string
  name: string
  sector: string
  val: string
  stage: Stage
  contacts: KaContact[]
}

export type NoteType = 'note' | 'call' | 'email' | 'meeting' | 'alert'

export interface KaNote {
  id: string
  user_id: string
  account_id: string
  content: string
  note_type: NoteType
  created_at: string
}

export const NOTE_TYPE_CONFIG: Record<NoteType, { label: string; color: string; bg: string }> = {
  note:    { label: 'Note',    color: 'var(--text-2)',  bg: 'var(--surface)'  },
  call:    { label: 'Appel',   color: '#3B82F6',        bg: '#EFF6FF'         },
  email:   { label: 'Email',   color: '#7C3AED',        bg: '#F5F3FF'         },
  meeting: { label: 'Réunion', color: 'var(--green)',   bg: 'var(--green-3)'  },
  alert:   { label: 'Alerte',  color: 'var(--amber)',   bg: 'var(--amber-2)'  },
}
