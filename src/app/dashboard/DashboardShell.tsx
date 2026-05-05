'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { TokenBalance } from '@/components/TokenBalance'
import { useTheme } from '@/lib/theme'
import { WelcomeTour } from '@/components/onboarding/WelcomeTour'

type SectionId = 'club' | 'outils' | 'moi'

type NavItem = {
  id: string
  label: string
  subtitle?: string
  href: string
  icon: React.ReactNode
  badge?: string
  exact?: boolean
}

type NavSection = {
  id: SectionId
  label: string
  items: NavItem[]
}

const HomeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.5 6.5L7.5 1.5l6 5V13a1 1 0 01-1 1h-3v-3.5H5.5V14h-3a1 1 0 01-1-1V6.5z"/>
  </svg>
)
const MembersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="5.5" cy="4.5" r="2.5"/><path d="M1 13c0-2.5 2-4.5 4.5-4.5S10 10.5 10 13"/>
    <circle cx="11.5" cy="5.5" r="2"/><path d="M14 13c0-2-1.3-3.5-3-4"/>
  </svg>
)
const ProjectsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="1" y="4" width="13" height="9" rx="1.5"/><path d="M5 4V2.5a2.5 2.5 0 015 0V4"/><path d="M1 8h13"/>
  </svg>
)
const MissionsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 1.5"/>
  </svg>
)
const KeyaccountIcon = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="7.5" cy="4" r="2.5"/><circle cx="2.5" cy="12" r="1.5"/><circle cx="12.5" cy="12" r="1.5"/>
    <path d="M7.5 6.5v3M5 11L3 12M10 11l2 1"/>
  </svg>
)
const RepliqueIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="1" y="3" width="12" height="8" rx="1.5"/><path d="M4 7h6M4 9.5h4"/><path d="M5 3V2M9 3V2"/>
  </svg>
)
const DealLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M8.5 3.5l3 3-6 6-3-3 6-6z"/>
    <path d="M11.5 6.5l1.5 1.5a2.1 2.1 0 010 3L12 12"/>
    <path d="M3.5 8.5L2 7a2.1 2.1 0 010-3L3 3"/>
  </svg>
)
const RocketIcon = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.5 1.5C7.5 1.5 3.5 3 2 7.5l3 3c4.5-1.5 6-5.5 6-5.5L7.5 1.5z"/>
    <path d="M2 7.5L1 13l5.5-1"/>
    <circle cx="10" cy="5" r="1"/>
  </svg>
)
const ProfileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="7.5" cy="5" r="3"/><path d="M1.5 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
  </svg>
)
const AffiliationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M7.5 1v13M1 7.5h13"/><circle cx="7.5" cy="7.5" r="6"/>
  </svg>
)
const BillingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="1" y="3" width="12" height="9" rx="1.5"/><path d="M1 6h12M4 9.5h3"/>
  </svg>
)

