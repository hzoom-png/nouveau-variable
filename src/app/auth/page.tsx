'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { NvLogo } from '@/components/NvLogo'

type Step = 'phone' | 'otp' | 'referral' | 'done'

const GREEN = '#2F5446'
const GREEN_3 = '#EAF2EE'
const GREEN_4 = '#C5DDD5'
const BORDER = '#E4EEEA'
const TEXT = '#0F1C17'
const TEXT_2 = '#4B6358'
const TEXT_3 = '#8FAAA0'
const SURFACE = '#F7FAF8'

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  )
}

function AuthPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') ?? '')
  const [referralValid, setReferralValid] = useState(false)
  const [referrerId, setReferrerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  useEffect(() => {
    if (referralCode) validateReferralSilent(referralCode)
  }, [])

  async function validateReferralSilent(code: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', code.toUpperCase())
      .single()
    if (data) {
      setReferralValid(true)
      setReferrerId(data.id)
    }
  }

  function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('0') && digits.length === 10) {
      return '+33' + digits.slice(1)
    }
    if (digits.startsWith('33')) return '+' + digits
    if (digits.startsWith('+')) return raw.replace(/\s/g, '')
    return '+' + digits
  }

  async function sendOtp() {
    setError('')
    const formatted = formatPhone(phone)
    if (formatted.length < 10) {
      setError('Numéro invalide. Format attendu : 06 12 34 56 78')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithOtp({
      phone: formatted,
    })
    setLoading(false)
    if (err) {
      setError('Impossible d\'envoyer le SMS : ' + err.message)
      return
    }
    setStep('otp')
    setCountdown(60)
    setTimeout(() => otpRefs.current[0]?.focus(), 100)
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
    if (newOtp.every(d => d !== '')) verifyOtp(newOtp.join(''))
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  async function verifyOtp(code?: string) {
    const token = code || otp.join('')
    if (token.length < 6) { setError('Code incomplet.'); return }
    setError('')
    setLoading(true)
    const formatted = formatPhone(phone)

    const { data, error: err } = await supabase.auth.verifyOtp({
      phone: formatted,
      token,
      type: 'sms',
    })

    if (err || !data.user) {
      setLoading(false)
      setOtp(['', '', '', '', '', ''])
      setError('Code incorrect ou expiré. Réessaie.')
      otpRefs.current[0]?.focus()
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, onboarding_completed')
      .eq('id', data.user.id)
      .single()

    setLoading(false)

    if (profile?.onboarding_completed) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setStep('referral')
    }
  }

  async function validateAndCreate() {
    setError('')
    if (!referralValid) {
      setError('Code parrain obligatoire pour accéder au club.')
      return
    }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Session expirée. Recommence.'); setLoading(false); return }

    const code = 'NV' + Math.random().toString(36).slice(2, 6).toUpperCase()

    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: user.id,
      phone: user.phone,
      email: user.email ?? '',
      first_name: '',
      last_name: '',
      referral_code: code,
      referred_by: referrerId || null,
      points_balance: 97,
      is_active: true,
      onboarding_completed: true,
    })

    if (profileErr) {
      setError('Erreur création profil : ' + profileErr.message)
      setLoading(false)
      return
    }

    if (referrerId) {
      await supabase.from('referrals').upsert({
        referrer_id: referrerId,
        referee_id: user.id,
        level: 1,
        commission_rate: 40,
        is_active: true,
      }, { onConflict: 'referrer_id,referee_id' })

      const { data: gp } = await supabase
        .from('referrals')
        .select('referrer_id')
        .eq('referee_id', referrerId)
        .eq('level', 1)
        .single()

      if (gp) {
        await supabase.from('referrals').upsert({
          referrer_id: gp.referrer_id,
          referee_id: user.id,
          level: 2,
          commission_rate: 5,
          is_active: true,
        }, { onConflict: 'referrer_id,referee_id' })
      }
    }

    setLoading(false)
    router.push('/dashboard')
    router.refresh()
  }

  const card: React.CSSProperties = {
    background: '#fff',
    border: `1px solid ${BORDER}`,
    borderRadius: '24px',
    width: '100%',
    maxWidth: '420px',
    overflow: 'hidden',
    boxShadow: '0 12px 40px rgba(0,0,0,.08)',
  }

  const inputStyle: React.CSSProperties = {
    padding: '11px 14px',
    border: `1.5px solid ${BORDER}`,
    borderRadius: '8px',
    fontSize: '15px',
    color: TEXT,
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
    transition: '.15s',
  }

  const btnStyle: React.CSSProperties = {
    background: loading ? TEXT_2 : GREEN,
    color: '#fff',
    padding: '13px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
    border: 'none',
    width: '100%',
    fontFamily: 'Jost, sans-serif',
    transition: '.15s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: SURFACE,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '24px',
    }}>
      <div style={card}>

        <div style={{ padding: '24px 28px 20px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <NvLogo size={30} />
            <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '12px', color: GREEN, letterSpacing: '.05em', textTransform: 'uppercase' }}>
              Nouveau Variable
            </span>
          </div>
          <div style={{ fontFamily: 'Jost, sans-serif', fontSize: '20px', fontWeight: 800, color: TEXT, letterSpacing: '-.01em', marginBottom: '4px' }}>
            {step === 'phone' && 'Accède à ton espace'}
            {step === 'otp' && 'Code de vérification'}
            {step === 'referral' && 'Code parrain'}
          </div>
          <div style={{ fontSize: '13px', color: TEXT_2 }}>
            {step === 'phone' && 'Entre ton numéro — on t\'envoie un code par SMS.'}
            {step === 'otp' && `Code envoyé au ${phone}. Saisis les 6 chiffres.`}
            {step === 'referral' && 'Le club est sur invitation. Renseigne le code de la personne qui t\'a invité.'}
          </div>
        </div>

        <div style={{ padding: '22px 28px' }}>

          {step === 'phone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: TEXT_2, textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: '6px' }}>
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  style={inputStyle}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  autoFocus
                />
              </div>
              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 13px', fontSize: '12px', color: '#B91C1C' }}>
                  {error}
                </div>
              )}
              <button onClick={sendOtp} disabled={loading} style={btnStyle}>
                {loading ? 'Envoi du SMS…' : 'Recevoir mon code →'}
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el }}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{
                      width: '46px',
                      height: '54px',
                      textAlign: 'center',
                      fontSize: '22px',
                      fontWeight: 700,
                      fontFamily: 'Jost, sans-serif',
                      border: `2px solid ${digit ? GREEN : BORDER}`,
                      borderRadius: '10px',
                      outline: 'none',
                      color: TEXT,
                      background: digit ? GREEN_3 : '#fff',
                      transition: '.15s',
                    }}
                  />
                ))}
              </div>

              {loading && (
                <div style={{ textAlign: 'center', fontSize: '13px', color: TEXT_2 }}>
                  Vérification…
                </div>
              )}

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 13px', fontSize: '12px', color: '#B91C1C', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <div style={{ textAlign: 'center' }}>
                {countdown > 0 ? (
                  <span style={{ fontSize: '13px', color: TEXT_3 }}>
                    Renvoyer le code dans {countdown}s
                  </span>
                ) : (
                  <button onClick={sendOtp} style={{ fontSize: '13px', color: GREEN, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Renvoyer le SMS
                  </button>
                )}
              </div>

              <button
                onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError('') }}
                style={{ fontSize: '13px', color: TEXT_3, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ← Changer de numéro
              </button>
            </div>
          )}

          {step === 'referral' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: GREEN_3, border: `1px solid ${GREEN_4}`, borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: TEXT_2, lineHeight: 1.55 }}>
                Premier accès détecté. Pour rejoindre le club, tu as besoin d'un code parrain.
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: TEXT_2, textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: '6px' }}>
                  Code parrain
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={referralCode}
                    onChange={e => {
                      setReferralCode(e.target.value.toUpperCase())
                      setReferralValid(false)
                      setReferrerId('')
                    }}
                    placeholder="Ex: GODMODE"
                    style={{ ...inputStyle, flex: 1, fontFamily: 'Jost, sans-serif', fontWeight: 600, letterSpacing: '.05em' }}
                  />
                  <button
                    onClick={async () => {
                      if (!referralCode) return
                      setLoading(true)
                      const { data } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('referral_code', referralCode.toUpperCase())
                        .single()
                      setLoading(false)
                      if (data) { setReferralValid(true); setReferrerId(data.id); setError('') }
                      else setError('Code introuvable.')
                    }}
                    style={{
                      background: referralValid ? GREEN_3 : SURFACE,
                      border: `1.5px solid ${referralValid ? GREEN : BORDER}`,
                      color: referralValid ? GREEN : TEXT_2,
                      padding: '0 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {loading ? '…' : referralValid ? '✓ Validé' : 'Vérifier'}
                  </button>
                </div>
              </div>
              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 13px', fontSize: '12px', color: '#B91C1C' }}>
                  {error}
                </div>
              )}
              <button
                onClick={validateAndCreate}
                disabled={loading || !referralValid}
                style={{ ...btnStyle, opacity: referralValid ? 1 : .5 }}
              >
                {loading ? 'Création du compte…' : 'Rejoindre le club →'}
              </button>
            </div>
          )}

        </div>
      </div>

      <p style={{ marginTop: '20px', fontSize: '12px', color: TEXT_3, textAlign: 'center' }}>
        En continuant tu acceptes nos{' '}
        <a href="/mentions-legales" style={{ color: GREEN, textDecoration: 'none' }}>CGU</a>
        {' '}et notre{' '}
        <a href="/politique-confidentialite" style={{ color: GREEN, textDecoration: 'none' }}>politique de confidentialité</a>
      </p>
    </div>
  )
}
