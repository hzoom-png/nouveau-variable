'use client'

export function DealLinkHistoryPreview({
  deallinks,
  onSelectDeallink,
  onShowAll,
  isLoading,
}: {
  deallinks: any[]
  onSelectDeallink: (deallink: any) => void
  onShowAll: () => void
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div
        style={{
          padding: '12px 0',
          fontSize: '12px',
          color: 'var(--text-2)',
          textAlign: 'center',
        }}
      >
        Loading...
      </div>
    )
  }

  const recentDeallinks = deallinks.slice(0, 3)

  if (deallinks.length === 0) {
    return null
  }

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <h4
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-2)',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          📋 Historique
        </h4>
        {deallinks.length > 3 && (
          <button
            onClick={onShowAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-2)',
              cursor: 'pointer',
              fontSize: '11px',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            See all
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gap: '8px' }}>
        {recentDeallinks.map((dl) => (
          <button
            key={dl.id}
            onClick={() => onSelectDeallink(dl)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              padding: '10px 12px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: '.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'var(--white)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                'var(--text)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'var(--surface)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                'var(--border)'
            }}
          >
            <p
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text)',
                margin: '0 0 4px 0',
              }}
            >
              {dl.prospect_name}
            </p>
            <p
              style={{
                fontSize: '11px',
                color: 'var(--text-2)',
                margin: 0,
              }}
            >
              {dl.company_name}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
