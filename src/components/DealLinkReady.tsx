'use client'

import { useState } from 'react'
import Link from 'next/link'

interface DealLinkReadyProps {
  slug: string
  prospectName: string
  prospectCompany?: string
  onReset: () => void
}

export function DealLinkReady({ slug, prospectName, prospectCompany, onReset }: DealLinkReadyProps) {
  const [copied, setCopied] = useState(false)

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/dl/${slug}`
    : `/dl/${slug}`

  function copy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '400px', padding: '40px 20px', textAlign: 'center',
    }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'var(--green-3)', border: '2px solid var(--green-4)',
        display: 'grid', placeItems: 'center', marginBottom: '24px',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </div>

      <h2 style={{
        fontFamily: 'var(--font-jost)', fontSize: '24px', fontWeight: 900,
        color: 'var(--text)', marginBottom: '8px',
      }}>
        Ton DealLink est prêt
      </h2>

      <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '28px' }}>
        Page personnalisée pour {prospectName}{prospectCompany ? ` · ${prospectCompany}` : ''}
      </p>

      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px',
      }}>
        <span style={{
          flex: 1, fontFamily: 'monospace', fontSize: '13px', color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          /dl/{slug}
        </span>
        <button
          onClick={copy}
          style={{
            background: copied ? 'var(--green-3)' : 'var(--green)',
            color: copied ? 'var(--green)' : '#fff',
            border: 'none', borderRadius: '99px',
            padding: '6px 14px', fontSize: '12px', fontWeight: 700,
            cursor: 'pointer', flexShrink: 0, transition: 'all .2s', fontFamily: 'inherit',
          }}
        >
          {copied ? 'Copié ✓' : 'Copier'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
        <Link
          href={`/dl/${slug}`}
          target="_blank"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'var(--green)', color: '#fff',
            padding: '10px 22px', borderRadius: '99px',
            fontSize: '13px', fontWeight: 700, textDecoration: 'none',
          }}
        >
          Voir le DealLink
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </Link>
        <Link
          href={`/dl/${slug}/edit`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'transparent', color: 'var(--green)',
            border: '1.5px solid var(--green)',
            padding: '10px 22px', borderRadius: '99px',
            fontSize: '13px', fontWeight: 700, textDecoration: 'none',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Modifier
        </Link>
      </div>

      <button
        onClick={onReset}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '12px', color: 'var(--text-2)', textDecoration: 'underline',
          fontFamily: 'inherit',
        }}
      >
        Créer un nouveau DealLink
      </button>
    </div>
  )
}
