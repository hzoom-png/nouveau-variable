'use client'

import { DealLinkColorPicker } from './DealLinkColorPicker'

export function DealLinkEditorLeft({
  deallink,
  onColorChange,
  onPublish,
  isSaving,
  saveStatus,
  onBack,
}: {
  deallink: any
  onColorChange: (key: string, value: string) => void
  onPublish: () => void
  isSaving: boolean
  saveStatus: 'saved' | 'saving' | 'error' | ''
  onBack: () => void
}) {
  const { config, prospect_name, company_name, deal_value } = deallink

  return (
    <div
      style={{
        width: '40%',
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
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-2)',
            cursor: 'pointer',
            fontSize: '13px',
            padding: 0,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Back
        </button>
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
          {prospect_name}
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
          {company_name}
        </p>
        <div style={{ height: '20px', fontSize: '12px' }}>
          {saveStatus === 'saving' && (
            <p style={{ color: '#2563eb', margin: 0 }}>💾 Saving...</p>
          )}
          {saveStatus === 'saved' && (
            <p style={{ color: 'var(--green)', margin: 0 }}>✓ Saved</p>
          )}
          {saveStatus === 'error' && (
            <p style={{ color: 'var(--red)', margin: 0 }}>✗ Error</p>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '22px 24px',
        }}
      >
        {/* Colors Section */}
        <div style={{ marginBottom: '24px' }}>
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
            <DealLinkColorPicker
              label="Primary Color"
              value={config.colors.primary}
              onChange={(val) => onColorChange('primary', val)}
              placeholder="#2F5446"
            />
            <DealLinkColorPicker
              label="Accent Color"
              value={config.colors.accent}
              onChange={(val) => onColorChange('accent', val)}
              placeholder="#C8790A"
            />
          </div>
        </div>

        {/* Info Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '12px',
            }}
          >
            📋 Infos
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {deallink.deal_type && (
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-2)',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Deal Type
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0 }}>
                  {deallink.deal_type}
                </p>
              </div>
            )}
            {deal_value && (
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-2)',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Deal Value
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0 }}>
                  {deal_value}€
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

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
