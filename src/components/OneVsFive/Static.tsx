'use client'

import { useEffect } from 'react'

export function OneVsFiveStatic() {
  useEffect(() => {
    const sec = document.querySelector('.cmp-section')
    if (!sec) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        sec.querySelectorAll('.cmp-l, .cmp-r').forEach(el => el.classList.add('cmp-v'))
        obs.disconnect()
      }
    }, { threshold: 0.15 })
    obs.observe(sec)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      className="sf cmp-section sec-pad"
      style={{ padding: '80px 40px', background: '#fff', borderTop: '1px solid var(--border)' }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
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

        <div className="two-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Sans NV */}
          <div className="cmp-l" style={{
            background: '#fafafa', border: '1px solid var(--border)',
            borderRadius: 20, padding: '36px 40px',
          }}>
            <p style={{
              fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 13,
              color: 'var(--text-3)', letterSpacing: '.08em',
              textTransform: 'uppercase', marginBottom: 28,
            }}>
              Sans Nouveau Variable
            </p>
            {([
              { label: "Club d'affaires réseau", cost: "~100€/mois" },
              { label: "Plateforme missions freelance", cost: "~30€/mois" },
              { label: "Réseau social pro", cost: "~30€/mois" },
              { label: "Événements à trouver soi-même", cost: "temps perdu" },
              { label: "Outils SaaS éparpillés", cost: "~50€/mois" },
            ] as const).map((item, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
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

          {/* Avec NV */}
          <div className="cmp-r" style={{
            background: 'var(--green)', border: '1.5px solid var(--green)',
            borderRadius: 20, padding: '36px 40px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -60, right: -60,
              width: 200, height: 200,
              background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28,
            }}>
              <p style={{
                fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 13,
                color: 'rgba(255,255,255,0.8)', letterSpacing: '.08em',
                textTransform: 'uppercase', margin: 0, position: 'relative',
              }}>
                Nouveau Variable
              </p>
              <img
                src="/logo-nv.svg" alt="NV"
                style={{ height: 28, width: 'auto', opacity: 0.85 }}
                onError={e => (e.currentTarget.style.display = 'none')}
              />
            </div>
            {([
              "Réseau sélectionné de commerciaux",
              "Missions et opportunités en exclusivité",
              "Profil visible dans l'annuaire dédié",
              "Événements organisés entre membres",
              "Outils SaaS intégrés (Réplique, Missions, Deallink)",
              "Système d'affiliation pour générer des revenus",
            ] as const).map((item, i, arr) => (
              <div key={i} className="cmp-item" style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 0',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                position: 'relative',
              }}>
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
    </section>
  )
}
