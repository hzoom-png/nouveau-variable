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
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
          }}
        >
          Retour
        </button>
        <h2
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: 'var(--text)',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'Inter, sans-serif',
            margin: '0 0 4px 0',
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
            fontFamily: 'Inter, sans-serif',
            margin: '0 0 12px 0',
          }}
        >
          {company_name}
        </p>
        <div style={{ height: '20px', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
          {saveStatus === 'saving' && (
            <p style={{ color: '#2563eb', margin: 0, fontWeight: 500 }}>Enregistrement...</p>
          )}
          {saveStatus === 'saved' && (
            <p style={{ color: 'var(--green)', margin: 0, fontWeight: 500 }}>Enregistré</p>
          )}
          {saveStatus === 'error' && (
            <p style={{ color: 'var(--red)', margin: 0, fontWeight: 500 }}>Erreur</p>
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
              fontWeight: 500,
              color: 'var(--text)',
              marginBottom: '16px',
              fontFamily: 'Inter, sans-serif',
              margin: '0 0 16px 0',
            }}
          >
            Couleurs
          </h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <DealLinkColorPicker
              label="Couleur Primaire"
              value={config.colors.primary}
              onChange={(val) => onColorChange('primary', val)}
              placeholder="#2F5446"
            />
            <DealLinkColorPicker
              label="Couleur Accent"
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
              fontWeight: 500,
              color: 'var(--text)',
              marginBottom: '12px',
              fontFamily: 'Inter, sans-serif',
              margin: '0 0 12px 0',
            }}
          >
            Infos
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {deallink.deal_type && (
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--text-2)',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                    fontFamily: 'Inter, sans-serif',
                    margin: '0 0 4px 0',
                  }}
                >
                  Type de Deal
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0, fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                  {deallink.deal_type}
                </p>
              </div>
            )}
            {deal_value && (
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--text-2)',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                    fontFamily: 'Inter, sans-serif',
                    margin: '0 0 4px 0',
                  }}
                >
                  Montant
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0, fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
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
            fontWeight: 500,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            transition: '.2s',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {isSaving ? 'Publication en cours...' : 'Publier et Partager'}
        </button>
        <p
          style={{
            fontSize: '11px',
            color: 'var(--text-3)',
            marginTop: '8px',
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            margin: '8px 0 0 0',
          }}
        >
          Génère un lien unique et partageable
        </p>
      </div>
    </div>
  )
}
