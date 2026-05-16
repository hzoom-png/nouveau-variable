import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const CARDS = [
  {
    href: '/dashboard/members',
    label: 'Annuaire',
    subtitle: 'Tous les membres du club',
    icon: (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="5.5" cy="4.5" r="2.5"/><path d="M1 13c0-2.5 2-4.5 4.5-4.5S10 10.5 10 13"/>
        <circle cx="11.5" cy="5.5" r="2"/><path d="M14 13c0-2-1.3-3.5-3-4"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/projects',
    label: 'Projets',
    subtitle: 'Opportunités partagées par les membres',
    icon: (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="4" width="13" height="9" rx="1.5"/><path d="M5 4V2.5a2.5 2.5 0 015 0V4"/><path d="M1 8h13"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/tools/keyaccount',
    label: 'Outils',
    subtitle: 'Keyaccount, Réplique, DealLink',
    icon: (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7.5" cy="4" r="2.5"/><circle cx="2.5" cy="12" r="1.5"/><circle cx="12.5" cy="12" r="1.5"/>
        <path d="M7.5 6.5v3M5 11L3 12M10 11l2 1"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/affiliation',
    label: 'Affiliation',
    subtitle: 'Ton lien de parrainage et tes commissions',
    icon: (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M7.5 1v13M1 7.5h13"/><circle cx="7.5" cy="7.5" r="6"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/profile',
    label: 'Mon profil',
    subtitle: 'Ton identité visible par les membres',
    icon: (
      <svg width="20" height="20" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7.5" cy="5" r="3"/><path d="M1.5 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/billing',
    label: 'Facturation',
    subtitle: 'Abonnement, reçus et paiements',
    icon: (
      <svg width="20" height="20" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="1" y="3" width="12" height="9" rx="1.5"/><path d="M1 6h12M4 9.5h3"/>
      </svg>
    ),
  },
]

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, onboarding_completed')
    .eq('id', session.user.id)
    .single()

  const firstName = profile?.first_name || 'toi'
  const isNew = !profile?.onboarding_completed

  return (
    <div style={{ maxWidth: '820px' }}>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontFamily: 'var(--font-jost)', fontSize: '22px', fontWeight: 800,
          color: 'var(--text)', marginBottom: '6px', lineHeight: 1.2,
        }}>
          Bienvenue, {firstName}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
          Retrouve tous les accès de ton espace membre ci-dessous.
        </p>
      </div>

      {isNew && (
        <div style={{
          background: 'linear-gradient(135deg, #024f41 0%, #1a7b5e 100%)',
          borderRadius: 16,
          padding: '36px 40px',
          marginBottom: 32,
          color: '#ffffff',
        }}>
          <p style={{
            fontSize: 11, opacity: 0.6, letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 10,
          }}>
            Bienvenue dans le club
          </p>
          <h1 style={{
            fontFamily: 'var(--font-jost)', fontWeight: 800, fontSize: 26,
            marginBottom: 14, lineHeight: 1.2,
          }}>
            Content de t&apos;avoir ici, {firstName}. 👋
          </h1>
          <p style={{
            fontSize: 15, opacity: 0.8, lineHeight: 1.7,
            maxWidth: 480, marginBottom: 28,
          }}>
            Commence par compléter ton profil pour être visible dans l&apos;annuaire,
            puis explore les membres et les opportunités qui t&apos;attendent.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href="/dashboard/profile"
              style={{
                background: '#ffffff', color: '#024f41',
                padding: '10px 22px', borderRadius: '99px',
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
              }}
            >
              Compléter mon profil →
            </Link>
            <Link
              href="/dashboard/members"
              style={{
                background: 'rgba(255,255,255,0.12)', color: '#ffffff',
                padding: '10px 22px', borderRadius: '99px',
                fontWeight: 600, fontSize: 14, textDecoration: 'none',
              }}
            >
              Explorer l&apos;annuaire
            </Link>
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
        gap: '12px',
      }}>
        {CARDS.map(card => (
          <Link key={card.href} href={card.href} style={{
            display: 'flex', flexDirection: 'column', gap: '14px',
            padding: '20px', borderRadius: 'var(--r-md)',
            background: 'var(--white)', border: '1px solid var(--border)',
            textDecoration: 'none',
          }}>
            <div style={{ color: 'var(--green)' }}>
              {card.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5 }}>
                {card.subtitle}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600 }}>
              Accéder →
            </div>
          </Link>
        ))}
      </div>

    </div>
  )
}
