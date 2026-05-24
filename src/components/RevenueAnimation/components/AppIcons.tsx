'use client'

import { motion, MotionValue, useTransform } from 'framer-motion'

const SPREAD_START = 0.696
const SPREAD_END   = 0.716

// Approximate half-height of the p0 PointCard (large variant ~160px)
const CARD_HALF_H = 80
const GAP = 24

const APPS = [
  { id: 'ka', label: 'Keyaccount'  },
  { id: 'dl', label: 'Deallink'    },
  { id: 'rp', label: 'Réplique'    },
  { id: 'sh', label: 'Side Hustle' },
]

interface AppIconsProps {
  opacity:  MotionValue<number>
  progress: MotionValue<number>
  isMobile?: boolean
}

export function AppIcons({ opacity, progress }: AppIconsProps) {
  const y = useTransform(progress, [SPREAD_START, SPREAD_END], [40, 0])

  return (
    <div style={{
      position: 'absolute',
      top: `calc(50% + ${CARD_HALF_H + GAP}px)`,
      left: '50%',
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
      zIndex: 3,
    }}>
      <motion.div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        // Responsive gap: 10px at 320px → 32px at 1067px+
        gap: 'clamp(10px, 3vw, 32px)',
        opacity,
        y,
      }}>
        {APPS.map((app) => (
          <IconItem key={app.id} id={app.id} label={app.label} />
        ))}
      </motion.div>
    </div>
  )
}

function IconItem({ id, label }: { id: string; label: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'clamp(6px, 1.5vw, 10px)',
    }}>
      <div style={{
        // Responsive icon: 60px at 300px screen → 90px at 450px+
        width:  'clamp(60px, 20vw, 90px)',
        height: 'clamp(60px, 20vw, 90px)',
        flexShrink: 0,
        background: '#36a64f',
        borderRadius: 'clamp(10px, 3vw, 14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(54,166,79,0.20)',
      }}>
        {/* SVG scales to 55% of container so it stays proportional */}
        <AppSVG id={id} />
      </div>
      <span style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 'clamp(9px, 2.5vw, 12px)',
        fontWeight: 500,
        color: '#0F1C17',
        letterSpacing: '.02em',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </div>
  )
}

function AppSVG({ id }: { id: string }) {
  // width/height 55% of parent so it scales with the clamp'd icon-bg
  const s = '55%'
  if (id === 'ka') return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="22" r="10" fill="white"/>
      <circle cx="20" cy="74" r="10" fill="white"/>
      <circle cx="80" cy="74" r="10" fill="white"/>
      <line x1="50" y1="22" x2="20" y2="74" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <line x1="50" y1="22" x2="80" y2="74" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <line x1="20" y1="74" x2="80" y2="74" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
  if (id === 'dl') return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none">
      <rect x="10" y="35" width="26" height="30" rx="9" stroke="white" strokeWidth="3.5"/>
      <rect x="64" y="35" width="26" height="30" rx="9" stroke="white" strokeWidth="3.5"/>
      <line x1="36" y1="50" x2="64" y2="50" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
    </svg>
  )
  if (id === 'rp') return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="white">
      <path d="M 14 18 Q 14 12 20 12 L 80 12 Q 86 12 86 18 L 86 56 Q 86 62 80 62 L 44 62 L 32 80 L 38 62 L 20 62 Q 14 62 14 56 Z"/>
    </svg>
  )
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="white">
      <path d="M 50 8 C 34 8 26 24 26 44 L 74 44 C 74 24 66 8 50 8 Z"/>
      <rect x="26" y="44" width="48" height="6" rx="2"/>
      <path d="M 26 46 L 14 68 L 34 60 Z"/>
      <path d="M 74 46 L 86 68 L 66 60 Z"/>
      <circle cx="50" cy="34" r="9" fill="rgba(0,0,0,0.18)"/>
      <ellipse cx="50" cy="54" rx="11" ry="5" opacity="0.35"/>
    </svg>
  )
}
