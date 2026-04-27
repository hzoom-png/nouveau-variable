interface Props { balance: number }

export function TokenBalance({ balance }: Props) {
  const pct = Math.min(100, Math.round((balance / 500) * 100))
  const color = balance < 50 ? 'var(--red)' : balance < 150 ? 'var(--amber)' : 'var(--green)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '5px 11px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-full)',
      fontSize: 12,
    }}>
      <div style={{ width: 48, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontWeight: 700, color, fontFamily: 'var(--font-jost)' }}>{balance} tkn</span>
    </div>
  )
}
