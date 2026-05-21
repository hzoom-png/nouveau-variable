'use client'

import { useState } from 'react'
import type { Project, ProjectStage, ProjectNeed, FundingType, ProjectCollaborator } from '../types'
import { STAGE_CONFIG, NEED_CONFIG, FUNDING_TYPES, SECTORS, COVER_COLORS } from '../types'
import { CollaboratorSearch } from './CollaboratorSearch'

type FormData = {
  title: string
  tagline: string
  sector: string
  stage: ProjectStage
  needs: ProjectNeed[]
  funding_type: FundingType
  cover_color: string
  logo_url: string
  what: string
  how: string
  why: string
  tags: string
  is_active: boolean
  website_url: string
  social_linkedin: string
  social_twitter: string
  social_instagram: string
  social_tiktok: string
  social_youtube: string
  collaborators: ProjectCollaborator[]
}

const EMPTY: FormData = {
  title: '', tagline: '', sector: SECTORS[0], stage: 'idee',
  needs: [], funding_type: 'non_applicable', cover_color: COVER_COLORS[0],
  logo_url: '', what: '', how: '', why: '', tags: '', is_active: true,
  website_url: '', social_linkedin: '', social_twitter: '', social_instagram: '',
  social_tiktok: '', social_youtube: '', collaborators: [],
}

const STEPS = ['Essentiels', 'Détails', 'Contenu & besoins', 'Liens & équipe']

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 13px',
  border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)',
  fontSize: '14px', color: 'var(--text)', background: 'var(--white)',
  outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s',
}

const lbl: React.CSSProperties = {
  fontSize: '12px', fontWeight: 700, color: 'var(--text-2)',
  textTransform: 'uppercase', letterSpacing: '.06em',
  marginBottom: '6px', display: 'block',
}

interface Props {
  currentUserId: string
  onSubmit: (data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'contacts_count' | 'saves_count' | 'is_saved' | 'author'>) => Promise<void>
  onCancel: () => void
}

