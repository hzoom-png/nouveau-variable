interface Props {
  initials: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const sizes = { sm: 32, md: 44, lg: 60 }
const fontSizes = { sm: 12, md: 16, lg: 22 }

export function Avatar({ initials, size = 'md', color = '#43695A' }: Props) {
  const s = sizes[size]
  const fs = fontSizes[size]
  return (
    <div style={{
      width: s, height: s, borderRadius: Math.round(s * 0.25),
      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontFamily: 'var(--font-jost, Jost, sans-serif)',
      fontWeight: 700, fontSize: fs, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}
