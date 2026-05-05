'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  bg:      '#0F1C17',
  card:    '#1A2820',
  border:  '#2F5446',
  green:   '#2F5446',
  greenL:  '#4A8C6F',
  text:    '#F7FAF8',
  text2:   '#4B6358',
  input:   '#111D18',
  error:   '#E05252',
}

export default function SetupTotpPage() {
  const router = useRouter()
  const [qr, setQr]         = useState('')
  const [secret, setSecret] = useState('')
  const [token, setToken]   = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    fetch('/api/admin/auth/setup-totp', { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (d.qr) { setQr(d.qr); setSecret(d.secret) }
        else setError(d.error ?? 'Erreur génération')
      })
      .catch(() => setError('Erreur réseau'))
      .finally(() => setLoading(false))
  }, [])

  async function verify() {
    setError('')
    setVerifying(true)
    try {
      const res = await fetch('/api/admin/auth/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Code invalide')
      router.push('/admin/dashboard')
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? 'Erreur')
    } finally {
      setVerifying(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: C.input, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '12px 14px',
    fontSize: 22, letterSpacing: '0.3em', textAlign: 'center',
    color: C.text, fontFamily: 'Inter, sans-serif', outline: 'none',
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: '36px 32px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: C.green }}>NV</span>
          <span style={{ fontSize: 11, color: C.text2, fontWeight: 700, letterSpacing: '0.14em', marginLeft: 8, textTransform: 'uppercase' }}>Admin</span>
        </div>

        <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 6, textAlign: 'center' }}>
          Configuration 2FA
        </h1>
        <p style={{ fontSize: 12, color: C.text2, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
          Scanne le QR code avec Google Authenticator, puis entre le code généré pour confirmer.
        </p>

        {loading && (
          <div style={{ textAlign: 'center', color: C.text2, padding: '40px 0' }}>Génération…</div>
        )}

        {!loading && qr && (
          <>
            {/* QR Code */}
            <div style={{
              background: '#fff', borderRadius: 12, padding: 16,
              display: 'flex', justifyContent: 'center', marginBottom: 20,
            }}>
              <img src={qr} alt="QR Code TOTP" style={{ width: 200, height: 200 }} />
            </div>

            {/* Secret manuel */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 11, color: C.text2, marginBottom: 6, textAlign: 'center' }}>
                Ou entre ce code manuellement
              </p>
              <div style={{
                background: C.input, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: '10px 14px', fontFamily: 'monospace', fontSize: 13,
                color: C.greenL, letterSpacing: '0.08em', textAlign: 'center',
                wordBreak: 'break-all',
              }}>
                {secret}
              </div>
            </div>

            {/* Instructions */}
            <ol style={{ paddingLeft: 18, marginBottom: 24, color: C.text2, fontSize: 12, lineHeight: 1.8 }}>
              <li>Ouvre Google Authenticator</li>
              <li>Appuie sur « + » → « Scanner un QR code »</li>
              <li>Scanne le code ci-dessus</li>
              <li>Entre le code à 6 chiffres affiché</li>
            </ol>
          </>
        )}

        {error && (
          <div style={{
            background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            fontSize: 13, color: C.error,
          }}>
            {error}
          </div>
        )}

        {!loading && qr && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              style={inputStyle}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={token}
              onChange={e => setToken(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && verify()}
              autoFocus
            />
            <button
              onClick={verify}
              disabled={verifying || token.length < 6}
              style={{
                padding: '13px', borderRadius: 8, background: C.green,
                border: 'none', color: C.text, fontSize: 14, fontWeight: 700,
                fontFamily: 'Inter, sans-serif', cursor: verifying ? 'wait' : 'pointer',
                opacity: verifying || token.length < 6 ? 0.7 : 1,
              }}
            >
              {verifying ? 'Vérification…' : 'Activer le 2FA'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
