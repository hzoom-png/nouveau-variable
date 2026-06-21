'use client'

import { useRef, useEffect } from 'react'

const FEATURES = [
  'Pilote ton projet perso sans efforts',
  'Présente-le à une communauté engagée',
  'Crée des RDV avec les membres du club',
  'Accède à des missions pour compléter ton salaire',
  "Gagne des commissions sur l'apport d'affaires",
  "Bénéficie d'outils d'aide à la vente",
  'Accède aux événements privés',
]

const N = FEATURES.length
const SCROLL_SPACE = 900

function clamp01(v: number) { return v < 0 ? 0 : v > 1 ? 1 : v }

export function PricingSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const featureEls = useRef<(HTMLLIElement | null)[]>([])
  const priceEls = useRef<(HTMLSpanElement | null)[]>([])
  const ctaEls = useRef<(HTMLAnchorElement | null)[]>([])

  useEffect(() => {
    const container = containerRef.current
    const inner = innerRef.current
    if (!container || !inner) return

    // Height = max(content, viewport) + SCROLL_SPACE guarantees sticky is visible
    // for exactly SCROLL_SPACE px regardless of screen size.
    const updateHeight = () => {
      container.style.height = `${Math.max(inner.offsetHeight, window.innerHeight) + SCROLL_SPACE}px`
    }
    updateHeight()

    const animate = (p: number) => {
      // Features: 14 items (7 per card), both cards reveal in sync via i % N
      featureEls.current.forEach((el, i) => {
        if (!el) return
        const g = i % N
        const s = (g / N) * 0.82
        const e = ((g + 1) / N) * 0.82
        const fp = clamp01((p - s) / (e - s))
        el.style.opacity = String(fp)
        el.style.filter = fp < 1 ? `blur(${(8 * (1 - fp)).toFixed(2)}px)` : 'none'
        el.style.transform = fp < 1 ? `translateY(${(12 * (1 - fp)).toFixed(2)}px)` : 'none'
      })

      // Price amounts: blur clears progressively as features appear (60 → 100%)
      priceEls.current.forEach((el) => {
        if (!el) return
        const pp = clamp01((p - 0.60) / 0.40)
        el.style.filter = pp < 1 ? `blur(${(20 * (1 - pp)).toFixed(2)}px)` : 'none'
        el.style.opacity = String(0.15 + 0.85 * pp)
      })

      // CTAs: appear last (85 → 100%)
      ctaEls.current.forEach((el) => {
        if (!el) return
        const cp = clamp01((p - 0.85) / 0.15)
        el.style.opacity = String(cp)
        el.style.pointerEvents = cp > 0.5 ? 'auto' : 'none'
      })
    }

    let rafId: number | null = null

    const onScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        const p = clamp01(-container.getBoundingClientRect().top / SCROLL_SPACE)
        animate(p)
        rafId = null
      })
    }

    animate(clamp01(-container.getBoundingClientRect().top / SCROLL_SPACE))
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateHeight)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateHeight)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  const card = (isAnnual: boolean, idx: number) => (
    <div
      className="pricing-card"
      style={{
        borderRadius: 20, padding: '40px 36px',
        border: isAnnual ? '2px solid var(--green)' : '1.5px solid var(--border)',
        background: '#fff',
        display: 'flex', flexDirection: 'column', gap: 0,
        position: 'relative',
        boxShadow: isAnnual ? '0 4px 24px rgba(47,84,70,0.10)' : undefined,
        transition: isAnnual
          ? 'box-shadow 0.25s ease'
          : 'border-color 0.25s ease, box-shadow 0.25s ease',
      }}
      onMouseEnter={e => {
        if (isAnnual) e.currentTarget.style.boxShadow = '0 12px 40px rgba(47,84,70,0.18)'
        else { e.currentTarget.style.borderColor = 'var(--green-4)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(47,84,70,0.09)' }
      }}
      onMouseLeave={e => {
        if (isAnnual) e.currentTarget.style.boxShadow = '0 4px 24px rgba(47,84,70,0.10)'
        else { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }
      }}
    >
      {isAnnual && (
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--green)', color: '#fff',
          fontFamily: 'var(--fi)', fontSize: 11, fontWeight: 600,
          letterSpacing: '.06em', textTransform: 'uppercase',
          borderRadius: 99, padding: '5px 16px', whiteSpace: 'nowrap',
        }}>
          Meilleure offre
        </div>
      )}

      <p style={{
        fontFamily: 'var(--fi)', fontSize: 11, fontWeight: 600,
        color: isAnnual ? 'var(--green)' : 'var(--text-3)',
        letterSpacing: '.1em', textTransform: 'uppercase', margin: '0 0 20px',
      }}>
        {isAnnual ? 'ANNUEL' : 'MENSUEL'}
      </p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
        <span
          ref={el => { priceEls.current[idx] = el }}
          style={{
            fontFamily: 'var(--fi)', fontWeight: 400, fontSize: 48,
            color: 'var(--text)', lineHeight: 1,
            filter: 'blur(20px)', opacity: 0.15,
            willChange: 'filter, opacity',
          }}
        >
          {isAnnual ? '899' : '97'}
        </span>
        <span style={{ fontFamily: 'var(--fi)', fontWeight: 500, fontSize: 20, color: 'var(--text-2)' }}>€</span>
      </div>

      {isAnnual ? (
        <>
          <p style={{ fontFamily: 'var(--fi)', fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>
            par an
          </p>
          <p style={{ fontFamily: 'var(--fi)', fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 32 }}>
            soit 74,92 €/mois · Économise 265 €
          </p>
        </>
      ) : (
        <p style={{ fontFamily: 'var(--fi)', fontSize: 13, color: 'var(--text-3)', marginBottom: 32 }}>
          par mois · résiliable à tout moment
        </p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {FEATURES.map((item, i) => (
          <li
            key={item}
            ref={el => { featureEls.current[idx * N + i] = el }}
            className="pricing-li"
            style={{
              opacity: 0, filter: 'blur(8px)', transform: 'translateY(12px)',
              willChange: 'opacity, filter, transform',
            }}
          >
            <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
            <span className="pricing-li-text" style={{ fontFamily: 'var(--fi)', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
              {item}
            </span>
          </li>
        ))}
      </ul>

      <a
        ref={el => { ctaEls.current[idx] = el }}
        href="#candidature"
        style={{
          display: 'block', textAlign: 'center',
          fontFamily: 'var(--fi)', fontWeight: 600, fontSize: 15,
          color: isAnnual ? '#fff' : 'var(--green)',
          background: isAnnual ? 'var(--green)' : 'var(--green-3)',
          ...(isAnnual ? {} : { border: '1.5px solid var(--green-4)' }),
          borderRadius: 12, padding: '14px 24px',
          textDecoration: 'none',
          transition: 'background 0.18s ease, border-color 0.18s ease',
          marginTop: 'auto',
          opacity: 0,
          pointerEvents: 'none' as const,
          willChange: 'opacity',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = isAnnual ? 'var(--green-2)' : 'var(--green-4)' }}
        onMouseLeave={e => { e.currentTarget.style.background = isAnnual ? 'var(--green)' : 'var(--green-3)' }}
      >
        {isAnnual ? "Choisir l'annuel →" : 'Commencer maintenant →'}
      </a>
    </div>
  )

  return (
    <div
      ref={containerRef}
      id="pricingSection"
      style={{ position: 'relative', borderTop: '1px solid var(--border)' }}
    >
      <div
        ref={innerRef}
        style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10, padding: '96px 40px' }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{
              fontFamily: 'var(--fi)', fontWeight: 400,
              fontSize: 'clamp(26px, 4vw, 40px)', color: 'var(--text)',
              letterSpacing: '-.02em', lineHeight: 1.2, marginBottom: 16,
            }}>
              Accède au tremplin que tu cherchais
            </h2>
            <p style={{
              fontFamily: 'var(--fi)', fontSize: 16, color: 'var(--text-2)',
              maxWidth: 480, margin: '0 auto', lineHeight: 1.7,
            }}>
              Un seul abonnement. Tous les outils, l'annuaire et les opportunités du club.
            </p>
          </div>

          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {card(false, 0)}
            {card(true, 1)}
          </div>

          <p style={{
            textAlign: 'center', fontFamily: 'var(--fi)', fontSize: 12,
            color: 'var(--text-3)', marginTop: 28, lineHeight: 1.8,
          }}>
            Paiement sécurisé par Stripe · Sans engagement pour le mensuel<br />
            * Lien d'affiliation actif même après expiration de l'abonnement
          </p>
        </div>
      </div>
    </div>
  )
}
