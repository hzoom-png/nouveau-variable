'use client'

import { useEffect, useState, useCallback } from 'react'
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

type Event = {
  id: string
  title: string
  description: string | null
  event_date: string
  location: string | null
  cover_image_url: string | null
  max_attendees: number | null
  is_published: boolean
  created_at: string
}

type FormState = {
  title: string
  description: string
  event_date: string
  location: string
  cover_image_url: string
  max_attendees: string
  is_published: boolean
}

const EMPTY_FORM: FormState = {
  title: '', description: '', event_date: '', location: '',
  cover_image_url: '', max_attendees: '', is_published: false,
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function EvenementsPage() {
  const [events, setEvents]   = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState<FormState>(EMPTY_FORM)
  const [editing, setEditing] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError]     = useState('')
  const [delId, setDelId]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/admin/events/list').catch(() => null)
    if (r?.ok) {
      const d = await r.json()
      setEvents(d.events ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditing(null)
    setError('')
    setModalOpen(true)
  }

  function openEdit(e: Event) {
    setForm({
      title: e.title,
      description: e.description ?? '',
      event_date: e.event_date ? e.event_date.slice(0, 16) : '',
      location: e.location ?? '',
      cover_image_url: e.cover_image_url ?? '',
      max_attendees: e.max_attendees != null ? String(e.max_attendees) : '',
      is_published: e.is_published,
    })
    setEditing(e.id)
    setError('')
    setModalOpen(true)
  }

  async function submit() {
    setWorking(true)
    setError('')
    const payload = {
      ...form,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
      ...(editing ? { eventId: editing } : {}),
    }
    const url = editing ? '/api/admin/events/update' : '/api/admin/events/create'
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setModalOpen(false)
      await load()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Erreur')
    }
    setWorking(false)
  }

  async function togglePublish(e: Event) {
    setWorking(true)
    await fetch('/api/admin/events/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: e.id, is_published: !e.is_published }),
    })
    await load()
    setWorking(false)
  }

  async function deleteEvent(id: string) {
    setWorking(true)
    await fetch('/api/admin/events/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: id }),
    })
    setDelId(null)
    await load()
    setWorking(false)
  }

  const inputSt: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: C.input, border: `1px solid rgba(255,255,255,0.1)`,
    borderRadius: 8, padding: '10px 12px', fontSize: 13,
    color: C.text, fontFamily: 'Inter, sans-serif', outline: 'none',
  }
  const btnPrimary: React.CSSProperties = {
    padding: '10px 20px', borderRadius: 8, background: C.green,
    border: 'none', color: C.text, fontSize: 13, fontWeight: 700,
    fontFamily: 'Inter, sans-serif', cursor: 'pointer',
  }
  const btnGhost: React.CSSProperties = {
    ...btnPrimary, background: 'transparent',
    border: `1px solid rgba(255,255,255,0.1)`, color: C.text2,
  }

  const field = (label: string, el: React.ReactNode) => (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</p>
      {el}
    </div>
  )

  const createBtn = <button style={btnPrimary} onClick={openCreate}>+ Créer un événement</button>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0F1C17' }}>
      <AdminHeader title="Événements" action={createBtn} />
      <div style={{ padding: '28px 40px', maxWidth: 1000 }}>

      {loading ? (
        <p style={{ color: C.text2 }}>Chargement…</p>
      ) : events.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 48, textAlign: 'center' }}>
          <p style={{ color: C.text2 }}>Aucun événement. Crée le premier !</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {events.map(e => (
            <div key={e.id} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${e.is_published ? C.greenL : C.text2}`,
              borderRadius: 12, padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: 20,
            }}>
              {e.cover_image_url && (
                <img src={e.cover_image_url} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{e.title}</p>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                    background: e.is_published ? 'rgba(47,84,70,0.3)' : 'rgba(75,99,88,0.2)',
                    color: e.is_published ? C.greenL : C.text2,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    {e.is_published ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: C.text2 }}>📅 {fmtDate(e.event_date)}</span>
                  {e.location && <span style={{ fontSize: 12, color: C.text2 }}>📍 {e.location}</span>}
                  {e.max_attendees && <span style={{ fontSize: 12, color: C.text2 }}>👥 Max {e.max_attendees}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button style={{ ...btnGhost, padding: '7px 14px', fontSize: 12 }} onClick={() => openEdit(e)}>
                  Modifier
                </button>
                <button
                  style={{ ...btnGhost, padding: '7px 14px', fontSize: 12, color: e.is_published ? '#A08C3A' : C.greenL }}
                  onClick={() => togglePublish(e)}
                  disabled={working}
                >
                  {e.is_published ? 'Dépublier' : 'Publier'}
                </button>
                <button
                  style={{ ...btnGhost, padding: '7px 14px', fontSize: 12, color: C.error, borderColor: 'rgba(224,82,82,0.3)' }}
                  onClick={() => setDelId(e.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
          onClick={() => setModalOpen(false)}>
          <div style={{
            background: C.card, border: `1px solid ${C.green}`,
            borderRadius: 16, padding: 28, width: '100%', maxWidth: 520,
            maxHeight: '85vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{editing ? 'Modifier' : 'Créer'} un événement</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: C.text2, fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {field('Titre', <input style={inputSt} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Nom de l'événement" />)}
              {field('Description', <textarea style={{ ...inputSt, resize: 'vertical', minHeight: 80 }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description…" />)}
              {field('Date & heure', <input style={inputSt} type="datetime-local" value={form.event_date} onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))} />)}
              {field('Lieu', <input style={inputSt} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Adresse ou lien" />)}
              {field('Image de couverture (URL)', <input style={inputSt} value={form.cover_image_url} onChange={e => setForm(p => ({ ...p, cover_image_url: e.target.value }))} placeholder="https://…" />)}
              {field('Capacité max', <input style={inputSt} type="number" value={form.max_attendees} onChange={e => setForm(p => ({ ...p, max_attendees: e.target.value }))} placeholder="Illimitée si vide" />)}

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_published} onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))} />
                <span style={{ fontSize: 13, color: C.text }}>Publier immédiatement</span>
              </label>

              {error && <p style={{ color: C.error, fontSize: 12 }}>{error}</p>}

              <div style={{ display: 'flex', gap: 8 }}>
                <button style={btnPrimary} onClick={submit} disabled={working || !form.title.trim()}>
                  {working ? '…' : editing ? 'Enregistrer' : 'Créer'}
                </button>
                <button style={btnGhost} onClick={() => setModalOpen(false)}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
          onClick={() => setDelId(null)}>
          <div style={{ background: C.card, border: `1px solid ${C.error}`, borderRadius: 14, padding: 28, maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.error, marginBottom: 12 }}>Supprimer l&apos;événement</h2>
            <p style={{ fontSize: 13, color: C.text2, marginBottom: 20 }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...btnPrimary, background: C.error }} onClick={() => deleteEvent(delId)} disabled={working}>
                {working ? '…' : 'Supprimer'}
              </button>
              <button style={btnGhost} onClick={() => setDelId(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
