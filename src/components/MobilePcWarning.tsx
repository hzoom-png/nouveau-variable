'use client'

import { useState, useEffect } from 'react'

const LS_KEY = 'nv_pc_warning_dismissed'
const TTL_MS = 24 * 3600 * 1000

export default function MobilePcWarning({ tool }: { tool: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      const expired = !saved || Date.now() - Number(saved) > TTL_MS
      if (expired) setVisible(true)
    } catch {}
  }, [])

  function dismiss() {
    try { localStorage.setItem(LS_KEY, String(Date.now())) } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', marginBottom: 16,
      background: '#EFF6FF', border: '1px solid #BFDBFE',
      borderRadius: 10, fontSize: 13, color: '#1E40AF',
    }}>
      <span style={{ flexShrink: 0 }}>ℹ️</span>
      <span style={{ flex: 1, lineHeight: 1.5 }}>
        <strong>{tool}</strong> est plus ergonomique sur ordinateur.
      </span>
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', color: '#1E40AF',
          cursor: 'pointer', fontSize: 18, padding: 0,
          lineHeight: 1, flexShrink: 0,
        }}
        aria-label="Fermer"
      >
        ✕
      </button>
    </div>
  )
}
