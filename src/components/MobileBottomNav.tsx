'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ToolsDropdown } from './ToolsDropdown'

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.5 6.5L7.5 1.5l6 5V13a1 1 0 01-1 1h-3v-3.5H5.5V14h-3a1 1 0 01-1-1V6.5z"/>
  </svg>
)
const MembersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="5.5" cy="4.5" r="2.5"/><path d="M1 13c0-2.5 2-4.5 4.5-4.5S10 10.5 10 13"/>
    <circle cx="11.5" cy="5.5" r="2"/><path d="M14 13c0-2-1.3-3.5-3-4"/>
  </svg>
)
const ToolsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M7.5 2.5L9.5 4.5M2 7.5c-.8.8-1.5 2-1.5 3 0 2.5 2 4.5 4.5 4.5s4-2 4-4.5c0-1-.7-2.2-1.5-3M13 2l-2 2M12.5 9.5l1.5 1.5"/>
  </svg>
)
const ProfileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="7.5" cy="5" r="3"/><path d="M1.5 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
  </svg>
)
const MenuIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M2 3h11M2 7.5h11M2 12h11"/>
  </svg>
)

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Accueil', href: '/dashboard', icon: <HomeIcon /> },
  { label: 'Annuaire', href: '/dashboard/members', icon: <MembersIcon /> },
  { label: 'Profil', href: '/dashboard/profile', icon: <ProfileIcon /> },
]

interface Props {
  onMenuClick: () => void
}

export function MobileBottomNav({ onMenuClick }: Props) {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: '60px', background: 'var(--white)',
      borderTop: '1px solid var(--border)', zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
    }}>
      {NAV_ITEMS.map(item => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link key={item.href} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            color: isActive ? 'var(--green)' : 'var(--text-3)',
            textDecoration: 'none', flex: 1, padding: '8px 0',
            fontSize: '10px', fontWeight: isActive ? 600 : 500,
          }}>
            <div style={{ opacity: isActive ? 1 : 0.6 }}>
              {item.icon}
            </div>
            <span>{item.label}</span>
          </Link>
        )
      })}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <ToolsDropdown />
      </div>
      <button onClick={onMenuClick} style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
        color: 'var(--text-3)', background: 'none', border: 'none',
        cursor: 'pointer', flex: 1, padding: '8px 0', fontSize: '10px', fontWeight: 500,
      }}>
        <div style={{ opacity: 0.6 }}>
          <MenuIcon />
        </div>
        <span>Menu</span>
      </button>
    </nav>
  )
}
