'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { KaContact, KaAccount, ContactType } from '../types'
import type { KaAction } from '../hooks/useKeyaccount'
import { KA_STYLES, getInitials, getNextAction } from '../meddicc'
import { useKa } from '@/contexts/KaContext'

interface Props {
  contact: KaContact
  account: KaAccount
  dispatch: React.Dispatch<KaAction>
  onClose: () => void
  showToast: (msg: string) => void
}

export default function KaMeddiccPanel({ contact, account, dispatch, onClose, showToast }: Props) {
  const router = useRouter()
  const { updateContact, deleteContact } = useKa()
  const s = KA_STYLES[contact.type]
  const done      = contact.checks.reduce((a, sec) => a + sec.items.filter(i => i.done).length, 0)
  const total     = contact.checks.reduce((a, sec) => a + sec.items.length, 0)
  const pct       = total ? Math.round((done / total) * 100) : 0
  const nextAction = getNextAction(account)

  const [editMode,       setEditMode]       = useState(false)
  const [deleteConfirm,  setDeleteConfirm]  = useState(false)
  const [deleteTimer,    setDeleteTimer]    = useState<ReturnType<typeof setTimeout> | null>(null)
  const [form, setForm] = useState({
    name:     contact.name,
    role:     contact.role,
    email:    contact.email,
    phone:    contact.phone ?? '',
    linkedin: contact.linkedin ?? '',
    notes:    contact.notes,
    type:     contact.type as ContactType,
  })

  useEffect(() => {
    setForm({
      name:     contact.name,
      role:     contact.role,
      email:    contact.email,
      phone:    contact.phone ?? '',
      linkedin: contact.linkedin ?? '',
      notes:    contact.notes,
      type:     contact.type,
    })
    setEditMode(false)
    setDeleteConfirm(false)
  }, [contact.id])

  function toggle(sectionIdx: number, itemIdx: number) {
    dispatch({ type: 'TOGGLE_CHECK', payload: { accountId: account.id, contactId: contact.id, sectionIdx, itemIdx } })
  }

  function handleDeleteClick() {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      const t = setTimeout(() => setDeleteConfirm(false), 3000)
      setDeleteTimer(t)
    } else {
      if (deleteTimer) clearTimeout(deleteTimer)
      deleteContact(account.id, contact.id)
      onClose()
    }
  }

  async function handleSave() {
    if (!form.name.trim()) return
    await updateContact(account.id, contact.id, form)
    showToast('Contact mis à jour ✓')
    setEditMode(false)
  }

  function openDealLink() {
    const params = new URLSearchParams({ prospect: account.name, company: account.name, sector: account.sector || '' })
    router.push('/dashboard/tools/deallink?' + params.toString())
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--r-sm)',
    fontSize: 13, color: 'var(--text)',
    outline: 'none', transition: '.14s',
    fontFamily: 'inherit', background: 'var(--white)',
  }

  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', marginTop: '14px', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          display: 'grid', placeItems: 'center',
          fontSize: '13px', fontWeight: 700, flexShrink: 0,
          background: s.avBg, color: s.avColor, border: `2px solid ${s.border}`,
        }}>
          {getInitials(contact.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>{contact.role || '—'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, padding: '3px 10px', borderRadius: 'var(--r-sm)', fontSize: '11px', fontWeight: 600 }}>
            {s.label}
          </span>
          <button
            onClick={() => setEditMode(e => !e)}
            title="Modifier ce contact"
            style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', border: `1px solid ${editMode ? 'var(--green)' : 'var(--border)'}`, background: editMode ? 'var(--green-3)' : 'var(--surface)', color: editMode ? 'var(--green)' : 'var(--text-2)', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 13, transition: '.14s' }}
          >
            ✏️
          </button>
          <button
            onClick={handleDeleteClick}
            title={deleteConfirm ? 'Cliquer pour confirmer' : 'Supprimer ce contact'}
            style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', border: `1px solid ${deleteConfirm ? 'var(--red)' : 'var(--border)'}`, background: deleteConfirm ? 'var(--red-2)' : 'var(--surface)', color: deleteConfirm ? 'var(--red)' : 'var(--text-3)', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 13, transition: '.14s' }}
          >
            {deleteConfirm ? '⚠️' : '🗑'}
          </button>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '15px', color: 'var(--text-2)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Edit mode */}
      {editMode ? (
        <div style={{ padding: '16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>
            Modifier le contact
          </div>

          {(['name', 'role', 'email', 'phone', 'linkedin'] as const).map(key => (
            <div key={key} style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                {key === 'name' ? 'Prénom Nom *' : key === 'role' ? 'Titre / Rôle' : key === 'email' ? 'Email' : key === 'phone' ? 'Téléphone direct' : 'LinkedIn'}
              </label>
              <input
                value={form[key]}
                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={key === 'name' ? 'Prénom Nom' : key === 'role' ? 'Ex : Directeur Commercial' : key === 'email' ? 'email@entreprise.fr' : key === 'phone' ? '+33 6 00 00 00 00' : 'https://linkedin.com/in/...'}
                style={inp}
                onFocus={e => (e.target.style.borderColor = 'var(--green)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
          ))}

          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Contexte, points clés..."
              style={{ ...inp, resize: 'vertical' }}
              onFocus={e => (e.target.style.borderColor = 'var(--green)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>Profil MEDDICC</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['champion', 'decision', 'blocker', 'neutral'] as ContactType[]).map(t => {
                const ts = KA_STYLES[t]
                return (
                  <button
                    key={t}
                    onClick={() => setForm(prev => ({ ...prev, type: t }))}
                    style={{ padding: '5px 12px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: '.14s', border: `1.5px solid ${form.type === t ? ts.border : 'var(--border)'}`, background: form.type === t ? ts.bg : 'var(--white)', color: form.type === t ? ts.text : 'var(--text-3)' }}
                  >
                    {ts.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              style={{ flex: 1, padding: '9px', background: form.name.trim() ? 'var(--green)' : 'var(--surface)', color: form.name.trim() ? '#fff' : 'var(--text-3)', border: `1px solid ${form.name.trim() ? 'var(--green)' : 'var(--border)'}`, borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 700, cursor: form.name.trim() ? 'pointer' : 'not-allowed', transition: '.14s', fontFamily: "'Jost', sans-serif" }}
            >
              Sauvegarder
            </button>
            <button
              onClick={() => setEditMode(false)}
              style={{ padding: '9px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--text-2)', cursor: 'pointer', transition: '.14s' }}
            >
              Annuler
            </button>
          </div>
        </div>

      ) : (
        <div style={{ padding: '16px 20px 20px' }}>
          {/* Score bar */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-2)', marginBottom: '5px' }}>
              <span>Qualification MEDDICC</span>
              <span style={{ fontWeight: 600, color: 'var(--green)' }}>{pct}%</span>
            </div>
            <div style={{ height: '5px', background: 'var(--surface-2)', borderRadius: 'var(--r-full)' }}>
              <div style={{ height: '5px', borderRadius: 'var(--r-full)', background: 'var(--green)', transition: 'width .5s cubic-bezier(.16,1,.3,1)', width: pct + '%' }} />
            </div>
          </div>

          {/* Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {contact.checks.map((sec, si) => (
              <div key={sec.cat} style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '7px' }}>
                  {sec.cat}
                </div>
                {sec.items.map((item, ii) => (
                  <div
                    key={ii}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', padding: '8px 0', borderBottom: '1px solid var(--border)' }}
                  >
                    <div
                      onClick={() => toggle(si, ii)}
                      style={{ width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0, marginTop: '1px', border: `1.5px solid ${item.done ? s.border : 'var(--border)'}`, background: item.done ? s.bg : 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '.14s' }}
                    >
                      {item.done && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={s.text} strokeWidth="1.8">
                          <path d="M1.5 5l2.5 2.5 4.5-4.5"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.4 }}>{item.l}</div>
                      {item.n && <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{item.n}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Prochaine action */}
          <div style={{ marginTop: '18px', background: 'var(--green-3)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-md)', padding: '12px 14px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '5px' }}>Prochaine action</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>{nextAction}</div>
          </div>

          {/* DealLink shortcut */}
          <button
            onClick={openDealLink}
            style={{ marginTop: '10px', width: '100%', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '9px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: '.14s' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 6h8M7 3l3 3-3 3"/></svg>
            Créer un DealLink pour {account.name}
          </button>
        </div>
      )}
    </div>
  )
}
