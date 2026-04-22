type Variant = 'active' | 'pending' | 'inactive' | 'declined'

const STYLES: Record<Variant, { bg: string; color: string; dot: string }> = {
  active:   { bg: 'var(--green-pale)', color: '#43695A', dot: '#43695A' },
  pending:  { bg: 'var(--amber-pale)', color: '#E8A020', dot: '#E8A020' },
  inactive: { bg: 'var(--border)',     color: 'var(--muted)', dot: 'var(--muted)' },
  declined: { bg: '#FEE2E2',           color: '#991B1B', dot: '#991B1B' },
}

export function Badge({ variant, label }: { variant: Variant; label: string }) {
  const s = STYLES[variant]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: s.bg, fontSize: '12px', fontWeight: 700, color: s.color }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {label}
    </span>
  )
}
