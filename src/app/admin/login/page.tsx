'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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

type Step = 'phone' | 'otp' | 'totp'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep]     = useState<Step>('phone')
  const [phone, setPhone]   = useState('')
  const [otp, setOtp]       = useState('')
  const [totp, setTotp]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  function toE164(raw: string): string {
    const stripped = raw.trim().replace(/[\s\-().]/g, '')
    if (stripped.startsWith('+')) return stripped
    return `+33${stripped.replace(/^0/, '')}`
  }

  async function sendOtp() {
    setError('')
    setLoading(true)
    try {
      const normalized = toE164(phone)
      setPhone(normalized)
      const { error: e } = await supabase.auth.signInWithOtp({ phone: normalized })
      if (e) throw e
      setStep('otp')
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? 'Erreur envoi OTP')
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp() {
    setError('')
    setLoading(true)
    try {
      const { error: e } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
      if (e) throw e
      // Check if TOTP is already configured
      const status = await fetch('/api/admin/auth/totp-status').then(r => r.json())
      if (!status.configured) {
        router.push('/admin/setup-totp')
        return
      }
      setStep('totp')
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? 'Code OTP invalide')
    } finally {
      setLoading(false)
    }
  }

  async function verifyTotp() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totp }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.setup_required) {
          router.push('/admin/setup-totp')
          return
        }
        throw new Error(data.error ?? 'Code invalide')
      }
      router.push('/admin/dashboard')
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? 'Erreur vérification')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: C.input, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '12px 14px',
    fontSize: 15, color: C.text, fontFamily: 'Inter, sans-serif',
    outline: 'none',
  }

  const btnStyle: React.CSSProperties = {
    width: '100%', padding: '13px', borderRadius: 8,
    background: C.green, border: 'none', color: C.text,
    fontSize: 14, fontWeight: 700, fontFamily: 'Inter, sans-serif',
    cursor: loading ? 'wait' : 'pointer', letterSpacing: '0.04em',
    opacity: loading ? 0.7 : 1, transition: 'opacity .15s',
  }

  const stepLabel = step === 'phone' ? 'Connexion admin' : step === 'otp' ? 'Code SMS' : 'Authentificateur'
  const stepSub = step === 'phone'
    ? 'Ton numéro de téléphone administrateur'
    : step === 'otp'
    ? `Code envoyé au ${phone}`
    : 'Entre le code à 6 chiffres de ton application'

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 380,
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: '36px 32px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: C.green, letterSpacing: '-0.01em' }}>NV</span>
          <span style={{ fontSize: 11, color: C.text2, fontWeight: 700, letterSpacing: '0.14em', marginLeft: 8, textTransform: 'uppercase' }}>Admin</span>
        </div>

        <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4, textAlign: 'center' }}>
          {stepLabel}
        </h1>
        <p style={{ fontSize: 12, color: C.text2, textAlign: 'center', marginBottom: 28 }}>
          {stepSub}
        </p>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, justifyContent: 'center' }}>
          {(['phone', 'otp', 'totp'] as Step[]).map((s, i) => (
            <div key={s} style={{
              width: step === s ? 24 : 8, height: 4, borderRadius: 2,
              background: step === s ? C.greenL : (
                (step === 'otp' && i === 0) || step === 'totp' ? C.green : C.text2
              ),
              transition: 'all .3s',
            }} />
          ))}
        </div>

        {error && (
          <div style={{
            background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            fontSize: 13, color: C.error,
          }}>
            {error}
          </div>
        )}

        {step === 'phone' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              style={inputStyle}
              type="tel"
              placeholder="+33 6 00 00 00 00"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendOtp()}
              autoFocus
            />
            <button style={btnStyle} onClick={sendOtp} disabled={loading || !phone.trim()}>
              {loading ? 'Envoi…' : 'Recevoir le code SMS'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              style={{ ...inputStyle, textAlign: 'center', fontSize: 22, letterSpacing: '0.3em' }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && verifyOtp()}
              autoFocus
            />
            <button style={btnStyle} onClick={verifyOtp} disabled={loading || otp.length < 4}>
              {loading ? 'Vérification…' : 'Continuer'}
            </button>
            <button
              onClick={() => { setStep('phone'); setOtp(''); setError('') }}
              style={{ background: 'none', border: 'none', color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              ← Changer de numéro
            </button>
          </div>
        )}

        {step === 'totp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              style={{ ...inputStyle, textAlign: 'center', fontSize: 22, letterSpacing: '0.3em' }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={totp}
              onChange={e => setTotp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && verifyTotp()}
              autoFocus
            />
            <button style={btnStyle} onClick={verifyTotp} disabled={loading || totp.length < 6}>
              {loading ? 'Vérification…' : 'Accéder à l\'admin'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
