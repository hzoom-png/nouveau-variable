import type { ContactType, KaContact, MeddiccSection } from './types'

export const MEDDICC_TEMPLATES: Record<ContactType, MeddiccSection[]> = {
  champion: [
    { cat: 'Champion', items: [
      { l: 'A exprimé un problème business clair', n: '', done: false },
      { l: 'Comprend et valorise ta solution', n: '', done: false },
      { l: 'A défendu ta solution en interne', n: '', done: false },
      { l: 'A accès aux décideurs', n: '', done: false },
      { l: "T'a fourni des informations confidentielles", n: '', done: false },
    ]},
    { cat: 'Metrics', items: [
      { l: 'A quantifié le problème en chiffres', n: '', done: false },
      { l: 'A défini un objectif mesurable', n: '', done: false },
    ]},
  ],
  decision: [
    { cat: 'Decision process', items: [
      { l: 'A décrit le processus de décision interne', n: '', done: false },
      { l: 'A identifié les autres parties prenantes', n: '', done: false },
      { l: 'A indiqué un calendrier de décision', n: '', done: false },
    ]},
    { cat: 'Economic buyer', items: [
      { l: 'Contrôle le budget pour ce projet', n: '', done: false },
      { l: 'A validé que le budget existe', n: '', done: false },
      { l: "A donné son accord de principe", n: '', done: false },
    ]},
    { cat: 'Decision criteria', items: [
      { l: 'A listé ses critères de sélection', n: '', done: false },
      { l: 'A confirmé que tu cibles les bons critères', n: '', done: false },
    ]},
  ],
  blocker: [
    { cat: 'Competition', items: [
      { l: 'Source du blocage identifiée', n: '', done: false },
      { l: 'Objection principale documentée', n: '', done: false },
      { l: "Réponse à l'objection préparée", n: '', done: false },
      { l: 'Alternative proposée', n: '', done: false },
    ]},
    { cat: 'Identify pain', items: [
      { l: 'Sa douleur personnelle identifiée', n: '', done: false },
      { l: 'Impact du blocage estimé', n: '', done: false },
    ]},
  ],
  neutral: [
    { cat: 'Identify pain', items: [
      { l: 'Douleur ou intérêt exprimé', n: '', done: false },
      { l: 'Peut devenir champion potentiel', n: '', done: false },
    ]},
    { cat: 'Champion', items: [
      { l: 'Accès à des décideurs confirmé', n: '', done: false },
      { l: "Disposé à t'introduire en interne", n: '', done: false },
    ]},
  ],
}

export interface KaStyle {
  bg: string
  border: string
  text: string
  label: string
  avBg: string
  avColor: string
}

export const KA_STYLES: Record<ContactType, KaStyle> = {
  champion: { bg: 'var(--green-3)', border: 'var(--green)', text: 'var(--green)', label: 'Champion', avBg: 'var(--green-3)', avColor: 'var(--green)' },
  decision: { bg: '#EEF4FF', border: '#4B7BF5', text: '#4B7BF5', label: 'Décideur', avBg: '#EEF4FF', avColor: '#4B7BF5' },
  blocker: { bg: 'var(--red-2)', border: 'var(--red)', text: 'var(--red)', label: 'Bloqueur', avBg: 'var(--red-2)', avColor: 'var(--red)' },
  neutral: { bg: 'var(--surface)', border: 'var(--border-2)', text: 'var(--text-2)', label: 'Influenceur', avBg: 'var(--surface-2)', avColor: 'var(--text-2)' },
}

export const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  Qualification: { bg: 'var(--amber-2)', text: 'var(--amber)' },
  Démo:          { bg: '#EEF4FF',        text: '#4B7BF5' },
  Proposition:   { bg: '#F0EDFF',        text: '#7C5CBF' },
  Négociation:   { bg: 'var(--green-3)', text: 'var(--green)' },
  Closing:       { bg: 'var(--green-3)', text: 'var(--green)' },
}

export function getInitials(name: string): string {
  return name.trim().split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '?'
}

export function getScore(contacts: KaContact[]): number {
  const done  = contacts.reduce((a, c) => a + c.checks.reduce((b, s) => b + s.items.filter(i => i.done).length, 0), 0)
  const total = contacts.reduce((a, c) => a + c.checks.reduce((b, s) => b + s.items.length, 0), 0)
  return total ? Math.round((done / total) * 100) : 0
}

export function cloneTemplate(type: ContactType): MeddiccSection[] {
  return JSON.parse(JSON.stringify(MEDDICC_TEMPLATES[type])) as MeddiccSection[]
}

export function getNextAction(account: import('./types').KaAccount): string {
  const score = getScore(account.contacts)
  const champions = account.contacts.filter(c => c.type === 'champion')
  const decisions = account.contacts.filter(c => c.type === 'decision')
  const blockers  = account.contacts.filter(c => c.type === 'blocker')

  if (blockers.length > 0) {
    const unresolved = blockers.find(c => c.checks.some(s => s.items.some(i => !i.done)))
    if (unresolved) return `Traiter le blocage de ${unresolved.name}`
  }
  if (champions.length === 0) return 'Identifier un champion interne'
  if (decisions.length === 0) return 'Identifier le décideur budget'

  const champScore = champions[0] ? getScore([champions[0]]) : 0
  if (champScore < 60) return `Qualifier ${champions[0].name} en champion`

  if (account.stage === 'Qualification') return 'Planifier une démo produit'
  if (account.stage === 'Démo') return 'Envoyer une proposition commerciale'
  if (account.stage === 'Proposition') return 'Relancer pour négociation'
  if (account.stage === 'Négociation') return 'Obtenir le bon de commande'
  if (account.stage === 'Closing') return 'Finaliser le contrat'

  if (score < 40) return 'Compléter les critères MEDDICC'
  if (score < 70) return 'Approfondir la qualification'
  return 'Préparer la proposition finale'
}
