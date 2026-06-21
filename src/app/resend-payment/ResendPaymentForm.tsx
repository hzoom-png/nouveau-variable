'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'

type Phase = 'form' | 'loading' | 'success' | 'error'

export function ResendPaymentForm() {
  const [email,       setEmail]       = useState('')
  const [code,        setCode]        = useState('')
  const [phase,       setPhase]       = useState<Phase>('form')
  const [errorMsg,    setErrorMsg]    = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setPhase('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/candidature/resend-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), code_parrain: code.trim().toUpperCase() }),
      })
      const json = await res.json()
      if (res.ok) {
        setPhase('success')
      } else {
        setErrorMsg((json as { error?: string }).error ?? 'Une erreur est survenue.')
        setPhase('error')
      }
    } catch {
      setErrorMsg('Impossible de contacter le serveur. Vérifie ta connexion.')
      setPhase('error')
    }
  }

  if (phase === 'success') {
    return (
      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={styles.iconSuccess}>✓</div>
        </div>
        <h1 style={{ ...styles.title, textAlign: 'center', marginBottom: 8 }}>Email envoyé !</h1>
        <p style={{ ...styles.subtitle, textAlign: 'center', marginBottom: 28 }}>
          Vérifie ta boîte mail (et tes spams). Le lien de paiement est valable <strong>48 heures</strong>.
        </p>
        <Link href="/" style={styles.btnSecondary}>← Retour à l&apos;accueil</Link>
      </div>
    )
  }

  return (
    <div style={styles.card}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <span style={styles.logo}>NV</span>
      </div>

      <h1 style={styles.title}>Renvoyer mon lien de paiement</h1>
      <p style={styles.subtitle}>
        Saisis l&apos;email que tu as utilisé pour candidater et ton code personnel
        (reçu dans ton email de confirmation de candidature).
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={styles.label} htmlFor="rp-email">Adresse email</label>
          <input
            id="rp-email"
            type="email"
            required
            autoComplete="email"
            placeholder="ton@email.fr"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={phase === 'loading'}
            style={styles.input}
          />
        </div>

        <div>
          <label style={styles.label} htmlFor="rp-code">
            Ton code personnel
            <span style={styles.labelHint}> (8 caractères, ex : AB3K7NZM)</span>
          </label>
          <input
            id="rp-code"
            type="text"
            required
            autoComplete="off"
            placeholder="AB3K7NZM"
            maxLength={8}
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            disabled={phase === 'loading'}
            style={{ ...styles.input, fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase' }}
          />
        </div>

        {phase === 'error' && (
          <div style={styles.errorBox}>{errorMsg}</div>
        )}

        <button
          type="submit"
          disabled={phase === 'loading' || !email || code.length < 8}
          style={{
            ...styles.btnPrimary,
            opacity: (phase === 'loading' || !email || code.length < 8) ? 0.6 : 1,
            cursor:  (phase === 'loading' || !email || code.length < 8) ? 'not-allowed' : 'pointer',
          }}
        >
          {phase === 'loading' ? 'Envoi en cours…' : 'Renvoyer le lien →'}
        </button>
      </form>

      <p style={styles.footer}>
        Tu n&apos;as pas reçu ton email de confirmation ?{' '}
        <a href="mailto:contact@nouveauvariable.fr" style={styles.link}>
          Contacte-nous
        </a>
      </p>
    </div>
  )
}

const styles = {
  card: {
    background:   'var(--white)',
    border:       '1px solid var(--border)',
    borderRadius: 16,
    padding:      '40px 36px',
    maxWidth:     460,
    width:        '100%',
  } as React.CSSProperties,

  logo: {
    display:        'inline-block',
    background:     'var(--green)',
    color:          '#fff',
    fontFamily:     'var(--font-inter)',
    fontWeight:     700,
    fontSize:       18,
    borderRadius:   10,
    padding:        '6px 14px',
    letterSpacing:  '0.04em',
  } as React.CSSProperties,

  title: {
    fontFamily:   'var(--font-inter)',
    fontSize:     22,
    fontWeight:   600,
    color:        'var(--text)',
    marginBottom: 10,
    lineHeight:   1.25,
  } as React.CSSProperties,

  subtitle: {
    fontSize:     14,
    color:        'var(--text-2)',
    lineHeight:   1.65,
    marginBottom: 28,
  } as React.CSSProperties,

  label: {
    display:      'block',
    fontSize:     13,
    fontWeight:   500,
    color:        'var(--text)',
    marginBottom: 6,
    fontFamily:   'var(--font-inter)',
  } as React.CSSProperties,

  labelHint: {
    fontWeight:   400,
    color:        'var(--text-3)',
    fontSize:     12,
  } as React.CSSProperties,

  input: {
    width:        '100%',
    boxSizing:    'border-box' as const,
    padding:      '10px 14px',
    border:       '1px solid var(--border)',
    borderRadius: 8,
    fontSize:     14,
    fontFamily:   'var(--font-inter)',
    color:        'var(--text)',
    background:   'var(--surface)',
    outline:      'none',
    transition:   'border-color 0.15s',
  } as React.CSSProperties,

  errorBox: {
    background:   '#fef2f2',
    border:       '1px solid #fca5a5',
    borderRadius: 8,
    padding:      '12px 16px',
    fontSize:     13,
    color:        '#b91c1c',
    lineHeight:   1.5,
    fontFamily:   'var(--font-inter)',
  } as React.CSSProperties,

  btnPrimary: {
    width:        '100%',
    padding:      '13px 20px',
    background:   'var(--green)',
    color:        '#fff',
    border:       'none',
    borderRadius: 8,
    fontSize:     14,
    fontWeight:   600,
    fontFamily:   'var(--font-inter)',
    transition:   'opacity 0.15s',
  } as React.CSSProperties,

  btnSecondary: {
    display:      'block',
    textAlign:    'center' as const,
    padding:      '11px 20px',
    border:       '1px solid var(--border)',
    borderRadius: 8,
    fontSize:     13,
    color:        'var(--text-2)',
    fontFamily:   'var(--font-inter)',
    textDecoration: 'none',
  } as React.CSSProperties,

  iconSuccess: {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    width:          52,
    height:         52,
    borderRadius:   '50%',
    background:     '#dcfce7',
    color:          '#16a34a',
    fontSize:       24,
    fontWeight:     700,
  } as React.CSSProperties,

  footer: {
    marginTop:  20,
    fontSize:   12,
    color:      'var(--text-3)',
    textAlign:  'center' as const,
    lineHeight: 1.5,
  } as React.CSSProperties,

  link: {
    color:          'var(--green)',
    textDecoration: 'underline',
  } as React.CSSProperties,
} as const
