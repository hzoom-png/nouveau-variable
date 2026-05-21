'use client'

import { useState, useRef, useEffect } from 'react'

const TYPES = [
  { value: 'bug',     label: 'Bug' },
  { value: 'feature', label: 'Suggestion' },
  { value: 'billing', label: 'Facturation' },
  { value: 'general', label: 'Question' },
  { value: 'other',   label: 'Autre' },
]

interface Props {
  userEmail?: string
  userName?:  string
  userId?:    string
}

export function SupportWidget({ userEmail = '', userName = '' }: Props) {
  const [open, setOpen]         = useState(false)
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [form, setForm]         = useState({
    user_email:  userEmail,
    user_name:   userName,
    ticket_type: 'general',
    subject:     '',
    message:     '',
  })
  const panelRef = useRef<HTMLDivElement>(null)

  // Sync pre-filled values when props arrive (profile loads asynchronously)
  useEffect(() => {
    setForm(f => ({
      ...f,
      user_email: f.user_email || userEmail,
      user_name:  f.user_name  || userName,
    }))
  }, [userEmail, userName])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
    setError('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.user_email || !form.user_name || !form.subject || !form.message) {
      setError('Merci de remplir tous les champs.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/support/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSent(true)
        setTimeout(() => { setOpen(false); setSent(false); setForm(f => ({ ...f, subject: '', message: '', ticket_type: 'general' })) }, 2800)
      } else {
        const d = await res.json()
        setError(d.error ?? 'Erreur, réessaie.')
      }
    } catch {
      setError('Erreur réseau.')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: '#F8FAF9', border: '1.5px solid #E2EAE6',
    borderRadius: 8, padding: '8px 11px', fontSize: 13,
    color: '#1A2820', fontFamily: 'Inter, sans-serif', outline: 'none',
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 998 }}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed', bottom: 76, right: 20, zIndex: 999,
          width: 340, background: '#fff',
          border: '1.5px solid #D4E3DB', borderRadius: 14,
          boxShadow: '0 8px 32px rgba(47,84,70,0.18)',
          transformOrigin: 'bottom right',
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(12px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'transform .18s cubic-bezier(.32,.72,0,1), opacity .15s ease',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ background: '#2F5446', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>Besoin d'aide ?</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' }}>On te répond vite</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', color: '#fff', fontSize: 14, display: 'grid', placeItems: 'center' }}
          >
            ✕
          </button>
        </div>

        {sent ? (
          <div style={{ padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#2F5446', margin: '0 0 6px' }}>Message envoyé !</p>
            <p style={{ fontSize: 12, color: '#7A9A8C', margin: 0 }}>On revient vers toi rapidement.</p>
          </div>
        ) : (
          <form onSubmit={submit} style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#4B6358', display: 'block', marginBottom: 4 }}>Nom</label>
                <input style={inp} value={form.user_name} onChange={e => set('user_name', e.target.value)} placeholder="Jean Dupont" required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#4B6358', display: 'block', marginBottom: 4 }}>Email</label>
                <input style={inp} type="email" value={form.user_email} onChange={e => set('user_email', e.target.value)} placeholder="jean@…" required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#4B6358', display: 'block', marginBottom: 4 }}>Type</label>
                <select style={{ ...inp, appearance: 'none' }} value={form.ticket_type} onChange={e => set('ticket_type', e.target.value)}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#4B6358', display: 'block', marginBottom: 4 }}>Sujet</label>
                <input style={inp} value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Ex : problème de connexion" required maxLength={255} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#4B6358', display: 'block', marginBottom: 4 }}>Message</label>
              <textarea
                style={{ ...inp, resize: 'vertical', minHeight: 80 }}
                value={form.message}
                onChange={e => set('message', e.target.value)}
                placeholder="Décris ton problème ou ta question…"
                required
                maxLength={2000}
              />
            </div>

            {error && <p style={{ fontSize: 12, color: '#E05252', margin: 0 }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 0', background: loading ? '#7FAF97' : '#2F5446',
                border: 'none', borderRadius: 8, color: '#fff',
                fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                cursor: loading ? 'wait' : 'pointer', transition: 'background .15s',
              }}
            >
              {loading ? 'Envoi…' : 'Envoyer le message'}
            </button>
          </form>
        )}
      </div>

      {/* Trigger button */}
      <button
        onClick={() => { setOpen(o => !o); setSent(false); setError('') }}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#2F5446', border: 'none', borderRadius: 99,
          padding: '10px 16px 10px 13px',
          boxShadow: '0 4px 16px rgba(47,84,70,0.35)',
          cursor: 'pointer', transition: 'transform .15s, box-shadow .15s',
          color: '#fff',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(47,84,70,0.45)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(47,84,70,0.35)' }}
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 4L4 12M4 4l8 8"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9.33A5.33 5.33 0 0 1 8.67 14L6 15l1-2.33A5.33 5.33 0 1 1 14 9.33z"/>
          </svg>
        )}
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.01em' }}>
          {open ? 'Fermer' : 'Aide'}
        </span>
      </button>
    </>
  )
}
