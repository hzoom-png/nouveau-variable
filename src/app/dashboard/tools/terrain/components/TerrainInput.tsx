'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCommercialContext } from '@/hooks/useCommercialContext'

interface Props {
  onAnalyze: (rawText: string) => void
  onCancel?: () => void
}

const PLACEHOLDER = `Exemples :
• Noms d'entreprises : Salesforce, HubSpot, Pipedrive...
• Profils LinkedIn : "Jean Dupont, Directeur Commercial chez Acme (150 salariés, SaaS RH)"
• Notes de réunion : "Rencontré Sophie M. de TechCorp au salon, cherche solution CRM"
• Listes CSV copiées-collées : Entreprise, Contact, Email, Secteur...`

export default function TerrainInput({ onAnalyze, onCancel }: Props) {
  const [rawText, setRawText] = useState('')
  const { ctx } = useCommercialContext()

  const contextHint = [ctx.product, ctx.icp, ctx.sector].filter(Boolean).join(' · ')
  const hasCtx = !!(ctx.product || ctx.icp)

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', marginBottom: '20px' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Données brutes</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>Colle n&apos;importe quel format — on s&apos;adapte</div>
        </div>
        <div style={{ fontSize: '11px', color: rawText.length > 7500 ? 'var(--red)' : 'var(--text-3)', fontWeight: 500 }}>
          {rawText.length} / 8 000
        </div>
      </div>

      {/* Textarea */}
      <div style={{ padding: '16px 20px' }}>
        <textarea
          className="finput"
          value={rawText}
          onChange={e => setRawText(e.target.value.slice(0, 8000))}
          placeholder={PLACEHOLDER}
          rows={9}
          autoFocus
          style={{ resize: 'vertical', lineHeight: 1.6, minHeight: '140px', fontSize: '13px' }}
        />
      </div>

      {/* Context hint */}
      {hasCtx && (
        <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--text-3)" strokeWidth="1.4"><circle cx="6" cy="4" r="2"/><path d="M1 11c0-2.76 2.24-5 5-5s5 2.24 5 5"/></svg>
          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Pré-rempli depuis ton contexte : {contextHint} ·</span>
          <Link href="/dashboard/settings" style={{ fontSize: '11px', color: 'var(--text-3)', textDecoration: 'underline' }}>Modifier</Link>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '12px 20px 16px', display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
        {onCancel && (
          <button
            onClick={onCancel}
            className="tbtn-secondary"
            style={{ padding: '9px 18px' }}
          >
            Annuler
          </button>
        )}
        <button
          onClick={() => { if (rawText.trim()) onAnalyze(rawText) }}
          className="tbtn-primary"
          disabled={!rawText.trim()}
          style={{ padding: '9px 22px', opacity: rawText.trim() ? 1 : 0.5, cursor: rawText.trim() ? 'pointer' : 'not-allowed' }}
        >
          Analyser →
        </button>
      </div>
    </div>
  )
}
