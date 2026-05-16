'use client'

import { useState, useEffect, useCallback } from 'react'

type Stage = 'a_contacter' | 'contacte' | 'interresse' | 'inscrit' | 'membre'
type Role = 'sdr' | 'bdr' | 'ae' | 'kam' | 'head_of_sales' | 'independant' | 'entrepreneur' | 'autre'

interface Contact {
  id: string
  first_name: string
  last_name?: string
  email?: string
  phone?: string
  linkedin_url?: string
  role?: Role
  has_project?: boolean
  stage: Stage
  notes?: string
  reminder_at?: string
  created_at: string
}

const STAGES: { id: Stage; label: string; color: string; bg: string; border: string }[] = [
  { id: 'a_contacter', label: 'À contacter', color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' },
  { id: 'contacte',    label: 'Contacté',    color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { id: 'interresse',  label: 'Intéressé',   color: '#D97706', bg: '#FFFBEB', border: '#FCD34D' },
  { id: 'inscrit',     label: 'Inscrit',     color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { id: 'membre',      label: 'Membre ✓',   color: '#024f41', bg: '#e8f5ef', border: '#56b791' },
]

const ROLES: { value: Role; label: string }[] = [
  { value: 'sdr',           label: 'SDR'          },
  { value: 'bdr',           label: 'BDR'          },
  { value: 'ae',            label: 'AE'           },
  { value: 'kam',           label: 'KAM'          },
  { value: 'head_of_sales', label: 'Head of Sales'},
  { value: 'independant',   label: 'Indépendant'  },
  { value: 'entrepreneur',  label: 'Entrepreneur' },
  { value: 'autre',         label: 'Autre'        },
]

const EMPTY: Omit<Contact, 'id' | 'created_at'> = {
  first_name: '', last_name: '', email: '', phone: '',
  linkedin_url: '', role: undefined, has_project: false, notes: '', reminder_at: '',
  stage: 'a_contacter',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 8, fontSize: 13,
  border: '1.5px solid var(--border)', background: 'var(--surface)',
  color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
}
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--text-2)',
  textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 5,
}

export function AffiliationPipe() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState<{ open: boolean; contact?: Contact } | null>(null)
  const [form, setForm]         = useState({ ...EMPTY })
  const [saving, setSaving]     = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const f = useCallback(async () => {
    const res = await fetch('/api/affiliation/pipe')
    if (res.ok) setContacts(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { f() }, [f])

  function openAdd() {
    setForm({ ...EMPTY })
    setConfirmDel(false)
    setModal({ open: true })
  }

  function openEdit(c: Contact) {
    setForm({
      first_name: c.first_name,
      last_name: c.last_name ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      linkedin_url: c.linkedin_url ?? '',
      role: c.role,
      has_project: c.has_project ?? false,
      notes: c.notes ?? '',
      reminder_at: c.reminder_at ?? '',
      stage: c.stage,
    })
    setConfirmDel(false)
    setModal({ open: true, contact: c })
  }

  async function save() {
    if (!form.first_name.trim()) return
    setSaving(true)
    const isEdit = !!modal?.contact
    const url    = isEdit ? `/api/affiliation/pipe/${modal!.contact!.id}` : '/api/affiliation/pipe'
    const body   = { ...form, role: form.role || null, reminder_at: form.reminder_at || null, stage: form.stage }
    const res    = await fetch(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) { await f(); setModal(null) }
  }

  async function moveStage(id: string, stage: Stage) {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, stage } : c))
    await fetch(`/api/affiliation/pipe/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    })
  }

  async function del() {
    if (!modal?.contact) return
    setSaving(true)
    await fetch(`/api/affiliation/pipe/${modal.contact.id}`, { method: 'DELETE' })
    setSaving(false)
    await f()
    setModal(null)
  }

  const byStage = (s: Stage) => contacts.filter(c => c.stage === s)

  if (loading) return (
    <div style={{ padding: '20px 0', color: 'var(--text-3)', fontSize: 13 }}>Chargement du pipeline…</div>
  )

  return (
    <>
      <style>{`
        .pipe-card { transition: box-shadow .15s; cursor: pointer; }
        .pipe-card:hover { box-shadow: 0 4px 14px rgba(2,79,65,.12); }
        .pipe-stage-select { appearance: none; border: 1px solid var(--border); background: var(--surface); border-radius: 6px; font-size: 11px; font-weight: 600; padding: 3px 20px 3px 8px; cursor: pointer; color: var(--text-2); }
        .pipe-stage-select:focus { outline: none; }
        @media (max-width: 900px) { .pipe-board { overflow-x: auto !important; } .pipe-col { min-width: 220px !important; } }
      `}</style>

      <div style={{ background: 'var(--white)', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 6px rgba(2,79,65,.07)', marginBottom: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>
              Pipeline d&apos;affiliation
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {contacts.length} contact{contacts.length !== 1 ? 's' : ''} dans le pipeline
            </div>
          </div>
          <button
            onClick={openAdd}
            style={{
              background: '#024f41', color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
            Ajouter un contact
          </button>
        </div>

        {/* Board */}
        <div className="pipe-board" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {STAGES.map(st => {
            const cols = byStage(st.id)
            return (
              <div key={st.id} className="pipe-col" style={{ flex: '1 0 200px', minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Column header */}
                <div style={{ padding: '7px 10px', borderRadius: 8, background: st.bg, border: `1px solid ${st.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: st.color, textTransform: 'uppercase', letterSpacing: '.05em' }}>{st.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: 'rgba(0,0,0,.06)', borderRadius: 99, padding: '1px 7px' }}>{cols.length}</span>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 40 }}>
                  {cols.map(c => (
                    <div
                      key={c.id}
                      className="pipe-card"
                      onClick={() => openEdit(c)}
                      style={{
                        background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 10,
                        padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,.04)',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.first_name} {c.last_name}
                      </div>
                      {c.role && (
                        <div style={{ fontSize: 10, fontWeight: 600, color: st.color, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 99, padding: '1px 7px', display: 'inline-block', marginBottom: 4 }}>
                          {ROLES.find(r => r.value === c.role)?.label ?? c.role}
                        </div>
                      )}
                      {c.email && (
                        <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</div>
                      )}
                      {c.reminder_at && (
                        <div style={{ fontSize: 10, color: '#D97706', marginTop: 4, fontWeight: 600 }}>
                          ⏰ {new Date(c.reminder_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </div>
                      )}
                      {/* Stage move */}
                      <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                        <select
                          className="pipe-stage-select"
                          value={c.stage}
                          onChange={e => moveStage(c.id, e.target.value as Stage)}
                          style={{ width: '100%' }}
                        >
                          {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                  {cols.length === 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0', borderRadius: 8, border: '1.5px dashed var(--border)' }}>
                      Vide
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal */}
      {modal?.open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
        >
          <div style={{ background: 'var(--white)', borderRadius: 16, padding: '28px 32px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,.18)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 800, fontSize: 17, color: 'var(--text)', marginBottom: 20 }}>
              {modal.contact ? 'Modifier le contact' : 'Ajouter un contact'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={lbl}>Prénom *</label>
                <input style={inp} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="Prénom" autoFocus />
              </div>
              <div>
                <label style={lbl}>Nom</label>
                <input style={inp} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Nom" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={lbl}>Email</label>
                <input style={inp} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@ex.com" />
              </div>
              <div>
                <label style={lbl}>Téléphone</label>
                <input style={inp} type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="06 xx xx xx xx" />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>LinkedIn</label>
              <input style={inp} value={form.linkedin_url} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))} placeholder="linkedin.com/in/…" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={lbl}>Rôle</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={form.role ?? ''} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role || undefined }))}>
                  <option value="">— Rôle</option>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Stade</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as Stage }))}>
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Rappel</label>
              <input style={inp} type="date" value={form.reminder_at ?? ''} onChange={e => setForm(f => ({ ...f, reminder_at: e.target.value }))} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
                <input type="checkbox" checked={form.has_project ?? false} onChange={e => setForm(f => ({ ...f, has_project: e.target.checked }))} style={{ accentColor: '#024f41' }} />
                A un projet commercial / une idée de side hustle
              </label>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Notes</label>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Contexte, objections, prochaine étape…" />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
              {modal.contact ? (
                confirmDel ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={del} disabled={saving} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#B91C1C', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      Confirmer
                    </button>
                    <button onClick={() => setConfirmDel(false)} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDel(true)} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', cursor: 'pointer' }}>
                    Supprimer
                  </button>
                )
              ) : <div />}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setModal(null)} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={save} disabled={saving || !form.first_name.trim()} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: '#024f41', color: '#fff', border: 'none', cursor: 'pointer', opacity: saving ? .7 : 1 }}>
                  {saving ? 'Enregistrement…' : modal.contact ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
