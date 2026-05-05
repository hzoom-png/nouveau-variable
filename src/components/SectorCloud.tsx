'use client'

const SECTORS = [
  'SaaS / Logiciel', 'Industrie', 'BTP / Construction', 'Immobilier',
  'Finance / Banque', 'Assurance', 'Santé / Médical', 'Pharmacie',
  'RH / Recrutement', 'Cabinet de conseil', 'Juridique', 'Comptabilité',
  'Marketing / Com', 'E-commerce', 'Retail / Distribution', 'Transport / Logistique',
  'Énergie', 'Agroalimentaire', 'Hôtellerie / Tourisme', 'Restauration',
  'Formation / Éducation', 'Collectivité publique', 'Association',
  'Architecture / Design', 'Audiovisuel / Média', 'Télécoms',
  'Cybersécurité', 'Automobile', 'Luxe', 'Sport',
]

interface SectorCloudProps {
  value: string[]
  onChange: (sectors: string[]) => void
  max?: number
}

export default function SectorCloud({ value, onChange, max = 3 }: SectorCloudProps) {
  const maxReached = value.length >= max

  function toggle(sector: string) {
    if (value.includes(sector)) {
      onChange(value.filter(s => s !== sector))
    } else if (!maxReached) {
      onChange([...value, sector])
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <span style={{
          fontSize: '11px', fontWeight: 700, padding: '3px 10px',
          borderRadius: '99px',
          background: maxReached ? 'var(--green-3)' : 'var(--surface)',
          border: '1px solid var(--border)',
          color: maxReached ? 'var(--green)' : 'var(--text-3)',
          transition: 'all .2s',
        }}>
          {value.length}/{max}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
        {SECTORS.map(sector => {
          const selected = value.includes(sector)
          const disabled = maxReached && !selected
          return (
            <button
              key={sector}
              type="button"
              onClick={() => toggle(sector)}
              disabled={disabled}
              style={{
                padding: '6px 13px',
                borderRadius: '99px',
                fontSize: '12px',
                fontWeight: selected ? 700 : 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                border: `1.5px solid ${selected ? 'var(--green)' : 'var(--green-4)'}`,
                background: selected ? 'var(--green)' : 'var(--surface)',
                color: selected ? '#fff' : 'var(--text-2)',
                transform: selected ? 'scale(1.04)' : 'scale(1)',
                opacity: disabled ? 0.45 : 1,
                transition: 'all .15s',
                fontFamily: 'inherit',
              }}
            >
              {sector}
            </button>
          )
        })}
      </div>

      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {value.map(s => (
            <span
              key={s}
              style={{
                padding: '4px 11px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
                background: 'var(--green)', color: '#fff',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              ✓ {s}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
