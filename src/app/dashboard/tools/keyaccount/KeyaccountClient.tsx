'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useKa } from '@/contexts/KaContext'
import { getScore, KA_STYLES, getNextAction } from './meddicc'
import type { ContactType, Stage } from './types'
import { Toast } from '@/components/ui/Toast'
import KaMap from './components/KaMap'
import KaMeddiccPanel from './components/KaMeddiccPanel'
import KaNotesPanel from './components/KaNotesPanel'
import KaListView from './components/KaListView'
import KaAccountPicker from './components/KaAccountPicker'
import KaModalAccount from './components/KaModalAccount'
import KaModalContact from './components/KaModalContact'
import { useKaNotes } from './hooks/useKaNotes'

export default function KeyaccountClient() {
  const { accounts, loading, error, activeAccount, activeAccountIdx, dispatch, view, reload } = useKa()
  const score = activeAccount ? getScore(activeAccount.contacts) : 0
  const searchParams = useSearchParams()

  const [pickerOpen,       setPickerOpen]       = useState(false)
  const [showModalAccount, setShowModalAccount] = useState(false)
  const [showModalContact, setShowModalContact] = useState(false)
  const [contactAccountId, setContactAccountId] = useState<string>('')
  const [activeContactId,  setActiveContactId]  = useState<string | null>(null)
  const [newContactId,     setNewContactId]     = useState<string | null>(null)
  const [toast,            setToast]            = useState<{ msg: string; variant: 'success' | 'error' | 'info' } | null>(null)
  const [prefillName,      setPrefillName]      = useState('')
  const [prefillSector,    setPrefillSector]    = useState('')
  const [activePanel,      setActivePanel]      = useState<'meddicc' | 'journal'>('meddicc')

  const showToast = useCallback((msg: string, variant: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, variant })
  }, [])

  // Handle ?from=terrain pre-fill
  useEffect(() => {
    const fromTerrain = searchParams.get('from') === 'terrain'
    if (!fromTerrain) return
    try {
      const raw = localStorage.getItem('ka_prefill')
      if (!raw) return
      const data = JSON.parse(raw) as { company: string; sector: string }
      localStorage.removeItem('ka_prefill')
      setPrefillName(data.company || '')
      setPrefillSector(data.sector || '')
      setShowModalAccount(true)
    } catch { /* ignore */ }
  }, [searchParams])

  // Active contact object (re-derived from state so it stays fresh after TOGGLE_CHECK)
  const activeContact = activeAccount?.contacts.find(c => c.id === activeContactId) ?? null

  function openAddContact(accountId: string) {
    setContactAccountId(accountId)
    setShowModalContact(true)
  }

  function handleContactCreated(name: string, type: ContactType) {
    showToast(`${name} ajouté comme ${KA_STYLES[type].label}`)
  }

  function handleViewMapFromList(idx: number) {
    dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: { idx } })
    dispatch({ type: 'TOGGLE_VIEW' })
    setActiveContactId(null)
  }

  function handleContactClickFromList(accountIdx: number, contactId: string) {
    dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: { idx: accountIdx } })
    if (view === 'list') dispatch({ type: 'TOGGLE_VIEW' })
    setActiveContactId(contactId)
  }

  function handleResetLayout() {
    if (!activeAccount) return
    const n = activeAccount.contacts.length
    activeAccount.contacts.forEach((c, i) => {
      const angle = (i / Math.max(n, 1)) * 2 * Math.PI - Math.PI / 2
      dispatch({ type: 'MOVE_CONTACT', payload: { accountId: activeAccount.id, contactId: c.id, x: 0.5 + 0.32 * Math.cos(angle), y: 0.5 + 0.32 * Math.sin(angle) } })
    })
    showToast('Bulles réorganisées en cercle')
  }

  // ── LOADING ──
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Chargement…</div>
      </div>
    )
  }

  // ── ERROR ──
  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--red)', fontSize: '14px' }}>
        Erreur de chargement : {error}
        <br />
        <button onClick={reload} style={{ marginTop: '12px', padding: '8px 16px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: '13px' }}>
          Réessayer
        </button>
      </div>
    )
  }

  // ── EMPTY STATE (no accounts) ──
  if (accounts.length === 0) {
    return (
      <div>
        <ToolHeader
          view={view}
          onAddAccount={() => setShowModalAccount(true)}
          onToggleView={() => { dispatch({ type: 'TOGGLE_VIEW' }) }}
        />
        {showModalAccount && (
          <KaModalAccount
            dispatch={dispatch}
            accountCount={accounts.length}
            onClose={() => setShowModalAccount(false)}
            onCreated={() => showToast('Compte créé !')}
            prefillName={prefillName}
            prefillSector={prefillSector}
          />
        )}

        {/* War room vide */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '380px' }}>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '48px 40px', textAlign: 'center', maxWidth: '400px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '52px', height: '52px', background: 'var(--green-3)', borderRadius: 'var(--r-lg)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.6">
                <rect x="2" y="7" width="8" height="8" rx="2"/><rect x="2" y="18" width="8" height="3" rx="1.5"/>
                <rect x="14" y="11" width="8" height="8" rx="2"/>
                <path d="M6 7V4M18 11V8M6 15v3M18 19v1"/>
              </svg>
            </div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px', letterSpacing: '-.01em' }}>
              Ta war room est vide.
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '24px' }}>
              Commence par ajouter ton premier compte BtoB à travailler.
            </div>
            <button
              className="tbtn-primary"
              onClick={() => setShowModalAccount(true)}
              style={{ width: '100%' }}
            >
              Créer mon premier compte →
            </button>
          </div>
        </div>

        {toast && <Toast message={toast.msg} variant={toast.variant} onClose={() => setToast(null)} />}
      </div>
    )
  }

  return (
    <div>
      <ToolHeader
        view={view}
        onAddAccount={() => setShowModalAccount(true)}
        onToggleView={() => { dispatch({ type: 'TOGGLE_VIEW' }); setActiveContactId(null) }}
      />

      {/* Pipeline header */}
      <KaPipelineHeader accounts={accounts} />

      {/* ── VUE MAP ── */}
      {view === 'map' && activeAccount && (
        <div>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div
              onClick={() => setPickerOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '7px 13px', cursor: 'pointer', transition: '.14s' }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--surface)')}
              onMouseOut={e => (e.currentTarget.style.background = 'var(--white)')}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{activeAccount.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{pickerOpen ? '▴' : '▾'}</span>
            </div>
            <div style={{ background: 'var(--green-3)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-sm)', padding: '4px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--green)' }}>
              Score MEDDICC {score}%
            </div>
            <button
              onClick={handleResetLayout}
              className="tbtn-secondary"
              style={{ marginLeft: 'auto', padding: '5px 12px', fontSize: '12px' }}
            >
              Réorganiser
            </button>
            <button
              onClick={() => openAddContact(activeAccount.id)}
              style={{ background: 'var(--green-3)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-sm)', padding: '5px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--green)', cursor: 'pointer', transition: '.14s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.color = '#fff' }}
              onMouseOut={e => { e.currentTarget.style.background = 'var(--green-3)'; e.currentTarget.style.color = 'var(--green)' }}
            >
              + Contact
            </button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {(['champion', 'decision', 'blocker', 'neutral'] as const).map(t => {
              const s = KA_STYLES[t]
              return (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-3)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.bg, border: `1.5px solid ${s.border}` }} />
                  {s.label}
                </div>
              )
            })}
            <span style={{ fontSize: '11px', color: 'var(--text-3)', marginLeft: 'auto' }}>Glisse les bulles · Clique pour MEDDICC</span>
          </div>

          {/* Account picker dropdown */}
          {pickerOpen && (
            <KaAccountPicker
              accounts={accounts}
              activeIdx={activeAccountIdx}
              dispatch={dispatch}
              onClose={() => setPickerOpen(false)}
            />
          )}

          {/* Canvas */}
          <KaMap
            account={activeAccount}
            dispatch={dispatch}
            activeContactId={activeContactId}
            onContactClick={id => setActiveContactId(prev => prev === id ? null : id)}
            newContactId={newContactId}
          />

          {/* Panel tabs */}
          <MapPanelTabs
            accountId={activeAccount.id}
            hasContact={!!activeContact}
            activePanel={activePanel}
            onSwitchPanel={p => setActivePanel(p)}
          />

          {/* MEDDICC Panel */}
          {activeContact && activePanel === 'meddicc' && (
            <KaMeddiccPanel
              contact={activeContact}
              account={activeAccount}
              dispatch={dispatch}
              onClose={() => setActiveContactId(null)}
            />
          )}

          {/* Journal Panel */}
          {activePanel === 'journal' && (
            <KaNotesPanel accountId={activeAccount.id} accountName={activeAccount.name} />
          )}
        </div>
      )}

      {/* ── VUE LISTE ── */}
      {view === 'list' && (
        <KaListView
          accounts={accounts}
          dispatch={dispatch}
          onViewMap={handleViewMapFromList}
          onAddContact={openAddContact}
          onContactClick={handleContactClickFromList}
        />
      )}

      {/* Modals */}
      {showModalAccount && (
        <KaModalAccount
          dispatch={dispatch}
          accountCount={accounts.length}
          onClose={() => setShowModalAccount(false)}
          onCreated={() => showToast('Compte créé !')}
          prefillName={prefillName}
          prefillSector={prefillSector}
        />
      )}
      {showModalContact && contactAccountId && (
        <KaModalContact
          accountId={contactAccountId}
          accountName={accounts.find(a => a.id === contactAccountId)?.name ?? ''}
          dispatch={dispatch}
          onClose={() => setShowModalContact(false)}
          onCreated={handleContactCreated}
        />
      )}

      {toast && <Toast message={toast.msg} variant={toast.variant} onClose={() => setToast(null)} />}
    </div>
  )
}

