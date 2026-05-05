'use client'

import { useState } from 'react'
import type { Project, ProjectStage, ProjectNeed, FundingType, ProjectCollaborator } from '../types'
import { STAGE_CONFIG, NEED_CONFIG, FUNDING_TYPES, SECTORS, COVER_COLORS } from '../types'
import { ProjectCard } from './ProjectCard'
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

interface Props {
  initial?: Partial<Project>
  currentUserId: string
  authorName: string
  onSubmit: (data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'contacts_count' | 'saves_count' | 'is_saved' | 'author'>) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px', border: '1.5px solid var(--border)',
  borderRadius: 'var(--r-sm)', fontSize: '14px', color: 'var(--text)',
  background: 'var(--white)', outline: 'none', fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px', fontWeight: 700, color: 'var(--text-2)',
  textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px', display: 'block',
}

export function ProjectForm({ initial, currentUserId, authorName, onSubmit, onCancel, submitLabel = 'Publier le projet' }: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormData>({
    ...EMPTY,
    ...(initial ? {
      title: initial.title ?? '',
      tagline: initial.tagline ?? '',
      sector: initial.sector ?? SECTORS[0],
      stage: initial.stage ?? 'idee',
      needs: Array.isArray(initial.needs) ? initial.needs : [],
      funding_type: initial.funding_type ?? 'non_applicable',
      cover_color: initial.cover_color ?? COVER_COLORS[0],
      logo_url: initial.logo_url ?? '',
      what: initial.what ?? '',
      how: initial.how ?? '',
      why: initial.why ?? '',
      tags: (initial.tags ?? []).join(', '),
      is_active: initial.is_active ?? true,
      website_url: initial.website_url ?? '',
      social_linkedin: initial.social_links?.linkedin ?? '',
      social_twitter: initial.social_links?.twitter ?? '',
      social_instagram: initial.social_links?.instagram ?? '',
      social_tiktok: initial.social_links?.tiktok ?? '',
      social_youtube: initial.social_links?.youtube ?? '',
      collaborators: initial.collaborators ?? [],
    } : {}),
  })

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function toggleNeed(n: ProjectNeed) {
    setForm(f => ({
      ...f,
      needs: f.needs.includes(n) ? f.needs.filter(x => x !== n) : [...f.needs, n],
    }))
  }

  const preview: Project = {
    id: 'preview',
    user_id: currentUserId,
    title: form.title || 'Mon projet',
    tagline: form.tagline || undefined,
    sector: form.sector,
    stage: form.stage,
    needs: form.needs,
    cover_color: form.cover_color,
    logo_url: form.logo_url || undefined,
    is_active: true,
    created_at: new Date().toISOString(),
    author: { id: currentUserId, first_name: authorName.split(' ')[0] ?? '', last_name: authorName.split(' ').slice(1).join(' ') ?? '' },
  }

  async function handleSubmit() {
    if (!form.title.trim()) { setError('Le titre est obligatoire'); return }
    if (!form.needs.length) { setError('Sélectionne au moins un besoin'); return }
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
        is_active: form.is_active,
        website_url: form.website_url.trim() || undefined,
        social_links: Object.keys(social).length ? social : undefined,
        collaborators: form.collaborators,
      })
    } catch {
      setError('Erreur lors de la publication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>
      {/* Form */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Step tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[{ n: 1, label: 'Essentiel' }, { n: 2, label: 'Contenu & besoins' }, { n: 3, label: 'Liens & équipe' }].map(s => (
            <button
              key={s.n}
              onClick={() => setStep(s.n)}
              style={{
                padding: '7px 16px', borderRadius: 'var(--r-sm)', fontSize: '13px', fontWeight: 700,
                border: '1.5px solid', cursor: 'pointer', transition: '.14s',
                borderColor: step === s.n ? 'var(--green)' : 'var(--border)',
                background: step === s.n ? 'var(--green-3)' : 'var(--white)',
                color: step === s.n ? 'var(--green)' : 'var(--text-2)',
              }}
            >
              {s.n}. {s.label}
            </button>
          ))}
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Nom du projet *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="ex: MarketAI" maxLength={80} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Tagline</label>
              <input value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="En une phrase, l'essentiel du projet" maxLength={160} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Secteur *</label>
              <select value={form.sector} onChange={e => set('sector', e.target.value)} style={{ ...inputStyle }}>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Étape *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(Object.keys(STAGE_CONFIG) as ProjectStage[]).map(s => {
                  const cfg = STAGE_CONFIG[s]
                  const active = form.stage === s
                  return (
                    <button key={s} type="button" onClick={() => set('stage', s)} style={{
                      padding: '6px 13px', borderRadius: 'var(--r-full)', fontSize: '12px', fontWeight: 700,
                      border: '1.5px solid', cursor: 'pointer', transition: '.14s',
                      borderColor: active ? cfg.color : 'var(--border)',
                      background: active ? cfg.bg : 'var(--white)',
                      color: active ? cfg.color : 'var(--text-2)',
                    }}>{cfg.label}</button>
                  )
                })}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Financement</label>
              <select value={form.funding_type} onChange={e => set('funding_type', e.target.value as FundingType)} style={{ ...inputStyle }}>
                {(Object.keys(FUNDING_TYPES) as FundingType[]).map(k => <option key={k} value={k}>{FUNDING_TYPES[k]}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Couleur de couverture</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {COVER_COLORS.map(c => (
                  <button
                    key={c} type="button" onClick={() => set('cover_color', c)}
                    style={{
                      width: '28px', height: '28px', borderRadius: 'var(--r-sm)', background: c,
                      border: form.cover_color === c ? '3px solid var(--text)' : '2px solid transparent',
                      cursor: 'pointer', transition: '.14s',
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setStep(2)} style={{ background: 'var(--green)', color: '#fff', padding: '10px 22px', borderRadius: 'var(--r-sm)', fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
                Suivant →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Besoins *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(Object.keys(NEED_CONFIG) as ProjectNeed[]).map(n => {
                  const active = form.needs.includes(n)
                  return (
                    <button key={n} type="button" onClick={() => toggleNeed(n)} style={{
                      padding: '6px 13px', borderRadius: 'var(--r-full)', fontSize: '12px', fontWeight: 600,
                      border: '1.5px solid', cursor: 'pointer', transition: '.14s',
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
              <label style={labelStyle}>Le projet (quoi)</label>
              <textarea value={form.what} onChange={e => set('what', e.target.value)} placeholder="Décrivez le projet en quelques phrases…" rows={3} maxLength={1000} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>Business model (comment)</label>
              <textarea value={form.how} onChange={e => set('how', e.target.value)} placeholder="Comment le projet génère de la valeur…" rows={3} maxLength={1000} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>Traction / différenciation (pourquoi)</label>
              <textarea value={form.why} onChange={e => set('why', e.target.value)} placeholder="Pourquoi ça va marcher, vos atouts…" rows={3} maxLength={1000} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>Tags (séparés par des virgules)</label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="ex: IA, No-code, B2B" style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} style={{ background: 'var(--surface)', color: 'var(--text-2)', padding: '10px 18px', borderRadius: 'var(--r-sm)', fontSize: '13px', fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer' }}>
                ← Retour
              </button>
              <button onClick={() => setStep(3)} style={{ background: 'var(--green)', color: '#fff', padding: '10px 22px', borderRadius: 'var(--r-sm)', fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
                Suivant →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Site web</label>
              <input value={form.website_url} onChange={e => set('website_url', e.target.value)} placeholder="https://monprojet.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Réseaux sociaux</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {([
                  { key: 'social_linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/…' },
                  { key: 'social_twitter', label: 'X / Twitter', placeholder: 'https://x.com/…' },
                  { key: 'social_instagram', label: 'Instagram', placeholder: 'https://instagram.com/…' },
                  { key: 'social_tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@…' },
                  { key: 'social_youtube', label: 'YouTube', placeholder: 'https://youtube.com/@…' },
                ] as { key: keyof FormData; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-3)', width: '80px', flexShrink: 0 }}>{label}</span>
                    <input value={form[key] as string} onChange={e => set(key, e.target.value)} placeholder={placeholder} style={{ ...inputStyle, flex: 1 }} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Membres de l'équipe</label>
              <CollaboratorSearch
                currentUserId={currentUserId}
                selected={form.collaborators}
                onChange={collabs => set('collaborators', collabs)}
              />
            </div>

            {error && <div style={{ fontSize: '13px', color: 'var(--red)', fontWeight: 500 }}>{error}</div>}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(2)} style={{ background: 'var(--surface)', color: 'var(--text-2)', padding: '10px 18px', borderRadius: 'var(--r-sm)', fontSize: '13px', fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer' }}>
                ← Retour
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={onCancel} style={{ background: 'var(--surface)', color: 'var(--text-2)', padding: '10px 18px', borderRadius: 'var(--r-sm)', fontSize: '13px', fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={handleSubmit} disabled={loading} style={{ background: 'var(--green)', color: '#fff', padding: '10px 22px', borderRadius: 'var(--r-sm)', fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'Publication…' : submitLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live preview */}
      <div style={{ width: '220px', flexShrink: 0 }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '10px' }}>Aperçu</div>
        <ProjectCard project={preview} onClick={() => {}} onSave={() => {}} />
      </div>
    </div>
  )
}
