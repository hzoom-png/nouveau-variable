'use client'

import type { Project } from '../types'

interface Props {
  matches: Project[]
  onScrollToMatch: () => void
}

export function ProjectMatchBanner({ matches, onScrollToMatch }: Props) {
  if (!matches.length) return null

  return (
    <div
      onClick={onScrollToMatch}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 20px', borderRadius: 'var(--r-md)',
        background: 'var(--green-3)', border: '1.5px solid var(--green-4)',
        marginBottom: '24px', cursor: 'pointer', transition: '.15s',
      }}
      className="project-match-banner"
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: 'var(--r-sm)', background: 'var(--green)',
        display: 'grid', placeItems: 'center', flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
          <path d="M13 3L6 10 3 7"/>
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--green)' }}>
          {matches.length} projet{matches.length > 1 ? 's' : ''} correspondent à votre profil
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
          Basé sur vos secteurs et votre rôle — cliquez pour voir
        </div>
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round">
        <path d="M6 4l4 4-4 4"/>
      </svg>
    </div>
  )
}
