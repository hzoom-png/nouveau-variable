'use client'

export function DealLinkColorPicker({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (newValue: string) => void
  placeholder?: string
}) {
  const lblStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-2)',
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '8px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 13px',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--r-sm)',
    fontSize: '13px',
    color: 'var(--text)',
    background: 'var(--white)',
    outline: 'none',
    fontFamily: 'monospace',
    boxSizing: 'border-box',
  }

  return (
    <div>
      <label style={lblStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '48px',
            height: '48px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            cursor: 'pointer',
            padding: '2px',
            minWidth: '48px',
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
