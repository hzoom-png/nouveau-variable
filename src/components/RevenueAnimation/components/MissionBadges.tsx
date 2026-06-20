'use client'

import { useMemo } from 'react'
import { motion, MotionValue, useTransform } from 'framer-motion'

const MISSIONS = ["Closing", "Apport d'affaires", "Freelance", "Conseil", "Formation", "Affiliation"]

// Desktop: 6 positions in a circle around the center card
// Card occupies ~27-73% H, ~40-60% V on desktop
const DESKTOP_POSITIONS = [
  { left: '12%', top: '15%' },   // top-left
  { left: '50%', top: '9%'  },   // top
  { left: '85%', top: '20%' },   // top-right
  { left: '88%', top: '50%' },   // right
  { left: '80%', top: '78%' },   // bottom-right
  { left: '14%', top: '76%' },   // bottom-left
]

// Mobile: above and below the card (card ≈ 6-94% H, 43-63% V)
const MOBILE_POSITIONS = [
  { left: '16%', top: '11%' },
  { left: '50%', top: '11%' },
  { left: '82%', top: '11%' },
  { left: '16%', top: '80%' },
  { left: '50%', top: '80%' },
  { left: '82%', top: '80%' },
]

interface Props {
  opacity: MotionValue<number>
  progress: MotionValue<number>
  isMobile?: boolean
  fadeInStart: number
  fadeInEnd: number
}

export function MissionBadges({ opacity, progress, isMobile = false, fadeInStart, fadeInEnd }: Props) {
  const blurRaw = useTransform(progress, [fadeInStart, fadeInEnd], [10, 0])
  const filter  = useTransform(blurRaw, v => `blur(${Math.max(0, v).toFixed(1)}px)`)

  if (isMobile) return null

  const positions = DESKTOP_POSITIONS

  const pill: React.CSSProperties = {
    padding:      isMobile ? '5px 13px' : '8px 18px',
    borderRadius: '99px',
    background:   'rgba(47, 84, 70, 0.08)',
    border:       '1.5px solid #2F5446',
    color:        '#2F5446',
    fontFamily:   "'Inter', system-ui, sans-serif",
    fontSize:     isMobile ? '10px' : '13px',
    fontWeight:   600,
    letterSpacing: '0.02em',
    whiteSpace:   'nowrap',
    boxShadow:    '0 2px 12px rgba(47, 84, 70, 0.12)',
    backdropFilter: 'blur(4px)',
  }

  return (
    <>
      {MISSIONS.map((label, i) => {
        const pos = positions[i]
        return (
          <motion.div
            key={label}
            style={{
              position:     'absolute',
              left:         pos.left,
              top:          pos.top,
              transform:    'translateX(-50%)',
              opacity,
              filter,
              pointerEvents: 'none',
              zIndex:       4,
            }}
          >
            <div style={pill}>{label}</div>
          </motion.div>
        )
      })}
    </>
  )
}
