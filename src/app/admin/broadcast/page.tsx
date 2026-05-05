'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '../_components/AdminHeader'

const C = {
  card:   '#1A2820',
  border: 'rgba(255,255,255,0.07)',
  green:  '#2F5446',
  greenL: '#4A8C6F',
  text:   '#F7FAF8',
  text2:  '#4B6358',
  input:  '#111D18',
  error:  '#E05252',
}

type Broadcast = {
  id: string
  type: 'sms' | 'email'
  subject: string | null
  message: string
  recipients_count: number
  created_at: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function BroadcastPage() {
  const [history, setHistory] = useState<Broadcast[]>([])
  const [type, setType]       = useState<'sms' | 'email'>('email')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  async function loadHistory() {
    const r = await fetch('/api/admin/broadcast/list').catch(() => null)
    if (r?.ok) {
      const d = await r.json()
      setHistory(d.broadcasts ?? [])
    }
  }

  useEffect(() => { loadHistory() }, [])

  async function send() {
    setError('')
    setSuccess('')
    if (!message.trim()) { setError('Message vide'); return }
    if (type === 'email' && !subject.trim()) { setError('Objet requis pour les emails'); return }

    const confirmed = window.confirm(
      `Envoyer un ${type.toUpperCase()} à tous les membres actifs ?\n\n"${message.slice(0, 80)}${message.length > 80 ? '…' : ''}"`
    )
    if (!confirmed) return

    setSending(true)
    const res = await fetch('/api/admin/broadcast/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, subject: type === 'email' ? subject : undefined, message, recipients: 'all' }),
    })
    const data = await res.json()
    if (res.ok) {
      setSuccess(`Envoyé à ${data.sentCount ?? '?'} membres`)
      setMessage('')
      setSubject('')
      loadHistory()
    } else {
      setError(data.error ?? 'Erreur envoi')
    }
    setSending(false)
  }

  const inputSt: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: C.input, border: `1px solid rgba(255,255,255,0.1)`,
    borderRadius: 8, padding: '11px 14px', fontSize: 13,
    color: C.text, fontFamily: 'Inter, sans-serif', outline: 'none',
  }

  const btnTab = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
    background: active ? 'rgba(47,84,70,0.3)' : 'transparent',
    border: `1px solid ${active ? C.green : 'transparent'}`,
    color: active ? C.text : C.text2, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    transition: 'all .15s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0F1C17' }}>
      <AdminHeader title="Broadcast" />
      <div style={{ padding: '28px 40px', maxWidth: 800 }}>

      {/* Compose */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, marginBottom: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>
          Nouveau message
        </p>

        {/* Type tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: C.input, padding: 4, borderRadius: 10 }}>
          <button style={btnTab(type === 'email')} onClick={() => setType('email')}>Email</button>
          <button style={btnTab(type === 'sms')} onClick={() => setType('sms')}>SMS</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {type === 'email' && (
            <input
              style={inputSt}
              placeholder="Objet de l'email"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          )}
          <textarea
            style={{ ...inputSt, resize: 'vertical', minHeight: type === 'sms' ? 120 : 160, lineHeight: 1.6 }}
            placeholder={type === 'sms' ? 'Message SMS (160 car. recommandé)' : "Corps de l'email…"}
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          {type === 'sms' && (
            <p style={{ fontSize: 11, color: message.length > 160 ? '#A08C3A' : C.text2, textAlign: 'right' }}>
              {message.length} / 160 car.
            </p>
          )}

          {error && (
            <div style={{ background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.error }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: 'rgba(47,84,70,0.2)', border: `1px solid ${C.green}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.greenL }}>
              ✓ {success}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={send}
              disabled={sending || !message.trim()}
              style={{
                padding: '12px 24px', borderRadius: 8, background: C.green,
                border: 'none', color: C.text, fontSize: 14, fontWeight: 700,
                fontFamily: 'Inter, sans-serif', cursor: sending ? 'wait' : 'pointer',
                opacity: sending || !message.trim() ? 0.6 : 1,
              }}
            >
              {sending ? 'Envoi en cours…' : `Envoyer à tous les membres`}
            </button>
            <p style={{ fontSize: 11, color: C.text2 }}>
              ⚠ Envoi groupé irréversible
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      {message && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, marginBottom: 28 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
            Aperçu
          </p>
          {type === 'email' && subject && (
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Objet : {subject}</p>
          )}
          <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{message}</p>
        </div>
      )}

      {/* History placeholder */}
      {history.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 0' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
              Historique
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Type', 'Message', 'Destinataires', 'Date'].map(h => (
                  <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(b => (
                <tr key={b.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '12px 24px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(47,84,70,0.2)', color: C.greenL, textTransform: 'uppercase' }}>
                      {b.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 24px', color: C.text, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.subject ? <><strong>{b.subject}</strong> — </> : ''}{b.message}
                  </td>
                  <td style={{ padding: '12px 24px', color: C.text }}>{b.recipients_count}</td>
                  <td style={{ padding: '12px 24px', color: C.text2, fontSize: 12 }}>{fmtDate(b.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  )
}
