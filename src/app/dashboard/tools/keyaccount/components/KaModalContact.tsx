'use client'

import { useState } from 'react'
import type { ContactType } from '../types'
import type { KaAction } from '../hooks/useKeyaccount'
import { KA_STYLES } from '../meddicc'

interface Props {
  accountId: string
  accountName: string
  dispatch: React.Dispatch<KaAction>
  onClose: () => void
  onCreated: (name: string, type: ContactType) => void
}

const TYPES: ContactType[] = ['champion', 'decision', 'blocker', 'neutral']

export default function KaModalContact({ accountId, accountName, dispatch, onClose, onCreated }: Props) {
  const [name,        setName]        = useState('')
  const [role,        setRole]        = useState('')
  const [email,       setEmail]       = useState('')
  const [notes,       setNotes]       = useState('')
  const [contactType, setContactType] = useState<ContactType>('champion')

  function save() {
    if (!name.trim()) return
    dispatch({ type: 'ADD_CONTACT', payload: { accountId, name: name.trim(), role: role.trim(), email: email.trim(), notes: notes.trim(), contactType } })
    onCreated(name.trim(), contactType)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,28,23,.45)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: '480px', margin: 'auto', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', animation: 'kaModalIn .22s cubic-bezier(.16,1,.3,1)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>Nouveau contact</div>
            <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>Compte : {accountName}</div>
          </div>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: 'var(--r-sm)', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '16px', color: 'var(--text-2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '5px' }}>Prénom Nom *</label>
              <input className="finput" value={name} onChange={e => setName(e.target.value)} placeholder="Prénom Nom du contact" autoFocus />
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '5px' }}>Titre / Rôle</label>
              <input className="finput" value={role} onChange={e => setRole(e.target.value)} placeholder="Ex : Directeur Commercial, DRH…" />
            </div>
          </div>

          {/* Type pills */}
          <div>
            <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '8px' }}>Profil MEDDICC</label>
            <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
              {TYPES.map(t => {
                const s = KA_STYLES[t]
                const active = contactType === t
                return (
                  <span
                    key={t}
                    onClick={() => setContactType(t)}
                    className="ka-type-pill"
                    style={{
                      background: active ? s.bg : 'var(--white)',
                      borderColor: active ? s.border : 'var(--border)',
                      color: active ? s.text : 'var(--text-2)',
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    {s.label}
                  </span>
                )
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '5px' }}>Email</label>
            <input className="finput" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@entreprise.fr" />
          </div>
          <div>
            <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '5px' }}>Notes rapides</label>
            <textarea className="finput" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Contexte, point d'entrée, relation…" style={{ resize: 'none', lineHeight: 1.5 }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px 20px', display: 'flex', gap: '8px' }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)', padding: '10px', borderRadius: 'var(--r-sm)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
          <button onClick={save} style={{ flex: 2, background: 'var(--green)', color: '#fff', border: 'none', padding: '10px', borderRadius: 'var(--r-sm)', fontFamily: "'Jost', sans-serif", fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Ajouter le contact →</button>
        </div>
      </div>
    </div>
  )
}
