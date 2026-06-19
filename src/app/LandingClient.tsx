'use client'

import { useState, useEffect, useRef, type CSSProperties } from 'react'

function SectionGrid() {
  return <div className="section-grid" />
}

import { useMotionValueEvent } from 'framer-motion'
import { useScrollProgress } from '@/components/RevenueAnimation/hooks/useScrollHijack'
import { RevenueAnimation, USE_REVENUE_ANIMATION } from '@/components/RevenueAnimation'

const GOAL = 100

const inp: CSSProperties = {
  width: '100%', padding: '14px 16px',
  border: '1.5px solid var(--border)', borderRadius: 12,
  fontSize: 15, color: 'var(--text)', background: 'var(--white)',
  fontFamily: 'var(--font-inter), Inter, sans-serif',
  outline: 'none', transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  boxSizing: 'border-box',
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
  const [otherRole, setOtherRole] = useState('')
  const [isFormHovered, setIsFormHovered] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [codeParrain, setCodeParrain] = useState('')
  const [copied, setCopied] = useState(false)
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
    const statNumbers = document.querySelectorAll('[data-target]')
    const animatedSet = new Set<Element>()

    const animateCounter = (element: Element) => {
      if (animatedSet.has(element)) return
      animatedSet.add(element)

      const target = parseInt(element.getAttribute('data-target') || '0', 10)
      const duration = 1200
      const increment = target / (duration / 16)
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          element.textContent = String(target)
          clearInterval(timer)
        } else {
          element.textContent = String(Math.floor(current))
        }
      }, 16)
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target)
        }
      })
    }, { threshold: 0.5 })

    statNumbers.forEach((number) => {
      observer.observe(number)
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setProgressWidth(waitlistCount >= GOAL ? 100 : Math.max((waitlistCount / GOAL) * 100, 4))
    }, 400)
    return () => clearTimeout(t)
  }, [waitlistCount])


  const affSectionRef = useRef<HTMLElement>(null)
  const affTitleRef   = useRef<HTMLHeadingElement>(null)
  const affFillRef    = useRef(0)
  const affRafRef     = useRef<number>(0)

  function applyFill(pct: number) {
    const el = affTitleRef.current
    if (!el) return
    affFillRef.current = pct
    if (pct <= 0) {
      el.style.backgroundImage = 'none'
      el.style.webkitBackgroundClip = ''
      el.style.webkitTextFillColor = ''
      el.style.backgroundClip = ''
      el.style.color = 'var(--text)'
    } else {
      el.style.backgroundImage = `linear-gradient(90deg, #36a64f ${pct}%, var(--text) ${pct}%)`
      el.style.webkitBackgroundClip = 'text'
      el.style.webkitTextFillColor = 'transparent'
      el.style.backgroundClip = 'text'
      el.style.color = 'transparent'
    }
  }

  function handleAffMouseMove(e: React.MouseEvent<HTMLElement>) {
    cancelAnimationFrame(affRafRef.current)
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    applyFill(Math.max(0, Math.min(100, pct)))
  }

  function handleAffMouseLeave() {
    cancelAnimationFrame(affRafRef.current)
    function decay() {
      if (affFillRef.current <= 0) { applyFill(0); return }
      applyFill(Math.max(0, affFillRef.current - 4))
      affRafRef.current = requestAnimationFrame(decay)
    }
    affRafRef.current = requestAnimationFrame(decay)
  }

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    if (form.role === 'Autre' && !otherRole.trim()) {
      setErrorMsg('Précise ton rôle')
      return
    }
    setErrorMsg('')
    setStep(2)
  }

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
    const payload: Record<string, unknown> = {
      ...form,
      role: form.role === 'Autre' ? otherRole.trim() : form.role,
    }
    if (showProjectFields) Object.assign(payload, project)
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.code_parrain) setCodeParrain(data.code_parrain)
        setStatus('success')
        return
      }
      const data = await res.json().catch(() => ({}))
      // Préférer data.message (message lisible) ; fallback sur data.error si c'est une phrase longue (ex : rate limit)
      const userMsg = data.message
        ?? (data.error === 'already_exists' ? 'Une candidature existe déjà pour cet email.' : null)
        ?? (typeof data.error === 'string' && data.error.length > 30 ? data.error : null)
      if (userMsg) setErrorMsg(userMsg)
      setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  const isAboveGoal = waitlistCount >= GOAL

  const lbl: CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: isFormHovered ? '#36a64f' : 'var(--text-2)',
    textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6,
    fontFamily: 'var(--font-inter), Inter, sans-serif',
    transition: 'color 0.3s ease',
  }

  return (
    <div className="nv-landing">
      <style>{`
        :root {
          --fj: var(--font-inter), 'Inter', system-ui, sans-serif;
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
        .section-grid {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background:
            linear-gradient(to right, rgba(54,166,79,0.12) 0%, rgba(54,166,79,0.02) 35%, rgba(54,166,79,0.02) 65%, rgba(54,166,79,0.12) 100%),
            linear-gradient(rgba(54,166,79,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(54,166,79,0.04) 1px, transparent 1px);
          background-size: 100% 100%, 40px 40px, 40px 40px;
        }
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
            filter: blur(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
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
        .btn-green {
          transition: all 0.3s ease;
          background: #D4AF37 !important;
          color: var(--text) !important;
          border: 2px solid #D4AF37;
          font-weight: 800 !important;
          position: relative;
        }
        .btn-green:hover {
          background: #E8C547 !important;
          border-color: #D4AF37;
          box-shadow: 0 0 30px rgba(212, 175, 55, 0.6), 0 8px 24px rgba(212, 175, 55, 0.3);
          transform: translateY(-3px);
        }
        .btn-green:active {
          background: #C99A1A !important;
          transform: translateY(-1px);
        }
        .btn-green:focus {
          outline: none;
          background: #D4AF37 !important;
          box-shadow: 0 0 40px rgba(212, 175, 55, 0.8);
        }
        .tool-card { transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s; }
        .tool-card:hover {
          border-color: var(--green) !important;
          box-shadow: 0 8px 32px rgba(2,79,65,0.10) !important;
          transform: translateY(-2px);
        }
        .nav-cta {
          transition: all 0.3s ease;
          background: #D4AF37 !important;
          color: var(--text) !important;
          border: 2px solid #D4AF37;
          font-weight: 800 !important;
          position: relative;
        }
        .nav-cta:hover {
          background: #E8C547 !important;
          border-color: #D4AF37;
          box-shadow: 0 0 30px rgba(212, 175, 55, 0.6), 0 8px 24px rgba(212, 175, 55, 0.3);
          transform: translateY(-3px);
        }
        .nav-cta:focus {
          outline: none;
          background: #D4AF37 !important;
          box-shadow: 0 0 40px rgba(212, 175, 55, 0.8);
        }
        .nav-cta:active {
          background: #C99A1A !important;
          transform: translateY(-1px);
        }
        .nav-secondary {
          transition: all 0.15s ease !important;
        }
        .nav-secondary:hover {
          background: var(--green-3) !important;
          border-color: var(--green) !important;
        }
        .ft-link { transition: color 0.15s; }
        .ft-link:hover { color: var(--text) !important; }
        .btn-ghost { transition: color 0.15s; }
        .btn-ghost:hover { color: var(--text) !important; }
        /* Inter 400 pour titres et CTAs */
        .nv-landing h1, .nv-landing h2, .nv-landing h3 {
          font-family: var(--fi) !important;
          font-weight: 400 !important;
        }
        .nv-landing .btn-green, .nv-landing .nav-cta {
          font-family: var(--fi) !important;
          font-weight: 400 !important;
        }
        .steps-wrap { display: flex; align-items: flex-start; }
        .step-arrow { display: flex; align-items: center; padding-top: 14px; color: var(--green-4); font-size: 20px; flex-shrink: 0; }
        @media (max-width: 640px) {
          .mob-col   { flex-direction: column !important; }
          .mob-pad   { padding: 48px 20px !important; }
          .mob-h1    { font-size: 28px !important; line-height: 1.2 !important; }
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
          .nav-inner   { padding: 0 12px !important; height: 56px !important; gap: 6px !important; }
          .nav-inner > div:last-child { gap: 6px !important; }
          .hero-sec    { padding: 60px 20px 40px !important; }
          .sec-pad     { padding: 56px 20px !important; }
          .aff-box     { padding: 32px 20px !important; }
          .form-wrap   { padding: 32px 20px !important; }
          .form-sec    { padding: 56px 20px !important; }
          .back-btn    { margin-bottom: 8px; }
          .step2-btns  { flex-direction: column-reverse !important; }
          .animated-glow-text { color: transparent !important; }
          .hero-subtitle { display: none !important; }
          .hero-title { margin-bottom: 16px !important; }
          .nav-brand-text { display: none !important; }
          .nav-outils { display: none !important; }
          .nav-secondary { font-size: 10px !important; padding: 5px 8px !important; white-space: nowrap; border-width: 1px !important; }
          .nav-cta { font-size: 10px !important; padding: 5px 8px !important; white-space: nowrap; }
          .hero-ctas { margin-top: 40px !important; }
        }
        @media (max-width: 768px) {
          .animated-glow-text .glow-char {
            opacity: 1 !important;
            animation: none !important;
            color: #36a64f !important;
            filter: none !important;
            text-shadow: none !important;
            font-weight: 600 !important;
          }
        }
        @media (max-width: 768px) {
          .two-grid  { grid-template-columns: 1fr !important; }
          .three-grid { grid-template-columns: 1fr 1fr !important; }
          .four-grid  { grid-template-columns: 1fr 1fr !important; }
          .nav-cta { font-size: 13px !important; padding: 12px 18px !important; font-weight: 700 !important; }
          .outils-section,
          [data-page="outils"],
          .page-outils { display: none !important; }
        }
        @media (max-width: 560px) {
          .three-grid { grid-template-columns: 1fr !important; }
          .four-grid  { grid-template-columns: 1fr !important; }
        }
        .stat-source { opacity: 0; transition: opacity 0.3s ease; margin-top: auto; }
        .stat-card:hover .stat-source { opacity: 1; }
        .pricing-li { display: flex; align-items: flex-start; gap: 10px; padding: 7px 10px; border-radius: 8px; cursor: default; transition: background 0.18s ease; }
        .pricing-li:hover { background: rgba(47,84,70,0.07); }
        .pricing-li:hover .pricing-li-text { color: var(--green) !important; font-weight: 500; }
        .hero-title { margin-bottom: 32px !important; }
        .hero-subtitle { margin-top: 32px !important; margin-bottom: 40px !important; }
        .hero-ctas { margin-top: 80px !important; }
        .stats-grid .stat-card {
          opacity: 0;
          transform: translateY(30px);
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .stats-grid .stat-card:nth-child(1) {
          animation-delay: 0.2s;
        }
        .stats-grid .stat-card:nth-child(2) {
          animation-delay: 0.4s;
        }
        .stats-grid .stat-card:nth-child(3) {
          animation-delay: 0.6s;
        }

        /* ── BLUR REVEAL (réplique animation titre "À qui s'adresse") ── */
        .blur-reveal {
          filter: blur(8px) !important;
          transform: none !important;
        }
        .blur-reveal.sf-v {
          filter: blur(0px) !important;
        }
        .sf.blur-reveal {
          transition: opacity 1.1s cubic-bezier(0.16,1,0.3,1),
                      filter 1.1s cubic-bezier(0.16,1,0.3,1) !important;
        }

        /* ── TOOLS SHOWCASE — TABS ── */
        @keyframes toolFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tools-tab-bar {
          position: sticky;
          top: 64px;
          z-index: 20;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--border);
        }
        .tools-tab-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 40px;
          display: flex;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tools-tab-inner::-webkit-scrollbar { display: none; }
        .tool-tab-btn {
          padding: 16px 24px;
          border: none;
          border-bottom: 2px solid transparent;
          background: none;
          font-family: var(--fi);
          font-size: 14px;
          color: var(--text-2);
          cursor: pointer;
          white-space: nowrap;
          transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
          flex-shrink: 0;
        }
        .tool-tab-btn:hover { color: var(--text); background: var(--surface); }
        .tool-tab-btn.active {
          color: var(--green);
          border-bottom-color: var(--green);
          font-weight: 600;
        }
        .tool-content { animation: toolFadeIn 0.32s cubic-bezier(0.16,1,0.3,1); }
        .tool-img-frame {
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .tool-img-frame:hover {
          border-color: var(--green-4) !important;
          box-shadow: 0 8px 32px rgba(47,84,70,0.11) !important;
        }
        .tool-img-frame img {
          transition: transform 0.55s cubic-bezier(0.16,1,0.3,1);
          will-change: transform;
        }
        .tool-img-frame:hover img { transform: scale(1.012); }
        .tool-tag {
          transition: background 0.18s, color 0.18s, border-color 0.18s;
          cursor: default;
        }
        .tool-tag:hover {
          background: var(--green-3) !important;
          color: var(--green) !important;
          border-color: var(--green-4) !important;
        }
        /* Effets hover — affiliation cards */
        .aff-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease !important;
        }
        .aff-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 10px 28px rgba(47,84,70,0.13) !important;
        }
        @media (max-width: 768px) {
          .tools-header { padding: 48px 20px 0 !important; }
          .tools-content-area { padding: 32px 20px 56px !important; }
          .tool-tags { justify-content: flex-start !important; }
          .tool-img-frame { max-width: 100% !important; }
        }
        @media (max-width: 640px) {
          .tools-tab-bar { top: 56px; }
          .tools-tab-inner { padding: 0 12px; }
          .tool-tab-btn { padding: 12px 14px; font-size: 12px; }
          .tool-img-frame:hover img { transform: none; }
          .aff-card:hover { transform: none !important; }
          .stats-section { padding: 56px 20px !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
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
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src="/icon_margin_transparent_customcolor.png" alt="NV"
            style={{ height: 40, width: 40, objectFit: 'contain', minWidth: 40 }}
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <span style={{
            fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 12,
            letterSpacing: '.09em', color: 'var(--green)', textTransform: 'uppercase',
            display: 'none',
          }}>
            NOUVEAU VARIABLE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href="/outils" className="nav-outils" style={{
            fontFamily: 'var(--fi)', fontWeight: 500, fontSize: 14,
            color: 'var(--text-2)', textDecoration: 'none',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#36a64f')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}
          >
            Outils
          </a>
          <a href="https://app.nouveauvariable.fr/auth" className="nav-secondary" style={{
            fontFamily: 'var(--fj)', fontWeight: 600,
            color: 'var(--green)', background: 'transparent',
            border: '1.5px solid var(--green)',
            borderRadius: 99,
            textDecoration: 'none',
            fontSize: '13px',
            padding: '8px 18px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--green-3)'
            e.currentTarget.style.borderColor = 'var(--green)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'var(--green)'
          }}
          >
            Se connecter →
          </a>
          <a href="#candidature" className="nav-cta" style={{
            fontFamily: 'var(--fj)', fontWeight: 600,
            color: '#fff', background: 'var(--green)',
            borderRadius: 99,
            textDecoration: 'none',
            fontSize: '13px',
            padding: '9px 20px',
          }}>
            Candidater →
          </a>
        </div>
      </nav>

      {/* ──────────────────────────────────────────────────────────────
          [B] HERO
      ────────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', marginBottom: 0 }}>
        <SectionGrid />
        <div className="hero-sec" style={{
          padding: '120px 40px 80px', maxWidth: 1200,
          margin: '0 auto', textAlign: 'center',
          position: 'relative', zIndex: 1,
        }}>
        <h1 className="hero-el hero-el-1 mob-h1 hero-title" style={{
          fontFamily: 'var(--fj)', fontWeight: 600,
          fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.12,
          color: 'var(--text)', maxWidth: 760, margin: '0 auto',
          letterSpacing: '-.025em',
        }}>
          Pour vendre ton idée,{' '}
          <span style={{ color: '#36a64f', fontWeight: 600 }}>entoure-toi</span>{' '}
          de ceux qui savent vendre
        </h1>

        <p className="hero-el hero-el-2 hero-subtitle" style={{
          fontFamily: 'var(--fi)', fontSize: 18, fontWeight: 500,
          color: 'var(--text-2)', maxWidth: 560, margin: '24px auto 0',
          lineHeight: 1.65,
        }}>
          Le club-outil qui rassemble les idées et les talents commerciaux
        </p>

        <p className="hero-el hero-el-3" style={{
          fontFamily: 'var(--fi)', fontSize: 12, fontWeight: 500,
          color: 'var(--text-3)', letterSpacing: '.08em', margin: '16px auto 0',
          textTransform: 'uppercase', textAlign: 'center',
        }}>
          Outils{' '}<span style={{ margin: '0 6px', opacity: 0.5 }}>—</span>{' '}
          SaaS{' '}<span style={{ margin: '0 6px', opacity: 0.5 }}>—</span>{' '}
          Projets{' '}<span style={{ margin: '0 6px', opacity: 0.5 }}>—</span>{' '}
          Missions{' '}<span style={{ margin: '0 6px', opacity: 0.5 }}>—</span>{' '}
          Réseau{' '}<span style={{ margin: '0 6px', opacity: 0.5 }}>—</span>{' '}
          Affiliation
        </p>

        <div className="hero-el hero-el-4 ctas-row hero-ctas" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 16, marginTop: 40, flexWrap: 'wrap',
        }}>
          <a href="#candidature" className="btn-green" style={{
            fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 15,
            color: '#fff', background: 'var(--green)',
            borderRadius: 99, padding: '16px 36px',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(2,79,65,.18)',
            display: 'inline-block',
          }}>
            Rejoindre le club →
          </a>
          <a href="/outils" style={{
            fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 15,
            color: 'var(--green)', background: 'transparent',
            border: '1.5px solid var(--green-4)',
            borderRadius: 99, padding: '15px 36px',
            textDecoration: 'none', display: 'inline-block',
            transition: 'border-color 0.18s ease, background 0.18s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.background = 'var(--green-3)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--green-4)'; e.currentTarget.style.background = 'transparent'; }}
          >
            Explorer les outils
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

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          [C] STATS SECTION
      ────────────────────────────────────────────────────────────── */}
      <section className="sf stats-section" style={{ padding: '80px 40px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="stats-title" style={{
              fontFamily: 'var(--fi)', fontWeight: 400,
              fontSize: 'clamp(28px, 4vw, 40px)', color: 'var(--text)',
              letterSpacing: '-.02em', lineHeight: 1.2,
            }}>
              Notre raison d'exister.
            </h2>
          </div>

          <div className="stats-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28,
          }}>
            {/* Left column: 57% + 64% stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {/* Stat 1: 57% */}
              <div className="stat-card" style={{
                borderRadius: 20, padding: '40px 32px',
                display: 'flex', flexDirection: 'column', gap: 16,
                background: 'var(--white)',
                border: '1.5px solid var(--border)',
                boxShadow: '0 2px 16px rgba(47, 84, 70, 0.05)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'default', flex: 1,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(47, 84, 70, 0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 16px rgba(47, 84, 70, 0.05)';
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <div style={{
                    fontFamily: 'var(--fj)', fontWeight: 900,
                    fontSize: 'clamp(32px, 8vw, 56px)',
                    color: 'var(--green)', lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }} className="stat-number" data-target="57">0</div>
                  <span style={{
                    fontFamily: 'var(--fj)', fontWeight: 900,
                    fontSize: 'clamp(20px, 5vw, 32px)',
                    color: 'var(--green)', lineHeight: 1,
                  }}>%</span>
                </div>
                <p style={{
                  fontFamily: 'var(--fi)', fontSize: 15, fontWeight: 500,
                  color: 'var(--text)', lineHeight: 1.6, margin: 0, flexGrow: 1,
                }}>
                  57% des commerciaux citent l'instabilité des revenus comme frein majeur à une carrière commerciale
                </p>
                <p className="stat-source" style={{
                  fontFamily: 'var(--fi)', fontSize: 11,
                  color: '#9BB5AA', fontWeight: 400, letterSpacing: '0.02em', margin: 0,
                }}>Source: Pipedrive / Salesodyssey</p>
              </div>

              {/* Stat 2: 64% */}
              <div className="stat-card" style={{
                borderRadius: 20, padding: '40px 32px',
                display: 'flex', flexDirection: 'column', gap: 16,
                background: 'var(--green)',
                border: '1.5px solid var(--green-2)',
                boxShadow: '0 4px 20px rgba(47, 84, 70, 0.2)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'default', flex: 1,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(47, 84, 70, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(47, 84, 70, 0.2)';
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <div style={{
                    fontFamily: 'var(--fj)', fontWeight: 900,
                    fontSize: 'clamp(32px, 8vw, 56px)',
                    color: 'var(--white)', lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }} className="stat-number" data-target="64">0</div>
                  <span style={{
                    fontFamily: 'var(--fj)', fontWeight: 900,
                    fontSize: 'clamp(20px, 5vw, 32px)',
                    color: 'var(--white)', lineHeight: 1,
                  }}>%</span>
                </div>
                <p style={{
                  fontFamily: 'var(--fi)', fontSize: 15, fontWeight: 500,
                  color: 'var(--white)', lineHeight: 1.6, margin: 0, flexGrow: 1,
                }}>
                  64% des commerciaux sont prêts à quitter leur job pour un meilleur salaire
                </p>
                <p className="stat-source" style={{
                  fontFamily: 'var(--fi)', fontSize: 11,
                  color: 'rgba(255,255,255,0.7)', fontWeight: 400, letterSpacing: '0.02em', margin: 0,
                }}>Source: Pipedrive / Salesodyssey</p>
              </div>
            </div>

            {/* Right column: 71% tall card */}
            <div className="stat-card" style={{
              borderRadius: 20, padding: '40px 32px',
              display: 'flex', flexDirection: 'column', gap: 16,
              background: 'var(--white)',
              border: '1.5px solid var(--border)',
              boxShadow: '0 2px 16px rgba(47, 84, 70, 0.05)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'default',
              animationDelay: '0.5s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(47, 84, 70, 0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 16px rgba(47, 84, 70, 0.05)';
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <div style={{
                  fontFamily: 'var(--fj)', fontWeight: 900,
                  fontSize: 'clamp(40px, 10vw, 72px)',
                  color: 'var(--green)', lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }} className="stat-number" data-target="71">0</div>
                <span style={{
                  fontFamily: 'var(--fj)', fontWeight: 900,
                  fontSize: 'clamp(24px, 6vw, 40px)',
                  color: 'var(--green)', lineHeight: 1,
                }}>%</span>
              </div>
              <p style={{
                fontFamily: 'var(--fi)', fontSize: 16, fontWeight: 500,
                color: 'var(--text)', lineHeight: 1.7, margin: 0, flexGrow: 1,
              }}>
                des indépendants déclarent que l'instabilité des revenus mensuels les empêche d'investir dans la croissance de leur entreprise
              </p>
              <p className="stat-source" style={{
                fontFamily: 'var(--fi)', fontSize: 11,
                color: '#9BB5AA', fontWeight: 400, letterSpacing: '0.02em', margin: 0,
              }}>Source: INSEE 2025 · Nexco Portage · Co-Entreprendre</p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          [D] A QUI S'ADRESSE NV — scroll-driven sticky
      ────────────────────────────────────────────────────────────── */}
      <TargetAudienceScrollSection />

      {/* ──────────────────────────────────────────────────────────────
          [E] TOOLS SHOWCASE — tabs
      ────────────────────────────────────────────────────────────── */}
      <ToolsShowcase />

      {/* ──────────────────────────────────────────────────────────────
          [E] REVENUE ANIMATION (ou fallback outils classique)
          → Pour reverter : changer USE_REVENUE_ANIMATION = false dans
            src/components/RevenueAnimation/index.tsx
      ────────────────────────────────────────────────────────────── */}
      {USE_REVENUE_ANIMATION ? (
        <RevenueAnimation />
      ) : (
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

          <div className="four-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
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
              {
                icon: '💰',
                title: 'Side Hustle',
                badge: 'Revenus complémentaires',
                desc: "Pilote ton projet perso avec une structure pro. Roadmap, Business Model Canvas, prévisionnel — tout en un. Valide ton idée, structure ton plan et partage avec le réseau pour trouver co-fondateurs, investisseurs ou clients.",
                tag: 'Structurer ton projet',
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
                    fontFamily: 'var(--fi)', fontSize: 11, fontWeight: 600,
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

      )}

      {/* ──────────────────────────────────────────────────────────────
          [F] PRICING
      ────────────────────────────────────────────────────────────── */}
      <section className="sf" style={{ padding: '96px 40px', background: '#fff', borderTop: '1px solid var(--border)' }}>
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

          <div className="pricing-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
          }}>
            {/* Mensuel */}
            <div className="pricing-card" style={{
              borderRadius: 20, padding: '40px 36px',
              border: '1.5px solid var(--border)',
              background: '#fff',
              display: 'flex', flexDirection: 'column', gap: 0,
              transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--green-4)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(47,84,70,0.09)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <p style={{ fontFamily: 'var(--fi)', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '.1em', textTransform: 'uppercase', margin: '0 0 20px' }}>
                MENSUEL
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--fi)', fontWeight: 700, fontSize: 48, color: 'var(--text)', lineHeight: 1 }}>97</span>
                <span style={{ fontFamily: 'var(--fi)', fontWeight: 500, fontSize: 20, color: 'var(--text-2)' }}>€</span>
              </div>
              <p style={{ fontFamily: 'var(--fi)', fontSize: 13, color: 'var(--text-3)', marginBottom: 32 }}>
                par mois · résiliable à tout moment
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  'Pilote ton projet perso sans efforts',
                  'Présente-le à une communauté engagée',
                  'Crée des RDV avec les membres du club',
                  'Accède à des missions pour compléter ton salaire',
                  "Gagne des commissions sur l'apport d'affaires",
                  "Bénéficie d'outils d'aide à la vente",
                  'Accède aux événements privés',
                ].map(item => (
                  <li key={item} className="pricing-li">
                    <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span className="pricing-li-text" style={{ fontFamily: 'var(--fi)', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>{item}</span>
                  </li>
                ))}
              </ul>
              <a href="/subscribe" style={{
                display: 'block', textAlign: 'center',
                fontFamily: 'var(--fi)', fontWeight: 600, fontSize: 15,
                color: 'var(--green)', background: 'var(--green-3)',
                border: '1.5px solid var(--green-4)',
                borderRadius: 12, padding: '14px 24px',
                textDecoration: 'none',
                transition: 'background 0.18s ease, border-color 0.18s ease',
                marginTop: 'auto',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--green-4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--green-3)'; }}
              >
                Commencer maintenant →
              </a>
            </div>

            {/* Annuel */}
            <div className="pricing-card" style={{
              borderRadius: 20, padding: '40px 36px',
              border: '2px solid var(--green)',
              background: '#fff',
              display: 'flex', flexDirection: 'column', gap: 0,
              position: 'relative',
              boxShadow: '0 4px 24px rgba(47,84,70,0.10)',
              transition: 'box-shadow 0.25s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(47,84,70,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(47,84,70,0.10)'; }}>
              <div style={{
                position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                background: 'var(--green)', color: '#fff',
                fontFamily: 'var(--fi)', fontSize: 11, fontWeight: 600,
                letterSpacing: '.06em', textTransform: 'uppercase',
                borderRadius: 99, padding: '5px 16px', whiteSpace: 'nowrap',
              }}>
                Meilleure offre
              </div>
              <p style={{ fontFamily: 'var(--fi)', fontSize: 11, fontWeight: 600, color: 'var(--green)', letterSpacing: '.1em', textTransform: 'uppercase', margin: '0 0 20px' }}>
                ANNUEL
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--fi)', fontWeight: 700, fontSize: 48, color: 'var(--text)', lineHeight: 1 }}>899</span>
                <span style={{ fontFamily: 'var(--fi)', fontWeight: 500, fontSize: 20, color: 'var(--text-2)' }}>€</span>
              </div>
              <p style={{ fontFamily: 'var(--fi)', fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>
                par an
              </p>
              <p style={{ fontFamily: 'var(--fi)', fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 32 }}>
                soit 74,92 €/mois · Économise 265 €
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  'Pilote ton projet perso sans efforts',
                  'Présente-le à une communauté engagée',
                  'Crée des RDV avec les membres du club',
                  'Accède à des missions pour compléter ton salaire',
                  "Gagne des commissions sur l'apport d'affaires",
                  "Bénéficie d'outils d'aide à la vente",
                  'Accède aux événements privés',
                ].map(item => (
                  <li key={item} className="pricing-li">
                    <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span className="pricing-li-text" style={{ fontFamily: 'var(--fi)', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>{item}</span>
                  </li>
                ))}
              </ul>
              <a href="/subscribe" style={{
                display: 'block', textAlign: 'center',
                fontFamily: 'var(--fi)', fontWeight: 600, fontSize: 15,
                color: '#fff', background: 'var(--green)',
                borderRadius: 12, padding: '14px 24px',
                textDecoration: 'none',
                transition: 'background 0.18s ease',
                marginTop: 'auto',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--green-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--green)'; }}
              >
                Choisir l'annuel →
              </a>
            </div>
          </div>

          <p style={{
            textAlign: 'center', fontFamily: 'var(--fi)', fontSize: 12,
            color: 'var(--text-3)', marginTop: 28, lineHeight: 1.8,
          }}>
            Paiement sécurisé par Stripe · Sans engagement pour le mensuel<br />
            * Lien d'affiliation actif même après expiration de l'abonnement
          </p>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          [G] AFFILIATION
      ────────────────────────────────────────────────────────────── */}
      <section ref={affSectionRef} className="sf sec-pad" style={{ padding: '80px 40px', background: 'var(--surface)', position: 'relative' }} onMouseMove={handleAffMouseMove} onMouseLeave={handleAffMouseLeave}>
        <SectionGrid />
        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="aff-box" style={{
            background: 'var(--green-3)', borderRadius: 24, padding: '48px',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 ref={affTitleRef} className="aff-title-fill" style={{
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
                <div key={m.label} className="aff-card" style={{
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
                    fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 15,
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
                fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 14,
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
          [H] FORMULAIRE — 2 ÉTAPES
      ────────────────────────────────────────────────────────────── */}
      <section
        id="candidature"
        className="sf form-sec"
        style={{
          padding: '80px 40px', background: '#fff',
          borderTop: '1px solid var(--border)',
          position: 'relative',
        }}
      >
        <SectionGrid />
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
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

          <div
            className="form-wrap"
            onMouseEnter={() => setIsFormHovered(true)}
            onMouseLeave={() => setIsFormHovered(false)}
            style={{
              background: '#fff', borderRadius: 20, padding: 48,
              border: `1.5px solid ${isFormHovered ? '#36a64f' : 'var(--border)'}`,
              boxShadow: isFormHovered
                ? '0 8px 24px rgba(54,166,79,0.15)'
                : '0 2px 24px rgba(2,79,65,0.07)',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            }}
          >
            {status === 'success' ? (
              /* ── SUCCESS ── */
              <div style={{ textAlign: 'center', padding: '32px 0 8px' }}>
                <div className="check-pop" style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'var(--green-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
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
                  color: 'var(--text)', marginBottom: 10,
                }}>
                  Candidature reçue, {form.firstname} !
                </h3>
                <p style={{
                  fontFamily: 'var(--fi)', fontSize: 15, color: 'var(--text-2)',
                  lineHeight: 1.7, maxWidth: 400, margin: '0 auto 28px',
                }}>
                  On examine ta candidature et on te répond sous 48h.
                </p>

                {codeParrain && (
                  <div style={{
                    background: 'var(--green-3)', borderRadius: 16,
                    padding: '24px 20px', textAlign: 'left',
                  }}>
                    <p style={{
                      fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 14,
                      color: 'var(--green)', marginBottom: 4,
                    }}>
                      Pendant ce temps, partage ton lien d&apos;affiliation :
                    </p>
                    <p style={{
                      fontFamily: 'var(--fi)', fontSize: 12, color: 'var(--text-2)',
                      marginBottom: 16, lineHeight: 1.5,
                    }}>
                      Chaque membre que tu parraines te rapporte une commission mensuelle récurrente.
                    </p>

                    <div style={{
                      background: '#fff', borderRadius: 10,
                      border: '1.5px solid var(--border-2)',
                      padding: '10px 14px', marginBottom: 10,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{
                        fontFamily: 'var(--fi)', fontSize: 13, color: 'var(--text)',
                        flex: 1, wordBreak: 'break-all',
                      }}>
                        nouveauvariable.fr?ref={codeParrain}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://nouveauvariable.fr?ref=${codeParrain}`)
                          .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) })
                          .catch(() => null)
                      }}
                      style={{
                        width: '100%', background: copied ? 'var(--green-4)' : 'var(--green)',
                        color: '#fff', border: 'none', borderRadius: 99,
                        padding: '12px 20px',
                        fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 14,
                        cursor: 'pointer', transition: 'background 0.2s',
                      }}
                    >
                      {copied ? '✓ Lien copié !' : 'Copier mon lien d\'affiliation'}
                    </button>

                    <p style={{
                      fontFamily: 'var(--fi)', fontSize: 11, color: 'var(--text-3)',
                      textAlign: 'center', marginTop: 10,
                    }}>
                      Ton code : <strong style={{ color: 'var(--green)', letterSpacing: '.05em' }}>{codeParrain}</strong>
                    </p>
                  </div>
                )}
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

                    {form.role === 'Autre' && (
                      <div>
                        <label style={lbl}>Précise ton rôle *</label>
                        <input
                          type="text"
                          className="lp-input"
                          value={otherRole}
                          onChange={e => setOtherRole(e.target.value)}
                          placeholder="ex : Consultant, Manager commercial…"
                          maxLength={100}
                          style={inp}
                        />
                      </div>
                    )}

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
                        fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 16,
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
                        fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 14, flexShrink: 0,
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <label
                        htmlFor="project-toggle"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                          padding: '14px 18px',
                          background: showProjectFields ? '#EAF2EE' : '#F7FAF8',
                          borderRadius: showProjectFields ? '12px 12px 0 0' : 12,
                          border: '1.5px solid #E4EEEA',
                          borderBottom: showProjectFields ? 'none' : '1.5px solid #E4EEEA',
                          transition: 'background 0.25s, border-radius 0.15s',
                          userSelect: 'none',
                        }}
                      >
                        <input
                          id="project-toggle"
                          type="checkbox"
                          checked={showProjectFields}
                          onChange={e => setShowProjectFields(e.target.checked)}
                          style={{ accentColor: '#2F5446', width: 17, height: 17, flexShrink: 0, cursor: 'pointer', margin: 0 }}
                        />
                        <span style={{ fontFamily: 'var(--fi)', fontWeight: 600, fontSize: 14, color: '#0F1C17' }}>
                          Tu as un projet ? Dis-nous en plus !
                        </span>
                        <span style={{
                          marginLeft: 'auto', fontSize: 12, color: '#4B6358',
                          transition: 'transform 0.2s',
                          transform: showProjectFields ? 'rotate(180deg)' : 'rotate(0deg)',
                          display: 'inline-block',
                        }}>▾</span>
                      </label>

                      {showProjectFields && (
                        <div style={{
                          background: '#F7FAF8',
                          border: '1.5px solid #E4EEEA',
                          borderTop: 'none',
                          borderRadius: '0 0 12px 12px',
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
                              <span style={{ color: '#8FAAA0', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
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
                              placeholder="Décris ton projet en quelques lignes (min. 10 car.)"
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
                              {[
                                { label: 'Investisseur', value: 'investisseur' },
                                { label: 'Clients',      value: 'clients'      },
                                { label: 'Partenaires',  value: 'partenaires'  },
                                { label: 'Expertise',    value: 'expertise'    },
                                { label: 'Autre',        value: 'autre'        },
                              ].map(opt => (
                                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={project.projet_besoins.includes(opt.value)}
                                    onChange={e => {
                                      const v = opt.value
                                      setProject(p => ({
                                        ...p,
                                        projet_besoins: e.target.checked
                                          ? [...p.projet_besoins, v]
                                          : p.projet_besoins.filter(b => b !== v),
                                      }))
                                    }}
                                    style={{ accentColor: '#2F5446', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                                  />
                                  <span style={{ fontFamily: 'var(--fi)', fontSize: 14, color: '#0F1C17' }}>
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
                          fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 15,
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
          [I] FOOTER
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
                fontFamily: 'var(--fj)', fontWeight: 600, fontSize: 16,
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

const TOOLS = [
  {
    img: '/screens/Projets.png',
    title: 'Projets',
    description: "Filtre les projets du réseau selon le besoin exact — associé, investisseur, clients pilotes, partenaire, talent ou prestataire.",
    tags: ["Associé·e", "Investisseur", "Clients pilotes"],
    wrapperStyle: undefined as React.CSSProperties | undefined,
  },
  {
    img: '/screens/RDV.png',
    title: 'RDV & Networking',
    description: "Choisis ton format de rencontre avec un membre — visio, téléphone, café ou autre. Tu envoies la demande, il confirme.",
    tags: ['Visio', 'Téléphone', 'Café'],
    wrapperStyle: { maxWidth: '52%', margin: '0 auto' } as React.CSSProperties,
  },
  {
    img: '/screens/SideHustle.png',
    title: 'Side Hustle',
    description: "Lance ton projet sans t'éparpiller. Planifie tes étapes, valide ton modèle économique et projette tes revenus — le tout dans un espace dédié, pensé pour avancer vite.",
    tags: ['Roadmap', 'Prévisionnel', 'BMC'],
    wrapperStyle: undefined as React.CSSProperties | undefined,
  },
  {
    img: '/screens/KA2.png',
    title: 'Key Account',
    description: "Tu es commercial B2B et tu manques de visibilité sur tes comptes clés ? Key Account te donne une vue complète sur chaque deal — qui décide, qui bloque, qui influence — pour closer plus vite.",
    tags: ['MEDDICC', 'Cartographie', 'Parties prenantes'],
    wrapperStyle: { maxWidth: '440px', margin: '0 auto' } as React.CSSProperties,
  },
  {
    img: '/screens/Missions.png',
    title: 'Missions',
    description: "Filtre les missions disponibles par catégorie — Closing, Apport d'affaires, Freelance, Conseil, Formation, Affiliation et plus.",
    tags: ['Closing', "Apport d'affaires", 'Freelance'],
    wrapperStyle: undefined as React.CSSProperties | undefined,
  },
]

const imgFrame: React.CSSProperties = {
  borderRadius: 14, overflow: 'hidden',
  border: '1.5px solid var(--border)',
  background: 'var(--surface)',
  boxShadow: '0 2px 16px rgba(47,84,70,0.06)',
}

function ToolsShowcase() {
  const [active, setActive] = useState(0)
  const tool = TOOLS[active]

  return (
    <section className="sf" style={{ background: '#fff', borderTop: '1px solid var(--border)' }}>

      {/* Header */}
      <div className="sf blur-reveal tools-header" style={{ textAlign: 'center', padding: '72px 40px 0' }}>
        <h2 style={{
          fontFamily: 'var(--fi)', fontWeight: 400,
          fontSize: 'clamp(24px, 3.5vw, 40px)', color: 'var(--text)',
          letterSpacing: '-.02em', marginBottom: 12,
        }}>
          As-tu déjà vu tout ça… au même endroit ?
        </h2>
        <p style={{
          fontFamily: 'var(--fi)', fontSize: 16, color: 'var(--text-2)',
          maxWidth: 480, margin: '0 auto', lineHeight: 1.7,
        }}>
          Un écosystème pensé pour ceux qui doivent vendre pour vivre :{' '}
          <span style={{ color: '#36a64f', fontWeight: 600 }}>commerciaux</span>
          {' '}&amp;{' '}
          <span style={{ color: '#36a64f', fontWeight: 600 }}>entrepreneurs</span>.
        </p>
      </div>

      {/* Tab bar — sticky sous la navbar */}
      <div className="tools-tab-bar" style={{ marginTop: 40 }}>
        <div className="tools-tab-inner">
          {TOOLS.map((t, i) => (
            <button
              key={t.title}
              className={`tool-tab-btn${active === i ? ' active' : ''}`}
              onClick={() => setActive(i)}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu — crossfade à chaque changement d'onglet */}
      <div className="tools-content-area" style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 40px 80px' }}>
        <div key={active} className="tool-content">

          {/* Screenshot */}
          <div className="tool-img-frame" style={{ ...imgFrame, ...(tool.wrapperStyle ?? {}) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tool.img}
              alt={tool.title}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          {/* Description + tags */}
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', gap: 32, marginTop: 28,
            flexWrap: 'wrap',
          }}>
            <p style={{
              fontFamily: 'var(--fi)', fontSize: 15, color: 'var(--text-2)',
              lineHeight: 1.75, margin: 0, maxWidth: 580,
            }}>
              {tool.description}
            </p>
            <div className="tool-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
              {tool.tags.map(tag => (
                <span key={tag} className="tool-tag" style={{
                  display: 'inline-block', padding: '6px 14px',
                  borderRadius: 99, fontSize: 12, fontWeight: 500,
                  background: 'var(--surface)', color: 'var(--text-2)',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--fi)',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

const TARGET_AUDIENCE = [
  {
    title: 'Professionnels de la vente',
    description: 'qui souhaitent se créer des revenus additionnels à côté de leur emploi',
  },
  {
    title: 'Entrepreneurs',
    description: 'souhaitant développer leur réseau, faire connaître leurs activités et générer des ventes via le réseau commercial NV',
  },
  {
    title: 'Commerciaux',
    description: 'souhaitant découvrir de nouveaux outils et faire un bond dans leur propre métier',
  },
]

function TargetAudienceScrollSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef     = useRef<HTMLDivElement>(null)
  const cardRefs     = useRef<(HTMLDivElement | null)[]>([null, null, null])
  const [hovered, setHovered] = useState<number | null>(null)

  const progress = useScrollProgress(containerRef)

  useMotionValueEvent(progress, 'change', (p) => {
    const clamp = (v: number) => Math.min(1, Math.max(0, v))

    // Title: fade + blur  p=0.05 → 0.22
    const t = titleRef.current
    if (t) {
      const op = clamp((p - 0.05) / 0.17)
      const bl = (1 - op) * 8
      t.style.opacity = String(op)
      t.style.filter  = `blur(${bl.toFixed(1)}px)`
    }

    // Card 1: fade  p=0.25 → 0.40
    const c0 = cardRefs.current[0]
    if (c0) {
      const op = clamp((p - 0.25) / 0.15)
      c0.style.opacity = String(op)
    }

    // Card 2: slide from right  p=0.47 → 0.62
    const c1 = cardRefs.current[1]
    if (c1) {
      const op = clamp((p - 0.47) / 0.15)
      const tx = (1 - op) * 60
      c1.style.opacity   = String(op)
      c1.style.transform = `translateX(${tx.toFixed(1)}px)`
    }

    // Card 3: slide from right  p=0.68 → 0.83
    const c2 = cardRefs.current[2]
    if (c2) {
      const op = clamp((p - 0.68) / 0.15)
      const tx = (1 - op) * 60
      c2.style.opacity   = String(op)
      c2.style.transform = `translateX(${tx.toFixed(1)}px)`
    }
  })

  return (
    <div
      ref={containerRef}
      style={{
        height: '360vh', position: 'relative',
        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{
        position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
        background: '#fff', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '0 40px',
      }}>
        <SectionGrid />
        <div style={{ maxWidth: 1100, width: '100%' }}>

          {/* Title block */}
          <div ref={titleRef} style={{ textAlign: 'center', marginBottom: 52, opacity: 0 }}>
            <h2 style={{
              fontFamily: 'var(--fi)', fontWeight: 600,
              fontSize: 'clamp(22px, 3.5vw, 36px)', color: 'var(--text)',
              letterSpacing: '-.02em', marginBottom: 12,
            }}>
              À qui s&apos;adresse Nouveau Variable ?
            </h2>
            <p style={{
              fontFamily: 'var(--fi)', fontSize: 16, color: 'var(--text-2)',
              maxWidth: 580, margin: '0 auto',
            }}>
              Nouveau Variable s&apos;adresse à 3 profils qui veulent créer de la valeur, progresser et transformer leurs revenus.
            </p>
          </div>

          {/* Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {TARGET_AUDIENCE.map((item, idx) => (
              // Outer div: scroll-driven opacity/transform (manipulated via ref)
              // Inner div: hover effect (React state)
              <div key={idx} ref={el => { cardRefs.current[idx] = el }} style={{ opacity: 0 }}>
                <div
                  onMouseEnter={() => setHovered(idx)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: '#fff',
                    border: `1px solid ${hovered === idx ? '#36a64f' : 'var(--border)'}`,
                    borderRadius: 12,
                    padding: '28px 24px',
                    minHeight: 180,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    cursor: 'default',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                    transform: hovered === idx ? 'translateY(-8px)' : 'translateY(0)',
                    boxShadow: hovered === idx
                      ? '0 12px 32px rgba(47,84,70,0.12)'
                      : '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <h3 style={{
                    fontFamily: 'var(--fi)', fontSize: 16, fontWeight: 600,
                    color: hovered === idx ? '#36a64f' : 'var(--text)',
                    marginBottom: 10, lineHeight: 1.4,
                    transition: 'color 0.3s ease',
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontFamily: 'var(--fi)', fontSize: 14, fontWeight: 400,
                    color: 'var(--text-2)', lineHeight: 1.65, margin: 0,
                  }}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
