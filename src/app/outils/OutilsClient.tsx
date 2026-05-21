'use client'

import { useState, useEffect, useRef } from 'react'

/* ── Types ────────────────────────────────────────────────────────────────── */
type Tab = 'keyaccount' | 'deallink' | 'replique' | 'side-hustle'
type MEDDICItem     = { label: string; done: boolean }
type MEDDICCategory = { key: string; label: string; question: string; items: MEDDICItem[] }
type MEDDICContact  = { id: number; name: string; role: string; tag: string; email: string; meddic: MEDDICCategory[] }

/* ── MEDDIC contacts ──────────────────────────────────────────────────────── */
const INIT_MEDDIC_CONTACTS: MEDDICContact[] = [
  {
    id: 1, name: 'Jean Dupont', role: 'Directeur Commercial', tag: 'Décideur', email: 'jean.dupont@acme-tech.fr',
    meddic: [
      { key: 'M', label: 'Metric',           question: 'Quel budget est disponible ?',          items: [{ label: 'Budget confirmé : 150 k€/an pour CRM', done: true }, { label: 'ROI chiffré sur ancienne solution', done: false }] },
      { key: 'E', label: 'Economic Buyer',   question: 'Est-il le décisionnaire final ?',        items: [{ label: 'Pouvoir de signature confirmé', done: false }, { label: 'Périmètre d\'autorité validé', done: false }] },
      { key: 'D', label: 'Decision Criteria',question: 'Quels sont les critères de décision ?',  items: [{ label: 'Intégration avec la suite existante', done: true }, { label: 'Support en français', done: true }, { label: 'Formation gratuite incluse', done: false }] },
      { key: 'D²',label: 'Decision Process', question: 'Quel est le process d\'achat ?',         items: [{ label: 'Nombre de signataires requis', done: false }, { label: 'Délai de décision estimé', done: false }] },
      { key: 'I', label: 'Identify Pain',    question: 'Quel est le problème principal ?',       items: [{ label: 'Perte de données entre systèmes', done: true }, { label: 'Impact sur le taux de closing chiffré', done: false }] },
      { key: 'C', label: 'Champion',         question: 'Qui nous supporte en interne ?',         items: [{ label: 'Marie Martin identifiée comme sponsor', done: false }, { label: 'Accès aux autres décideurs confirmé', done: false }] },
    ],
  },
  {
    id: 2, name: 'Marie Martin', role: 'Responsable Marketing', tag: 'Influente', email: 'marie.martin@acme-tech.fr',
    meddic: [
      { key: 'M', label: 'Metric',           question: 'Quel budget est disponible ?',    items: [{ label: 'Budget marketing : 50 k€ identifié', done: true }, { label: 'Chiffrage ROI analytics confirmé', done: false }] },
      { key: 'E', label: 'Economic Buyer',   question: 'Est-elle la décisionnaire ?',     items: [{ label: 'Pouvoir d\'influence confirmé', done: true }, { label: 'Rôle dans la validation finale', done: false }] },
      { key: 'D', label: 'Decision Criteria',question: 'Ses critères de choix ?',         items: [{ label: 'Reporting et analytics avancés', done: true }, { label: 'Facilité de prise en main', done: false }] },
      { key: 'D²',label: 'Decision Process', question: 'Sa place dans le process ?',      items: [{ label: 'Alignement avec Jean Dupont confirmé', done: false }, { label: 'Capacité à bloquer la décision', done: false }] },
      { key: 'I', label: 'Identify Pain',    question: 'Son problème principal ?',        items: [{ label: 'Manque de visibilité sur le pipeline', done: true }, { label: 'Impact sur ses objectifs chiffré', done: false }] },
      { key: 'C', label: 'Champion',         question: 'Peut-elle être notre championne ?', items: [{ label: 'Supporte activement la solution', done: true }, { label: 'Prête à nous introduire aux décideurs', done: false }] },
    ],
  },
  {
    id: 3, name: 'Pierre Durand', role: 'Commercial Senior', tag: 'Utilisateur', email: 'pierre.durand@acme-tech.fr',
    meddic: [
      { key: 'M', label: 'Metric',           question: 'Quel budget est disponible ?',    items: [{ label: 'Pas de budget propre identifié', done: false }, { label: 'Capacité à justifier le ROI', done: false }] },
      { key: 'E', label: 'Economic Buyer',   question: 'Rôle financier ?',               items: [{ label: 'Non décisionnaire confirmé', done: false }, { label: 'Influence sur la décision évaluée', done: false }] },
      { key: 'D', label: 'Decision Criteria',question: 'Ses critères ?',                 items: [{ label: 'Facilité d\'utilisation quotidienne', done: true }, { label: 'Intégration avec son CRM actuel', done: false }] },
      { key: 'D²',label: 'Decision Process', question: 'Sa place dans le process ?',      items: [{ label: 'Utilisateur final sans signature', done: false }, { label: 'Son avis est-il pris en compte ?', done: false }] },
      { key: 'I', label: 'Identify Pain',    question: 'Son problème principal ?',        items: [{ label: 'Trop d\'outils à jongler au quotidien', done: true }, { label: 'Temps perdu quantifié', done: false }] },
      { key: 'C', label: 'Champion',         question: 'Peut-il être notre champion ?',   items: [{ label: 'Position dans l\'équipe commerciale', done: false }, { label: 'Intérêt démontré pour la solution', done: false }] },
    ],
  },
]

/* ── Scripts ──────────────────────────────────────────────────────────────── */
const SCRIPTS: Record<string, string> = {
  prospection:      `Bonjour Pierre,\n\nJ'ai vu qu'Acme Tech Solutions développe fortement sa présence en France — votre croissance est remarquable.\n\nNous accompagnons 50+ éditeurs SaaS dans leur développement commercial. En moyenne, nos clients voient leur pipeline progresser de 200% en 6 mois.\n\nVous auriez 15 minutes mardi pour qu'on en parle ?`,
  'suivi-meeting':  `Bonjour Pierre,\n\nJe vous rappelle suite à notre échange de la semaine dernière. Vous m'aviez parlé de vos défis sur le recrutement de commerciaux performants.\n\nJ'ai préparé deux ou trois éléments concrets directement applicables à votre situation.\n\nMardi 14h ou mercredi 10h — lequel vous convient ?`,
  relance:          `Pierre, bonjour.\n\nJe reviens vers vous — ça fait quelques semaines que nous n'avons pas échangé.\n\nVotre concurrent vient de restructurer son équipe commerciale. Si vous aussi souhaitez accélérer, c'est peut-être le bon moment d'en parler.\n\nUne fenêtre cette semaine ?`,
  'objection-prix': `Bonjour Pierre,\n\nJe comprends tout à fait que le budget soit un point de vigilance.\n\nCe que je constate chez nos clients qui avaient la même contrainte au départ : en 3 mois, ils ont récupéré 3 à 5 fois leur investissement grâce à l'augmentation de leur taux de closing.\n\nPeut-on retravailler ensemble la proposition pour l'adapter à votre budget actuel ?`,
}

