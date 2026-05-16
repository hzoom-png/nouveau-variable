'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { NvLogo } from '@/components/NvLogo'
import { RANK_LABELS, type Rank } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface ServiceItem { title: string; description: string }
interface LinkItem { label: string; url: string }
interface TrackRecord { title: string; value: string; year?: string }

interface ReferralProfile {
  id: string
  first_name: string
  last_name: string | null
  avatar_url: string | null
  avatar_path: string | null
  role_title: string | null
}

interface Profile {
  id: string
  slug: string
  first_name: string
  last_name: string
  display_name?: string
  tagline?: string
  bio?: string
  role_title?: string
  role_type?: string
  rank: string
  cities: string[]
  sectors: string[]
  services?: ServiceItem[]
  links?: LinkItem[]
  track_record?: TrackRecord[]
  missions_count: number
  rating: number
  is_founder: boolean
  member_number?: number
  created_at: string
}

interface Props {
  profile: Profile
  avatarUrl: string | null
  referrals: ReferralProfile[]
}

const ROLE_TYPE_LABELS: Record<string, string> = {
  salarie:              'Salarié',
  salarie_entrepreneur: 'Salarié · Entrepreneur',
  freelance:            'Freelance',
  entrepreneur:         'Entrepreneur',
  dirigeant:            'Dirigeant',
  autre:                'Autre',
}

const MEETING_TYPE_OPTIONS = [
  { value: 'visio',     label: '💻 Visio',    desc: 'Google Meet, Zoom…' },
  { value: 'telephone', label: '📞 Téléphone', desc: 'Appel direct' },
  { value: 'cafe',      label: '☕ Café',       desc: 'En présentiel' },
  { value: 'autre',     label: '📅 Autre',     desc: 'À définir ensemble' },
] as const

type MeetingType = typeof MEETING_TYPE_OPTIONS[number]['value']

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { el.classList.add('revealed'); obs.unobserve(el) } })
    }, { threshold: 0.08 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useReveal()
  return (
    <div
      ref={ref}
      className="reveal"
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5.5 2H2a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V8.5M7.5 1H13v5.5M13 1L6 8"/>
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0 }}>
      <circle cx="6" cy="6" r="5"/>
      <path d="M6 3v3l2 1"/>
    </svg>
  )
}

const CSS = `
  .dot-grid {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image: radial-gradient(circle, rgba(47,84,70,0.05) 1px, transparent 1px);
    background-size: 24px 24px;
  }

  .profile-layout {
    display: flex;
    gap: 28px;
    max-width: 1100px;
    margin: 0 auto;
    padding: 36px 24px 80px;
    align-items: flex-start;
    position: relative;
    z-index: 1;
  }

  .profile-left {
    width: 320px;
    flex-shrink: 0;
    position: sticky;
    top: 76px;
  }

  .profile-right {
    flex: 1;
    min-width: 0;
  }

  @keyframes entryIn {
    from { opacity: 0; transform: scale(0.88); }
    to   { opacity: 1; transform: scale(1); }
  }
  .entry-animate {
    animation: entryIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  @keyframes revealUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .reveal { opacity: 0; }
  .reveal.revealed {
    animation: revealUp 0.5s ease var(--reveal-delay, 0ms) forwards;
  }

  .avatar-wrap {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    border: 3px solid #E4EEEA;
    overflow: hidden;
    display: grid;
    place-items: center;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    transition: box-shadow 0.3s;
  }
  .avatar-wrap:hover {
    box-shadow: 0 0 0 5px rgba(47,84,70,0.10), 0 0 0 10px rgba(47,84,70,0.04);
  }

  .section-card {
    background: #fff;
    border: 1px solid #E4EEEA;
    border-radius: 16px;
    padding: 28px;
    margin-bottom: 16px;
  }
  .section-label {
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: #9BB5AA;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 14px;
  }

  .tr-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid #E4EEEA;
  }
  .tr-row:last-child { border-bottom: none; }

  .link-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #F7FAF8;
    border: 1px solid #E4EEEA;
    display: grid;
    place-items: center;
    color: #4B6358;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
  }
  .link-icon:hover {
    background: #EAF2EE;
    color: #2F5446;
  }

  .btn-primary-full {
    width: 100%;
    background: #2F5446;
    color: #fff;
    padding: 13px 20px;
    border-radius: 99px;
    font-family: 'Jost', sans-serif;
    font-size: 14px;
    font-weight: 800;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
    letter-spacing: 0.01em;
  }
  .btn-primary-full:hover { background: #3D6B58; }

  .btn-rdv-input:focus {
    border-color: #2F5446 !important;
    outline: none;
  }

  .mobile-bar {
    display: none;
  }

  @media (max-width: 1023px) {
    .profile-layout {
      flex-direction: column;
      padding: 20px 16px 100px;
      gap: 16px;
    }
    .profile-left {
      width: 100%;
      position: static;
    }
    .avatar-wrap {
      width: 120px !important;
      height: 120px !important;
    }
    .mobile-bar {
      display: flex;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: #fff;
      border-top: 1px solid #E4EEEA;
      align-items: center;
      padding: 0 16px;
      gap: 10px;
      z-index: 50;
      transition: transform 0.3s ease;
    }
    .mobile-bar.hidden {
      transform: translateY(100%);
    }
  }
  @media (min-width: 1024px) {
    .mobile-bar { display: none !important; }
  }

  @keyframes scrollReferrals {
    0%   { transform: translateY(-50%) translateX(0); }
    100% { transform: translateY(-50%) translateX(-50%); }
  }
  .referrals-track:hover {
    animation-play-state: paused;
  }
`

