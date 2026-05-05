'use client'

import { useState } from 'react'
import { MemberProfile } from '@/lib/types'

interface Props {
  recipient: MemberProfile
  currentUserPoints: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const DAY_OPTIONS = [
  { value: 'semaine', label: 'En semaine' },
  { value: 'weekend', label: 'Week-end' },
]
const MOMENT_OPTIONS = [
  { value: 'matin',  label: 'Début de journée' },
  { value: 'midi',   label: 'Milieu de journée' },
  { value: 'soir',   label: 'Fin de journée' },
]

const FIXED_COST = 8

export function MeetingRequestModal({ recipient, currentUserPoints, isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [days, setDays] = useState<string[]>([])
  const [moments, setMoments] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const hasEnough = currentUserPoints >= FIXED_COST

  function toggle<T extends string>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
  }

  async function handleSend() {
    if (!hasEnough) return
    setError('')
    setSending(true)
    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_id:      recipient.id,
        meeting_type:      'coffee',
        proposed_slots:    [],
        preferred_days:    days,
        preferred_moments: moments,
        message:           message || null,
      }),
    })
    setSending(false)
    if (res.ok) {
      setStep(3)
      setTimeout(() => { onSuccess(); onClose() }, 1800)
    } else {
      const d = await res.json()
      setError(d.error || 'Erreur lors de l\'envoi')
    }
  }

  function reset() {
    setStep(1); setDays([]); setMoments([]); setMessage(''); setError('')
  }

  if (!isOpen) return null

  const pillBtn = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: '99px', fontSize: '13px', fontWeight: 600,
    border: `1.5px solid ${active ? 'var(--green)' : 'var(--border)'}`,
    background: active ? 'var(--green-3)' : 'var(--white)',
    color: active ? 'var(--green)' : 'var(--text-2)',
    cursor: 'pointer', transition: 'all .14s',
  })

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) { reset(); onClose() } }}
    >
      <div style={{ background: 'var(--white)', borderRadius: '20px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', padding: '28px 28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: '17px', color: 'var(--text)' }}>
              Inviter {recipient.first_name} à un RDV
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
              Coût : {FIXED_COST} pts · Solde : {currentUserPoints} pts
            </div>
          </div>
          <button onClick={() => { reset(); onClose() }} style={{ width: '28px', height: '28px', display: 'grid', placeItems: 'center', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '16px', color: 'var(--text-2)' }}>×</button>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '24px' }}>
          {[1, 2].map(n => (
            <div key={n} style={{ width: '8px', height: '8px', borderRadius: '50%', background: step >= n ? 'var(--green)' : 'var(--border)', transition: 'background .2s' }} />
          ))}
        </div>

        {/* ÉTAPE 1 */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>
              Quand es-tu disponible ?
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '10px' }}>Jour</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {DAY_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setDays(toggle(days, o.value))} style={pillBtn(days.includes(o.value))}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '10px' }}>Moment</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {MOMENT_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setMoments(toggle(moments, o.value))} style={pillBtn(moments.includes(o.value))}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '20px' }}>
              {recipient.first_name} précisera l'heure exacte lors de l'acceptation.
            </div>

            <button
              onClick={() => setStep(2)}
              style={{ width: '100%', background: 'var(--green)', color: '#fff', padding: '12px', borderRadius: '99px', fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', transition: '.15s' }}
            >
              Suivant →
            </button>
          </div>
        )}

        {/* ÉTAPE 2 */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '14px' }}>
              Ajouter un message <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: '12px' }}>(optionnel)</span>
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 300))}
              rows={4}
              placeholder={`Présente-toi brièvement à ${recipient.first_name}…`}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid var(--border)', fontSize: '14px', fontFamily: 'inherit', resize: 'none', color: 'var(--text)', background: 'var(--white)', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box', marginBottom: '6px' }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'right', marginBottom: '20px' }}>{message.length}/300</div>

            {!hasEnough && (
              <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px', fontWeight: 500 }}>
                Solde insuffisant — il te faut {FIXED_COST} pts.
              </div>
            )}
            {error && (
              <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', borderRadius: '99px', background: 'var(--surface)', color: 'var(--text-2)', fontWeight: 600, fontSize: '13px', border: '1.5px solid var(--border)', cursor: 'pointer' }}>
                ← Retour
              </button>
              <button
                onClick={handleSend}
                disabled={!hasEnough || sending}
                style={{ flex: 2, padding: '12px', borderRadius: '99px', background: (!hasEnough || sending) ? 'var(--border)' : 'var(--green)', color: '#fff', fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '14px', border: 'none', cursor: (!hasEnough || sending) ? 'not-allowed' : 'pointer', transition: '.15s' }}
              >
                {sending ? 'Envoi…' : `Envoyer l'invitation — ${FIXED_COST} pts`}
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 — Succès */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--green-3)', border: '2px solid var(--green-4)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: '18px', color: 'var(--text)', marginBottom: '8px' }}>Invitation envoyée !</div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>{recipient.first_name} recevra ta demande et pourra proposer un créneau.</div>
          </div>
        )}
      </div>
    </div>
  )
}
