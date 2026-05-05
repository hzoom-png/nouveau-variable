'use client'

import { useState, useCallback } from 'react'

interface Props {
  n1Actifs?: number
}

const N1_COMM = 38.80
const N2_COMM = 4.85

export function AffiliationSimulator({ n1Actifs = 0 }: Props) {
  const [n1, setN1] = useState(n1Actifs)
  const [n2, setN2] = useState(0)

  const revenuN1 = n1 * N1_COMM
  const revenuN2 = n2 * N2_COMM
  const total = revenuN1 + revenuN2
  const annuel = total * 12

  const fmt = (v: number) => Math.round(v).toLocaleString('fr-FR')

  const handleN1 = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setN1(Number(e.target.value))
  }, [])

  const handleN2 = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setN2(Number(e.target.value))
  }, [])

  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: '14px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 1px 6px rgba(67,105,90,0.07)',
    }}>
      <style>{`
        .sim-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 99px;
          background: var(--border);
          outline: none;
          cursor: pointer;
        }
        .sim-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          border: 2.5px solid #2F5446;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(47,84,70,0.18);
        }
        .sim-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          border: 2.5px solid #2F5446;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(47,84,70,0.18);
        }
        .sim-slider::-webkit-slider-runnable-track {
          border-radius: 99px;
        }
      `}</style>

      <div style={{
        fontFamily: 'var(--font-jost, Jost, sans-serif)',
        fontWeight: 800,
        fontSize: '18px',
        color: 'var(--text)',
        marginBottom: '4px',
      }}>
        Simule tes revenus d&apos;affiliation
      </div>
      <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '24px' }}>
        Ajuste les curseurs pour voir ton potentiel mensuel en temps réel
      </div>

      {/* Slider N1 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>Recommandations directes (N1)</span>
          <span style={{
            fontFamily: 'var(--font-jost, Jost, sans-serif)',
            fontWeight: 800,
            fontSize: '20px',
            color: '#2F5446',
            minWidth: '40px',
            textAlign: 'right',
          }}>{n1}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={n1}
          onChange={handleN1}
          className="sim-slider"
          style={{
            background: `linear-gradient(to right, #2F5446 ${n1}%, var(--border) ${n1}%)`,
          }}
        />
      </div>

      {/* Slider N2 */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>Recommandations indirectes (N2)</span>
          <span style={{
            fontFamily: 'var(--font-jost, Jost, sans-serif)',
            fontWeight: 800,
            fontSize: '20px',
            color: '#4B7BF5',
            minWidth: '40px',
            textAlign: 'right',
          }}>{n2}</span>
        </div>
        <input
          type="range"
          min={0}
          max={500}
          step={1}
          value={n2}
          onChange={handleN2}
          className="sim-slider"
          style={{
            background: `linear-gradient(to right, #4B7BF5 ${n2 / 5}%, var(--border) ${n2 / 5}%)`,
          }}
        />
      </div>

      {/* Result blocks */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '12px',
      }} className="sim-result-grid">
        <div style={{
          background: 'var(--surface)',
          borderRadius: '10px',
          padding: '14px 16px',
          border: '1.5px solid var(--border)',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Revenus N1
          </div>
          <div style={{
            fontFamily: 'var(--font-jost, Jost, sans-serif)',
            fontWeight: 800,
            fontSize: '22px',
            color: '#43695A',
          }}>
            {fmt(revenuN1)} €
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>/mois</div>
        </div>

        <div style={{
          background: 'var(--surface)',
          borderRadius: '10px',
          padding: '14px 16px',
          border: '1.5px solid var(--border)',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Revenus N2
          </div>
          <div style={{
            fontFamily: 'var(--font-jost, Jost, sans-serif)',
            fontWeight: 800,
            fontSize: '22px',
            color: '#4B7BF5',
          }}>
            {fmt(revenuN2)} €
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>/mois</div>
        </div>

        <div style={{
          background: '#EAF2EE',
          borderRadius: '10px',
          padding: '14px 16px',
          border: '1.5px solid #C5DDD5',
        }}>
          <div style={{ fontSize: '11px', color: '#3D6B58', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total mensuel
          </div>
          <div style={{
            fontFamily: 'var(--font-jost, Jost, sans-serif)',
            fontWeight: 900,
            fontSize: '22px',
            color: '#2F5446',
          }}>
            {fmt(total)} €
          </div>
          <div style={{ fontSize: '11px', color: '#3D6B58', marginTop: '2px' }}>/mois</div>
        </div>
      </div>

      {/* Projection annuelle */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
          soit <strong style={{ color: 'var(--text)' }}>~{fmt(annuel)} €</strong>/an
        </span>
      </div>

      {/* Note légale */}
      <div style={{
        fontSize: '11px',
        color: 'var(--muted)',
        lineHeight: '1.5',
        padding: '10px 14px',
        background: 'var(--surface)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
      }}>
        Simulation indicative basée sur {n1 + n2} ventes à 97 €/mois. Les revenus réels dépendent du maintien des abonnements.
      </div>

      <style>{`
        @media (max-width: 640px) {
          .sim-result-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
