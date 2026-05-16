'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface MeetingProfile {
  first_name: string
  last_name: string
  avatar_url: string | null
  role_title: string | null
  slug: string | null
}

interface Meeting {
  id: string
  created_at: string
  requester_id: string
  recipient_id: string
  meeting_type: string
  message?: string | null
  availability_note?: string | null
  status: string
  responded_at?: string | null
  requester?: MeetingProfile
  recipient?: MeetingProfile
}

type SubTab = 'received' | 'sent' | 'confirmed'

const TYPE_LABELS: Record<string, string> = {
  visio:     '💻 Visio',
  telephone: '📞 Téléphone',
  cafe:      '☕ Café',
  autre:     '📅 Autre',
  coffee:    '☕ Café',
  lunch:     '🍽 Déjeuner',
  afterwork: '🥂 Afterwork',
  dinner:    '🍷 Dîner',
  work:      '🎯 Travail',
  event:     '🌟 Événement',
}

function Avatar({ profile, size = 48 }: { profile: MeetingProfile; size?: number }) {
  const initials = `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: profile.avatar_url ? 'transparent' : '#EAF2EE',
      border: '2px solid #E4EEEA',
      overflow: 'hidden', display: 'grid', placeItems: 'center',
      flexShrink: 0,
      fontFamily: 'Jost, sans-serif', fontSize: size * 0.35, fontWeight: 700, color: '#024f41',
    }}>
      {profile.avatar_url
        ? <img src={profile.avatar_url} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials
      }
    </div>
  )
}

export default function MeetingsTab({ currentUserId }: { currentUserId: string }) {
  const [subTab, setSubTab] = useState<SubTab>('received')
  const [sent, setSent] = useState<Meeting[]>([])
  const [received, setReceived] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/meetings')
    if (res.ok) {
      const { sent: s, received: r } = await res.json()
      setSent(s ?? [])
      setReceived(r ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function accept(id: string) {
    await fetch(`/api/meetings/${id}/accept`, { method: 'POST' })
    setActionMsg('RDV accepté — les numéros ont été échangés par SMS')
    load()
    setTimeout(() => setActionMsg(''), 4000)
  }

  async function decline(id: string) {
    await fetch(`/api/meetings/${id}/decline`, { method: 'POST' })
    load()
  }

  async function cancel(id: string) {
    await fetch(`/api/meetings/${id}/cancel`, { method: 'POST' })
    load()
  }

  const pendingReceived = received.filter(m => m.status === 'pending')
  const confirmed = [
    ...sent.filter(m => m.status === 'accepted'),
    ...received.filter(m => m.status === 'accepted'),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px', borderRadius: '99px', fontSize: '13px', fontWeight: 600,
    border: `1.5px solid ${active ? '#024f41' : 'var(--border)'}`,
    background: active ? '#024f41' : 'transparent',
    color: active ? '#fff' : 'var(--text-2)',
    cursor: 'pointer', transition: 'all .14s',
  })

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-3)', fontSize: '14px' }}>
      Chargement…
    </div>
  )

  return (
    <div style={{ maxWidth: 720 }}>
      {actionMsg && (
        <div style={{ background: '#e8f5ef', color: '#024f41', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
          {actionMsg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button style={tabBtn(subTab === 'received')} onClick={() => setSubTab('received')}>
          Reçues{pendingReceived.length > 0 ? ` (${pendingReceived.length})` : ''}
        </button>
        <button style={tabBtn(subTab === 'sent')} onClick={() => setSubTab('sent')}>
          Envoyées
        </button>
        <button style={tabBtn(subTab === 'confirmed')} onClick={() => setSubTab('confirmed')}>
          Confirmés{confirmed.length > 0 ? ` (${confirmed.length})` : ''}
        </button>
      </div>

      {/* Received */}
      {subTab === 'received' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pendingReceived.length === 0 && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
              Aucune demande reçue en attente
            </div>
          )}
          {pendingReceived.map(m => {
            const sender = m.requester
            if (!sender) return null
            return (
              <div key={m.id} style={{ background: '#ffffff', border: '1.5px solid #e8f5ef', borderRadius: 14, padding: '20px 24px' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                  <Avatar profile={sender} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#012722' }}>{sender.first_name} {sender.last_name}</div>
                    <div style={{ fontSize: 13, color: '#4B6358' }}>{sender.role_title}</div>
                  </div>
                  <span style={{ fontSize: 12, color: '#9BB5AA', flexShrink: 0 }}>
                    {TYPE_LABELS[m.meeting_type] ?? m.meeting_type}
                  </span>
                </div>
                {m.message && (
                  <p style={{ fontSize: 14, color: '#4B6358', lineHeight: 1.6, marginBottom: 6 }}>
                    &ldquo;{m.message}&rdquo;
                  </p>
                )}
                {m.availability_note && (
                  <p style={{ fontSize: 12, color: '#9BB5AA', marginBottom: 16 }}>
                    📅 {m.availability_note}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => accept(m.id)} style={{ background: '#024f41', color: '#fff', padding: '9px 20px', borderRadius: '99px', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                    ✓ Accepter
                  </button>
                  <button onClick={() => decline(m.id)} style={{ background: 'transparent', color: '#4B6358', padding: '9px 20px', borderRadius: '99px', fontWeight: 600, fontSize: 13, border: '1.5px solid #E4EEEA', cursor: 'pointer' }}>
                    Décliner
                  </button>
                  {sender.slug && (
                    <Link href={`/p/${sender.slug}`} style={{ fontSize: 12, color: '#024f41', marginLeft: 'auto', textDecoration: 'none' }}>
                      Voir le profil →
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Sent */}
      {subTab === 'sent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sent.length === 0 && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
              Aucune demande envoyée
            </div>
          )}
          {sent.map(m => {
            const receiver = m.recipient
            if (!receiver) return null
            const statusBadge = {
              accepted:  { bg: '#e8f5ef', color: '#024f41', label: 'Accepté ✓' },
              declined:  { bg: '#FEF2F2', color: '#991B1B', label: 'Décliné' },
              cancelled: { bg: 'var(--surface)', color: 'var(--text-3)', label: 'Annulé' },
              pending:   { bg: '#f4f9f9', color: '#9BB5AA', label: 'En attente' },
            }[m.status] ?? { bg: 'var(--surface)', color: 'var(--text-3)', label: m.status }

            return (
              <div key={m.id} style={{ background: '#ffffff', border: '1.5px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                  <Avatar profile={receiver} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#012722' }}>{receiver.first_name} {receiver.last_name}</div>
                    <div style={{ fontSize: 13, color: '#4B6358' }}>{receiver.role_title}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: statusBadge.bg, color: statusBadge.color, flexShrink: 0 }}>
                    {statusBadge.label}
                  </span>
                </div>
                {m.message && (
                  <p style={{ fontSize: 14, color: '#4B6358', lineHeight: 1.6, marginBottom: 6 }}>
                    &ldquo;{m.message}&rdquo;
                  </p>
                )}
                {m.availability_note && (
                  <p style={{ fontSize: 12, color: '#9BB5AA', marginBottom: 12 }}>
                    📅 {m.availability_note}
                  </p>
                )}
                {m.status === 'pending' && (
                  <button onClick={() => cancel(m.id)} style={{ background: 'transparent', color: '#9BB5AA', padding: '7px 16px', borderRadius: '99px', fontWeight: 600, fontSize: 12, border: '1.5px solid var(--border)', cursor: 'pointer' }}>
                    Annuler
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Confirmed */}
      {subTab === 'confirmed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {confirmed.length === 0 && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
              Aucun RDV confirmé pour l&apos;instant
            </div>
          )}
          {confirmed.map(m => {
            const isRequester = m.requester_id === currentUserId
            const other = isRequester ? m.recipient : m.requester
            if (!other) return null
            return (
              <div key={m.id} style={{ background: '#ffffff', border: '1.5px solid #e8f5ef', borderRadius: 14, padding: '20px 24px' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <Avatar profile={other} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#012722' }}>{other.first_name} {other.last_name}</div>
                    <div style={{ fontSize: 13, color: '#4B6358' }}>{other.role_title}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: '#e8f5ef', color: '#024f41', flexShrink: 0 }}>
                    RDV confirmé ✓
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#9BB5AA', marginTop: 12, marginBottom: other.slug ? 8 : 0 }}>
                  Le numéro a été partagé par SMS
                </p>
                {other.slug && (
                  <Link href={`/p/${other.slug}`} style={{ fontSize: 12, color: '#024f41', textDecoration: 'none' }}>
                    Voir le profil →
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
