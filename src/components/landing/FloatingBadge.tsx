'use client'

import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'

interface FloatingBadgeProps {
  label: string
  position: 'top-left' | 'top-right' | 'bottom-right'
  delay: number
}

const POSITION_STYLES: Record<FloatingBadgeProps['position'], CSSProperties> = {
  'top-left':     { top: -14, left: -20 },
  'top-right':    { top: -14, right: -20 },
  'bottom-right': { bottom: -14, right: -20 },
}

export function FloatingBadge({ label, position, delay }: FloatingBadgeProps) {
  const initialY = position.includes('top') ? -20 : 20

  return (
    <motion.div
      style={{ position: 'absolute', zIndex: 20, ...POSITION_STYLES[position] }}
      initial={{ opacity: 0, y: initialY }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="nv-floating-badge">{label}</div>
    </motion.div>
  )
}
