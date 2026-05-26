'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Profile } from '@/lib/types'

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
  id: string
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
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M2 2l11 11M13 2L2 13"/>
  </svg>
)

const SECTIONS: NavSection[] = [
  {
    id: 'club',
    label: 'LE CLUB',
    items: [
      { id: 'home',     label: 'Accueil',   subtitle: 'Tableau de bord',           href: '/dashboard',          icon: <HomeIcon />, exact: true },
      { id: 'members',  label: 'Annuaire',  subtitle: 'Membres et rendez-vous',   href: '/dashboard/members',  icon: <MembersIcon /> },
      { id: 'projects', label: 'Projets',   subtitle: 'Opportunités du club',      href: '/dashboard/projects', icon: <ProjectsIcon /> },
      { id: 'missions', label: 'Missions',  subtitle: 'À venir',                   href: '/dashboard/missions', icon: <MissionsIcon />, badge: 'soon' },
    ],
  },
  {
    id: 'outils',
    label: 'MES OUTILS',
    items: [
      { id: 'keyaccount', label: 'Keyaccount', subtitle: 'Cartographie tes deals',      href: '/dashboard/tools/keyaccount', icon: <KeyaccountIcon /> },
      { id: 'replique',   label: 'Réplique',   subtitle: "Génère tes scripts d'appel",  href: '/dashboard/tools/replique',   icon: <RepliqueIcon /> },
      { id: 'deallink',    label: 'DealLink',   subtitle: 'Crée des sales rooms',        href: '/dashboard/tools/deallink',   icon: <DealLinkIcon /> },
      { id: 'sidehustle',  label: 'Side Hustle', subtitle: 'Pilote ton projet perso',     href: '/dashboard/tools/sidehustle', icon: <RocketIcon /> },
    ],
  },
  {
    id: 'moi',
    label: 'MOI',
    items: [
      { id: 'profile',     label: 'Mon profil',  subtitle: 'Ton identité dans le club',   href: '/dashboard/profile',     icon: <ProfileIcon /> },
      { id: 'affiliation', label: 'Affiliation', subtitle: 'Parrainage et commissions',   href: '/dashboard/affiliation', icon: <AffiliationIcon /> },
      { id: 'billing',     label: 'Facturation', subtitle: 'Abonnement et paiements',     href: '/dashboard/billing',     icon: <BillingIcon /> },
    ],
  },
]

interface Props {
  profile: Profile
  isOpen: boolean
  onClose: () => void
}

export function DrawerSidebar({ profile, isOpen, onClose }: Props) {
  const pathname = usePathname()
  const initials = `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase()

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 45, display: 'flex'
          }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: '280px',
        background: 'var(--white)', borderRight: '1px solid var(--border)',
        zIndex: 50, overflowY: 'auto',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-out',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', fontWeight: 600, color: 'var(--green)', letterSpacing: '.05em', textTransform: 'uppercase' }}>NV</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)' }}>
            <CloseIcon />
          </button>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '8px 0' }}>
          {SECTIONS.map(section => (
            <div key={section.id}>
              <div style={{ padding: '12px 16px 4px', fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
                {section.label}
              </div>
              {section.items.map(item => {
                const isActive = item.exact ? pathname === item.href : (pathname === item.href || pathname.startsWith(item.href + '/'))
                return (
                  <Link key={item.href} href={item.href} onClick={onClose} style={{
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
                      <span>{item.label}</span>
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

        {/* User card */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px', borderRadius: 'var(--r-md)' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: 'var(--r-sm)', background: 'var(--green)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 600, color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.first_name} {profile.last_name}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
