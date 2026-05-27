'use client'

export function DealLinkHistoryFull({
  deallinks,
  isLoading,
  onSelectDeallink,
  onClose,
}: {
  deallinks: any[]
  isLoading: boolean
  onSelectDeallink: (deallink: any) => void
  onClose: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--r-lg)',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text)',
              margin: 0,
            }}
          >
            📋 All Deallinks
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: 'var(--text-2)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          {isLoading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-2)' }}>
              Loading...
            </p>
          ) : deallinks.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-2)' }}>
              No deallinks yet
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {deallinks.map((dl) => (
                <button
                  key={dl.id}
                  onClick={() => {
                    onSelectDeallink(dl)
                    onClose()
                  }}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-sm)',
                    padding: '16px',
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
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--text)',
                          margin: 0,
                          marginBottom: '4px',
                        }}
                      >
                        {dl.prospect_name}
                      </p>
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-2)',
                          margin: 0,
                        }}
                      >
                        {dl.company_name}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        background:
                          dl.status === 'published'
                            ? 'var(--green)'
                            : 'var(--border)',
                        color:
                          dl.status === 'published'
                            ? '#fff'
                            : 'var(--text-2)',
                        padding: '4px 8px',
                        borderRadius: 'var(--r-sm)',
                        fontWeight: 600,
                      }}
                    >
                      {dl.status}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '12px',
                      color: 'var(--text-2)',
                    }}
                  >
                    <span>{dl.deal_type || 'N/A'}</span>
                    {dl.deal_value && <span>{dl.deal_value}€</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
