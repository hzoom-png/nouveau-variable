'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme'

interface Props {
  firstName: string
  onDone: () => void
  forceOpen?: boolean
}

const STEPS = [
  {
    icon: null,
    title: (name: string) => `Bienvenue dans le club, ${name}.`,
    body: 'Nouveau Variable est un club privé pour commerciaux ambitieux. Ici, tu développes ton réseau, tu accèdes à des outils pensés pour le terrain, et tu construis des revenus complémentaires récurrents.',
    logo: true,
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: () => 'Ton réseau, filtré et qualifié.',
    body: 'Retrouve tous les membres du club par ville et secteur. Envoie des invitations à des RDV en quelques secondes.',
    logo: false,
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-4 0v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/>
        <line x1="8"  y1="14" x2="16" y2="14"/>
      </svg>
    ),
    title: () => 'Des opportunités à saisir.',
    body: 'Les membres partagent leurs projets et recherchent des collaborateurs. Propose tes services, rejoins une initiative, crée de la valeur ensemble.',
    logo: false,
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: () => 'Keyaccount, Réplique, DealLink.',
    body: 'Trois outils construits pour les commerciaux. Pilote tes comptes stratégiques, génère tes scripts d\'appel sur mesure, crée des pages de vente brandées en 2 minutes.',
    logo: false,
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    title: () => 'Construis tes revenus récurrents.',
    body: 'Chaque membre que tu recommandes te rapporte une commission mensuelle tant qu\'il reste actif. À deux niveaux. Sans plafond.',
    logo: false,
    cta: true,
  },
]

export function WelcomeTour({ firstName, onDone, forceOpen = false }: Props) {
  const [step, setStep] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const { theme } = useTheme()

  const s = STEPS[step]
  const isLast = step === STEPS.length - 1

  async function close() {
    setLeaving(true)
    if (!forceOpen) {
      try {
        await fetch('/api/profile/complete-onboarding', { method: 'POST' })
      } catch { /* silent */ }
    }
    onDone()
  }

  function next() {
    if (isLast) { close(); return }
    setStep(v => v + 1)
  }

  function prev() {
    if (step > 0) setStep(v => v - 1)
  }

  if (leaving) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.62)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      animation: 'wtFadeIn .22s ease',
    }}>
      <style>{`
        @keyframes wtFadeIn  { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
        @keyframes wtSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .wt-step-content { animation: wtSlideIn .18s ease; }
      `}</style>

      <div style={{
        background: 'var(--white)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '520px',
        padding: '36px 36px 28px',
        boxShadow: '0 24px 72px rgba(0,0,0,0.22)',
        position: 'relative',
      }}>
        {/* Skip */}
        <button
          onClick={close}
          style={{ position: 'absolute', top: '16px', right: '20px', background: 'none', border: 'none', fontSize: '12px', color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px' }}
        >
          Passer
        </button>

        {/* Content */}
        <div key={step} className="wt-step-content" style={{ textAlign: 'center', marginBottom: '32px' }}>
          {s.logo ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <img
                src={theme === 'dark' ? '/nv-logo-white.png' : '/nv-logo-black.png'}
                alt="Nouveau Variable"
                style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
              />
            </div>
          ) : s.icon ? (
            <div style={{
              width: '72px', height: '72px', borderRadius: '16px',
              background: 'var(--green-3)', border: '1.5px solid var(--green-4)',
              display: 'grid', placeItems: 'center', margin: '0 auto 20px',
              color: 'var(--green)',
            }}>
              {s.icon}
            </div>
          ) : null}

          <h2 style={{
            fontFamily: 'Jost, sans-serif', fontWeight: 900,
            fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
            color: 'var(--text)', lineHeight: 1.2, marginBottom: '14px',
          }}>
            {s.title(firstName)}
          </h2>

          <p style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.7, maxWidth: '400px', margin: '0 auto' }}>
            {s.body}
          </p>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '24px' }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? '20px' : '7px',
                height: '7px',
                borderRadius: '99px',
                background: i === step ? 'var(--green)' : 'var(--border)',
                transition: 'all .2s',
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {step > 0 && (
            <button
              onClick={prev}
              style={{ padding: '11px 18px', borderRadius: '99px', background: 'var(--surface)', color: 'var(--text-2)', fontWeight: 600, fontSize: '13px', border: '1.5px solid var(--border)', cursor: 'pointer', flexShrink: 0 }}
            >
              ←
            </button>
          )}
          <button
            onClick={next}
            style={{
              flex: 1, padding: '12px', borderRadius: '99px',
              background: 'var(--green)', color: '#fff',
              fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '14px',
              border: 'none', cursor: 'pointer', transition: '.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--green-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--green)'}
          >
            {isLast ? "C'est parti →" : 'Suivant →'}
          </button>
        </div>
      </div>
    </div>
  )
}
