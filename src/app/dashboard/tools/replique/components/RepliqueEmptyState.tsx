'use client'

interface Props { onStart: () => void }

export default function RepliqueEmptyState({ onStart }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '360px' }}>
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '48px 40px', textAlign: 'center', maxWidth: '440px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ width: '52px', height: '52px', background: 'var(--green-3)', borderRadius: 'var(--r-lg)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
          <svg width="24" height="24" viewBox="0 0 14 14" fill="none" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round">
            <rect x="1" y="3" width="12" height="8" rx="1.5"/>
            <path d="M4 7h6M4 9.5h4"/>
            <path d="M5 3V2M9 3V2"/>
          </svg>
        </div>
        <div style={{ fontFamily: 'var(--font-jost)', fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
          Génère ton script en 30 secondes.
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '20px' }}>
          Dis-nous ce que tu vends, à qui tu parles, et quel est l&apos;objectif de l&apos;appel.
          Réplique construit ton script sur mesure — accroche, pitch, questions, rebonds sur objections.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', textAlign: 'left' }}>
          {[
            ['1', 'Tu renseignes le contexte'],
            ['2', 'Réplique génère le script'],
            ['3', 'Tu décroches, tu t\'appuies dessus'],
          ].map(([n, label]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--green)', display: 'grid', placeItems: 'center', fontSize: '11px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>{n}</div>
              <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{label}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onStart}
          style={{ background: 'var(--green)', color: '#fff', padding: '12px 24px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-jost)', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', width: '100%', transition: '.15s' }}
        >
          Créer mon premier script →
        </button>
      </div>
    </div>
  )
}
