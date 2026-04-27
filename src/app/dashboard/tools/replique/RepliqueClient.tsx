'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RepliqueConfig, RepliqueScript } from './types'
import RepliqueForm from './components/RepliqueForm'
import RepliqueScriptView from './components/RepliqueScript'
import RepliqueEmptyState from './components/RepliqueEmptyState'
import RepliqueProgress from './components/RepliqueProgress'
import RepliqueCard from './components/RepliqueCard'

type View = 'idle' | 'form' | 'loading' | 'result'

const STEPS = [
  'Analyse de ton contexte commercial…',
  'Construction de l\'accroche…',
  'Rédaction du script…',
  'Préparation des rebonds sur objections…',
  'Finalisation…',
]

export default function RepliqueClient() {
  const [view, setView] = useState<View>('idle')
  const [loadStep, setLoadStep] = useState(0)
  const [config, setConfig] = useState<Partial<RepliqueConfig>>({})
  const [script, setScript] = useState<RepliqueScript | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<RepliqueScript[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => { loadHistory() }, [])

  async function loadHistory() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('replique_scripts')
      .select('id, config, blocks, objections, dos, donts, estimated_duration, difficulty, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setHistory(data as RepliqueScript[])
  }

  async function generate(cfg: RepliqueConfig) {
    setConfig(cfg)
    setView('loading')
    setError('')
    setLoadStep(0)

    let step = 0
    const interval = setInterval(() => {
      step = Math.min(step + 1, STEPS.length - 1)
      setLoadStep(step)
    }, 700)

    try {
      const res = await fetch('/api/ai/replique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: cfg }),
      })

      if (!res.ok) {
        clearInterval(interval)
        const d = await res.json()
        setError(d.error || 'Erreur lors de la génération')
        setView('form')
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const d = JSON.parse(line.slice(6))
            if (d.token) accumulated += d.token
            if (d.error) {
              clearInterval(interval)
              setError(d.error)
              setView('form')
              return
            }
            if (d.done) {
              clearInterval(interval)
              const result = JSON.parse(accumulated)
              setScript({
                id: crypto.randomUUID(),
                config: cfg,
                created_at: new Date().toISOString(),
                ...result,
              })
              setView('result')
              loadHistory()
              return
            }
          } catch {}
        }
      }
      clearInterval(interval)
    } catch {
      clearInterval(interval)
      setError('Erreur réseau. Vérifie ta connexion.')
      setView('form')
    }
  }

  function reloadFromHistory(s: RepliqueScript) {
    setConfig(s.config)
    setScript(s)
    setView('result')
    setHistoryOpen(false)
  }

  return (
    <div>
      {/* Tool header */}
      <div className="tool-header">
        <div className="tool-badge" style={{ background: 'var(--red-2)', color: 'var(--red)', border: '1px solid rgba(200,50,50,.15)' }}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="1" y="3" width="12" height="8" rx="1.5"/>
            <path d="M4 7h6M4 9.5h4"/>
            <path d="M5 3V2M9 3V2"/>
          </svg>
          Réplique — Inclus dans ton abonnement
        </div>
        <h1 className="tool-h1">Ton script d&apos;appel en 30 secondes.</h1>
        <p className="tool-desc">Dis-nous ce que tu vends et à qui. Réplique génère le script, les rebonds et les conseils d&apos;un formateur commercial.</p>
        <div className="tool-actions">
          {(view === 'result' || view === 'form') && (
            <button className="tbtn-secondary" onClick={() => { setView('form'); setError('') }}>
              Nouveau script
            </button>
          )}
          {view === 'idle' && (
            <button className="tbtn-primary" onClick={() => setView('form')}>
              Créer un script →
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: 'var(--red-2)', border: '1px solid #FADBD8', borderRadius: 'var(--r-md)', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--red)', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', whiteSpace: 'nowrap' }}>Fermer</button>
        </div>
      )}

      {view === 'idle' && <RepliqueEmptyState onStart={() => setView('form')} />}

      {view === 'form' && (
        <RepliqueForm
          initial={config}
          onSubmit={generate}
          onCancel={view === 'form' && script ? () => setView('result') : undefined}
        />
      )}

      {view === 'loading' && <RepliqueProgress steps={STEPS} currentStep={loadStep} />}

      {view === 'result' && script && (
        <RepliqueScriptView script={script} onNew={() => setView('form')} />
      )}

      {/* History */}
      {history.length > 0 && view !== 'loading' && (
        <div style={{ marginTop: '32px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}
          >
            <span>Mes scripts récents ({history.length})</span>
            <span>{historyOpen ? '▴' : '▾'}</span>
          </button>
          {historyOpen && (
            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {history.map(s => (
                <RepliqueCard key={s.id} script={s} onReload={reloadFromHistory} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