function ReferralsCarousel({ referrals }: { referrals: ReferralProfile[] }) {
  const doubled = [...referrals, ...referrals]
  return (
    <div style={{ position: 'relative', overflow: 'hidden', height: 80, marginTop: 16 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to right, #ffffff, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to left, #ffffff, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div
        className="referrals-track"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          animation: 'scrollReferrals 20s linear infinite',
        }}
      >
        {doubled.map((r, i) => (
          <div
            key={`${r.id}-${i}`}
            title={`${r.first_name} ${r.last_name ?? ''}`.trim()}
            style={{ width: 56, height: 56, minWidth: 56, borderRadius: '50%', overflow: 'hidden', border: '2px solid #e8f5ef', background: '#e8f5ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#024f41', fontWeight: 700, flexShrink: 0 }}
          >
            {r.avatar_url ? (
              <img src={r.avatar_url} alt={r.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              `${r.first_name?.[0] ?? ''}${r.last_name?.[0] ?? ''}`
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PublicProfileClient({ profile, avatarUrl, referrals }: Props) {
  const name = profile.display_name || `${profile.first_name} ${profile.last_name}`
  const initials = getInitials(name)
  const memberNum = profile.member_number != null ? String(profile.member_number).padStart(3, '0') : null
  const since = new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const services = profile.services ?? []
  const trackRecord = profile.track_record ?? []
  const links = profile.links ?? []

  const [rdvForm, setRdvForm] = useState({
    meetingType: 'visio' as MeetingType,
    availabilityNote: '',
    message: '',
  })
  const [rdvStatus, setRdvStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [rdvError, setRdvError] = useState('')
  const [rdvSectionVisible, setRdvSectionVisible] = useState(false)
  const [hoverReady, setHoverReady] = useState(false)
  const [session, setSession] = useState<'loading' | 'logged-in' | 'guest'>('loading')

  useEffect(() => {
    const el = document.getElementById('section-rdv')
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      setRdvSectionVisible(entries[0].isIntersecting)
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setHoverReady(true), 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const sb = createClient()
    sb.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s ? 'logged-in' : 'guest')
    })
  }, [])

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    const sections = document.querySelectorAll('.profile-section')
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          ;(e.target as HTMLElement).style.opacity = '1'
          ;(e.target as HTMLElement).style.transform = 'translateY(0)'
          observer.unobserve(e.target)
        }
      }),
      { threshold: 0.1 }
    )
    sections.forEach(s => observer.observe(s))
    return () => {
      observer.disconnect()
      document.documentElement.style.scrollBehavior = ''
    }
  }, [])

  function scrollToRdv() {
    document.getElementById('section-rdv')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleRdvSubmit(e: React.FormEvent) {
    e.preventDefault()
    setRdvStatus('sending')
    setRdvError('')
    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_id:      profile.id,
        meeting_type:      rdvForm.meetingType,
        message:           rdvForm.message || null,
        availability_note: rdvForm.availabilityNote || null,
      }),
    })
    if (res.ok) {
      setRdvStatus('success')
    } else {
      const d = await res.json()
      setRdvStatus('error')
      setRdvError(d.error || "Erreur lors de l'envoi")
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px',
    border: '1.5px solid #E4EEEA', borderRadius: '12px',
    fontSize: '14px', color: '#0F1C17', background: '#fff',
    outline: 'none', transition: 'border-color .15s',
    fontFamily: 'inherit', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 700, color: '#4B6358',
    letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '5px',
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="dot-grid" aria-hidden="true" />

      <div style={{ minHeight: '100vh', background: '#F7FAF8', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative' }}>

        {/* Header */}
        <header style={{ background: 'rgba(247,250,248,0.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #E4EEEA', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <NvLogo size={24} />
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '12px', fontWeight: 700, color: '#2F5446', letterSpacing: '.05em', textTransform: 'uppercase' }}>Nouveau Variable</span>
          </Link>
          <a
            href="https://nouveauvariable.fr/"
            target="_blank"
            rel="noopener"
            style={{ background: '#2F5446', color: '#fff', padding: '7px 18px', borderRadius: '99px', fontFamily: 'Jost, sans-serif', fontSize: '12px', fontWeight: 700, textDecoration: 'none', letterSpacing: '.01em' }}
          >
            Accéder au club
          </a>
        </header>

        {/* Main layout */}
        <div className="profile-layout">

          {/* ── Left column ── */}
          <aside className="profile-left entry-animate">
            <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: '20px', padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>

              {/* Watermark + avatar */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: '6px' }}>
                {memberNum && (
                  <div style={{
                    position: 'absolute',
                    fontFamily: "'Jost', sans-serif",
                    fontSize: '110px',
                    fontWeight: 900,
                    color: 'rgba(47,84,70,0.055)',
                    letterSpacing: '-0.04em',
                    userSelect: 'none',
                    pointerEvents: 'none',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    zIndex: 0,
                  }}>
                    #{memberNum}
                  </div>
                )}
                <div className="avatar-wrap" style={{ width: 160, height: 160 }}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#EAF2EE', display: 'grid', placeItems: 'center', fontFamily: "'Jost', sans-serif", fontSize: '48px', fontWeight: 800, color: '#2F5446' }}>
                      {initials}
                    </div>
                  )}
                </div>
              </div>

              {/* Identity */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '22px', fontWeight: 800, color: '#0F1C17', marginBottom: '4px', lineHeight: 1.2 }}>
                  {name}
                </div>
                {profile.role_title && (
                  <div style={{ fontSize: '14px', color: '#4B6358', fontWeight: 400, marginBottom: '4px' }}>
                    {profile.role_title}
                  </div>
                )}
                {profile.tagline && (
                  <div style={{ fontSize: '13px', color: '#4B6358', fontStyle: 'italic', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {profile.tagline}
                  </div>
                )}
              </div>

              {/* Badges */}
              {(profile.is_founder || profile.rank) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                  {profile.is_founder && (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '99px', background: '#2F5446', color: '#fff', letterSpacing: '.03em' }}>
                      Fondateur
                    </span>
                  )}
                  {profile.rank && (
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '99px', background: '#EAF2EE', color: '#2F5446' }}>
                      {RANK_LABELS[profile.rank as Rank] ?? profile.rank.charAt(0).toUpperCase() + profile.rank.slice(1)}
                    </span>
                  )}
                </div>
              )}

              {/* Role type */}
              {profile.role_type && ROLE_TYPE_LABELS[profile.role_type] && (
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '99px', background: '#F7FAF8', color: '#4B6358', border: '1px solid #E4EEEA' }}>
                  {ROLE_TYPE_LABELS[profile.role_type]}
                </span>
              )}

              {/* Member since */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#9BB5AA' }}>
                <ClockIcon />
                <span>Membre depuis {since}</span>
              </div>

              {/* Cities + Sectors pills */}
              {((profile.cities?.length ?? 0) > 0 || (profile.sectors?.length ?? 0) > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
                  {(profile.cities ?? []).map(c => (
                    <span key={c} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '99px', background: '#EAF2EE', color: '#2F5446' }}>{c}</span>
                  ))}
                  {(profile.sectors ?? []).map(s => (
                    <span key={s} style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '99px', background: '#F7FAF8', color: '#4B6358', border: '1px solid #E4EEEA' }}>{s}</span>
                  ))}
                </div>
              )}

              {/* Primary CTA */}
              <button className="btn-primary-full" onClick={scrollToRdv} style={{ marginTop: '4px' }}>
                Proposer un RDV
              </button>

              {/* Links icons */}
              {links.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                  {links.map((lnk, i) => (
                    <a key={i} href={lnk.url} target="_blank" rel="noopener noreferrer" className="link-icon" title={lnk.label}>
                      {lnk.url.includes('linkedin.com') ? <LinkedInIcon /> : <ExternalLinkIcon />}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* ── Right column ── */}
          <div className="profile-right">

            {/* À propos */}
            {profile.bio && (
              <RevealSection delay={0}>
                <div
                  className="section-card profile-section"
                  style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.3s ease, border-color 0.3s ease, box-shadow 0.35s cubic-bezier(0.16,1,0.3,1)', transitionDelay: '0ms' }}
                  onMouseEnter={hoverReady ? e => { e.currentTarget.style.borderColor = '#56b791'; e.currentTarget.style.boxShadow = '0 8px 48px rgba(2,79,65,0.10), 0 0 0 1.5px #56b791'; e.currentTarget.style.transform = 'translateY(-2px)' } : undefined}
                  onMouseLeave={hoverReady ? e => { e.currentTarget.style.borderColor = '#E4EEEA'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' } : undefined}
                >
                  <div className="section-label">À propos</div>
                  <p style={{ fontSize: '15px', color: '#4B6358', lineHeight: 1.7, margin: 0 }}>{profile.bio}</p>
                </div>
              </RevealSection>
            )}

            {/* Services */}
            {services.length > 0 && (
              <RevealSection delay={100}>
                <div
                  className="section-card profile-section"
                  style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.3s ease, border-color 0.3s ease, box-shadow 0.35s cubic-bezier(0.16,1,0.3,1)', transitionDelay: '80ms' }}
                  onMouseEnter={hoverReady ? e => { e.currentTarget.style.borderColor = '#56b791'; e.currentTarget.style.boxShadow = '0 8px 48px rgba(2,79,65,0.10), 0 0 0 1.5px #56b791'; e.currentTarget.style.transform = 'translateY(-2px)' } : undefined}
                  onMouseLeave={hoverReady ? e => { e.currentTarget.style.borderColor = '#E4EEEA'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' } : undefined}
                >
                  <div className="section-label">Services</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {services.map((svc, i) => (
                      <div key={i} style={{ background: '#F7FAF8', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '14px', fontWeight: 700, color: '#0F1C17', marginBottom: '5px' }}>{svc.title}</div>
                        <div style={{ fontSize: '13px', color: '#4B6358', lineHeight: 1.55 }}>{svc.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </RevealSection>
            )}

            {/* Track Record */}
            {trackRecord.length > 0 && (
              <RevealSection delay={200}>
                <div
                  className="section-card profile-section"
                  style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.3s ease, border-color 0.3s ease, box-shadow 0.35s cubic-bezier(0.16,1,0.3,1)', transitionDelay: '160ms' }}
                  onMouseEnter={hoverReady ? e => { e.currentTarget.style.borderColor = '#56b791'; e.currentTarget.style.boxShadow = '0 8px 48px rgba(2,79,65,0.10), 0 0 0 1.5px #56b791'; e.currentTarget.style.transform = 'translateY(-2px)' } : undefined}
                  onMouseLeave={hoverReady ? e => { e.currentTarget.style.borderColor = '#E4EEEA'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' } : undefined}
                >
                  <div className="section-label">Track Record</div>
                  {trackRecord.map((tr, i) => (
                    <div key={i} className="tr-row">
                      <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '22px', fontWeight: 900, color: '#2F5446', letterSpacing: '-0.02em', minWidth: '80px' }}>
                        {tr.value}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', color: '#0F1C17', fontWeight: 500 }}>{tr.title}</div>
                        {tr.year && <div style={{ fontSize: '11px', color: '#9BB5AA', marginTop: '2px' }}>{tr.year}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </RevealSection>
            )}

            {/* Filleuls */}
            {referrals.length >= 5 && (
              <div
                className="section-card profile-section"
                style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.3s ease, border-color 0.3s ease, box-shadow 0.35s cubic-bezier(0.16,1,0.3,1)', transitionDelay: '240ms', marginBottom: 16 }}
                onMouseEnter={hoverReady ? e => { e.currentTarget.style.borderColor = '#56b791'; e.currentTarget.style.boxShadow = '0 8px 48px rgba(2,79,65,0.10), 0 0 0 1.5px #56b791'; e.currentTarget.style.transform = 'translateY(-2px)' } : undefined}
                onMouseLeave={hoverReady ? e => { e.currentTarget.style.borderColor = '#E4EEEA'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' } : undefined}
              >
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9BB5AA', marginBottom: 12 }}>
                  A recommandé Nouveau Variable à
                </p>
                <ReferralsCarousel referrals={referrals} />
                <p style={{ fontSize: 12, color: '#9BB5AA', marginTop: 12 }}>
                  {referrals.length} membre{referrals.length > 1 ? 's' : ''} parrainé{referrals.length > 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* RDV Form */}
            <RevealSection delay={300}>
              <div
                id="section-rdv"
                className="section-card profile-section"
                style={{ background: '#EAF2EE', borderColor: '#C5DDD5', opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.3s ease, border-color 0.3s ease, box-shadow 0.35s cubic-bezier(0.16,1,0.3,1)', transitionDelay: '320ms' }}
                onMouseEnter={hoverReady ? e => { e.currentTarget.style.borderColor = '#56b791'; e.currentTarget.style.boxShadow = '0 8px 48px rgba(2,79,65,0.10), 0 0 0 1.5px #56b791'; e.currentTarget.style.transform = 'translateY(-2px)' } : undefined}
                onMouseLeave={hoverReady ? e => { e.currentTarget.style.borderColor = '#C5DDD5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' } : undefined}
              >
                <div className="section-label" style={{ color: '#2F5446' }}>
                  Proposer un rendez-vous à {profile.first_name}
                </div>

                {rdvStatus === 'success' ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                    <p style={{ fontWeight: 700, fontSize: 16, color: '#024f41', marginBottom: 8 }}>
                      Demande envoyée à {profile.first_name}
                    </p>
                    <p style={{ fontSize: 14, color: '#9BB5AA' }}>
                      Tu recevras un SMS dès que {profile.first_name} répond.
                    </p>
                  </div>
                ) : session === 'loading' ? null : session === 'guest' ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <p style={{ fontSize: 14, color: '#4B6358', marginBottom: 16 }}>
                      Connecte-toi pour proposer un RDV à {profile.first_name}.
                    </p>
                    <a href="/auth" style={{ display: 'inline-block', background: '#2F5446', color: '#fff', padding: '11px 28px', borderRadius: '99px', fontFamily: 'Jost, sans-serif', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
                      Se connecter →
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleRdvSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>Type de rencontre</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {MEETING_TYPE_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setRdvForm(f => ({ ...f, meetingType: opt.value }))}
                            style={{
                              padding: '7px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: 600,
                              cursor: 'pointer', transition: '.14s', fontFamily: 'inherit',
                              border: `1.5px solid ${rdvForm.meetingType === opt.value ? '#2F5446' : '#C5DDD5'}`,
                              background: rdvForm.meetingType === opt.value ? '#fff' : 'transparent',
                              color: rdvForm.meetingType === opt.value ? '#2F5446' : '#4B6358',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Message (optionnel)</label>
                      <textarea
                        rows={2}
                        className="btn-rdv-input"
                        style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
                        placeholder="Présente-toi brièvement…"
                        value={rdvForm.message}
                        onChange={e => setRdvForm(f => ({ ...f, message: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Tes disponibilités</label>
                      <input
                        type="text"
                        className="btn-rdv-input"
                        style={inputStyle}
                        placeholder="Ex : disponible en semaine après 18h, ou le weekend"
                        value={rdvForm.availabilityNote}
                        onChange={e => setRdvForm(f => ({ ...f, availabilityNote: e.target.value }))}
                      />
                    </div>

                    {rdvStatus === 'error' && (
                      <div style={{ background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)', borderRadius: '8px', padding: '9px 13px', fontSize: '13px', color: '#C0392B' }}>
                        {rdvError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={rdvStatus === 'sending'}
                      className="btn-primary-full"
                      style={{ background: rdvStatus === 'sending' ? '#C5DDD5' : '#2F5446', cursor: rdvStatus === 'sending' ? 'not-allowed' : 'pointer' }}
                    >
                      {rdvStatus === 'sending' ? 'Envoi…' : 'Envoyer ma demande →'}
                    </button>
                  </form>
                )}
              </div>
            </RevealSection>

            {/* Footer */}
            <footer style={{ marginTop: 8, padding: '24px 0', borderTop: '1px solid #E4EEEA', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
                <NvLogo size={16} />
                <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '11px', fontWeight: 700, color: '#2F5446', letterSpacing: '.05em', textTransform: 'uppercase' }}>Nouveau Variable</span>
              </div>
              <div style={{ fontSize: '12px', color: '#9BB5AA' }}>
                {name} est membre de Nouveau Variable — le club privé des commerciaux ambitieux
              </div>
            </footer>

          </div>
        </div>
      </div>

      {/* Mobile fixed bottom bar */}
      <div className={`mobile-bar${rdvSectionVisible ? ' hidden' : ''}`}>
        <button className="btn-primary-full" onClick={scrollToRdv} style={{ flex: 1 }}>
          Proposer un RDV
        </button>
      </div>
    </>
  )
}