const SCRIPTS_SOFT: Record<string, string> = {
  prospection:      `Bonjour Pierre,\n\nJe me permets de vous contacter car j'ai découvert le travail d'Acme Tech Solutions — votre approche est vraiment intéressante.\n\nSi vous avez 20 minutes pour un échange, je serais ravi de partager quelques retours d'expérience qui pourraient vous être utiles.\n\nBonne journée à vous,`,
  'suivi-meeting':  `Bonjour Pierre,\n\nJ'espère que notre échange vous a apporté quelques pistes utiles. N'hésitez pas à revenir vers moi quand vous le souhaitez — je reste disponible pour répondre à vos questions.\n\nBelle journée,`,
  relance:          `Bonjour Pierre,\n\nJe voulais juste prendre de vos nouvelles. Nos échanges m'ont beaucoup appris sur les enjeux de votre secteur.\n\nSi un jour vous souhaitez approfondir, je serai là. En attendant, bonne continuation !`,
  'objection-prix': `Bonjour Pierre,\n\nJe comprends totalement. Le budget est toujours une contrainte réelle.\n\nSi vous le souhaitez, on pourrait voir ensemble comment adapter la solution à votre situation — il y a peut-être des ajustements possibles.\n\nQu'en pensez-vous ?`,
}

const SCRIPTS_AGGRESSIVE: Record<string, string> = {
  prospection:      `Pierre, bonjour.\n\nVotre concurrent vient de signer avec nous. En 3 mois, leur CA a progressé de 30%.\n\nJe vous appelle avant qu'ils prennent trop d'avance. Mardi 14h, ça vous convient ?`,
  'suivi-meeting':  `Pierre, suite à notre meeting — j'ai une offre limitée à 2 clients ce trimestre.\n\nJe veux vous en réserver une. On valide ça cette semaine ?\n\nJeudi ou vendredi ?`,
  relance:          `Pierre.\n\nMa pipeline est pleine en juin. Il me reste 1 slot pour un partenariat stratégique ce mois-ci.\n\nVous êtes dans ma shortlist. C'est oui ou non ?`,
  'objection-prix': `Pierre, le prix n'est jamais le vrai problème.\n\nLa question : qu'est-ce que ça vous coûte de ne rien changer ? Calculons-le ensemble.\n\nMercredi 10h, on fait le calcul ROI en 15 minutes. Ça vous convient ?`,
}

/* ── BMC ──────────────────────────────────────────────────────────────────── */
const BMC_INIT = [
  { key: 'partners',  title: 'Partenaires clés',       row: '1 / 3', col: '1 / 2', items: ['Développeurs freelance', 'Intégrateurs SaaS', 'Revendeurs'] },
  { key: 'activities',title: 'Activités clés',          row: '1 / 2', col: '2 / 3', items: ['Développement produit', 'Support client', 'Marketing contenu'] },
  { key: 'resources', title: 'Ressources clés',         row: '2 / 3', col: '2 / 3', items: ['Équipe technique', 'Base de données', 'Réputation'] },
  { key: 'value',     title: 'Proposition de valeur',   row: '1 / 3', col: '3 / 4', items: ['Centralise les données CRM', 'Intégration temps réel', 'Prix accessible'] },
  { key: 'relations', title: 'Relations clients',       row: '1 / 2', col: '4 / 5', items: ['Support chat 24/7', 'Onboarding guidé', 'Communauté'] },
  { key: 'channels',  title: 'Canaux',                  row: '2 / 3', col: '4 / 5', items: ['Site web + SEO', 'Partenariats', 'Bouche à oreille'] },
  { key: 'segments',  title: 'Segments clients',        row: '1 / 3', col: '5 / 6', items: ['PME 10-200 sal.', 'Startups B2B', 'Équipes commerciales'] },
  { key: 'costs',     title: 'Structure de coûts',      row: '3 / 4', col: '1 / 4', items: ['Dev & infra : ~2 000€/m', 'Marketing : ~500€/m', 'Support & ops : ~300€/m'] },
  { key: 'revenues',  title: 'Sources de revenus',      row: '3 / 4', col: '4 / 6', items: ['Abonnement mensuel', 'Formule annuelle (−20%)', 'Formation (à venir)'] },
]

const ROADMAP_PHASES = [
  { title: 'Phase 1 — Validation MVP', subtitle: 'Mois 1',  tasks: [{ label: 'Interviews 10 utilisateurs', done: true }, { label: 'Prototype low-fidelity', done: true }, { label: 'Tester avec 5 bêta-utilisateurs', done: false }] },
  { title: 'Phase 2 — Lancement',      subtitle: 'Mois 2-3', tasks: [{ label: 'Développer la v1', done: false }, { label: 'Landing page + pricing', done: false }, { label: '10 premiers clients payants', done: false }] },
  { title: 'Phase 3 — Croissance',     subtitle: 'Mois 4+',  tasks: [{ label: '100+ utilisateurs actifs', done: false }, { label: '5 000€ MRR', done: false }, { label: 'Levée de fonds / Partenaires', done: false }] },
]

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function initials(name: string) { return name.split(' ').map(n => n[0]).join('').toUpperCase() }

function meddic_score(contact: MEDDICContact) {
  return contact.meddic.filter(cat => cat.items.some(i => i.done)).length
}

function computeForecasts(price: number, convRate: number, lifetime: number, cac: number, fixedCosts: number) {
  const budget = fixedCosts * 0.35
  const baseNew = Math.max(0.5, budget / cac)
  let customers = 0
  const all: { m: number; mrr: number; cumul: number }[] = []
  let cumul = 0
  for (let m = 1; m <= 24; m++) {
    if (m === 1) { all.push({ m, mrr: 0, cumul: 0 }); continue }
    const newCust = baseNew * (1 + (m - 2) * 0.1) * (convRate / 2)
    const churn   = customers / (lifetime * 1.2)
    customers = Math.max(0, customers + newCust - churn)
    const mrr = Math.round(customers) * price
    cumul += mrr
    all.push({ m, mrr, cumul })
  }
  return [1, 2, 3, 6, 12, 24].map(m => {
    const d = all.find(x => x.m === m)!
    const status = d.mrr === 0 ? 'Développement' : d.mrr < fixedCosts * 0.3 ? 'Lancement' : d.mrr < fixedCosts ? 'Croissance' : d.mrr < fixedCosts * 2 ? 'Scaling' : 'Rentable'
    return { ...d, status }
  })
}

