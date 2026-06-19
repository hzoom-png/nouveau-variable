'use client'

import { useState } from 'react'
import { motion, MotionValue } from 'framer-motion'
import { CONTENT_POINTS } from '../constants'

interface ContentPointsProps {
  opacities: MotionValue<number>[]
  isMobile?: boolean
  position?: 'right' | 'bottom' | 'center'
}

export function ContentPoints({ opacities, isMobile = false, position = 'right' }: ContentPointsProps) {
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
            <PointCard pt={pt} large={!isMobile} />
          </motion.div>
        ))}
      </>
    )
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {CONTENT_POINTS.map((pt, i) => (
          <motion.div key={i} style={{ opacity: opacities[i] }}>
            <PointCard pt={pt} />
          </motion.div>
        ))}
      </div>
    )
  }

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
            <PointCard pt={pt} compact />
          </motion.div>
        ))}
      </>
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
          <PointCard pt={pt} />
        </motion.div>
      ))}
    </>
  )
}

function PointCard({
  pt, compact = false, large = false,
}: {
  pt: typeof CONTENT_POINTS[number]
  compact?: boolean
  large?: boolean
}) {
  const [hovered, setHovered] = useState(false)

  const pad     = large ? '28px 32px' : compact ? '12px 16px' : '18px 22px'
  const titleSz = large ? 20 : compact ? 14 : 15
  const titleMb = large ? 10 : compact ? 4 : 6
  const descSz  = large ? 15 : compact ? 12 : 13
  const dotMt   = large ? 18 : compact ? 8 : 12
  const tagSz   = large ? 11 : 10

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? '#36a64f' : '#E4EEEA'}`,
        borderRadius: 12,
        padding: pad,
        boxShadow: hovered
          ? '0 8px 32px rgba(54,166,79,0.15)'
          : '0 2px 12px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
        pointerEvents: 'auto',
      }}
    >
      <h3 style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 600,
        fontSize: titleSz,
        color: hovered ? '#36a64f' : '#0F1C17',
        lineHeight: 1.3,
        margin: `0 0 ${titleMb}px`,
        transition: 'color 0.2s',
      }}>
        {pt.title}
      </h3>
      <p style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: descSz,
        color: '#4B6358',
        lineHeight: 1.6,
        margin: 0,
      }}>
        {pt.desc}
      </p>
    </div>
  )
}
