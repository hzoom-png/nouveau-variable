'use client'

import { useState } from 'react'
import { useDashboard } from '@/lib/dashboard-context'
import { LockedSection } from '@/components/LockedSection'
import SectorCloud from '@/components/SectorCloud'

const TONES = ['Professionnel', 'Amical', 'Direct', 'Inspirant', 'Storytelling']

const inp: React.CSSProperties = {
  width: '100%',
  padding: '9px 13px',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--r-sm)',
  fontSize: '13px',
  color: 'var(--text)',
  background: 'var(--white)',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const lbl: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-2)',
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: '5px',
}

type Step = 1 | 2 | 'loading' | 'done'

export default function DealLinkNewPage() {
  const { isInactive, userEmail } = useDashboard()

  const [step, setStep] = useState<Step>(1)
  const [deallink, setDeallink] = useState<any>(null)
  const [error, setError] = useState('')
  const [showSeller, setShowSeller] = useState(false)

  const [form, setForm] = useState({
    prospectName: '',
    prospectCompany: '',
    prospectRole: '',
    sectors: [] as string[],
    dealType: 'closing',
    dealContext: '',
    dealValue: '',
    tone: 'Professionnel',
    myWebsite: '',
    clientWebsite: '',
    sellerName: '',
    sellerEmail: '',
    sellerPhone: '',
  })

  if (isInactive) return <LockedSection feature="DealLink est réservé aux membres actifs" email={userEmail} />

  async function generate() {
    if (!form.prospectName || !form.dealContext) {
      setError('Remplis au minimum le prénom du prospect et le contexte du deal')
      return
    }
    setError('')
    setStep('loading')

    try {
      const res = await fetch('/api/deallink/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospect_name: form.prospectName,
          company_name: form.prospectCompany,
          deal_type: form.dealType,
          deal_context: form.dealContext,
          deal_value: form.dealValue ? parseFloat(form.dealValue) : null,
          user_name: form.sellerName,
          user_title: form.sellerEmail ? `${form.sellerEmail}` : '',
          tone: form.tone,
          myWebsite: form.myWebsite,
          clientWebsite: form.clientWebsite,
        }),
      })

      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        setError(err.error || 'Erreur de génération')
        setStep(2)
        return
      }

      const data = (await res.json()) as { deallink_id: string; edit_url: string }
      setDeallink(data)
      setStep('done')
    } catch {
      setError('Erreur réseau — réessaie.')
      setStep(2)
    }
  }

  function reset() {
    setStep(1)
    setDeallink(null)
    setError('')
    setForm((f) => ({
      ...f,
      prospectName: '',
      prospectCompany: '',
      prospectRole: '',
      sectors: [],
      dealContext: '',
      dealValue: '',
    }))
  }

  function WizardBar() {
    const steps = ['Prospect', 'Deal', 'Résultat']
    const activeIdx = step === 1 ? 0 : step === 2 || step === 'loading' ? 1 : 2
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px', maxWidth: '360px' }}>
        {steps.map((label, i) => {
          const done = activeIdx > i
          const active = activeIdx === i
          return (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                flex: i < steps.length - 1 ? '1' : 'none',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: done || active ? 'var(--green)' : 'var(--surface-2)',
                    color: done || active ? '#fff' : 'var(--text-3)',
                    border: done || active ? 'none' : '1.5px solid var(--border)',
                    transition: '.2s',
                  }}
                >
                  {done ? '✓' : i + 1}
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: active ? 700 : 500,
                    color: active ? 'var(--text)' : 'var(--text-3)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    background: done ? 'var(--green)' : 'var(--surface-2)',
                    margin: '0 6px',
                    marginBottom: '16px',
                    transition: '.3s',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            background: 'var(--green-3)',
            border: '1px solid var(--green-4)',
            color: 'var(--green)',
            display: 'inline-block',
            padding: '6px 12px',
            borderRadius: 'var(--r-sm)',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          Génération v2 premium
        </div>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: '8px',
          }}
        >
          Crée un DealLink
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-2)', maxWidth: '560px' }}>
          Génère une landing page ultra-personnalisée avec éditeur visuel, couleurs dynamiques et preview en direct.
        </p>
      </div>

      <WizardBar />

      {/* STEP 1: Prospect Info */}
      {step === 1 && (
        <div style={{ maxWidth: '560px' }}>
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              padding: '22px 24px',
              marginBottom: '16px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: '16px',
              }}
            >
              Qui est ton prospect ?
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={lbl}>Prénom *</label>
                <input
                  style={inp}
                  value={form.prospectName}
                  onChange={(e) => setForm((f) => ({ ...f, prospectName: e.target.value }))}
                  placeholder="Thomas"
                  autoFocus
                />
              </div>
              <div>
                <label style={lbl}>Entreprise</label>
                <input
                  style={inp}
                  value={form.prospectCompany}
                  onChange={(e) => setForm((f) => ({ ...f, prospectCompany: e.target.value }))}
                  placeholder="Acme Corp"
                />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>Titre / Rôle (optionnel)</label>
              <input
                style={inp}
                value={form.prospectRole}
                onChange={(e) => setForm((f) => ({ ...f, prospectRole: e.target.value }))}
                placeholder="Directeur Commercial, DRH…"
              />
            </div>
            <div>
              <label style={{ ...lbl, marginBottom: '10px' }}>Secteur d&apos;activité (max 3)</label>
              <SectorCloud
                value={form.sectors}
                onChange={(sectors) => setForm((f) => ({ ...f, sectors }))}
                max={3}
              />
            </div>
          </div>

          <button
            onClick={() => {
              if (!form.prospectName.trim()) {
                setError('Le prénom du prospect est obligatoire')
                return
              }
              setError('')
              setStep(2)
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--green)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--r-sm)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Continuer →
          </button>
          {error && (
            <div
              style={{
                color: 'var(--red)',
                fontSize: '13px',
                background: 'var(--red-2)',
                padding: '10px 14px',
                borderRadius: 'var(--r-sm)',
                marginTop: '12px',
              }}
            >
              {error}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Deal Details */}
      {step === 2 && (
        <div style={{ maxWidth: '560px' }}>
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              padding: '22px 24px',
              marginBottom: '16px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: '16px',
              }}
            >
              Détails du deal
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Type de deal</label>
              <select
                value={form.dealType}
                onChange={(e) => setForm((f) => ({ ...f, dealType: e.target.value }))}
                style={{ ...inp, cursor: 'pointer' }}
              >
                <option value="closing">Closing</option>
                <option value="apport">Apport</option>
                <option value="partnership">Partnership</option>
                <option value="mission">Mission</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Contexte du deal *</label>
              <textarea
                rows={3}
                style={{ ...inp, resize: 'none', lineHeight: 1.55 }}
                value={form.dealContext}
                onChange={(e) => setForm((f) => ({ ...f, dealContext: e.target.value }))}
                placeholder="Pourquoi cette opportunité ? Quel problème résout-tu ?"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Montant (optionnel, €)</label>
              <input
                style={inp}
                type="number"
                value={form.dealValue}
                onChange={(e) => setForm((f) => ({ ...f, dealValue: e.target.value }))}
                placeholder="50000"
              />
            </div>
          </div>

          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              padding: '18px 24px',
              marginBottom: '16px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: '4px',
              }}
            >
              Ton de communication
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>
              Adapte le registre au profil du prospect
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, tone: t }))}
                  style={{
                    padding: '6px 13px',
                    borderRadius: 'var(--r-full)',
                    fontSize: '12px',
                    fontWeight: form.tone === t ? 600 : 500,
                    cursor: 'pointer',
                    border: `1.5px solid ${form.tone === t ? 'var(--green)' : 'var(--border)'}`,
                    color: form.tone === t ? 'var(--green)' : 'var(--text-2)',
                    background: form.tone === t ? 'var(--green-3)' : 'var(--white)',
                    transition: '.14s',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              padding: '18px 24px',
              marginBottom: '16px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: '4px',
              }}
            >
              Sites web (optionnel)
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>
              Enrichit la personnalisation de la page générée
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>Ton site</label>
                <input
                  style={inp}
                  value={form.myWebsite}
                  onChange={(e) => setForm((f) => ({ ...f, myWebsite: e.target.value }))}
                  placeholder="https://ton-site.fr"
                />
              </div>
              <div>
                <label style={lbl}>Site du prospect</label>
                <input
                  style={inp}
                  value={form.clientWebsite}
                  onChange={(e) => setForm((f) => ({ ...f, clientWebsite: e.target.value }))}
                  placeholder="https://prospect.fr"
                />
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              overflow: 'hidden',
              marginBottom: '16px',
            }}
          >
            <button
              onClick={() => setShowSeller((v) => !v)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-2)',
              }}
            >
              <span>Tes coordonnées de contact (optionnel)</span>
              <span style={{ fontSize: '11px' }}>{showSeller ? '▴' : '▾'}</span>
            </button>
            {showSeller && (
              <div style={{ padding: '0 18px 18px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>
                  Apparaîtront dans le CTA de la page
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={lbl}>Ton prénom / nom</label>
                    <input
                      style={inp}
                      value={form.sellerName}
                      onChange={(e) => setForm((f) => ({ ...f, sellerName: e.target.value }))}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label style={lbl}>Téléphone</label>
                    <input
                      style={inp}
                      value={form.sellerPhone}
                      onChange={(e) => setForm((f) => ({ ...f, sellerPhone: e.target.value }))}
                      placeholder="+33 6 00 00 00 00"
                    />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Email de contact</label>
                  <input
                    style={inp}
                    value={form.sellerEmail}
                    onChange={(e) => setForm((f) => ({ ...f, sellerEmail: e.target.value }))}
                    placeholder="ton.email@entreprise.fr"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                color: 'var(--red)',
                fontSize: '13px',
                background: 'var(--red-2)',
                padding: '10px 14px',
                borderRadius: 'var(--r-sm)',
                marginBottom: '12px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '12px 20px',
                background: 'var(--white)',
                color: 'var(--text)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--r-sm)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ← Retour
            </button>
            <button
              onClick={generate}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'var(--green)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--r-sm)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✦ Générer le DealLink
            </button>
          </div>
        </div>
      )}

      {/* LOADING */}
      {step === 'loading' && (
        <div
          style={{
            maxWidth: '400px',
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)',
            padding: '48px 40px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              background: 'var(--green-3)',
              borderRadius: 'var(--r-lg)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 20px',
              animation: 'spin 1.6s linear infinite',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--green)" strokeWidth="1.8">
              <path d="M11 2v4M11 16v4M2 11h4M16 11h4M4.5 4.5l2.8 2.8M14.7 14.7l2.8 2.8M4.5 17.5l2.8-2.8M14.7 7.3l2.8-2.8" />
            </svg>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '17px',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '8px',
            }}
          >
            Génération en cours…
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>Page personnalisée pour {form.prospectName}</p>
        </div>
      )}

      {/* DONE */}
      {step === 'done' && deallink && (
        <div
          style={{
            maxWidth: '560px',
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)',
            padding: '32px 28px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              background: 'var(--green-3)',
              borderRadius: 'var(--r-lg)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 20px',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--green)" strokeWidth="2">
              <path d="M24 7L10.5 20.5L4 14" />
            </svg>
          </div>

          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: '8px',
            }}
          >
            Landing page générée ! 🎉
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '24px' }}>
            Accès à l&apos;éditeur visuel avec couleurs dynamiques, preview responsive et publication.
          </p>

          <a
            href={deallink.edit_url}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'var(--green)',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: 'var(--r-sm)',
              fontWeight: 600,
              marginRight: '12px',
              marginBottom: '12px',
            }}
          >
            → Éditer la page
          </a>

          <button
            onClick={reset}
            style={{
              padding: '12px 24px',
              background: 'var(--white)',
              color: 'var(--text)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Nouveau DealLink
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
