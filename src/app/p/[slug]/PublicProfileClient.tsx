'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { NvLogo } from '@/components/NvLogo'

interface ServiceItem { title: string; description: string }
interface LinkItem { label: string; url: string }
interface TrackRecord { title: string; value: string; year?: string }

interface Profile {
  id: string
  slug: string
  first_name: string
  last_name: string
  display_name?: string
  avatar_url?: string
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
  referral_code?: string
}

interface Props { profile: Profile }

const ROLE_TYPE_LABELS: Record<string, string> = {
  salarie: 'Salarié',
  freelance: 'Freelance',
  entrepreneur: 'Entrepreneur',
  dirigeant: 'Dirigeant',
}

const MEETING_TYPE_OPTIONS = [
  { value: 'coffee',    label: '☕ Café' },
  { value: 'lunch',     label: '🍽 Déjeuner' },
  { value: 'afterwork', label: '🥂 Afterwork' },
  { value: 'video',     label: '💻 Visio' },
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
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function RevealSection({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useReveal()
  return <div ref={ref} className="reveal" style={style}>{children}</div>
}

function ProfileHero({ profile, name }: { profile: Profile; name: string }) {
  const initials = getInitials(name)
  const roleLabel = profile.role_type ? ROLE_TYPE_LABELS[profile.role_type] ?? profile.role_type : null

  return (
    <div style={{ position: 'relative', height: 260, borderRadius: 'var(--r-xl)', overflow: 'hidden', marginBottom: 0 }}>
      {profile.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2F5446 0%, #3D6B58 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, fontFamily: "'Jost', sans-serif", fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>
          {initials}
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,.65) 100%)' }} />
      <div style={{ position: 'absolute', bottom: 18, left: 20, right: 20 }}>
        <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,.3)', marginBottom: 6 }}>
          {name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {roleLabel && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--r-full)', background: 'var(--green)', color: '#fff', letterSpacing: '.03em' }}>
              {roleLabel}
            </span>
          )}
          {profile.cities?.[0] && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>📍 {profile.cities[0]}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function JoinCta({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 20px', background: 'var(--green)', color: '#fff', borderRadius: 'var(--r-md)', fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 800, textDecoration: 'none', transition: '.15s', letterSpacing: '.01em' }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2">
        <path d="M8 1l7 7-7 7M1 8h14"/>
      </svg>
      Rejoindre Nouveau Variable
    </a>
  )
}

export default function PublicProfileClient({ profile }: Props) {
  const name = profile.display_name || `${profile.first_name} ${profile.last_name}`
  const joinUrl = profile.referral_code
    ? `https://nouveauvariable.fr/?ref=${profile.referral_code}`
    : 'https://nouveauvariable.fr/'

  const services = profile.services ?? []
  const trackRecord = profile.track_record ?? []
  const links = profile.links ?? []

  const [rdvForm, setRdvForm] = useState({
    visitorName: '',
    visitorEmail: '',
    meetingType: 'coffee' as MeetingType,
    proposedAvailability: '',
    message: '',
  })
  const [rdvStatus, setRdvStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [rdvError, setRdvError] = useState('')

  async function handleRdvSubmit(e: React.FormEvent) {
    e.preventDefault()
    setRdvStatus('sending')
    setRdvError('')
    const res = await fetch('/api/public/meeting-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_slug: profile.slug,
        visitorName: rdvForm.visitorName,
        visitorEmail: rdvForm.visitorEmail,
        meetingType: rdvForm.meetingType,
        proposedAvailability: rdvForm.proposedAvailability,
        message: rdvForm.message,
      }),
    })
    if (res.ok) {
      setRdvStatus('success')
    } else {
      const d = await res.json()
      setRdvStatus('error')
      setRdvError(d.error || 'Erreur lors de l\'envoi')
    }
  }

  const card: React.CSSProperties = {
    background: 'var(--white)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)', overflow: 'hidden',
  }
  const sectionHead: React.CSSProperties = {
    fontFamily: 'Jost, sans-serif', fontSize: '11px', fontWeight: 700,
    color: 'var(--green)', letterSpacing: '.12em', textTransform: 'uppercase',
    marginBottom: '14px',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', border: '1.5px solid var(--border)',
    borderRadius: 'var(--r-sm)', fontSize: '14px', color: 'var(--text)',
    background: 'var(--white)', outline: 'none', transition: '.15s',
    fontFamily: 'inherit', boxSizing: 'border-box' as const,
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-2)',
    letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '5px',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <NvLogo size={24} />
          <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '12px', fontWeight: 700, color: 'var(--green)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Nouveau Variable</span>
        </Link>
        <a href={joinUrl} target="_blank" rel="noopener" style={{ background: 'var(--green)', color: '#fff', padding: '7px 18px', borderRadius: 'var(--r-full)', fontFamily: 'Jost, sans-serif', fontSize: '12px', fontWeight: 700, textDecoration: 'none', letterSpacing: '.01em' }}>
          Accéder au club
        </a>
      </header>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Hero */}
        <div style={{ marginBottom: '18px' }}>
          <ProfileHero profile={profile} name={name} />
        </div>

        {/* Main info card */}
        <RevealSection style={{ marginBottom: '18px' }}>
          <div style={card}>
            <div style={{ padding: '20px 24px 24px' }}>
              {profile.tagline && (
                <p style={{ fontSize: '15px', color: 'var(--text-2)', fontStyle: 'italic', marginBottom: '12px', lineHeight: 1.6 }}>
                  &ldquo;{profile.tagline}&rdquo;
                </p>
              )}
              {profile.bio && (
                <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.75, marginBottom: '18px' }}>{profile.bio}</p>
              )}

              {/* Join CTA */}
              <div style={{ marginBottom: '18px' }}>
                <JoinCta url={joinUrl} />
              </div>

              {/* Sectors + Cities pills */}
              {((profile.cities?.length ?? 0) > 0 || (profile.sectors?.length ?? 0) > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: links.length > 0 ? '18px' : 0 }}>
                  {(profile.cities ?? []).map(c => (
                    <span key={c} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: 'var(--r-full)', background: 'var(--green-3)', color: 'var(--green)' }}>{c}</span>
                  ))}
                  {(profile.sectors ?? []).map(s => (
                    <span key={s} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: 'var(--r-full)', background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>{s}</span>
                  ))}
                </div>
              )}

              {/* Links */}
              {links.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {links.map((lnk, i) => (
                    <a key={i} href={lnk.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--surface)', borderRadius: 'var(--r-sm)', textDecoration: 'none', transition: '.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--green-3)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="var(--green)" strokeWidth="1.5"><path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8M7.5 1H12v4.5M12 1L6 7"/></svg>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{lnk.label}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-3)', marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{lnk.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </RevealSection>

        {/* Track record */}
        {trackRecord.length > 0 && (
          <RevealSection style={{ marginBottom: '18px' }}>
            <div style={card}>
              <div style={{ padding: '20px 24px' }}>
                <div style={sectionHead}>Track record</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                  {trackRecord.map((tr, i) => (
                    <div key={i} style={{ background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Jost, sans-serif', fontSize: '22px', fontWeight: 800, color: 'var(--green)', letterSpacing: '-.02em', marginBottom: '4px' }}>{tr.value}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: 500 }}>{tr.title}</div>
                      {tr.year && <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '3px' }}>{tr.year}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </RevealSection>
        )}

        {/* Services */}
        {services.length > 0 && (
          <RevealSection style={{ marginBottom: '18px' }}>
            <div style={card}>
              <div style={{ padding: '20px 24px' }}>
                <div style={sectionHead}>Services proposés</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {services.map((svc, i) => (
                    <div key={i} style={{ background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: '14px 16px' }}>
                      <div style={{ fontFamily: 'Jost, sans-serif', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '5px' }}>{svc.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.55 }}>{svc.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </RevealSection>
        )}

        {/* RDV Form */}
        <RevealSection>
          <div style={{ ...card, borderColor: 'var(--green-4)' }}>
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={sectionHead}>Proposer un rendez-vous</div>

              {rdvStatus === 'success' ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--green-3)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M4 11l5 5 9-9"/></svg>
                  </div>
                  <div style={{ fontFamily: 'Jost, sans-serif', fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '6px' }}>Demande envoyée !</div>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '20px' }}>
                    {profile.first_name} recevra ta proposition et te répondra par email sous 48h.
                  </p>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>Tu veux rejoindre son réseau ?</div>
                    <JoinCta url={joinUrl} />
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRdvSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Ton prénom et nom *</label>
                    <input required style={inputStyle} placeholder="Marie Dupont" value={rdvForm.visitorName} onChange={e => setRdvForm(f => ({ ...f, visitorName: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Ton email *</label>
                    <input required type="email" style={inputStyle} placeholder="marie@exemple.fr" value={rdvForm.visitorEmail} onChange={e => setRdvForm(f => ({ ...f, visitorEmail: e.target.value }))} />
                  </div>

                  <div>
                    <label style={labelStyle}>Type de rencontre</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {MEETING_TYPE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setRdvForm(f => ({ ...f, meetingType: opt.value }))}
                          style={{
                            padding: '7px 14px', borderRadius: 'var(--r-full)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: '.14s',
                            border: `1.5px solid ${rdvForm.meetingType === opt.value ? 'var(--green)' : 'var(--border)'}`,
                            background: rdvForm.meetingType === opt.value ? 'var(--green-3)' : 'var(--white)',
                            color: rdvForm.meetingType === opt.value ? 'var(--green)' : 'var(--text-2)',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Tes disponibilités proposées *</label>
                    <textarea
                      required
                      rows={3}
                      style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
                      placeholder={'Ex : Mardi 3 juin après 17h,\nou jeudi matin avant 10h'}
                      value={rdvForm.proposedAvailability}
                      onChange={e => setRdvForm(f => ({ ...f, proposedAvailability: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Message (optionnel)</label>
                    <textarea
                      rows={2}
                      style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
                      placeholder="Contexte de ta demande…"
                      value={rdvForm.message}
                      onChange={e => setRdvForm(f => ({ ...f, message: e.target.value }))}
                    />
                  </div>

                  {rdvStatus === 'error' && (
                    <div style={{ background: 'var(--red-2)', border: '1px solid #FECACA', borderRadius: 'var(--r-sm)', padding: '9px 13px', fontSize: '13px', color: 'var(--red)' }}>{rdvError}</div>
                  )}

                  <button
                    type="submit"
                    disabled={rdvStatus === 'sending'}
                    style={{ background: rdvStatus === 'sending' ? 'var(--green-4)' : 'var(--green)', color: '#fff', padding: '12px', borderRadius: 'var(--r-sm)', fontFamily: 'Jost, sans-serif', fontSize: '14px', fontWeight: 700, border: 'none', cursor: rdvStatus === 'sending' ? 'not-allowed' : 'pointer', transition: '.15s' }}
                  >
                    {rdvStatus === 'sending' ? 'Envoi…' : 'Envoyer ma proposition →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </RevealSection>

        {/* Footer */}
        <footer style={{ marginTop: 40, padding: '24px 0', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
            <NvLogo size={18} />
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '11px', fontWeight: 700, color: 'var(--green)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Nouveau Variable</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '14px' }}>
            {name} est membre de Nouveau Variable — le club privé des commerciaux ambitieux
          </div>
          <a
            href={joinUrl}
            target="_blank"
            rel="noopener"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: 'var(--green-3)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-sm)', fontSize: '13px', fontWeight: 700, color: 'var(--green)', textDecoration: 'none', transition: '.15s' }}
          >
            Rejoindre le club →
          </a>
        </footer>
      </div>
    </div>
  )
}
