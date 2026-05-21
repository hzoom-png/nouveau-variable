'use client'

import { useState, useEffect, useRef } from 'react'

/* ── Types ────────────────────────────────────────────────────────────────── */
type Tab = 'keyaccount' | 'deallink' | 'replique' | 'side-hustle'
type Contact = { id: number; name: string; role: string; email: string; phone: string; linkedin: string }

/* ── Mock data ────────────────────────────────────────────────────────────── */
const CONTACTS: Contact[] = [
  { id: 1, name: 'Jean Dupont',    role: 'Directeur Commercial',   email: 'jean.dupont@acme-tech.fr',    phone: '+33 6 12 34 56 78', linkedin: 'linkedin.com/in/jeandupont'    },
  { id: 2, name: 'Marie Martin',   role: 'Responsable Marketing',  email: 'marie.martin@acme-tech.fr',   phone: '+33 6 23 45 67 89', linkedin: 'linkedin.com/in/mariemartin'   },
  { id: 3, name: 'Pierre Durand',  role: 'Commercial Senior',      email: 'pierre.durand@acme-tech.fr',  phone: '+33 6 34 56 78 90', linkedin: 'linkedin.com/in/pierredurand'  },
  { id: 4, name: 'Sophie Lefèvre', role: 'RRH',                    email: 'sophie.lefevre@acme-tech.fr', phone: '+33 6 45 67 89 01', linkedin: 'linkedin.com/in/sophielefevre' },
]

const SCRIPTS: Record<string, string> = {
  prospection:    `Bonjour Pierre,\n\nJ'ai vu qu'Acme Tech Solutions développe fortement sa présence en France — votre croissance est impressionnante.\n\nNous accompagnons 50+ éditeurs SaaS dans leur développement commercial. En moyenne, nos clients voient leur pipeline progresser de 200% en 6 mois.\n\nVous auriez 15 minutes mardi pour qu'on en parle ?`,
  'suivi-meeting': `Bonjour Pierre,\n\nJe vous rappelle suite à notre échange de la semaine dernière. Vous m'aviez parlé de vos défis sur le recrutement de commerciaux performants.\n\nJ'ai préparé deux ou trois éléments concrets directement applicables à votre situation.\n\nMardi 14h ou mercredi 10h — lequel vous convient ?`,
  relance:        `Pierre, bonjour.\n\nJe reviens vers vous — ça fait quelques semaines que nous n'avons pas échangé.\n\nVotre concurrent a récemment restructuré son équipe commerciale. Si vous aussi souhaitez accélérer, c'est peut-être le bon moment pour en parler.\n\nUne fenêtre cette semaine ?`,
}

const SCRIPTS_AGGRESSIVE: Record<string, string> = {
  prospection:    `Pierre, bonjour.\n\nVotre concurrent Sigma Software vient de signer avec nous. En 3 mois, leur CA a progressé de 30%.\n\nJe vous appelle avant qu'ils prennent trop d'avance. Mardi 14h, ça vous convient ?`,
  'suivi-meeting': `Pierre, suite à notre meeting — j'ai une offre limitée à 2 clients ce trimestre.\n\nJe veux vous en réserver une. On valide ça cette semaine ?\n\nJeudi ou vendredi ?`,
  relance:        `Pierre.\n\nMa pipeline est pleine en juin. Il me reste 1 slot pour un partenariat stratégique ce mois-ci.\n\nVous êtes dans ma shortlist. C'est oui ou non ?`,
}

const SCRIPTS_SOFT: Record<string, string> = {
  prospection:    `Bonjour Pierre,\n\nJ'espère que vous allez bien. Je me permets de vous contacter car j'ai découvert le travail d'Acme Tech Solutions et j'ai été sincèrement impressionné par votre approche.\n\nSi vous avez 20 minutes pour un café virtuel, je serais ravi d'échanger sur vos projets de développement commercial.\n\nBonne journée à vous,`,
  'suivi-meeting': `Bonjour Pierre,\n\nJ'espère que notre échange vous a apporté quelques pistes utiles.\n\nN'hésitez pas à me recontacter quand vous le souhaitez — je reste disponible pour répondre à vos questions.\n\nBelle journée,`,
  relance:        `Bonjour Pierre,\n\nJe voulais juste prendre de vos nouvelles. Nos échanges m'ont beaucoup appris sur les enjeux de votre secteur.\n\nSi un jour vous souhaitez approfondir, je serai là. En attendant, bonne continuation !`,
}

