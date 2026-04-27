'use client'

import type { KaAccount } from '../types'
import type { KaAction } from '../hooks/useKeyaccount'
import { getInitials, getScore } from '../meddicc'

interface Props {
  accounts: KaAccount[]
  activeIdx: number
  dispatch: React.Dispatch<KaAction>
  onClose: () => void
}

export default function KaAccountPicker({ accounts, activeIdx, dispatch, onClose }: Props) {
  if (!accounts.length) {
    return (
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ padding: '14px', fontSize: '13px', color: 'var(--text-3)', textAlign: 'center' }}>
          Aucun compte. Crée-en un d&apos;abord.
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
      <div style={{ padding: '10px 14px', fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.1em', borderBottom: '1px solid var(--border)' }}>
        Choisir le compte à afficher
      </div>
      {accounts.map((acc, i) => {
        const score = getScore(acc.contacts)
        const ini = getInitials(acc.name)
        const isActive = i === activeIdx
        return (
          <div
            key={acc.id}
            onClick={() => {
              dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: { idx: i } })
              onClose()
            }}
            className="ka-picker-row"
            style={{
              display: 'flex', alignItems: 'center', gap: '11px',
              padding: '11px 14px', cursor: 'pointer',
              borderBottom: '1px solid var(--border)',
              background: isActive ? 'var(--green-3)' : '',
              transition: '.14s',
            }}
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: 'var(--r-sm)',
              background: isActive ? 'var(--green)' : 'var(--green-3)',
              display: 'grid', placeItems: 'center',
              fontSize: '11px', fontWeight: 700,
              color: isActive ? '#fff' : 'var(--green)',
              flexShrink: 0,
            }}>
              {ini}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {acc.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '1px' }}>
                {acc.contacts.length} contact{acc.contacts.length > 1 ? 's' : ''} · {acc.val} · {acc.stage}
              </div>
            </div>
            <div style={{ background: 'var(--green-3)', color: 'var(--green)', border: '1px solid var(--green-4)', padding: '2px 8px', borderRadius: 'var(--r-sm)', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>
              {score}%
            </div>
          </div>
        )
      })}
    </div>
  )
}