// ── Map Panel Tabs ──
function MapPanelTabs({
  accountId, hasContact, activePanel, onSwitchPanel,
}: {
  accountId: string
  hasContact: boolean
  activePanel: 'meddicc' | 'journal'
  onSwitchPanel: (p: 'meddicc' | 'journal') => void
}) {
  const { notes } = useKaNotes(accountId)
  const count = notes.length

  return (
    <div style={{ display: 'flex', gap: '4px', marginTop: '12px', marginBottom: '0' }}>
      {hasContact && (
        <button
          onClick={() => onSwitchPanel('meddicc')}
          style={{
            padding: '7px 16px', borderRadius: 'var(--r-sm) var(--r-sm) 0 0',
            border: '1px solid var(--border)', borderBottom: activePanel === 'meddicc' ? '1px solid var(--white)' : '1px solid var(--border)',
            background: activePanel === 'meddicc' ? 'var(--white)' : 'var(--surface)',
            fontSize: '12px', fontWeight: 600,
            color: activePanel === 'meddicc' ? 'var(--text)' : 'var(--text-3)',
            cursor: 'pointer', transition: '.12s',
            position: 'relative', bottom: '-1px',
          }}
        >
          Contact
        </button>
      )}
      <button
        onClick={() => onSwitchPanel('journal')}
        style={{
          padding: '7px 16px', borderRadius: 'var(--r-sm) var(--r-sm) 0 0',
          border: '1px solid var(--border)', borderBottom: activePanel === 'journal' ? '1px solid var(--white)' : '1px solid var(--border)',
          background: activePanel === 'journal' ? 'var(--white)' : 'var(--surface)',
          fontSize: '12px', fontWeight: 600,
          color: activePanel === 'journal' ? 'var(--text)' : 'var(--text-3)',
          cursor: 'pointer', transition: '.12s',
          display: 'flex', alignItems: 'center', gap: '6px',
          position: 'relative', bottom: '-1px',
        }}
      >
        Journal
        <span style={{
          minWidth: '18px', height: '18px', borderRadius: 'var(--r-full)',
          background: count > 0 ? 'var(--green)' : 'var(--amber)',
          color: '#fff', fontSize: '10px', fontWeight: 700,
          display: 'grid', placeItems: 'center', padding: '0 4px',
        }}>
          {count}
        </span>
      </button>
    </div>
  )
}

