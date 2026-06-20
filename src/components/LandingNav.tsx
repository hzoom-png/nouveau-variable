'use client'

import { useState, useEffect } from 'react'

const NAV_STYLES = `
  .landing-nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 40px; height: 64px;
    border-bottom: 1px solid var(--border, #E4EEEA);
    transition: background 0.2s; gap: 12px;
  }
  .landing-nav-links { display: none; }
  .landing-nav-link {
    font-family: var(--font-inter, 'Inter', system-ui, sans-serif);
    font-weight: 500; font-size: 14px;
    color: var(--text-2, #4B6358); text-decoration: none;
    transition: color 0.15s;
  }
  .landing-nav-link:hover { color: var(--green, #2F5446); }
  .landing-nav-sec {
    font-family: var(--font-inter, 'Inter', system-ui, sans-serif);
    font-weight: 600; color: var(--green, #2F5446);
    background: transparent; border: 1.5px solid var(--green, #2F5446);
    border-radius: 99px; text-decoration: none;
    font-size: 13px; padding: 8px 18px;
    transition: all 0.15s ease; white-space: nowrap; display: inline-block;
  }
  .landing-nav-sec:hover { background: var(--green-3, #e8f5ef); }
  .landing-nav-cta {
    font-family: var(--font-inter, 'Inter', system-ui, sans-serif);
    font-weight: 600; color: #fff;
    background: #D4AF37; border: 2px solid #D4AF37;
    border-radius: 99px; text-decoration: none;
    font-size: 13px; padding: 8px 18px;
    transition: all 0.3s ease; white-space: nowrap; display: inline-block;
  }
  .landing-nav-cta:hover { background: #E8C547; border-color: #D4AF37; box-shadow: 0 0 20px rgba(212,175,55,0.4); }
  .landing-nav-burger {
    display: flex; flex-direction: column; gap: 5px;
    cursor: pointer; padding: 4px; background: none; border: none;
  }
  .lnb-line {
    display: block; width: 22px; height: 2px;
    background: var(--text, #0F1C17); border-radius: 2px;
    transition: all 0.25s ease; transform-origin: center;
  }
  .landing-nav-mobile {
    position: sticky; top: 64px; z-index: 99;
    background: #fff; border-bottom: 1px solid var(--border, #E4EEEA);
    padding: 20px 24px 24px;
    animation: lnmFadeIn 0.2s ease;
  }
  @keyframes lnmFadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (max-width: 640px) {
    .landing-nav { padding: 0 16px !important; height: 56px !important; }
    .landing-nav-mobile { top: 56px; }
    .landing-nav-sec { font-size: 12px !important; padding: 6px 14px !important; }
    .landing-nav-cta { font-size: 12px !important; padding: 6px 14px !important; }
  }
`

export function LandingNav({ candidateHref = '/#candidature' }: { candidateHref?: string }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <style>{NAV_STYLES}</style>

      <nav
        className="landing-nav"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.92)' : '#fff',
          backdropFilter: scrolled ? 'blur(8px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(8px)' : 'none',
        } as React.CSSProperties}
      >
        <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img
            src="/icon_margin_transparent_customcolor.png"
            alt="NV"
            style={{ height: 40, width: 40, objectFit: 'contain', minWidth: 40 }}
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
          />
        </a>

        {/* Desktop */}
        <div className="landing-nav-links">
          <a href="/outils" className="landing-nav-link">Outils</a>
          <a href="/about" className="landing-nav-link">Qui sommes-nous</a>
          <a href="https://app.nouveauvariable.fr/auth" className="landing-nav-sec">
            Se connecter →
          </a>
          <a href={candidateHref} className="landing-nav-cta">
            Candidater →
          </a>
        </div>

        {/* Burger */}
        <button
          className="landing-nav-burger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          <span className="lnb-line" style={menuOpen ? { transform: 'rotate(45deg) translate(5px, 5px)' } : undefined} />
          <span className="lnb-line" style={menuOpen ? { opacity: 0 } : undefined} />
          <span className="lnb-line" style={menuOpen ? { transform: 'rotate(-45deg) translate(5px, -5px)' } : undefined} />
        </button>
      </nav>

      {menuOpen && (
        <div className="landing-nav-mobile">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <a
              href="/outils"
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500, fontSize: 15, color: 'var(--text, #0F1C17)', textDecoration: 'none' }}
            >
              Outils
            </a>
            <a
              href="/about"
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500, fontSize: 15, color: 'var(--text, #0F1C17)', textDecoration: 'none' }}
            >
              Qui sommes-nous
            </a>
            <div style={{ borderTop: '1px solid var(--border, #E4EEEA)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a
                href="https://app.nouveauvariable.fr/auth"
                className="landing-nav-sec"
                style={{ textAlign: 'center' }}
              >
                Se connecter →
              </a>
              <a
                href={candidateHref}
                className="landing-nav-cta"
                style={{ textAlign: 'center' }}
                onClick={() => setMenuOpen(false)}
              >
                Candidater →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
