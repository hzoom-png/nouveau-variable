'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminHeader } from '../_components/AdminHeader'

const C = {
  bg:     '#0F1C17',
  card:   '#1A2820',
  card2:  '#152318',
  border: 'rgba(255,255,255,0.07)',
  text:   '#F7FAF8',
  text2:  '#4B6358',
  text3:  '#9BB5AA',
  green:  '#56b791',
  green2: '#024f41',
}

const CATEGORIES = [
  { value: 'closing',         label: 'Closing'          },
  { value: 'apport_affaires', label: "Apport d'affaires" },
  { value: 'freelance',       label: 'Freelance'         },
  { value: 'conseil',         label: 'Conseil'           },
  { value: 'formation',       label: 'Formation'         },
  { value: 'affiliation',     label: 'Affiliation'       },
  { value: 'autre',           label: 'Autre'             },
]

const CAT_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]))

const STATUS_TABS = [
  { value: 'all',       label: 'Toutes'    },
  { value: 'published', label: 'Publiées'  },
  { value: 'draft',     label: 'Brouillons'},
  { value: 'archived',  label: 'Archivées' },
]

const EMPTY_FORM = {
  title: '',
  company: '',
  description: '',
  category: 'closing',
  remuneration: '',
  location: '',
  remote: false,
  url_source: '',
  tags: '',
  admin_notes: '',
}

interface Mission {
  id: string
  title: string
  company?: string
  description?: string
  category?: string
  remuneration?: string
  location?: string
  remote?: boolean
  url_source?: string
  tags?: string[]
  status: 'draft' | 'published' | 'archived'
  source?: string
  admin_notes?: string
  created_at: string
}

interface RssMission {
  title: string
  company?: string
  description?: string
  category?: string
  remuneration?: string
  location?: string
  remote?: boolean
  url_source?: string
  tags?: string[]
  _added?: boolean
}

