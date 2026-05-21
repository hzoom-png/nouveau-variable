'use client'

import { useRef } from 'react'
import { useMotionValueEvent } from 'framer-motion'
import { useScrollProgress } from '@/components/RevenueAnimation/hooks/useScrollHijack'

const SANS_NV_ITEMS = [
  { label: "Club d'affaires réseau", cost: "~100€/mois" },
  { label: "Plateforme missions freelance", cost: "~30€/mois" },
  { label: "Réseau social pro", cost: "~30€/mois" },
  { label: "Événements à trouver soi-même", cost: "temps perdu" },
  { label: "Outils SaaS éparpillés", cost: "~50€/mois" },
] as const

const NV_ITEMS = [
  "Réseau sélectionné de commerciaux",
  "Missions et opportunités en exclusivité",
  "Profil visible dans l'annuaire dédié",
  "Événements organisés entre membres",
  "Outils SaaS intégrés (Réplique, Missions, Deallink)",
  "Système d'affiliation pour générer des revenus",
] as const

// [fadeStart, fadeEnd] for each NV item — synced with green bg growth
const ITEM_RANGES: [number, number][] = [
  [0.30, 0.38],
  [0.38, 0.46],
  [0.46, 0.54],
  [0.54, 0.62],
  [0.62, 0.70],
  [0.70, 0.78],
]

