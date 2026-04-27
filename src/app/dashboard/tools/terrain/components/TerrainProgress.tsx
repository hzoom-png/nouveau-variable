'use client'

interface Props {
  steps: string[]
  currentStep: number
}

export default function TerrainProgress({ steps, currentStep }: Props) {
  const progress = Math.round(((currentStep + 1) / steps.length) * 88)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '340px' }}>
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '40px 48px', width: '100%', maxWidth: '480px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
        <div className="tr-pulse-icon" style={{ width: '52px', height: '52px', background: 'var(--green-3)', borderRadius: 'var(--r-lg)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.6">
            <circle cx="12" cy="12" r="3"/>
            <circle cx="12" cy="12" r="7" strokeDasharray="3 2"/>
            <circle cx="12" cy="12" r="11" strokeDasharray="2 3"/>
            <path d="M12 1v3M12 20v3M1 12h3M20 12h3"/>
          </svg>
        </div>
        <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
          Analyse en cours...
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '24px', minHeight: '20px', transition: 'all .3s' }}>
          {steps[currentStep]}
        </div>
        <div style={{ height: '5px', background: 'var(--surface-2)', borderRadius: 'var(--r-full)' }}>
          <div style={{ height: '5px', background: 'var(--green)', borderRadius: 'var(--r-full)', width: progress + '%', transition: 'width 0.8s ease' }} />
        </div>
      </div>
    </div>
  )
}
