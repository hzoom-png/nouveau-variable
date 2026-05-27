'use client'

export function DealLinkEditor({
  deallink,
  onColorChange,
  onPublish,
  isSaving,
  saveStatus,
}: {
  deallink: any
  onColorChange: (key: string, value: string) => void
  onPublish: () => void
  isSaving: boolean
  saveStatus: 'saved' | 'saving' | 'error' | ''
}) {
  const { config } = deallink

  const lblStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-2)',
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '5px',
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
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        width: '384px',
        background: 'var(--white)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '22px 24px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h2
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {deallink.prospect_name}
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-2)',
            marginBottom: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {deallink.company_name}
        </p>
        <div style={{ height: '20px', fontSize: '12px' }}>
          {saveStatus === 'saving' && (
            <p style={{ color: '#2563eb' }}>💾 Saving...</p>
          )}
          {saveStatus === 'saved' && (
            <p style={{ color: 'var(--green)' }}>✓ Saved</p>
          )}
          {saveStatus === 'error' && (
            <p style={{ color: 'var(--red)' }}>✗ Error</p>
          )}
        </div>
      </div>

      {/* Colors Section */}
      <div
        style={{
          padding: '22px 24px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h3
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '16px',
          }}
        >
          🎨 Colors
        </h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Primary Color */}
          <div>
            <label style={lblStyle}>Primary Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={config.colors.primary}
                onChange={(e) => onColorChange('primary', e.target.value)}
                style={{
                  width: '48px',
                  height: '48px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              />
              <input
                type="text"
                value={config.colors.primary}
                onChange={(e) => onColorChange('primary', e.target.value)}
                style={{
                  ...inputStyle,
                  flex: 1,
                  fontFamily: 'monospace',
                }}
                placeholder="#2F5446"
              />
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label style={lblStyle}>Accent Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={config.colors.accent}
                onChange={(e) => onColorChange('accent', e.target.value)}
                style={{
                  width: '48px',
                  height: '48px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              />
              <input
                type="text"
                value={config.colors.accent}
                onChange={(e) => onColorChange('accent', e.target.value)}
                style={{
                  ...inputStyle,
                  flex: 1,
                  fontFamily: 'monospace',
                }}
                placeholder="#C8790A"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Images Placeholder */}
      <div
        style={{
          padding: '22px 24px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h3
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '12px',
          }}
        >
          🖼️ Images
        </h3>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-2)',
            marginBottom: '12px',
          }}
        >
          Image upload coming in Phase 2
        </p>
        <button
          disabled
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'var(--surface)',
            color: 'var(--text-3)',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'not-allowed',
          }}
        >
          + Upload Image (Phase 2)
        </button>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }}></div>

      {/* Publish Button */}
      <div
        style={{
          padding: '22px 24px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <button
          onClick={onPublish}
          disabled={isSaving}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: isSaving ? 'var(--surface)' : 'var(--green)',
            color: isSaving ? 'var(--text-2)' : '#fff',
            border: 'none',
            borderRadius: 'var(--r-sm)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            transition: '.2s',
          }}
        >
          {isSaving ? '⏳ Publishing...' : '✓ Publish & Share'}
        </button>
        <p
          style={{
            fontSize: '11px',
            color: 'var(--text-3)',
            marginTop: '8px',
            textAlign: 'center',
          }}
        >
          Generates a unique, shareable link
        </p>
      </div>
    </div>
  )
}