const ROADMAP_PHASES = [
  {
    title: 'Phase 1 — Validation MVP', subtitle: 'Mois 1',
    tasks: [
      { label: 'Interviews 10 utilisateurs', done: true },
      { label: 'Prototype low-fidelity',     done: true },
      { label: 'Tester avec 5 beta users',   done: false },
    ],
  },
  {
    title: 'Phase 2 — Lancement', subtitle: 'Mois 2-3',
    tasks: [
      { label: 'Développer la v1',              done: false },
      { label: 'Landing page + pricing',         done: false },
      { label: '10 early customers payants',     done: false },
    ],
  },
  {
    title: 'Phase 3 — Scaling', subtitle: 'Mois 4+',
    tasks: [
      { label: '100+ utilisateurs actifs',        done: false },
      { label: '5 000 € MRR',                     done: false },
      { label: 'Levée de fonds / Partenaires',    done: false },
    ],
  },
]

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

/* ── TypedText ────────────────────────────────────────────────────────────── */
function TypedText({ text, speed = 14 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setDisplayed('')
    let i = 0
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length && timer.current) clearInterval(timer.current)
    }, speed)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [text, speed])

  return <>{displayed}</>
}

/* ── Shared components ────────────────────────────────────────────────────── */
function ToolIntro({ icon, name, tagline, desc }: { icon: string; name: string; tagline: string; desc: string }) {
  return (
    <div style={{ marginBottom: 44 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 26 }}>{icon}</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9BB5AA' }}>{name}</span>
      </div>
      <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 'clamp(22px, 3vw, 34px)', color: '#0F1C17', lineHeight: 1.2, marginBottom: 14 }}>
        {tagline}
      </h2>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: '#4B6358', lineHeight: 1.7, maxWidth: 540 }}>
        {desc}
      </p>
    </div>
  )
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <div style={{ marginTop: 36, padding: '24px 28px', background: '#fff', borderRadius: 16, border: '1px solid #E4EEEA' }}>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9BB5AA', marginBottom: 14 }}>Fonctionnalités</p>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < items.length - 1 ? 11 : 0 }}>
          <span style={{ color: '#36a64f', fontWeight: 700, fontSize: 15, lineHeight: 1.5, flexShrink: 0 }}>✓</span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#0F1C17', lineHeight: 1.6 }}>{item}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Main export ──────────────────────────────────────────────────────────── */
