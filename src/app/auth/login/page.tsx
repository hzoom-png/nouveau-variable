'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7FAF8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '24px',
    }}>
      <div style={{
        background: '#fff',
        border: '1px solid #E4EEEA',
        borderRadius: '20px',
        padding: '36px 32px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 12px 40px rgba(0,0,0,.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <div style={{ width: '32px', height: '32px', background: '#2F5446', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M2 11L5 6.5l2.5 2.5 2-3.5 2.5 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '13px', color: '#2F5446', letterSpacing: '.05em', textTransform: 'uppercase' }}>
            Nouveau Variable
          </span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontSize: '22px', fontWeight: 800, color: '#0F1C17', marginBottom: '6px', letterSpacing: '-.01em' }}>
          Content de te revoir.
        </h1>
        <p style={{ fontSize: '14px', color: '#4B6358', marginBottom: '24px' }}>
          Connecte-toi à ton espace membre.
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#4B6358', textTransform: 'uppercase', letterSpacing: '.06em' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ton@email.fr"
              required
              style={{ padding: '10px 13px', border: '1.5px solid #E4EEEA', borderRadius: '8px', fontSize: '14px', color: '#0F1C17', outline: 'none', transition: '.15s' }}
              onFocus={e => e.target.style.borderColor = '#2F5446'}
              onBlur={e => e.target.style.borderColor = '#E4EEEA'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#4B6358', textTransform: 'uppercase', letterSpacing: '.06em' }}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ padding: '10px 13px', border: '1.5px solid #E4EEEA', borderRadius: '8px', fontSize: '14px', color: '#0F1C17', outline: 'none', transition: '.15s' }}
              onFocus={e => e.target.style.borderColor = '#2F5446'}
              onBlur={e => e.target.style.borderColor = '#E4EEEA'}
            />
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 13px', fontSize: '13px', color: '#B91C1C' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ background: loading ? '#4B6358' : '#2F5446', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-jost, Jost, sans-serif)', border: 'none', transition: '.15s', marginTop: '4px' }}
          >
            {loading ? 'Connexion…' : 'Me connecter →'}
          </button>
        </form>

        <p style={{ fontSize: '13px', color: '#8FAAA0', textAlign: 'center', marginTop: '20px' }}>
          Pas encore membre ?{' '}
          <a href="/auth/signup" style={{ color: '#2F5446', fontWeight: 600, textDecoration: 'none' }}>Créer un compte</a>
        </p>
      </div>
    </div>
  )
}
