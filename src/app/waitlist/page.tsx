'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const C = {
  bg:     '#0F1C17',
  card:   '#1A2820',
  green:  '#2F5446',
  greenL: '#4A8C6F',
  border: 'rgba(255,255,255,0.07)',
  text:   '#F7FAF8',
  text2:  '#9BB5AA',
  amber:  '#C8790A',
}

type Candidature = {
  id: string
  full_name: string
  email: string
  code_parrain: string | null
  projet_nom: string | null
  projet_website: string | null
  projet_concept: string | null
  projet_avancement: string | null
  projet_besoins: string[] | null
  status: string
}

export default function WaitlistPage() {
  const router = useRouter()
  const [cand, setCand]         = useState<Candidature | null>(null)
  const [count, setCount]       = useState(0)
  const [filleuls, setFilleuls] = useState(0)
  const [copied, setCopied]     = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth'); return }

      // Récupère la candidature via l'email du user connecté
      const { data: candidature } = await supabase
        .from('candidatures')
        .select('id, full_name, email, code_parrain, projet_nom, projet_website, projet_concept, projet_avancement, projet_besoins, status')
        .eq('email', user.email!)
        .maybeSingle()

      if (!candidature) { router.replace('/'); return }
      setCand(candidature)

      // Compteur waitlist
      const { count: c } = await supabase
        .from('candidatures')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      setCount(c ?? 0)

      // Filleuls de ce candidat
      if (candidature.code_parrain) {
        const { count: f } = await supabase
          .from('candidatures')
          .select('id', { count: 'exact', head: true })
          .eq('referral_code', candidature.code_parrain)
        setFilleuls(f ?? 0)
      }

      setLoading(false)
    }
    load()
  }, [router])

  function copyLink() {
    if (!cand?.code_parrain) return
    navigator.clipboard.writeText(`https://nouveauvariable.fr?ref=${cand.code_parrain}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.text2, fontFamily: 'sans-serif' }}>Chargement…</div>
      </div>
    )
  }

  if (!cand) return null

  const prenom    = cand.full_name.split(' ')[0]
  const progress  = Math.min((count / 100) * 100, 100)
  const refLink   = `https://nouveauvariable.fr?ref=${cand.code_parrain ?? ''}`

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'sans-serif', color: C.text, padding: '0 16px 60px' }}>

      {/* Header */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 0 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, background: C.greenL, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>NV</div>
        <span style={{ fontWeight: 600, fontSize: 15 }}>Nouveau Variable</span>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Titre */}
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Bienvenue, {prenom} 👋</h1>
          <p style={{ color: C.text2, marginTop: 6, fontSize: 14 }}>Ta candidature est bien enregistrée.</p>
        </div>

        {/* Modale waitlist */}
        <div style={{ background: C.card, border: `1px solid ${C.greenL}`, borderRadius: 16, padding: '24px 20px' }}>
          <p style={{ fontSize: 13, color: C.greenL, fontWeight: 600, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Ouverture du club</p>
          <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>Le club ouvre à 100 candidats</p>

          {/* Barre de progression */}
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 10, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: C.greenL, borderRadius: 99, transition: 'width 0.6s ease' }} />
          </div>
          <p style={{ fontSize: 13, color: C.text2, margin: '0 0 16px' }}>{count} / 100 candidats</p>
          <p style={{ fontSize: 14, color: C.text2, margin: 0 }}>Tu seras notifié par email avec ton lien de paiement dès qu'on atteint 100.</p>
        </div>

        {/* Section affiliation */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 20px' }}>
          <p style={{ fontSize: 13, color: C.text2, fontWeight: 600, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>Tes parrainages</p>
          <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Partage ton lien — tu gagnes des commissions à l'ouverture</p>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: C.text2, wordBreak: 'break-all', flex: 1 }}>{refLink}</span>
            <button
              onClick={copyLink}
              style={{ background: copied ? C.green : C.greenL, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {copied ? 'Copié ✓' : 'Copier le lien'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{filleuls}</div>
              <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>filleul{filleuls > 1 ? 's' : ''} en attente</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{filleuls > 0 ? `~${filleuls * 9}€` : '—'}</div>
              <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>commission potentielle/mois</div>
            </div>
          </div>
        </div>

        {/* Section projet */}
        {cand.projet_nom && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 20px' }}>
            <p style={{ fontSize: 13, color: C.text2, fontWeight: 600, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>Ton projet</p>
            <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>{cand.projet_nom}</p>
            {cand.projet_website && (
              <a href={cand.projet_website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: C.greenL, textDecoration: 'none', display: 'block', marginBottom: 12 }}>
                {cand.projet_website}
              </a>
            )}
            {cand.projet_concept && <p style={{ fontSize: 14, color: C.text2, margin: '0 0 12px', lineHeight: 1.6 }}>{cand.projet_concept}</p>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {cand.projet_avancement && (
                <span style={{ fontSize: 12, background: C.green, color: C.text, padding: '4px 10px', borderRadius: 99 }}>{cand.projet_avancement}</span>
              )}
              {(cand.projet_besoins ?? []).map(b => (
                <span key={b} style={{ fontSize: 12, background: 'rgba(255,255,255,0.08)', color: C.text2, padding: '4px 10px', borderRadius: 99 }}>{b}</span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: 'center', color: C.text2, fontSize: 13, margin: '8px 0 0' }}>
          On ouvre bientôt. Partage ton lien pour faire croître le club 🚀
        </p>

      </div>
    </div>
  )
}
