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

type Member = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  tokens: number
  points: number
  is_active: boolean
  is_manually_activated?: boolean
  profile_visible?: boolean
  plan_id: string | null
  created_at: string
}

type Detail = {
  profile: Member
  transactions: { tool_name: string; tokens_used: number; created_at: string }[]
  referrals: { id: string; first_name: string; last_name: string }[]
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
}

function Badge({ active }: { active: boolean }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
      background: active ? 'rgba(47,84,70,0.3)' : 'rgba(224,82,82,0.15)',
      color: active ? '#4A8C6F' : '#E05252',
      letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>
      {active ? 'Actif' : 'Inactif'}
    </span>
  )
}

export default function MembresPage() {
  const [members, setMembers]   = useState<Member[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<'all' | 'active' | 'inactive'>('all')
  const [detail, setDetail]     = useState<Detail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState<Member | null>(null)
  const [adjustType, setAdjustType] = useState<'tokens' | 'points'>('tokens')
  const [adjustAmt, setAdjustAmt]   = useState('')
  const [adjustNote, setAdjustNote] = useState('')
  const [delConfirm, setDelConfirm] = useState('')
  const [delTarget, setDelTarget]   = useState<Member | null>(null)
  const [working, setWorking]   = useState(false)
  const [error, setError]       = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ phone: '', first_name: '', last_name: '', referral_code: '', is_active: true })
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filter !== 'all') params.set('status', filter)
    const r = await fetch(`/api/admin/members/list?${params}`)
    const d = await r.json()
    if (!r.ok) {
      setError(`Erreur ${r.status} : ${d.error ?? 'inconnue'}`)
      setMembers([])
    } else {
      setMembers(d.members ?? [])
    }
    setLoading(false)
  }, [search, filter])

  useEffect(() => { load() }, [load])

  async function openDetail(m: Member) {
    setDetailOpen(true)
    setDetail(null)
    const r = await fetch(`/api/admin/members/detail?id=${m.id}`)
    const d = await r.json()
    setDetail(d)
  }

  async function toggleActive(m: Member) {
    setWorking(true)
    await fetch('/api/admin/members/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: m.id, action: 'toggle_active' }),
    })
    await load()
    setWorking(false)
  }

  async function toggleManualActivation(m: Member) {
    setWorking(true)
    await fetch('/api/admin/members/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: m.id, activate: !m.is_manually_activated }),
    })
    await load()
    setWorking(false)
  }

  async function toggleVisibility(m: Member) {
    setWorking(true)
    await fetch('/api/admin/members/visibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: m.id, visible: !(m.profile_visible ?? true) }),
    })
    await load()
    setWorking(false)
  }

  async function applyAdjust() {
    if (!adjustOpen) return
    setWorking(true)
    setError('')
    const amt = parseInt(adjustAmt)
    if (isNaN(amt) || amt === 0) { setError('Montant invalide'); setWorking(false); return }
    const isAdd = amt > 0
    const action = adjustType === 'tokens'
      ? (isAdd ? 'add_tokens' : 'remove_tokens')
      : (isAdd ? 'add_points' : 'remove_points')
    const res = await fetch('/api/admin/members/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId: adjustOpen.id,
        action,
        amount: Math.abs(amt),
        reason: adjustNote || undefined,
      }),
    })
    if (res.ok) {
      setAdjustOpen(null); setAdjustAmt(''); setAdjustNote('')
      await load()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Erreur')
    }
    setWorking(false)
  }

  async function deleteMember() {
    if (!delTarget) return
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/admin/members/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: delTarget.id, confirm: delConfirm }),
      })
      const d = await res.json()
      if (res.ok) {
        setDelTarget(null); setDelConfirm('')
        await load()
      } else {
        setError(d.error ?? 'Erreur inconnue')
      }
    } catch (err: any) {
      setError(err?.message ?? 'Erreur réseau')
    } finally {
      setWorking(false)
    }
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, padding: 20,
  }
  const modal: React.CSSProperties = {
    background: C.card, border: `1px solid ${C.green}`,
    borderRadius: 14, padding: '28px', width: '100%', maxWidth: 460,
    maxHeight: '80vh', overflowY: 'auto',
  }
  const inputSt: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: C.input, border: `1px solid rgba(255,255,255,0.1)`,
    borderRadius: 8, padding: '10px 12px', fontSize: 13,
    color: C.text, fontFamily: 'Inter, sans-serif', outline: 'none',
  }
  const btnPrimary: React.CSSProperties = {
    padding: '9px 18px', borderRadius: 8, background: C.green,
    border: 'none', color: C.text, fontSize: 13, fontWeight: 600,
    fontFamily: 'Inter, sans-serif', cursor: 'pointer',
  }
  const btnGhost: React.CSSProperties = {
    ...btnPrimary, background: 'transparent',
    border: `1px solid rgba(255,255,255,0.1)`, color: C.text2,
  }

  async function createMember() {
    setCreating(true)
    setCreateError('')
    const res = await fetch('/api/admin/members/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: createForm.phone,
        first_name: createForm.first_name || undefined,
        last_name: createForm.last_name || undefined,
        referral_code: createForm.referral_code || undefined,
        is_active: createForm.is_active,
      }),
    })
    const d = await res.json()
    if (res.ok) {
      setCreateOpen(false)
      setCreateForm({ phone: '', first_name: '', last_name: '', referral_code: '', is_active: true })
      await load()
    } else {
      setCreateError(d.error ?? 'Erreur lors de la création')
    }
    setCreating(false)
  }

  const addBtn = (
    <button
      style={{ padding: '9px 18px', borderRadius: 8, background: C.green, border: 'none', color: C.text, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}
      onClick={() => { setCreateOpen(true); setCreateError('') }}
    >
      ＋ Ajouter manuellement
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0F1C17' }}>
      <AdminHeader title="Membres" action={addBtn} />
      <div style={{ padding: '28px 40px' }}>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          style={{ ...inputSt, maxWidth: 280 }}
          placeholder="Rechercher un membre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            ...btnGhost,
            background: filter === f ? 'rgba(47,84,70,0.25)' : 'transparent',
            color: filter === f ? C.text : C.text2,
            border: `1px solid ${filter === f ? C.green : 'rgba(255,255,255,0.1)'}`,
          }}>
            {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Inactifs'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, color: C.text2, textAlign: 'center' }}>Chargement…</div>
        ) : error ? (
          <div style={{ padding: 40, color: C.error, textAlign: 'center', fontSize: 13 }}>{error}</div>
        ) : members.length === 0 ? (
          <div style={{ padding: 40, color: C.text2, textAlign: 'center' }}>Aucun membre</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Membre', 'Plan', 'Tokens', 'Points', 'Statut', 'Inscrit', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{ fontWeight: 600, color: C.text }}>{m.first_name} {m.last_name}</p>
                    <p style={{ fontSize: 11, color: C.text2 }}>{m.email}</p>
                  </td>
                  <td style={{ padding: '12px 16px', color: C.text2 }}>{m.plan_id ?? '—'}</td>
                  <td style={{ padding: '12px 16px', color: C.text }}>{m.tokens}</td>
                  <td style={{ padding: '12px 16px', color: C.text }}>{m.points}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Badge active={m.is_active} />
                      {m.is_manually_activated && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(47,84,70,0.15)', color: '#2F5446', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          Accès manuel
                        </span>
                      )}
                      {m.profile_visible === false && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(180,120,0,0.15)', color: '#B47800', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          Profil masqué
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: C.text2 }}>{fmtDate(m.created_at)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ ...btnGhost, padding: '5px 10px', fontSize: 11 }} onClick={() => openDetail(m)}>Détail</button>
                      <button style={{ ...btnGhost, padding: '5px 10px', fontSize: 11 }} onClick={() => { setAdjustOpen(m); setAdjustType('tokens'); setAdjustAmt(''); setAdjustNote(''); setError('') }}>
                        Ajuster
                      </button>
                      <button
                        style={{ ...btnGhost, padding: '5px 10px', fontSize: 11 }}
                        onClick={() => toggleActive(m)}
                        disabled={working}
                      >
                        {m.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        style={{
                          ...btnGhost, padding: '5px 10px', fontSize: 11,
                          color: m.is_manually_activated ? '#E05252' : '#2F5446',
                          borderColor: m.is_manually_activated ? 'rgba(224,82,82,0.3)' : 'rgba(47,84,70,0.3)',
                        }}
                        onClick={() => toggleManualActivation(m)}
                        disabled={working}
                        title={m.is_manually_activated ? 'Retirer l\'accès manuel' : 'Activer manuellement (sans Stripe)'}
                      >
                        {m.is_manually_activated ? 'Retirer accès' : 'Accès manuel'}
                      </button>
                      <button
                        style={{ ...btnGhost, padding: '5px 10px', fontSize: 11, color: m.profile_visible === false ? '#4A8C6F' : '#B47800', borderColor: m.profile_visible === false ? 'rgba(74,140,111,0.3)' : 'rgba(180,120,0,0.3)' }}
                        onClick={() => toggleVisibility(m)}
                        disabled={working}
                      >
                        {m.profile_visible === false ? 'Rendre visible' : 'Masquer'}
                      </button>
                      <button style={{ ...btnGhost, padding: '5px 10px', fontSize: 11, color: C.error, borderColor: 'rgba(224,82,82,0.3)' }} onClick={() => { setDelTarget(m); setDelConfirm(''); setError('') }}>
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

      {/* Detail modal */}
      {detailOpen && (
        <div style={overlay} onClick={() => setDetailOpen(false)}>
          <div style={{ ...modal, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                {detail?.profile.first_name} {detail?.profile.last_name}
              </h2>
              <button onClick={() => setDetailOpen(false)} style={{ ...btnGhost, padding: '4px 10px', fontSize: 12 }}>✕</button>
            </div>
            {!detail ? (
              <p style={{ color: C.text2 }}>Chargement…</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {[
                    ['Email', detail.profile.email],
                    ['Téléphone', detail.profile.phone ?? '—'],
                    ['Tokens', String(detail.profile.tokens)],
                    ['Points', String(detail.profile.points)],
                    ['Plan', detail.profile.plan_id ?? '—'],
                    ['Inscrit le', fmtDate(detail.profile.created_at)],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p style={{ fontSize: 10, color: C.text2, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{k}</p>
                      <p style={{ fontSize: 13, color: C.text }}>{v}</p>
                    </div>
                  ))}
                </div>

                {detail.referrals.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 10, color: C.text2, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Parrainages</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {detail.referrals.map(r => (
                        <span key={r.id} style={{ fontSize: 12, background: 'rgba(47,84,70,0.2)', borderRadius: 6, padding: '4px 10px', color: C.text }}>
                          {r.first_name} {r.last_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {detail.transactions.length > 0 && (
                  <div>
                    <p style={{ fontSize: 10, color: C.text2, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>10 dernières utilisations</p>
                    {detail.transactions.map((t, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 12, color: C.text }}>{t.tool_name}</span>
                        <span style={{ fontSize: 11, color: C.text2 }}>{t.tokens_used} tokens · {fmtDate(t.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Adjust modal */}
      {adjustOpen && (
        <div style={overlay} onClick={() => setAdjustOpen(null)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>
              Ajuster — {adjustOpen.first_name} {adjustOpen.last_name}
            </h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {(['tokens', 'points'] as const).map(t => (
                <button key={t} onClick={() => setAdjustType(t)} style={{
                  ...btnGhost,
                  background: adjustType === t ? 'rgba(47,84,70,0.25)' : 'transparent',
                  color: adjustType === t ? C.text : C.text2,
                  border: `1px solid ${adjustType === t ? C.green : 'rgba(255,255,255,0.1)'}`,
                  textTransform: 'capitalize',
                }}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input style={inputSt} type="number" placeholder="Montant (négatif = retrait)" value={adjustAmt} onChange={e => setAdjustAmt(e.target.value)} />
              <input style={inputSt} placeholder="Note (optionnel)" value={adjustNote} onChange={e => setAdjustNote(e.target.value)} />
              {error && <p style={{ color: C.error, fontSize: 12 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={btnPrimary} onClick={applyAdjust} disabled={working}>{working ? '…' : 'Appliquer'}</button>
                <button style={btnGhost} onClick={() => setAdjustOpen(null)}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {delTarget && (
        <div style={overlay} onClick={() => setDelTarget(null)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.error, marginBottom: 12 }}>Supprimer le membre</h2>
            <p style={{ fontSize: 13, color: C.text2, marginBottom: 20 }}>
              Cette action est irréversible. Pour confirmer, tape{' '}
              <strong style={{ color: C.text }}>{delTarget.first_name} {delTarget.last_name}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input style={inputSt} placeholder="Nom complet du membre" value={delConfirm} onChange={e => setDelConfirm(e.target.value)} />
              {error && <p style={{ color: C.error, fontSize: 12 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={{ ...btnPrimary, background: C.error }}
                  onClick={deleteMember}
                  disabled={working || delConfirm.trim() !== `${delTarget.first_name.trim()} ${delTarget.last_name.trim()}`}
                >
                  {working ? '…' : 'Supprimer définitivement'}
                </button>
                <button style={btnGhost} onClick={() => setDelTarget(null)}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create member modal */}
      {createOpen && (
        <div style={overlay} onClick={() => setCreateOpen(false)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Ajouter un membre</h2>
              <button onClick={() => setCreateOpen(false)} style={{ background: 'none', border: 'none', color: C.text2, fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <p style={{ fontSize: 10, color: C.text2, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Téléphone *</p>
                <input
                  style={inputSt}
                  placeholder="+33 6 12 34 56 78"
                  value={createForm.phone}
                  onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 10, color: C.text2, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Prénom</p>
                  <input style={inputSt} placeholder="Prénom" value={createForm.first_name} onChange={e => setCreateForm(p => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div>
                  <p style={{ fontSize: 10, color: C.text2, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Nom</p>
                  <input style={inputSt} placeholder="Nom" value={createForm.last_name} onChange={e => setCreateForm(p => ({ ...p, last_name: e.target.value }))} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: 10, color: C.text2, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Code parrain (optionnel)</p>
                <input style={inputSt} placeholder="Code de parrainage existant" value={createForm.referral_code} onChange={e => setCreateForm(p => ({ ...p, referral_code: e.target.value }))} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={createForm.is_active}
                  onChange={e => setCreateForm(p => ({ ...p, is_active: e.target.checked }))}
                />
                <span style={{ fontSize: 13, color: C.text }}>Activer immédiatement</span>
              </label>
              {createError && <p style={{ color: C.error, fontSize: 12 }}>{createError}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={btnPrimary}
                  onClick={createMember}
                  disabled={creating || !createForm.phone.trim()}
                >
                  {creating ? '…' : 'Créer le membre'}
                </button>
                <button style={btnGhost} onClick={() => setCreateOpen(false)}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
