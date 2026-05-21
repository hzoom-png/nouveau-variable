'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NvLogo } from '@/components/NvLogo'

type OnboardStep = 'identity' | 'parcours' | 'tutorial'

const GREEN   = '#024f41'
const GREEN_3 = '#e8f5ef'
const GREEN_4 = '#56b791'
const BORDER  = '#E4EEEA'
const TEXT    = '#012722'
const TEXT_2  = '#4B6358'
const TEXT_3  = '#8FAAA0'
const SURFACE = '#f4f9f9'

const TUTORIAL_SLIDES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 15 15" fill="none" stroke={GREEN} strokeWidth="1.5">
        <circle cx="5.5" cy="4.5" r="2.5"/>
        <path d="M1 13c0-2.5 2-4.5 4.5-4.5S10 10.5 10 13"/>
        <circle cx="11.5" cy="5.5" r="2"/>
        <path d="M14 13c0-2-1.3-3.5-3-4"/>
      </svg>
    ),
    title: "L'Annuaire des membres",
    text: "Connecte-toi avec les membres du club. Filtre par secteur, ville, disponibilité et déclenche des rencontres en quelques clics.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 15 15" fill="none" stroke={GREEN} strokeWidth="1.5">
        <circle cx="7.5" cy="4" r="2.5"/>
        <circle cx="2.5" cy="12" r="1.5"/>
        <circle cx="12.5" cy="12" r="1.5"/>
        <path d="M7.5 6.5v3M5 11L3 12M10 11l2 1"/>
      </svg>
    ),
    title: 'Les Outils commerciaux',
    text: "Keyaccount pour gérer tes prospects, Réplique IA pour t'entraîner aux objections, DealLink pour partager tes opportunités.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 15 15" fill="none" stroke={GREEN} strokeWidth="1.5">
        <rect x="1" y="4" width="13" height="9" rx="1.5"/>
        <path d="M5 4V2.5a2.5 2.5 0 015 0V4"/>
        <path d="M1 8h13"/>
      </svg>
    ),
    title: 'Les Projets & Deals',
    text: "Partage des opportunités business avec les membres. Collabore sur des projets complémentaires et génère des commissions.",
  },
]

