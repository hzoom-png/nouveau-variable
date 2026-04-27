'use client'

import { useState, useCallback } from 'react'
import type { TerrainProspect } from './types'
import TerrainEmptyState from './components/TerrainEmptyState'
import TerrainProgress from './components/TerrainProgress'
import TerrainInput from './components/TerrainInput'
import TerrainTable from './components/TerrainTable'

type ViewState = 'idle' | 'inputting' | 'loading' | 'done' | 'error'

const STEPS = [
  'Lecture des données brutes...',
  'Identification des entreprises...',
  'Enrichissement des profils...',
  'Calcul des scores de priorité...',
  'Génération des recommandations...',
]

export default function TerrainClient() {
  const [viewState, setViewState]   = useState<ViewState>('idle')
  const [prospects, setProspects]   = useState<TerrainProspect[]>([])
  const [summary,   setSummary]     = useState('')
  const [error,     setError]       = useState('')
  const [loadStep,  setLoadStep]    = useState(0)
  const [showInput, setShowInput]   = useState(false)

  const analyze = useCallback(async (rawText: string) => {
    if (!rawText.trim()) return
    setError('')
    setViewState('loading')
    setLoadStep(0)

    let step = 0
    const interval = setInterval(() => {
      step = Math.min(step + 1, STEPS.length - 1)
      setLoadStep(step)
    }, 800)

    try {
      const res = await fetch('/api/ai/terrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      })
      clearInterval(interval)

      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Erreur lors de l\'analyse')
        setViewState('error')
        return
      }

      const data = await res.json()
      setProspects(data.prospects)
      setSummary(data.summary)
      setViewState('done')
      setShowInput(false)
    } catch {
      clearInterval(interval)
      setError('Erreur réseau. Vérifie ta connexion.')
      setViewState('error')
    }
  }, [])

  if (viewState === 'loading') {
    return (
      <div>
        <ToolHeader onNewAnalysis={() => {}} disabled />
        <TerrainProgress steps={STEPS} currentStep={loadStep} />
      </div>
    )
  }

  return (
    <div>
      <ToolHeader
        onNewAnalysis={() => {
          if (viewState === 'done' || viewState === 'error') {
            setShowInput(true)
          } else {
            setViewState('inputting')
          }
        }}
        disabled={false}
        hasResults={viewState === 'done'}
      />

      {/* Error banner */}
      {viewState === 'error' && (
        <div style={{ background: 'var(--red-2)', border: '1px solid #FADBD8', borderRadius: 'var(--r-md)', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span>{error}</span>
          <button
            onClick={() => { setViewState('inputting'); setError('') }}
            style={{ fontSize: '12px', fontWeight: 600, color: 'var(--red)', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', whiteSpace: 'nowrap' }}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Input form */}
      {(viewState === 'inputting' || showInput) && (
        <TerrainInput
          onAnalyze={analyze}
          onCancel={viewState === 'done' ? () => setShowInput(false) : undefined}
        />
      )}

      {/* Results */}
      {viewState === 'done' && prospects.length > 0 && (
        <>
          {summary && (
            <div style={{ background: 'var(--green-3)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-md)', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
              {summary}
            </div>
          )}
          <TerrainTable prospects={prospects} />
        </>
      )}

      {viewState === 'done' && prospects.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)', fontSize: '13px' }}>
          Aucun prospect identifiable dans le texte fourni. Essaie avec d&apos;autres données.
        </div>
      )}

      {/* Empty state */}
      {(viewState === 'idle') && (
        <TerrainEmptyState onStart={() => setViewState('inputting')} />
      )}
    </div>
  )
}

interface HeaderProps {
  onNewAnalysis: () => void
  disabled: boolean
  hasResults?: boolean
}

function ToolHeader({ onNewAnalysis, disabled, hasResults }: HeaderProps) {
  return (
    <div className="tool-header">
      <div className="tool-badge" style={{ background: 'var(--green-3)', color: 'var(--green)', border: '1px solid var(--green-4)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7" strokeDasharray="3 2"/>
          <circle cx="12" cy="12" r="11" strokeDasharray="2 3"/>
        </svg>
        Terrain — Inclus dans ton abonnement
      </div>
      <h1 className="tool-h1">Analyse ton terrain commercial.</h1>
      <p className="tool-desc">Colle des données brutes sur tes prospects — noms d&apos;entreprises, profils LinkedIn, notes de réunion, listes. On identifie, enrichit et priorise chaque opportunité.</p>
      <div className="tool-actions">
        <button
          className="tbtn-primary"
          onClick={onNewAnalysis}
          disabled={disabled}
          style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          {hasResults ? '+ Nouvelle analyse' : 'Analyser mes prospects'}
        </button>
      </div>
    </div>
  )
}
