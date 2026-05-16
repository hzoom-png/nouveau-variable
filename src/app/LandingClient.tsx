'use client'

import { useState, useEffect, type CSSProperties } from 'react'

const GOAL = 100

const inp: CSSProperties = {
  width: '100%', padding: '14px 16px',
  border: '1.5px solid var(--border)', borderRadius: 12,
  fontSize: 15, color: 'var(--text)', background: 'var(--white)',
  fontFamily: 'var(--font-inter), Inter, sans-serif',
  outline: 'none', transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  boxSizing: 'border-box',
}

const lbl: CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: 'var(--text-2)', textTransform: 'uppercase',
  letterSpacing: '.07em', marginBottom: 6,
  fontFamily: 'var(--font-inter), Inter, sans-serif',
}

export default function LandingClient({ waitlistCount }: { waitlistCount: number }) {
  const [scrolled, setScrolled] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState({
    firstname: '', lastname: '', email: '', phone: '', city: '',
    role: '', sector: '', xp: '', why: '', referral: '',
  })
  const [referralReadonly, setReferralReadonly] = useState(false)
  const [cguAccepted, setCguAccepted] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [showProjectFields, setShowProjectFields] = useState(false)
  const [project, setProject] = useState({
    projet_nom: '', projet_website: '', projet_concept: '',
    projet_avancement: '', projet_besoins: [] as string[],
  })
  const [errorMsg, setErrorMsg] = useState('')
  const [cookieBanner, setCookieBanner] = useState<boolean | null>(null)
  const [progressWidth, setProgressWidth] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref') || params.get('code')
    if (ref) { setField('referral', ref.toUpperCase()); setReferralReadonly(true) }
  }, [])

  useEffect(() => {
    setCookieBanner(localStorage.getItem('nv_cookie_consent') === null)
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.sf')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('sf-v'); obs.unobserve(e.target) } }),
      { threshold: 0.1 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

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

  useEffect(() => {
    const t = setTimeout(() => {
      setProgressWidth(waitlistCount >= GOAL ? 100 : Math.max((waitlistCount / GOAL) * 100, 4))
    }, 400)
    return () => clearTimeout(t)
  }, [waitlistCount])

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function handleStep1(e: React.FormEvent) { e.preventDefault(); setStep(2) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    if (showProjectFields) {
      if (project.projet_nom.trim().length < 2) {
        setErrorMsg('Le nom du projet est requis (minimum 2 caractères).')
        return
      }
      if (project.projet_concept.trim().length < 10) {
        setErrorMsg('Le concept est requis (minimum 10 caractères).')
        return
      }
      if (!project.projet_avancement) {
        setErrorMsg("Sélectionne l'état d'avancement de ton projet.")
        return
      }
      if (project.projet_besoins.length === 0) {
        setErrorMsg('Sélectionne au moins un besoin pour ton projet.')
        return
      }
      if (project.projet_website && !/^https?:\/\/.+\..+/.test(project.projet_website)) {
        setErrorMsg('Le site web doit être une URL valide (ex : https://monprojet.com).')
        return
      }
    }
    setStatus('loading')
    const payload: Record<string, unknown> = { ...form }
    if (showProjectFields) Object.assign(payload, project)
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) { setStatus('success'); return }
      const data = await res.json().catch(() => ({}))
      if (data.error === 'already_exists')
        setErrorMsg(data.message ?? 'Une candidature existe déjà pour cet email.')
      setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  const isAboveGoal = waitlistCount >= GOAL

  return (
    <div className="nv-landing">
      <style>{`
        :root {
          --fj: var(--font-jost), 'Jost', system-ui, sans-serif;
          --fi: var(--font-inter), 'Inter', system-ui, sans-serif;
        }
        .nv-landing {
          --green:    #2F5446;
          --green-2:  #3D6B58;
          --green-3:  #EAF2EE;
          --green-4:  #C5DDD5;
          --amber:    #C8790A;
          --text:     #0F1C17;
          --text-2:   #4B6358;
          --text-3:   #8FAAA0;
          --surface:  #F7FAF8;
          --white:    #ffffff;
          --border:   #E4EEEA;
          --border-2: #D0E4DC;
          --red:      #B91C1C;
          --red-2:    #FEF2F2;
          color-scheme: light;
          background: #ffffff;
        }
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes checkPop {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes checkDraw {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .hero-el { opacity: 0; }
        .hero-el-1 { animation: heroIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s forwards; }
        .hero-el-2 { animation: heroIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s  forwards; }
        .hero-el-3 { animation: heroIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.35s forwards; }
        .hero-el-4 { animation: heroIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.5s  forwards; }
        .sf {
          opacity: 0; transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .sf.sf-v { opacity: 1; transform: translateY(0); }
        .cmp-l {
          opacity: 0; transform: translateX(-18px);
          transition: opacity 0.55s ease 0.05s, transform 0.55s ease 0.05s;
        }
        .cmp-r {
          opacity: 0; transform: translateX(18px);
          transition: opacity 0.55s ease 0.15s, transform 0.55s ease 0.15s;
        }
        .cmp-l.cmp-v, .cmp-r.cmp-v { opacity: 1; transform: translateX(0); }
        .lp-input:focus {
          border-color: var(--green) !important;
          box-shadow: 0 0 0 3px rgba(2,79,65,0.08);
          outline: none;
        }
        select { appearance: none; -webkit-appearance: none; }
        .step-content { animation: stepIn 0.3s ease forwards; }
        .check-pop { animation: checkPop 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        .check-draw {
          stroke-dasharray: 60; stroke-dashoffset: 60;
          animation: checkDraw 0.5s ease 0.35s forwards;
        }
        .btn-spin { animation: spin 0.7s linear infinite; display: inline-block; }
        .btn-green { transition: background 0.2s, transform 0.15s; }
        .btn-green:hover { background: var(--green-2) !important; transform: translateY(-1px); }
        .btn-green:active { transform: translateY(0); }
        .tool-card { transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s; }
        .tool-card:hover {
          border-color: var(--green) !important;
          box-shadow: 0 8px 32px rgba(2,79,65,0.10) !important;
          transform: translateY(-2px);
        }
        .nav-cta { transition: background 0.2s; }
        .nav-cta:hover { background: var(--green-2) !important; }
        .ft-link { transition: color 0.15s; }
        .ft-link:hover { color: var(--text) !important; }
        .btn-ghost { transition: color 0.15s; }
        .btn-ghost:hover { color: var(--text) !important; }
        .steps-wrap { display: flex; align-items: flex-start; }
        .step-arrow { display: flex; align-items: center; padding-top: 14px; color: var(--green-4); font-size: 20px; flex-shrink: 0; }
        @media (max-width: 640px) {
          .mob-col   { flex-direction: column !important; }
          .mob-pad   { padding: 48px 20px !important; }
          .mob-h1    { font-size: 34px !important; }
          .mob-full  { width: 100% !important; }
          .mob-stack { grid-template-columns: 1fr !important; }
          .mob-fp    { padding: 28px 20px !important; }
          .mob-ct    { text-align: center !important; }
          .steps-wrap  { flex-direction: column !important; }
          .step-arrow  { display: none !important; }
          .ctas-row    { flex-direction: column !important; align-items: stretch !important; }
          .ctas-row a  { text-align: center; }
          .foot-row    { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .foot-links  { gap: 12px !important; flex-wrap: wrap !important; }
          .nav-inner   { padding: 0 20px !important; }
          .hero-sec    { padding: 80px 20px 60px !important; }
          .sec-pad     { padding: 56px 20px !important; }
          .aff-box     { padding: 32px 20px !important; }
          .form-wrap   { padding: 32px 20px !important; }
          .form-sec    { padding: 56px 20px !important; }
          .back-btn    { margin-bottom: 8px; }
          .step2-btns  { flex-direction: column-reverse !important; }
        }
        @media (max-width: 768px) {
          .two-grid  { grid-template-columns: 1fr !important; }
          .three-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .three-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ──────────────────────────────────────────────────────────────
          [A] NAVBAR
      ────────────────────────────────────────────────────────────── */}
      <nav className="nav-inner" style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        background: scrolled ? 'rgba(255,255,255,0.92)' : '#fff',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(8px)' : 'none',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/icon_margin_transparent_customcolor.png" alt="NV"
            style={{ height: 40, width: 40, objectFit: 'contain' }}
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <span style={{
            fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 12,
            letterSpacing: '.09em', color: 'var(--green)', textTransform: 'uppercase',
          }}>
            NOUVEAU VARIABLE
          </span>
        </div>
        <a href="#candidature" className="nav-cta" style={{
          fontFamily: 'var(--fj)', fontWeight: 700, fontSize: 13,
          color: '#fff', background: 'var(--green)',
          borderRadius: 99, padding: '9px 20px',
          textDecoration: 'none',
        }}>
          Candidater →
        </a>
      </nav>

      {/* ──────────────────────────────────────────────────────────────
          [B] HERO
      ────────────────────────────────────────────────────────────── */}
      <section className="hero-sec" style={{
        padding: '120px 40px 80px', maxWidth: 1200,
        margin: '0 auto', textAlign: 'center',
      }}>
        <div className="hero-el hero-el-1">
          <span style={{
            display: 'inline-block',
            fontFamily: 'var(--fi)', fontSize: 12, fontWeight: 700,
            color: 'var(--green)', background: 'var(--green-3)',
            borderRadius: 99, padding: '5px 16px', letterSpacing: '.04em',
          }}>
            Accès sur candidature · 1 000 places max
          </span>
        </div>

        <h1 className="hero-el hero-el-2 mob-h1" style={{
          fontFamily: 'var(--fj)', fontWeight: 600,
          fontSize: 'clamp(36px, 5.5vw, 58px)', lineHeight: 1.1,
          color: 'var(--text)', maxWidth: 720, margin: '24px auto 0',
          letterSpacing: '-.025em',
        }}>
          Le système qui fait travailler<br />
          ton réseau pour toi.
        </h1>

        <p className="hero-el hero-el-3" style={{
          fontFamily: 'var(--fi)', fontSize: 18, lineHeight: 1.7,
          color: 'var(--text-2)', maxWidth: 520, margin: '20px auto 0',
        }}>
          Outils exclusifs, missions commerciales, affiliation et réseau privé.
          Un seul club. Une boucle de revenus.
        </p>

        <div className="hero-el hero-el-4 ctas-row" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 20, marginTop: 40, flexWrap: 'wrap',
        }}>
          <a href="#candidature" className="btn-green" style={{
            fontFamily: 'var(--fj)', fontWeight: 700, fontSize: 15,
            color: '#fff', background: 'var(--green)',
            borderRadius: 99, padding: '16px 36px',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(2,79,65,.18)',
            display: 'inline-block',
          }}>
            Candidater au club →
          </a>
          <a href="#comment-ca-marche" className="btn-ghost" style={{
            fontFamily: 'var(--fi)', fontSize: 14, fontWeight: 500,
            color: 'var(--text-2)', textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}>
            Voir comment ça marche ↓
          </a>
        </div>

        {/* Waitlist counter */}
        <div className="hero-el hero-el-4" style={{ maxWidth: 360, margin: '36px auto 0' }}>
          <div style={{
            height: 6, background: 'var(--green-3)',
            borderRadius: 99, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${progressWidth}%`,
              background: 'var(--green)',
              transition: 'width 1s ease',
            }} />
          </div>
          <div style={{
            marginTop: 10,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontFamily: 'var(--fi)', fontSize: 13,
            color: isAboveGoal ? 'var(--amber)' : 'var(--text-2)',
          }}>
            {isAboveGoal ? (
              <span style={{ fontWeight: 600 }}>Ouverture imminente 🔓</span>
            ) : waitlistCount > 0 ? (
              <>
                <span>{waitlistCount} candidat{waitlistCount > 1 ? 's' : ''}</span>
                <span>Ouverture à {GOAL}</span>
              </>
            ) : (
              <span style={{ width: '100%', textAlign: 'center' }}>Rejoins les premiers membres</span>
            )}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          [C] BOUCLE DE VALEUR
      ────────────────────────────────────────────────────────────── */}
      <section
        id="comment-ca-marche"
        className="sf sec-pad"
        style={{
          padding: '80px 40px', background: '#fff',
          borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{
              fontFamily: 'var(--fj)', fontWeight: 600,
              fontSize: 'clamp(22px, 3.5vw, 36px)', color: 'var(--text)',
              letterSpacing: '-.02em',
            }}>
              Comment Nouveau Variable génère de la valeur ?
            </h2>
            <p style={{
              fontFamily: 'var(--fi)', fontSize: 16, color: 'var(--text-2)', marginTop: 12,
            }}>
              Un système actif pensé dans les moindres détails
            </p>
          </div>

          <div className="steps-wrap" style={{ alignItems: 'flex-start' }}>
            {([
              {
                n: '01',
                t: 'Tu rejoins et crées ton profil',
                d: 'Annuaire, outils, opportunités : le nombre fait la force.',
              },
              {
                n: '02',
                t: 'Tu exécutes des actions commerciales',
                d: "Missions freelance, closing & apport d'affaires via le réseau interne.",
              },
              {
                n: '03',
                t: 'Tu génères des résultats',
                d: 'Chaque action valorise ton profil et ouvre de nouvelles opportunités.',
              },
              {
                n: '04',
                t: 'Tu fais grandir le système',
                d: 'En parrainant d\'autres membres, tu perçois des commissions récurrentes mensuelles.',
              },
            ] as const).map((s, i, arr) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                <div style={{ flex: 1, padding: '0 8px 0 0' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'var(--green)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 14,
                    marginBottom: 14, flexShrink: 0,
                  }}>
                    {s.n}
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--fj)', fontWeight: 700, fontSize: 16,
                    color: 'var(--text)', marginBottom: 8, lineHeight: 1.35,
                  }}>
                    {s.t}
                  </h3>
                  <p style={{
                    fontFamily: 'var(--fi)', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7,
                  }}>
                    {s.d}
                  </p>
                </div>
                {i < arr.length - 1 && (
                  <div className="step-arrow" style={{ paddingTop: 14, paddingRight: 8, flexShrink: 0 }}>
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          [D] OUTILS
      ────────────────────────────────────────────────────────────── */}
      <section className="sf sec-pad" style={{ padding: '80px 40px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{
              fontFamily: 'var(--fj)', fontWeight: 600,
              fontSize: 'clamp(22px, 3.5vw, 36px)', color: 'var(--text)',
              letterSpacing: '-.02em',
            }}>
              Ce que tu trouves dans le club
            </h2>
          </div>

          <div className="three-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {([
              {
                icon: '💬',
                title: 'Réplique',
                badge: 'IA commerciale',
                desc: "Génère des scripts de prospection, des suivis et des objections traitées en 10 secondes. Entraîné sur les meilleures pratiques de vente.",
                tag: 'Réservé membres',
              },
              {
                icon: '🎯',
                title: 'Missions',
                badge: 'Marketplace interne',
                desc: "Closings, apports d'affaires, missions freelance. Diffusés exclusivement aux membres, et nulle part ailleurs.",
                tag: 'Exclusivité club',
              },
              {
                icon: '🔗',
                title: 'Deallink',
                badge: 'Distribution',
                desc: 'Crée une page de présentation personnalisée pour tes prospects, en fonction de leurs pain points et de ton offre.',
                tag: 'Gain de temps',
              },
            ] as const).map(card => (
              <div
                key={card.title}
                className="tool-card"
                style={{
                  background: '#fff',
                  border: '1.5px solid var(--border)',
                  borderRadius: 20, padding: 28,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 16 }}>{card.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  <h3 style={{
                    fontFamily: 'var(--fj)', fontWeight: 500, fontSize: 19, color: 'var(--text)',
                  }}>
                    {card.title}
                  </h3>
                  <span style={{
                    fontFamily: 'var(--fi)', fontSize: 11, fontWeight: 700,
                    color: 'var(--green)', background: 'var(--green-3)',
                    borderRadius: 99, padding: '3px 10px', letterSpacing: '.04em',
                    whiteSpace: 'nowrap',
                  }}>
                    {card.badge}
                  </span>
                </div>
                <p style={{
                  fontFamily: 'var(--fi)', fontSize: 14, color: 'var(--text-2)',
                  lineHeight: 1.7, marginBottom: 16,
                }}>
                  {card.desc}
                </p>
                <span style={{
                  display: 'inline-block',
                  fontFamily: 'var(--fi)', fontSize: 11, fontWeight: 600,
                  color: 'var(--text-3)',
                  border: '1px solid var(--border)',
                  borderRadius: 99, padding: '3px 10px',
                }}>
                  {card.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          [E] COMPARAISON
      ────────────────────────────────────────────────────────────── */}
      <section
        className="sf cmp-section sec-pad"
        style={{
          padding: '80px 40px', background: '#fff',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{
              fontFamily: 'var(--fi)', fontSize: 11, fontWeight: 700,
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
                fontFamily: 'var(--fj)', fontWeight: 700, fontSize: 13,
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
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--text-3)', lineHeight: 1.5 }}>{item.label}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic', whiteSpace: 'nowrap' }}>{item.cost}</span>
                </div>
              ))}
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                <p style={{ fontFamily: 'var(--fj)', fontWeight: 700, fontSize: 15, color: 'var(--text-3)' }}>
                  5 abonnements séparés.
                </p>
                <p style={{ fontFamily: 'var(--fj)', fontWeight: 700, fontSize: 15, color: 'var(--text-3)', marginTop: 2 }}>
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
                  fontFamily: 'var(--fj)', fontWeight: 700, fontSize: 13,
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
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                  position: 'relative',
                }}>
                  <span style={{
                    width: 22, height: 22, minWidth: 22, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: '#fff', fontWeight: 700, flexShrink: 0,
                  }}>✓</span>
                  <span style={{ fontSize: 14, color: '#fff', fontWeight: 500, lineHeight: 1.5 }}>{item}</span>
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

      {/* ──────────────────────────────────────────────────────────────
          [F] AFFILIATION
      ────────────────────────────────────────────────────────────── */}
      <section className="sf sec-pad" style={{ padding: '80px 40px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="aff-box" style={{
            background: 'var(--green-3)', borderRadius: 24, padding: '48px',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 style={{
                fontFamily: 'var(--fj)', fontWeight: 600,
                fontSize: 'clamp(22px, 3.5vw, 36px)', color: 'var(--text)',
                letterSpacing: '-.02em', marginBottom: 16,
              }}>
                Le seul club qui se rembourse lui-même
              </h2>
              <p style={{
                fontFamily: 'var(--fi)', fontSize: 16, color: 'var(--text-2)',
                maxWidth: 500, margin: '0 auto', lineHeight: 1.7,
              }}>
                En parrainant d'autres membres, tu perçois une commission mensuelle
                récurrente — tant qu'ils restent membres.
              </p>
            </div>

            <div className="three-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32,
            }}>
              {([
                {
                  label: 'N1',
                  title: 'Parrainage direct',
                  desc: 'Commission mensuelle récurrente sur chaque filleul direct actif.',
                },
                {
                  label: 'N2',
                  title: 'Parrainage indirect',
                  desc: 'Commission de second niveau sur les filleuls de tes filleuls.',
                },
                {
                  label: '∞',
                  title: 'Lien permanent',
                  desc: "Ton lien d'affiliation reste actif même après expiration de ton abonnement. Pas de pay-to-play.",
                },
              ] as const).map(m => (
                <div key={m.label} style={{
                  background: '#fff', borderRadius: 16, padding: 24,
                  boxShadow: '0 2px 16px rgba(2,79,65,0.06)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--green)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 14,
                    marginBottom: 12, flexShrink: 0,
                  }}>
                    {m.label}
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--fj)', fontWeight: 700, fontSize: 15,
                    color: 'var(--text)', marginBottom: 6,
                  }}>
                    {m.title}
                  </h3>
                  <p style={{
                    fontFamily: 'var(--fi)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6,
                  }}>
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>

            <p style={{
              fontFamily: 'var(--fi)', fontSize: 11, color: 'var(--text-2)',
              fontStyle: 'italic', textAlign: 'center',
              maxWidth: 560, margin: '0 auto 28px',
              lineHeight: 1.6,
            }}>
              Les commissions sont versées sur présentation d'une facture.
              Les montants exacts sont communiqués après acceptation.
            </p>

            <div style={{ textAlign: 'center' }}>
              <a href="#candidature" className="btn-green" style={{
                display: 'inline-block',
                fontFamily: 'var(--fj)', fontWeight: 700, fontSize: 14,
                color: '#fff', background: 'var(--green)',
                borderRadius: 99, padding: '14px 32px',
                textDecoration: 'none',
              }}>
                Voir si je suis éligible →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          [G] FORMULAIRE — 2 ÉTAPES
      ────────────────────────────────────────────────────────────── */}
      <section
        id="candidature"
        className="sf form-sec"
        style={{
          padding: '80px 40px', background: '#fff',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{
              fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 32,
              color: 'var(--text)', marginBottom: 12, letterSpacing: '-.02em',
            }}>
              Candidater au club
            </h2>
            <p style={{ fontFamily: 'var(--fi)', fontSize: 16, color: 'var(--text-2)' }}>
              Chaque candidature est étudiée avec soin et dans l'intérêt du club et de ses membres.
            </p>
          </div>

          <div className="form-wrap" style={{
            background: '#fff', borderRadius: 20, padding: 48,
            border: '1px solid var(--border)',
            boxShadow: '0 2px 24px rgba(2,79,65,0.07)',
          }}>
            {status === 'success' ? (
              /* ── SUCCESS ── */
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div className="check-pop" style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'var(--green-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px',
                }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path
                      className="check-draw"
                      d="M6 14l6 6 10-10"
                      stroke="var(--green)" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 style={{
                  fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 22,
                  color: 'var(--text)', marginBottom: 12,
                }}>
                  Candidature reçue, {form.firstname} !
                </h3>
                <p style={{
                  fontFamily: 'var(--fi)', fontSize: 15, color: 'var(--text-2)',
                  lineHeight: 1.7, maxWidth: 400, margin: '0 auto',
                }}>
                  On examine ta candidature et on te répond sous 48h.
                  En attendant, n'hésite pas à faire passer le mot à d'autres commerciaux ambitieux.
                </p>
              </div>
            ) : (
              <>
                {/* ── STEP INDICATOR ── */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, marginBottom: 32,
                }}>
                  <div style={{
                    height: 6, borderRadius: 99,
                    background: step === 1 ? 'var(--green)' : 'var(--border)',
                    width: step === 1 ? 28 : 14,
                    transition: 'all 0.3s ease',
                  }} />
                  <div style={{
                    height: 6, borderRadius: 99,
                    background: step === 2 ? 'var(--green)' : 'var(--border)',
                    width: step === 2 ? 28 : 14,
                    transition: 'all 0.3s ease',
                  }} />
                  <span style={{
                    fontFamily: 'var(--fi)', fontSize: 12,
                    color: 'var(--text-2)', marginLeft: 8,
                  }}>
                    Étape {step}/2 — {step === 1 ? 'Ton profil' : 'Ta candidature'}
                  </span>
                </div>

                {/* ── ÉTAPE 1 ── */}
                {step === 1 && (
                  <form
                    key="step1"
                    className="step-content"
                    onSubmit={handleStep1}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                  >
                    <div className="mob-col" style={{ display: 'flex', gap: 14 }}>
                      <div style={{ flex: 1 }}>
                        <label htmlFor="firstname" style={lbl}>Prénom *</label>
                        <input
                          id="firstname" className="lp-input" required
                          value={form.firstname}
                          onChange={e => setField('firstname', e.target.value)}
                          placeholder="Jean" style={inp}
                          aria-required="true"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label htmlFor="lastname" style={lbl}>Nom *</label>
                        <input
                          id="lastname" className="lp-input" required
                          value={form.lastname}
                          onChange={e => setField('lastname', e.target.value)}
                          placeholder="Dupont" style={inp}
                          aria-required="true"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" style={lbl}>Email professionnel *</label>
                      <input
                        id="email" type="email" className="lp-input" required
                        value={form.email}
                        onChange={e => setField('email', e.target.value)}
                        placeholder="jean@entreprise.fr" style={inp}
                        aria-required="true"
                      />
                    </div>

                    <div>
                      <label htmlFor="role" style={lbl}>Rôle *</label>
                      <select
                        id="role" className="lp-input" required
                        value={form.role}
                        onChange={e => setField('role', e.target.value)}
                        style={inp} aria-required="true"
                      >
                        <option value="">Sélectionne ton rôle</option>
                        <option>SDR / BDR</option>
                        <option>Account Executive</option>
                        <option>KAM / Account Manager</option>
                        <option>Head of Sales</option>
                        <option>Agent Commercial</option>
                        <option>Indépendant / Consultant</option>
                        <option>Autre</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="xp" style={lbl}>Expérience *</label>
                      <select
                        id="xp" className="lp-input" required
                        value={form.xp}
                        onChange={e => setField('xp', e.target.value)}
                        style={inp} aria-required="true"
                      >
                        <option value="">Sélectionne ton expérience</option>
                        <option>Moins de 2 ans</option>
                        <option>2 à 5 ans</option>
                        <option>5 à 10 ans</option>
                        <option>Plus de 10 ans</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="btn-green"
                      style={{
                        width: '100%', background: 'var(--green)', color: '#fff',
                        border: 'none', borderRadius: 99, padding: 16,
                        fontFamily: 'var(--fj)', fontWeight: 700, fontSize: 16,
                        cursor: 'pointer', marginTop: 4,
                      }}
                    >
                      Continuer →
                    </button>
                  </form>
                )}

                {/* ── ÉTAPE 2 ── */}
                {step === 2 && (
                  <form
                    key="step2"
                    className="step-content"
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                  >
                    {/* Header récapitulatif */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', background: 'var(--surface)',
                      borderRadius: 12, marginBottom: 4,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'var(--green)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--fj)', fontWeight: 700, fontSize: 14, flexShrink: 0,
                      }}>
                        {form.firstname[0]?.toUpperCase() || '?'}
                      </div>
                      <span style={{ fontFamily: 'var(--fi)', fontSize: 14, color: 'var(--text)' }}>
                        Bonjour <strong>{form.firstname}</strong> ✓
                      </span>
                    </div>

                    <div>
                      <label htmlFor="phone" style={lbl}>
                        Téléphone{' '}
                        <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                          — optionnel
                        </span>
                      </label>
                      <input
                        id="phone" type="tel" className="lp-input"
                        value={form.phone}
                        onChange={e => setField('phone', e.target.value)}
                        placeholder="06 12 34 56 78" style={inp}
                      />
                    </div>

                    <div>
                      <label htmlFor="city" style={lbl}>Ville *</label>
                      <input
                        id="city" className="lp-input" required
                        value={form.city}
                        onChange={e => setField('city', e.target.value)}
                        placeholder="Paris" style={inp}
                        aria-required="true"
                      />
                    </div>

                    <div>
                      <label htmlFor="sector" style={lbl}>Secteur *</label>
                      <input
                        id="sector" className="lp-input" required
                        value={form.sector}
                        onChange={e => setField('sector', e.target.value)}
                        placeholder="Ex : SaaS B2B, Immobilier, RH..."
                        style={inp} aria-required="true"
                      />
                    </div>

                    <div>
                      <label htmlFor="why" style={lbl}>Pourquoi Nouveau Variable ? *</label>
                      <textarea
                        id="why" className="lp-input" required
                        value={form.why}
                        onChange={e => setField('why', e.target.value)}
                        placeholder="Ce que tu cherches, ce que tu apportes..."
                        rows={4} style={{ ...inp, resize: 'vertical' }}
                        aria-required="true"
                      />
                    </div>

                    {/* ── BLOC PROJETS ── */}
                    <div>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                        padding: '12px 16px',
                        background: showProjectFields ? 'var(--green-3)' : 'var(--surface)',
                        borderRadius: 12,
                        border: '1.5px solid var(--border)',
                        transition: 'background 0.2s',
                      }}>
                        <input
                          type="checkbox"
                          checked={showProjectFields}
                          onChange={e => setShowProjectFields(e.target.checked)}
                          style={{ accentColor: 'var(--green)', width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
                        />
                        <span style={{ fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                          Tu as un projet ? Dis-nous en plus !
                        </span>
                      </label>

                      {showProjectFields && (
                        <div className="step-content" style={{
                          marginTop: 12,
                          background: '#F7FAF8',
                          border: '1.5px solid #E4EEEA',
                          borderRadius: 12,
                          padding: 20,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 20,
                        }}>
                          <div>
                            <label style={lbl}>Nom du projet *</label>
                            <input
                              className="lp-input"
                              value={project.projet_nom}
                              onChange={e => setProject(p => ({ ...p, projet_nom: e.target.value }))}
                              placeholder="Ex : MyApp, ProjectX"
                              style={inp}
                              maxLength={100}
                            />
                          </div>

                          <div>
                            <label style={lbl}>
                              Site web{' '}
                              <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                                — optionnel
                              </span>
                            </label>
                            <input
                              type="url"
                              className="lp-input"
                              value={project.projet_website}
                              onChange={e => setProject(p => ({ ...p, projet_website: e.target.value }))}
                              placeholder="https://monprojet.com"
                              style={inp}
                            />
                          </div>

                          <div>
                            <label style={lbl}>Concept *</label>
                            <textarea
                              className="lp-input"
                              value={project.projet_concept}
                              onChange={e => setProject(p => ({ ...p, projet_concept: e.target.value }))}
                              placeholder="Description brève (150-500 car)"
                              rows={3}
                              style={{ ...inp, resize: 'vertical' }}
                              maxLength={500}
                            />
                          </div>

                          <div>
                            <label style={lbl}>État d&apos;avancement *</label>
                            <select
                              className="lp-input"
                              value={project.projet_avancement}
                              onChange={e => setProject(p => ({ ...p, projet_avancement: e.target.value }))}
                              style={inp}
                            >
                              <option value="">Sélectionne l&apos;état</option>
                              <option value="idee">Idée</option>
                              <option value="mvp">MVP</option>
                              <option value="lancement">Lancement</option>
                              <option value="croissance">Croissance</option>
                              <option value="mature">Mature</option>
                            </select>
                          </div>

                          <div>
                            <label style={lbl}>Besoin du moment *</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                              {([
                                { label: 'Investisseur', value: 'investisseur' },
                                { label: 'Clients',      value: 'clients'      },
                                { label: 'Partenaires',  value: 'partenaires'  },
                                { label: 'Expertise',    value: 'expertise'    },
                                { label: 'Autre',        value: 'autre'        },
                              ] as const).map(opt => (
                                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={project.projet_besoins.includes(opt.value)}
                                    onChange={e => setProject(p => ({
                                      ...p,
                                      projet_besoins: e.target.checked
                                        ? [...p.projet_besoins, opt.value]
                                        : p.projet_besoins.filter(b => b !== opt.value),
                                    }))}
                                    style={{ accentColor: 'var(--green)', width: 16, height: 16, cursor: 'pointer' }}
                                  />
                                  <span style={{ fontFamily: 'var(--fi)', fontSize: 14, color: 'var(--text)' }}>
                                    {opt.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="referral" style={lbl}>
                        Code de parrainage{' '}
                        <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                          — optionnel
                        </span>
                        {referralReadonly && (
                          <span style={{ color: 'var(--green)', marginLeft: 6 }}>✓</span>
                        )}
                      </label>
                      <input
                        id="referral" className="lp-input"
                        value={form.referral}
                        onChange={e => { if (!referralReadonly) setField('referral', e.target.value.toUpperCase()) }}
                        readOnly={referralReadonly}
                        placeholder="Tu en as un ?"
                        style={{
                          ...inp,
                          ...(referralReadonly
                            ? { background: 'var(--green-3)', color: 'var(--green)', fontWeight: 600 }
                            : {}),
                        }}
                      />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                      <input
                        type="checkbox" required
                        checked={cguAccepted}
                        onChange={e => setCguAccepted(e.target.checked)}
                        style={{ marginTop: 3, flexShrink: 0, accentColor: 'var(--green)' }}
                        aria-required="true"
                      />
                      <span style={{ fontFamily: 'var(--fi)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                        J&apos;accepte les{' '}
                        <a href="/cgu" target="_blank" rel="noopener noreferrer"
                          style={{ color: 'var(--green)', textDecoration: 'underline', fontWeight: 500 }}>
                          CGU
                        </a>
                        , les{' '}
                        <a href="/cgv" target="_blank" rel="noopener noreferrer"
                          style={{ color: 'var(--green)', textDecoration: 'underline', fontWeight: 500 }}>
                          CGV
                        </a>
                        {' '}et la{' '}
                        <a href="/confidentialite" target="_blank" rel="noopener noreferrer"
                          style={{ color: 'var(--green)', textDecoration: 'underline', fontWeight: 500 }}>
                          politique de confidentialité
                        </a>
                        {' '}de Nouveau Variable.
                      </span>
                    </label>

                    {(status === 'error' || !!errorMsg) && (
                      <div style={{
                        background: 'var(--red-2)', border: '1px solid #FECACA',
                        borderRadius: 10, padding: '12px 16px',
                        fontSize: 13, color: 'var(--red)',
                        fontFamily: 'var(--fi)',
                      }}>
                        {errorMsg || 'Une erreur est survenue. Réessaie dans quelques instants.'}
                      </div>
                    )}

                    <div
                      className="step2-btns"
                      style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', gap: 12, marginTop: 4,
                      }}
                    >
                      <button
                        type="button"
                        className="btn-ghost back-btn"
                        onClick={() => { setStep(1); setStatus('idle'); setErrorMsg('') }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontFamily: 'var(--fi)', fontSize: 14, color: 'var(--text-2)',
                          padding: '8px 0', flexShrink: 0,
                        }}
                      >
                        ← Retour
                      </button>
                      <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="btn-green"
                        style={{
                          flex: 1,
                          background: status === 'loading' ? 'var(--text-3)' : 'var(--green)',
                          color: '#fff', border: 'none', borderRadius: 99,
                          padding: '14px 24px',
                          fontFamily: 'var(--fj)', fontWeight: 700, fontSize: 15,
                          cursor: status === 'loading' ? 'wait' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                      >
                        {status === 'loading' ? (
                          <>
                            <svg className="btn-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M12 2a10 10 0 0 1 10 10" />
                            </svg>
                            Envoi en cours...
                          </>
                        ) : (
                          'Envoyer ma candidature →'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          [H] FOOTER
      ────────────────────────────────────────────────────────────── */}
      <footer style={{
        background: '#0F1C17', padding: '48px 40px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="mob-col foot-row" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 32, gap: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/icon_margin_transparent_customcolor.png" alt="NV"
                style={{ height: 32, width: 32, objectFit: 'contain' }}
                onError={e => (e.currentTarget.style.display = 'none')}
              />
              <span style={{
                fontFamily: 'var(--fj)', fontWeight: 900, fontSize: 16,
                letterSpacing: '.06em', color: '#ffffff', textTransform: 'uppercase',
              }}>
                NOUVEAU VARIABLE
              </span>
            </div>
            <p style={{ fontFamily: 'var(--fi)', fontSize: 13, color: '#9BB5AA' }}>
              Club privé · Commerciaux ambitieux · Sur candidature
            </p>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24 }}>
            <div className="mob-col foot-row" style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: 12,
            }}>
              <p style={{ fontFamily: 'var(--fi)', fontSize: 12, color: '#9BB5AA' }}>
                © 2025 Nouveau Variable
              </p>
              <div className="foot-links" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {([
                  ['Mentions légales', '/mentions-legales'],
                  ['CGU', '/cgu'],
                  ['CGV', '/cgv'],
                  ['Confidentialité', '/confidentialite'],
                  ['Cookies', '/cookies'],
                ] as const).map(([label, href]) => (
                  <a
                    key={href} href={href}
                    className="ft-link"
                    style={{
                      fontFamily: 'var(--fi)', fontSize: 12,
                      color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
                    }}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ── COOKIE BANNER ── */}
      {cookieBanner === true && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
          background: '#fff', borderTop: '1px solid var(--border)',
          padding: '16px 24px',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          gap: 12, justifyContent: 'space-between',
        }}>
          <p style={{
            fontFamily: 'var(--fi)', fontSize: 13, color: 'var(--text-2)',
            flex: 1, minWidth: 220, margin: 0,
          }}>
            🍪 Ce site utilise des cookies nécessaires à son fonctionnement.{' '}
            <a href="/cookies" style={{ color: 'var(--green)', textDecoration: 'underline', fontWeight: 500 }}>
              En savoir plus
            </a>
          </p>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button
              onClick={() => { localStorage.setItem('nv_cookie_consent', 'refused'); setCookieBanner(false) }}
              style={{
                padding: '9px 20px', borderRadius: 99,
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text-2)', fontFamily: 'var(--fi)', fontSize: 13,
                fontWeight: 500, cursor: 'pointer',
              }}
            >
              Refuser
            </button>
            <button
              onClick={() => { localStorage.setItem('nv_cookie_consent', 'accepted'); setCookieBanner(false) }}
              style={{
                padding: '9px 20px', borderRadius: 99,
                background: 'var(--green)', border: 'none',
                color: '#fff', fontFamily: 'var(--fi)', fontSize: 13,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Accepter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
