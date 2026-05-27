'use client'

import { useState } from 'react'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 13px',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--r-sm)',
  fontSize: '13px',
  color: 'var(--text)',
  background: 'var(--white)',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 400,
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 500,
  color: 'var(--text-2)',
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: '5px',
  fontFamily: 'Inter, sans-serif',
}

export function DealLinkForm({
  onSubmit,
  isLoading,
  error,
  deallinks,
  historicalLoading,
  onSelectDeallink,
  onShowAllDeallinks,
}: {
  onSubmit: (formData: any) => void
  isLoading: boolean
  error: string
  deallinks: any[]
  historicalLoading: boolean
  onSelectDeallink: (deallink: any) => void
  onShowAllDeallinks: () => void
}) {
  const [form, setForm] = useState({
    prospectName: '',
    prospectCompany: '',
    dealType: 'closing',
    dealContext: '',
    dealValue: '',
    tone: 'Professionnel',
    myWebsite: '',
    clientWebsite: '',
    sellerName: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.prospectName.trim() || !form.dealContext.trim()) {
      return
    }
    onSubmit({
      prospect_name: form.prospectName,
      company_name: form.prospectCompany,
      deal_type: form.dealType,
      deal_context: form.dealContext,
      deal_value: form.dealValue ? parseFloat(form.dealValue) : null,
      user_name: form.sellerName,
      user_title: '',
      tone: form.tone,
      myWebsite: form.myWebsite,
      clientWebsite: form.clientWebsite,
    })
  }

  const recentDeallinks = deallinks.slice(0, 3)

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        {/* Prospect Info Section */}
        <div>
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
            Prospect
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Nom du Prospect *</label>
              <input
                type="text"
                placeholder="ex: Jean Dupont"
                value={form.prospectName}
                onChange={(e) =>
                  setForm({ ...form, prospectName: e.target.value })
                }
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Entreprise</label>
              <input
                type="text"
                placeholder="ex: TechFlow SAS"
                value={form.prospectCompany}
                onChange={(e) =>
                  setForm({ ...form, prospectCompany: e.target.value })
                }
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Deal Info Section */}
        <div>
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
            Deal
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Type de Deal *</label>
              <select
                value={form.dealType}
                onChange={(e) =>
                  setForm({ ...form, dealType: e.target.value })
                }
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                }}
              >
                <option value="closing">Closing</option>
                <option value="upsell">Upsell</option>
                <option value="partnership">Partnership</option>
                <option value="referral">Referral</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Contexte du Deal *</label>
              <textarea
                placeholder="Décris l'opportunité du deal..."
                value={form.dealContext}
                onChange={(e) =>
                  setForm({ ...form, dealContext: e.target.value })
                }
                style={{
                  ...inputStyle,
                  minHeight: '80px',
                  fontFamily: 'Inter, sans-serif',
                  resize: 'vertical',
                }}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Montant (€)</label>
                <input
                  type="number"
                  placeholder="ex: 50000"
                  value={form.dealValue}
                  onChange={(e) =>
                    setForm({ ...form, dealValue: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Ton</label>
                <select
                  value={form.tone}
                  onChange={(e) => setForm({ ...form, tone: e.target.value })}
                  style={{
                    ...inputStyle,
                    cursor: 'pointer',
                  }}
                >
                  <option>Professionnel</option>
                  <option>Amical</option>
                  <option>Direct</option>
                  <option>Inspirant</option>
                  <option>Storytelling</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Info Section */}
        <div>
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
            URLs et Contact
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Votre Site Web</label>
              <input
                type="url"
                placeholder="https://tondomain.com"
                value={form.myWebsite}
                onChange={(e) =>
                  setForm({ ...form, myWebsite: e.target.value })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Site Web du Prospect</label>
              <input
                type="url"
                placeholder="https://prospect-site.com"
                value={form.clientWebsite}
                onChange={(e) =>
                  setForm({ ...form, clientWebsite: e.target.value })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Votre Nom</label>
              <input
                type="text"
                placeholder="Ton nom"
                value={form.sellerName}
                onChange={(e) =>
                  setForm({ ...form, sellerName: e.target.value })
                }
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !form.prospectName.trim() || !form.dealContext.trim()}
          style={{
            padding: '12px 16px',
            background:
              isLoading || !form.prospectName.trim() || !form.dealContext.trim()
                ? 'var(--surface)'
                : 'var(--green)',
            color:
              isLoading || !form.prospectName.trim() || !form.dealContext.trim()
                ? 'var(--text-2)'
                : '#fff',
            border: 'none',
            borderRadius: 'var(--r-sm)',
            fontSize: '13px',
            fontWeight: 500,
            cursor:
              isLoading || !form.prospectName.trim() || !form.dealContext.trim()
                ? 'not-allowed'
                : 'pointer',
            transition: '.2s',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {isLoading ? 'Génération en cours...' : 'Générer la Landing Page'}
        </button>
      </form>

      {/* History Preview */}
      {!historicalLoading && deallinks.length > 0 && (
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
                fontWeight: 500,
                color: 'var(--text-2)',
                textTransform: 'uppercase',
                margin: 0,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Historique
            </h4>
            {deallinks.length > 3 && (
              <button
                onClick={onShowAllDeallinks}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-2)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: 0,
                  textDecoration: 'underline',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                }}
              >
                Voir tous les deallinks
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
                  fontFamily: 'Inter, sans-serif',
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
                    fontWeight: 500,
                    color: 'var(--text)',
                    margin: '0 0 4px 0',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {dl.prospect_name}
                </p>
                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-2)',
                    margin: 0,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {dl.company_name}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
