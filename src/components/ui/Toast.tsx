'use client'

import { useEffect } from 'react'

interface Props {
  message: string
  variant?: 'success' | 'error' | 'info'
  onClose: () => void
}

const COLORS = {
  success: { bg: 'var(--green-pale)', color: '#43695A', border: 'var(--green-light)' },
  error: { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
  info: { bg: 'var(--blue-pale)', color: '#4B7BF5', border: '#BFDBFE' },
}

export function Toast({ message, variant = 'success', onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  const c = COLORS[variant]
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 200,
      background: c.bg, color: c.color, border: `1.5px solid ${c.border}`,
      borderRadius: '12px', padding: '12px 20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      fontSize: '14px', fontWeight: 600, maxWidth: '320px',
      animation: 'slideIn 0.2s ease',
    }}>
      {message}
    </div>
  )
}
