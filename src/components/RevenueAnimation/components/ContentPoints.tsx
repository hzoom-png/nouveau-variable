'use client'

import { motion, MotionValue } from 'framer-motion'
import { CONTENT_POINTS } from '../constants'

const ICONS = ['🛠️', '🎯', '🤝', '💚']

interface ContentPointsProps {
  opacities: MotionValue<number>[]
  isMobile?: boolean
  position?: 'right' | 'bottom' | 'center'
}

export function ContentPoints({ opacities, isMobile = false, position = 'right' }: ContentPointsProps) {
  // Centered — one card at a time, graph already gone
  if (position === 'center') {
    return (
      <>
        {CONTENT_POINTS.map((pt, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: isMobile ? 'min(88vw, 340px)' : 'min(88vw, 480px)',
              opacity: opacities[i],
              pointerEvents: 'none',
              zIndex: 3,
            }}
          >
            <PointCard pt={pt} icon={ICONS[i]} large={!isMobile} />
          </motion.div>
        ))}
      </>
    )
  }

  // Stacked column (legacy)
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {CONTENT_POINTS.map((pt, i) => (
          <motion.div key={i} style={{ opacity: opacities[i] }}>
            <PointCard pt={pt} icon={ICONS[i]} />
          </motion.div>
        ))}
      </div>
    )
  }

  // Bottom overlay (legacy)
  if (position === 'bottom') {
    return (
      <>
        {CONTENT_POINTS.map((pt, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(88vw, 320px)',
              opacity: opacities[i],
              pointerEvents: 'none',
              zIndex: 3,
            }}
          >
            <PointCard pt={pt} icon={ICONS[i]} compact />
          </motion.div>
        ))}
      </>
    )
  }

  // Right panel (legacy desktop)
  return (
    <>
      {CONTENT_POINTS.map((pt, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            right: 'clamp(24px, 5vw, 60px)',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: opacities[i],
            pointerEvents: 'none',
          }}
        >
          <PointCard pt={pt} icon={ICONS[i]} />
        </motion.div>
      ))}
    </>
  )
}

function PointCard({
  pt, icon, compact = false, large = false,
}: {
  pt: typeof CONTENT_POINTS[number]
  icon: string
  compact?: boolean
  large?: boolean
}) {
  const pad    = large ? '28px 32px' : compact ? '12px 16px' : '18px 22px'
  const radius = large ? 20 : compact ? 12 : 14
  const iconSz = large ? 32 : compact ? 18 : 22
  const iconMb = large ? 14 : compact ? 6 : 10
  const titleSz = large ? 22 : compact ? 14 : 15
  const titleMb = large ? 12 : compact ? 4 : 6
  const descSz  = large ? 15 : compact ? 12 : 13
  const dotMt   = large ? 18 : compact ? 8 : 12
  const tagSz   = large ? 11 : 10

  return (
    <div style={{
      background: 'rgba(10,26,20,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(54,166,79,0.35)',
      borderRadius: radius,
      padding: pad,
      boxShadow: '0 8px 48px rgba(0,0,0,0.28), 0 0 0 1px rgba(54,166,79,0.1)',
    }}>
      <div style={{ fontSize: iconSz, marginBottom: iconMb }}>{icon}</div>
      <h3 style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 400,
        fontSize: titleSz,
        color: '#ffffff',
        lineHeight: 1.3,
        margin: `0 0 ${titleMb}px`,
      }}>
        {pt.title}
      </h3>
      <p style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: descSz,
        color: 'rgba(255,255,255,0.72)',
        lineHeight: 1.6,
        margin: 0,
      }}>
        {pt.desc}
      </p>
      <div style={{
        marginTop: dotMt,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <div style={{
          width: 5, height: 5, borderRadius: '50%',
          background: '#36a64f',
          boxShadow: '0 0 6px #36a64f',
        }} />
        <span style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: tagSz,
          color: '#36a64f',
          fontWeight: 600,
          letterSpacing: '.04em',
        }}>
          Nouveau Variable
        </span>
      </div>
    </div>
  )
}
