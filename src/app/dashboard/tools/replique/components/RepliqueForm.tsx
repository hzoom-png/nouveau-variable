'use client'

import { useState } from 'react'
import type { RepliqueConfig, ContactType, CallObjective } from '../types'

interface Props {
  initial?: Partial<RepliqueConfig>
  onSubmit: (config: RepliqueConfig) => void
  onCancel?: () => void
}

const CONTACT_OPTIONS: { value: ContactType; label: string; sub: string; icon: string }[] = [
  { value: 'decision_maker', label: 'Décideur', sub: 'DG, PDG, DAF…', icon: '👔' },
  { value: 'manager',        label: 'Manager',  sub: 'Intermédiaire', icon: '👤' },
  { value: 'secretary',      label: 'Secrétaire', sub: 'Standardiste', icon: '📋' },
  { value: 'technical',      label: 'Profil tech', sub: 'DSI, CTO…', icon: '💻' },
]

const OBJECTIVE_OPTIONS: { value: CallObjective; label: string; desc: string; icon: string }[] = [
  { value: 'rdv',           label: 'Prise de RDV',    desc: 'Décrocher un rdv',    icon: '📅' },
  { value: 'qualification', label: 'Qualification',    desc: 'Explorer le besoin',  icon: '🔍' },
  { value: 'barrage',       label: 'Barrage',          desc: 'Passer le filtre',    icon: '🚪' },
  { value: 'relance',       label: 'Relance',          desc: 'Suite à un envoi',    icon: '📨' },
  { value: 'closing',       label: 'Closing',          desc: 'Valider la déc.',     icon: '✅' },
  { value: 'cold',          label: 'Cold Call',        desc: 'Premier contact',     icon: '❄️' },
]

const SIZE_OPTIONS = ['TPE', 'PME', 'ETI', 'Grand compte']

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 13px', border: '1.5px solid var(--border)',
  borderRadius: 'var(--r-sm)', fontSize: '14px', fontFamily: 'inherit',
  color: 'var(--text)', background: 'var(--white)', outline: 'none', boxSizing: 'border-box' as const,
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-2)',
  letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '5px',
}

