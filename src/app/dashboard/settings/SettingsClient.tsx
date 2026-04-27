'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Toast } from '@/components/ui/Toast'
import type { CommercialContext } from '@/lib/types'

const TONES = ['Professionnel', 'Direct & Cash', 'Storytelling', 'Éducatif']

interface Props { initialCtx: CommercialContext }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 13px',
  border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)',
  fontSize: '13px', color: 'var(--text)', background: 'var(--white)',
  outline: 'none', fontFamily: 'inherit',
}
const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: 'var(--text-2)',
  letterSpacing: '.06em', textTransform: 'uppercase',
  display: 'block', marginBottom: '5px',
}

export default function SettingsClient({ initialCtx }: Props) {
  const [form, setForm] = useState<CommercialContext>({
    product:             initialCtx.product ?? '',
    value_prop:          initialCtx.value_prop ?? '',
    icp:                 initialCtx.icp ?? '',
    sector:              initialCtx.sector ?? '',
    location:            initialCtx.location ?? '',
    typical_objections:  initialCtx.typical_objections ?? '',
    tone:                initialCtx.tone ?? 'Professionnel',
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [toast,  setToast]  = useState<string | null>(null)

  const isComplete = !!(form.product && form.icp && form.value_prop)

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error } = await supabase
      .from('profiles')
      .update({ commercial_context: form })
      .eq('id', user.id)

    setSaving(false)
    if (error) {
      setToast('Erreur lors de la sauvegarde')
    } else {
      setSaved(true)
      setToast('Contexte sauvegardé — tes outils s\'adaptent maintenant')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="tool-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <div className="tool-badge" style={{ background: 'var(--green-3)', color: 'var(--green)', border: '1px solid var(--green-4)' }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="7" cy="7" r="2.5"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.9 2.9l1.06 1.06M10.04 10.04l1.06 1.06M2.9 11.1l1.06-1.06M10.04 3.96l1.06-1.06"/>
            </svg>
            Paramètres
          </div>
          {isComplete && saved ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'var(--green-3)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-full)', padding: '3px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--green)' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
              Contexte actif
            </div>
          ) : !isComplete ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'var(--amber-2)', border: '1px solid #F5C068', borderRadius: 'var(--r-full)', padding: '3px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--amber)' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--amber)', display: 'inline-block' }} />
              Contexte incomplet
            </div>
          ) : null}
        </div>
        <h1 className="tool-h1">Ton contexte commercial</h1>
        <p className="tool-desc">
          Ces informations alimentent tous tes outils. Plus tu es précis, plus les analyses sont pertinentes.
        </p>
      </div>

      <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Section 1 — Ce que tu vends */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ fontFamily: 'var(--font-jost)', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Ce que tu vends</div>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Produit / service *</label>
              <input
                style={inputStyle}
                value={form.product ?? ''}
                onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
                placeholder="Ex : logiciel de gestion pour artisans"
              />
            </div>
            <div>
              <label style={labelStyle}>Proposition de valeur *</label>
              <textarea
                rows={2}
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.55 }}
                value={form.value_prop ?? ''}
                onChange={e => setForm(f => ({ ...f, value_prop: e.target.value }))}
                placeholder="En une phrase : ce que ton client gagne qu'il n'avait pas avant"
              />
            </div>
            <div>
              <label style={labelStyle}>Client idéal (ICP) *</label>
              <input
                style={inputStyle}
                value={form.icp ?? ''}
                onChange={e => setForm(f => ({ ...f, icp: e.target.value }))}
                placeholder="Ex : TPE du bâtiment, 5-20 salariés, Lyon"
              />
            </div>
          </div>
        </div>

        {/* Section 2 — Ton terrain */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ fontFamily: 'var(--font-jost)', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Ton terrain</div>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Secteur cible</label>
                <input
                  style={inputStyle}
                  value={form.sector ?? ''}
                  onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                  placeholder="Ex : BTP, SaaS RH, Immobilier"
                />
              </div>
              <div>
                <label style={labelStyle}>Zone géographique</label>
                <input
                  style={inputStyle}
                  value={form.location ?? ''}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Ex : Rhône-Alpes, France entière"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Objections récurrentes</label>
              <textarea
                rows={3}
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.55 }}
                value={form.typical_objections ?? ''}
                onChange={e => setForm(f => ({ ...f, typical_objections: e.target.value }))}
                placeholder="Les 2-3 objections que tu entends à chaque appel"
              />
            </div>
            <div>
              <label style={labelStyle}>Ton de communication</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {TONES.map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, tone: t }))}
                    style={{
                      padding: '7px 14px', borderRadius: 'var(--r-full)', fontSize: '12px',
                      fontWeight: form.tone === t ? 600 : 500, cursor: 'pointer',
                      border: `1.5px solid ${form.tone === t ? 'var(--green)' : 'var(--border)'}`,
                      color: form.tone === t ? 'var(--green)' : 'var(--text-2)',
                      background: form.tone === t ? 'var(--green-3)' : 'var(--white)',
                      transition: '.14s',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving}
          className="tbtn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Sauvegarde...' : '✓ Sauvegarder mon contexte'}
        </button>
      </div>

      {toast && <Toast message={toast} variant="success" onClose={() => setToast(null)} />}
    </div>
  )
}