// ── Pipeline Header ──
function KaPipelineHeader({ accounts }: { accounts: import('./types').KaAccount[] }) {
  if (accounts.length === 0) return null
  const scores = accounts.map(a => getScore(a.contacts))
  const avgScore = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
  const byStage: Record<string, number> = {}
  accounts.forEach(a => { byStage[a.stage] = (byStage[a.stage] || 0) + 1 })
  const STAGES = ['Qualification', 'Démo', 'Proposition', 'Négociation', 'Closing']
  const topAccount = accounts.reduce((best, a, i) => scores[i] > scores[best] ? i : best, 0)
  const nextAction = accounts[topAccount] ? getNextAction(accounts[topAccount]) : ''

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '22px', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{accounts.length}</div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: '3px' }}>Comptes</div>
        </div>
        <div style={{ width: '1px', height: '32px', background: 'var(--border)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '22px', fontWeight: 800, color: 'var(--green)', lineHeight: 1 }}>{avgScore}%</div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: '3px' }}>Score moy.</div>
        </div>
        <div style={{ width: '1px', height: '32px', background: 'var(--border)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '22px', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
            {(byStage['Négociation'] || 0) + (byStage['Closing'] || 0)}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: '3px' }}>Closing</div>
        </div>
      </div>

      {/* Pipeline bar */}
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ display: 'flex', gap: '2px', height: '8px', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
          {STAGES.map((s, i) => {
            const count = byStage[s] || 0
            const width = (count / accounts.length) * 100
            const colors = ['#E5E7EB', '#93C5FD', '#A78BFA', '#34D399', '#10B981']
            return <div key={s} style={{ height: '8px', background: colors[i], flex: count || 0.1, opacity: count ? 1 : 0.15, transition: 'flex .5s' }} />
          })}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
          {STAGES.map((s, i) => {
            const count = byStage[s] || 0
            if (!count) return null
            const colors = ['var(--text-3)', '#3B82F6', '#7C5CBF', 'var(--green)', 'var(--green)']
            return (
              <span key={s} style={{ fontSize: '10px', fontWeight: 600, color: colors[i] }}>
                {count} {s}
              </span>
            )
          })}
        </div>
      </div>

      {/* Next action */}
      {nextAction && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--green-3)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-md)', padding: '8px 12px', maxWidth: '260px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{accounts[topAccount]?.name}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, marginTop: '2px' }}>{nextAction}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tool Header ──
