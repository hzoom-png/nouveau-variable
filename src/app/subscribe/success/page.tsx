'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

const GREEN   = '#024f41'
const GREEN_3 = '#e8f5ef'
const BORDER  = '#E4EEEA'
const TEXT    = '#012722'
const TEXT_2  = '#4B6358'
const TEXT_3  = '#9BB5AA'
const SURFACE = '#F7FAF8'

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.nouveauvariable.fr'

const STEPS = [
  {
    n: '1',
    title: 'Email de confirmation',
    desc: 'Vérifie ton inbox (et spam). Tu recevras un email avec tes informations d\'accès dans les prochaines minutes.',
  },
  {
    n: '2',
    title: 'Connecte-toi au club',
    desc: 'Utilise le bouton ci-dessous. Ton accès est activé avec le numéro de téléphone de ta candidature.',
  },
  {
    n: '3',
    title: 'Complète ton profil',
    desc: 'Un tutoriel rapide te guidera à la connexion. Environ 5 minutes pour être opérationnel et visible des membres.',
  },
]


export default function SubscribeSuccessPage() {
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.first_name) setFirstName(data.first_name)
        })
    })
  }, [])

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${SURFACE}; font-family: Inter, system-ui, sans-serif; }
        @keyframes circleDraw {
          from { stroke-dashoffset: 157; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes checkDraw {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0; }
        }
        .check-circle { animation: circleDraw .65s ease forwards; }
        .check-path   { animation: checkDraw .4s ease .55s forwards; stroke-dashoffset: 60; }
        .cta-btn { transition: opacity .2s, transform .2s; }
        .cta-btn:hover { opacity: .88; transform: translateY(-2px); }
        @media (max-width: 640px) {
          .success-card { padding: 36px 24px !important; }
          .steps-list { gap: 20px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .check-circle, .check-path { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>

      <div style={{
        minHeight: '100vh', background: SURFACE,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div className="success-card" style={{
          background: '#fff', borderRadius: 24,
          border: `1px solid ${BORDER}`,
          padding: '52px 48px',
          maxWidth: 520, width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 32px rgba(47,84,70,.07)',
        }}>

          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0 }}>
            <img src="/logo-nv.png" alt="Nouveau Variable"
              style={{ height: 30, marginBottom: 32 }}
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          </motion.div>

          {/* Checkmark animé */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} style={{ marginBottom: 28 }}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" style={{ overflow: 'visible' }}>
              <circle
                className="check-circle"
                cx="36" cy="36" r="25"
                stroke={GREEN} strokeWidth="2.5"
                fill="none" strokeDasharray="157" strokeLinecap="round"
              />
              <path
                className="check-path"
                d="M24 36l8 8 16-16"
                stroke={GREEN} strokeWidth="2.8"
                fill="none" strokeDasharray="60"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          {/* Titre */}
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }} style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 600, fontSize: 'clamp(22px, 4vw, 30px)',
            color: TEXT, marginBottom: 10, lineHeight: 1.2,
          }}>
            Bienvenue dans le club{firstName ? `, ${firstName}` : ''} 🎉
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3 }} style={{
            fontSize: 15, color: TEXT_2, lineHeight: 1.7, marginBottom: 36,
          }}>
            Ton paiement a été reçu. Ton accès est en cours d'activation.
          </motion.p>

          {/* Next steps */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} style={{
            background: GREEN_3, borderRadius: 16,
            padding: '24px 24px', marginBottom: 32, textAlign: 'left',
          }}>
            <p style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 11, fontWeight: 700, color: GREEN,
              textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 20,
            }}>
              Prochaines étapes
            </p>
            <div className="steps-list" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {STEPS.map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: GREEN, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>
                    {s.n}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: TEXT, marginBottom: 3 }}>
                      {s.title}
                    </p>
                    <p style={{ fontSize: 13, color: TEXT_2, lineHeight: 1.55 }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.55 }}>
            <a
              href={`${APP_URL}/auth`}
              className="cta-btn"
              style={{
                display: 'inline-block',
                background: GREEN, color: '#fff',
                textDecoration: 'none',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 600, fontSize: 15,
                padding: '14px 36px', borderRadius: 99,
              }}
            >
              Accéder au club →
            </a>

            <p style={{ marginTop: 16, fontSize: 12, color: TEXT_3 }}>
              Un problème ?{' '}
              <a href="mailto:support@nouveauvariable.fr" style={{ color: GREEN, textDecoration: 'none' }}>
                support@nouveauvariable.fr
              </a>
            </p>
          </motion.div>

          {/* Trust signals */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.7 }} style={{
            marginTop: 28, paddingTop: 24,
            borderTop: `1px solid ${BORDER}`,
            display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap',
          }}>
            {['🔒 Paiement sécurisé Stripe', '📧 Ta facture est dans Billing', '✨ Accès immédiat'].map(s => (
              <span key={s} style={{ fontSize: 11, color: TEXT_3 }}>{s}</span>
            ))}
          </motion.div>

        </div>
      </div>
    </>
  )
}
