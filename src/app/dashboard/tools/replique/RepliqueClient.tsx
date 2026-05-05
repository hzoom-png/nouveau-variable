'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { RepliqueConfig, RepliqueScript, CallObjective, ContactType } from './types'
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

const SS_SCRIPT = 'replique_last_script'
const SS_CONFIG = 'replique_last_config'
const SS_VIEW   = 'replique_last_view'

function clearSession() {
  try {
    sessionStorage.removeItem(SS_SCRIPT)
    sessionStorage.removeItem(SS_CONFIG)
    sessionStorage.removeItem(SS_VIEW)
  } catch {}
}

export default function RepliqueClient() {
  const [view, setView] = useState<View>('idle')
  const [loadStep, setLoadStep] = useState(0)
  const [config, setConfig] = useState<Partial<RepliqueConfig>>({})
  const [script, setScript] = useState<RepliqueScript | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<RepliqueScript[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [initialFormStep, setInitialFormStep] = useState<1 | 2>(1)
  const [kaSource, setKaSource] = useState<{ accountName: string; contactRole: string } | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Restore last result from sessionStorage if no deep-link params
    try {
      const savedScript = sessionStorage.getItem(SS_SCRIPT)
      const savedView   = sessionStorage.getItem(SS_VIEW)
      const savedConfig = sessionStorage.getItem(SS_CONFIG)
      if (savedScript && savedView === 'result') {
        const parsedScript = JSON.parse(savedScript)
        const parsedConfig = savedConfig ? JSON.parse(savedConfig) : {}
        setScript({ id: crypto.randomUUID(), config: parsedConfig, created_at: new Date().toISOString(), ...parsedScript })
        setConfig(parsedConfig)
        setView('result')
      }
    } catch {}
    loadHistory()
  }, [])

  useEffect(() => {
    const objective   = searchParams.get('objective')
    const contactRole = searchParams.get('contact_role')
    const contactType = searchParams.get('contact_type')
    const sector      = searchParams.get('company_sector')
    const context     = searchParams.get('context')
    const accountName = searchParams.get('account_name')

    if (objective || contactRole || sector) {
      setConfig(prev => ({
        ...prev,
        ...(objective   && { objective:      objective as CallObjective }),
        ...(contactRole && { contact_role:   contactRole }),
        ...(contactType && { contact_type:   contactType as ContactType }),
        ...(sector      && { company_sector: sector }),
        ...(context     && { context:        decodeURIComponent(context) }),
      }))
      setInitialFormStep(objective ? 2 : 1)
      setView('form')
      if (accountName || contactRole) {
        setKaSource({ accountName: accountName ?? '', contactRole: contactRole ?? '' })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Warn on tab/browser close during generation
  useEffect(() => {
    if (view !== 'loading') return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [view])

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

    let finished = false
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => { abortController.abort() }, 30000)

    try {
      const res = await fetch('/api/ai/replique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: cfg }),
        signal: abortController.signal,
      })

      if (!res.ok) {
        clearTimeout(timeoutId)
        const d = await res.json()
        setError(d.error || 'Erreur lors de la génération')
        setView('form')
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let sseBuffer = ''
      let currentStep = 0

      while (true) {
        if (finished) break
        const { done, value } = await reader.read()
        if (done) break
        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const d = JSON.parse(line.slice(6))
            if (d.token) {
              accumulated += d.token
              const newStep = accumulated.length > 800 ? 3 : accumulated.length > 300 ? 2 : 1
              if (newStep > currentStep) { currentStep = newStep; setLoadStep(newStep) }
            }
            if (d.error) {
              clearTimeout(timeoutId)
              setError(d.error)
              setView('form')
              finished = true
              return
            }
            if (d.done) {
              clearTimeout(timeoutId)
              setLoadStep(4)
              try {
                const cleaned = accumulated.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '')
                const result = JSON.parse(cleaned)
                try {
                  sessionStorage.setItem(SS_SCRIPT, JSON.stringify(result))
                  sessionStorage.setItem(SS_CONFIG, JSON.stringify(cfg))
                  sessionStorage.setItem(SS_VIEW, 'result')
                } catch {}
                setScript({ id: crypto.randomUUID(), config: cfg, created_at: new Date().toISOString(), ...result })
                setView('result')
                loadHistory()
              } catch (e) {
                console.error('[Réplique] JSON.parse échoué :', e, '\nAccumulated :', accumulated.slice(0, 300))
                setError('La génération a été interrompue. Réessaie ou contacte le support.')
                setView('form')
              } finally {
                finished = true
              }
              return
            }
          } catch {}
        }
      }

      // Stream ended — flush remaining buffer then fallback
      clearTimeout(timeoutId)
      if (!finished) {
        if (sseBuffer.startsWith('data: ')) {
          try { const d = JSON.parse(sseBuffer.slice(6)); if (d.token) accumulated += d.token } catch {}
        }
        if (accumulated) {
          try {
            const cleaned = accumulated.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '')
            const result = JSON.parse(cleaned)
            try {
              sessionStorage.setItem(SS_SCRIPT, JSON.stringify(result))
              sessionStorage.setItem(SS_CONFIG, JSON.stringify(cfg))
              sessionStorage.setItem(SS_VIEW, 'result')
            } catch {}
            setScript({ id: crypto.randomUUID(), config: cfg, created_at: new Date().toISOString(), ...result })
            setView('result')
            loadHistory()
          } catch {
            setError('La génération a été interrompue. Réessaie.')
            setView('form')
          }
        } else {
          setError('La génération a été interrompue. Réessaie.')
          setView('form')
        }
      }
    } catch (e) {
      clearTimeout(timeoutId)
      if (!finished) {
        if (e instanceof Error && e.name === 'AbortError') {
          setError('La génération prend trop de temps. Réessaie.')
        } else {
          setError('Erreur réseau. Vérifie ta connexion.')
        }
        setView('form')
      }
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
            <button className="tbtn-secondary" onClick={() => { clearSession(); setView('form'); setError('') }}>
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

      {view === 'form' && kaSource && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--green-3)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-sm)', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: 'var(--green)' }}>🔗 Pré-rempli depuis Keyaccount</span>
          {kaSource.accountName && <span style={{ background: 'var(--white)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-full)', padding: '2px 10px', color: 'var(--text-2)', fontWeight: 500 }}>Compte : {kaSource.accountName}</span>}
          {kaSource.contactRole && <span style={{ background: 'var(--white)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-full)', padding: '2px 10px', color: 'var(--text-2)', fontWeight: 500 }}>Contact : {kaSource.contactRole}</span>}
          <button
            onClick={() => { setKaSource(null); setConfig({}); setView('idle'); router.replace('/dashboard/tools/replique') }}
            style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}
          >
            Effacer ×
          </button>
        </div>
      )}

      {view === 'form' && (
        <RepliqueForm
          initial={config}
          initialStep={initialFormStep}
          onSubmit={generate}
          onCancel={view === 'form' && script ? () => setView('result') : undefined}
        />
      )}

      {view === 'loading' && <RepliqueProgress steps={STEPS} currentStep={loadStep} />}

      {view === 'result' && script && (
        <RepliqueScriptView script={script} onNew={() => { clearSession(); setView('form') }} />
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
