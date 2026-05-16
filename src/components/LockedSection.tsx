'use client'

interface LockedSectionProps {
  feature: string
  email?: string
}

export function LockedSection({ feature, email }: LockedSectionProps) {
  const href = `/subscribe${email ? `?email=${encodeURIComponent(email)}` : ''}`

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 24px',
      textAlign: 'center',
      minHeight: '60vh',
    }}>
      <div style={{
        width: 64, height: 64,
        background: '#e8f5ef',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        marginBottom: 28,
      }}>
        🔒
      </div>
      <h2 style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 700,
        fontSize: 22,
        color: '#012722',
        marginBottom: 12,
      }}>
        {feature}
      </h2>
      <p style={{
        fontSize: 15,
        color: '#4B6358',
        maxWidth: 380,
        lineHeight: 1.7,
        marginBottom: 36,
      }}>
        Cette section est réservée aux membres actifs du club.
      </p>
      <a
        href={href}
        style={{
          background: '#024f41',
          color: '#ffffff',
          padding: '14px 32px',
          borderRadius: '99px',
          fontWeight: 700,
          fontSize: 15,
          textDecoration: 'none',
          transition: 'background 0.2s',
        }}
      >
        Activer mon accès →
      </a>
    </div>
  )
}
