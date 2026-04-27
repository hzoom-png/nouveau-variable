'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { NvLogo } from '@/components/NvLogo'
import { TokenBalance } from '@/components/TokenBalance'
import type { CommercialContext } from '@/lib/types'

const NAV = [
  {
    section: 'MOI',
    items: [
      { label: 'Mon profil', href: '/dashboard/profile', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="7.5" cy="5" r="3"/><path d="M1.5 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg> },
      { label: 'Ma bibliothèque', href: '/dashboard/library', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 1.5h9v12L7.5 11 3 13.5V1.5z"/></svg> },
      { label: 'Mon contexte', href: '/dashboard/settings', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="7.5" cy="7.5" r="2.5"/><path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.9 2.9l1.06 1.06M11.04 11.04l1.06 1.06M2.9 12.1l1.06-1.06M11.04 3.96l1.06-1.06"/></svg> },
      { label: 'Mon affiliation', href: '/dashboard/affiliation', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7.5 1v13M1 7.5h13"/><circle cx="7.5" cy="7.5" r="6"/></svg> },
      { label: 'Facturation', href: '/dashboard/billing', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7.5 1v13M4 4.5h4.5a2.5 2.5 0 010 5H4a2.5 2.5 0 000 5H11"/></svg> },
    ],
  },
  {
    section: 'MES OUTILS',
    items: [
      { label: 'Keyaccount', subtitle: 'Cartographie tes deals stratégiques', href: '/dashboard/tools/keyaccount', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="7.5" cy="4" r="2.5"/><circle cx="2.5" cy="12" r="1.5"/><circle cx="12.5" cy="12" r="1.5"/><path d="M7.5 6.5v3M5 11L3 12M10 11l2 12"/></svg> },
      { label: 'DealLink', subtitle: 'Crée des sales rooms personnalisées', href: '/dashboard/tools/deallink', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8.5 3.5l3 3-6 6-3-3 6-6z"/><path d="M11.5 6.5l1.5 1.5a2.1 2.1 0 010 3L12 12"/><path d="M3.5 8.5L2 7a2.1 2.1 0 010-3L3 3"/></svg> },
      { label: 'Réplique', subtitle: "Génère tes scripts d'appel", href: '/dashboard/tools/replique', icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="3" width="12" height="8" rx="1.5"/><path d="M4 7h6M4 9.5h4"/><path d="M5 3V2M9 3V2"/></svg> },
      { label: 'Terrain', subtitle: 'Enrichis tes listes de prospects', href: '/dashboard/tools/terrain', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7" strokeDasharray="3 2"/><circle cx="12" cy="12" r="11" strokeDasharray="2 3"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/></svg> },
    ],
  },
  {
    section: 'LE CLUB',
    items: [
      { label: 'Annuaire', href: '/dashboard/members', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="5.5" cy="4.5" r="2.5"/><path d="M1 13c0-2.5 2-4.5 4.5-4.5S10 10.5 10 13"/><circle cx="11.5" cy="5.5" r="2"/><path d="M14 13c0-2-1.3-3.5-3-4"/></svg> },
      { label: 'Mes rencontres', href: '/dashboard/meetings', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="3" width="13" height="11" rx="1.5"/><path d="M5 1v2M10 1v2M1 7h13"/></svg> },
    ],
  },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard/affiliation': 'Mon affiliation',
  '/dashboard/members': 'Annuaire',
  '/dashboard/meetings': 'Mes rencontres',
  '/dashboard/tools/deallink': 'DealLink',
  '/dashboard/tools/replique': 'Réplique',
  '/dashboard/tools/keyaccount': 'Keyaccount',
  '/dashboard/tools/terrain': 'Terrain',
  '/dashboard/settings': 'Mon contexte',
  '/dashboard/profile': 'Mon profil',
  '/dashboard/billing': 'Facturation',
  '/dashboard/network/n1': 'Filleuls N1',
  '/dashboard/network/n2': 'Filleuls N2',
  '/dashboard/library': 'Ma bibliothèque',
}



interface Props { profile: Profile; children: React.ReactNode }

export default function DashboardShell({ profile, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const initials = `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase()
  const pageTitle = PAGE_TITLES[pathname] || 'Dashboard'

  const ctx = profile.commercial_context as CommercialContext | undefined
  const hasContext = !!(ctx?.product && ctx?.icp)

  async function handleLogout() {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface)' }}>
      {/* Sidebar */}
      <nav style={{ width: '240px', flexShrink: 0, background: 'var(--white)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '9px' }}>
          <NvLogo size={28} />
          <div>
            <div style={{ fontFamily: 'var(--font-jost)', fontSize: '12px', fontWeight: 700, color: 'var(--green)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Nouveau Variable</div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 500, letterSpacing: '.06em', textTransform: 'uppercase', marginTop: '1px' }}>Espace membre</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '8px 0' }}>
          {NAV.map(group => (
            <div key={group.section}>
              <div style={{ padding: '16px 20px 4px', fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
                {group.section}
              </div>
              {group.items.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const isSettings = item.href === '/dashboard/settings'
                const isProfile = item.href === '/dashboard/profile'
                const showPulse = isSettings && !hasContext
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
                    <span style={{ opacity: isActive ? 1 : 0.6, display: 'flex', position: 'relative', flexShrink: 0 }}>
                      {item.icon}
                      {showPulse && (
                        <span style={{ position: 'absolute', top: '-3px', right: '-3px', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--amber)', animation: 'pulse 1.8s ease-in-out infinite' }} />
                      )}
                    </span>
                    {'subtitle' in item && item.subtitle ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span>{item.label}</span>
                        <span style={{ fontSize: '10px', color: isActive ? 'var(--green)' : 'var(--text-3)', fontStyle: 'italic', lineHeight: 1.2, opacity: 0.8 }}>{item.subtitle}</span>
                      </div>
                    ) : item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* User card */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px', borderRadius: 'var(--r-md)', cursor: 'pointer' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: 'var(--r-sm)', background: 'var(--green)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-jost)', fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.first_name} {profile.last_name}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'capitalize' }}>{profile.rank}</div>
            </div>
            <button onClick={handleLogout} title="Déconnexion" style={{ fontSize: '14px', color: 'var(--text-3)', padding: '4px', cursor: 'pointer' }}>↩</button>
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
