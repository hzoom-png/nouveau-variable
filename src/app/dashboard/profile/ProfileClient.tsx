'use client'

import { useState } from 'react'
import { Profile } from '@/lib/types'
import { SECTORS, CITIES_FR, MEETING_TYPES, MAX_CITIES, MAX_SECTORS } from '@/lib/constants'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

interface Props { profile: Profile }

export default function ProfileClient({ profile }: Props) {
  const [form, setForm] = useState({
    first_name: profile.first_name ?? '',
    last_name: profile.last_name ?? '',
    phone: profile.phone ?? '',
    role_title: profile.role_title ?? '',
    bio: profile.bio ?? '',
    cities: profile.cities ?? [],
    sectors: profile.sectors ?? [],
    commercial_type: profile.commercial_type ?? '',
    meeting_types: profile.meeting_types ?? [],
    available_days: profile.available_days ?? [],
    notif_meeting_request: profile.notif_meeting_request ?? true,
    notif_new_referral: profile.notif_new_referral ?? true,
    notif_commission: profile.notif_commission ?? true,
    notif_newsletter: profile.notif_newsletter ?? true,
  })
  const [cityInput, setCityInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  function toggleArray(key: 'meeting_types' | 'available_days' | 'sectors', val: string, max?: number) {
    setForm(f => {
      const arr = f[key] as string[]
      if (arr.includes(val)) return { ...f, [key]: arr.filter(x => x !== val) }
      if (max && arr.length >= max) return f
      return { ...f, [key]: [...arr, val] }
    })
  }

  function addCity(city: string) {
    if (!city || form.cities.includes(city) || form.cities.length >= MAX_CITIES) return
    setForm(f => ({ ...f, cities: [...f.cities, city] }))
    setCityInput('')
  }

  function removeCity(city: string) {
    setForm(f => ({ ...f, cities: f.cities.filter(c => c !== city) }))
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) setSaveMsg('Profil sauvegardé !')
    else {
      const data = await res.json()
      setSaveMsg(data.error || 'Erreur lors de la sauvegarde')
    }
  }

  const initials = `${form.first_name[0] ?? ''}${form.last_name[0] ?? ''}`.toUpperCase()
  const citySuggestions = CITIES_FR.filter(c => c.toLowerCase().includes(cityInput.toLowerCase()) && !form.cities.includes(c))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '28px', maxWidth: '1000px' }}>
      {/* Editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header card */}
        <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
          <div style={{ height: '80px', background: '#43695A' }} />
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '14px',
              background: '#2C4A3E', border: '4px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 800, fontSize: '22px',
              marginTop: '-30px', marginBottom: '14px',
            }}>{initials || '?'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Prénom', key: 'first_name', type: 'text' },
                { label: 'Nom', key: 'last_name', type: 'text' },
                { label: 'Email', key: 'email', type: 'email', disabled: true, value: profile.email },
                { label: 'Téléphone', key: 'phone', type: 'tel' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={f.disabled ? (f.value ?? '') : form[f.key as keyof typeof form] as string}
                    onChange={e => !f.disabled && setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                    disabled={f.disabled}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--border)', background: f.disabled ? 'var(--off)' : 'white', fontSize: '14px', fontFamily: 'inherit', color: 'var(--text)' }}
                  />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>Titre / Rôle</label>
                <input
                  type="text"
                  value={form.role_title}
                  onChange={e => setForm(f => ({ ...f, role_title: e.target.value }))}
                  placeholder="Ex: Directeur Commercial BtoB"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '14px', fontFamily: 'inherit', color: 'var(--text)' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                  Bio <span style={{ color: form.bio.length > 160 ? 'red' : 'var(--light)' }}>({form.bio.length}/160)</span>
                </label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value.slice(0, 160) }))}
                  rows={3}
                  placeholder="Présente-toi en quelques mots..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '14px', fontFamily: 'inherit', resize: 'none', color: 'var(--text)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cities */}
        <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
          <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '12px' }}>
            Villes <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '13px' }}>({form.cities.length}/{MAX_CITIES})</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {form.cities.map(c => (
              <span key={c} style={{ background: 'var(--green-pale)', color: '#43695A', borderRadius: '8px', padding: '4px 10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {c}
                <button onClick={() => removeCity(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#43695A', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCity(cityInput) } }}
              placeholder="Ajouter une ville..."
              disabled={form.cities.length >= MAX_CITIES}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '14px', fontFamily: 'inherit' }}
            />
            {cityInput.length >= 2 && citySuggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1.5px solid var(--border)', borderRadius: '8px', zIndex: 10, maxHeight: '180px', overflowY: 'auto' }}>
                {citySuggestions.slice(0, 8).map(c => (
                  <div key={c} onClick={() => addCity(c)} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid var(--border)' }}>
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sectors */}
        <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
          <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '12px' }}>
            Secteurs <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '13px' }}>({form.sectors.length}/{MAX_SECTORS})</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {SECTORS.map(s => {
              const active = form.sectors.includes(s)
              return (
                <button
                  key={s}
                  onClick={() => toggleArray('sectors', s, MAX_SECTORS)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: active ? 600 : 400,
                    border: `1.5px solid ${active ? '#43695A' : 'var(--border)'}`,
                    background: active ? 'var(--green-pale)' : 'white',
                    color: active ? '#43695A' : 'var(--muted)',
                    cursor: 'pointer',
                  }}
                >{s}</button>
              )
            })}
          </div>
        </div>

        {/* Meeting types & available days */}
        <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
          <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '12px' }}>
            Types de rencontres
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {Object.entries(MEETING_TYPES).map(([key, mt]) => {
              const active = form.meeting_types.includes(key)
              return (
                <button
                  key={key}
                  onClick={() => toggleArray('meeting_types', key)}
                  style={{
                    padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: active ? 600 : 400,
                    border: `1.5px solid ${active ? '#43695A' : 'var(--border)'}`,
                    background: active ? 'var(--green-pale)' : 'white',
                    color: active ? '#43695A' : 'var(--muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >{mt.emoji} {mt.label}</button>
              )
            })}
          </div>
          <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '12px' }}>
            Jours disponibles
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {DAYS.map(day => {
              const active = form.available_days.includes(day)
              return (
                <button
                  key={day}
                  onClick={() => toggleArray('available_days', day)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: active ? 600 : 400,
                    border: `1.5px solid ${active ? '#43695A' : 'var(--border)'}`,
                    background: active ? 'var(--green-pale)' : 'white',
                    color: active ? '#43695A' : 'var(--muted)',
                    cursor: 'pointer',
                  }}
                >{day}</button>
              )
            })}
          </div>
        </div>

        {/* Notifications */}
        <div style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
          <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '14px' }}>
            Notifications
          </div>
          {[
            { key: 'notif_meeting_request', label: 'Nouvelle demande de rencontre' },
            { key: 'notif_new_referral', label: 'Nouveau filleul' },
            { key: 'notif_commission', label: 'Commission reçue' },
            { key: 'notif_newsletter', label: 'Newsletter NV' },
          ].map(n => (
            <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text)' }}>{n.label}</span>
              <button
                onClick={() => setForm(f => ({ ...f, [n.key]: !f[n.key as keyof typeof f] }))}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: form[n.key as keyof typeof form] ? '#43695A' : 'var(--border)',
                  border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                  position: 'absolute', top: '3px',
                  left: form[n.key as keyof typeof form] ? '23px' : '3px',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          ))}
        </div>

        {/* Save button */}
        {saveMsg && (
          <div style={{ background: saveMsg.includes('Erreur') ? '#FEE2E2' : 'var(--green-pale)', color: saveMsg.includes('Erreur') ? '#991B1B' : '#43695A', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 600 }}>
            {saveMsg}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '14px', borderRadius: '12px', background: saving ? 'var(--green-light)' : '#43695A', color: 'white', fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '16px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder le profil'}
        </button>
      </div>

      {/* Preview */}
      <div style={{ position: 'sticky', top: '84px', height: 'fit-content' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: '10px' }}>APERÇU PUBLIC</div>
        <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
          <div style={{ height: '60px', background: '#43695A' }} />
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px', background: '#2C4A3E', border: '3px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 800, fontSize: '18px',
              marginTop: '-24px', marginBottom: '10px',
            }}>{initials || '?'}</div>
            <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
              {form.first_name || 'Prénom'} {form.last_name || 'Nom'}
            </div>
            {form.role_title && <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>{form.role_title}</div>}
            {form.bio && <div style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '10px', lineHeight: 1.5 }}>{form.bio}</div>}
            {form.cities.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                {form.cities.map(c => (
                  <span key={c} style={{ background: 'var(--green-pale)', color: '#43695A', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>{c}</span>
                ))}
              </div>
            )}
            {form.sectors.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {form.sectors.map(s => (
                  <span key={s} style={{ background: 'var(--border)', color: 'var(--muted)', borderRadius: '6px', padding: '2px 8px', fontSize: '11px' }}>{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
