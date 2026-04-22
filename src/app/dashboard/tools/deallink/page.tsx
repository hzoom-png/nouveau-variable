'use client'

import { useState } from 'react'

const TONES = ['Professionnel', 'Amical', 'Direct', 'Inspirant']
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

export default function DealLinkPage() {
  const [form, setForm] = useState({ prospectName: '', prospectCompany: '', sector: '', productName: '', problem: '', arguments: '', tone: 'Professionnel' })
  const [loading, setLoading] = useState(false)
  const [loadStep, setLoadStep] = useState(0)
  const [result, setResult] = useState<DLResult | null>(null)
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function generate() {
    if (!form.prospectName || !form.productName || !form.problem) { setError('Remplis au minimum le nom du prospect, le produit et le problème'); return }
    setError('')
    setLoading(true)
    setResult(null)

    // Animate loading steps
    let step = 0
    const interval = setInterval(() => {
      step++
      setLoadStep(Math.min(step, STEPS_LOADING.length - 1))
    }, 900)

    const res = await fetch('/api/ai/deallink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    clearInterval(interval)
    setLoading(false)

    if (!res.ok) { const d = await res.json(); setError(d.error || 'Erreur'); return }
    const data = await res.json()
    setResult(data.result)
    setSlug(data.slug)
  }

  function copyLink() {
    const link = `${window.location.origin}/dl/${slug}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 13px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: '13px', color: 'var(--text)', background: 'var(--white)', outline: 'none', fontFamily: 'inherit' }
  const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--text-2)', letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '4px 12px', borderRadius: 'var(--r-full)', background: 'var(--green-3)', border: '1px solid var(--green-4)', fontSize: '11px', fontWeight: 700, color: 'var(--green)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
          IA · Génération instantanée
        </div>
        <div style={{ fontFamily: 'var(--font-jost)', fontSize: '28px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em', marginBottom: '8px' }}>DealLink</div>
        <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, maxWidth: '560px' }}>
          Un lien unique, ultra-personnalisé pour ton prospect. Ton produit présenté en 30 secondes, avec les bons arguments, le bon ton, le bon CTA.
        </div>
      </div>

      <div id="dl-layout" style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '20px', maxWidth: result ? '1100px' : '620px' }}>
        {/* Form */}
        <div>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '22px 24px', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-jost)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>Le prospect</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div><label style={labelStyle}>Prénom prospect</label><input style={inputStyle} value={form.prospectName} onChange={e => setForm(f => ({ ...f, prospectName: e.target.value }))} placeholder="Thomas" /></div>
              <div><label style={labelStyle}>Entreprise</label><input style={inputStyle} value={form.prospectCompany} onChange={e => setForm(f => ({ ...f, prospectCompany: e.target.value }))} placeholder="Acme Corp" /></div>
            </div>
            <div><label style={labelStyle}>Secteur</label>
              <select style={inputStyle} value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}>
                <option value="">— Sélectionner</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '22px 24px', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-jost)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>Ton offre</h3>
            <div style={{ marginBottom: '12px' }}><label style={labelStyle}>Produit / Service</label><input style={inputStyle} value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} placeholder="Ex: Logiciel CRM BtoB" /></div>
            <div style={{ marginBottom: '12px' }}><label style={labelStyle}>Problème adressé</label><textarea rows={3} style={{ ...inputStyle, resize: 'none', lineHeight: 1.55 }} value={form.problem} onChange={e => setForm(f => ({ ...f, problem: e.target.value }))} placeholder="Le prospect perd du temps à qualifier ses leads..." /></div>
            <div><label style={labelStyle}>Arguments clés (optionnel)</label><textarea rows={2} style={{ ...inputStyle, resize: 'none' }} value={form.arguments} onChange={e => setForm(f => ({ ...f, arguments: e.target.value }))} placeholder="Intégration CRM, IA prédictive, ROI en 3 mois..." /></div>
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 24px', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-jost)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>Ton de communication</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TONES.map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, tone: t }))} style={{ padding: '6px 13px', borderRadius: 'var(--r-full)', fontSize: '12px', fontWeight: form.tone === t ? 600 : 500, cursor: 'pointer', border: `1.5px solid ${form.tone === t ? 'var(--green)' : 'var(--border)'}`, color: form.tone === t ? 'var(--green)' : 'var(--text-2)', background: form.tone === t ? 'var(--green-3)' : 'var(--white)', transition: '.14s' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ color: 'var(--red)', fontSize: '13px', background: 'var(--red-2)', padding: '10px 14px', borderRadius: 'var(--r-sm)', marginBottom: '12px' }}>{error}</div>}

          <button onClick={generate} disabled={loading} style={{ width: '100%', background: loading ? 'var(--green-4)' : 'var(--green)', color: '#fff', padding: '12px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-jost)', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: loading ? 'not-allowed' : 'pointer', transition: '.15s' }}>
            {loading ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                Génération en cours...
              </>
            ) : '✦ Générer le DealLink'}
          </button>

          {loading && (
            <div style={{ marginTop: '16px' }}>
              {STEPS_LOADING.map((s, i) => (
                <div key={s} style={{ fontSize: '12px', color: i < loadStep ? 'var(--green)' : i === loadStep ? 'var(--text)' : 'var(--text-3)', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: i < loadStep ? 'var(--green)' : i === loadStep ? 'var(--amber)' : 'var(--border)', display: 'inline-block', flexShrink: 0 }} />
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div>
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'var(--font-jost)', fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>DealLink généré ✦</div>
                <div style={{ background: 'var(--green-3)', color: 'var(--green)', border: '1px solid var(--green-4)', padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: '11px', fontWeight: 700 }}>
                  Score {result.score}/100
                </div>
              </div>

              {/* Accroche */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '6px' }}>Accroche</div>
                <div style={{ fontFamily: 'var(--font-jost)', fontSize: '16px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>{result.accroche}</div>
              </div>

              {/* Arguments */}
              <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
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

              {/* Link */}
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--green-3)' }}>
                <div style={{ fontFamily: 'var(--font-jost)', fontSize: '13px', fontWeight: 600, color: 'var(--green)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {typeof window !== 'undefined' ? window.location.origin : ''}/dl/{slug}
                </div>
                <button onClick={copyLink} style={{ background: 'var(--green)', color: '#fff', padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: '12px', fontWeight: 700, transition: '.15s', flexShrink: 0 }}>
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>

            {/* Objections */}
            {result.objections?.length > 0 && (
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font-jost)', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Objections anticipées</span>
                </div>
                {result.objections.map((o, i) => (
                  <div key={i} style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>— {o.objection}</div>
                    <div style={{ fontSize: '13px', color: 'var(--green)' }}>→ {o.reponse}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
