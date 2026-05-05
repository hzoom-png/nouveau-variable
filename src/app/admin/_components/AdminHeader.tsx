'use client'

const C = {
  border: 'rgba(255,255,255,0.07)',
  text:   '#F7FAF8',
  text2:  '#4B6358',
}

type Props = {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function AdminHeader({ title, subtitle, action }: Props) {
  return (
    <div style={{
      height: 64, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 40px',
      borderBottom: `1px solid ${C.border}`,
      position: 'sticky', top: 0, zIndex: 10,
      background: '#0F1C17',
    }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1 }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
