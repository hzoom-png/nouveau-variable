'use client'

import { useState, useCallback } from 'react'

interface Props {
  n1Actifs?: number
  isN3Eligible?: boolean
  n3EligibleSince?: string | null
  subscriptionStart?: string | null
  n3Actifs?: number
  embedded?: boolean
}

const TVA               = 1.20
const MONTHLY_TTC       = 97
const ANNUAL_TTC        = 899
const MONTHLY_HT        = parseFloat((MONTHLY_TTC / TVA).toFixed(2))
const ANNUAL_HT         = parseFloat((ANNUAL_TTC  / TVA).toFixed(2))
const N1_RATE           = 0.30
const N2_RATE           = 0.05
const N3_RATE           = 0.05

function monthsSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 0
  const ms = Date.now() - new Date(dateStr).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 30.44))
}

export function AffiliationSimulator({ n1Actifs = 0, isN3Eligible = false, n3EligibleSince, subscriptionStart, n3Actifs = 0, embedded = false }: Props) {
  const [plan, setPlan]   = useState<'monthly' | 'annual'>('monthly')
  const [n1, setN1]       = useState(n1Actifs)
  const [n2, setN2]       = useState(0)
  const [n3, setN3]       = useState(n3Actifs)

  const base    = plan === 'annual' ? ANNUAL_HT : MONTHLY_HT
  const baseTTC = plan === 'annual' ? ANNUAL_TTC : MONTHLY_TTC

  const commN1   = parseFloat((base * N1_RATE).toFixed(2))
  const commN2   = parseFloat((base * N2_RATE).toFixed(2))
  const commN3   = parseFloat((base * N3_RATE).toFixed(2))
  const revenuN1 = n1 * commN1
  const revenuN2 = n2 * commN2
  // N3 toujours calculé — le simulateur montre le potentiel même avant déblocage (FOMO)
  const revenuN3 = n3 * commN3
  const totalReel   = revenuN1 + revenuN2 + (isN3Eligible ? revenuN3 : 0)
  const totalSimule = revenuN1 + revenuN2 + revenuN3
  const total    = totalSimule
  const annuel   = plan === 'annual' ? total : total * 12

  const monthsSubscribed = monthsSince(subscriptionStart)
  const monthsLeft       = Math.max(0, 6 - monthsSubscribed)

  const fmt    = (v: number) => Math.round(v).toLocaleString('fr-FR')
  const fmtDec = (v: number) => v.toFixed(2).replace('.', ',')

  const handleN1 = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setN1(Number(e.target.value)), [])
  const handleN2 = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setN2(Number(e.target.value)), [])
  const handleN3 = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setN3(Number(e.target.value)), [])

  return (
    <div style={embedded ? {} : {
      background: 'var(--white)', borderRadius: '14px',
      padding: '24px', marginBottom: '24px',
      boxShadow: '0 1px 6px rgba(67,105,90,0.07)',
    }}>
      <style>{`
        .sim-slider {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 6px; border-radius: 99px;
          background: var(--border); outline: none; cursor: pointer;
        }
        .sim-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 20px; height: 20px; border-radius: 50%;
          background: #fff; border: 2.5px solid #024f41;
          cursor: pointer; box-shadow: 0 1px 4px rgba(47,84,70,0.18);
        }
        .sim-slider::-moz-range-thumb {
          width: 20px; height: 20px; border-radius: 50%;
          background: #fff; border: 2.5px solid #024f41;
          cursor: pointer; box-shadow: 0 1px 4px rgba(47,84,70,0.18);
        }
        .sim-slider-gold::-webkit-slider-thumb {
          border-color: #C8790A !important;
        }
        .sim-slider-gold::-moz-range-thumb {
          border-color: #C8790A !important;
        }
        @media (max-width: 640px) { .sim-result-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: '18px', color: 'var(--text)', marginBottom: '2px' }}>
            Simule tes revenus d&apos;affiliation
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Commission calculée sur le montant HT — base {fmtDec(base)} € HT ({baseTTC} € TTC)
          </div>
        </div>

        {/* Toggle plan */}
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 99, padding: 3, gap: 2, flexShrink: 0 }}>
          {(['monthly', 'annual'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              style={{
                padding: '5px 14px', borderRadius: 99, border: 'none',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: plan === p ? '#024f41' : 'transparent',
                color: plan === p ? '#fff' : 'var(--muted)',
                transition: 'all .15s',
              }}
            >
              {p === 'monthly' ? 'Mensuel' : 'Annuel'}
            </button>
          ))}
        </div>
      </div>

      {/* Taux recap */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'N1 — 30% du HT', value: `${fmtDec(commN1)} €`, color: '#024f41', bg: '#e8f5ef', border: '#56b791' },
          { label: 'N2 — 5% du HT',  value: `${fmtDec(commN2)} €`, color: '#4B7BF5', bg: '#EEF2FF', border: '#C7D2FE' },
          { label: 'N3 — 5% du HT',  value: isN3Eligible ? `${fmtDec(commN3)} €` : `Débloqué à 6 mois`, color: '#C8790A', bg: '#FEF3E2', border: '#F0C07A' },
        ].map(r => (
          <div key={r.label} style={{ flex: 1, minWidth: 140, background: r.bg, border: `1px solid ${r.border}`, borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: r.color, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 2 }}>{r.label}</div>
            <div style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: 18, color: r.color }}>
              {r.value} {isN3Eligible && <span style={{ fontSize: 11, fontWeight: 500, opacity: .7 }}>/ filleul</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Slider N1 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>Filleuls directs N1</span>
          <span style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: '20px', color: '#024f41', minWidth: 40, textAlign: 'right' }}>{n1}</span>
        </div>
        <input type="range" min={0} max={100} step={1} value={n1} onChange={handleN1} className="sim-slider"
          style={{ background: `linear-gradient(to right, #024f41 ${n1}%, var(--border) ${n1}%)` }} />
      </div>

      {/* Slider N2 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>Filleuls indirects N2</span>
          <span style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: '20px', color: '#4B7BF5', minWidth: 40, textAlign: 'right' }}>{n2}</span>
        </div>
        <input type="range" min={0} max={500} step={1} value={n2} onChange={handleN2} className="sim-slider"
          style={{ background: `linear-gradient(to right, #4B7BF5 ${n2 / 5}%, var(--border) ${n2 / 5}%)` }} />
      </div>

      {/* Slider N3 — toujours actif pour la simulation FOMO */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>Filleuls profonds N3</span>
            {isN3Eligible ? (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#FEF3E2', color: '#C8790A', fontWeight: 600, border: '1px solid #F0C07A' }}>
                Débloqué ✓
              </span>
            ) : (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#FEF3E2', color: '#C8790A', fontWeight: 600, border: '1px solid #F0C07A' }}>
                {monthsLeft > 0 ? `🔒 Dans ${monthsLeft} mois` : '🔒 Bientôt'}
              </span>
            )}
          </div>
          <span style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: '20px', color: '#C8790A', minWidth: 40, textAlign: 'right' }}>{n3}</span>
        </div>
        <input
          type="range" min={0} max={1000} step={1}
          value={n3}
          onChange={handleN3}
          className="sim-slider sim-slider-gold"
          style={{ background: `linear-gradient(to right, #C8790A ${n3 / 10}%, var(--border) ${n3 / 10}%)` }}
        />
        {!isN3Eligible && monthsLeft > 0 && (
          <div style={{ fontSize: 12, color: '#8B6914', marginTop: 6 }}>
            🔒 Simulation — débloqué après 6 mois d&apos;abonnement.
            {subscriptionStart && <> Tu es à <strong>{monthsSubscribed}/6 mois</strong>.</>}
          </div>
        )}
        {isN3Eligible && n3EligibleSince && (
          <div style={{ fontSize: 12, color: '#C8790A', marginTop: 6 }}>
            ✓ Débloqué depuis le {new Date(n3EligibleSince).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* Résultats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }} className="sim-result-grid">
        <div style={{ background: 'var(--surface)', borderRadius: '10px', padding: '14px 16px', border: '1.5px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Revenus N1</div>
          <div style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: '22px', color: '#43695A' }}>{fmt(revenuN1)} €</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>/{plan === 'annual' ? 'an' : 'mois'}</div>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: '10px', padding: '14px 16px', border: '1.5px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Revenus N2</div>
          <div style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: '22px', color: '#4B7BF5' }}>{fmt(revenuN2)} €</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>/{plan === 'annual' ? 'an' : 'mois'}</div>
        </div>
        <div style={{ background: '#FEF3E2', borderRadius: '10px', padding: '14px 16px', border: '1.5px solid #F0C07A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '6px' }}>
            <div style={{ fontSize: '11px', color: '#C8790A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Revenus N3</div>
            {!isN3Eligible && <div style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: '#C8790A', color: '#fff', fontWeight: 700 }}>SIMULÉ</div>}
          </div>
          <div style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: '22px', color: '#C8790A' }}>{fmt(revenuN3)} €</div>
          <div style={{ fontSize: '11px', color: '#C8790A', marginTop: '2px' }}>/{plan === 'annual' ? 'an' : 'mois'}</div>
        </div>
        <div style={{ background: '#e8f5ef', borderRadius: '10px', padding: '14px 16px', border: '1.5px solid #56b791' }}>
          <div style={{ fontSize: '11px', color: '#1a7b5e', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {isN3Eligible ? 'Total' : 'Total simulé'}
          </div>
          <div style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 600, fontSize: '22px', color: '#024f41' }}>{fmt(totalSimule)} €</div>
          {!isN3Eligible && totalReel !== totalSimule && (
            <div style={{ fontSize: '11px', color: '#43695A', marginTop: '2px' }}>
              Réel actuel : {fmt(totalReel)} €
            </div>
          )}
          {isN3Eligible && (
            <div style={{ fontSize: '11px', color: '#1a7b5e', marginTop: '2px' }}>/{plan === 'annual' ? 'an' : 'mois'}</div>
          )}
        </div>
      </div>

      {/* Projection */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        {plan === 'monthly' ? (
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
            soit <strong style={{ color: 'var(--text)' }}>~{fmt(annuel)} €</strong>/an
          </span>
        ) : (
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
            soit <strong style={{ color: 'var(--text)' }}>~{fmt(total / 12)} €</strong>/mois en moyenne
          </span>
        )}
      </div>

      {/* Note légale */}
      <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: '1.6', padding: '10px 14px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
        Simulation indicative. Commissions sur le HT ({fmtDec(base)} €) — TVA 20%.
        N1 : 30 % · N2 : 5 % · N3 : 5 % (actif à 6 mois d&apos;abonnement).
        {!isN3Eligible && <> Les revenus N3 affichés sont <strong>simulés</strong> — ils seront réels une fois le niveau débloqué.</>}
      </div>
    </div>
  )
}