export default function RepliqueForm({ initial = {}, onSubmit, onCancel }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [product, setProduct] = useState(initial.product ?? '')
  const [valueprop, setValueprop] = useState(initial.valueprop ?? '')
  const [contactType, setContactType] = useState<ContactType>(initial.contact_type ?? 'decision_maker')
  const [contactRole, setContactRole] = useState(initial.contact_role ?? '')
  const [sector, setSector] = useState(initial.company_sector ?? '')
  const [size, setSize] = useState(initial.company_size ?? '')
  const [objective, setObjective] = useState<CallObjective>(initial.objective ?? 'rdv')
  const [previousContact, setPreviousContact] = useState(initial.previous_contact ?? false)
  const [context, setContext] = useState(initial.context ?? '')
  const [knownPain, setKnownPain] = useState(initial.known_pain ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      product, valueprop, contact_type: contactType, contact_role: contactRole,
      company_sector: sector, company_size: size, objective,
      previous_contact: previousContact, context: context || undefined, known_pain: knownPain || undefined,
    })
  }

  const cardBtn = (active: boolean): React.CSSProperties => ({
    border: `1.5px solid ${active ? 'var(--green)' : 'var(--border)'}`,
    background: active ? 'var(--green-3)' : 'var(--white)',
    borderRadius: 'var(--r-md)', cursor: 'pointer', transition: '.15s', textAlign: 'left' as const,
    padding: '14px',
  })

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '24px', maxWidth: '640px' }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[1, 2].map(n => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '11px', fontWeight: 700, background: step >= n ? 'var(--green)' : 'var(--surface)', color: step >= n ? '#fff' : 'var(--text-3)', border: `1.5px solid ${step >= n ? 'var(--green)' : 'var(--border)'}`, transition: '.2s' }}>{n}</div>
            <span style={{ fontSize: '12px', color: step === n ? 'var(--text)' : 'var(--text-3)', fontWeight: step === n ? 600 : 400 }}>
              {n === 1 ? 'Ce que tu vends' : 'L\'objectif'}
            </span>
            {n < 2 && <div style={{ width: '20px', height: '1px', background: 'var(--border)' }} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={lbl}>Ce que tu proposes *</label>
            <input style={inp} required value={product} onChange={e => setProduct(e.target.value)} placeholder="Logiciel de gestion, prestation RH…" />
          </div>
          <div>
            <label style={lbl}>Ta proposition de valeur</label>
            <input style={inp} value={valueprop} onChange={e => setValueprop(e.target.value)} placeholder="Ce que tu apportes concrètement au client…" />
          </div>

          <div>
            <label style={lbl}>Ton interlocuteur *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {CONTACT_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setContactType(opt.value)} style={cardBtn(contactType === opt.value)}>
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{opt.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: contactType === opt.value ? 'var(--green)' : 'var(--text)', marginBottom: '2px' }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Titre exact (optionnel)</label>
            <input style={inp} value={contactRole} onChange={e => setContactRole(e.target.value)} placeholder="DRH, Directeur Commercial, PDG…" />
          </div>

          <div>
            <label style={lbl}>Secteur de l&apos;entreprise</label>
            <input style={inp} value={sector} onChange={e => setSector(e.target.value)} placeholder="SaaS RH, BTP, Distribution…" />
          </div>

          <div>
            <label style={lbl}>Taille</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SIZE_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => setSize(s)} style={{ padding: '6px 14px', borderRadius: 'var(--r-full)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: '.14s', border: `1.5px solid ${size === s ? 'var(--green)' : 'var(--border)'}`, background: size === s ? 'var(--green-3)' : 'var(--white)', color: size === s ? 'var(--green)' : 'var(--text-2)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            {onCancel && (
              <button type="button" onClick={onCancel} style={{ padding: '10px 20px', borderRadius: 'var(--r-sm)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-2)' }}>
                Annuler
              </button>
            )}
            <button type="button" onClick={() => { if (product.trim()) setStep(2) }} style={{ padding: '10px 24px', borderRadius: 'var(--r-sm)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: product.trim() ? 'var(--green)' : 'var(--green-4)', color: '#fff', border: 'none', transition: '.15s' }}>
              Continuer →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={lbl}>Objectif de l&apos;appel *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {OBJECTIVE_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setObjective(opt.value)} style={cardBtn(objective === opt.value)}>
                  <div style={{ fontSize: '18px', marginBottom: '5px' }}>{opt.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: objective === opt.value ? 'var(--green)' : 'var(--text)', marginBottom: '2px' }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Premier contact ?</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { val: true, label: 'Cold — jamais parlé' },
                { val: false, label: 'Déjà en contact' },
              ].map(opt => (
                <button key={String(opt.val)} type="button" onClick={() => setPreviousContact(!opt.val)} style={{ padding: '7px 14px', borderRadius: 'var(--r-full)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: '.14s', border: `1.5px solid ${previousContact === !opt.val ? 'var(--green)' : 'var(--border)'}`, background: previousContact === !opt.val ? 'var(--green-3)' : 'var(--white)', color: previousContact === !opt.val ? 'var(--green)' : 'var(--text-2)' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Contexte additionnel (optionnel)</label>
            <textarea rows={2} style={{ ...inp, resize: 'none', lineHeight: 1.6 }} value={context} onChange={e => setContext(e.target.value)} placeholder={"Ex : j'ai envoyé un email il y a 3 jours,\nils recrutent massivement en ce moment…"} />
          </div>

          <div>
            <label style={lbl}>Douleur identifiée (optionnel)</label>
            <input style={inp} value={knownPain} onChange={e => setKnownPain(e.target.value)} placeholder="Ex : problème de rétention, coût trop élevé…" />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={() => setStep(1)} style={{ padding: '10px 20px', borderRadius: 'var(--r-sm)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-2)' }}>
              ← Retour
            </button>
            <button type="submit" style={{ padding: '10px 24px', borderRadius: 'var(--r-sm)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'var(--green)', color: '#fff', border: 'none', transition: '.15s' }}>
              Générer mon script →
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
