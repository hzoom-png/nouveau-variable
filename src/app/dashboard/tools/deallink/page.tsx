'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import SectorCloud from '@/components/SectorCloud'
import { DealLinkReady } from '@/components/DealLinkReady'

const TONES = ['Professionnel', 'Amical', 'Direct', 'Inspirant', 'Storytelling']

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 13px', border: '1.5px solid var(--border)',
  borderRadius: 'var(--r-sm)', fontSize: '13px', color: 'var(--text)',
  background: 'var(--white)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: 'var(--text-2)',
  letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: '5px',
}

type Step = 1 | 2 | 'loading' | 'done'

export default function DealLinkPage() {
  const searchParams = useSearchParams()

  const [step, setStep]     = useState<Step>(1)
  const [slug, setSlug]     = useState<string | null>(null)
  const [error, setError]   = useState('')
  const [showSeller, setShowSeller] = useState(false)

  const [form, setForm] = useState({
    prospectName: '', prospectCompany: '', prospectRole: '', sectors: [] as string[],
    productName: '', problem: '', arguments: '',
    tone: 'Professionnel', myWebsite: '', clientWebsite: '',
    sellerName: '', sellerEmail: '', sellerPhone: '',
    calendlyUrl: '', calendlyCtaLabel: '', quoteUrl: '', quoteCtaLabel: '',
  })

  useEffect(() => {
    const prospect = searchParams.get('prospect') ?? ''
    const company  = searchParams.get('company')  ?? ''
    const sector   = searchParams.get('sector')   ?? ''
    if (prospect || company) {
      setForm(f => ({
        ...f,
        prospectName:    prospect || f.prospectName,
        prospectCompany: company  || f.prospectCompany,
        sectors: sector ? [sector] : f.sectors,
      }))
    }
  }, [searchParams])

  async function generate() {
    if (!form.prospectName || !form.productName || !form.problem) {
      setError('Remplis au minimum le prénom du prospect, le produit et le problème')
      return
    }
    setError('')
    setStep('loading')

    try {
      const res = await fetch('/api/ai/deallink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectName:    form.prospectName,
          prospectCompany: form.prospectCompany,
          prospectRole:    form.prospectRole,
          sector:          form.sectors.join(' · '),
          productName:     form.productName,
          problem:         form.problem,
          arguments:       form.arguments,
          tone:            form.tone,
          myWebsite:       form.myWebsite,
          clientWebsite:   form.clientWebsite,
          sellerName:      form.sellerName,
          sellerEmail:     form.sellerEmail,
          sellerPhone:     form.sellerPhone,
          brandAssets: {
            calendlyUrl:      form.calendlyUrl      || undefined,
            calendlyCtaLabel: form.calendlyCtaLabel || undefined,
            quoteUrl:         form.quoteUrl         || undefined,
            quoteCtaLabel:    form.quoteCtaLabel     || undefined,
          },
        }),
      })

      if (!res.ok) {
        const err = await res.json() as { error?: string }
        setError(err.error || 'Erreur de génération')
        setStep(2)
        return
      }

      const data = await res.json() as { slug: string }
      setSlug(data.slug)
      setStep('done')
    } catch {
      setError('Erreur réseau — réessaie.')
      setStep(2)
    }
  }

  function reset() {
    setStep(1)
    setSlug(null)
    setError('')
    setForm(f => ({ ...f, prospectName: '', prospectCompany: '', prospectRole: '', sectors: [] }))
  }

  function WizardBar() {
    const steps = ['Prospect', 'Contexte', 'Résultat']
    const activeIdx = step === 1 ? 0 : step === 2 || step === 'loading' ? 1 : 2
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px', maxWidth: '360px' }}>
        {steps.map((label, i) => {
          const done   = activeIdx > i
          const active = activeIdx === i
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? '1' : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-jost)', fontSize: '12px', fontWeight: 700,
                  background: (done || active) ? 'var(--green)' : 'var(--surface-2)',
                  color: (done || active) ? '#fff' : 'var(--text-3)',
                  border: (done || active) ? 'none' : '1.5px solid var(--border)',
                  transition: '.2s',
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '10px', fontWeight: active ? 700 : 500, color: active ? 'var(--text)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
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
      <div className="tool-header">
        <div className="tool-badge" style={{ background: 'var(--green-3)', border: '1px solid var(--green-4)', color: 'var(--green)' }}>
          Génération instantanée
        </div>
        <h1 className="tool-h1">DealLink</h1>
        <p className="tool-desc">Un lien unique, ultra-personnalisé pour ton prospect. Ton produit présenté en 30 secondes, avec les bons arguments, le bon ton, le bon CTA.</p>
        <div className="tool-actions">
          {step === 'done' && (
            <button className="tbtn-secondary" onClick={reset}>Nouveau DealLink</button>
          )}
        </div>
      </div>

      <WizardBar />

      {/* ÉTAPE 1 */}
      {step === 1 && (
        <div style={{ maxWidth: '560px' }}>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '22px 24px', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-jost)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>Qui est ton prospect ?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={lbl}>Prénom *</label>
                <input style={inp} value={form.prospectName} onChange={e => setForm(f => ({ ...f, prospectName: e.target.value }))} placeholder="Thomas" autoFocus />
              </div>
              <div>
                <label style={lbl}>Entreprise</label>
                <input style={inp} value={form.prospectCompany} onChange={e => setForm(f => ({ ...f, prospectCompany: e.target.value }))} placeholder="Acme Corp" />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>Titre / Rôle (optionnel)</label>
              <input style={inp} value={form.prospectRole} onChange={e => setForm(f => ({ ...f, prospectRole: e.target.value }))} placeholder="Directeur Commercial, DRH…" />
            </div>
            <div>
              <label style={{ ...lbl, marginBottom: '10px' }}>Secteur d&apos;activité (max 3)</label>
              <SectorCloud value={form.sectors} onChange={sectors => setForm(f => ({ ...f, sectors }))} max={3} />
            </div>
          </div>

          <button
            onClick={() => {
              if (!form.prospectName.trim()) { setError("Le prénom du prospect est obligatoire"); return }
              setError('')
              setStep(2)
            }}
            className="tbtn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            Continuer →
          </button>
          {error && <div style={{ color: 'var(--red)', fontSize: '13px', background: 'var(--red-2)', padding: '10px 14px', borderRadius: 'var(--r-sm)', marginTop: '12px' }}>{error}</div>}
        </div>
      )}

      {/* ÉTAPE 2 */}
      {step === 2 && (
        <div style={{ maxWidth: '560px' }}>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '22px 24px', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-jost)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>Ton offre</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Produit / Service *</label>
              <input style={inp} value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} placeholder="Ex: Logiciel CRM BtoB" autoFocus />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Problème principal *</label>
              <textarea rows={3} style={{ ...inp, resize: 'none', lineHeight: 1.55 }} value={form.problem} onChange={e => setForm(f => ({ ...f, problem: e.target.value }))} placeholder="Le prospect perd du temps à qualifier ses leads..." />
            </div>
            <div>
              <label style={lbl}>Arguments clés (optionnel)</label>
              <textarea rows={2} style={{ ...inp, resize: 'none' }} value={form.arguments} onChange={e => setForm(f => ({ ...f, arguments: e.target.value }))} placeholder="Intégration CRM, ROI en 3 mois..." />
            </div>
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 24px', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-jost)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Ton de communication</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>Adapte le registre au profil de ton prospect</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TONES.map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, tone: t }))} style={{
                  padding: '6px 13px', borderRadius: 'var(--r-full)', fontSize: '12px',
                  fontWeight: form.tone === t ? 600 : 500, cursor: 'pointer',
                  border: `1.5px solid ${form.tone === t ? 'var(--green)' : 'var(--border)'}`,
                  color: form.tone === t ? 'var(--green)' : 'var(--text-2)',
                  background: form.tone === t ? 'var(--green-3)' : 'var(--white)', transition: '.14s',
                }}>{t}</button>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 24px', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-jost)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Sites web</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>Optionnel — enrichit le contexte de la génération</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={lbl}>Ton site</label><input style={inp} value={form.myWebsite} onChange={e => setForm(f => ({ ...f, myWebsite: e.target.value }))} placeholder="https://ton-site.fr" /></div>
              <div><label style={lbl}>Site du prospect</label><input style={inp} value={form.clientWebsite} onChange={e => setForm(f => ({ ...f, clientWebsite: e.target.value }))} placeholder="https://prospect.fr" /></div>
            </div>
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: '16px' }}>
            <button onClick={() => setShowSeller(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}>
              <span>Tes coordonnées de contact (optionnel)</span>
              <span style={{ fontSize: '11px' }}>{showSeller ? '▴' : '▾'}</span>
            </button>
            {showSeller && (
              <div style={{ padding: '0 18px 18px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>Apparaîtront sur la page publique sous le CTA</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div><label style={lbl}>Ton prénom / nom</label><input style={inp} value={form.sellerName} onChange={e => setForm(f => ({ ...f, sellerName: e.target.value }))} placeholder="Jean Dupont" /></div>
                  <div><label style={lbl}>Téléphone</label><input style={inp} value={form.sellerPhone} onChange={e => setForm(f => ({ ...f, sellerPhone: e.target.value }))} placeholder="+33 6 00 00 00 00" /></div>
                </div>
                <div><label style={lbl}>Email de contact</label><input style={inp} value={form.sellerEmail} onChange={e => setForm(f => ({ ...f, sellerEmail: e.target.value }))} placeholder="ton.email@entreprise.fr" /></div>
                <div style={{ marginTop: '10px' }}>
                  <label style={lbl}>Lien Calendly</label>
                  <input style={inp} type="url" value={form.calendlyUrl} onChange={e => setForm(f => ({ ...f, calendlyUrl: e.target.value }))} placeholder="https://calendly.com/..." />
                </div>
                {form.calendlyUrl && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={lbl}>Libellé bouton Calendly (optionnel)</label>
                    <input style={inp} value={form.calendlyCtaLabel} onChange={e => setForm(f => ({ ...f, calendlyCtaLabel: e.target.value }))} placeholder="Réserver un créneau" />
                  </div>
                )}
                <div style={{ marginTop: '10px' }}>
                  <label style={lbl}>Lien devis</label>
                  <input style={inp} type="url" value={form.quoteUrl} onChange={e => setForm(f => ({ ...f, quoteUrl: e.target.value }))} placeholder="https://..." />
                </div>
                {form.quoteUrl && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={lbl}>Libellé bouton devis (optionnel)</label>
                    <input style={inp} value={form.quoteCtaLabel} onChange={e => setForm(f => ({ ...f, quoteCtaLabel: e.target.value }))} placeholder="Obtenir un devis" />
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <div style={{ color: 'var(--red)', fontSize: '13px', background: 'var(--red-2)', padding: '10px 14px', borderRadius: 'var(--r-sm)', marginBottom: '12px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setStep(1)} className="tbtn-secondary" style={{ padding: '12px 20px' }}>← Retour</button>
            <button onClick={generate} style={{ flex: 1, background: 'var(--green)', color: '#fff', padding: '12px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-jost)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', border: 'none' }}>
              ✦ Générer le DealLink
            </button>
          </div>
        </div>
      )}

      {/* LOADING */}
      {step === 'loading' && (
        <div style={{ maxWidth: '400px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '48px 40px', textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', background: 'var(--green-3)', borderRadius: 'var(--r-lg)', display: 'grid', placeItems: 'center', margin: '0 auto 20px', animation: 'spin 1.6s linear infinite' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--green)" strokeWidth="1.8"><path d="M11 2v4M11 16v4M2 11h4M16 11h4M4.5 4.5l2.8 2.8M14.7 14.7l2.8 2.8M4.5 17.5l2.8-2.8M14.7 7.3l2.8-2.8"/></svg>
          </div>
          <p style={{ fontFamily: 'var(--font-jost)', fontSize: '17px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>Génération en cours…</p>
          <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>Page personnalisée pour {form.prospectName}</p>
        </div>
      )}

      {/* DONE */}
      {step === 'done' && slug && (
        <DealLinkReady
          slug={slug}
          prospectName={form.prospectName}
          prospectCompany={form.prospectCompany || undefined}
          onReset={reset}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