/* ── Shared components ────────────────────────────────────────────────────── */
function TypedText({ text, speed = 11 }: { text: string; speed?: number }) {
  const [shown, setShown] = useState('')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    setShown(''); let i = 0
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => { i++; setShown(text.slice(0, i)); if (i >= text.length && timer.current) clearInterval(timer.current) }, speed)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [text, speed])
  return <>{shown}</>
}

function ToolIntro({ name, tagline, desc }: { name: string; tagline: string; desc: string }) {
  return (
    <div style={{ marginBottom: 44 }}>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9BB5AA' }}>{name}</span>
      <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 'clamp(22px, 3vw, 34px)', color: '#0F1C17', lineHeight: 1.2, margin: '10px 0 14px' }}>{tagline}</h2>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: '#4B6358', lineHeight: 1.7, maxWidth: 560 }}>{desc}</p>
    </div>
  )
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <div style={{ marginTop: 36, padding: '22px 28px', background: '#fff', borderRadius: 16, border: '1px solid #E4EEEA' }}>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9BB5AA', marginBottom: 14 }}>Fonctionnalités</p>
      {items.map((item, i) => {
        const coming = item.startsWith('À venir')
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < items.length - 1 ? 10 : 0 }}>
            <span style={{ color: coming ? '#9BB5AA' : '#36a64f', fontWeight: 700, fontSize: 14, lineHeight: 1.5, flexShrink: 0 }}>{coming ? '✗' : '✓'}</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: coming ? '#9BB5AA' : '#0F1C17', lineHeight: 1.6, fontStyle: coming ? 'italic' : 'normal' }}>{item}</span>
          </div>
        )
      })}
    </div>
  )
}