export default function OutilsClient() {
  const [activeTab, setActiveTab] = useState<Tab>('keyaccount')
  const [visible,   setVisible]   = useState(true)
  const [scrolled,  setScrolled]  = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const switchTab = (tab: Tab) => {
    if (tab === activeTab) return
    setVisible(false)
    setTimeout(() => { setActiveTab(tab); setVisible(true) }, 200)
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'keyaccount',  label: 'Keyaccount',  icon: '👥' },
    { id: 'deallink',    label: 'Deallink',    icon: '🔗' },
    { id: 'replique',    label: 'Réplique',    icon: '🎤' },
    { id: 'side-hustle', label: 'Side Hustle', icon: '🚀' },
  ]

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#0F1C17', background: '#F7FAF8', minHeight: '100vh' }}>
      <style>{`
        * { box-sizing: border-box; }
        .nv-card-hover { transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s !important; cursor: pointer; }
        .nv-card-hover:hover { transform: translateY(-4px) !important; box-shadow: 0 8px 32px rgba(54,166,79,0.13) !important; border-color: #36a64f !important; }
        .nv-contact-card:hover .nv-contact-name { color: #36a64f !important; }
        .nv-tab-btn { background: none; border: none; cursor: pointer; outline: none; }
        .nv-tab-btn:hover { color: #36a64f !important; }
        @media (max-width: 768px) {
          .nv-hero   { padding: 56px 20px 36px !important; }
          .nv-tabs   { padding: 0 12px !important; gap: 0 !important; overflow-x: auto; }
          .nv-tabBtn { font-size: 12px !important; padding: 12px 12px !important; white-space: nowrap; }
          .nv-content { padding: 36px 20px !important; }
          .nv-grid2  { grid-template-columns: 1fr !important; }
          .nv-cgrid  { grid-template-columns: 1fr 1fr !important; }
          .nv-nav    { padding: 0 20px !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <nav className="nv-nav" style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        background: scrolled ? 'rgba(255,255,255,0.95)' : '#fff',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(8px)' : 'none',
        borderBottom: '1px solid #E4EEEA',
        transition: 'background 0.2s',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/icon_margin_transparent_customcolor.png" alt="NV" style={{ height: 40, width: 40, objectFit: 'contain' }} onError={e => (e.currentTarget.style.display = 'none')} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '.09em', color: '#2F5446', textTransform: 'uppercase' }}>
            NOUVEAU VARIABLE
          </span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="/outils" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, color: '#36a64f', borderBottom: '1.5px solid #36a64f', paddingBottom: 1, textDecoration: 'none' }}>
            Outils
          </a>
          <a
            href="/#candidature"
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13, color: '#fff', background: '#2F5446', borderRadius: 99, padding: '9px 20px', textDecoration: 'none', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#244336')}
            onMouseLeave={e => (e.currentTarget.style.background = '#2F5446')}
          >
            Candidater →
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="nv-hero" style={{ padding: '80px 40px 52px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <span style={{ display: 'inline-block', fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9BB5AA', marginBottom: 18 }}>
          Suite d'outils NV
        </span>
        <h1 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 'clamp(30px, 5vw, 52px)', lineHeight: 1.1, color: '#0F1C17', marginBottom: 18 }}>
          Les Outils de{' '}<span style={{ color: '#36a64f' }}>Nouveau Variable</span>
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, lineHeight: 1.7, color: '#4B6358', maxWidth: 460, margin: '0 auto' }}>
          Designed for sales professionals. Explore et interagis avec chaque outil ci-dessous.
        </p>
      </section>

      {/* ── Sticky tabs ── */}
      <div style={{ position: 'sticky', top: 64, zIndex: 90, background: '#fff', borderBottom: '1px solid #E4EEEA', borderTop: '1px solid #E4EEEA' }}>
        <div className="nv-tabs" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px', display: 'flex', gap: 4 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              className="nv-tab-btn nv-tabBtn"
              onClick={() => switchTab(t.id)}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14, fontWeight: activeTab === t.id ? 600 : 500,
                color: activeTab === t.id ? '#36a64f' : '#4B6358',
                padding: '14px 22px',
                borderBottom: `2px solid ${activeTab === t.id ? '#36a64f' : 'transparent'}`,
                transition: 'all 0.2s',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div
        className="nv-content"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: 'opacity 0.22s, transform 0.22s', minHeight: '60vh', maxWidth: 1100, margin: '0 auto', padding: '56px 40px' }}
      >
        {activeTab === 'keyaccount'  && <KeyaccountSection />}
        {activeTab === 'deallink'    && <DeallinkSection />}
        {activeTab === 'replique'    && <RepliqueSection />}
        {activeTab === 'side-hustle' && <SideHustleSection />}
      </div>

      {/* ── CTA footer ── */}
      <section style={{ padding: '80px 40px', textAlign: 'center', background: '#fff', borderTop: '1px solid #E4EEEA' }}>
        <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 'clamp(22px, 4vw, 34px)', color: '#0F1C17', marginBottom: 14 }}>
          Prêt à découvrir tes outils ?
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: '#4B6358', marginBottom: 34 }}>
          Ces outils sont réservés aux membres Nouveau Variable.
        </p>
        <a
          href="/#candidature"
          style={{ display: 'inline-block', fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 15, color: '#fff', background: '#2F5446', borderRadius: 99, padding: '16px 40px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(47,84,70,.2)', transition: 'background 0.2s, transform 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#244336'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#2F5446'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          Candidater au club →
        </a>
      </section>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   KEYACCOUNT
═══════════════════════════════════════════════════════════════════════════ */
function KeyaccountSection() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [search, setSearch]       = useState('')
  const [sector, setSector]       = useState('Tech')
  const [favorited, setFavorited] = useState(false)

  return (
    <div>
      <ToolIntro
        icon="👥"
        name="Keyaccount"
        tagline="Annuaire de comptes et de contacts commerciaux"
        desc="Accède à 10 000+ entreprises et 50 000+ contacts réels. Filtre, prospecte et suis tes interactions depuis une interface unifiée."
      />

      <div className="nv-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Left: search + company */}
        <div>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E4EEEA', padding: '18px 20px', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cherche une entreprise..."
                style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #E4EEEA', borderRadius: 10, fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#0F1C17', outline: 'none', transition: 'border-color 0.2s', background: '#fff' }}
                onFocus={e  => (e.target.style.borderColor = '#36a64f')}
                onBlur={e   => (e.target.style.borderColor = '#E4EEEA')}
              />
              <button style={{ padding: '0 16px', background: '#36a64f', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 15 }}>🔍</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: sector, onChange: setSector, options: ['Tech', 'Finance', 'Retail', 'Industrie', 'Santé'] },
                { value: '10-50', onChange: () => {}, options: ['10-50', '50-200', '200-500', '500+'] },
              ].map((sel, i) => (
                <select key={i} value={sel.value} onChange={e => sel.onChange(e.target.value)} style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #E4EEEA', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#4B6358', outline: 'none', background: '#fff' }}>
                  {sel.options.map(o => <option key={o}>{o}</option>)}
                </select>
              ))}
            </div>
          </div>

          <div className="nv-card-hover" style={{ background: '#fff', borderRadius: 14, border: '1px solid #E4EEEA', padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 46, height: 46, borderRadius: 10, background: 'linear-gradient(135deg, #E4EEEA, #C8DDD5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏢</div>
              <div>
                <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 16, color: '#0F1C17', marginBottom: 3 }}>ACME {sector} Solutions</h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9BB5AA' }}>Secteur: {sector} · 45-50 salariés</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[['CA annuel', '2,5 M€'], ['Site web', 'acme-tech.fr'], ['Région', 'Île-de-France'], ['LinkedIn', '🔗 Voir profil']].map(([k, v]) => (
                <div key={k} style={{ background: '#F7FAF8', borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9BB5AA', marginBottom: 2 }}>{k}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#0F1C17' }}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setFavorited(f => !f)}
                style={{ flex: 1, padding: '9px 0', border: `1.5px solid ${favorited ? '#36a64f' : '#E4EEEA'}`, borderRadius: 8, background: favorited ? 'rgba(54,166,79,0.07)' : '#fff', fontFamily: "'Inter', sans-serif", fontSize: 13, color: favorited ? '#36a64f' : '#4B6358', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {favorited ? '♥ Favori' : '♡ Ajouter aux favoris'}
              </button>
              <button style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, background: '#36a64f', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                + Créer une action
              </button>
            </div>
          </div>
        </div>

        {/* Right: contacts */}
        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: '#9BB5AA', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Contacts associés ({CONTACTS.length + 5})
          </p>
          <div className="nv-cgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {CONTACTS.map(c => (
              <button
                key={c.id}
                className="nv-card-hover nv-contact-card"
                onClick={() => setSelectedContact(c)}
                style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 12, padding: '14px 15px', textAlign: 'left', cursor: 'pointer', width: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #C8DDD5, #9BB5AA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#2F5446', flexShrink: 0 }}>
                    {initials(c.name)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p className="nv-contact-name" style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17', transition: 'color 0.15s', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9BB5AA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.role}</p>
                  </div>
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#4B6358', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>{c.email}</p>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#36a64f', fontWeight: 500 }}>Détails →</span>
              </button>
            ))}
            <div style={{ background: 'rgba(54,166,79,0.06)', border: '1px dashed rgba(54,166,79,0.4)', borderRadius: 12, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: '#36a64f' }}>+5 contacts</span>
            </div>
          </div>
        </div>
      </div>

      <FeatureList items={[
        'Accès à 10 000+ comptes (entreprises) avec données actualisées',
        '50 000+ contacts réels — noms, emails, LinkedIn',
        'Filtrage avancé par secteur, taille, région et CA',
        'Suivi des interactions et notes personnalisées par compte',
      ]} />

      {selectedContact && <ContactModal contact={selectedContact} onClose={() => setSelectedContact(null)} />}
    </div>
  )
}

function ContactModal({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,28,23,0.52)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: 32, width: 'min(440px, 94vw)', boxShadow: '0 24px 64px rgba(0,0,0,0.16)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #C8DDD5, #9BB5AA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#2F5446' }}>
              {initials(contact.name)}
            </div>
            <div>
              <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 18, color: '#0F1C17' }}>{contact.name}</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#36a64f', fontWeight: 500 }}>{contact.role}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9BB5AA', lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        {[['📧 Email', contact.email], ['📱 Téléphone', contact.phone], ['🔗 LinkedIn', contact.linkedin]].map(([k, v]) => (
          <div key={k} style={{ padding: '12px 16px', background: '#F7FAF8', borderRadius: 10, marginBottom: 8 }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9BB5AA', marginBottom: 4 }}>{k}</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#0F1C17', fontWeight: 500 }}>{v}</p>
          </div>
        ))}
        <div style={{ padding: '12px 16px', background: '#F7FAF8', borderRadius: 10, marginBottom: 20 }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9BB5AA', marginBottom: 10 }}>Historique interactions</p>
          {['Appel · 12 mai 2025 — Intéressé, démo planifiée', 'Email · 5 mai 2025 — Premier contact'].map(h => (
            <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#36a64f', flexShrink: 0 }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#4B6358' }}>{h}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ width: '100%', padding: 12, background: '#36a64f', color: '#fff', border: 'none', borderRadius: 10, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          + Créer une action
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEALLINK
═══════════════════════════════════════════════════════════════════════════ */
function DeallinkSection() {
  const [design, setDesign]             = useState<'Minimal' | 'Premium' | 'Dark'>('Minimal')
  const [title, setTitle]               = useState('Mon offre pour Acme Tech Solutions')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied]             = useState(false)

  const isDark    = design === 'Dark'
  const isPremium = design === 'Premium'
  const bg        = isDark ? '#0F1C17' : isPremium ? 'linear-gradient(135deg, #F0F7F3, #fff)' : '#fff'
  const txt       = isDark ? '#fff' : '#0F1C17'
  const sub       = isDark ? 'rgba(255,255,255,0.65)' : '#4B6358'
  const accent    = isPremium ? '#2F5446' : '#36a64f'
  const divider   = isDark ? 'rgba(255,255,255,0.1)' : '#E4EEEA'

  const handleGenerate = () => setGeneratedLink(`https://nv.link/jean-dupont-acme-${Date.now().toString(36)}`)
  const handleCopy = () => {
    if (generatedLink) { navigator.clipboard.writeText(generatedLink).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  return (
    <div>
      <ToolIntro
        icon="🔗"
        name="Deallink"
        tagline="Pages de vente personnalisées en 1 clic"
        desc="Crée une page dédiée à chaque prospect. Intègre ton calendrier, personnalise le design, et envoie un lien unique qui convertit."
      />

      <div className="nv-grid2" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>

        {/* Preview */}
        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: '#9BB5AA', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Aperçu en direct</p>
          <div style={{ border: '1px solid #E4EEEA', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid #E4EEEA', display: 'flex', alignItems: 'center', gap: 8 }}>
              {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
              <div style={{ flex: 1, background: '#F7FAF8', borderRadius: 6, padding: '4px 10px', marginLeft: 4 }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#9BB5AA' }}>nv.link/jean-dupont-acme</p>
              </div>
            </div>
            <div style={{ padding: '24px 22px', background: bg, transition: 'background 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff' }}>JD</div>
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: txt, transition: 'color 0.3s' }}>Jean Dupont</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: sub, transition: 'color 0.3s' }}>Commercial @ Nouveau Variable</p>
                </div>
              </div>
              <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 15, color: txt, marginBottom: 12, lineHeight: 1.3, transition: 'color 0.3s' }}>{title || 'Mon offre personnalisée'}</h3>
              <div style={{ borderTop: `1px solid ${divider}`, margin: '12px 0' }} />
              {['Augmenter votre CA de 20-30%', 'Ouvrir 5 nouveaux marchés', 'Former votre équipe (inclus)'].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: accent, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}.</span>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: sub, transition: 'color 0.3s' }}>{item}</p>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${divider}`, margin: '14px 0 12px' }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.4)' : '#9BB5AA', letterSpacing: '.08em', marginBottom: 10 }}>📅 DISPONIBILITÉS</p>
              {['Mardi 14h', 'Mercredi 10h', 'Jeudi 15h'].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: accent, flexShrink: 0 }} />
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: sub, transition: 'color 0.3s' }}>{s}</p>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button style={{ flex: 1, padding: '9px 0', background: accent, color: '#fff', border: 'none', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}>
                  Prendre un RDV
                </button>
                <button style={{ flex: 1, padding: '9px 0', background: 'transparent', color: sub, border: `1px solid ${divider}`, borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 12, cursor: 'pointer' }}>
                  Envoyer un message
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: '#9BB5AA', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Personnalisation</p>

          <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 14, padding: '16px 18px', marginBottom: 12 }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17', marginBottom: 12 }}>Design</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['Minimal', 'Premium', 'Dark'] as const).map(d => (
                <button key={d} onClick={() => setDesign(d)} style={{ flex: 1, padding: '8px 4px', border: `1.5px solid ${design === d ? '#36a64f' : '#E4EEEA'}`, borderRadius: 8, background: design === d ? 'rgba(54,166,79,0.07)' : '#fff', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: design === d ? 600 : 400, color: design === d ? '#36a64f' : '#4B6358', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 14, padding: '16px 18px', marginBottom: 12 }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17', marginBottom: 10 }}>Titre</p>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E4EEEA', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#0F1C17', outline: 'none', transition: 'border-color 0.2s', background: '#fff', boxSizing: 'border-box' }}
              onFocus={e => (e.target.style.borderColor = '#36a64f')}
              onBlur={e  => (e.target.style.borderColor = '#E4EEEA')}
            />
          </div>

          <button
            onClick={handleGenerate}
            style={{ width: '100%', padding: 12, background: '#2F5446', color: '#fff', border: 'none', borderRadius: 10, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, cursor: 'pointer', marginBottom: 8, transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#244336')}
            onMouseLeave={e => (e.currentTarget.style.background = '#2F5446')}
          >
            Générer mon lien
          </button>

          {generatedLink && (
            <div style={{ background: '#F7FAF8', border: '1px solid #E4EEEA', borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#36a64f', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{generatedLink}</p>
              <button
                onClick={handleCopy}
                style={{ flexShrink: 0, padding: '6px 12px', background: copied ? '#36a64f' : '#fff', border: '1.5px solid #E4EEEA', borderRadius: 7, fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: copied ? '#fff' : '#4B6358', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {copied ? '✓ Copié' : 'Copier'}
              </button>
            </div>
          )}
        </div>
      </div>

      <FeatureList items={[
        'Crée ta page de vente en 2 minutes, aucun code requis',
        'Designs modernes, entièrement personnalisables',
        'Calendrier intégré et synchronisé avec ton agenda',
        'Tracking des clics et conversions en temps réel',
      ]} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   RÉPLIQUE
═══════════════════════════════════════════════════════════════════════════ */
function RepliqueSection() {
  const [callType, setCallType]         = useState('prospection')
  const [liked, setLiked]               = useState(false)
  const [editing, setEditing]           = useState(false)
  const [editedScript, setEditedScript] = useState(SCRIPTS['prospection'])
  const [expandedAlt, setExpandedAlt]   = useState<'aggressive' | 'soft' | null>(null)

  useEffect(() => {
    setLiked(false)
    setEditing(false)
    setEditedScript(SCRIPTS[callType])
    setExpandedAlt(null)
  }, [callType])

  return (
    <div>
      <ToolIntro
        icon="🎤"
        name="Réplique"
        tagline="Scripts commerciaux générés par IA en 10 secondes"
        desc="Fini le syndrome de la page blanche. Choisis ton contexte, l'IA génère un script personnalisé et adapté à ta cible en quelques secondes."
      />

      <div className="nv-grid2" style={{ display: 'grid', gridTemplateColumns: '0.7fr 1fr', gap: 24 }}>

        {/* Context */}
        <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 16, padding: '20px 22px', alignSelf: 'start' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17', marginBottom: 16 }}>Contexte de l'appel</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9BB5AA', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>Type d'appel</p>
          {[
            { id: 'prospection',    label: 'Prospection froide' },
            { id: 'suivi-meeting',  label: 'Suivi après meeting' },
            { id: 'relance',        label: 'Relance inactif' },
          ].map(ct => (
            <label key={ct.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
              <input type="radio" name="callType" value={ct.id} checked={callType === ct.id} onChange={() => setCallType(ct.id)} style={{ accentColor: '#36a64f', width: 15, height: 15 }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: callType === ct.id ? '#0F1C17' : '#4B6358', fontWeight: callType === ct.id ? 500 : 400 }}>{ct.label}</span>
            </label>
          ))}
          <div style={{ borderTop: '1px solid #E4EEEA', margin: '14px 0' }} />
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9BB5AA', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Cible</p>
          <select style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E4EEEA', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#4B6358', outline: 'none', background: '#fff', marginBottom: 12 }}>
            <option>Directeur commercial</option><option>PDG / Fondateur</option><option>Responsable RH</option><option>DSI</option>
          </select>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9BB5AA', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Secteur</p>
          <select style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E4EEEA', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#4B6358', outline: 'none', background: '#fff' }}>
            <option>Logiciel B2B</option><option>Finance</option><option>Retail</option><option>Industrie</option>
          </select>
        </div>

        {/* Script output */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 16, padding: '20px 22px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#36a64f', boxShadow: '0 0 6px #36a64f' }} />
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17' }}>Script généré ✨</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setEditing(e => !e)}
                  style={{ padding: '5px 10px', border: '1px solid #E4EEEA', borderRadius: 6, fontFamily: "'Inter', sans-serif", fontSize: 12, color: editing ? '#36a64f' : '#4B6358', background: '#fff', cursor: 'pointer', transition: 'color 0.15s' }}
                >
                  {editing ? '✓ Fermer' : '✏️ Éditer'}
                </button>
                <button
                  onClick={() => setLiked(l => !l)}
                  style={{ padding: '5px 10px', border: '1px solid #E4EEEA', borderRadius: 6, fontFamily: "'Inter', sans-serif", fontSize: 12, color: liked ? '#36a64f' : '#4B6358', background: '#fff', cursor: 'pointer', transition: 'color 0.15s' }}
                >
                  {liked ? '♥ Aimé' : '♡ Aimer'}
                </button>
              </div>
            </div>
            {editing ? (
              <textarea
                value={editedScript}
                onChange={e => setEditedScript(e.target.value)}
                style={{ width: '100%', minHeight: 190, padding: 12, border: '1.5px solid #36a64f', borderRadius: 10, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#0F1C17', lineHeight: 1.75, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            ) : (
              <pre style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#0F1C17', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>
                <TypedText key={callType} text={SCRIPTS[callType]} speed={10} />
              </pre>
            )}
          </div>

          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, color: '#9BB5AA', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Alternatives</p>
          {([
            { id: 'aggressive' as const, label: 'Version agressive',   scripts: SCRIPTS_AGGRESSIVE },
            { id: 'soft'       as const, label: 'Version consultative', scripts: SCRIPTS_SOFT },
          ]).map(alt => (
            <div
              key={alt.id}
              className="nv-card-hover"
              onClick={() => setExpandedAlt(expandedAlt === alt.id ? null : alt.id)}
              style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 12, padding: '13px 16px', marginBottom: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#0F1C17' }}>{alt.label}</p>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#36a64f' }}>{expandedAlt === alt.id ? '▲ Fermer' : '▼ Voir'}</span>
              </div>
              {expandedAlt === alt.id && (
                <pre style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#4B6358', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: '12px 0 0', borderTop: '1px solid #E4EEEA', paddingTop: 12 }}>
                  {alt.scripts[callType]}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>

      <FeatureList items={[
        "10+ contextes d'appels pré-définis (prospection, relance, closing…)",
        'IA qui génère le script en temps réel avec effet d\'écriture',
        '3 versions par contexte — soft, standard, agressive',
        'Bibliothèque personnalisée pour sauvegarder tes meilleurs scripts',
      ]} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SIDE HUSTLE
═══════════════════════════════════════════════════════════════════════════ */
function SideHustleSection() {
  const [tasks, setTasks]           = useState(ROADMAP_PHASES.map(p => p.tasks.map(t => t.done)))
  const [editing, setEditing]       = useState(false)
  const [showForecast, setShowForecast] = useState(false)

  const total    = ROADMAP_PHASES.reduce((s, p) => s + p.tasks.length, 0)
  const done     = tasks.flat().filter(Boolean).length
  const progress = Math.round((done / total) * 100)

  const toggleTask = (pi: number, ti: number) =>
    setTasks(prev => prev.map((phase, p) => p === pi ? phase.map((t, i) => i === ti ? !t : t) : phase))

  return (
    <div>
      <ToolIntro
        icon="🚀"
        name="Side Hustle"
        tagline="Lance ton projet parallèle en 90 jours"
        desc="Un framework structuré pour challenger tes hypothèses, construire ta roadmap et projeter ta croissance — sans quitter ton emploi."
      />

      <div className="nv-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Left: roadmap */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, color: '#0F1C17', marginBottom: 3 }}>SaaS CRM pour commerciaux</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9BB5AA' }}>MVP · Construction · {progress}% complété</p>
              </div>
              <div style={{ position: 'relative', width: 48, height: 48 }}>
                <svg width={48} height={48} viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={24} cy={24} r={20} fill="none" stroke="#E4EEEA" strokeWidth={4} />
                  <circle cx={24} cy={24} r={20} fill="none" stroke="#36a64f" strokeWidth={4} strokeDasharray={`${progress * 1.257} 125.7`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.4s' }} />
                </svg>
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 700, color: '#36a64f' }}>{progress}%</span>
              </div>
            </div>
            <div style={{ height: 6, background: '#E4EEEA', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#36a64f', borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
          </div>

          {ROADMAP_PHASES.map((phase, pi) => (
            <div key={pi} style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 14, padding: '16px 18px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17' }}>{phase.title}</p>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9BB5AA', background: '#F7FAF8', padding: '3px 8px', borderRadius: 99 }}>{phase.subtitle}</span>
              </div>
              {phase.tasks.map((task, ti) => (
                <label key={ti} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: ti < phase.tasks.length - 1 ? 9 : 0, cursor: 'pointer' }}>
                  <input type="checkbox" checked={tasks[pi][ti]} onChange={() => toggleTask(pi, ti)} style={{ accentColor: '#36a64f', width: 15, height: 15 }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: tasks[pi][ti] ? '#9BB5AA' : '#0F1C17', textDecoration: tasks[pi][ti] ? 'line-through' : 'none', transition: 'all 0.2s' }}>
                    {task.label}
                  </span>
                </label>
              ))}
            </div>
          ))}
        </div>

        {/* Right: hypotheses + forecast */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17' }}>Hypothèses clés</p>
              <button
                onClick={() => setEditing(e => !e)}
                style={{ background: 'none', border: '1px solid #E4EEEA', borderRadius: 6, padding: '4px 10px', fontFamily: "'Inter', sans-serif", fontSize: 12, color: editing ? '#36a64f' : '#4B6358', cursor: 'pointer', transition: 'color 0.15s' }}
              >
                {editing ? '✓ Enregistrer' : '✏️ Éditer'}
              </button>
            </div>
            {[
              { label: 'Willingness to Pay',    value: '5 000 – 10 000 €/an' },
              { label: 'TAM',                   value: '50 000 commerciaux (EU)' },
              { label: "Coût d'acquisition",    value: '500 € / client' },
              { label: 'Churn mensuel estimé',  value: '< 3 %' },
            ].map(h => (
              <div key={h.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F7FAF8' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#4B6358' }}>{h.label}</p>
                {editing ? (
                  <input defaultValue={h.value} style={{ width: 140, padding: '4px 8px', border: '1px solid #36a64f', borderRadius: 6, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#0F1C17', outline: 'none', textAlign: 'right', background: '#fff' }} />
                ) : (
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#0F1C17' }}>{h.value}</span>
                )}
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 14, padding: '18px 20px' }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17', marginBottom: 14 }}>Prévisionnel financier</p>
            {[
              { month: 'Mois 1',  rev: '0 €',       note: 'développement', clients: 0   },
              { month: 'Mois 3',  rev: '2 000 €',   note: '5 clients',     clients: 5   },
              { month: 'Mois 6',  rev: '15 000 €',  note: '30 clients',    clients: 30  },
              { month: 'Mois 12', rev: '60 000 €',  note: '100 clients',   clients: 100 },
            ].map(row => (
              <div key={row.month} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F7FAF8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9BB5AA', width: 50, flexShrink: 0 }}>{row.month}</span>
                  <div style={{ width: Math.max(4, (row.clients / 100) * 72), height: 5, background: row.clients > 0 ? '#36a64f' : '#E4EEEA', borderRadius: 3, transition: 'width 0.4s' }} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: row.clients > 0 ? '#36a64f' : '#9BB5AA' }}>{row.rev}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9BB5AA' }}>{row.note}</p>
                </div>
              </div>
            ))}
            <button
              onClick={() => setShowForecast(true)}
              style={{ marginTop: 14, width: '100%', padding: 10, background: '#F7FAF8', border: '1px solid #E4EEEA', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#2F5446', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(54,166,79,0.07)'; e.currentTarget.style.borderColor = '#36a64f' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F7FAF8'; e.currentTarget.style.borderColor = '#E4EEEA' }}
            >
              Afficher le graphique détaillé →
            </button>
          </div>
        </div>
      </div>

      <FeatureList items={[
        'Template Roadmap 90 jours pré-rempli et personnalisable',
        '20 hypothèses clés à challenger avec ton marché cible',
        'Prévisionnel financier automatisé selon tes métriques SaaS',
        'Business Model Canvas visuel intégré à ton projet',
      ]} />

      {showForecast && <ForecastModal onClose={() => setShowForecast(false)} />}
    </div>
  )
}

function ForecastModal({ onClose }: { onClose: () => void }) {
  const values = [0, 800, 2000, 4500, 7000, 10000, 15000, 22000, 30000, 40000, 50000, 57000, 60000]
  const max    = 60000

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,28,23,0.52)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: 32, width: 'min(560px, 94vw)', boxShadow: '0 24px 64px rgba(0,0,0,0.16)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 18, color: '#0F1C17' }}>Prévisionnel 12 mois</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9BB5AA', padding: 4 }}>✕</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 140, marginBottom: 8 }}>
          {values.map((v, i) => (
            <div key={i} style={{ flex: 1, height: `${Math.max(3, (v / max) * 130)}px`, background: v > 0 ? `rgba(54,166,79,${0.5 + (i / values.length) * 0.5})` : '#E4EEEA', borderRadius: '3px 3px 0 0', transition: 'height 0.5s' }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          {['M0','M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M12'].map(m => (
            <span key={m} style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, color: '#9BB5AA' }}>{m}</span>
          ))}
        </div>
        <div style={{ padding: '14px 16px', background: '#F7FAF8', borderRadius: 10 }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#4B6358', lineHeight: 1.6 }}>
            Projection basée sur un tarif moyen de <strong style={{ color: '#0F1C17' }}>600 €/mois</strong>, un CAC de <strong style={{ color: '#0F1C17' }}>500 €</strong> et une rétention de <strong style={{ color: '#0F1C17' }}>97%</strong> par mois.
          </p>
        </div>
      </div>
    </div>
  )
}
