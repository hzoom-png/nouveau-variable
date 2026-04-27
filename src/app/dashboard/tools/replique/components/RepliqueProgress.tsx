'use client'

interface Props { steps: string[]; currentStep: number }

export default function RepliqueProgress({ steps, currentStep }: Props) {
  const progress = Math.round(((currentStep + 1) / steps.length) * 88)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '340px' }}>
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '40px 48px', width: '100%', maxWidth: '480px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ width: '52px', height: '52px', background: 'var(--green-3)', borderRadius: 'var(--r-lg)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
          <svg width="24" height="24" viewBox="0 0 14 14" fill="none" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round">
            <rect x="1" y="3" width="12" height="8" rx="1.5"/>
            <path d="M4 7h6M4 9.5h4"/>
            <path d="M5 3V2M9 3V2"/>
          </svg>
        </div>
        <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
          Script en préparation…
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
