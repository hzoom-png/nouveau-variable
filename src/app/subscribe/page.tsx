'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const G  = '#024f41'
const G2 = '#1a7b5e'
const G3 = '#e8f5ef'
const G4 = '#56b791'
const BG = '#f4f9f9'
const BD = '#E4EEEA'
const T  = '#012722'
const T2 = '#4B6358'
const T3 = '#9BB5AA'
const W  = '#ffffff'

const FEATURES = [
  'Outils (Réplique, KeyAccount, DealLink, Side Hustle)',
  'Annuaire des membres',
  'Projets & Opportunités',
  'Meetings entre membres',
  'Affiliation & commissions',
]

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="8" cy="8" r="7.5" stroke={G4} />
      <path d="M5 8l2.5 2.5L11 5.5" stroke={G} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SubscribeContent() {
  const params  = useSearchParams()
  const email   = params.get('email') ?? ''
  const prenom  = params.get('prenom') ?? ''
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null)
  const [error, setError]     = useState('')

  async function handleSelect(plan: 'monthly' | 'annual') {
    if (loading) return
    setLoading(plan)
    setError('')
    try {
      let resolvedEmail = email
      if (!resolvedEmail.includes('@')) {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        resolvedEmail = session?.user?.email ?? ''
      }
      const res = await fetch('/api/stripe/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan, email: resolvedEmail, prenom }),
      })
      const data: { url?: string; error?: string } = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Erreur lors de la création de la session.')
        setLoading(null)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Une erreur est survenue. Réessaie.')
      setLoading(null)
    }
  }

  const isDisabled = loading !== null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${BG}; color: ${T}; font-family: Inter, sans-serif; }
        @media (max-width: 640px) {
          .plan-grid { flex-direction: column !important; }
        }
        .plan-card { transition: box-shadow .2s, transform .2s; }
        .plan-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(2,79,65,.1); }
        .cta-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .cta-btn:disabled { cursor: not-allowed; opacity: .65; }
      `}</style>

      <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px' }}>

        {/* Logo */}
        <img src="/logo-nv.png" alt="Nouveau Variable" style={{ height: 36, marginBottom: 40 }}
          onError={e => (e.currentTarget.style.display = 'none')} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48, maxWidth: 560 }}>
          {prenom && (
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: G, fontWeight: 600, marginBottom: 10 }}>
              Bienvenue, {prenom} 👋
            </p>
          )}
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 4vw, 36px)', color: T, lineHeight: 1.15, marginBottom: 14 }}>
            Choisis ton accès au club
          </h1>
          <p style={{ fontSize: 15, color: T2, lineHeight: 1.7 }}>
            Un seul abonnement. Tous les outils, l&apos;annuaire et les opportunités du club.
          </p>
        </div>

        {/* Cards */}
        <div className="plan-grid" style={{ display: 'flex', gap: 20, width: '100%', maxWidth: 860, alignItems: 'stretch' }}>

          {/* Mensuel */}
          <div className="plan-card" style={{ flex: 1, background: W, border: `1px solid ${BD}`, borderRadius: 20, padding: '36px 32px', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: T3, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>MENSUEL</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 42, fontWeight: 800, color: T }}>97 €</span>
            </div>
            <p style={{ fontSize: 13, color: T3, marginBottom: 28 }}>par mois · résiliable à tout moment</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, flex: 1 }}>
              {FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckIcon />
                  <span style={{ fontSize: 13, color: T2, lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>

            <button className="cta-btn" onClick={() => handleSelect('monthly')} disabled={isDisabled} style={{
              width: '100%', padding: '14px', borderRadius: 99,
              background: T, color: W, border: 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14,
              cursor: 'pointer', transition: 'opacity .2s, transform .15s',
            }}>
              {loading === 'monthly' ? 'Redirection vers le paiement…' : 'Commencer maintenant →'}
            </button>
          </div>

          {/* Annuel */}
          <div className="plan-card" style={{ flex: 1, background: W, border: `2px solid ${G}`, borderRadius: 20, padding: '36px 32px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <span style={{
              position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
              background: G, color: W, fontSize: 11, fontWeight: 700,
              padding: '4px 16px', borderRadius: 99, letterSpacing: '.06em',
              whiteSpace: 'nowrap',
            }}>Meilleure offre</span>

            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: G, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>ANNUEL</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 42, fontWeight: 800, color: T }}>899 €</span>
            </div>
            <p style={{ fontSize: 13, color: T3, marginBottom: 4 }}>par an · soit 74,92 €/mois</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: G, marginBottom: 28 }}>Économise 265 € vs mensuel</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, flex: 1 }}>
              {FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckIcon />
                  <span style={{ fontSize: 13, color: T2, lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>

            <button className="cta-btn" onClick={() => handleSelect('annual')} disabled={isDisabled} style={{
              width: '100%', padding: '14px', borderRadius: 99,
              background: G, color: W, border: 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14,
              cursor: 'pointer', transition: 'opacity .2s, transform .15s',
            }}>
              {loading === 'annual' ? 'Redirection vers le paiement…' : 'Choisir l\'annuel →'}
            </button>
          </div>
        </div>

        {error && (
          <p style={{ marginTop: 20, fontSize: 13, color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 18px' }}>
            {error}
          </p>
        )}

        {/* Sécurité */}
        <p style={{ marginTop: 28, fontSize: 12, color: T3, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1L2 3v3.5c0 2.7 1.9 5.2 4.5 5.8C9.1 11.7 11 9.2 11 6.5V3L6.5 1z" stroke={T3} strokeWidth="1.3" strokeLinejoin="round"/></svg>
          Paiement sécurisé par Stripe · Sans engagement pour le mensuel
        </p>
      </div>
    </>
  )
}

export default function SubscribePage() {
  return (
    <Suspense>
      <SubscribeContent />
    </Suspense>
  )
}
