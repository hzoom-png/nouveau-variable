'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project, ProjectNeed } from '../types'
import { NEED_CONFIG } from '../types'

interface Props {
  project: Project
  currentUserId: string
  onSuccess: () => void
}

export function ProjectContactForm({ project, currentUserId, onSuccess }: Props) {
  const [selectedNeed, setSelectedNeed] = useState<ProjectNeed | ''>('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedNeed || !message.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.from('project_contacts').insert({
      id: crypto.randomUUID(),
      project_id: project.id,
      user_id: currentUserId,
      need: selectedNeed,
      message: message.trim().slice(0, 500),
    })

    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
    onSuccess()
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
        <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Message envoyé !</div>
        <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Le porteur du projet vous répondra directement.</div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>Comment pouvez-vous aider ?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {(project.needs ?? []).map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setSelectedNeed(n)}
              style={{
                padding: '6px 13px', borderRadius: 'var(--r-full)', fontSize: '12px', fontWeight: 600,
                border: '1.5px solid', cursor: 'pointer', transition: '.14s',
                borderColor: selectedNeed === n ? 'var(--green)' : 'var(--border)',
                background: selectedNeed === n ? 'var(--green-3)' : 'var(--white)',
                color: selectedNeed === n ? 'var(--green)' : 'var(--text-2)',
              }}
            >
              {NEED_CONFIG[n]?.emoji} {NEED_CONFIG[n]?.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>Votre message</div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Présentez-vous et expliquez comment vous pouvez contribuer…"
          rows={4}
          maxLength={500}
          style={{
            width: '100%', padding: '10px 13px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)',
            fontSize: '13px', color: 'var(--text)', resize: 'vertical', outline: 'none',
            fontFamily: 'inherit', lineHeight: 1.6,
          }}
        />
        <div style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'right' }}>{message.length}/500</div>
      </div>

      {error && <div style={{ fontSize: '13px', color: 'var(--red)', fontWeight: 500 }}>{error}</div>}

      <button
        type="submit"
        disabled={!selectedNeed || !message.trim() || loading}
        style={{
          background: 'var(--green)', color: '#fff', padding: '12px', borderRadius: 'var(--r-sm)',
          fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer',
          opacity: (!selectedNeed || !message.trim() || loading) ? 0.5 : 1, transition: '.15s',
        }}
      >
        {loading ? 'Envoi…' : 'Envoyer →'}
      </button>
    </form>
  )
}
