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

type Project = {
  id: string
  title: string
  tagline: string | null
  sector: string
  stage: string
  is_active: boolean
  created_at: string
  profiles: { first_name: string; last_name: string } | null
}

type Member = {
  id: string
  first_name: string
  last_name: string
  email: string
}

const STAGES = [
  { value: 'idee',       label: 'Idée' },
  { value: 'mvp',        label: 'MVP / Prototype' },
  { value: 'lancement',  label: 'Lancement' },
  { value: 'croissance', label: 'Croissance' },
  { value: 'mature',     label: 'Mature' },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
}

const inputSt: React.CSSProperties = {
  background: C.input, border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: 8, padding: '9px 12px', fontSize: 13,
  color: C.text, fontFamily: 'Inter, sans-serif', outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

export default function ProjetsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<'' | 'active' | 'inactive'>('')
  const [search, setSearch]     = useState('')
  const [working, setWorking]   = useState<string | null>(null)
  const [error, setError]       = useState('')

  // Création
  const [showCreate, setShowCreate] = useState(false)
  const [members, setMembers]       = useState<Member[]>([])
  const [creating, setCreating]     = useState(false)
  const [createError, setCreateError] = useState('')
  const [form, setForm] = useState({
    userId: '', title: '', tagline: '', sector: '', stage: 'idee', what: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter ? `?status=${filter}` : ''
      const r = await fetch(`/api/admin/projects${params}`)
      const d = await r.json()
      setProjects(d.projects ?? [])
    } catch { /* silently fail */ }
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  async function openCreate() {
    setShowCreate(true)
    setCreateError('')
    setForm({ userId: '', title: '', tagline: '', sector: '', stage: 'idee', what: '' })
    if (members.length === 0) {
      const r = await fetch('/api/admin/members/list?status=active&page=1')
      const d = await r.json()
      setMembers(d.members ?? [])
    }
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.userId || !form.title.trim() || !form.sector.trim()) {
      setCreateError('Membre, titre et secteur sont obligatoires')
      return
    }
    setCreating(true)
    setCreateError('')
    const r = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action:  'create',
        userId:  form.userId,
        title:   form.title.trim(),
        tagline: form.tagline.trim() || undefined,
        sector:  form.sector.trim(),
        stage:   form.stage,
        what:    form.what.trim() || undefined,
      }),
    })
    const d = await r.json()
    if (!r.ok) {
      setCreateError(d.error ?? 'Erreur')
    } else {
      setShowCreate(false)
      await load()
    }
    setCreating(false)
  }

  async function toggle(p: Project) {
    setWorking(p.id)
    setError('')
    const r = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: p.id, action: 'toggle' }),
    })
    if (!r.ok) { const d = await r.json(); setError(d.error ?? 'Erreur') }
    else await load()
    setWorking(null)
  }

  async function del(p: Project) {
    if (!confirm(`Supprimer "${p.title}" définitivement ?`)) return
    setWorking(p.id)
    setError('')
    const r = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: p.id, action: 'delete' }),
    })
    if (!r.ok) { const d = await r.json(); setError(d.error ?? 'Erreur') }
    else await load()
    setWorking(null)
  }

  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    return !q || p.title.toLowerCase().includes(q) || (p.profiles?.first_name ?? '').toLowerCase().includes(q) || p.sector.toLowerCase().includes(q)
  })

  const btnGhost: React.CSSProperties = {
    padding: '5px 10px', borderRadius: 6, background: 'transparent',
    border: `1px solid rgba(255,255,255,0.1)`, color: C.text2,
    fontSize: 11, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0F1C17' }}>
      <AdminHeader
        title="Projets"
        subtitle={`${projects.length} au total`}
        action={
          <button
            onClick={openCreate}
            style={{ padding: '8px 18px', borderRadius: 8, background: C.green, border: 'none', color: C.text, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}
          >
            + Nouveau projet
          </button>
        }
      />

      <div style={{ padding: '24px 40px' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            style={{ background: C.input, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, fontFamily: 'Inter, sans-serif', outline: 'none', minWidth: 220 }}
            placeholder="Rechercher titre, auteur, secteur…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {(['', 'active', 'inactive'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              ...btnGhost,
              background: filter === f ? 'rgba(47,84,70,0.25)' : 'transparent',
              color: filter === f ? C.text : C.text2,
              border: `1px solid ${filter === f ? C.green : 'rgba(255,255,255,0.1)'}`,
            }}>
              {f === '' ? 'Tous' : f === 'active' ? 'Publiés' : 'Non publiés'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.error, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, color: C.text2, textAlign: 'center' }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, color: C.text2, textAlign: 'center' }}>Aucun projet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Titre', 'Membre', 'Secteur', 'Stade', 'Statut', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: C.text2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontWeight: 600, color: C.text }}>{p.title}</p>
                      {p.tagline && <p style={{ fontSize: 11, color: C.text2 }}>{p.tagline}</p>}
                    </td>
                    <td style={{ padding: '12px 16px', color: C.text2 }}>
                      {p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: C.text2 }}>{p.sector}</td>
                    <td style={{ padding: '12px 16px', color: C.text2 }}>{p.stage}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 10,
                        background: p.is_active ? 'rgba(47,84,70,0.3)' : 'rgba(224,82,82,0.15)',
                        color: p.is_active ? C.greenL : C.error,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>
                        {p.is_active ? 'Publié' : 'Masqué'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: C.text2, fontSize: 12 }}>{fmtDate(p.created_at)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ ...btnGhost, color: p.is_active ? '#B47800' : C.greenL }} onClick={() => toggle(p)} disabled={working === p.id}>
                          {working === p.id ? '…' : p.is_active ? 'Masquer' : 'Publier'}
                        </button>
                        <button style={{ ...btnGhost, color: C.error, borderColor: 'rgba(224,82,82,0.3)' }} onClick={() => del(p)} disabled={working === p.id}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal création */}
      {showCreate && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
          onClick={() => setShowCreate(false)}
        >
          <div
            style={{ background: C.card, border: `1px solid ${C.green}`, borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Nouveau projet</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: C.text2, fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={submitCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: C.text2, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Membre *
                </label>
                <select
                  value={form.userId}
                  onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                  required
                  style={inputSt}
                >
                  <option value="">— Sélectionner un membre —</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: C.text2, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Titre *
                </label>
                <input
                  style={inputSt}
                  placeholder="Nom du projet"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  maxLength={150}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: C.text2, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Tagline
                </label>
                <input
                  style={inputSt}
                  placeholder="Une phrase courte de description"
                  value={form.tagline}
                  onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                  maxLength={300}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: C.text2, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Secteur *
                  </label>
                  <input
                    style={inputSt}
                    placeholder="ex: SaaS, Retail, Finance…"
                    value={form.sector}
                    onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                    required
                    maxLength={100}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: C.text2, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Stade *
                  </label>
                  <select
                    value={form.stage}
                    onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                    required
                    style={inputSt}
                  >
                    {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: C.text2, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Description (optionnel)
                </label>
                <textarea
                  style={{ ...inputSt, resize: 'vertical', minHeight: 80 }}
                  placeholder="Présentation du projet…"
                  value={form.what}
                  onChange={e => setForm(f => ({ ...f, what: e.target.value }))}
                  maxLength={2000}
                />
              </div>

              {createError && (
                <p style={{ color: C.error, fontSize: 12 }}>{createError}</p>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ ...btnGhost }}>
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ padding: '9px 20px', borderRadius: 8, background: C.greenL, border: 'none', color: C.text, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: creating ? 'wait' : 'pointer' }}
                >
                  {creating ? 'Création…' : 'Créer le projet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