const SECTIONS: NavSection[] = [
  {
    id: 'club' as SectionId,
    label: 'LE CLUB',
    items: [
      { id: 'home',     label: 'Accueil',   subtitle: 'Tableau de bord',           href: '/dashboard',          icon: <HomeIcon />, exact: true },
      { id: 'members',  label: 'Annuaire',  subtitle: 'Membres et rendez-vous',   href: '/dashboard/members',  icon: <MembersIcon /> },
      { id: 'projects', label: 'Projets',   subtitle: 'Opportunités du club',      href: '/dashboard/projects', icon: <ProjectsIcon /> },
      { id: 'missions', label: 'Missions',  subtitle: 'À venir',                   href: '/dashboard/missions', icon: <MissionsIcon />, badge: 'soon' },
    ],
  },
  {
    id: 'outils' as SectionId,
    label: 'MES OUTILS',
    items: [
{ id: 'keyaccount', label: 'Keyaccount', subtitle: 'Cartographie tes deals',      href: '/dashboard/tools/keyaccount', icon: <KeyaccountIcon /> },
      { id: 'replique',   label: 'Réplique',   subtitle: "Génère tes scripts d'appel",  href: '/dashboard/tools/replique',   icon: <RepliqueIcon /> },
      { id: 'deallink',    label: 'DealLink',   subtitle: 'Crée des sales rooms',        href: '/dashboard/tools/deallink',   icon: <DealLinkIcon /> },
      { id: 'sidehustle',  label: 'Side Hustle', subtitle: 'Pilote ton projet perso',     href: '/dashboard/tools/sidehustle', icon: <RocketIcon /> },
    ],
  },
  {
    id: 'moi' as SectionId,
    label: 'MOI',
    items: [
      { id: 'profile',     label: 'Mon profil',  subtitle: 'Ton identité dans le club',   href: '/dashboard/profile',     icon: <ProfileIcon /> },
      { id: 'affiliation', label: 'Affiliation', subtitle: 'Parrainage et commissions',   href: '/dashboard/affiliation', icon: <AffiliationIcon /> },
      { id: 'billing',     label: 'Facturation', subtitle: 'Abonnement et paiements',     href: '/dashboard/billing',     icon: <BillingIcon /> },
    ],
  },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard/affiliation':      'Affiliation',
  '/dashboard/members':          'Annuaire',
  '/dashboard/meetings':         'Mes rencontres',
  '/dashboard/missions':         'Missions',
  '/dashboard/tools/deallink':   'DealLink',
  '/dashboard/tools/replique':   'Réplique',
  '/dashboard/tools/keyaccount':  'Keyaccount',
  '/dashboard/tools/sidehustle':  'Side Hustle',
  '/dashboard/profile':          'Mon profil',
  '/dashboard/billing':          'Facturation',
  '/dashboard/network/n1':       'Filleuls N1',
  '/dashboard/network/n2':       'Filleuls N2',
  '/dashboard/library':          'Ma bibliothèque',
  '/dashboard/projects':         'Projets',
}

const SUSPENSION_EXEMPT = ['/dashboard/profile', '/dashboard/affiliation']

interface Props { profile: Profile; children: React.ReactNode; stripeUrl?: string }

