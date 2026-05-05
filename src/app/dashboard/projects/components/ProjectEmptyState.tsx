'use client'

interface Props {
  onCreateProject: () => void
}

export function ProjectEmptyState({ onCreateProject }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '72px 32px', textAlign: 'center', background: 'var(--white)',
      borderRadius: 'var(--r-lg)', border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
      <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: '20px', color: 'var(--text)', marginBottom: '8px' }}>
        Aucun projet trouvé
      </div>
      <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, maxWidth: '380px', marginBottom: '24px' }}>
        Soyez le premier à partager un projet dans la communauté, ou modifiez vos filtres pour voir plus de résultats.
      </p>
      <button
        onClick={onCreateProject}
        style={{
          background: 'var(--green)', color: '#fff', padding: '12px 24px',
          borderRadius: 'var(--r-sm)', fontFamily: 'Jost, sans-serif', fontWeight: 700,
          fontSize: '14px', border: 'none', cursor: 'pointer', transition: '.15s',
        }}
      >
        Partager mon projet →
      </button>
    </div>
  )
}
