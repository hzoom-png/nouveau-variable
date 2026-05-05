'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const C = {
  bg:     '#111D18',
  green:  '#2F5446',
  text:   '#F7FAF8',
  text2:  '#4B6358',
  border: 'rgba(255,255,255,0.07)',
}

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="6" height="6" rx="1"/>
      <rect x="9" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="9" width="6" height="6" rx="1"/>
      <rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2.5"/>
      <path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5"/>
      <path d="M11.5 4a2 2 0 0 1 0 4M15 14c0-2.21-1.57-4.07-3.5-4.5"/>
    </svg>
  )
}

function IconFileCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6L9 1z"/>
      <polyline points="9 1 9 6 14 6"/>
      <polyline points="5 10 7 12 11 8"/>
    </svg>
  )
}

function IconLink() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 9a4 4 0 0 0 5.66 0l2-2a4 4 0 0 0-5.66-5.66L7.66 3"/>
      <path d="M9 7a4 4 0 0 0-5.66 0l-2 2a4 4 0 0 0 5.66 5.66L4.34 13"/>
    </svg>
  )
}

function IconEuro() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="7"/>
      <path d="M10.5 5.5A3.5 3.5 0 1 0 10.5 10.5"/>
      <line x1="4.5" y1="8" x2="9.5" y2="8"/>
      <line x1="4.5" y1="9.5" x2="8.5" y2="9.5"/>
    </svg>
  )
}

function IconActivity() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 9 4 5 7 8 10 4 13 7 15 5"/>
    </svg>
  )
}

function IconMegaphone() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3L3 7v2l10 4V3z"/>
      <path d="M3 7H1.5a1.5 1.5 0 0 0 0 3H3"/>
      <path d="M5 13.5c.5 1 1 1.5 2 1.5"/>
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="12" rx="2"/>
      <line x1="1" y1="7" x2="15" y2="7"/>
      <line x1="5" y1="1" x2="5" y2="5"/>
      <line x1="11" y1="1" x2="11" y2="5"/>
    </svg>
  )
}

const NAV = [
  {
    group: 'PILOTAGE',
    items: [
      { href: '/admin/dashboard',    label: 'Dashboard KPIs',     Icon: IconGrid },
      { href: '/admin/membres',      label: 'Membres',            Icon: IconUsers },
      { href: '/admin/candidatures', label: 'Candidatures',       Icon: IconFileCheck, badge: true },
    ],
  },
  {
    group: 'FINANCE',
    items: [
      { href: '/admin/affiliations', label: 'Affiliations',       Icon: IconLink },
      { href: '/admin/commissions',  label: 'Commissions',        Icon: IconEuro },
    ],
  },
  {
    group: 'COMMUNICATION',
    items: [
      { href: '/admin/broadcast',    label: 'Broadcast',          Icon: IconMegaphone },
      { href: '/admin/evenements',   label: 'Événements',         Icon: IconCalendar },
    ],
  },
  {
    group: 'SÉCURITÉ',
    items: [
      { href: '/admin/activite',     label: 'Activité',           Icon: IconActivity },
    ],
  },
]

export function AdminSidebar() {
  const pathname    = usePathname()
  const router      = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetch('/api/admin/candidatures/list?status=received')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPendingCount(d.candidatures?.length ?? 0) })
      .catch(() => {})
  }, [])

  async function logout() {
    setLoggingOut(true)
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <aside style={{
      width: '240px', minHeight: '100vh', flexShrink: 0,
      background: C.bg,
      borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Image src="/nv-logo-white.png" alt="NV" width={28} height={28} style={{ objectFit: 'contain' }} />
        <span style={{ fontSize: 11, color: C.text2, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {NAV.map(group => (
          <div key={group.group} style={{ marginBottom: 8 }}>
            <p style={{
              fontSize: 9, fontWeight: 700, color: C.text2,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              padding: '0 20px', marginBottom: 4,
            }}>
              {group.group}
            </p>
            {group.items.map(item => {
              const active = pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 20px',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? C.text : C.text2,
                  background: active ? 'rgba(47,84,70,0.18)' : 'transparent',
                  textDecoration: 'none',
                  borderLeft: `2px solid ${active ? C.green : 'transparent'}`,
                  transition: 'all .15s',
                }}>
                  <span style={{ color: active ? C.green : C.text2, flexShrink: 0 }}>
                    <item.Icon />
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && pendingCount > 0 && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, minWidth: 16, height: 16,
                      background: '#E05252', color: '#fff', borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 4px',
                    }}>
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 20px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>Gaultier H.</p>
        <button
          onClick={logout}
          disabled={loggingOut}
          style={{
            fontSize: 11, color: C.text2, background: 'none', border: 'none',
            cursor: loggingOut ? 'wait' : 'pointer', padding: 0, fontFamily: 'inherit',
          }}
        >
          {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
        </button>
      </div>
    </aside>
  )
}
