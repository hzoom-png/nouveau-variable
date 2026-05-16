'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '../_components/AdminHeader'

const C = {
  card:   '#1A2820',
  border: 'rgba(255,255,255,0.07)',
  green:  '#2F5446',
  greenL: '#4A8C6F',
  text:   '#F7FAF8',
  text2:  '#4B6358',
  input:  '#111D18',
  error:  '#E05252',
}

type Settings = {
  max_members?: number
  admin_email?: string
  welcome_message?: string
  applications_open?: boolean
}

export default function ParametresPage() {
  const [settings, setSettings] = useState<Settings>({
    max_members: 1000,
    admin_email: '',
    welcome_message: '',
    applications_open: true,
  })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [success, setSuccess]   = useState('')
  const [error, setError]       = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings && Object.keys(d.settings).length > 0) {
          setSettings(s => ({ ...s, ...d.settings }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    const r = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    const d = await r.json()
    if (r.ok) {
      setSuccess('Paramètres sauvegardés.')
    } else {
      setError(d.error ?? 'Erreur lors de la sauvegarde.')
    }
    setSaving(false)
  }

  const inputSt: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: C.input, border: `1px solid rgba(255,255,255,0.1)`,
    borderRadius: 8, padding: '11px 14px', fontSize: 13,
    color: C.text, fontFamily: 'Inter, sans-serif', outline: 'none',
  }
  const labelSt: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: C.text2,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    display: 'block', marginBottom: 6,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0F1C17' }}>
      <AdminHeader title="Paramètres" />
      <div style={{ padding: '28px 40px', maxWidth: 640 }}>
        {loading ? (
          <p style={{ color: C.text2 }}>Chargement…</p>
        ) : (
          <form onSubmit={save}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

              <div>
                <label style={labelSt}>Nombre de places maximum</label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={settings.max_members ?? 1000}
                  onChange={e => setSettings(s => ({ ...s, max_members: parseInt(e.target.value) || 1000 }))}
                  style={inputSt}
                />
              </div>

              <div>
                <label style={labelSt}>Email admin (notifications)</label>
                <input
                  type="email"
                  value={settings.admin_email ?? ''}
                  onChange={e => setSettings(s => ({ ...s, admin_email: e.target.value }))}
                  placeholder="admin@nouveauvariable.fr"
                  style={inputSt}
                />
              </div>

              <div>
                <label style={labelSt}>Message d&apos;accueil (affiché aux nouveaux membres)</label>
                <textarea
                  value={settings.welcome_message ?? ''}
                  onChange={e => setSettings(s => ({ ...s, welcome_message: e.target.value }))}
                  placeholder="Bienvenue dans le club Nouveau Variable…"
                  rows={4}
                  style={{ ...inputSt, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div
                    onClick={() => setSettings(s => ({ ...s, applications_open: !s.applications_open }))}
                    style={{
                      width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                      background: settings.applications_open ? C.green : 'rgba(255,255,255,0.1)',
                      position: 'relative', transition: 'background .2s', cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 3,
                      left: settings.applications_open ? '21px' : '3px',
                      transition: 'left .2s',
                    }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>
                      Candidatures {settings.applications_open ? 'ouvertes' : 'fermées'}
                    </p>
                    <p style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>
                      {settings.applications_open
                        ? 'Le formulaire de candidature est actif sur la landing page.'
                        : 'La landing affiche "Candidatures temporairement fermées".'}
                    </p>
                  </div>
                </label>
              </div>

              {error && (
                <div style={{ background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.error }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ background: 'rgba(47,84,70,0.2)', border: `1px solid ${C.green}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.greenL }}>
                  ✓ {success}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '12px 28px', borderRadius: 8, background: C.green,
                    border: 'none', color: C.text, fontSize: 14, fontWeight: 700,
                    fontFamily: 'Inter, sans-serif', cursor: saving ? 'wait' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Sauvegarde…' : 'Sauvegarder les paramètres'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