export function CreateProjectFlow({ currentUserId, onSubmit, onCancel }: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormData>(EMPTY)

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function toggleNeed(n: ProjectNeed) {
    setForm(f => ({
      ...f,
      needs: f.needs.includes(n) ? f.needs.filter(x => x !== n) : [...f.needs, n],
    }))
  }

  function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = 'var(--green)'
  }
  function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = 'var(--border)'
  }

  function validateStep(): string {
    if (step === 1 && !form.title.trim()) return 'Le nom du projet est obligatoire'
    if (step === 3 && !form.needs.length) return 'Sélectionne au moins un besoin'
    return ''
  }

  function handleNext() {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  function handleBack() {
    setError('')
    setStep(s => s - 1)
  }

  async function handleSubmit() {
    const err = validateStep()
    if (err) { setError(err); return }
    setLoading(true)
    setError('')
    const social: NonNullable<Project['social_links']> = {}
    if (form.social_linkedin.trim()) social.linkedin = form.social_linkedin.trim()
    if (form.social_twitter.trim()) social.twitter = form.social_twitter.trim()
    if (form.social_instagram.trim()) social.instagram = form.social_instagram.trim()
    if (form.social_tiktok.trim()) social.tiktok = form.social_tiktok.trim()
    if (form.social_youtube.trim()) social.youtube = form.social_youtube.trim()
    try {
      await onSubmit({
        title: form.title.trim(),
        tagline: form.tagline.trim() || undefined,
        sector: form.sector,
        stage: form.stage,
        needs: form.needs,
        funding_type: form.funding_type,
        cover_color: form.cover_color,
        logo_url: form.logo_url.trim() || undefined,
        what: form.what.trim() || undefined,
        how: form.how.trim() || undefined,
        why: form.why.trim() || undefined,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        is_active: true,
        website_url: form.website_url.trim() || undefined,
        social_links: Object.keys(social).length ? social : undefined,
        collaborators: form.collaborators,
      })
    } catch {
      setError('Erreur lors de la création du projet')
      setLoading(false)
    }
  }

  const pct = (step / STEPS.length) * 100

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(1, 39, 34, 0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        width: '100%', maxWidth: '560px',
        background: 'var(--white)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column',
        maxHeight: 'calc(100vh - 32px)',
        overflow: 'hidden',
      }}>

        {/* Progress bar */}
        <div style={{ height: '4px', background: 'var(--border)', flexShrink: 0 }}>
          <div style={{
            height: '100%', background: 'var(--green)',
            width: `${pct}%`, transition: 'width .3s ease',
          }} />
        </div>

        {/* Header */}
        <div style={{
          padding: '24px 28px 0',
          flexShrink: 0,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{
              fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: '20px',
              color: 'var(--text)', marginBottom: '4px',
            }}>
              {STEPS[step - 1]}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 500 }}>
              Étape {step} sur {STEPS.length}
            </p>
          </div>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingTop: '4px' }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i + 1 === step ? '20px' : '8px',
                height: '8px',
                borderRadius: 'var(--r-full)',
                background: i + 1 <= step ? 'var(--green)' : 'var(--border)',
                transition: 'all .3s ease',
              }} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>

          {/* ── Step 1: Essentiels ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={lbl}>Nom du projet *</label>
                <input
                  style={inp} value={form.title}
                  onChange={e => set('title', e.target.value)}
                  onFocus={focusBorder} onBlur={blurBorder}
                  placeholder="ex: MarketAI" maxLength={80}
                  autoFocus
                />
              </div>
              <div>
                <label style={lbl}>Tagline</label>
                <input
                  style={inp} value={form.tagline}
                  onChange={e => set('tagline', e.target.value)}
                  onFocus={focusBorder} onBlur={blurBorder}
                  placeholder="En une phrase, l'essentiel du projet"
                  maxLength={160}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '5px' }}>
                  {form.tagline.length}/160
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Détails ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={lbl}>Secteur *</label>
                <select
                  style={inp} value={form.sector}
                  onChange={e => set('sector', e.target.value)}
                  onFocus={focusBorder} onBlur={blurBorder}
                >
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label style={lbl}>Étape du projet *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(Object.keys(STAGE_CONFIG) as ProjectStage[]).map(s => {
                    const cfg = STAGE_CONFIG[s]
                    const active = form.stage === s
                    return (
                      <button key={s} type="button" onClick={() => set('stage', s)} style={{
                        padding: '7px 14px', borderRadius: 'var(--r-full)', fontSize: '12px',
                        fontWeight: 700, border: '1.5px solid', cursor: 'pointer', transition: '.14s',
                        borderColor: active ? cfg.color : 'var(--border)',
                        background: active ? cfg.bg : 'var(--white)',
                        color: active ? cfg.color : 'var(--text-2)',
                      }}>
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={lbl}>Type de financement</label>
                <select
                  style={inp} value={form.funding_type}
                  onChange={e => set('funding_type', e.target.value as FundingType)}
                  onFocus={focusBorder} onBlur={blurBorder}
                >
                  {(Object.keys(FUNDING_TYPES) as FundingType[]).map(k =>
                    <option key={k} value={k}>{FUNDING_TYPES[k]}</option>
                  )}
                </select>
              </div>

              <div>
                <label style={lbl}>Couleur de couverture</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {COVER_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => set('cover_color', c)} style={{
                      width: '28px', height: '28px', borderRadius: 'var(--r-sm)',
                      background: c, cursor: 'pointer', transition: '.14s',
                      border: form.cover_color === c ? '3px solid var(--text)' : '2px solid transparent',
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Contenu & besoins ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={lbl}>Ce que tu recherches *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(Object.keys(NEED_CONFIG) as ProjectNeed[]).map(n => {
                    const active = form.needs.includes(n)
                    return (
                      <button key={n} type="button" onClick={() => toggleNeed(n)} style={{
                        padding: '6px 13px', borderRadius: 'var(--r-full)', fontSize: '12px',
                        fontWeight: 600, border: '1.5px solid', cursor: 'pointer', transition: '.14s',
                        borderColor: active ? 'var(--green)' : 'var(--border)',
                        background: active ? 'var(--green-3)' : 'var(--white)',
                        color: active ? 'var(--green)' : 'var(--text-2)',
                      }}>
                        {NEED_CONFIG[n].emoji} {NEED_CONFIG[n].label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={lbl}>Le projet (quoi)</label>
                <textarea
                  style={{ ...inp, resize: 'vertical' }} value={form.what}
                  onChange={e => set('what', e.target.value)}
                  onFocus={focusBorder} onBlur={blurBorder}
                  placeholder="Décrivez le projet en quelques phrases…"
                  rows={3} maxLength={1000}
                />
              </div>

              <div>
                <label style={lbl}>Business model (comment)</label>
                <textarea
                  style={{ ...inp, resize: 'vertical' }} value={form.how}
                  onChange={e => set('how', e.target.value)}
                  onFocus={focusBorder} onBlur={blurBorder}
                  placeholder="Comment le projet génère de la valeur…"
                  rows={3} maxLength={1000}
                />
              </div>

              <div>
                <label style={lbl}>Traction / différenciation (pourquoi)</label>
                <textarea
                  style={{ ...inp, resize: 'vertical' }} value={form.why}
                  onChange={e => set('why', e.target.value)}
                  onFocus={focusBorder} onBlur={blurBorder}
                  placeholder="Pourquoi ça va marcher, vos atouts…"
                  rows={3} maxLength={1000}
                />
              </div>

              <div>
                <label style={lbl}>Tags (séparés par des virgules)</label>
                <input
                  style={inp} value={form.tags}
                  onChange={e => set('tags', e.target.value)}
                  onFocus={focusBorder} onBlur={blurBorder}
                  placeholder="ex: IA, No-code, B2B"
                />
              </div>
            </div>
          )}

          {/* ── Step 4: Liens & équipe ── */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={lbl}>Site web</label>
                <input
                  style={inp} value={form.website_url}
                  onChange={e => set('website_url', e.target.value)}
                  onFocus={focusBorder} onBlur={blurBorder}
                  placeholder="https://monprojet.com"
                />
              </div>

              <div>
                <label style={lbl}>Réseaux sociaux</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {([
                    { key: 'social_linkedin' as const, label: 'LinkedIn', ph: 'https://linkedin.com/company/…' },
                    { key: 'social_twitter' as const, label: 'X / Twitter', ph: 'https://x.com/…' },
                    { key: 'social_instagram' as const, label: 'Instagram', ph: 'https://instagram.com/…' },
                    { key: 'social_tiktok' as const, label: 'TikTok', ph: 'https://tiktok.com/@…' },
                    { key: 'social_youtube' as const, label: 'YouTube', ph: 'https://youtube.com/@…' },
                  ]).map(({ key, label, ph }) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-3)', width: '76px', flexShrink: 0 }}>
                        {label}
                      </span>
                      <input
                        style={{ ...inp, flex: 1 }} value={form[key]}
                        onChange={e => set(key, e.target.value)}
                        onFocus={focusBorder} onBlur={blurBorder}
                        placeholder={ph}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>Membres de l'équipe</label>
                <CollaboratorSearch
                  currentUserId={currentUserId}
                  selected={form.collaborators}
                  onChange={collabs => set('collaborators', collabs)}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px' }}>
                  {form.collaborators.length}/5 coéquipiers
                </div>
              </div>
            </div>
          )}

          {/* Inline error */}
          {error && (
            <div style={{
              marginTop: '16px', padding: '10px 14px',
              background: 'var(--red-2)', border: '1px solid var(--red)',
              borderRadius: 'var(--r-sm)', fontSize: '13px',
              color: 'var(--red)', fontWeight: 500,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          {/* Annuler */}
          <button
            onClick={onCancel}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500, color: 'var(--text-3)',
              padding: '8px 4px', transition: 'color .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            Annuler
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Retour */}
            {step > 1 && (
              <button
                onClick={handleBack}
                style={{
                  padding: '9px 18px', borderRadius: 'var(--r-sm)',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  border: '1.5px solid var(--border)',
                  background: 'var(--white)', color: 'var(--text-2)',
                  transition: '.14s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
              >
                ← Retour
              </button>
            )}

            {/* Suivant / Créer */}
            {step < STEPS.length ? (
              <button
                onClick={handleNext}
                style={{
                  padding: '9px 22px', borderRadius: 'var(--r-sm)',
                  background: 'var(--green)', color: '#fff', border: 'none',
                  fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '13px',
                  cursor: 'pointer', transition: 'background .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--green-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--green)')}
              >
                Suivant →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  padding: '9px 22px', borderRadius: 'var(--r-sm)',
                  background: loading ? 'var(--border)' : 'var(--green)',
                  color: loading ? 'var(--text-3)' : '#fff', border: 'none',
                  fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer', transition: 'background .15s',
                }}
              >
                {loading ? 'Création…' : 'Créer le projet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
