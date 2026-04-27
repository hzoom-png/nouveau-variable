'use client'

interface Props { onStart: () => void }

export default function TerrainEmptyState({ onStart }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '380px' }}>
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '48px 40px', textAlign: 'center', maxWidth: '420px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ width: '52px', height: '52px', background: 'var(--green-3)', borderRadius: 'var(--r-lg)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.6">
            <circle cx="12" cy="12" r="3"/>
            <circle cx="12" cy="12" r="7" strokeDasharray="3 2"/>
            <circle cx="12" cy="12" r="11" strokeDasharray="2 3"/>
            <path d="M12 1v3M12 20v3M1 12h3M20 12h3"/>
          </svg>
        </div>
        <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px', letterSpacing: '-.01em' }}>
          Analyse ton terrain.
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '24px' }}>
          Colle une liste de prospects, des noms d&apos;entreprises, des profils LinkedIn, des notes de réunion. On analyse, on enrichit, on priorise.
        </div>
        <button className="tbtn-primary" onClick={onStart} style={{ width: '100%' }}>
          Commencer l&apos;analyse →
        </button>
      </div>
    </div>
  )
}
