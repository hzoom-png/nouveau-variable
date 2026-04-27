'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useStreamingAI } from '../_shared/useStreamingAI'

const TONES   = ['Professionnel', 'Amical', 'Direct', 'Inspirant', 'Storytelling']
const SECTORS = ['BtoB SaaS', 'Immobilier', 'Assurance', 'Formation', 'Recrutement', 'Conseil', 'E-commerce', 'Finance']

const STEPS_LOADING = [
  'Analyse du profil prospect...',
  'Génération des arguments personnalisés...',
  'Calibration du score de pertinence...',
  'Rédaction du témoignage...',
  'Finalisation du DealLink...',
]

type DLResult = {
  score: number
  accroche: string
  arguments: { titre: string; corps: string }[]
  temoignage: { citation: string; auteur: string }
  cta: string
  objections: { objection: string; reponse: string }[]
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 13px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: '13px', color: 'var(--text)', background: 'var(--white)', outline: 'none', fontFamily: 'inherit' }
const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--text-2)', letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }

export default function DealLinkPage() {
  const searchParams = useSearchParams()
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1)
  const [form, setForm] = useState({
    prospectName: '', prospectCompany: '', sector: '',
    productName: '', problem: '', arguments: '',
    tone: 'Professionnel', myWebsite: '', clientWebsite: '',
  })
  const [result, setResult] = useState<DLResult | null>(null)
  const [slug,   setSlug]   = useState('')
  const [error,  setError]  = useState('')
  const [copied, setCopied] = useState(false)
  const [showLibraryLink, setShowLibraryLink] = useState(false)

  // Pre-fill from query params (Keyaccount or Terrain)
  useEffect(() => {
    const prospect = searchParams.get('prospect') ?? ''
    const company  = searchParams.get('company') ?? ''
    const sector   = searchParams.get('sector') ?? ''
    if (prospect || company) {
      setForm(f => ({
        ...f,
        prospectName: prospect || f.prospectName,
        prospectCompany: company || f.prospectCompany,
        sector: sector || f.sector,
      }))
    }
  }, [searchParams])

  useEffect(() => {
    if (wizardStep === 3 && result) {
      const t = setTimeout(() => setShowLibraryLink(true), 1500)
      return () => clearTimeout(t)
    }
    setShowLibraryLink(false)
  }, [wizardStep, result])

  const onComplete = useCallback((res: unknown, meta?: Record<string, unknown>) => {
    setResult(res as DLResult)
    if (typeof meta?.slug === 'string') setSlug(meta.slug)
    setWizardStep(3)
  }, [])

  const onError = useCallback((msg: string) => {
    setError(msg)
    setWizardStep(2)
  }, [])

  const { generate: streamGenerate, isStreaming, progress } = useStreamingAI({
    endpoint: '/api/ai/deallink',
    onComplete,
    onError,
  })

  const loadStep = Math.min(Math.floor(progress / 22), STEPS_LOADING.length - 1)

  function generateDealLink() {
    if (!form.prospectName || !form.productName || !form.problem) {
      setError('Remplis au minimum le nom du prospect, le produit et le problème')
      return
    }
    setError('')
    setResult(null)
    streamGenerate({
      prospectName: form.prospectName, prospectCompany: form.prospectCompany,
      sector: form.sector, productName: form.productName, problem: form.problem,
      arguments: form.arguments, tone: form.tone,
      myWebsite: form.myWebsite, clientWebsite: form.clientWebsite,
    })
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/dl/${slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyAll() {
    if (!result) return
    const text = [
      result.accroche, '',
      ...(result.arguments?.map(a => `• ${a.titre} : ${a.corps}`) ?? []),
      '', `"${result.temoignage?.citation}" — ${result.temoignage?.auteur}`,
      '', result.cta,
    ].join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Wizard progress indicator ──
  function WizardBar() {
    const steps = ['Prospect', 'Contexte', 'Résultat']
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '28px', maxWidth: '360px' }}>
        {steps.map((label, i) => {
          const step = i + 1
          const active = wizardStep === step
          const done   = wizardStep > step
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? '1' : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-jost)', fontSize: '12px', fontWeight: 700,
                  background: done ? 'var(--green)' : active ? 'var(--green)' : 'var(--surface-2)',
                  color: (done || active) ? '#fff' : 'var(--text-3)',
                  border: active ? 'none' : done ? 'none' : '1.5px solid var(--border)',
                  transition: '.2s',
                }}>
                  {done ? '✓' : step}
                </div>
                <span style={{ fontSize: '10px', fontWeight: active ? 700 : 500, color: active ? 'var(--text)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: '2px', background: done ? 'var(--green)' : 'var(--surface-2)', margin: '0 6px', marginBottom: '16px', transition: '.3s' }} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '4px 12px', borderRadius: 'var(--r-full)', background: 'var(--green-3)', border: '1px solid var(--green-4)', fontSize: '11px', fontWeight: 700, color: 'var(--green)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
          IA · Génération instantanée
        </div>
        <div style={{ fontFamily: 'var(--font-jost)', fontSize: '28px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em', marginBottom: '8px' }}>DealLink</div>
        <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, maxWidth: '560px' }}>
          Un lien unique, ultra-personnalisé pour ton prospect. Ton produit présenté en 30 secondes, avec les bons arguments, le bon ton, le bon CTA.
        </div>
      </div>

      <WizardBar />

      {/* Step 1 — Prospect */}
      {wizardStep === 1 && (
        <div style={{ maxWidth: '560px' }}>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '22px 24px', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-jost)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>Qui est ton prospect ?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Prénom *</label>
                <input style={inputStyle} value={form.prospectName} onChange={e => setForm(f => ({ ...f, prospectName: e.target.value }))} placeholder="Thomas" autoFocus />
              </div>
              <div>
                <label style={labelStyle}>Entreprise</label>
                <input style={inputStyle} value={form.prospectCompany} onChange={e => setForm(f => ({ ...f, prospectCompany: e.target.value }))} placeholder="Acme Corp" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Secteur d'activité</label>
              <select style={inputStyle} value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}>
                <option value="">— Sélectionner</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={() => {
              if (!form.prospectName.trim()) { setError('Le prénom du prospect est obligatoire'); return }
              setError('')
              setWizardStep(2)
            }}
            className="tbtn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            Continuer →
          </button>
          {error && <div style={{ color: 'var(--red)', fontSize: '13px', background: 'var(--red-2)', padding: '10px 14px', borderRadius: 'var(--r-sm)', marginTop: '12px' }}>{error}</div>}
        </div>
      )}

      {/* Step 2 — Context */}
      {wizardStep === 2 && !isStreaming && (
        <div style={{ maxWidth: '560px' }}>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '22px 24px', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-jost)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>Ton offre</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Produit / Service *</label>
              <input style={inputStyle} value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} placeholder="Ex: Logiciel CRM BtoB" autoFocus />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Problème principal *</label>
              <textarea rows={3} style={{ ...inputStyle, resize: 'none', lineHeight: 1.55 }} value={form.problem} onChange={e => setForm(f => ({ ...f, problem: e.target.value }))} placeholder="Le prospect perd du temps à qualifier ses leads..." />
            </div>
            <div>
              <label style={labelStyle}>Arguments clés (optionnel)</label>
              <textarea rows={2} style={{ ...inputStyle, resize: 'none' }} value={form.arguments} onChange={e => setForm(f => ({ ...f, arguments: e.target.value }))} placeholder="Intégration CRM, IA prédictive, ROI en 3 mois..." />
            </div>
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 24px', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-jost)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Ton de communication</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>Adapte le registre au profil de ton prospect</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TONES.map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, tone: t }))} style={{ padding: '6px 13px', borderRadius: 'var(--r-full)', fontSize: '12px', fontWeight: form.tone === t ? 600 : 500, cursor: 'pointer', border: `1.5px solid ${form.tone === t ? 'var(--green)' : 'var(--border)'}`, color: form.tone === t ? 'var(--green)' : 'var(--text-2)', background: form.tone === t ? 'var(--green-3)' : 'var(--white)', transition: '.14s' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 24px', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-jost)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Sites web</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>Optionnel — enrichit le contexte de l&apos;IA</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={labelStyle}>Ton site</label><input style={inputStyle} value={form.myWebsite} onChange={e => setForm(f => ({ ...f, myWebsite: e.target.value }))} placeholder="https://ton-site.fr" /></div>
              <div><label style={labelStyle}>Site du prospect</label><input style={inputStyle} value={form.clientWebsite} onChange={e => setForm(f => ({ ...f, clientWebsite: e.target.value }))} placeholder="https://prospect.fr" /></div>
            </div>
          </div>

          {error && <div style={{ color: 'var(--red)', fontSize: '13px', background: 'var(--red-2)', padding: '10px 14px', borderRadius: 'var(--r-sm)', marginBottom: '12px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setWizardStep(1)} className="tbtn-secondary" style={{ padding: '12px 20px' }}>← Retour</button>
            <button onClick={generateDealLink} style={{ flex: 1, background: 'var(--green)', color: '#fff', padding: '12px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-jost)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: '.15s' }}>
              ✦ Générer le DealLink
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isStreaming && (
        <div style={{ maxWidth: '440px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '36px 40px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: '44px', height: '44px', background: 'var(--green-3)', borderRadius: 'var(--r-lg)', display: 'grid', placeItems: 'center', margin: '0 auto 18px', animation: 'spin 2s linear infinite' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--green)" strokeWidth="1.6"><path d="M10 2v4M10 14v4M2 10h4M14 10h4M4.1 4.1l2.8 2.8M13.1 13.1l2.8 2.8M4.1 15.9l2.8-2.8M13.1 6.9l2.8-2.8"/></svg>
          </div>
          <div style={{ fontFamily: 'var(--font-jost)', fontSize: '17px', fontWeight: 800, color: 'var(--text)', marginBottom: '6px', textAlign: 'center' }}>Génération en cours...</div>
          <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '20px', textAlign: 'center' }}>DealLink personnalisé pour {form.prospectName}</div>
          <div style={{ height: '4px', background: 'var(--surface-2)', borderRadius: 'var(--r-full)', marginBottom: '14px' }}>
            <div style={{ height: '4px', background: 'var(--green)', borderRadius: 'var(--r-full)', width: progress + '%', transition: 'width 0.6s ease' }} />
          </div>
          {STEPS_LOADING.map((s, i) => (
            <div key={s} style={{ fontSize: '12px', color: i < loadStep ? 'var(--green)' : i === loadStep ? 'var(--text)' : 'var(--text-3)', padding: '3px 0', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: i < loadStep ? 'var(--green)' : i === loadStep ? 'var(--amber)' : 'var(--border)', display: 'inline-block', flexShrink: 0 }} />
              {s}
            </div>
          ))}
        </div>
      )}

      {/* Step 3 — Result */}
      {wizardStep === 3 && result && !isStreaming && (
        <div style={{ maxWidth: '680px' }}>
          {/* Result card */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: '16px' }}>
            {/* Header with score bar */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'var(--font-jost)', fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>DealLink pour {form.prospectName} ✦</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '80px', height: '5px', background: 'var(--surface-2)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
                  <div style={{ height: '5px', background: result.score >= 75 ? 'var(--green)' : result.score >= 50 ? 'var(--amber)' : 'var(--red)', borderRadius: 'var(--r-full)', width: result.score + '%', transition: 'width 1s' }} />
                </div>
                <div style={{ background: 'var(--green-3)', color: 'var(--green)', border: '1px solid var(--green-4)', padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: '11px', fontWeight: 700 }}>
                  {result.score}/100
                </div>
              </div>
            </div>

            {/* Accroche */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '6px' }}>Accroche</div>
              <div style={{ fontFamily: 'var(--font-jost)', fontSize: '16px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>{result.accroche}</div>
            </div>

            {/* Arguments */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '12px' }}>Arguments</div>
              {result.arguments.map((arg, i) => (
                <div key={i} style={{ display: 'flex', gap: '14px', marginBottom: i < result.arguments.length - 1 ? '14px' : 0, alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--green)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-jost)', fontSize: '11px', fontWeight: 800, color: '#fff', flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-jost)', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>{arg.titre}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>{arg.corps}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Témoignage */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '8px' }}>Témoignage</div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '13px 16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6, marginBottom: '8px', fontStyle: 'italic' }}>&ldquo;{result.temoignage.citation}&rdquo;</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' }}>{result.temoignage.auteur}</div>
              </div>
            </div>

            {/* CTA */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--green-3)' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)' }}>CTA : </span>
              <span style={{ fontSize: '13px', color: 'var(--text)' }}>{result.cta}</span>
            </div>

            {/* Link + actions */}
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: 'var(--green-3)' }}>
              <div style={{ fontFamily: 'var(--font-jost)', fontSize: '13px', fontWeight: 600, color: 'var(--green)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: '100px' }}>
                {typeof window !== 'undefined' ? window.location.origin : ''}/dl/{slug}
              </div>
              <button onClick={copyLink} style={{ background: 'var(--green)', color: '#fff', padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: '12px', fontWeight: 700, transition: '.15s', flexShrink: 0 }}>
                {copied ? 'Copié !' : 'Copier le lien'}
              </button>
              <button onClick={copyAll} style={{ background: 'var(--white)', border: '1px solid var(--green-4)', color: 'var(--green)', padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: '12px', fontWeight: 700, transition: '.15s', flexShrink: 0 }}>
                Tout copier
              </button>
            </div>
          </div>

          {/* Library link */}
          {showLibraryLink && (
            <div style={{ padding: '10px 20px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', animation: 'slideIn .3s ease-out' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--green)" strokeWidth="1.5"><path d="M2 1h8v10L6 8.5 2 11V1z"/></svg>
              <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Sauvegardé automatiquement →</span>
              <Link href="/dashboard/library" style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}>Voir dans ma bibliothèque</Link>
            </div>
          )}

          {/* Objections */}
          {result.objections?.length > 0 && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'var(--font-jost)', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Objections anticipées</span>
              </div>
              {result.objections.map((o, i) => (
                <div key={i} style={{ padding: '12px 18px', borderBottom: i < result.objections.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>— {o.objection}</div>
                  <div style={{ fontSize: '13px', color: 'var(--green)' }}>→ {o.reponse}</div>
                </div>
              ))}
            </div>
          )}

          {/* New DealLink */}
          <button
            onClick={() => { setResult(null); setWizardStep(1); setForm(f => ({ ...f, prospectName: '', prospectCompany: '', sector: '' })); setError('') }}
            className="tbtn-secondary"
            style={{ fontSize: '13px' }}
          >
            ← Nouveau DealLink
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
