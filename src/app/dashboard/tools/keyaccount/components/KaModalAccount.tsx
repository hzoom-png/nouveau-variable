'use client'

import { useState } from 'react'
import type { Stage } from '../types'
import type { KaAction } from '../hooks/useKeyaccount'

interface Props {
  dispatch: React.Dispatch<KaAction>
  accountCount: number
  onClose: () => void
  onCreated: () => void
  prefillName?: string
  prefillSector?: string
}

const STAGES: Stage[] = ['Qualification', 'Démo', 'Proposition', 'Négociation', 'Closing']

export default function KaModalAccount({ dispatch, accountCount, onClose, onCreated, prefillName = '', prefillSector = '' }: Props) {
  const [name,   setName]   = useState(prefillName)
  const [sector, setSector] = useState(prefillSector)
  const [val,    setVal]    = useState('')
  const [stage,  setStage]  = useState<Stage>('Qualification')
  const [error,  setError]  = useState('')

  function save() {
    if (!name.trim()) { setError("Le nom de l'entreprise est obligatoire."); return }
    if (accountCount >= 20) { setError('Maximum 20 comptes atteint.'); return }
    dispatch({ type: 'ADD_ACCOUNT', payload: { name: name.trim(), sector: sector.trim(), val: val.trim() || '—', stage } })
    onCreated()
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,28,23,.45)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: '460px', margin: 'auto', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', animation: 'kaModalIn .22s cubic-bezier(.16,1,.3,1)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>Nouveau compte</div>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: 'var(--r-sm)', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '16px', color: 'var(--text-2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '5px' }}>Entreprise *</label>
              <input className="finput" value={name} onChange={e => setName(e.target.value)} placeholder="Nom de l'entreprise" autoFocus />
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '5px' }}>Secteur</label>
              <input className="finput" value={sector} onChange={e => setSector(e.target.value)} placeholder="Ex : Immobilier, SaaS, RH…" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '5px' }}>Valeur estimée</label>
              <input className="finput" value={val} onChange={e => setVal(e.target.value)} placeholder="Ex : 5 000 €" />
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '5px' }}>Stade</label>
              <select className="finput" value={stage} onChange={e => setStage(e.target.value as Stage)} style={{ cursor: 'pointer' }}>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {error && (
            <div style={{ background: 'var(--red-2)', border: '1px solid #FADBD8', borderRadius: 'var(--r-sm)', padding: '8px 12px', fontSize: '12px', color: 'var(--red)' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px 20px', display: 'flex', gap: '8px' }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)', padding: '10px', borderRadius: 'var(--r-sm)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
          <button onClick={save} style={{ flex: 2, background: 'var(--green)', color: '#fff', border: 'none', padding: '10px', borderRadius: 'var(--r-sm)', fontFamily: "'Jost', sans-serif", fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Créer le compte →</button>
        </div>
      </div>
    </div>
  )
}
