'use client'

import { useState } from 'react'
import { MeetingRequest, MeetingSlot } from '@/lib/types'
import { MEETING_TYPES } from '@/lib/constants'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  pendingRequests: MeetingRequest[]
  confirmedMeetings: MeetingRequest[]
  currentUserId: string
}

export default function MeetingsClient({ pendingRequests, confirmedMeetings, currentUserId }: Props) {
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [locationForms, setLocationForms] = useState<Record<string, { name: string, city: string }>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  async function handleAccept(meetingId: string, chosenSlot: MeetingSlot) {
    setLoadingId(meetingId)
    const res = await fetch(`/api/meetings/${meetingId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chosen_slot: chosenSlot }),
    })
    setLoadingId(null)
    if (res.ok) {
      setMessage('Demande acceptée ! Précise maintenant le lieu.')
      setConfirmingId(meetingId)
      window.location.reload()
    } else {
      const data = await res.json()
      setMessage(data.error || 'Erreur lors de l\'acceptation')
    }
  }

  async function handleDecline(meetingId: string) {
    setLoadingId(meetingId)
    const res = await fetch(`/api/meetings/${meetingId}/decline`, { method: 'POST' })
    setLoadingId(null)
    if (res.ok) window.location.reload()
    else setMessage('Erreur lors du refus')
  }

  async function handleConfirmLocation(meetingId: string) {
    const form = locationForms[meetingId]
    if (!form?.name) return
    setLoadingId(meetingId)
    const res = await fetch(`/api/meetings/${meetingId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location_name: form.name, location_city: form.city }),
    })
    setLoadingId(null)
    if (res.ok) window.location.reload()
    else setMessage('Erreur lors de la confirmation')
  }

  function formatSlot(slot: MeetingSlot) {
    try {
      return format(new Date(slot.date), "EEE d MMM", { locale: fr }) + ' à ' + slot.time
    } catch {
      return slot.label || slot.date
    }
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      {message && (
        <div style={{ background: 'var(--green-pale)', color: '#43695A', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>
          {message}
        </div>
      )}

      {/* Pending requests */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '16px' }}>
          Demandes reçues <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>({pendingRequests.length})</span>
        </h2>

        {!pendingRequests.length && (
          <div style={{ background: 'white', borderRadius: '14px', padding: '32px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
            Aucune demande en attente
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {pendingRequests.map(req => {
            const requester = req.requester
            const mt = MEETING_TYPES[req.meeting_type]
            const initials = `${requester?.first_name?.[0] ?? ''}${requester?.last_name?.[0] ?? ''}`.toUpperCase()
            const firstSlot = req.proposed_slots?.[0]

            return (
              <div key={req.id} style={{ background: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '11px', flexShrink: 0,
                    background: '#43695A', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '16px',
                  }}>{initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
                      {requester?.first_name} {requester?.last_name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
                      {mt?.emoji} {mt?.label} · {firstSlot ? formatSlot(firstSlot) : ''}
                    </div>
                    {req.message && (
                      <div style={{ fontSize: '14px', color: 'var(--text)', background: 'var(--off)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontStyle: 'italic' }}>
                        &ldquo;{req.message}&rdquo;
                      </div>
                    )}

                    {/* Slot selection */}
                    {acceptingId === req.id && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Choisir un créneau :</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {req.proposed_slots.map((slot, i) => (
                            <button
                              key={i}
                              onClick={() => handleAccept(req.id, slot)}
                              disabled={loadingId === req.id}
                              style={{ padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #43695A', background: 'var(--green-pale)', color: '#43695A', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                            >
                              {formatSlot(slot)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      {acceptingId !== req.id ? (
                        <button
                          onClick={() => setAcceptingId(req.id)}
                          style={{ padding: '8px 16px', borderRadius: '8px', background: '#43695A', color: 'white', fontWeight: 600, fontSize: '13px', border: 'none', cursor: 'pointer' }}
                        >
                          ✓ Accepter
                        </button>
                      ) : (
                        <button
                          onClick={() => setAcceptingId(null)}
                          style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--off)', color: 'var(--muted)', fontWeight: 600, fontSize: '13px', border: '1.5px solid var(--border)', cursor: 'pointer' }}
                        >
                          Annuler
                        </button>
                      )}
                      <button
                        onClick={() => handleDecline(req.id)}
                        disabled={loadingId === req.id}
                        style={{ padding: '8px 16px', borderRadius: '8px', background: 'white', color: '#991B1B', fontWeight: 600, fontSize: '13px', border: '1.5px solid #FCA5A5', cursor: 'pointer' }}
                      >
                        Décliner
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Confirmed meetings */}
      <section>
        <h2 style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '16px' }}>
          Rencontres confirmées <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>({confirmedMeetings.length})</span>
        </h2>

        {!confirmedMeetings.length && (
          <div style={{ background: 'white', borderRadius: '14px', padding: '32px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
            Aucune rencontre confirmée
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {confirmedMeetings.map(req => {
            const isRequester = req.requester_id === currentUserId
            const other = isRequester ? req.recipient : req.requester
            const mt = MEETING_TYPES[req.meeting_type]
            const initials = `${other?.first_name?.[0] ?? ''}${other?.last_name?.[0] ?? ''}`.toUpperCase()

            return (
              <div key={req.id} style={{ background: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '11px', flexShrink: 0,
                    background: '#43695A', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '16px',
                  }}>{initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
                      {other?.first_name} {other?.last_name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                      {mt?.emoji} {mt?.label}
                      {req.chosen_slot && ` · ${formatSlot(req.chosen_slot)}`}
                      {req.location_name && ` · ${req.location_name}`}
                      {req.location_city && `, ${req.location_city}`}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                    background: req.status === 'confirmed' ? 'var(--green-pale)' : 'var(--border)',
                    color: req.status === 'confirmed' ? '#43695A' : 'var(--muted)',
                  }}>
                    {req.status === 'confirmed' ? '● Confirmé' : '✓ Terminé'}
                  </div>
                </div>

                {/* Confirm location (if accepted but not confirmed, and current user is recipient) */}
                {req.status === 'accepted' && !isRequester && (
                  <div style={{ marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Préciser le lieu :</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Nom du lieu"
                        value={locationForms[req.id]?.name ?? ''}
                        onChange={e => setLocationForms(f => ({ ...f, [req.id]: { ...f[req.id], name: e.target.value } }))}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '14px', fontFamily: 'inherit' }}
                      />
                      <input
                        type="text"
                        placeholder="Ville"
                        value={locationForms[req.id]?.city ?? ''}
                        onChange={e => setLocationForms(f => ({ ...f, [req.id]: { ...f[req.id], city: e.target.value } }))}
                        style={{ width: '140px', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '14px', fontFamily: 'inherit' }}
                      />
                      <button
                        onClick={() => handleConfirmLocation(req.id)}
                        disabled={loadingId === req.id}
                        style={{ padding: '8px 16px', borderRadius: '8px', background: '#43695A', color: 'white', fontWeight: 600, fontSize: '13px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Confirmer →
                      </button>
                    </div>
                  </div>
                )}

                {/* Phone sharing */}
                {req.status === 'confirmed' && other?.phone && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted)' }}>
                    <span>📱</span>
                    <span>{other.phone}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
