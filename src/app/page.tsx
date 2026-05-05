'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

const BG     = '#0F1C17'
const CARD   = '#1A2E26'
const GREEN  = '#2F5446'
const GREEN2 = '#3D6B58'
const GREEN3 = '#EAF2EE'
const SUBTLE = '#C5DDD5'
const TEXT2  = '#4B6358'
const AMBER  = '#C8790A'
const WHITE  = '#ffffff'

const COUNTER_TARGETS  = [1000, 38, 97]
const COUNTER_LABELS   = ['Places max', '% revenus +', 'NPS moyen']
const COUNTER_SUFFIXES = ['', '%', '']

const PILLARS = [
  { icon: '⚡', title: 'Outils IA',    desc: "Scripts d'appel, cartographie deals, sales rooms. Des outils pensés pour le terrain.", dir: 'left'   },
  { icon: '🤝', title: 'Réseau',        desc: '1 000 commerciaux triés sur le volet. Des connexions qui valent le déplacement.',         dir: 'top'    },
  { icon: '🎯', title: 'Opportunités',  desc: 'Missions, projets, deals croisés. Ce qui circule ici ne se trouve pas ailleurs.',          dir: 'bottom' },
  { icon: '🗓', title: 'Évènements',    desc: 'Masterclasses, meetups, sessions de vente live. Apprendre en faisant.',                    dir: 'right'  },
]

type AuthStep = 'phone' | 'otp' | 'referral'
type TwPhase  = 'idle' | 'typing-nouveau' | 'pause' | 'backspace' | 'typing-variable' | 'done'

export default function LandingPage() {
  return <Suspense><LandingInner /></Suspense>
}

