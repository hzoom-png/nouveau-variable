'use client'

import { motion, MotionValue } from 'framer-motion'
import { CONTENT_POINTS } from '../constants'

const ICONS = ['🛠️', '🎯', '🤝', '💚']

interface ContentPointsProps {
  opacities: MotionValue<number>[]
  isMobile?: boolean
}

export function ContentPoints({ opacities, isMobile = false }: ContentPointsProps) {
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {CONTENT_POINTS.map((pt, i) => (
          <motion.div
            key={i}
            style={{ opacity: opacities[i] }}
          >
            <PointCard pt={pt} icon={ICONS[i]} />
          </motion.div>
        ))}
      </div>
    )
  }

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

function PointCard({ pt, icon }: { pt: typeof CONTENT_POINTS[number]; icon: string }) {
  return (
    <div style={{
      background: 'rgba(10,26,20,0.82)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(54,166,79,0.35)',
      borderRadius: 14,
      padding: '18px 22px',
      maxWidth: 300,
      boxShadow: '0 4px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(54,166,79,0.1)',
    }}>
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <h3 style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 400,
        fontSize: 15,
        color: '#ffffff',
        marginBottom: 6,
        lineHeight: 1.3,
      }}>
        {pt.title}
      </h3>
      <p style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 13,
        color: 'rgba(255,255,255,0.72)',
        lineHeight: 1.6,
        margin: 0,
      }}>
        {pt.desc}
      </p>
      <div style={{
        marginTop: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#36a64f',
          boxShadow: '0 0 8px #36a64f',
        }} />
        <span style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 11,
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