export default function MissionsPage() {
  const [missions, setMissions]           = useState<Mission[]>([])
  const [loading, setLoading]             = useState(true)
  const [tab, setTab]                     = useState('all')
  const [showModal, setShowModal]         = useState(false)
  const [editTarget, setEditTarget]       = useState<Mission | null>(null)
  const [form, setForm]                   = useState({ ...EMPTY_FORM })
  const [saving, setSaving]               = useState(false)
  const [deleteId, setDeleteId]           = useState<string | null>(null)
  const [showRss, setShowRss]             = useState(false)
  const [rssSourceIndex, setRssSourceIndex] = useState(0)
  const [rssSources, setRssSources]       = useState<{ index: number; name: string }[]>([])
  const [rssMissions, setRssMissions]     = useState<RssMission[]>([])
  const [rssLoading, setRssLoading]       = useState(false)
  const [rssError, setRssError]           = useState('')
  const [rssSourceName, setRssSourceName] = useState('')

  const fetchMissions = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/missions')
    const data = await res.json()
    setMissions(data.missions ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchMissions() }, [fetchMissions])

  useEffect(() => {
    fetch('/api/admin/missions/rss')
      .then(r => r.json())
      .then(d => setRssSources(d.sources ?? []))
  }, [])

  const filtered = tab === 'all' ? missions : missions.filter(m => m.status === tab)

  function openAdd() {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  function openEdit(m: Mission) {
    setEditTarget(m)
    setForm({
      title:        m.title,
      company:      m.company ?? '',
      description:  m.description ?? '',
      category:     m.category ?? 'closing',
      remuneration: m.remuneration ?? '',
      location:     m.location ?? '',
      remote:       m.remote ?? false,
      url_source:   m.url_source ?? '',
      tags:         (m.tags ?? []).join(', '),
      admin_notes:  m.admin_notes ?? '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      status: editTarget?.status ?? 'draft',
    }
    if (editTarget) {
      await fetch(`/api/admin/missions/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/admin/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setSaving(false)
    setShowModal(false)
    fetchMissions()
  }

  async function handleToggleStatus(m: Mission) {
    const newStatus = m.status === 'published' ? 'draft' : 'published'
    await fetch(`/api/admin/missions/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchMissions()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/missions/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    fetchMissions()
  }

  async function handleRssFetch() {
    setRssLoading(true)
    setRssError('')
    setRssMissions([])
    const res = await fetch('/api/admin/missions/rss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceIndex: rssSourceIndex }),
    })
    const data = await res.json()
    setRssLoading(false)
    if (!res.ok || data.error) {
      setRssError(data.error ?? 'Erreur inconnue')
    } else {
      setRssMissions(data.missions ?? [])
      setRssSourceName(data.source ?? '')
    }
  }

  async function handleRssAdd(idx: number) {
    const m = rssMissions[idx]
    await fetch('/api/admin/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...m, status: 'draft', source: 'rss_sourced' }),
    })
    setRssMissions(prev => prev.map((r, i) => i === idx ? { ...r, _added: true } : r))
    fetchMissions()
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 11px',
    background: '#0F1C17', border: `1px solid ${C.border}`,
    borderRadius: 8, color: C.text, fontSize: 13,
    fontFamily: 'inherit', outline: 'none',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: C.text3, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: C.bg }}>
      <AdminHeader title="Missions" />

      <div style={{ padding: '32px 40px', flex: 1 }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {STATUS_TABS.map(t => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                style={{
                  padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', border: 'none',
                  background: tab === t.value ? C.green : C.card,
                  color: tab === t.value ? '#fff' : C.text3,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowRss(v => !v)}
              style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: C.card, border: `1px solid ${C.border}`, color: C.text3 }}
            >
              📡 Sourcer via RSS
            </button>
            <button
              onClick={openAdd}
              style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: C.green, border: 'none', color: '#fff' }}
            >
              + Ajouter manuellement
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

          {/* Table */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: C.text3 }}>Chargement…</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: C.text3 }}>Aucune mission</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {['Titre', 'Catégorie', 'Rémunération', 'Source', 'Statut', ''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.text3, letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(m => (
                      <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: C.text, maxWidth: 220 }}>
                          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                          {m.company && <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{m.company}</div>}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: 'rgba(86,183,145,0.12)', color: C.green }}>
                            {CAT_LABEL[m.category ?? ''] ?? m.category ?? '—'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: C.text3 }}>{m.remuneration ?? '—'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: m.source === 'rss_sourced' ? 'rgba(86,183,145,0.12)' : 'rgba(255,255,255,0.05)', color: m.source === 'rss_sourced' ? C.green : C.text3 }}>
                            {m.source === 'rss_sourced' ? 'RSS' : 'Manuel'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: m.status === 'published' ? 'rgba(86,183,145,0.15)' : m.status === 'archived' ? 'rgba(255,255,255,0.04)' : 'rgba(255,200,50,0.1)', color: m.status === 'published' ? C.green : m.status === 'archived' ? C.text3 : '#e6b800' }}>
                            {m.status === 'published' ? 'Publiée' : m.status === 'archived' ? 'Archivée' : 'Brouillon'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleToggleStatus(m)}
                              title={m.status === 'published' ? 'Dépublier' : 'Publier'}
                              style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${C.border}`, background: 'transparent', color: C.text3 }}
                            >
                              {m.status === 'published' ? '⏸' : '▶'}
                            </button>
                            <button
                              onClick={() => openEdit(m)}
                              style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${C.border}`, background: 'transparent', color: C.text3 }}
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => setDeleteId(m.id)}
                              style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(224,82,82,0.3)', background: 'transparent', color: '#e05252' }}
                            >
                              ✕
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

          {/* RSS panel */}
          {showRss && (
            <div style={{ width: 380, flexShrink: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>
                Sourcer via RSS
              </div>

              <label style={lbl}>Source RSS</label>
              <select
                value={rssSourceIndex}
                onChange={e => setRssSourceIndex(Number(e.target.value))}
                style={{ ...inp, marginBottom: 10 }}
              >
                {rssSources.map(s => (
                  <option key={s.index} value={s.index}>{s.name}</option>
                ))}
              </select>

              <button
                onClick={handleRssFetch}
                disabled={rssLoading}
                style={{ width: '100%', padding: '9px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: rssLoading ? 'not-allowed' : 'pointer', background: rssLoading ? C.card2 : C.green, border: 'none', color: '#fff', marginBottom: 16 }}
              >
                {rssLoading ? 'Récupération en cours…' : '📡 Récupérer les missions'}
              </button>

              {rssError && (
                <div style={{ background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.25)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#e87070', marginBottom: 12 }}>
                  {rssError}
                  <div style={{ marginTop: 6, color: C.text3 }}>→ Ajoute la mission manuellement avec le bouton ci-dessus.</div>
                </div>
              )}

              {rssMissions.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Résultats — {rssSourceName}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflowY: 'auto' }}>
                    {rssMissions.map((m, i) => (
                      <div
                        key={i}
                        style={{ background: m._added ? 'rgba(255,255,255,0.02)' : C.card2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, opacity: m._added ? 0.45 : 1 }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 2 }}>{m.title}</div>
                        {m.company && <div style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>{m.company}</div>}
                        <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, marginBottom: 8 }}>
                          {m.description}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                          {m.category && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(86,183,145,0.12)', color: C.green }}>
                              {CAT_LABEL[m.category] ?? m.category}
                            </span>
                          )}
                          {m.remote && (
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', color: C.text3 }}>
                              Remote
                            </span>
                          )}
                          {m.remuneration && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: C.green }}>{m.remuneration}</span>
                          )}
                        </div>
                        {m.url_source && (
                          <a href={m.url_source} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.green, textDecoration: 'none', display: 'block', marginBottom: 8 }}>
                            Voir l&apos;offre →
                          </a>
                        )}
                        {m._added ? (
                          <div style={{ fontSize: 12, color: C.text3, fontWeight: 600 }}>Ajouté ✓</div>
                        ) : (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleRssAdd(i)}
                              style={{ flex: 1, padding: '6px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: C.green, border: 'none', color: '#fff' }}
                            >
                              ✓ Ajouter en brouillon
                            </button>
                            <button
                              onClick={() => setRssMissions(prev => prev.filter((_, idx) => idx !== i))}
                              style={{ padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'transparent', border: `1px solid ${C.border}`, color: C.text3 }}
                            >
                              ✗
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajouter / Modifier */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
            <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: 18, color: C.text, marginBottom: 20 }}>
              {editTarget ? 'Modifier la mission' : 'Ajouter une mission'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Titre *</label>
                <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre de la mission" />
              </div>
              <div>
                <label style={lbl}>Entreprise</label>
                <input style={inp} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Nom de l'entreprise" />
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea rows={4} style={{ ...inp, resize: 'none', lineHeight: 1.5 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description de la mission…" />
              </div>
              <div>
                <label style={lbl}>Catégorie</label>
                <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>Rémunération</label>
                  <input style={inp} value={form.remuneration} onChange={e => setForm(f => ({ ...f, remuneration: e.target.value }))} placeholder="Ex: 20% commission" />
                </div>
                <div>
                  <label style={lbl}>Localisation</label>
                  <input style={inp} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Paris, Lyon…" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ ...lbl, marginBottom: 0 }}>Remote</label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, remote: !f.remote }))}
                  style={{ width: 40, height: 22, borderRadius: 11, background: form.remote ? C.green : C.border, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: form.remote ? 21 : 3, transition: 'left .2s' }} />
                </button>
              </div>
              <div>
                <label style={lbl}>URL source</label>
                <input style={inp} type="url" value={form.url_source} onChange={e => setForm(f => ({ ...f, url_source: e.target.value }))} placeholder="https://…" />
              </div>
              <div>
                <label style={lbl}>Tags (séparés par des virgules)</label>
                <input style={inp} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="BtoB, SaaS, Commission…" />
              </div>
              <div>
                <label style={lbl}>Notes admin</label>
                <textarea rows={2} style={{ ...inp, resize: 'none', lineHeight: 1.5 }} value={form.admin_notes} onChange={e => setForm(f => ({ ...f, admin_notes: e.target.value }))} placeholder="Notes internes…" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                style={{ flex: 1, padding: '11px', borderRadius: 8, background: C.green, border: 'none', color: '#fff', fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: '11px 18px', borderRadius: 8, background: 'transparent', border: `1px solid ${C.border}`, color: C.text3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth: 380, padding: 28, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: 16, color: C.text, marginBottom: 10 }}>
              Supprimer cette mission ?
            </div>
            <p style={{ fontSize: 13, color: C.text3, marginBottom: 20 }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#e05252', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Supprimer
              </button>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'transparent', border: `1px solid ${C.border}`, color: C.text3, fontSize: 13, cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
