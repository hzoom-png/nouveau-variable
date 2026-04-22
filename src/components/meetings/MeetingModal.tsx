'use client'

import { useState, useEffect } from 'react'
import { Profile, MeetingSlot } from '@/lib/types'
import { MEETING_TYPES } from '@/lib/constants'

interface Props {
  recipient: Profile
  currentUserPoints: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type MeetingTypeKey = keyof typeof MEETING_TYPES

function getNextWorkdays(count: number): Date[] {
  const days: Date[] = []
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (days.length < count) {
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

const DAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTH_SHORT = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']

export function MeetingModal({ recipient, currentUserPoints, isOpen, onClose, onSuccess }: Props) {
  const [selectedType, setSelectedType] = useState<MeetingTypeKey>('coffee')
  const [selectedSlots, setSelectedSlots] = useState<number[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const workdays = getNextWorkdays(8)
  const mt = MEETING_TYPES[selectedType]
  const pointsCost = mt.points
  const balanceAfter = currentUserPoints - pointsCost
  const hasEnoughPoints = currentUserPoints >= pointsCost

  function toggleSlot(idx: number) {
    setSelectedSlots(s => s.includes(idx) ? s.filter(x => x !== idx) : [...s, idx])
  }

  function buildSlots(): MeetingSlot[] {
    return selectedSlots.map(idx => {
      const d = workdays[idx]
      const dateStr = d.toISOString().split('T')[0]
      const dayLabel = `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
      return { date: dateStr, time: mt.defaultTime, label: `${dayLabel} à ${mt.defaultTime}` }
    })
  }

  async function handleSend() {
    if (!hasEnoughPoints) return
    if (!selectedSlots.length) { setError('Sélectionne au moins un créneau'); return }
    setError('')
    setSending(true)

    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_id: recipient.id,
        meeting_type: selectedType,
        proposed_slots: buildSlots(),
        message: message || null,
      }),
    })

    setSending(false)
    if (res.ok) {
      setSuccessMsg('Demande envoyée !')
      setTimeout(() => { onSuccess(); onClose() }, 1500)
    } else {
      const data = await res.json()
      setError(data.error || 'Erreur lors de l\'envoi')
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '18px', color: 'var(--text)' }}>
              Inviter {recipient.first_name} {recipient.last_name}
            </div>
            {recipient.role_title && (
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{recipient.role_title}</div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--muted)', padding: '4px', lineHeight: 1 }}>×</button>
        </div>

        {/* Points banner */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
          background: hasEnoughPoints ? 'var(--green-pale)' : '#FEE2E2',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: hasEnoughPoints ? '#43695A' : '#991B1B' }}>
            Coût : {pointsCost} pts
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: hasEnoughPoints ? '#43695A' : '#991B1B' }}>
            {hasEnoughPoints ? `Solde après : ${balanceAfter} pts` : 'Solde insuffisant'}
          </div>
        </div>

        {/* Meeting type grid */}
        <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '10px' }}>
          Type de rencontre
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
          {(Object.entries(MEETING_TYPES) as [MeetingTypeKey, typeof MEETING_TYPES[MeetingTypeKey]][]).map(([key, val]) => {
            const active = selectedType === key
            return (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                style={{
                  padding: '12px 8px', borderRadius: '12px', textAlign: 'center',
                  border: `1.5px solid ${active ? '#43695A' : 'var(--border)'}`,
                  background: active ? 'var(--green-pale)' : 'white',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{val.emoji}</div>
                <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '12px', color: active ? '#43695A' : 'var(--text)' }}>{val.label}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>{val.points} pts</div>
              </button>
            )
          })}
        </div>

        {/* Slots */}
        <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '10px' }}>
          Créneaux proposés <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--muted)' }}>(sélectionne 1 à 4)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
          {workdays.map((d, idx) => {
            const active = selectedSlots.includes(idx)
            const dayLabel = `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
            return (
              <button
                key={idx}
                onClick={() => toggleSlot(idx)}
                style={{
                  padding: '10px 6px', borderRadius: '10px', textAlign: 'center',
                  border: `1.5px solid ${active ? '#43695A' : 'var(--border)'}`,
                  background: active ? 'var(--green-pale)' : 'white',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: active ? 700 : 500, color: active ? '#43695A' : 'var(--text)', lineHeight: 1.3 }}>{dayLabel}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px' }}>{mt.defaultTime}</div>
              </button>
            )
          })}
        </div>

        {/* Message */}
        <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '8px' }}>
          Message <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>(optionnel)</span>
        </div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value.slice(0, 300))}
          rows={3}
          placeholder={`Présente-toi brièvement et explique pourquoi tu veux rencontrer ${recipient.first_name}…`}
          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '14px', fontFamily: 'inherit', resize: 'none', marginBottom: '4px' }}
        />
        <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'right', marginBottom: '16px' }}>{message.length}/300</div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', marginBottom: '14px' }}>{error}</div>
        )}
        {successMsg && (
          <div style={{ background: 'var(--green-pale)', color: '#43695A', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', marginBottom: '14px' }}>{successMsg}</div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '11px', borderRadius: '10px', background: 'white', color: 'var(--muted)', fontWeight: 600, fontSize: '14px', border: '1.5px solid var(--border)', cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={!hasEnoughPoints || sending}
            style={{
              flex: 2, padding: '11px', borderRadius: '10px',
              background: (!hasEnoughPoints || sending) ? 'var(--green-light)' : '#43695A',
              color: 'white', fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '14px',
              border: 'none', cursor: (!hasEnoughPoints || sending) ? 'not-allowed' : 'pointer',
            }}
          >
            {sending ? 'Envoi...' : `Envoyer la demande — ${pointsCost} pts`}
          </button>
        </div>
      </div>
    </div>
  )
}
