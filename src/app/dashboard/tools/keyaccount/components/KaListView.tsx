'use client'

import { useRouter } from 'next/navigation'
import type { KaAccount } from '../types'
import type { KaAction } from '../hooks/useKeyaccount'
import { KA_STYLES, STAGE_COLORS, getInitials, getScore, getNextAction } from '../meddicc'
import { useKaNotesStats } from '../hooks/useKaNotes'
import { formatRelativeDate } from '@/lib/dateUtils'

interface Props {
  accounts: KaAccount[]
  dispatch: React.Dispatch<KaAction>
  onViewMap: (idx: number) => void
  onAddContact: (accountId: string) => void
  onContactClick: (accountIdx: number, contactId: string) => void
}

export default function KaListView({ accounts, dispatch, onViewMap, onAddContact, onContactClick }: Props) {
  const router = useRouter()
  const notesStats = useKaNotesStats(accounts.map(a => a.id))

  function openDealLink(acc: KaAccount) {
    const params = new URLSearchParams({ prospect: acc.name, company: acc.name, sector: acc.sector || '' })
    router.push('/dashboard/tools/deallink?' + params.toString())
  }

  if (!accounts.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)', fontSize: '13px' }}>
        Aucun compte pour l&apos;instant.<br />Clique sur &quot;+ Nouveau compte&quot; pour commencer.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
      {accounts.map((acc, i) => {
        const score = getScore(acc.contacts)
        const ini = getInitials(acc.name)
        const stage = STAGE_COLORS[acc.stage] ?? { bg: 'var(--surface)', text: 'var(--text-2)' }

        const nextAct = getNextAction(acc)
        const scoreLabel = score >= 75 ? 'Hot' : score >= 45 ? 'Warm' : 'Cold'
        const scoreLabelColor = score >= 75 ? 'var(--green)' : score >= 45 ? 'var(--amber)' : 'var(--text-3)'
        const scoreLabelBg = score >= 75 ? 'var(--green-3)' : score >= 45 ? 'var(--amber-2)' : 'var(--surface-2)'

        return (
          <div
            key={acc.id}
            className="ka-list-card"
            style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', transition: 'all .18s' }}
          >
            {/* Score bar top */}
            <div style={{ height: '4px', background: 'var(--green)', opacity: 0.3 + (score / 100) * .7 }} />

            <div style={{ padding: '16px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: 'var(--r-sm)',
                    background: 'var(--green-3)', display: 'grid', placeItems: 'center',
                    fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: 700, color: 'var(--green)',
                  }}>
                    {ini}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{acc.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '1px' }}>{acc.sector || '—'}</div>
                  </div>
                </div>
                <button
                  onClick={() => dispatch({ type: 'DELETE_ACCOUNT', payload: { id: acc.id } })}
                  className="ka-delete-btn"
                  style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-3)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, transition: '.14s' }}
                >
                  ×
                </button>
              </div>

              {/* Stage + value */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ background: stage.bg, color: stage.text, fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: 'var(--r-full)' }}>
                  {acc.stage}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{acc.val}</span>
              </div>

              {/* MEDDICC score + badge */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Score MEDDICC</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ background: scoreLabelBg, color: scoreLabelColor, fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--r-full)' }}>{scoreLabel}</span>
                    <span style={{ fontWeight: 600, color: 'var(--green)', fontSize: '11px' }}>{score}%</span>
                  </div>
                </div>
                <div style={{ height: '3px', background: 'var(--surface-2)', borderRadius: 'var(--r-full)' }}>
                  <div style={{ height: '3px', background: 'var(--green)', borderRadius: 'var(--r-full)', width: score + '%', transition: 'width 1s' }} />
                </div>
              </div>

              {/* Next action */}
              {nextAct && (
                <div style={{ fontSize: '11px', color: 'var(--text-2)', background: 'var(--surface)', borderRadius: 'var(--r-sm)', padding: '6px 10px', marginBottom: '8px', lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-3)', marginRight: '4px' }}>→</span>{nextAct}
                </div>
              )}

              {/* Last activity */}
              <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="5"/><path d="M6 3.5V6l1.5 1.5"/></svg>
                {notesStats.has(acc.id)
                  ? <span>Dernière activité : {formatRelativeDate(notesStats.get(acc.id)!)}</span>
                  : <span style={{ fontStyle: 'italic' }}>Aucune activité enregistrée</span>
                }
              </div>

              {/* Contact pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {acc.contacts.length === 0
                  ? <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Aucun contact</span>
                  : acc.contacts.map(c => {
                      const cs = KA_STYLES[c.type]
                      return (
                        <div
                          key={c.id}
                          onClick={() => onContactClick(i, c.id)}
                          title={`${c.name} — ${cs.label}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: 'var(--r-full)', background: cs.bg, border: `1px solid ${cs.border}`, fontSize: '10px', fontWeight: 600, color: cs.text, cursor: 'pointer', transition: '.14s' }}
                        >
                          {getInitials(c.name)}
                        </div>
                      )
                    })
                }
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => onViewMap(i)}
                  style={{ flex: 1, minWidth: '80px', background: 'var(--green)', color: '#fff', border: 'none', padding: '7px 10px', borderRadius: 'var(--r-sm)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: '.15s' }}
                >
                  Map →
                </button>
                <button
                  onClick={() => onAddContact(acc.id)}
                  style={{ flex: 1, minWidth: '80px', background: 'var(--green-3)', color: 'var(--green)', border: '1px solid var(--green-4)', padding: '7px 10px', borderRadius: 'var(--r-sm)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: '.15s' }}
                >
                  + Contact
                </button>
                <button
                  onClick={() => openDealLink(acc)}
                  style={{ width: '100%', background: 'var(--white)', color: 'var(--text-2)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: 'var(--r-sm)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: '.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5h8M6 2l3 3-3 3"/></svg>
                  Créer un DealLink
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
