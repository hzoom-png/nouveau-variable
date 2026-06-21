'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const DISMISS_KEY = 'nv_onboarding_banner_dismissed_at'
const DISMISS_TTL_H = 24

interface Props {
  percentComplete: number
  missingCount: number
}

export function OnboardingBanner({ percentComplete, missingCount }: Props) {
  // Commence caché pour éviter flash SSR → client
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY)
      if (!raw) { setVisible(true); return }
      const hoursElapsed = (Date.now() - Number(raw)) / 3_600_000
      if (hoursElapsed > DISMISS_TTL_H) {
        localStorage.removeItem(DISMISS_KEY)
        setVisible(true)
      }
    } catch {
      setVisible(true) // Safari private, etc.
    }
  }, [])

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* noop */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef9c3 100%)',
      border: '1px solid #fcd34d',
      borderLeft: '4px solid #f59e0b',
      borderRadius: 12,
      padding: '16px 20px',
      marginBottom: 24,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      {/* Texte */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: 14,
          color: '#92400e', margin: '0 0 10px',
        }}>
          ⚡ Complète ton profil pour débloquer tous les outils
        </p>

        {/* Barre progression */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            flex: 1, maxWidth: 200, height: 6, borderRadius: 99,
            background: '#fde68a', overflow: 'hidden',
          }}>
            <div style={{
              width: `${percentComplete}%`, height: '100%',
              background: '#d97706', borderRadius: 99,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <span style={{
            fontFamily: 'var(--font-inter)', fontSize: 12, fontWeight: 500,
            color: '#b45309', whiteSpace: 'nowrap',
          }}>
            {percentComplete}% · {missingCount} champ{missingCount > 1 ? 's' : ''} restant{missingCount > 1 ? 's' : ''}
          </span>
        </div>

        <p style={{
          fontFamily: 'var(--font-inter)', fontSize: 12, color: '#b45309',
          margin: 0, lineHeight: 1.5,
        }}>
          Réplique, Deallink, Missions et Annuaire seront déverrouillés une fois terminé.
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Link
          href="/dashboard/profile?step=1"
          style={{
            fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: 13,
            color: '#fff', background: '#d97706',
            padding: '8px 16px', borderRadius: 8,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Aller au profil →
        </Link>
        <button
          onClick={dismiss}
          aria-label="Fermer"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#b45309', fontSize: 18, lineHeight: 1,
            padding: '4px 6px', borderRadius: 6,
            fontFamily: 'var(--font-inter)',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