function ToolHeader({ view, onAddAccount, onToggleView }: { view: 'map' | 'list'; onAddAccount: () => void; onToggleView: () => void }) {
  return (
    <div className="tool-header">
      <div className="tool-badge" style={{ background: 'var(--green-3)', color: 'var(--green)', border: '1px solid var(--green-4)' }}>
        <svg width="12" height="12" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="1.5" y="3.5" width="4" height="4" rx="1" fill="none"/>
          <rect x="1.5" y="9.5" width="4" height="4" rx="1" fill="none"/>
          <rect x="9.5" y="6" width="4" height="4" rx="1" fill="none"/>
          <path d="M5.5 5.5h2.5a1 1 0 011 1v2M5.5 11.5h2.5a1 1 0 001-1V8"/>
        </svg>
        Keyaccount — Inclus dans ton abonnement
      </div>
      <h1 className="tool-h1">Ta war room commerciale.</h1>
      <p className="tool-desc">Cartographie tes comptes BtoB clés. Identifie champions, décideurs et bloqueurs selon la méthode MEDDICC. Max 20 comptes. Un seul affiché en vue map à la fois.</p>
      <div className="tool-actions">
        <button className="tbtn-primary" onClick={onAddAccount}>+ Nouveau compte</button>
        <button className="tbtn-secondary" onClick={onToggleView}>
          {view === 'map' ? (
            <>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/>
                <rect x="1" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/>
              </svg>
              Vue liste
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M1 4h12M1 8h12M1 12h8"/>
              </svg>
              Vue map
            </>
          )}
        </button>
      </div>
    </div>
  )
}