function Btn({ children, onClick, primary, small, style: extStyle }: { children: React.ReactNode; onClick?: () => void; primary?: boolean; small?: boolean; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: small ? '6px 12px' : '10px 16px', border: `1.5px solid ${primary ? '#2F5446' : '#E4EEEA'}`, borderRadius: 8, background: primary ? '#2F5446' : '#fff', fontFamily: "'Inter', sans-serif", fontSize: small ? 12 : 13, fontWeight: primary ? 600 : 400, color: primary ? '#fff' : '#4B6358', cursor: 'pointer', transition: 'all 0.2s', ...extStyle }}
      onMouseEnter={e => { e.currentTarget.style.background = primary ? '#244336' : 'rgba(54,166,79,0.06)'; e.currentTarget.style.borderColor = primary ? '#244336' : '#36a64f'; if (!primary) e.currentTarget.style.color = '#36a64f' }}
      onMouseLeave={e => { e.currentTarget.style.background = primary ? '#2F5446' : '#fff'; e.currentTarget.style.borderColor = primary ? '#2F5446' : '#E4EEEA'; if (!primary) e.currentTarget.style.color = '#4B6358' }}
    >
      {children}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════════════════ */
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

  const TABS: { id: Tab; label: string }[] = [
    { id: 'keyaccount',  label: 'Keyaccount'  },
    { id: 'deallink',    label: 'Deallink'    },
    { id: 'replique',    label: 'Réplique'    },
    { id: 'side-hustle', label: 'Side Hustle' },
  ]

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#0F1C17', background: '#F7FAF8', minHeight: '100vh' }}>
      <style>{`
        * { box-sizing: border-box; }
        a { text-decoration: none; }
        .nv-hover { transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s !important; }
        .nv-hover:hover { transform: translateY(-3px) !important; box-shadow: 0 6px 24px rgba(54,166,79,0.12) !important; border-color: #36a64f !important; }
        .nv-tab { background: none; border: none; cursor: pointer; outline: none; }
        .nv-tab:hover .tab-lbl { color: #36a64f !important; }
        input[type=range] { -webkit-appearance: none; appearance: none; height: 4px; background: #E4EEEA; border-radius: 2px; outline: none; width: 100%; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #36a64f; cursor: pointer; }
        input[type=range]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #36a64f; border: none; cursor: pointer; }
        @media (max-width: 768px) {
          .hero-sec { padding: 52px 20px 36px !important; }
          .tabs-nav  { padding: 0 12px !important; overflow-x: auto; gap: 0 !important; }
          .nv-tab    { padding: 12px 12px !important; white-space: nowrap; }
          .tool-wrap { padding: 32px 20px !important; }
          .g2 { grid-template-columns: 1fr !important; }
          .g3 { grid-template-columns: 1fr 1fr !important; }
          .bmc-grid { grid-template-columns: 1fr 1fr !important; grid-template-rows: auto !important; }
          .bmc-grid > div { grid-column: auto !important; grid-row: auto !important; }
        }
      `}</style>

      {/* Header */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 64, background: scrolled ? 'rgba(255,255,255,0.95)' : '#fff', backdropFilter: scrolled ? 'blur(8px)' : 'none', WebkitBackdropFilter: scrolled ? 'blur(8px)' : 'none', borderBottom: '1px solid #E4EEEA', transition: 'background 0.2s' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/icon_margin_transparent_customcolor.png" alt="NV" style={{ height: 40, width: 40, objectFit: 'contain' }} onError={e => (e.currentTarget.style.display = 'none')} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '.09em', color: '#2F5446', textTransform: 'uppercase' }}>NOUVEAU VARIABLE</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="/outils" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, color: '#36a64f', borderBottom: '1.5px solid #36a64f', paddingBottom: 1 }}>Outils</a>
          <a href="/#candidature" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13, color: '#fff', background: '#2F5446', borderRadius: 99, padding: '9px 20px', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = '#244336')} onMouseLeave={e => (e.currentTarget.style.background = '#2F5446')}>Candidater →</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-sec" style={{ padding: '80px 40px 52px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <span style={{ display: 'inline-block', fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9BB5AA', marginBottom: 18 }}>Suite d'outils NV</span>
        <h1 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 'clamp(30px, 5vw, 52px)', lineHeight: 1.1, color: '#0F1C17', marginBottom: 18 }}>
          Les Outils de <span style={{ color: '#36a64f' }}>Nouveau Variable</span>
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, lineHeight: 1.7, color: '#4B6358', maxWidth: 420, margin: '0 auto' }}>
          Tout ce dont tu as besoin pour progresser commercialement.
        </p>
      </section>

      {/* Tabs */}
      <div style={{ position: 'sticky', top: 64, zIndex: 90, background: '#fff', borderBottom: '1px solid #E4EEEA', borderTop: '1px solid #E4EEEA' }}>
        <div className="tabs-nav" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px', display: 'flex', gap: 4 }}>
          {TABS.map(t => (
            <button key={t.id} className="nv-tab" onClick={() => switchTab(t.id)} style={{ padding: '14px 24px', borderBottom: `2px solid ${activeTab === t.id ? '#36a64f' : 'transparent'}`, transition: 'border-color 0.2s' }}>
              <span className="tab-lbl" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: activeTab === t.id ? 600 : 500, color: activeTab === t.id ? '#36a64f' : '#4B6358', transition: 'color 0.2s' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="tool-wrap" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: 'opacity 0.22s, transform 0.22s', minHeight: '60vh', maxWidth: 1100, margin: '0 auto', padding: '56px 40px' }}>
        {activeTab === 'keyaccount'  && <KeyaccountSection />}
        {activeTab === 'deallink'    && <DeallinkSection />}
        {activeTab === 'replique'    && <RepliqueSection />}
        {activeTab === 'side-hustle' && <SideHustleSection />}
      </div>

      {/* CTA */}
      <section style={{ padding: '80px 40px', textAlign: 'center', background: '#fff', borderTop: '1px solid #E4EEEA' }}>
        <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 'clamp(22px, 4vw, 34px)', color: '#0F1C17', marginBottom: 14 }}>Prêt à utiliser ces outils ?</h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: '#4B6358', marginBottom: 34 }}>Ces outils sont réservés aux membres Nouveau Variable.</p>
        <a href="/#candidature" style={{ display: 'inline-block', fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 15, color: '#fff', background: '#2F5446', borderRadius: 99, padding: '16px 40px', boxShadow: '0 4px 20px rgba(47,84,70,.2)', transition: 'background 0.2s, transform 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = '#244336'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.background = '#2F5446'; e.currentTarget.style.transform = 'translateY(0)' }}>
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
  const [contacts, setContacts] = useState<MEDDICContact[]>(INIT_MEDDIC_CONTACTS)
  const [selected, setSelected] = useState<MEDDICContact | null>(null)

  const tagColor = (tag: string) => tag === 'Décideur' ? '#36a64f' : tag === 'Influente' ? '#2F5446' : '#4B6358'
  const tagBg    = (tag: string) => tag === 'Décideur' ? 'rgba(54,166,79,0.1)' : tag === 'Influente' ? 'rgba(47,84,70,0.08)' : '#F7FAF8'

  return (
    <div>
      <ToolIntro
        name="Keyaccount"
        tagline="Cartographie tes comptes B2B avec la méthode MEDDIC"
        desc="Organise tes comptes clés, identifie les contacts décisionnaires et qualifie chaque interlocuteur selon les 6 critères MEDDIC pour avancer efficacement."
      />

      {/* Company card */}
      <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 14, padding: '20px 24px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 18, color: '#0F1C17', marginBottom: 8 }}>ACME Tech Solutions</h3>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[['Secteur', 'Technologie'], ['Taille', '45-50 salariés'], ['CA', '2,5 M€'], ['Localisation', 'Île-de-France']].map(([k, v]) => (
                <span key={k} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#4B6358' }}><span style={{ color: '#9BB5AA' }}>{k} : </span>{v}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn small>Vue détaillée</Btn>
            <Btn small>Éditer</Btn>
          </div>
        </div>
      </div>

      {/* Mind map */}
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9BB5AA', marginBottom: 20 }}>Structure décisionnelle</p>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ padding: '9px 22px', background: '#2F5446', color: '#fff', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600 }}>ACME Tech Solutions</div>
        <div style={{ width: 2, height: 20, background: '#E4EEEA' }} />
        <div style={{ display: 'flex', width: '100%', maxWidth: 680, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: '17%', right: '17%', height: 2, background: '#E4EEEA' }} />
          {contacts.map((c) => {
            const score = meddic_score(c)
            return (
              <div key={c.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 20, background: '#E4EEEA' }} />
                <button
                  onClick={() => setSelected(c)}
                  className="nv-hover"
                  style={{ padding: '14px 16px', background: '#fff', border: '1px solid #E4EEEA', borderRadius: 12, cursor: 'pointer', width: '78%', textAlign: 'center' }}
                >
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17', marginBottom: 3 }}>{c.name.split(' ')[0]}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9BB5AA', marginBottom: 7 }}>{c.role}</p>
                  <span style={{ padding: '2px 8px', background: tagBg(c.tag), color: tagColor(c.tag), fontSize: 10, fontWeight: 600, borderRadius: 99, fontFamily: "'Inter', sans-serif" }}>{c.tag}</span>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    {[0,1,2,3,4,5].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: i < score ? '#36a64f' : '#E4EEEA' }} />)}
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: score >= 4 ? '#36a64f' : '#9BB5AA', marginLeft: 4 }}>{score}/6</span>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* MEDDIC list */}
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9BB5AA', marginBottom: 12 }}>Qualification MEDDIC</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {contacts.map(c => {
          const score = meddic_score(c)
          return (
            <button key={c.id} className="nv-hover" onClick={() => setSelected(c)} style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 12, padding: '16px 20px', textAlign: 'left', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #C8DDD5, #9BB5AA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#2F5446', flexShrink: 0 }}>{initials(c.name)}</div>
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: '#0F1C17', marginBottom: 2 }}>{c.name}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9BB5AA' }}>{c.role} · <span style={{ color: tagColor(c.tag) }}>{c.tag}</span></p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 3 }}>{[0,1,2,3,4,5].map(i => <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: i < score ? '#36a64f' : '#E4EEEA' }} />)}</div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#4B6358', whiteSpace: 'nowrap' }}>{score}/6 — {Math.round(score/6*100)}% qualifié</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#36a64f' }}>Voir →</span>
              </div>
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn small>+ Ajouter un contact</Btn>
        <Btn small>Export PDF</Btn>
        <Btn small>Notes</Btn>
      </div>

      <FeatureList items={['Cartographie visuelle de tes comptes clés (mind map)', 'Qualification MEDDIC pour chaque contact (6 critères)', 'Suivi des interactions et notes personnalisées', 'Export PDF du compte et de la qualification']} />

      {selected && (
        <MEDDICModal
          contact={selected}
          onClose={() => setSelected(null)}
          onUpdate={updated => { setContacts(p => p.map(c => c.id === updated.id ? updated : c)); setSelected(updated) }}
        />
      )}
    </div>
  )
}

