'use client'

import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
        fontWeight: 600, background: copied ? '#2C4A3E' : '#43695A',
        color: 'white', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'background 0.2s',
      }}
    >
      {copied ? 'Copié !' : 'Copier'}
    </button>
  )
}