export default function DashboardShell({ profile, children, stripeUrl }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggle: toggleTheme } = useTheme()
  const initials = `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase()
  const pageTitle = PAGE_TITLES[pathname] || (pathname === '/dashboard' ? 'Accueil' : 'Dashboard')
  const [showTour, setShowTour] = useState(!profile.onboarding_completed)
  const isSuspended = profile.is_active === false && !SUSPENSION_EXEMPT.includes(pathname)

  async function handleLogout() {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface)' }}>
      {showTour && (
        <WelcomeTour
          firstName={profile.first_name ?? 'toi'}
          forceOpen={false}
          onDone={() => setShowTour(false)}
        />
      )}

      {isSuspended && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
          display: 'grid', placeItems: 'center', padding: '20px',
        }}>
          <div style={{
            background: 'var(--white)', borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)', padding: '36px 40px',
            maxWidth: '400px', width: '100%', textAlign: 'center',
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: 'var(--r-sm)',
              background: '#FEF3E2', border: '1px solid #F9CB75',
              display: 'grid', placeItems: 'center', margin: '0 auto 20px',
            }}>
              <svg width="20" height="20" viewBox="0 0 15 15" fill="none" stroke="#854F0B" strokeWidth="1.8" strokeLinecap="round">
                <path d="M7.5 1L14 13H1L7.5 1z"/><path d="M7.5 6v3.5"/><path d="M7.5 11.5v.5"/>
              </svg>
            </div>
            <div style={{
              fontFamily: 'var(--font-jost)', fontSize: '18px', fontWeight: 800,
              color: 'var(--text)', marginBottom: '10px',
            }}>
              Ton accès est suspendu
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '24px', margin: '0 0 24px' }}>
              Pour continuer à accéder au club, réactive ton abonnement en quelques secondes.
            </p>
            {stripeUrl ? (
              <a
                href={`${stripeUrl}?prefilled_email=${encodeURIComponent(profile.email ?? '')}&client_reference_id=${profile.id}`}
                style={{
                  display: 'inline-block', background: 'var(--green)', color: '#fff',
                  textDecoration: 'none', fontWeight: 700, fontSize: '14px',
                  padding: '12px 28px', borderRadius: 'var(--r-full)',
                }}
              >
                Réactiver mon accès →
              </a>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-3)', margin: 0 }}>
                Contacte-nous à{' '}
                <a href="mailto:hello@nouveauvariable.fr" style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}>
                  hello@nouveauvariable.fr
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <nav style={{ width: '240px', flexShrink: 0, background: 'var(--white)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '9px' }}>
          <img src="/nv-logo-black.png" alt="Nouveau Variable" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-jost)', fontSize: '12px', fontWeight: 700, color: 'var(--green)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Nouveau Variable</div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 500, letterSpacing: '.06em', textTransform: 'uppercase', marginTop: '1px' }}>Espace membre</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '8px 0' }}>
          {SECTIONS.map(section => (
            <div key={section.id}>
              <div style={{ padding: '16px 20px 4px', fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
                {section.label}
              </div>
              {section.items.map(item => {
                const isActive = item.exact ? pathname === item.href : (pathname === item.href || pathname.startsWith(item.href + '/'))
                return (
                  <Link key={item.href} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    padding: '8px 12px', margin: '1px 8px', borderRadius: 'var(--r-sm)',
                    fontSize: '13px', fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--green)' : 'var(--text-2)',
                    background: isActive ? 'var(--green-3)' : 'transparent',
                    textDecoration: 'none', transition: '.14s', position: 'relative',
                  }}>
                    {isActive && (
                      <span style={{ position: 'absolute', left: '-8px', top: '50%', transform: 'translateY(-50%)', width: '3px', height: '16px', background: 'var(--green)', borderRadius: '0 3px 3px 0' }} />
                    )}
                    <span style={{ opacity: isActive ? 1 : 0.6, display: 'flex', flexShrink: 0 }}>
                      {item.icon}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{item.label}</span>
                        {item.badge === 'soon' && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
                            color: 'var(--text-3)', background: 'var(--surface)',
                            border: '1px solid var(--border)', borderRadius: 'var(--r-full)',
                            padding: '2px 6px', marginLeft: 'auto', flexShrink: 0,
                          }}>
                            Bientôt
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <span style={{ fontSize: '10px', color: isActive ? 'var(--green)' : 'var(--text-3)', fontStyle: 'italic', lineHeight: 1.2, opacity: 0.8 }}>
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* Theme toggle */}
        <div style={{ padding: '8px 12px 0', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={toggleTheme}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 10px', borderRadius: 'var(--r-sm)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              cursor: 'pointer', transition: '.14s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.background = 'var(--green-3)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
          >
            {theme === 'dark' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', flex: 1, textAlign: 'left' }}>
              {theme === 'dark' ? 'Mode sombre' : 'Mode clair'}
            </span>
            <div style={{
              width: '32px', height: '18px', borderRadius: '9px', flexShrink: 0,
              background: theme === 'dark' ? 'var(--green)' : 'var(--border)',
              position: 'relative', transition: 'background .2s',
            }}>
              <div style={{
                width: '12px', height: '12px', borderRadius: '50%', background: '#fff',
                position: 'absolute', top: '3px',
                left: theme === 'dark' ? '17px' : '3px', transition: 'left .2s',
              }} />
            </div>
          </button>
        </div>

        {/* User card */}
        <div style={{ padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px', borderRadius: 'var(--r-md)' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: 'var(--r-sm)', background: 'var(--green)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-jost)', fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.first_name} {profile.last_name}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'capitalize' }}>{profile.rank}</div>
            </div>
            <button onClick={handleLogout} title="Déconnexion" style={{ fontSize: '14px', color: 'var(--text-3)', padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}>↩</button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 28px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30, flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-jost)', fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{pageTitle}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {profile.tokens_balance !== undefined && (
              <TokenBalance balance={profile.tokens_balance} />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--green-3)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-sm)', padding: '5px 11px' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" fill="var(--green)"/></svg>
              <span style={{ fontFamily: 'var(--font-jost)', fontSize: '13px', fontWeight: 700, color: 'var(--green)' }}>{profile.points_balance}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-2)', fontWeight: 500 }}>pts</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '28px', overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