export function OneVsFiveAnimated() {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftRef      = useRef<HTMLDivElement>(null)
  const rightRef     = useRef<HTMLDivElement>(null)
  const greenBgRef   = useRef<HTMLDivElement>(null)
  const itemRefs     = useRef<(HTMLDivElement | null)[]>(Array(NV_ITEMS.length).fill(null))

  const progress = useScrollProgress(containerRef)

  useMotionValueEvent(progress, 'change', (p) => {
    // Left column: fade in 0.05 → 0.22
    const left = leftRef.current
    if (left) {
      const op = Math.min(1, Math.max(0, (p - 0.05) / 0.17))
      left.style.opacity       = String(op)
      left.style.pointerEvents = op > 0.08 ? '' : 'none'
    }

    // Right column: unlock pointer events at 0.20 (when green bg starts)
    const right = rightRef.current
    if (right) {
      right.style.pointerEvents = p >= 0.20 ? '' : 'none'
    }

    // Green bg: scaleY 0→1 from top, progress 0.20→0.80
    const bg = greenBgRef.current
    if (bg) {
      const scale = p < 0.20 ? 0 : p > 0.80 ? 1 : (p - 0.20) / 0.60
      bg.style.transform = `scaleY(${scale})`
    }

    // NV items: staggered fade in + slide up
    ITEM_RANGES.forEach(([start, end], i) => {
      const el = itemRefs.current[i]
      if (!el) return
      if (p < start) {
        el.style.opacity    = '0'
        el.style.transform  = 'translateY(16px)'
      } else if (p >= end) {
        el.style.opacity    = '1'
        el.style.transform  = ''         // release to CSS so hover scale works
        el.style.transition = ''         // restore CSS transition for hover
      } else {
        const frac = (p - start) / (end - start)
        el.style.opacity    = String(frac)
        el.style.transform  = `translateY(${Math.round(16 * (1 - frac))}px)`
      }
    })
  })

  return (
    <div ref={containerRef} style={{ height: '300vh', position: 'relative' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
        background: '#fff',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 40px',
      }}>
        <div style={{ maxWidth: 1100, width: '100%' }}>

          {/* Title — visible immediately to anchor the user */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <p style={{
              fontFamily: 'var(--fi)', fontSize: 11, fontWeight: 600,
              letterSpacing: '.12em', textTransform: 'uppercase',
              color: 'var(--green-4)', marginBottom: 14,
            }}>
              Pourquoi Nouveau Variable
            </p>
            <h2 style={{
              fontFamily: 'var(--fj)', fontWeight: 600,
              fontSize: 'clamp(26px, 4vw, 44px)', color: 'var(--text)', lineHeight: 1.15,
            }}>
              Pour une fois,{' '}
              <span style={{ color: 'var(--green)', fontSize: 'clamp(34px, 5vw, 56px)' }}>1</span>
              {' '}est supérieur à{' '}
              <span style={{
                color: 'var(--text-3)',
                fontSize: 'clamp(34px, 5vw, 56px)',
                textDecoration: 'line-through',
                textDecorationColor: 'var(--border)',
              }}>
                5
              </span>
            </h2>
          </div>

          {/* Two-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* ── Left: Sans NV — fades in first ────────────────────── */}
            <div
              ref={leftRef}
              className="cmp-l-a"
              style={{
                opacity: 0,
                pointerEvents: 'none',
                background: '#fafafa',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '36px 40px',
              }}
            >
              <p style={{
                fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 13,
                color: 'var(--text-3)', letterSpacing: '.08em',
                textTransform: 'uppercase', marginBottom: 28,
              }}>
                Sans Nouveau Variable
              </p>
              {SANS_NV_ITEMS.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 0',
                  borderBottom: i < SANS_NV_ITEMS.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{
                    width: 22, height: 22, minWidth: 22, borderRadius: '50%',
                    border: '1.5px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: 'var(--text-3)', flexShrink: 0,
                  }}>○</span>
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--text-3)', lineHeight: 1.5 }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                    {item.cost}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                <p style={{ fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 15, color: 'var(--text-3)' }}>
                  5 abonnements séparés.
                </p>
                <p style={{ fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 15, color: 'var(--text-3)', marginTop: 2 }}>
                  ~210€/mois · 0 synergie.
                </p>
              </div>
            </div>

            {/* ── Right: NV — green bg builds from top ──────────────── */}
            <div
              ref={rightRef}
              className="cmp-r-a"
              style={{
                pointerEvents: 'none',
                border: '1.5px solid var(--green)',
                borderRadius: 20,
                padding: '36px 40px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Green background — grows via scaleY from top (covers full card incl. padding) */}
              <div
                ref={greenBgRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--green)',
                  transform: 'scaleY(0)',
                  transformOrigin: 'top',
                  zIndex: 0,
                }}
              />

              {/* Radial glow decoration */}
              <div style={{
                position: 'absolute', top: -60, right: -60,
                width: 200, height: 200,
                background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: 1,
              }} />

              {/* All content — above green bg */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 28,
                }}>
                  <p style={{
                    fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 13,
                    color: 'rgba(255,255,255,0.8)', letterSpacing: '.08em',
                    textTransform: 'uppercase', margin: 0,
                  }}>
                    Nouveau Variable
                  </p>
                  <img
                    src="/logo-nv.svg" alt="NV"
                    style={{ height: 28, width: 'auto', opacity: 0.85 }}
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                </div>

                {NV_ITEMS.map((item, i) => (
                  <div
                    key={i}
                    ref={el => { itemRefs.current[i] = el }}
                    className="cmp-item"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '13px 0',
                      borderBottom: i < NV_ITEMS.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                      position: 'relative',
                      opacity: 0,
                      transform: 'translateY(16px)',
                      transition: 'none',
                    }}
                  >
                    <span style={{
                      width: 22, height: 22, minWidth: 22, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, color: '#fff', fontWeight: 600, flexShrink: 0,
                    }}>✓</span>
                    <span style={{ fontSize: 14, color: '#fff', fontWeight: 500, lineHeight: 1.5 }}>
                      {item}
                    </span>
                  </div>
                ))}

                <div style={{
                  marginTop: 24, paddingTop: 24,
                  borderTop: '1px solid rgba(255,255,255,0.2)',
                }}>
                  <p style={{ fontFamily: 'var(--fj)', fontWeight: 500, fontSize: 15, color: '#fff' }}>
                    Un seul club. Tout-en-un.
                  </p>
                  <p style={{ fontFamily: 'var(--fi)', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                    Tarif communiqué après acceptation de ta candidature.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
