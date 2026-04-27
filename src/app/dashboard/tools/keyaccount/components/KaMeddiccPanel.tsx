'use client'

import { useRouter } from 'next/navigation'
import type { KaContact, KaAccount } from '../types'
import type { KaAction } from '../hooks/useKeyaccount'
import { KA_STYLES, getInitials, getNextAction } from '../meddicc'

interface Props {
  contact: KaContact
  account: KaAccount
  dispatch: React.Dispatch<KaAction>
  onClose: () => void
}

export default function KaMeddiccPanel({ contact, account, dispatch, onClose }: Props) {
  const router = useRouter()
  const s = KA_STYLES[contact.type]
  const done  = contact.checks.reduce((a, sec) => a + sec.items.filter(i => i.done).length, 0)
  const total = contact.checks.reduce((a, sec) => a + sec.items.length, 0)
  const pct   = total ? Math.round((done / total) * 100) : 0
  const nextAction = getNextAction(account)

  function toggle(sectionIdx: number, itemIdx: number) {
    dispatch({ type: 'TOGGLE_CHECK', payload: { accountId: account.id, contactId: contact.id, sectionIdx, itemIdx } })
  }

  function openDealLink() {
    const params = new URLSearchParams({ prospect: account.name, company: account.name, sector: account.sector || '' })
    router.push('/dashboard/tools/deallink?' + params.toString())
  }

  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: '20px 22px', marginTop: '14px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            display: 'grid', placeItems: 'center',
            fontSize: '13px', fontWeight: 700, flexShrink: 0,
            background: s.avBg, color: s.avColor, border: `2px solid ${s.border}`,
          }}>
            {getInitials(contact.name)}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{contact.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>{contact.role || '—'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, padding: '3px 10px', borderRadius: 'var(--r-sm)', fontSize: '11px', fontWeight: 600 }}>
            {s.label}
          </span>
          <button
            onClick={onClose}
            style={{ width: '26px', height: '26px', borderRadius: 'var(--r-sm)', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '15px', color: 'var(--text-2)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      </div>

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
                  style={{
                    width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0, marginTop: '1px',
                    border: `1.5px solid ${item.done ? s.border : 'var(--border)'}`,
                    background: item.done ? s.bg : 'var(--white)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: '.14s',
                  }}
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
  )
}