export default function OnboardingProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<OnboardStep>('identity')
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageReady, setPageReady] = useState(false)
  const [error, setError] = useState('')

  // Step 1 — identity
  const [avatarFile, setAvatarFile]     = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUploaded, setAvatarUploaded] = useState(false)
  const [tagline, setTagline] = useState('')

  // Step 2 — parcours
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [bio, setBio]                 = useState('')

  // Step 3 — tutorial
  const [slide, setSlide] = useState(0)

  // Completion gauge: avatar 25 + tagline 25 + linkedin 25 + bio 25
  const completion =
    (avatarUploaded || !!avatarFile ? 25 : 0) +
    (tagline.trim() ? 25 : 0) +
    (linkedinUrl.trim() ? 25 : 0) +
    (bio.trim() ? 25 : 0)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('first_name, avatar_url, onboarding_completed, is_founder')
        .eq('id', user.id)
        .single()

      if (!prof) { router.push('/auth'); return }
      if (prof.onboarding_completed) { router.push('/dashboard'); return }
      if (!prof.is_founder) { router.push('/auth'); return }

      setFirstName(prof.first_name ?? '')
      if (prof.avatar_url) {
        setAvatarPreview(prof.avatar_url)
        setAvatarUploaded(true)
      }
      setPageReady(true)
    }
    init()
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarUploaded(false)
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  async function submitStep1() {
    if (!tagline.trim()) { setError('Le tagline est obligatoire.'); return }
    setError('')
    setLoading(true)

    if (avatarFile) {
      const fd = new FormData()
      fd.append('file', avatarFile)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd })
      if (res.ok) setAvatarUploaded(true)
    }

    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagline }),
    })

    setLoading(false)
    setStep('parcours')
  }

  async function submitStep2() {
    setError('')
    setLoading(true)

    const payload: Record<string, string> = {}
    if (bio.trim()) payload.bio = bio.trim()
    if (linkedinUrl.trim()) payload.linkedin_url = linkedinUrl.trim()

    if (Object.keys(payload).length > 0) {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    setLoading(false)
    setStep('tutorial')
  }

  async function completeOnboarding() {
    setLoading(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboarding_completed: true }),
    })
    router.push('/dashboard?welcome=1')
    router.refresh()
  }

  if (!pageReady) {
    return (
      <div style={{ minHeight: '100vh', background: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${BORDER}`, borderTopColor: GREEN, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const stepIndex = step === 'identity' ? 0 : step === 'parcours' ? 1 : 2
  const stepLabels = ['Identité', 'Parcours', 'Tour du club']

  const card: React.CSSProperties = {
    background: '#fff',
    border: `1px solid ${BORDER}`,
    borderRadius: '24px',
    width: '100%',
    maxWidth: '440px',
    overflow: 'hidden',
    boxShadow: '0 12px 40px rgba(0,0,0,.08)',
  }

  const inputStyle: React.CSSProperties = {
    padding: '11px 14px',
    border: `1.5px solid ${BORDER}`,
    borderRadius: '8px',
    fontSize: '15px',
    color: TEXT,
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  const btnPrimary: React.CSSProperties = {
    background: loading ? TEXT_2 : GREEN,
    color: '#fff',
    padding: '13px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    border: 'none',
    width: '100%',
    fontFamily: 'Inter, sans-serif',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: SURFACE,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '24px',
    }}>
      <div style={card}>

        {/* Header */}
        <div style={{ padding: '22px 28px 18px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <NvLogo size={28} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', color: GREEN, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Nouveau Variable
            </span>
          </div>

          {/* Step indicators */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            {stepLabels.map((label, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{
                  height: '3px',
                  borderRadius: '99px',
                  background: i <= stepIndex ? GREEN : BORDER,
                  transition: 'background .3s',
                }} />
                <span style={{ fontSize: '10px', color: i <= stepIndex ? GREEN : TEXT_3, fontWeight: i === stepIndex ? 700 : 400 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: TEXT, marginBottom: '4px' }}>
            {step === 'identity' && `Salut ${firstName} 👋 On commence par toi`}
            {step === 'parcours' && 'Ton parcours & LinkedIn'}
            {step === 'tutorial' && 'Bienvenue dans le club'}
          </div>
          <div style={{ fontSize: '13px', color: TEXT_2 }}>
            {step === 'identity' && 'Ajoute ta photo et un court tagline pour te présenter.'}
            {step === 'parcours' && 'Optionnel mais fortement recommandé pour être visible.'}
            {step === 'tutorial' && 'Voilà ce que tu vas trouver dans ton espace.'}
          </div>
        </div>

        <div style={{ padding: '22px 28px' }}>

          {/* ── STEP 1 — identity ─────────────────────────── */}
          {step === 'identity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Avatar upload */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '80px', height: '80px',
                    borderRadius: '50%',
                    border: `2px dashed ${avatarPreview ? GREEN : BORDER}`,
                    background: avatarPreview ? 'transparent' : GREEN_3,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    padding: 0,
                    position: 'relative',
                  }}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '4px' }}>
                      <svg width="22" height="22" viewBox="0 0 15 15" fill="none" stroke={GREEN_4} strokeWidth="1.5">
                        <circle cx="7.5" cy="5" r="3"/>
                        <path d="M1.5 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                      </svg>
                    </div>
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                <span style={{ fontSize: '12px', color: TEXT_3 }}>
                  {avatarPreview ? 'Cliquer pour changer' : 'Ajouter une photo'}
                </span>
              </div>

              {/* Tagline */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: TEXT_2, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                    Tagline <span style={{ color: '#B91C1C' }}>*</span>
                  </label>
                  <span style={{ fontSize: '11px', color: tagline.length > 90 ? '#B91C1C' : TEXT_3 }}>
                    {tagline.length}/100
                  </span>
                </div>
                <input
                  value={tagline}
                  onChange={e => setTagline(e.target.value.slice(0, 100))}
                  placeholder="Ex: Fondateur SaaS B2B, 3× exited, 150k ARR"
                  style={inputStyle}
                  autoFocus
                />
                <p style={{ margin: '5px 0 0', fontSize: '11px', color: TEXT_3 }}>
                  Ce que tu fais en une phrase — c'est ce que les membres verront en premier.
                </p>
              </div>

              {/* Gauge */}
              <CompletionGauge pct={completion} />

              {error && <ErrorBox msg={error} />}

              <button onClick={submitStep1} disabled={loading} style={btnPrimary}>
                {loading ? 'Enregistrement…' : 'Continuer →'}
              </button>
            </div>
          )}

          {/* ── STEP 2 — parcours ─────────────────────────── */}
          {step === 'parcours' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* LinkedIn */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: TEXT_2, textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: '6px' }}>
                  LinkedIn <span style={{ color: TEXT_3, fontWeight: 400 }}>(optionnel)</span>
                </label>
                <input
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/tonprofil"
                  style={inputStyle}
                  type="url"
                  autoFocus
                />
              </div>

              {/* Bio */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: TEXT_2, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                    Bio <span style={{ color: TEXT_3, fontWeight: 400 }}>(optionnel)</span>
                  </label>
                  <span style={{ fontSize: '11px', color: bio.length > 380 ? '#B91C1C' : TEXT_3 }}>
                    {bio.length}/400
                  </span>
                </div>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 400))}
                  placeholder="Ton parcours, ce que tu vends, ce que tu cherches dans le club…"
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              {/* Gauge */}
              <CompletionGauge pct={completion} />

              {error && <ErrorBox msg={error} />}

              <button onClick={submitStep2} disabled={loading} style={btnPrimary}>
                {loading ? 'Enregistrement…' : 'Continuer →'}
              </button>

              <button
                onClick={() => setStep('identity')}
                style={{ background: 'none', border: 'none', fontSize: '13px', color: TEXT_3, cursor: 'pointer' }}
              >
                ← Retour
              </button>
            </div>
          )}

          {/* ── STEP 3 — tutorial ─────────────────────────── */}
          {step === 'tutorial' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Slide */}
              <div style={{
                background: GREEN_3,
                border: `1px solid ${BORDER}`,
                borderRadius: '14px',
                padding: '24px 20px',
                minHeight: '160px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{
                  width: 48, height: 48,
                  background: '#fff',
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${BORDER}`,
                }}>
                  {TUTORIAL_SLIDES[slide].icon}
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '16px', color: TEXT }}>
                  {TUTORIAL_SLIDES[slide].title}
                </div>
                <div style={{ fontSize: '13px', color: TEXT_2, lineHeight: 1.7 }}>
                  {TUTORIAL_SLIDES[slide].text}
                </div>
              </div>

              {/* Dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                {TUTORIAL_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    style={{
                      width: i === slide ? '20px' : '8px',
                      height: '8px',
                      borderRadius: '99px',
                      background: i === slide ? GREEN : BORDER,
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all .2s',
                    }}
                  />
                ))}
              </div>

              {slide < TUTORIAL_SLIDES.length - 1 ? (
                <button onClick={() => setSlide(s => s + 1)} style={btnPrimary}>
                  Suivant →
                </button>
              ) : (
                <button onClick={completeOnboarding} disabled={loading} style={{
                  ...btnPrimary,
                  background: loading ? TEXT_2 : GREEN,
                }}>
                  {loading ? 'Chargement…' : 'Accéder à mon dashboard →'}
                </button>
              )}

              <button
                onClick={() => setStep('parcours')}
                style={{ background: 'none', border: 'none', fontSize: '13px', color: TEXT_3, cursor: 'pointer' }}
              >
                ← Retour
              </button>
            </div>
          )}

        </div>
      </div>

      <p style={{ marginTop: '20px', fontSize: '12px', color: TEXT_3, textAlign: 'center' }}>
        Tu pourras compléter ton profil à tout moment depuis le dashboard.
      </p>
    </div>
  )
}

function CompletionGauge({ pct }: { pct: number }) {
  const color = pct >= 75 ? GREEN : pct >= 50 ? GREEN_4 : pct >= 25 ? '#a3c4bb' : BORDER
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: TEXT_3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Profil complété
        </span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: pct >= 50 ? GREEN : TEXT_3 }}>
          {pct}%
        </span>
      </div>
      <div style={{ height: '6px', background: BORDER, borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: '99px',
          transition: 'width .4s ease, background .4s',
        }} />
      </div>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 13px', fontSize: '12px', color: '#B91C1C' }}>
      {msg}
    </div>
  )
}