function LandingInner() {
  const router      = useRouter()
  const params      = useSearchParams()
  const supabase    = createClient()

  // ── mount / mobile ──────────────────────────────────────────────
  const [mounted,  setMounted]  = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // ── loader ──────────────────────────────────────────────────────
  const [loaderDone,    setLoaderDone]    = useState(false)
  const [loaderVisible, setLoaderVisible] = useState(true)

  // ── nav ─────────────────────────────────────────────────────────
  const [navBlur, setNavBlur] = useState(false)

  // ── hero ────────────────────────────────────────────────────────
  const heroWrapRef  = useRef<HTMLDivElement>(null)
  const [heroP, setHeroP] = useState(0)

  // ── cursor ──────────────────────────────────────────────────────
  const cursorRef = useRef<HTMLDivElement>(null)
  const cur       = useRef({ x: -100, y: -100, tx: 0, ty: 0, sz: 20 })

  // ── sections ─────────────────────────────────────────────────────
  const pilarRef   = useRef<HTMLDivElement>(null)
  const clubRef    = useRef<HTMLDivElement>(null)
  const twRef      = useRef<HTMLDivElement>(null)
  const [pilarIn,   setPilarIn]   = useState(false)
  const [counters,  setCounters]  = useState([0, 0, 0])
  const [cStarted,  setCStarted]  = useState(false)
  const [twPhase,   setTwPhase]   = useState<TwPhase>('idle')
  const [twText,    setTwText]    = useState('')
  const [sparkOn,   setSparkOn]   = useState(false)

  // ── auth ─────────────────────────────────────────────────────────
  const [step,         setStep]         = useState<AuthStep>('phone')
  const [phone,        setPhone]        = useState('')
  const [otp,          setOtp]          = useState(['','','','','',''])
  const [refCode,      setRefCode]      = useState(params.get('ref') ?? '')
  const [refValid,     setRefValid]     = useState(false)
  const [refId,        setRefId]        = useState('')
  const [aLoading,     setALoading]     = useState(false)
  const [aError,       setAError]       = useState('')
  const [countdown,    setCountdown]    = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // ── mount ───────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true)
    const mobile = window.innerWidth < 768
    setIsMobile(mobile)
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize, { passive: true })

    // auth check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push('/dashboard')
    })

    // loader
    try {
      if (sessionStorage.getItem('nv-loaded')) {
        setLoaderVisible(false)
        setLoaderDone(true)
      } else {
        setTimeout(() => {
          setLoaderDone(true)
          setTimeout(() => {
            setLoaderVisible(false)
            try { sessionStorage.setItem('nv-loaded', '1') } catch {}
          }, 700)
        }, 600)
      }
    } catch {
      setLoaderVisible(false)
      setLoaderDone(true)
    }

    // sparkline
    setTimeout(() => setSparkOn(true), 1400)

    // referral from url
    const ref = params.get('ref')
    if (ref) validateRefSilent(ref)

    return () => window.removeEventListener('resize', onResize)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── scroll ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return
    const onScroll = () => {
      setNavBlur(window.scrollY > 20)
      if (!isMobile && heroWrapRef.current) {
        const rect = heroWrapRef.current.getBoundingClientRect()
        setHeroP(Math.max(0, Math.min(1, -rect.top / (2 * window.innerHeight))))
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [mounted, isMobile])

  // ── cursor ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || isMobile) return
    let animId: number
    const c = cur.current
    const tick = () => {
      c.x += (c.tx - c.x) * 0.12
      c.y += (c.ty - c.y) * 0.12
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${c.x - c.sz / 2}px,${c.y - c.sz / 2}px)`
        cursorRef.current.style.width  = `${c.sz}px`
        cursorRef.current.style.height = `${c.sz}px`
      }
      animId = requestAnimationFrame(tick)
    }
    const onMove = (e: MouseEvent) => { c.tx = e.clientX; c.ty = e.clientY }
    document.addEventListener('mousemove', onMove, { passive: true })
    animId = requestAnimationFrame(tick)
    const grow  = () => { c.sz = 40 }
    const shrink = () => { c.sz = 20 }
    document.querySelectorAll('button,a').forEach(el => {
      el.addEventListener('mouseenter', grow)
      el.addEventListener('mouseleave', shrink)
    })
    return () => { cancelAnimationFrame(animId); document.removeEventListener('mousemove', onMove) }
  }, [mounted, isMobile])

  // ── pillars IntersectionObserver ─────────────────────────────────
  useEffect(() => {
    if (!pilarRef.current) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setPilarIn(true); obs.disconnect() } }, { threshold: 0.2 })
    obs.observe(pilarRef.current)
    return () => obs.disconnect()
  }, [])

  // ── counters IntersectionObserver ────────────────────────────────
  useEffect(() => {
    if (!clubRef.current) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !cStarted) {
        setCStarted(true); obs.disconnect()
        const t0 = Date.now(), dur = 1800
        const tick = () => {
          const t = Math.min(1, (Date.now() - t0) / dur)
          const ease = 1 - Math.pow(1 - t, 3)
          setCounters(COUNTER_TARGETS.map(v => Math.round(v * ease)))
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    obs.observe(clubRef.current)
    return () => obs.disconnect()
  }, [cStarted])

  // ── typewriter IntersectionObserver ──────────────────────────────
  useEffect(() => {
    if (!twRef.current || twPhase !== 'idle') return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTwPhase('typing-nouveau'); obs.disconnect() }
    }, { threshold: 0.3 })
    obs.observe(twRef.current)
    return () => obs.disconnect()
  }, [twPhase])

  useEffect(() => {
    if (twPhase === 'idle') return
    const NOUVEAU  = 'Nouveau'
    const VARIABLE = 'Variable'

    if (twPhase === 'typing-nouveau') {
      let i = 0
      const iv = setInterval(() => { i++; setTwText(NOUVEAU.slice(0, i)); if (i >= NOUVEAU.length) { clearInterval(iv); setTimeout(() => setTwPhase('pause'), 600) } }, 80)
      return () => clearInterval(iv)
    }
    if (twPhase === 'pause') {
      const t = setTimeout(() => setTwPhase('backspace'), 1500)
      return () => clearTimeout(t)
    }
    if (twPhase === 'backspace') {
      let s = NOUVEAU
      const iv = setInterval(() => { s = s.slice(0, -1); setTwText(s); if (!s) { clearInterval(iv); setTwPhase('typing-variable') } }, 50)
      return () => clearInterval(iv)
    }
    if (twPhase === 'typing-variable') {
      let i = 0
      const iv = setInterval(() => { i++; setTwText(VARIABLE.slice(0, i)); if (i >= VARIABLE.length) { clearInterval(iv); setTwPhase('done') } }, 80)
      return () => clearInterval(iv)
    }
  }, [twPhase])

  // ── countdown ───────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // ── auth helpers ─────────────────────────────────────────────────
  async function validateRefSilent(code: string) {
    const { data } = await supabase.from('profiles').select('id').eq('referral_code', code.toUpperCase()).single()
    if (data) { setRefValid(true); setRefId(data.id) }
  }

  function fmtPhone(raw: string) {
    const d = raw.replace(/\D/g, '')
    if (d.startsWith('0') && d.length === 10) return '+33' + d.slice(1)
    if (d.startsWith('33')) return '+' + d
    return '+' + d
  }

  async function sendOtp() {
    setAError('')
    const f = fmtPhone(phone)
    if (f.length < 10) { setAError('Numéro invalide. Format : 06 12 34 56 78'); return }
    setALoading(true)
    const { error: e } = await supabase.auth.signInWithOtp({ phone: f })
    setALoading(false)
    if (e) { setAError("Impossible d'envoyer le SMS : " + e.message); return }
    setStep('otp'); setCountdown(60)
    setTimeout(() => otpRefs.current[0]?.focus(), 100)
  }

  function handleOtpChange(i: number, v: string) {
    if (!/^\d*$/.test(v)) return
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n)
    if (v && i < 5) otpRefs.current[i + 1]?.focus()
    if (n.every(d => d)) verifyOtp(n.join(''))
  }

  function handleOtpKey(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  async function verifyOtp(code?: string) {
    const token = code || otp.join('')
    if (token.length < 6) { setAError('Code incomplet.'); return }
    setAError(''); setALoading(true)
    const { data, error: e } = await supabase.auth.verifyOtp({ phone: fmtPhone(phone), token, type: 'sms' })
    if (e || !data.user) {
      setALoading(false); setOtp(['','','','','',''])
      setAError('Code incorrect ou expiré.'); otpRefs.current[0]?.focus(); return
    }
    const { data: prof } = await supabase.from('profiles').select('id,onboarding_completed').eq('id', data.user.id).single()
    setALoading(false)
    if (prof?.onboarding_completed) { router.push('/dashboard'); router.refresh() } else setStep('referral')
  }

  async function validateAndCreate() {
    setAError('')
    if (!refValid) { setAError('Code parrain obligatoire pour accéder au club.'); return }
    setALoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAError('Session expirée. Recommence.'); setALoading(false); return }
    const code = 'NV' + Math.random().toString(36).slice(2, 6).toUpperCase()
    const { error: pe } = await supabase.from('profiles').upsert({
      id: user.id, phone: user.phone, email: user.email ?? '',
      first_name: '', last_name: '', referral_code: code,
      referred_by: refId || null, points_balance: 97, is_active: true, onboarding_completed: true,
    })
    if (pe) { setAError('Erreur création profil : ' + pe.message); setALoading(false); return }
    if (refId) {
      await supabase.from('referrals').upsert({ referrer_id: refId, referee_id: user.id, level: 1, commission_rate: 40, is_active: true }, { onConflict: 'referrer_id,referee_id' })
      const { data: gp } = await supabase.from('referrals').select('referrer_id').eq('referee_id', refId).eq('level', 1).single()
      if (gp) await supabase.from('referrals').upsert({ referrer_id: gp.referrer_id, referee_id: user.id, level: 2, commission_rate: 5, is_active: true }, { onConflict: 'referrer_id,referee_id' })
    }
    setALoading(false); router.push('/dashboard'); router.refresh()
  }

  // ── hero computed values ──────────────────────────────────────────
  const p = isMobile ? 1 : heroP
  let heroScale = 1, heroSpacing = '0em', heroOpacity = 1, subOpacity = 0, ctaOpacity = 0

  if (p < 0.3) {
    heroScale = 1; heroSpacing = '0em'
  } else if (p < 0.6) {
    const t = (p - 0.3) / 0.3
    heroScale = 1 + t * 0.4; heroSpacing = `${t * 0.04}em`
  } else if (p < 0.8) {
    const t = (p - 0.6) / 0.2
    heroScale = 1.4 - t * 0.6; heroSpacing = `${(1 - t) * 0.04}em`; heroOpacity = 1 - t
  } else {
    heroScale = 0.8; heroOpacity = 0
    const t = (p - 0.8) / 0.2
    subOpacity = Math.min(1, t * 1.5); ctaOpacity = Math.max(0, (t - 0.2) / 0.8)
  }

  // ── input style helper ─────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    background: BG, border: '1px solid rgba(197,221,213,0.2)',
    borderRadius: 12, fontSize: 15, color: WHITE,
    fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color .2s',
  }
  const btn: React.CSSProperties = {
    width: '100%', padding: '14px', background: GREEN, color: WHITE,
    border: 'none', borderRadius: 99, fontFamily: 'Jost, sans-serif',
    fontWeight: 800, fontSize: 15, cursor: aLoading ? 'wait' : 'pointer', transition: 'background .2s',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ${mounted && !isMobile ? 'html{cursor:none}button,a{cursor:none}' : ''}
        @keyframes wordIn{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:none}}
        @keyframes loaderIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
        @keyframes loaderOut{from{transform:translateY(0)}to{transform:translateY(-100%)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes sparkDraw{from{stroke-dashoffset:185}to{stroke-dashoffset:0}}
        .word{display:inline-block;opacity:0;animation:wordIn .5s ease-out forwards}
        .spark{stroke-dasharray:185;animation:sparkDraw 1.4s ease-out forwards}
        .pill{background:#1A2E26;border:1px solid rgba(197,221,213,0.15);border-radius:16px;transition:border-color .25s,transform .25s,box-shadow .25s}
        .pill:hover{border-color:#2F5446!important;transform:translateY(-4px);box-shadow:0 0 24px rgba(47,84,70,.12)}
        .tw-cur{animation:blink .8s infinite;font-family:'Courier Prime',monospace}
        @media(max-width:767px){
          .hero-h1{font-size:clamp(34px,11vw,56px)!important}
          .pg{grid-template-columns:1fr 1fr!important}
          .hero-wrap{height:auto!important}
          .hero-sticky{position:relative!important;height:auto!important;padding:80px 20px 60px!important}
        }
      `}</style>

      {/* Entry loader */}
      {loaderVisible && (
        <div style={{
          position:'fixed',inset:0,zIndex:9999,background:BG,display:'grid',placeItems:'center',
          animation: loaderDone ? 'loaderOut .6s ease-in .1s forwards' : undefined,
        }}>
          <img src="/nv-logo-black.png" alt="NV" style={{height:52,opacity:.9,animation:'loaderIn .5s ease-out forwards'}}
            onError={e => (e.currentTarget.style.display='none')} />
        </div>
      )}

      {/* Custom cursor — desktop only */}
      {mounted && !isMobile && (
        <div ref={cursorRef} style={{
          position:'fixed',top:0,left:0,pointerEvents:'none',zIndex:9998,
          width:20,height:20,border:`1.5px solid ${GREEN}`,borderRadius:'50%',
          transition:'width .18s,height .18s',
        }}/>
      )}

      <div style={{background:BG,color:WHITE,minHeight:'100vh',position:'relative',overflowX:'hidden'}}>

        {/* Dot grid */}
        <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,
          backgroundImage:'radial-gradient(circle,rgba(255,255,255,.04) 1px,transparent 1px)',
          backgroundSize:'28px 28px'}}/>

        {/* Blobs */}
        <div style={{position:'fixed',top:-100,right:-100,width:600,height:600,borderRadius:'50%',
          background:'radial-gradient(circle,rgba(47,84,70,.08),transparent 70%)',
          filter:'blur(120px)',pointerEvents:'none',zIndex:0}}/>
        <div style={{position:'fixed',bottom:-100,left:-100,width:600,height:600,borderRadius:'50%',
          background:'radial-gradient(circle,rgba(47,84,70,.08),transparent 70%)',
          filter:'blur(120px)',pointerEvents:'none',zIndex:0}}/>

        {/* ── Navbar ── */}
        <nav style={{
          position:'sticky',top:0,zIndex:100,display:'flex',alignItems:'center',
          justifyContent:'space-between',padding:'0 32px',height:60,
          background:navBlur?'rgba(15,28,23,.88)':'transparent',
          backdropFilter:navBlur?'blur(12px)':'none',
          transition:'background .3s,backdrop-filter .3s',
          borderBottom:navBlur?'1px solid rgba(197,221,213,.08)':'none',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <img src="/full_square_transparent_customcolor.png" alt="NV" style={{height:32,width:'auto'}}
              onError={e=>(e.currentTarget.style.display='none')}/>
            <span style={{fontFamily:'Jost,sans-serif',fontWeight:800,fontSize:13,
              letterSpacing:'.1em',color:SUBTLE,textTransform:'uppercase'}}>
              NOUVEAU VARIABLE
            </span>
          </div>
          <a href="#candidater" style={{
            fontFamily:'Jost,sans-serif',fontWeight:700,fontSize:13,color:WHITE,
            background:GREEN,borderRadius:99,padding:'8px 20px',textDecoration:'none',
          }}
            onMouseEnter={e=>(e.currentTarget.style.background=GREEN2)}
            onMouseLeave={e=>(e.currentTarget.style.background=GREEN)}
          >Candidater</a>
        </nav>

        {/* ── Hero ── */}
        <div ref={heroWrapRef} className="hero-wrap" style={{height:isMobile?'auto':'300vh',position:'relative'}}>
          <div className="hero-sticky" style={{
            position:isMobile?'relative':'sticky',top:0,
            height:isMobile?'auto':'100vh',
            display:'flex',flexDirection:'column',alignItems:'center',
            justifyContent:'center',padding:'80px 32px 60px',
            overflow:'hidden',zIndex:1,
          }}>

            {/* Title */}
            <div style={{
              transform:`scale(${heroScale})`,letterSpacing:heroSpacing,
              opacity:heroOpacity,textAlign:'center',maxWidth:820,
              transition:isMobile?'none':undefined,
            }}>
              <h1 className="hero-h1" style={{
                fontFamily:'Jost,sans-serif',fontWeight:900,
                fontSize:'clamp(42px,7vw,82px)',lineHeight:1.06,color:WHITE,
              }}>
                {[
                  {words:['Un','cercle','privé.'],  accent:false},
                  {words:['1 000','pros','de','la','vente.'], accent:false},
                  {words:["Plus","d'opportunités,"],accent:false},
                  {words:['aucune','limite.'],       accent:true},
                ].map((line,li)=>(
                  <div key={li} style={{display:'block',marginBottom:6}}>
                    {line.words.map((w,wi)=>{
                      const globalI = [0,3,8,10][li]+wi
                      return (
                        <span key={wi} className={mounted?'word':undefined} style={{
                          color:line.accent?SUBTLE:WHITE,
                          animationDelay:`${globalI*80}ms`,
                          marginRight: wi<line.words.length-1?'.25em':0,
                          ...(line.accent&&wi===1?{textDecoration:'underline',textDecorationColor:GREEN,textUnderlineOffset:8}:{}),
                        }}>{w}</span>
                      )
                    })}
                  </div>
                ))}
              </h1>
            </div>

            {/* Subtitle */}
            <div style={{
              opacity:isMobile?1:subOpacity,
              transform:`translateY(${isMobile?0:(1-subOpacity)*24}px)`,
              textAlign:'center',marginTop:36,
              transition:isMobile?'none':undefined,
            }}>
              <p style={{fontFamily:'Inter,sans-serif',fontSize:18,color:TEXT2,marginBottom:28,maxWidth:480}}>
                Le premier club privé pour commerciaux BtoB ambitieux.<br/>Réseau, outils IA, opportunités réelles.
              </p>
              {/* Sparkline badge */}
              <div style={{display:'inline-flex',alignItems:'center',gap:12,
                background:'rgba(234,242,238,.06)',border:'1px solid rgba(197,221,213,.18)',
                borderRadius:99,padding:'10px 18px'}}>
                <svg width="120" height="40" viewBox="0 0 120 40" fill="none" style={{overflow:'visible'}}>
                  {sparkOn&&<path className="spark"
                    d="M0,36 L15,30 L30,24 L45,26 L60,16 L75,8 L90,4 L105,2 L120,0"
                    stroke={GREEN} strokeWidth="2" strokeLinecap="round" fill="none"/>}
                </svg>
                <span style={{fontFamily:'Roboto Mono,monospace',fontSize:12,color:GREEN,fontWeight:500,
                  background:GREEN3,border:`1px solid ${SUBTLE}`,borderRadius:99,padding:'4px 12px',whiteSpace:'nowrap'}}>
                  ↑ +38% revenus variables
                </span>
              </div>
            </div>

            {/* CTA */}
            <div style={{
              opacity:isMobile?1:ctaOpacity,
              transform:`translateY(${isMobile?0:(1-ctaOpacity)*20}px)`,
              marginTop:40,transition:isMobile?'none':undefined,
            }}>
              <a href="#candidater" style={{
                fontFamily:'Jost,sans-serif',fontWeight:800,fontSize:16,
                color:WHITE,background:GREEN,borderRadius:99,
                padding:'16px 40px',textDecoration:'none',display:'inline-block',
                boxShadow:'0 0 40px rgba(47,84,70,.3)',transition:'background .2s,box-shadow .2s',
              }}
                onMouseEnter={e=>{e.currentTarget.style.background=GREEN2;e.currentTarget.style.boxShadow='0 0 64px rgba(47,84,70,.5)'}}
                onMouseLeave={e=>{e.currentTarget.style.background=GREEN;e.currentTarget.style.boxShadow='0 0 40px rgba(47,84,70,.3)'}}
              >
                Candidater au club →
              </a>
            </div>
          </div>
        </div>

        {/* ── Pillars ── */}
        <section ref={pilarRef} style={{padding:'80px 32px',maxWidth:1080,margin:'0 auto',position:'relative',zIndex:1}}>
          <h2 style={{fontFamily:'Jost,sans-serif',fontWeight:800,fontSize:'clamp(28px,4vw,42px)',
            color:WHITE,textAlign:'center',marginBottom:12}}>Ce que tu rejoins</h2>
          <p style={{fontFamily:'Inter,sans-serif',color:TEXT2,textAlign:'center',marginBottom:48,fontSize:16}}>
            Quatre piliers pour accélérer tes performances.
          </p>
          <div className="pg" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
            {PILLARS.map((pl,i)=>(
              <div key={i} className="pill" style={{
                padding:'28px 24px',
                opacity:pilarIn?1:0,
                transform:pilarIn?'none':(
                  pl.dir==='left'?'translateX(-40px)':
                  pl.dir==='right'?'translateX(40px)':
                  pl.dir==='top'?'translateY(-40px)':'translateY(40px)'
                ),
                transition:`opacity .5s ${i*100}ms,transform .5s ${i*100}ms`,
              }}>
                <div style={{fontSize:26,marginBottom:12}}>{pl.icon}</div>
                <h3 style={{fontFamily:'Jost,sans-serif',fontWeight:800,fontSize:20,color:WHITE,marginBottom:8}}>{pl.title}</h3>
                <p style={{fontFamily:'Inter,sans-serif',fontSize:14,color:TEXT2,lineHeight:1.75}}>{pl.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Club privé ── */}
        <section ref={clubRef} style={{padding:'80px 32px',textAlign:'center',position:'relative',zIndex:1}}>
          <span style={{fontFamily:'Jost,sans-serif',fontWeight:700,fontSize:11,letterSpacing:'.12em',
            textTransform:'uppercase',color:WHITE,background:GREEN,borderRadius:99,
            padding:'5px 14px',display:'inline-block',marginBottom:24}}>Club privé</span>
          <h2 style={{fontFamily:'Jost,sans-serif',fontWeight:900,fontSize:'clamp(32px,5vw,58px)',
            color:WHITE,marginBottom:52,letterSpacing:'-.01em'}}>
            1 000 places.<br/>Pas une de plus.
          </h2>
          <div style={{display:'flex',justifyContent:'center',gap:64,flexWrap:'wrap'}}>
            {COUNTER_TARGETS.map((_,i)=>(
              <div key={i}>
                <div style={{fontFamily:'Roboto Mono,monospace',
                  fontSize:'clamp(38px,5vw,58px)',fontWeight:500,color:SUBTLE,lineHeight:1}}>
                  {counters[i].toLocaleString('fr-FR')}{COUNTER_SUFFIXES[i]}
                </div>
                <div style={{fontFamily:'Inter,sans-serif',fontSize:13,color:TEXT2,marginTop:10,fontWeight:500}}>
                  {COUNTER_LABELS[i]}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Typewriter ── */}
        <section ref={twRef} style={{padding:'60px 32px',maxWidth:680,margin:'0 auto',position:'relative',zIndex:1}}>
          <div style={{background:CARD,border:'1px solid rgba(197,221,213,.1)',borderRadius:16,padding:'40px 36px'}}>
            <div style={{fontFamily:"'Courier Prime',monospace",
              fontSize:'clamp(26px,4vw,40px)',fontWeight:700,color:WHITE,marginBottom:24,minHeight:'1.3em'}}>
              {twText}<span className="tw-cur" style={{color:SUBTLE}}>|</span>
            </div>
            <p style={{fontFamily:"'Courier Prime',monospace",fontSize:15,color:TEXT2,lineHeight:1.9}}>
              {'Pour '}
              <span style={{fontStyle:'italic',color:SUBTLE}}>la première fois</span>
              {', ton variable n\'est '}
              <span style={{fontStyle:'italic',color:AMBER}}>pas fixe</span>
              {'. Il dépend de ta '}
              <span style={{fontWeight:700,color:SUBTLE}}>performance individuelle</span>
              {' — et du réseau que tu construis autour de toi.'}
            </p>
          </div>
        </section>

        {/* ── Form ── */}
        <section id="candidater" style={{padding:'80px 32px 120px',maxWidth:520,margin:'0 auto',position:'relative',zIndex:1}}>
          <div style={{textAlign:'center',marginBottom:32}}>
            <span style={{fontFamily:'Jost,sans-serif',fontWeight:700,fontSize:11,letterSpacing:'.12em',
              textTransform:'uppercase',color:WHITE,background:GREEN,borderRadius:99,
              padding:'5px 14px',display:'inline-block',marginBottom:16}}>Candidater au club</span>
            <h2 style={{fontFamily:'Jost,sans-serif',fontWeight:800,fontSize:'clamp(24px,3vw,32px)',color:WHITE}}>
              {step==='phone'?"Accède à ton espace":step==='otp'?'Code de vérification':'Code parrain'}
            </h2>
          </div>

          <div style={{background:CARD,border:'1px solid rgba(197,221,213,.12)',borderRadius:20,padding:'32px 28px'}}>

            {step==='phone'&&(
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                <p style={{fontFamily:'Inter,sans-serif',fontSize:14,color:TEXT2}}>
                  Entre ton numéro — on t&apos;envoie un code par SMS.
                </p>
                <div>
                  <label style={{fontFamily:'Roboto Mono,monospace',fontSize:11,color:SUBTLE,
                    textTransform:'uppercase',letterSpacing:'.08em',display:'block',marginBottom:8}}>
                    Numéro de téléphone
                  </label>
                  <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}
                    placeholder="06 12 34 56 78" autoFocus
                    onKeyDown={e=>e.key==='Enter'&&sendOtp()}
                    style={inp}
                    onFocus={e=>(e.currentTarget.style.borderColor=GREEN)}
                    onBlur={e=>(e.currentTarget.style.borderColor='rgba(197,221,213,.2)')}/>
                </div>
                {aError&&<div style={{background:'rgba(224,82,82,.1)',border:'1px solid rgba(224,82,82,.3)',
                  borderRadius:8,padding:'10px 14px',fontSize:13,color:'#E05252'}}>{aError}</div>}
                <button onClick={sendOtp} disabled={aLoading} style={btn}
                  onMouseEnter={e=>!aLoading&&(e.currentTarget.style.background=GREEN2)}
                  onMouseLeave={e=>(e.currentTarget.style.background=GREEN)}>
                  {aLoading?'Envoi…':'Recevoir mon code →'}
                </button>
              </div>
            )}

            {step==='otp'&&(
              <div style={{display:'flex',flexDirection:'column',gap:20}}>
                <p style={{fontFamily:'Inter,sans-serif',fontSize:14,color:TEXT2}}>
                  Code envoyé au {phone}. Saisis les 6 chiffres.
                </p>
                <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                  {otp.map((d,i)=>(
                    <input key={i} ref={el=>{otpRefs.current[i]=el}}
                      type="tel" inputMode="numeric" maxLength={1} value={d}
                      onChange={e=>handleOtpChange(i,e.target.value)}
                      onKeyDown={e=>handleOtpKey(i,e)}
                      style={{width:46,height:54,textAlign:'center',fontSize:22,fontWeight:700,
                        fontFamily:'Jost,sans-serif',
                        background:d?`${GREEN}33`:BG,
                        border:`2px solid ${d?GREEN:'rgba(197,221,213,.2)'}`,
                        borderRadius:10,color:WHITE,outline:'none',transition:'.15s'}}/>
                  ))}
                </div>
                {aLoading&&<p style={{textAlign:'center',fontSize:13,color:TEXT2}}>Vérification…</p>}
                {aError&&<div style={{background:'rgba(224,82,82,.1)',border:'1px solid rgba(224,82,82,.3)',
                  borderRadius:8,padding:'10px 14px',fontSize:13,color:'#E05252',textAlign:'center'}}>{aError}</div>}
                <div style={{textAlign:'center'}}>
                  {countdown>0
                    ?<span style={{fontSize:13,color:TEXT2}}>Renvoyer dans {countdown}s</span>
                    :<button onClick={sendOtp} style={{fontSize:13,color:GREEN,fontWeight:600,
                      background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                      Renvoyer le SMS
                    </button>}
                </div>
                <button onClick={()=>{setStep('phone');setOtp(['','','','','','']);setAError('')}}
                  style={{fontSize:13,color:TEXT2,background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                  ← Changer de numéro
                </button>
              </div>
            )}

            {step==='referral'&&(
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div style={{background:`${GREEN}22`,border:'1px solid rgba(197,221,213,.15)',
                  borderRadius:10,padding:'12px 14px',fontSize:13,color:TEXT2,lineHeight:1.65}}>
                  Premier accès détecté. Pour rejoindre le club, tu as besoin d&apos;un code parrain.
                </div>
                <div>
                  <label style={{fontFamily:'Roboto Mono,monospace',fontSize:11,color:SUBTLE,
                    textTransform:'uppercase',letterSpacing:'.08em',display:'block',marginBottom:8}}>
                    Code parrain
                  </label>
                  <div style={{display:'flex',gap:8}}>
                    <input value={refCode}
                      onChange={e=>{setRefCode(e.target.value.toUpperCase());setRefValid(false);setRefId('')}}
                      placeholder="Ex: GODMODE"
                      style={{...inp,flex:1,fontFamily:'Jost,sans-serif',fontWeight:600,letterSpacing:'.05em'}}
                      onFocus={e=>(e.currentTarget.style.borderColor=GREEN)}
                      onBlur={e=>(e.currentTarget.style.borderColor='rgba(197,221,213,.2)')}/>
                    <button onClick={async()=>{
                      if(!refCode)return
                      setALoading(true)
                      const{data}=await supabase.from('profiles').select('id').eq('referral_code',refCode.toUpperCase()).single()
                      setALoading(false)
                      if(data){setRefValid(true);setRefId(data.id);setAError('')}else setAError('Code introuvable.')
                    }} style={{
                      background:refValid?`${GREEN}33`:BG,
                      border:`1px solid ${refValid?GREEN:'rgba(197,221,213,.2)'}`,
                      color:refValid?GREEN:TEXT2,padding:'0 16px',borderRadius:12,
                      fontSize:13,fontWeight:600,cursor:'pointer',
                      fontFamily:'Inter,sans-serif',whiteSpace:'nowrap',
                    }}>
                      {aLoading?'…':refValid?'✓ Validé':'Vérifier'}
                    </button>
                  </div>
                </div>
                {aError&&<div style={{background:'rgba(224,82,82,.1)',border:'1px solid rgba(224,82,82,.3)',
                  borderRadius:8,padding:'10px 14px',fontSize:13,color:'#E05252'}}>{aError}</div>}
                <button onClick={validateAndCreate} disabled={aLoading||!refValid}
                  style={{...btn,opacity:refValid?1:.5,cursor:(aLoading||!refValid)?'not-allowed':'pointer'}}
                  onMouseEnter={e=>refValid&&!aLoading&&(e.currentTarget.style.background=GREEN2)}
                  onMouseLeave={e=>(e.currentTarget.style.background=GREEN)}>
                  {aLoading?'Création du compte…':'Rejoindre le club →'}
                </button>
              </div>
            )}
          </div>

          <p style={{marginTop:20,fontSize:12,color:TEXT2,textAlign:'center'}}>
            En continuant tu acceptes nos{' '}
            <a href="/mentions-legales" style={{color:SUBTLE,textDecoration:'none'}}>CGU</a>
            {' '}et notre{' '}
            <a href="/politique-confidentialite" style={{color:SUBTLE,textDecoration:'none'}}>politique de confidentialité</a>
          </p>
        </section>

        {/* ── Footer ── */}
        <footer style={{borderTop:'1px solid rgba(197,221,213,.1)',padding:'28px 32px',
          display:'flex',alignItems:'center',justifyContent:'space-between',
          flexWrap:'wrap',gap:12,position:'relative',zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <img src="/nv-logo-black.png" alt="NV" style={{height:24,opacity:.5}}
              onError={e=>(e.currentTarget.style.display='none')}/>
          </div>
          <p style={{fontFamily:'Inter,sans-serif',fontSize:12,color:TEXT2}}>
            © Nouveau Variable — Club privé pour commerciaux ambitieux
          </p>
        </footer>
      </div>
    </>
  )
}