function MEDDICModal({ contact, onClose, onUpdate }: { contact: MEDDICContact; onClose: () => void; onUpdate: (c: MEDDICContact) => void }) {
  const [local, setLocal] = useState<MEDDICContact>(contact)
  const score = meddic_score(local)

  const toggle = (ci: number, ii: number) => {
    const updated: MEDDICContact = { ...local, meddic: local.meddic.map((cat, c) => c === ci ? { ...cat, items: cat.items.map((item, i) => i === ii ? { ...item, done: !item.done } : item) } : cat) }
    setLocal(updated); onUpdate(updated)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,28,23,0.52)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', width: 'min(580px, 94vw)', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.16)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 18, color: '#0F1C17' }}>{local.name}</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#4B6358' }}>{local.role} · {local.email}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9BB5AA', padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: '12px 16px', background: score >= 4 ? 'rgba(54,166,79,0.07)' : '#F7FAF8', borderRadius: 10, marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17' }}>Score MEDDIC : {score}/6 — {Math.round(score/6*100)}% qualifié</span>
          <div style={{ display: 'flex', gap: 4 }}>{[0,1,2,3,4,5].map(i => <div key={i} style={{ width: 18, height: 18, borderRadius: 4, background: i < score ? '#36a64f' : '#E4EEEA' }} />)}</div>
        </div>
        {local.meddic.map((cat, ci) => (
          <div key={cat.key} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: ci < local.meddic.length - 1 ? '1px solid #F7FAF8' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#36a64f', background: 'rgba(54,166,79,0.1)', padding: '2px 7px', borderRadius: 4 }}>{cat.key}</span>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17' }}>{cat.label}</p>
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9BB5AA', marginBottom: 10 }}>{cat.question}</p>
            {cat.items.map((item, ii) => (
              <label key={ii} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={item.done} onChange={() => toggle(ci, ii)} style={{ accentColor: '#36a64f', width: 15, height: 15, marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: item.done ? '#0F1C17' : '#4B6358', lineHeight: 1.4 }}>{item.label}</span>
              </label>
            ))}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <Btn primary onClick={onClose} style={{ flex: 1 }}>Ajouter un RDV</Btn>
          <Btn onClick={onClose} style={{ flex: 1 }}>Fermer</Btn>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEALLINK
═══════════════════════════════════════════════════════════════════════════ */
function DeallinkSection() {
  const [prospect, setProspect]     = useState('ACME Tech Solutions')
  const [prénom,   setPrénom]       = useState('Jean')
  const [title,    setTitle]        = useState('Augmenter le CA de 20-30% — ACME')
  const [desc,     setDesc]         = useState("Travaillons ensemble à développer votre activité commerciale grâce au réseau Nouveau Variable.")
  const [design,   setDesign]       = useState<'Minimal' | 'Premium' | 'Sombre'>('Minimal')
  const [link,     setLink]         = useState<string | null>(null)
  const [copied,   setCopied]       = useState(false)

  const isDark = design === 'Sombre', isPrem = design === 'Premium'
  const bg     = isDark ? '#0F1C17' : isPrem ? 'linear-gradient(135deg,#F0F7F3,#fff)' : '#fff'
  const txt    = isDark ? '#fff' : '#0F1C17'
  const sub    = isDark ? 'rgba(255,255,255,0.65)' : '#4B6358'
  const div2   = isDark ? 'rgba(255,255,255,0.1)' : '#E4EEEA'
  const slug   = `${prénom.toLowerCase()}-${prospect.toLowerCase().replace(/\s+/g,'-').slice(0,10)}`

  const generate = () => setLink(`https://deallink.nouveauvariable.fr/${slug}`)
  const copy     = () => { if (link) { navigator.clipboard.writeText(link).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false), 2000) } }

  const Field = ({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9BB5AA', display: 'block', marginBottom: 5 }}>{label}</label>
      {rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E4EEEA', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#0F1C17', outline: 'none', resize: 'none', transition: 'border-color 0.2s', background: '#fff', boxSizing: 'border-box' }} onFocus={e=>(e.target.style.borderColor='#36a64f')} onBlur={e=>(e.target.style.borderColor='#E4EEEA')} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E4EEEA', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#0F1C17', outline: 'none', transition: 'border-color 0.2s', background: '#fff', boxSizing: 'border-box' }} onFocus={e=>(e.target.style.borderColor='#36a64f')} onBlur={e=>(e.target.style.borderColor='#E4EEEA')} />
      )}
    </div>
  )

  const StepLabel = ({ n, label }: { n: number; label: string }) => (
    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17', marginBottom: 16 }}>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: '#36a64f', background: 'rgba(54,166,79,0.1)', padding: '2px 7px', borderRadius: 99, marginRight: 8 }}>{n}</span>
      {label}
    </p>
  )

  return (
    <div>
      <ToolIntro name="Deallink" tagline="Crée une page de vente personnalisée en 2 minutes" desc="Remplis quelques champs, choisis un design, et envoie un lien unique à ton prospect. Ta page se génère automatiquement avec ton calendrier de disponibilités." />

      <div className="g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Form */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 14, padding: '20px 22px', marginBottom: 12 }}>
            <StepLabel n={1} label="Infos de base" />
            <Field label="Nom du prospect" value={prospect} onChange={setProspect} />
            <Field label="Ton prénom" value={prénom} onChange={setPrénom} />
            <Field label="Titre de la proposition" value={title} onChange={setTitle} />
            <Field label="Description (optionnel)" value={desc} onChange={setDesc} rows={2} />
          </div>

          <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 14, padding: '20px 22px', marginBottom: 12 }}>
            <StepLabel n={2} label="Personnalisation" />
            <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9BB5AA', display: 'block', marginBottom: 8 }}>Design</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['Minimal', 'Premium', 'Sombre'] as const).map(d => (
                <button key={d} onClick={() => setDesign(d)} style={{ flex: 1, padding: '8px', border: `1.5px solid ${design === d ? '#36a64f' : '#E4EEEA'}`, borderRadius: 8, background: design === d ? 'rgba(54,166,79,0.07)' : '#fff', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: design === d ? 600 : 400, color: design === d ? '#36a64f' : '#4B6358', cursor: 'pointer', transition: 'all 0.2s' }}>{d}</button>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 14, padding: '20px 22px' }}>
            <StepLabel n={3} label="Générer et partager" />
            <button onClick={generate} style={{ width: '100%', padding: '11px', background: '#2F5446', color: '#fff', border: 'none', borderRadius: 10, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, cursor: 'pointer', marginBottom: 8, transition: 'background 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.background='#244336')} onMouseLeave={e=>(e.currentTarget.style.background='#2F5446')}>Générer mon lien</button>
            {link && (
              <div style={{ background: '#F7FAF8', border: '1px solid #E4EEEA', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#36a64f', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{link}</p>
                <button onClick={copy} style={{ flexShrink: 0, padding: '5px 10px', background: copied ? '#36a64f' : '#fff', border: '1.5px solid #E4EEEA', borderRadius: 6, fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: copied ? '#fff' : '#4B6358', cursor: 'pointer', transition: 'all 0.2s' }}>{copied ? '✓ Copié' : 'Copier'}</button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: '#F7FAF8', border: '1px solid #E4EEEA', borderRadius: 8 }}>
              <span style={{ color: '#9BB5AA', fontSize: 13 }}>✗</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9BB5AA', fontStyle: 'italic' }}>À venir : Voir qui a cliqué sur mon lien</span>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: '#9BB5AA', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Aperçu en temps réel</p>
          <div style={{ border: '1px solid #E4EEEA', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid #E4EEEA', display: 'flex', alignItems: 'center', gap: 8 }}>
              {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
              <div style={{ flex: 1, background: '#F7FAF8', borderRadius: 6, padding: '4px 10px', marginLeft: 6 }}><p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#9BB5AA' }}>deallink.nouveauvariable.fr/{slug}</p></div>
            </div>
            <div style={{ padding: '24px 22px', background: bg, transition: 'background 0.3s', minHeight: 360 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: '#36a64f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff' }}>{(prénom || 'J').slice(0,2).toUpperCase()}</div>
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: txt, transition: 'color 0.3s' }}>{prénom || 'Jean'}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: sub, transition: 'color 0.3s' }}>Commercial @ Nouveau Variable</p>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${div2}`, margin: '12px 0' }} />
              <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 15, color: txt, marginBottom: 8, lineHeight: 1.3, transition: 'color 0.3s' }}>{title || 'Ma proposition'}</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: sub, lineHeight: 1.6, marginBottom: 16, transition: 'color 0.3s' }}>{desc}</p>
              <div style={{ borderTop: `1px solid ${div2}`, margin: '12px 0' }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.4)' : '#9BB5AA', letterSpacing: '.08em', marginBottom: 10 }}>PRENDRE UN RDV AVEC {(prénom || 'JEAN').toUpperCase()}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {['Lundi 14h','Mardi 10h','Mercredi 15h','Jeudi 11h'].map(s => (
                  <button key={s} style={{ padding: '5px 10px', border: `1px solid ${div2}`, borderRadius: 6, background: 'transparent', fontFamily: "'Inter', sans-serif", fontSize: 11, color: sub, cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='#36a64f';e.currentTarget.style.color='#36a64f'}} onMouseLeave={e=>{e.currentTarget.style.borderColor=div2;e.currentTarget.style.color=sub}}>{s}</button>
                ))}
              </div>
              <button style={{ width: '100%', padding: '9px', background: '#36a64f', color: '#fff', border: 'none', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Envoyer un message</button>
            </div>
          </div>
        </div>
      </div>

      <FeatureList items={['Crée une page de vente en 2 minutes (aucun code requis)', 'Designs modernes et entièrement personnalisables', 'Calendrier intégré pour tes disponibilités', 'Partage facile par lien ou par email', 'À venir : Tracking des clics et conversions']} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   RÉPLIQUE
═══════════════════════════════════════════════════════════════════════════ */
function RepliqueSection() {
  const [callType,     setCallType]     = useState('suivi-meeting')
  const [editing,      setEditing]      = useState(false)
  const [editedScript, setEditedScript] = useState(SCRIPTS['suivi-meeting'])
  const [hoveredAlt,   setHoveredAlt]   = useState<'soft' | 'aggressive' | null>(null)
  const [expandedAlt,  setExpandedAlt]  = useState<'soft' | 'aggressive' | null>(null)
  const [regenKey,     setRegenKey]     = useState(0)
  const [copied,       setCopied]       = useState(false)

  useEffect(() => { setEditing(false); setEditedScript(SCRIPTS[callType]); setHoveredAlt(null); setExpandedAlt(null) }, [callType])

  const previewScript = hoveredAlt === 'soft' ? SCRIPTS_SOFT[callType] : hoveredAlt === 'aggressive' ? SCRIPTS_AGGRESSIVE[callType] : null
  const mainScript    = editing ? editedScript : SCRIPTS[callType]

  const copy = () => { navigator.clipboard.writeText(previewScript ?? mainScript).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false), 2000) }

  return (
    <div>
      <ToolIntro name="Réplique" tagline="Scripts commerciaux générés en 10 secondes" desc="Choisis ton contexte d'appel, l'outil génère un script personnalisé adapté à ta cible. Trois versions disponibles : professionnelle, consultative et directe." />

      <div className="g2" style={{ display: 'grid', gridTemplateColumns: '0.65fr 1fr', gap: 24 }}>

        {/* Config */}
        <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 16, padding: '20px 22px', alignSelf: 'start' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17', marginBottom: 16 }}><span style={{ color: '#36a64f', marginRight: 6 }}>1.</span>Configure ton script</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9BB5AA', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>Type d'appel</p>
          {[['prospection','Prospection froide'],['suivi-meeting','Suivi après meeting'],['relance','Relance inactif'],['objection-prix','Objection prix']].map(([id, label]) => (
            <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
              <input type="radio" name="callType" value={id} checked={callType === id} onChange={() => setCallType(id)} style={{ accentColor: '#36a64f', width: 15, height: 15 }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: callType === id ? '#0F1C17' : '#4B6358', fontWeight: callType === id ? 500 : 400 }}>{label}</span>
            </label>
          ))}
          <div style={{ borderTop: '1px solid #E4EEEA', margin: '14px 0' }} />
          {[
            { label: 'Cible',          opts: ['Directeur commercial', 'PDG / Fondateur', 'Responsable RH', 'DSI'] },
            { label: "Secteur d'activité", opts: ['Logiciel B2B', 'Finance', 'Retail', 'Industrie'] },
            { label: 'Ton objectif',   opts: ['Obtenir un RDV de 30 min', 'Proposer une démo', 'Closer', 'Qualifier le besoin'] },
          ].map(s => (
            <div key={s.label} style={{ marginBottom: 12 }}>
              <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9BB5AA', display: 'block', marginBottom: 5 }}>{s.label}</label>
              <select style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E4EEEA', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#4B6358', outline: 'none', background: '#fff' }}>
                {s.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Script + alternatives */}
        <div>
          {/* Main script */}
          <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 16, padding: '20px 22px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: '#36a64f', background: 'rgba(54,166,79,0.1)', padding: '2px 7px', borderRadius: 99 }}>2.</span>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17' }}>
                  {hoveredAlt === 'soft' ? 'Version consultative' : hoveredAlt === 'aggressive' ? 'Version directe' : 'Version professionnelle'}
                </p>
                {hoveredAlt && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9BB5AA', fontStyle: 'italic' }}>aperçu</span>}
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {[
                  { label: copied ? '✓ Copié' : 'Copier', action: copy },
                  { label: editing ? '✓ Fermer' : '✏️ Éditer', action: () => setEditing(e => !e) },
                  { label: '↻ Régénérer', action: () => setRegenKey(k => k + 1) },
                ].map(b => (
                  <button key={b.label} onClick={b.action} style={{ padding: '5px 10px', border: '1px solid #E4EEEA', borderRadius: 6, fontFamily: "'Inter', sans-serif", fontSize: 12, color: b.label.includes('✓') ? '#36a64f' : '#4B6358', background: '#fff', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s' }} onMouseEnter={e=>{e.currentTarget.style.color='#36a64f';e.currentTarget.style.borderColor='#36a64f'}} onMouseLeave={e=>{e.currentTarget.style.color=b.label.includes('✓')?'#36a64f':'#4B6358';e.currentTarget.style.borderColor='#E4EEEA'}}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            {editing && !hoveredAlt ? (
              <textarea value={editedScript} onChange={e => setEditedScript(e.target.value)} style={{ width: '100%', minHeight: 180, padding: 12, border: '1.5px solid #36a64f', borderRadius: 10, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#0F1C17', lineHeight: 1.8, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            ) : (
              <pre style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#0F1C17', lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0, opacity: hoveredAlt ? 0.7 : 1, transition: 'opacity 0.2s', minHeight: 140 }}>
                {previewScript ?? <TypedText key={`${callType}-${regenKey}`} text={SCRIPTS[callType]} speed={10} />}
              </pre>
            )}
          </div>

          {/* Alternatives */}
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, color: '#9BB5AA', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            3. Autres versions — survoler pour aperçu
          </p>
          <div className="g3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {([
              { id: 'soft'       as const, label: 'Version consultative', scripts: SCRIPTS_SOFT },
              { id: 'aggressive' as const, label: 'Version directe',      scripts: SCRIPTS_AGGRESSIVE },
            ]).map(alt => (
              <div key={alt.id} className="nv-hover" onMouseEnter={() => setHoveredAlt(alt.id)} onMouseLeave={() => setHoveredAlt(null)} onClick={() => setExpandedAlt(expandedAlt === alt.id ? null : alt.id)} style={{ background: '#fff', border: `1px solid ${hoveredAlt === alt.id ? '#36a64f' : '#E4EEEA'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#0F1C17' }}>{alt.label}</p>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#36a64f' }}>{expandedAlt === alt.id ? '▲' : '▼ Voir'}</span>
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9BB5AA', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                  {alt.scripts[callType].split('\n')[0]}...
                </p>
                {expandedAlt === alt.id && (
                  <pre style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#4B6358', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: '12px 0 0', borderTop: '1px solid #E4EEEA', paddingTop: 12 }}>{alt.scripts[callType]}</pre>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: '#F7FAF8', border: '1px solid #E4EEEA', borderRadius: 8 }}>
            <span style={{ color: '#9BB5AA', fontSize: 13 }}>✗</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9BB5AA', fontStyle: 'italic' }}>À venir : Sauvegarder tes scripts favoris</span>
          </div>
        </div>
      </div>

      <FeatureList items={["10+ contextes d'appels prédéfinis (prospection, relance, objections…)", "Génération en temps réel avec animation d'écriture", "3 versions par contexte — consultative, professionnelle, directe", "Édition facile de chaque script généré", "À venir : Sauvegarde de favoris personnalisés"]} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SIDE HUSTLE
═══════════════════════════════════════════════════════════════════════════ */
function SideHustleSection() {
  const [tasks,    setTasks]    = useState(ROADMAP_PHASES.map(p => p.tasks.map(t => t.done)))
  const [bmcData,  setBmcData]  = useState(BMC_INIT.map(c => ({ ...c, items: [...c.items] })))
  const [editBmc,  setEditBmc]  = useState(false)
  const [showChart,setShowChart]= useState(false)

  // Forecast sliders
  const [price,    setPrice]    = useState(49)
  const [conv,     setConv]     = useState(2)
  const [lifetime, setLifetime] = useState(12)
  const [cac,      setCac]      = useState(300)
  const [fixed,    setFixed]    = useState(1500)

  const forecasts = computeForecasts(price, conv, lifetime, cac, fixed)

  const total    = ROADMAP_PHASES.reduce((s, p) => s + p.tasks.length, 0)
  const done     = tasks.flat().filter(Boolean).length
  const progress = Math.round((done / total) * 100)

  const toggleTask = (pi: number, ti: number) =>
    setTasks(p => p.map((phase, i) => i === pi ? phase.map((t, j) => j === ti ? !t : t) : phase))

  const SliderField = ({ label, value, min, max, step, fmt, onChange }: { label: string; value: number; min: number; max: number; step: number; fmt: (v: number) => string; onChange: (v: number) => void }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#4B6358' }}>{label}</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17' }}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: '#36a64f' }} />
    </div>
  )

  return (
    <div>
      <ToolIntro name="Side Hustle" tagline="Lance ton projet parallèle en 90 jours" desc="Un framework structuré pour challenger tes hypothèses, construire ta roadmap et projeter ta croissance financière — sans quitter ton emploi." />

      {/* Roadmap */}
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9BB5AA', marginBottom: 12 }}>Roadmap par phase</p>

      <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 14, padding: '18px 20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, color: '#0F1C17', marginBottom: 2 }}>SaaS CRM pour commerciaux</p>
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
        <div style={{ height: 5, background: '#E4EEEA', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#36a64f', borderRadius: 3, transition: 'width 0.4s' }} />
        </div>
      </div>

      <div className="g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 36 }}>
        {ROADMAP_PHASES.map((phase, pi) => (
          <div key={pi} style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17' }}>{phase.title}</p>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9BB5AA', background: '#F7FAF8', padding: '3px 8px', borderRadius: 99 }}>{phase.subtitle}</span>
            </div>
            {phase.tasks.map((task, ti) => (
              <label key={ti} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: ti < phase.tasks.length - 1 ? 9 : 0, cursor: 'pointer' }}>
                <input type="checkbox" checked={tasks[pi][ti]} onChange={() => toggleTask(pi, ti)} style={{ accentColor: '#36a64f', width: 15, height: 15 }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: tasks[pi][ti] ? '#9BB5AA' : '#0F1C17', textDecoration: tasks[pi][ti] ? 'line-through' : 'none', transition: 'all 0.2s' }}>{task.label}</span>
              </label>
            ))}
          </div>
        ))}
      </div>

      {/* BMC */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9BB5AA' }}>Business Model Canvas</p>
        <Btn small onClick={() => setEditBmc(true)}>Éditer le BMC</Btn>
      </div>

      <div className="bmc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: '1fr 1fr auto', gap: 1, background: '#E4EEEA', borderRadius: 14, overflow: 'hidden', marginBottom: 36 }}>
        {bmcData.map(cell => (
          <div key={cell.key} style={{ gridColumn: cell.col, gridRow: cell.row, background: '#fff', padding: '14px 16px' }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: '#2F5446', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{cell.title}</p>
            {cell.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#36a64f', flexShrink: 0, marginTop: 5 }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#4B6358', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Forecast sliders */}
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9BB5AA', marginBottom: 16 }}>Prévisionnel financier — modulable</p>

      <div className="g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 14, padding: '20px 22px' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17', marginBottom: 18 }}>Hypothèses clés</p>
          <SliderField label="Prix moyen"         value={price}    min={9}   max={199} step={1}   fmt={v=>`${v}€/mois`}    onChange={setPrice}    />
          <SliderField label="Taux de conversion"  value={conv}     min={0.5} max={10}  step={0.5} fmt={v=>`${v}%`}          onChange={setConv}     />
          <SliderField label="Durée client (mois)" value={lifetime} min={3}   max={36}  step={1}   fmt={v=>`${v} mois`}      onChange={setLifetime} />
          <SliderField label="Coût d'acquisition"  value={cac}      min={50}  max={2000}step={50}  fmt={v=>`${v}€`}          onChange={setCac}      />
          <SliderField label="Charge fixe/mois"    value={fixed}    min={500} max={10000}step={100} fmt={v=>`${v}€`}         onChange={setFixed}    />
        </div>

        <div style={{ background: '#fff', border: '1px solid #E4EEEA', borderRadius: 14, padding: '20px 22px' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#0F1C17', marginBottom: 16 }}>Prévisions (mise à jour en temps réel)</p>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 80px', gap: 0 }}>
            {['Mois', 'MRR', 'Cumul', 'Statut'].map(h => (
              <div key={h} style={{ padding: '6px 8px', background: '#F7FAF8', fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, color: '#9BB5AA', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</div>
            ))}
            {forecasts.map(row => (
              <>
                <div key={`m${row.m}`}  style={{ padding: '10px 8px', borderBottom: '1px solid #F7FAF8', fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9BB5AA' }}>{row.m}</div>
                <div key={`mrr${row.m}`} style={{ padding: '10px 8px', borderBottom: '1px solid #F7FAF8', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: row.mrr > 0 ? '#36a64f' : '#9BB5AA' }}>{row.mrr.toLocaleString('fr-FR')} €</div>
                <div key={`cum${row.m}`} style={{ padding: '10px 8px', borderBottom: '1px solid #F7FAF8', fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#4B6358' }}>{row.cumul > 0 ? row.cumul.toLocaleString('fr-FR') + ' €' : '—'}</div>
                <div key={`st${row.m}`}  style={{ padding: '10px 8px', borderBottom: '1px solid #F7FAF8', fontFamily: "'Inter', sans-serif", fontSize: 11, color: row.status === 'Rentable' ? '#36a64f' : row.status === 'Développement' ? '#9BB5AA' : '#2F5446' }}>{row.status}</div>
              </>
            ))}
          </div>
          <button onClick={() => setShowChart(true)} style={{ marginTop: 14, width: '100%', padding: '9px', background: '#F7FAF8', border: '1px solid #E4EEEA', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#2F5446', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.background='rgba(54,166,79,0.07)';e.currentTarget.style.borderColor='#36a64f'}} onMouseLeave={e=>{e.currentTarget.style.background='#F7FAF8';e.currentTarget.style.borderColor='#E4EEEA'}}>
            Voir le graphique détaillé →
          </button>
        </div>
      </div>

      <FeatureList items={['Roadmap structurée en phases selon ton objectif', 'Business Model Canvas visuel et éditable', 'Prévisionnel financier modulable (hypothèses en temps réel)', 'Export complet en PDF']} />

      {editBmc  && <BMCEditModal cells={bmcData} onSave={updated => { setBmcData(updated); setEditBmc(false) }} onClose={() => setEditBmc(false)} />}
      {showChart && <ForecastModal price={price} conv={conv} lifetime={lifetime} cac={cac} fixed={fixed} onClose={() => setShowChart(false)} />}
    </div>
  )
}

function BMCEditModal({ cells, onSave, onClose }: { cells: typeof BMC_INIT; onSave: (c: typeof BMC_INIT) => void; onClose: () => void }) {
  const [local, setLocal] = useState(cells.map(c => ({ ...c, text: c.items.join('\n') })))

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,28,23,0.52)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', width: 'min(680px, 94vw)', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.16)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 18, color: '#0F1C17' }}>Éditer le Business Model Canvas</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9BB5AA', padding: 4 }}>✕</button>
        </div>
        <div className="g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {local.map((cell, i) => (
            <div key={cell.key}>
              <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: '#2F5446', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>{cell.title}</label>
              <textarea
                value={cell.text}
                onChange={e => setLocal(prev => prev.map((c, j) => j === i ? { ...c, text: e.target.value } : c))}
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #E4EEEA', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#0F1C17', outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e=>(e.target.style.borderColor='#36a64f')} onBlur={e=>(e.target.style.borderColor='#E4EEEA')}
                placeholder="Un item par ligne"
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <Btn primary onClick={() => onSave(local.map(c => ({ ...c, items: c.text.split('\n').filter(l => l.trim()) })))} style={{ flex: 1 }}>Enregistrer</Btn>
          <Btn onClick={onClose} style={{ flex: 1 }}>Annuler</Btn>
        </div>
      </div>
    </div>
  )
}

function ForecastModal({ price, conv, lifetime, cac, fixed, onClose }: { price: number; conv: number; lifetime: number; cac: number; fixed: number; onClose: () => void }) {
  const months: number[] = []
  let customers = 0
  const budget = fixed * 0.35
  const baseNew = Math.max(0.5, budget / cac)
  for (let m = 1; m <= 12; m++) {
    if (m === 1) { months.push(0); continue }
    const newCust = baseNew * (1 + (m - 2) * 0.1) * (conv / 2)
    const churn   = customers / (lifetime * 1.2)
    customers = Math.max(0, customers + newCust - churn)
    months.push(Math.round(customers) * price)
  }
  const maxVal = Math.max(1, ...months)

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,28,23,0.52)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', width: 'min(560px, 94vw)', boxShadow: '0 24px 64px rgba(0,0,0,0.16)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 18, color: '#0F1C17' }}>Évolution du MRR — 12 mois</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9BB5AA', padding: 4 }}>✕</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 140, marginBottom: 6 }}>
          {months.map((v, i) => (
            <div key={i} style={{ flex: 1, height: `${Math.max(3, (v / maxVal) * 130)}px`, background: v > fixed ? '#36a64f' : v > 0 ? `rgba(54,166,79,${0.3 + (v / maxVal) * 0.7})` : '#E4EEEA', borderRadius: '3px 3px 0 0', transition: 'height 0.5s', position: 'relative' }}>
              {v > fixed && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: '#36a64f' }} />}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          {['M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M12'].map(m => <span key={m} style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, color: '#9BB5AA' }}>{m}</span>)}
        </div>
        <div style={{ padding: '12px 16px', background: '#F7FAF8', borderRadius: 10 }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#4B6358', lineHeight: 1.6 }}>
            Basé sur <strong style={{ color: '#0F1C17' }}>{price}€/mois</strong>, un taux de conversion de <strong style={{ color: '#0F1C17' }}>{conv}%</strong> et un CAC de <strong style={{ color: '#0F1C17' }}>{cac}€</strong>.
            {months[11] > fixed && <span style={{ color: '#36a64f' }}> Seuil de rentabilité atteint ✓</span>}
          </p>
        </div>
      </div>
    </div>
  )
}
