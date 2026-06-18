'use client'

import { useState } from 'react'
import { AffiliationSimulator } from '@/components/affiliation/AffiliationSimulator'
import { AffiliationPipe } from '@/components/affiliation/AffiliationPipe'
import { CopyButton } from '@/components/ui/CopyButton'

interface Props {
  n1: number
  n2: number
  n3: number
  isN3Eligible: boolean
  n3EligibleSince: string | null
  subscriptionStart: string | null
  affiliateLink: string
  commN1: number
  commN2: number
  commN3: number
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      style={{ flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

interface SectionProps {
  title: string
  meta?: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}

function CollapseSection({ title, meta, open, onToggle, children }: SectionProps) {
  return (
    <div style={{ background: 'var(--white)', borderRadius: 14, boxShadow: '0 1px 6px rgba(2,79,65,.07)', marginBottom: 16, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
          gap: 12, textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: 15, color: 'var(--text)', whiteSpace: 'nowrap' }}>{title}</span>
          {meta && (
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</span>
          )}
        </div>
        <ChevronIcon open={open} />
      </button>

      <div style={{
        display: open ? 'block' : 'none',
        borderTop: '1px solid var(--border)',
        padding: '0 20px 20px',
      }}>
        {open && children}
      </div>
    </div>
  )
}

export function AffiliationPageClient({
  n1, n2, n3, isN3Eligible,
  n3EligibleSince, subscriptionStart,
  affiliateLink, commN1, commN2, commN3,
}: Props) {
  const [pipeOpen, setPipeOpen]       = useState(false)
  const [simOpen,  setSimOpen]        = useState(false)

  const kpis = [
    { label: 'Filleuls N1 actifs',   value: String(n1),   color: '#43695A' },
    { label: 'Filleuls N2 actifs',   value: String(n2),   color: '#4B7BF5' },
    { label: 'Filleuls N3 actifs',   value: isN3Eligible ? String(n3) : '–', color: '#C8790A' },
    { label: 'Commission N1 / mois', value: `${commN1.toFixed(0)} €`, color: '#43695A' },
    { label: 'Commission N2 / mois', value: `${commN2.toFixed(2)} €`, color: '#4B7BF5' },
    { label: 'Commission N3 / mois', value: isN3Eligible ? `${commN3.toFixed(2)} €` : 'À 6 mois', color: '#C8790A' },
  ]

  const totalMonthly = commN1 + commN2 + commN3

  return (
    <div style={{ maxWidth: 900 }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: 'var(--white)', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 6px rgba(2,79,65,.07)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k.label}</div>
            <div style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: 22, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* N3 banner */}
      {!isN3Eligible ? (
        <div style={{ background: '#FEF3E2', border: '1.5px solid #F0C07A', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
          <div style={{ fontSize: 13, color: '#8B6914' }}>
            <strong style={{ color: '#C8790A' }}>N3 non débloqué —</strong> actif après 6 mois d&apos;abonnement consécutif.
          </div>
        </div>
      ) : (
        <div style={{ background: '#e8f5ef', border: '1.5px solid #56b791', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🏆</span>
          <div style={{ fontSize: 13, color: '#1a7b5e' }}>
            <strong style={{ color: '#024f41' }}>N3 débloqué —</strong> tu touches 5% du HT sur chaque filleul N3 actif.
          </div>
        </div>
      )}

      {/* Affiliate link */}
      <div style={{ background: 'var(--white)', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 6px rgba(2,79,65,.07)', marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 10 }}>Ton lien d&apos;affiliation</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: affiliateLink ? 10 : 0 }}>
          <div style={{
            flex: 1, background: 'var(--off)', border: '1.5px solid var(--border)',
            borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text)',
            fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {affiliateLink || 'Complète ton profil pour obtenir ton code'}
          </div>
          {affiliateLink && <CopyButton text={affiliateLink} />}
        </div>
        {affiliateLink && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(affiliateLink)}`} target="_blank" rel="noopener noreferrer"
              style={{ padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#0077B5', color: 'white', textDecoration: 'none' }}>LinkedIn</a>
            <a href={`https://wa.me/?text=${encodeURIComponent('Rejoins le club Nouveau Variable : ' + affiliateLink)}`} target="_blank" rel="noopener noreferrer"
              style={{ padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#25D366', color: 'white', textDecoration: 'none' }}>WhatsApp</a>
            <a href={`mailto:?subject=Rejoins Nouveau Variable&body=${encodeURIComponent('Je t\'invite à rejoindre le club : ' + affiliateLink)}`}
              style={{ padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'var(--off)', color: 'var(--text)', textDecoration: 'none', border: '1.5px solid var(--border)' }}>Email</a>
          </div>
        )}
      </div>

      {/* Pipeline — collapsible */}
      <CollapseSection
        title="Pipeline d'affiliation"
        meta={pipeOpen ? undefined : 'Tes prospects en cours'}
        open={pipeOpen}
        onToggle={() => setPipeOpen(v => !v)}
      >
        <div style={{ paddingTop: 16 }}>
          <AffiliationPipe embedded />
        </div>
      </CollapseSection>

      {/* Simulator — collapsible */}
      <CollapseSection
        title="Simule tes gains"
        meta={simOpen ? undefined : `~${Math.round(totalMonthly)} € / mois simulé`}
        open={simOpen}
        onToggle={() => setSimOpen(v => !v)}
      >
        <div style={{ paddingTop: 16 }}>
          <AffiliationSimulator
            n1Actifs={n1}
            n3Actifs={n3}
            isN3Eligible={isN3Eligible}
            n3EligibleSince={n3EligibleSince}
            subscriptionStart={subscriptionStart}
            embedded
          />
        </div>
      </CollapseSection>

    </div>
  )
}
