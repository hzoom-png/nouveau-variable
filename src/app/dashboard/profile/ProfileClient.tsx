'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Profile, AvailabilitySlot, ServiceItem, LinkItem, TrackRecord } from '@/lib/types'
import { SECTORS, CITIES_FR, MEETING_TYPES, MAX_CITIES, MAX_SECTORS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const TIME_SLOTS = ['Matin', 'Midi', 'Soir']
const ROLE_TYPES = [
  { value: 'salarie',      label: 'Salarié'      },
  { value: 'freelance',    label: 'Freelance'     },
  { value: 'entrepreneur', label: 'Entrepreneur'  },
  { value: 'dirigeant',    label: 'Dirigeant'     },
]

type DeleteStep = 'warning' | 'confirm'

interface Props { profile: Profile; slots: AvailabilitySlot[] }

function slotKey(day: number, time: string) { return `${day}_${time}` }

export default function ProfileClient({ profile, slots: initialSlots }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, ok })
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  // ── Avatar ──
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [avatarLoading, setAvatarLoading] = useState(false)

  // ── Availability slots ──
  const [slotSet, setSlotSet] = useState<Set<string>>(
    new Set(initialSlots.map(s => slotKey(s.day_of_week, s.time_label)))
  )
  function toggleSlot(day: number, time: string) {
    const key = slotKey(day, time)
    setSlotSet(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ── Main form ──
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
    display_name: profile.display_name ?? '',
    tagline: profile.tagline ?? '',
    role_type: profile.role_type ?? '',
    services: (profile.services ?? []) as ServiceItem[],
    links: (profile.links ?? []) as LinkItem[],
    track_record: (profile.track_record ?? []) as TrackRecord[],
  })
  const [cityInput, setCityInput] = useState('')
  const [saving, setSaving] = useState(false)

  // ── Delete modal ──
  const [deleteStep, setDeleteStep] = useState<DeleteStep | null>(null)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const initials = `${form.first_name[0] ?? ''}${form.last_name[0] ?? ''}`.toUpperCase()
  const citySuggestions = CITIES_FR.filter(
    c => c.toLowerCase().includes(cityInput.toLowerCase()) && !form.cities.includes(c)
  )

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd })
    setAvatarLoading(false)
    if (res.ok) {
      const { url } = await res.json()
      setAvatarUrl(url)
    }
  }

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

  // ── Services ──
  function addService() {
    if (form.services.length >= 5) return
    setForm(f => ({ ...f, services: [...f.services, { title: '', description: '' }] }))
  }
  function updateService(i: number, field: keyof ServiceItem, val: string) {
    setForm(f => {
      const arr = [...f.services]
      arr[i] = { ...arr[i], [field]: val }
      return { ...f, services: arr }
    })
  }
  function removeService(i: number) {
    setForm(f => ({ ...f, services: f.services.filter((_, idx) => idx !== i) }))
  }

  // ── Track record ──
  function addTrack() {
    if (form.track_record.length >= 5) return
    setForm(f => ({ ...f, track_record: [...f.track_record, { title: '', value: '', year: '' }] }))
  }
  function updateTrack(i: number, field: keyof TrackRecord, val: string) {
    setForm(f => {
      const arr = [...f.track_record]
      arr[i] = { ...arr[i], [field]: val }
      return { ...f, track_record: arr }
    })
  }
  function removeTrack(i: number) {
    setForm(f => ({ ...f, track_record: f.track_record.filter((_, idx) => idx !== i) }))
  }

  // ── Links ──
  function addLink() {
    if (form.links.length >= 5) return
    setForm(f => ({ ...f, links: [...f.links, { label: '', url: '' }] }))
  }
  function updateLink(i: number, field: keyof LinkItem, val: string) {
    setForm(f => {
      const arr = [...f.links]
      arr[i] = { ...arr[i], [field]: val }
      return { ...f, links: arr }
    })
  }
  function removeLink(i: number) {
    setForm(f => ({ ...f, links: f.links.filter((_, idx) => idx !== i) }))
  }

  async function handleSave() {
    setSaving(true)
    const availability_slots = Array.from(slotSet).map(key => {
      const [day, time] = key.split('_')
      return { day_of_week: parseInt(day), time_label: time }
    })
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, availability_slots }),
    })
    setSaving(false)
    if (res.ok) {
      showToast('Profil sauvegardé ✓')
      router.refresh()
    } else {
      const data = await res.json()
      showToast(data.error || 'Erreur lors de la sauvegarde', false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError('')
    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      window.location.href = '/?deleted=1'
    } else {
      const d = await res.json()
      setDeleteError(d.error || 'Erreur lors de la suppression')
    }
  }

  const card: React.CSSProperties = {
    background: 'var(--white)', borderRadius: 'var(--r-lg)',
    border: '1px solid var(--border)', padding: '20px 22px',
  }
  const sectionTitle: React.CSSProperties = {
    fontFamily: 'Jost, sans-serif', fontSize: '14px', fontWeight: 700,
    color: 'var(--text)', marginBottom: '14px',
  }
  const label: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-2)',
    letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '5px',
  }
  const input: React.CSSProperties = {
    width: '100%', padding: '9px 13px', border: '1.5px solid var(--border)',
    borderRadius: 'var(--r-sm)', fontSize: '14px', fontFamily: 'inherit',
    color: 'var(--text)', background: 'var(--white)', outline: 'none',
  }
  const pill = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 'var(--r-full)', fontSize: '13px',
    fontWeight: active ? 600 : 500, cursor: 'pointer', userSelect: 'none',
    border: `1.5px solid ${active ? 'var(--green)' : 'var(--border)'}`,
    background: active ? 'var(--green-3)' : 'var(--white)',
    color: active ? 'var(--green)' : 'var(--text-2)',
    transition: '.14s',
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', maxWidth: '960px' }}>
      {/* ── LEFT: editor ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* 1. Identité */}
        <div style={{ background: 'var(--white)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ height: '72px', background: 'var(--green)', position: 'relative' }}>
            <div className="avatar-wrap" style={{ position: 'absolute', bottom: '-22px', left: '22px' }} onClick={() => fileRef.current?.click()}>
              <div style={{
                width: '52px', height: '52px', borderRadius: 'var(--r-sm)',
                border: '3px solid var(--white)', background: 'var(--green-2)',
                display: 'grid', placeItems: 'center',
                fontFamily: 'Jost, sans-serif', fontSize: '18px', fontWeight: 800, color: '#fff',
                overflow: 'hidden',
              }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : avatarLoading
                    ? <span style={{ fontSize: '12px', opacity: .6 }}>…</span>
                    : initials || '?'
                }
              </div>
              <div className="avatar-overlay">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10.5 2.5L13.5 5.5M2 14l2-6 9-9-3-3-9 9-2 6z"/></svg>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>
          <div style={{ padding: '32px 22px 22px' }}>
            {profile.slug && (
              <Link
                href={`/p/${profile.slug}`}
                target="_blank"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--green)', background: 'var(--green-3)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-full)', padding: '4px 11px', marginBottom: '16px', textDecoration: 'none' }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 1H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V6M6 1h3v3M5 5l4-4"/></svg>
                Voir mon profil public
              </Link>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              {([['Prénom', 'first_name'], ['Nom', 'last_name']] as const).map(([l, k]) => (
                <div key={k}>
                  <label style={label}>{l}</label>
                  <input style={input} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={label}>Email</label>
                <input style={{ ...input, background: 'var(--surface)', color: 'var(--text-3)' }} value={profile.email} disabled />
              </div>
              <div>
                <label style={label}>Téléphone</label>
                <input style={input} type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={label}>Tagline <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-3)' }}>({form.tagline.length}/100)</span></label>
              <input style={input} placeholder="Ex: Commercial BtoB · Expert SaaS · Lyon" value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value.slice(0, 100) }))} />
            </div>
            <div>
              <label style={label}>Nom affiché <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-3)' }}>(optionnel — remplace prénom + nom)</span></label>
              <input style={input} placeholder="Ex: Gaultier H." value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* 2. Présentation */}
        <div style={card}>
          <div style={sectionTitle}>Présentation</div>
          <div style={{ marginBottom: '14px' }}>
            <label style={label}>Titre / Rôle</label>
            <input style={input} placeholder="Ex: Directeur Commercial BtoB" value={form.role_title} onChange={e => setForm(f => ({ ...f, role_title: e.target.value }))} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={label}>Type de profil</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {ROLE_TYPES.map(rt => (
                <button key={rt.value} onClick={() => setForm(f => ({ ...f, role_type: f.role_type === rt.value ? '' : rt.value }))} style={pill(form.role_type === rt.value)}>
                  {rt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={label}>Bio <span style={{ textTransform: 'none', fontWeight: 400, color: form.bio.length > 360 ? 'var(--amber)' : 'var(--text-3)' }}>({form.bio.length}/400)</span></label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value.slice(0, 400) }))}
              placeholder="Présente-toi en quelques mots. Quel est ton parcours ? Ta valeur ajoutée ?"
              style={{ ...input, resize: 'none', lineHeight: 1.6 }}
            />
          </div>
        </div>

        {/* 3. Zones & Secteurs */}
        <div style={card}>
          <div style={sectionTitle}>Zones & secteurs</div>
          <div style={{ marginBottom: '14px' }}>
            <label style={label}>Villes ({form.cities.length}/{MAX_CITIES})</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {form.cities.map(c => (
                <span key={c} style={{ background: 'var(--green-3)', color: 'var(--green)', borderRadius: 'var(--r-sm)', padding: '4px 10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {c}
                  <button onClick={() => removeCity(c)} style={{ color: 'var(--green)', fontSize: '14px', lineHeight: 1, padding: 0, opacity: .7 }}>×</button>
                </span>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                style={input}
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCity(cityInput) } }}
                placeholder="Ajouter une ville…"
                disabled={form.cities.length >= MAX_CITIES}
              />
              {cityInput.length >= 2 && citySuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', zIndex: 10, maxHeight: '180px', overflowY: 'auto' }}>
                  {citySuggestions.slice(0, 8).map(c => (
                    <div key={c} onClick={() => addCity(c)} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid var(--border)' }}>{c}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label style={label}>Secteurs ({form.sectors.length}/{MAX_SECTORS})</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {SECTORS.map(s => (
                <button key={s} onClick={() => toggleArray('sectors', s, MAX_SECTORS)} style={pill(form.sectors.includes(s))}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Services */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={sectionTitle}>Services proposés</span>
            {form.services.length < 5 && (
              <button onClick={addService} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', background: 'var(--green-3)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-sm)', padding: '4px 10px' }}>+ Ajouter</button>
            )}
          </div>
          {form.services.length === 0 && (
            <div style={{ fontSize: '13px', color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>Aucun service ajouté · max 5</div>
          )}
          {form.services.map((svc, i) => (
            <div key={i} style={{ background: 'var(--surface)', borderRadius: 'var(--r-sm)', padding: '12px 14px', marginBottom: '10px', position: 'relative' }}>
              <button onClick={() => removeService(i)} style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '13px', color: 'var(--text-3)', opacity: .6 }}>×</button>
              <div style={{ marginBottom: '8px' }}>
                <label style={label}>Intitulé</label>
                <input style={input} placeholder="Ex: Formation vente BtoB" value={svc.title} onChange={e => updateService(i, 'title', e.target.value)} />
              </div>
              <div>
                <label style={label}>Description courte</label>
                <input style={input} placeholder="Ex: Accompagnement équipes commerciales en PME" value={svc.description} onChange={e => updateService(i, 'description', e.target.value)} />
              </div>
            </div>
          ))}
        </div>

        {/* 5. Track record */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={sectionTitle}>Track record</span>
            {form.track_record.length < 5 && (
              <button onClick={addTrack} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', background: 'var(--green-3)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-sm)', padding: '4px 10px' }}>+ Ajouter</button>
            )}
          </div>
          {form.track_record.length === 0 && (
            <div style={{ fontSize: '13px', color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>Aucun résultat ajouté · max 5</div>
          )}
          {form.track_record.map((tr, i) => (
            <div key={i} style={{ background: 'var(--surface)', borderRadius: 'var(--r-sm)', padding: '12px 14px', marginBottom: '10px', position: 'relative' }}>
              <button onClick={() => removeTrack(i)} style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '13px', color: 'var(--text-3)', opacity: .6 }}>×</button>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={label}>Label</label>
                  <input style={input} placeholder="Ex: Pipeline généré" value={tr.title} onChange={e => updateTrack(i, 'title', e.target.value)} />
                </div>
                <div>
                  <label style={label}>Valeur</label>
                  <input style={input} placeholder="Ex: 2,4M€" value={tr.value} onChange={e => updateTrack(i, 'value', e.target.value)} />
                </div>
                <div>
                  <label style={label}>Année</label>
                  <input style={input} placeholder="2024" value={tr.year ?? ''} onChange={e => updateTrack(i, 'year', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 6. Liens */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={sectionTitle}>Liens professionnels</span>
            {form.links.length < 5 && (
              <button onClick={addLink} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', background: 'var(--green-3)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-sm)', padding: '4px 10px' }}>+ Ajouter</button>
            )}
          </div>
          {form.links.length === 0 && (
            <div style={{ fontSize: '13px', color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>Aucun lien ajouté · LinkedIn, site, etc.</div>
          )}
          {form.links.map((lnk, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input style={input} placeholder="Ex: LinkedIn" value={lnk.label} onChange={e => updateLink(i, 'label', e.target.value)} />
              <input style={input} placeholder="https://…" value={lnk.url} onChange={e => updateLink(i, 'url', e.target.value)} />
              <button onClick={() => removeLink(i)} style={{ fontSize: '18px', color: 'var(--text-3)', padding: '0 4px' }}>×</button>
            </div>
          ))}
        </div>

        {/* 7. Disponibilités */}
        <div style={card}>
          <div style={sectionTitle}>Disponibilités</div>
          <div style={{ overflowX: 'auto', marginBottom: '18px' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '340px' }}>
              <thead>
                <tr>
                  <th style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, textAlign: 'left', padding: '0 0 6px', width: '80px' }}></th>
                  {TIME_SLOTS.map(t => (
                    <th key={t} style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', padding: '0 8px 6px', textAlign: 'center' }}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, di) => (
                  <tr key={day}>
                    <td style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', padding: '4px 0', whiteSpace: 'nowrap' }}>{day}</td>
                    {TIME_SLOTS.map(time => {
                      const active = slotSet.has(slotKey(di, time))
                      return (
                        <td key={time} style={{ textAlign: 'center', padding: '4px 8px' }}>
                          <button
                            onClick={() => toggleSlot(di, time)}
                            style={{
                              width: '28px', height: '28px', borderRadius: 'var(--r-sm)',
                              border: `1.5px solid ${active ? 'var(--green)' : 'var(--border)'}`,
                              background: active ? 'var(--green-3)' : 'var(--surface)',
                              cursor: 'pointer', transition: '.14s',
                            }}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ ...sectionTitle, fontSize: '13px', marginBottom: '10px' }}>Types de rencontres</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.entries(MEETING_TYPES).map(([key, mt]) => (
                <button key={key} onClick={() => toggleArray('meeting_types', key)} style={pill(form.meeting_types.includes(key))}>
                  {mt.emoji} {mt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 8. Lien profil public */}
        {profile.slug && (
          <div style={card}>
            <div style={sectionTitle}>Profil public</div>
            <div style={{ background: 'var(--green-3)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-sm)', padding: '9px 12px', fontSize: '12px', color: 'var(--green)', fontWeight: 600 }}>
              /p/{profile.slug}
            </div>
          </div>
        )}

        {/* 9. Notifications */}
        <div style={card}>
          <div style={sectionTitle}>Notifications</div>
          {([
            { key: 'notif_meeting_request', label: 'Nouvelle demande de rencontre' },
            { key: 'notif_new_referral',    label: 'Nouveau filleul' },
            { key: 'notif_commission',      label: 'Commission reçue' },
            { key: 'notif_newsletter',      label: 'Newsletter NV' },
          ] as const).map(n => (
            <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text)' }}>{n.label}</span>
              <button
                onClick={() => setForm(f => ({ ...f, [n.key]: !f[n.key] }))}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: form[n.key] ? 'var(--green)' : 'var(--border)',
                  border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s',
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: '3px',
                  left: form[n.key] ? '23px' : '3px', transition: 'left .2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                }} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '13px', borderRadius: 'var(--r-sm)',
            background: saving ? 'var(--green-4)' : 'var(--green)',
            color: '#fff', fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '14px',
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer', transition: '.15s',
          }}
        >
          {saving ? 'Sauvegarde…' : 'Sauvegarder le profil'}
        </button>

        {/* 10. Compte */}
        <div style={card}>
          <div style={sectionTitle}>Compte</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', borderRadius: 'var(--r-sm)', background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-2)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}>
              <svg width="13" height="13" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 13H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 10l3-3-3-3M13 7.5H6"/></svg>
              Se déconnecter
            </button>
            <button onClick={() => setDeleteStep('warning')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', borderRadius: 'var(--r-sm)', background: 'var(--white)', border: '1.5px solid #FECACA', color: 'var(--red)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}>
              <svg width="13" height="13" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 4h11M5 4V2h5v2M6 7v5M9 7v5M3 4l.8 9h7.4L12 4"/></svg>
              Supprimer mon compte
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT: sticky preview ── */}
      <div style={{ position: 'sticky', top: '80px', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Aperçu public</div>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ height: '60px', background: 'var(--green)', position: 'relative' }}>
            <div style={{
              position: 'absolute', bottom: '-18px', left: '16px',
              width: '44px', height: '44px', borderRadius: 'var(--r-sm)',
              border: '3px solid var(--white)', background: 'var(--green-2)',
              display: 'grid', placeItems: 'center',
              fontFamily: 'Jost, sans-serif', fontSize: '15px', fontWeight: 800, color: '#fff',
              overflow: 'hidden',
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials || '?'
              }
            </div>
          </div>
          <div style={{ padding: '26px 16px 16px' }}>
            <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '2px' }}>
              {form.display_name || `${form.first_name || 'Prénom'} ${form.last_name || 'Nom'}`}
            </div>
            {form.tagline && <div style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '8px' }}>{form.tagline}</div>}
            {form.bio && <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.5, marginBottom: '10px' }}>{form.bio.slice(0, 120)}{form.bio.length > 120 ? '…' : ''}</div>}
            {form.cities.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                {form.cities.map(c => <span key={c} style={{ background: 'var(--green-3)', color: 'var(--green)', borderRadius: 'var(--r-sm)', padding: '2px 7px', fontSize: '10px', fontWeight: 600 }}>{c}</span>)}
              </div>
            )}
            {form.sectors.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {form.sectors.map(s => <span key={s} style={{ background: 'var(--surface)', color: 'var(--text-2)', borderRadius: 'var(--r-sm)', padding: '2px 7px', fontSize: '10px' }}>{s}</span>)}
              </div>
            )}
          </div>
        </div>

      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, background: toast.ok ? 'var(--green)' : 'var(--red)', color: '#fff', padding: '11px 18px', borderRadius: 'var(--r-md)', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,.18)' }}>
          {toast.msg}
        </div>
      )}

      {/* ── Delete modal ── */}
      {deleteStep && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--white)', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ padding: '24px 24px 0' }}>
              <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: '18px', color: 'var(--red)', marginBottom: '14px' }}>
                {deleteStep === 'warning' ? 'Supprimer mon compte' : 'Confirme la suppression'}
              </div>
              {deleteStep === 'warning' && (
                <>
                  <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.65, marginBottom: '12px' }}>
                    Supprimer ton compte est <strong>irréversible</strong>. Toutes tes données seront effacées :
                  </p>
                  <ul style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.9, paddingLeft: '18px', marginBottom: '14px' }}>
                    <li>Historique DealLink et Corpus</li>
                    <li>Comptes et contacts Keyaccount</li>
                    <li>Analyses Terrain</li>
                    <li>Points et commissions en attente</li>
                  </ul>
                  <p style={{ fontSize: '13px', color: 'var(--red)', fontWeight: 600, marginBottom: '4px' }}>Ton abonnement Stripe sera annulé immédiatement.</p>
                </>
              )}
              {deleteStep === 'confirm' && (
                <>
                  <p style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '12px' }}>Tape <strong>SUPPRIMER</strong> pour confirmer.</p>
                  <input
                    type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                    placeholder="SUPPRIMER" autoFocus
                    style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #FECACA', borderRadius: 'var(--r-sm)', fontSize: '14px', fontFamily: 'inherit', letterSpacing: '.05em', marginBottom: '8px', outline: 'none' }}
                  />
                  {deleteError && <div style={{ fontSize: '13px', color: 'var(--red)', background: 'var(--red-2)', padding: '8px 12px', borderRadius: 'var(--r-sm)', marginBottom: '4px' }}>{deleteError}</div>}
                </>
              )}
            </div>
            <div style={{ padding: '16px 24px 24px', display: 'flex', gap: '10px', flexDirection: 'column' }}>
              {deleteStep === 'warning' ? (
                <>
                  <button onClick={() => setDeleteStep('confirm')} style={{ padding: '11px', borderRadius: 'var(--r-sm)', background: 'var(--red)', color: '#fff', fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer' }}>Je comprends, continuer</button>
                  <button onClick={() => setDeleteStep(null)} style={{ padding: '11px', borderRadius: 'var(--r-sm)', background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-2)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Annuler</button>
                </>
              ) : (
                <>
                  <button onClick={handleDeleteAccount} disabled={deleteInput !== 'SUPPRIMER' || deleting}
                    style={{ padding: '11px', borderRadius: 'var(--r-sm)', background: deleteInput === 'SUPPRIMER' ? 'var(--red)' : '#FECACA', color: '#fff', fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '14px', border: 'none', cursor: deleteInput === 'SUPPRIMER' ? 'pointer' : 'not-allowed' }}>
                    {deleting ? 'Suppression…' : 'Supprimer définitivement'}
                  </button>
                  <button onClick={() => { setDeleteStep(null); setDeleteInput(''); setDeleteError('') }} style={{ padding: '11px', borderRadius: 'var(--r-sm)', background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-2)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Annuler</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
