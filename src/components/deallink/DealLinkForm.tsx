'use client'

import { useState } from 'react'
import { DealLinkHistoryPreview } from './DealLinkHistoryPreview'

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

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-2)',
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: '5px',
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

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        {/* Prospect Info Section */}
        <div>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '12px',
            }}
          >
            👤 Prospect
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Prospect Name *</label>
              <input
                type="text"
                placeholder="e.g., John Doe"
                value={form.prospectName}
                onChange={(e) =>
                  setForm({ ...form, prospectName: e.target.value })
                }
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Company Name</label>
              <input
                type="text"
                placeholder="e.g., Acme Corp"
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
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '12px',
            }}
          >
            💼 Deal
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Deal Type *</label>
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
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Deal Context *</label>
              <textarea
                placeholder="Describe the deal opportunity..."
                value={form.dealContext}
                onChange={(e) =>
                  setForm({ ...form, dealContext: e.target.value })
                }
                style={{
                  ...inputStyle,
                  minHeight: '80px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Deal Value (€)</label>
                <input
                  type="number"
                  placeholder="e.g., 50000"
                  value={form.dealValue}
                  onChange={(e) =>
                    setForm({ ...form, dealValue: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Tone</label>
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
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '12px',
            }}
          >
            🔗 URLs & Contact
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Your Website</label>
              <input
                type="url"
                placeholder="https://yoursite.com"
                value={form.myWebsite}
                onChange={(e) =>
                  setForm({ ...form, myWebsite: e.target.value })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Prospect Website</label>
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
              <label style={labelStyle}>Your Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={form.sellerName}
                onChange={(e) =>
                  setForm({ ...form, sellerName: e.target.value })
                }
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: '12px',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: 'var(--r-sm)',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

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
            fontWeight: 600,
            cursor:
              isLoading || !form.prospectName.trim() || !form.dealContext.trim()
                ? 'not-allowed'
                : 'pointer',
            transition: '.2s',
          }}
        >
          {isLoading ? '✨ Generating...' : '✨ Generate Landing Page'}
        </button>
      </form>

      {/* History Preview */}
      <DealLinkHistoryPreview
        deallinks={deallinks}
        onSelectDeallink={onSelectDeallink}
        onShowAll={onShowAllDeallinks}
        isLoading={historicalLoading}
      />
    </div>
  )
}
