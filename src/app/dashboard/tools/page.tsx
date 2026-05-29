import Link from 'next/link'

const TOOLS = [
  {
    href: '/dashboard/tools/keyaccount',
    label: 'Keyaccount',
    subtitle: 'Cartographie et suivi de tes comptes clés',
    icon: (
      <svg width="24" height="24" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7.5" cy="4" r="2.5"/><circle cx="2.5" cy="12" r="1.5"/><circle cx="12.5" cy="12" r="1.5"/>
        <path d="M7.5 6.5v3M5 11L3 12M10 11l2 1"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/tools/deallink',
    label: 'DealLink',
    subtitle: 'Génère des pages de présentation commerciale',
    icon: (
      <svg width="24" height="24" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 7.5h5M8 5l2.5 2.5L8 10"/><rect x="1" y="2" width="13" height="11" rx="2"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/tools/replique',
    label: 'Réplique',
    subtitle: 'Réponds aux objections clients en un clic',
    icon: (
      <svg width="24" height="24" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 3.5A1.5 1.5 0 012.5 2h10A1.5 1.5 0 0114 3.5v6A1.5 1.5 0 0112.5 11H8l-3 2.5V11H2.5A1.5 1.5 0 011 9.5v-6z"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/tools/sidehustle',
    label: 'Side Hustle',
    subtitle: 'Simule la rentabilité de tes projets annexes',
    icon: (
      <svg width="24" height="24" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 11l3-6 3 4 2-3 3 5"/><path d="M1 13h13"/>
      </svg>
    ),
  },
]

export default function ToolsHub() {
  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-inter)', fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
          Outils
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
          Sélectionne l&apos;outil que tu souhaites utiliser.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {TOOLS.map(tool => (
          <Link
            key={tool.href}
            href={tool.href}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '18px 20px', borderRadius: 'var(--r-lg)',
              background: 'var(--white)', border: '1px solid var(--border)',
              textDecoration: 'none', transition: 'all .15s',
            }}
          >
            <div style={{ color: 'var(--green)', flexShrink: 0 }}>
              {tool.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' }}>
                {tool.label}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.4 }}>
                {tool.subtitle}
              </div>
            </div>
            <div style={{ fontSize: '16px', color: 'var(--green)', opacity: 0.5, flexShrink: 0 }}>→</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
