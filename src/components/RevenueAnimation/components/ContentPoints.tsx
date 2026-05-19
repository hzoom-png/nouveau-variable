'use client'

import { motion, MotionValue } from 'framer-motion'
import { CONTENT_POINTS } from '../constants'

const ICONS = ['🛠️', '🎯', '🤝', '💚']

interface ContentPointsProps {
  opacities: MotionValue<number>[]
  isMobile?: boolean             // stacked column (Mobile.tsx bar chart)
  position?: 'right' | 'bottom' // desktop-right ou mobile-bottom overlay
}

export function ContentPoints({ opacities, isMobile = false, position = 'right' }: ContentPointsProps) {
  // Stacked column — Mobile.tsx bar chart (conservé pour compatibilité)
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

  // Bottom overlay — Desktop animation on mobile (< 1024px)
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

  // Default — absolute right (desktop ≥ 1024px)
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
  pt, icon, compact = false,
}: {
  pt: typeof CONTENT_POINTS[number]
  icon: string
  compact?: boolean
}) {
  return (
    <div style={{
      background: 'rgba(10,26,20,0.88)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(54,166,79,0.35)',
      borderRadius: compact ? 12 : 14,
      padding: compact ? '12px 16px' : '18px 22px',
      maxWidth: 300,
      boxShadow: '0 4px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(54,166,79,0.1)',
    }}>
      <div style={{ fontSize: compact ? 18 : 22, marginBottom: compact ? 6 : 10 }}>{icon}</div>
      <h3 style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 400,
        fontSize: compact ? 14 : 15,
        color: '#ffffff',
        marginBottom: compact ? 4 : 6,
        lineHeight: 1.3,
        margin: `0 0 ${compact ? 4 : 6}px`,
      }}>
        {pt.title}
      </h3>
      <p style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: compact ? 12 : 13,
        color: 'rgba(255,255,255,0.72)',
        lineHeight: 1.6,
        margin: 0,
      }}>
        {pt.desc}
      </p>
      <div style={{
        marginTop: compact ? 8 : 12,
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
          fontSize: 10,
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
