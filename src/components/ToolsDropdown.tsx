'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ToolsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M7.5 2.5L9.5 4.5M2 7.5c-.8.8-1.5 2-1.5 3 0 2.5 2 4.5 4.5 4.5s4-2 4-4.5c0-1-.7-2.2-1.5-3M13 2l-2 2M12.5 9.5l1.5 1.5"/>
  </svg>
)

const tools = [
  { name: 'Keyaccount', href: '/dashboard/tools/keyaccount', icon: '🎯' },
  { name: 'Deallink', href: '/dashboard/tools/deallink', icon: '🔗' },
  { name: 'Réplique', href: '/dashboard/tools/replique', icon: '📋' },
  { name: 'Side Hustle', href: '/dashboard/tools/sidehustle', icon: '🚀' },
]

export function ToolsDropdown() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isToolsActive = tools.some(tool => pathname.includes(tool.href))

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
          color: isToolsActive ? 'var(--green)' : 'var(--text-3)',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '10px', fontWeight: isToolsActive ? 600 : 500,
          padding: '8px 0', opacity: isToolsActive ? 1 : 0.6,
          transition: 'all 0.15s ease',
        }}
        title="Outils"
      >
        <div><ToolsIcon /></div>
        <span>Outils</span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          style={{
            position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
            marginBottom: '12px', background: 'var(--white)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50,
            minWidth: '200px', overflow: 'hidden',
          }}
        >
          {tools.map((tool) => {
            const isActive = pathname.includes(tool.href)
            return (
              <Link
                key={tool.name}
                href={tool.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 16px',
                  fontSize: '13px', fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--green)' : 'var(--text-2)',
                  background: isActive ? 'var(--green-3)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  borderBottom: tool.name !== tools[tools.length - 1].name ? '1px solid var(--border)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--surface)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <span>{tool.icon}</span>
                <span>{tool.name}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
          }}
        />
      )}
    </div>
  )
}
