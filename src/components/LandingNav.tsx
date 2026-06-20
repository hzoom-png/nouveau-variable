'use client'

import { useState, useEffect } from 'react'

const NAV_STYLES = `
  .landing-nav {
    position: sticky; top: 0; z-index: 50;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 40px; height: 64px;
    border-bottom: 1px solid var(--border, #E4EEEA);
    transition: background 0.2s; gap: 12px;
  }
  .landing-nav-links { display: flex; align-items: center; gap: 10px; }
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

  /* Burger — caché sur desktop */
  .landing-nav-burger {
    display: none; flex-direction: column; gap: 5px;
    cursor: pointer; padding: 4px; background: none; border: none; z-index: 60;
  }
  .lnb-line {
    display: block; width: 22px; height: 2px;
    background: var(--text, #0F1C17); border-radius: 2px;
    transition: all 0.25s ease;
  }

  /* Overlay */
  .lnav-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.32); z-index: 48;
    animation: lnavFadeIn 0.2s ease;
  }
  @keyframes lnavFadeIn { from { opacity: 0; } to { opacity: 1; } }

  /* Sidebar drawer */
  .lnav-sidebar {
    position: fixed; top: 0; right: 0; bottom: 0;
    width: 280px;
    background: #fff;
    border-left: 1px solid var(--border, #E4EEEA);
    z-index: 49;
    display: flex; flex-direction: column;
    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
    box-shadow: -8px 0 32px rgba(0,0,0,0.08);
  }
  .lnav-sidebar-hd {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; height: 64px; flex-shrink: 0;
    border-bottom: 1px solid var(--border, #E4EEEA);
  }
  .lnav-sidebar-title {
    font-family: var(--font-inter, 'Inter', system-ui, sans-serif);
    font-weight: 600; font-size: 16px; color: var(--text, #0F1C17);
  }
  .lnav-close {
    background: none; border: none; cursor: pointer;
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    border-radius: 8px; color: var(--text-2, #4B6358); font-size: 18px;
    transition: background 0.15s, color 0.15s;
  }
  .lnav-close:hover { background: var(--surface, #F7FAF8); color: var(--text, #0F1C17); }
  .lnav-sidebar-body { flex: 1; overflow-y: auto; padding: 16px 24px; }
  .lnav-sidebar-link {
    display: block; font-family: var(--font-inter, 'Inter', system-ui, sans-serif);
    font-weight: 500; font-size: 15px; color: var(--text, #0F1C17);
    text-decoration: none; padding: 14px 0;
    border-bottom: 1px solid var(--border, #E4EEEA);
    transition: color 0.15s;
  }
  .lnav-sidebar-link:last-child { border-bottom: none; }
  .lnav-sidebar-link:hover { color: var(--green, #2F5446); }
  .lnav-sidebar-ft {
    padding: 20px 24px; border-top: 1px solid var(--border, #E4EEEA);
    display: flex; flex-direction: column; gap: 10px; flex-shrink: 0;
  }
  .lnav-ft-sec {
    display: block; width: 100%; padding: 12px 20px; text-align: center;
    font-family: var(--font-inter, 'Inter', system-ui, sans-serif);
    font-weight: 600; font-size: 14px;
    color: var(--green, #2F5446); background: transparent;
    border: 1.5px solid var(--green, #2F5446);
    border-radius: 99px; text-decoration: none;
    transition: background 0.15s ease;
  }
  .lnav-ft-sec:hover { background: var(--green-3, #e8f5ef); }
  .lnav-ft-cta {
    display: block; width: 100%; padding: 12px 20px; text-align: center;
    font-family: var(--font-inter, 'Inter', system-ui, sans-serif);
    font-weight: 600; font-size: 14px;
    color: #fff; background: #D4AF37; border: 2px solid #D4AF37;
    border-radius: 99px; text-decoration: none;
    transition: all 0.25s ease;
  }
  .lnav-ft-cta:hover { background: #E8C547; }

  /* Mobile */
  @media (max-width: 767px) {
    .landing-nav { padding: 0 16px !important; height: 56px !important; }
    .landing-nav-links { display: none !important; }
    .landing-nav-burger { display: flex !important; }
  }
  /* Desktop — sidebar jamais visible */
  @media (min-width: 768px) {
    .lnav-overlay { display: none !important; }
    .lnav-sidebar { display: none !important; }
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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const close = () => setMenuOpen(false)

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

        {/* Desktop nav */}
        <div className="landing-nav-links">
          <a href="/outils" className="landing-nav-link">Outils</a>
          <a href="https://app.nouveauvariable.fr/auth" className="landing-nav-sec">Se connecter →</a>
          <a href={candidateHref} className="landing-nav-cta">Candidater →</a>
        </div>

        {/* Burger (mobile only) */}
        <button
          className="landing-nav-burger"
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <span className="lnb-line" />
          <span className="lnb-line" />
          <span className="lnb-line" />
        </button>
      </nav>

      {/* Overlay */}
      {menuOpen && <div className="lnav-overlay" onClick={close} />}

      {/* Sidebar drawer */}
      <div
        className="lnav-sidebar"
        style={{ transform: menuOpen ? 'translateX(0)' : 'translateX(100%)' }}
        aria-hidden={!menuOpen}
      >
        <div className="lnav-sidebar-hd">
          <span className="lnav-sidebar-title">Menu</span>
          <button className="lnav-close" onClick={close} aria-label="Fermer le menu">✕</button>
        </div>

        <div className="lnav-sidebar-body">
          <a href="/outils" className="lnav-sidebar-link" onClick={close}>Outils</a>
        </div>

        <div className="lnav-sidebar-ft">
          <a href="https://app.nouveauvariable.fr/auth" className="lnav-ft-sec" onClick={close}>
            Se connecter →
          </a>
          <a href={candidateHref} className="lnav-ft-cta" onClick={close}>
            Candidater →
          </a>
        </div>
      </div>
    </>
  )
}
