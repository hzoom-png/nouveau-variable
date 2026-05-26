'use client'

import { useState } from 'react'

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M7.5 2v8M3 9l4.5 4 4.5-4M2 13h11"/>
  </svg>
)

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M10 1H3a1 1 0 00-1 1v10h2V3h8V1z"/>
    <rect x="5" y="5" width="9" height="9" rx="1"/>
  </svg>
)

interface Props {
  referralCode: string
}

export function AffiliationQRCard({ referralCode }: Props) {
  const [copied, setCopied] = useState(false)
  const referralLink = `https://app.nouveauvariable.fr/?ref=${referralCode}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(referralLink)}`

  function handleCopy() {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `nv-affiliation-${referralCode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '20px 22px' }}>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>
        Ton code d'affiliation
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
        {/* QR Code */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px', width: '250px', height: '250px' }}>
            <img
              src={qrCodeUrl}
              alt="QR Code"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Ton lien d'affiliation
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={referralLink}
                readOnly
                style={{
                  width: '100%', padding: '9px 13px', border: '1.5px solid var(--border)',
                  borderRadius: 'var(--r-sm)', fontSize: '13px', fontFamily: 'monospace',
                  color: 'var(--text)', background: 'var(--surface)', outline: 'none',
                  userSelect: 'all',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopy}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '9px 14px', borderRadius: 'var(--r-sm)',
                background: copied ? 'var(--green)' : 'var(--surface)', border: '1.5px solid var(--border)',
                color: copied ? '#fff' : 'var(--text-2)', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', transition: '.2s',
              }}
            >
              <CopyIcon />
              {copied ? 'Copié !' : 'Copier'}
            </button>
            <button
              onClick={handleDownload}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '9px 14px', borderRadius: 'var(--r-sm)',
                background: 'var(--green)', border: 'none',
                color: '#fff', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', transition: '.2s',
              }}
            >
              <DownloadIcon />
              Télécharger
            </button>
          </div>

          <div style={{ background: 'var(--green-3)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--green)', marginBottom: '4px', letterSpacing: '.05em', textTransform: 'uppercase' }}>
              Ton code
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--green)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {referralCode}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '14px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--r-sm)', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
        <p style={{ margin: '0 0 6px 0' }}>Partage ton lien ou ton QR code avec tes contacts. Chaque inscription via ton lien te rapporte des commissions.</p>
        <p style={{ margin: 0 }}>Le lien contient automatiquement ton code d'affiliation : <strong>{referralCode}</strong></p>
      </div>
    </div>
  )
}
