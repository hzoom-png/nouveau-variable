'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Step = 1 | 2 | 3 | 4

const CITIES = ['Lyon','Paris','Marseille','Bordeaux','Toulouse','Nice','Nantes','Lille','Strasbourg','Rennes','Grenoble','Montpellier']
const SECTORS = ['BtoB SaaS','Immobilier','Assurance','MLM / Réseau','Formation','Événementiel','Recrutement','Conseil','Finance','Tech / IT','Marketing','E-commerce']

function SignupForm() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [referralCode, setReferralCode] = useState(searchParams.get('ref') ?? '')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])

  async function validateReferral() {
    setError('')
    if (!referralCode.trim()) {
      setError('Le code parrain est obligatoire pour accéder au club.')
      return
    }

    if (referralCode.trim().toUpperCase() === 'GODMODE') {
      setStep(2)
      return
    }

    setLoading(true)
    const res = await fetch(`/api/auth/check-referral?code=${encodeURIComponent(referralCode.trim())}`)
    setLoading(false)

    if (!res.ok) {
      setError("Code parrain introuvable. Vérifie auprès de la personne qui t'a invité.")
      return
    }
    setStep(2)
  }

  async function handleSignup() {
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        roleTitle,
        cities: selectedCities,
        sectors: selectedSectors,
        refCode: referralCode,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erreur lors de la création du compte.')
      setLoading(false)
      return
    }

    setLoading(false)
    window.location.href = '/dashboard'
  }

  const toggleCity = (city: string) => setSelectedCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : prev.length < 5 ? [...prev, city] : prev)
  const toggleSector = (s: string) => setSelectedSectors(prev => prev.includes(s) ? prev.filter(x => x !== s) : prev.length < 4 ? [...prev, s] : prev)

  return (
    <div style={{ minHeight: '100vh', background: '#F7FAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px' }}>
      <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: '24px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,.08)' }}>

        {/* Header */}
        <div style={{ padding: '28px 32px 22px', borderBottom: '1px solid #E4EEEA' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
            {([1,2,3,4] as const).map(n => (
              <div key={n} style={{ flex: 1, height: '3px', borderRadius: '100px', background: n < step ? '#2F5446' : n === step ? 'rgba(47,84,70,.3)' : '#E4EEEA', transition: '.3s' }} />
            ))}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#2F5446', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: '5px' }}>Étape {step} sur 4</div>
          <div style={{ fontFamily: 'Jost, sans-serif', fontSize: '20px', fontWeight: 800, color: '#0F1C17', letterSpacing: '-.01em' }}>
            {step === 1 && 'Code parrain'}{step === 2 && 'Ton compte'}{step === 3 && 'Ton profil'}{step === 4 && "C'est tout bon ✓"}
          </div>
          <div style={{ fontSize: '13px', color: '#4B6358', marginTop: '4px' }}>
            {step === 1 && 'Le club est sur invitation uniquement.'}
            {step === 2 && 'Ça prend 60 secondes.'}
            {step === 3 && "Ces infos apparaissent dans l'annuaire."}
            {step === 4 && "Vérifie tes informations avant d'accéder au club."}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 32px' }}>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#EAF2EE', border: '1px solid #C5DDD5', borderRadius: '10px', padding: '13px 15px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', background: '#2F5446', borderRadius: '7px', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1L8.5 5H13L9.5 7.5L11 11.5L7 9L3 11.5L4.5 7.5L1 5H5.5L7 1Z" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" fill="none"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#2F5446', marginBottom: '2px' }}>Club sur invitation</div>
                  <div style={{ fontSize: '12px', color: '#4B6358', lineHeight: 1.5 }}>Ce code te lie à ton parrain et active le système de commissions.</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#4B6358', textTransform: 'uppercase', letterSpacing: '.06em' }}>Code parrain</label>
                <input value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} placeholder="Ex: GODMODE"
                  style={{ padding: '10px 13px', border: '1.5px solid #E4EEEA', borderRadius: '8px', fontSize: '14px', fontWeight: 600, letterSpacing: '.04em', color: '#0F1C17', outline: 'none', fontFamily: 'Jost, sans-serif' }} />
              </div>
              {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 13px', fontSize: '12px', color: '#B91C1C' }}>{error}</div>}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[{ label: 'Prénom', value: firstName, set: setFirstName, placeholder: 'Prénom' }, { label: 'Nom', value: lastName, set: setLastName, placeholder: 'Nom' }].map(f => (
                  <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#4B6358', textTransform: 'uppercase', letterSpacing: '.06em' }}>{f.label}</label>
                    <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                      style={{ padding: '9px 12px', border: '1.5px solid #E4EEEA', borderRadius: '8px', fontSize: '13px', color: '#0F1C17', outline: 'none' }} />
                  </div>
                ))}
              </div>
              {[{ label: 'Email professionnel', value: email, set: setEmail, type: 'email', placeholder: 'toi@exemple.fr' }, { label: 'Mot de passe', value: password, set: setPassword, type: 'password', placeholder: '8 caractères minimum' }].map(f => (
                <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#4B6358', textTransform: 'uppercase', letterSpacing: '.06em' }}>{f.label}</label>
                  <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                    style={{ padding: '9px 12px', border: '1.5px solid #E4EEEA', borderRadius: '8px', fontSize: '13px', color: '#0F1C17', outline: 'none' }} />
                </div>
              ))}
              {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 13px', fontSize: '12px', color: '#B91C1C' }}>{error}</div>}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#4B6358', textTransform: 'uppercase', letterSpacing: '.06em' }}>Titre / Rôle</label>
                <input value={roleTitle} onChange={e => setRoleTitle(e.target.value)} placeholder="Ex : Commercial BtoB"
                  style={{ padding: '9px 12px', border: '1.5px solid #E4EEEA', borderRadius: '8px', fontSize: '13px', color: '#0F1C17', outline: 'none' }} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#4B6358', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '8px' }}>
                  Villes d&apos;intervention <span style={{ fontWeight: 400, color: '#8FAAA0' }}>(max 5)</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {CITIES.map(city => (
                    <span key={city} onClick={() => toggleCity(city)} style={{ padding: '6px 13px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', userSelect: 'none', transition: '.14s', background: selectedCities.includes(city) ? '#EAF2EE' : '#fff', border: `1.5px solid ${selectedCities.includes(city) ? '#2F5446' : '#E4EEEA'}`, color: selectedCities.includes(city) ? '#2F5446' : '#4B6358' }}>{city}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#4B6358', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '8px' }}>
                  Secteurs <span style={{ fontWeight: 400, color: '#8FAAA0' }}>(max 4)</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {SECTORS.map(s => (
                    <span key={s} onClick={() => toggleSector(s)} style={{ padding: '6px 13px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', userSelect: 'none', transition: '.14s', background: selectedSectors.includes(s) ? '#EAF2EE' : '#fff', border: `1.5px solid ${selectedSectors.includes(s) ? '#2F5446' : '#E4EEEA'}`, color: selectedSectors.includes(s) ? '#2F5446' : '#4B6358' }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[{ label: 'Nom', value: `${firstName} ${lastName}` }, { label: 'Email', value: email }, { label: 'Rôle', value: roleTitle || '—' }, { label: 'Villes', value: selectedCities.join(', ') || '—' }, { label: 'Secteurs', value: selectedSectors.join(', ') || '—' }, { label: 'Points de bienvenue', value: '97 pts' }, { label: 'Commission N1', value: '40% à vie' }].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', background: '#F7FAF8', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#4B6358' }}>{row.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F1C17' }}>{row.value}</span>
                </div>
              ))}
              {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 13px', fontSize: '12px', color: '#B91C1C', marginTop: '4px' }}>{error}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          {step > 1 ? (
            <button onClick={() => { setStep((step - 1) as Step); setError('') }} style={{ fontSize: '13px', fontWeight: 600, color: '#4B6358', padding: '10px 14px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}>← Retour</button>
          ) : (
            <a href="/auth/login" style={{ fontSize: '13px', color: '#8FAAA0', textDecoration: 'none' }}>Déjà membre ?</a>
          )}
          <button
            disabled={loading}
            onClick={() => {
              if (step === 1) validateReferral()
              else if (step === 2) {
                if (!firstName || !email || !password) { setError('Remplis tous les champs.'); return }
                if (password.length < 8) { setError('Mot de passe trop court (8 caractères min).'); return }
                setError(''); setStep(3)
              }
              else if (step === 3) { setError(''); setStep(4) }
              else handleSignup()
            }}
            style={{ background: loading ? '#4B6358' : '#2F5446', color: '#fff', padding: '11px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', flex: 1, maxWidth: '220px', fontFamily: 'Jost, sans-serif', border: 'none', transition: '.15s' }}
          >
            {loading ? '…' : step === 4 ? 'Accéder au dashboard →' : 'Continuer →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return <Suspense><SignupForm /></Suspense>
}
