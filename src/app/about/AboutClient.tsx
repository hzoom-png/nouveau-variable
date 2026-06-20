'use client'

import { useEffect, useRef } from 'react'
import { LandingNav } from '@/components/LandingNav'

const GREEN = '#024f41'
const SURFACE = '#F7FAF8'
const TEXT = '#012722'
const TEXT2 = '#4B6358'
const BORDER = '#E4EEEA'

const PRINCIPES = [
  {
    title: 'Authenticité',
    desc: 'Se présenter sans masque : la confiance naît de la vérité, pas de la posture.',
  },
  {
    title: 'Collaboration',
    desc: 'Remplacer la logique de silo par des synergies concrètes et généreuses.',
  },
  {
    title: 'Exigence Bienveillante',
    desc: 'Se challenger avec respect : viser haut, sans écraser.',
  },
  {
    title: 'Innovation',
    desc: 'Oser de nouveaux formats, de nouvelles idées, de nouvelles façons de créer de la valeur.',
  },
  {
    title: 'Croissance Partagée',
    desc: 'Réussir ensemble : les victoires durables sont celles qui se multiplient.',
  },
  {
    title: 'Réciprocité',
    desc: 'Donner avant de demander, et construire des échanges équilibrés dans le temps.',
  },
]

const fi = "'Inter', var(--font-inter, system-ui, sans-serif)"

export default function AboutClient() {
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = '1'
            ;(e.target as HTMLElement).style.transform = 'translateY(0)'
            observerRef.current?.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    document.querySelectorAll('[data-fade]').forEach((el) => {
      observerRef.current?.observe(el)
    })
    return () => observerRef.current?.disconnect()
  }, [])

  const fadeStyle: React.CSSProperties = {
    opacity: 0,
    transform: 'translateY(28px)',
    transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)',
  }

  return (
    <>
      <style>{`
        .about-wrap { min-height: 100vh; background: #fff; color-scheme: light; background: #fff; }
        .about-wrap * { box-sizing: border-box; }
        .about-prose p { font-family: ${fi}; font-size: 17px; color: ${TEXT2}; line-height: 1.9; margin-bottom: 20px; }
        .about-prose p:last-child { margin-bottom: 0; }
        .principle-card {
          border: 1px solid ${BORDER}; border-radius: 16px;
          padding: 32px; cursor: default;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
          background: #fff;
        }
        .principle-card:hover {
          border-color: ${GREEN};
          box-shadow: 0 8px 32px rgba(2,79,65,0.10);
          transform: translateY(-3px);
        }
        .principle-card:hover .pc-title { color: ${GREEN}; }
        .pc-title { font-family: ${fi}; font-size: 16px; font-weight: 600; color: ${TEXT}; margin-bottom: 10px; transition: color 0.2s; }
        .pc-desc  { font-family: ${fi}; font-size: 14px; color: ${TEXT2}; line-height: 1.75; margin: 0; }
        @media (max-width: 640px) {
          .about-hero-h1 { font-size: 36px !important; }
          .about-h2      { font-size: 28px !important; }
          .about-section { padding: 60px 20px !important; }
          .about-section-alt { padding: 60px 20px !important; }
          .about-principles { padding: 60px 20px !important; }
          .about-cta { padding: 60px 20px !important; }
          .principles-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="about-wrap">
        <LandingNav candidateHref="/#candidature" />

        {/* ── HERO ── */}
        <section className="about-section" style={{ padding: '96px 24px 72px', background: SURFACE, textAlign: 'center' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <h1
              className="about-hero-h1"
              data-fade
              style={{
                ...fadeStyle,
                fontFamily: fi, fontWeight: 600,
                fontSize: 52, color: TEXT,
                letterSpacing: '-.03em', lineHeight: 1.15,
                marginBottom: 24,
              }}
            >
              Qui sommes-nous ?
            </h1>
            <p
              data-fade
              style={{
                ...fadeStyle,
                transitionDelay: '0.1s',
                fontFamily: fi, fontSize: 18, color: TEXT2,
                lineHeight: 1.8, maxWidth: 620, margin: '0 auto',
              }}
            >
              Nouveau Variable naît d'une simple observation : les commerciaux osent, et les entrepreneurs aussi. Mais tous deux manquent d'un lieu où pouvoir avancer ensemble.
            </p>
          </div>
        </section>

        {/* ── HISTOIRE ── */}
        <section className="about-section" style={{ padding: '80px 24px', background: '#fff' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div data-fade style={fadeStyle} className="about-prose">
              <p>
                J'ai côtoyé des centaines de commerciaux au cours de ma carrière, et j'ai également fait la rencontre d'un très grand nombre d'entrepreneurs. Et finalement, je me suis rendu compte que ces deux profils n'en formaient qu'un seul : il s'agit de personnes qui osent.
              </p>
              <p>
                Et aussi vrai que les entrepreneurs doivent apprendre à vendre et diffuser leurs idées, les commerciaux doivent faire preuve de résilience, et d'ambition, s'ils souhaitent survivre. Survivre. C'est bien de cela dont il s'agit.
              </p>
              <p>
                Quand j'ai découvert le monde de la tech et que j'ai vu de nombreux collègues être licenciés à cause d'un coup de mou de 30 jours, j'ai compris qu'être commercial, c'était aussi être entre le marteau et l'enclume.
              </p>
              <p>
                Puis, on m'a aussi expliqué qu'être commercial n'était pas un "job alimentaire" et qu'on ne pouvait pas entreprendre en parallèle. En regardant ma propre trajectoire, je me rendais compte que je devenais esclave de mes performances et qu'il était possible de toucher plus de 4 000€ en Janvier pour tomber à 1 800€ en Février, d'être une rockstar le Lundi et d'être mis en surveillance le Vendredi suite à un deal raté.
              </p>
              <p>
                Bref, il manquait pour moi un environnement dans lequel chaque commercial pourrait embrasser son côté entrepreneur, et où chaque entrepreneur pourrait trouver la force de vendre. Cet environnement, j'ai décidé de le nommer Nouveau Variable, parce qu'il vient compléter l'ancien, le réinventer. Je suis fier que tu puisses le découvrir.
              </p>
            </div>
          </div>
        </section>

        {/* ── VISION ── */}
        <section className="about-section-alt" style={{ padding: '80px 24px', background: SURFACE }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2
              className="about-h2"
              data-fade
              style={{ ...fadeStyle, fontFamily: fi, fontWeight: 600, fontSize: 36, color: TEXT, letterSpacing: '-.02em', marginBottom: 28 }}
            >
              La Vision
            </h2>
            <div data-fade style={{ ...fadeStyle, transitionDelay: '0.1s' }} className="about-prose">
              <p>
                Nouveau Variable est un club d'affaires conçu comme un espace de relations authentiques, collaboratives et transformatrices. Ici, le réseau n'est pas une vitrine : c'est un atelier. On y vient pour créer des opportunités, oui, mais surtout pour créer des alliances qui tiennent dans le temps.
              </p>
              <p>
                Nous croyons à une nouvelle manière de faire du business : plus claire, plus humaine, plus courageuse. Nos membres partagent une même intention : bâtir avec intégrité, décider avec lucidité, et avancer avec une ambition qui élève, soi-même, les autres, et les projets que l'on porte.
              </p>
            </div>
          </div>
        </section>

        {/* ── PRINCIPES ── */}
        <section className="about-principles" style={{ padding: '80px 24px', background: '#fff' }}>
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            <h2
              className="about-h2"
              data-fade
              style={{ ...fadeStyle, fontFamily: fi, fontWeight: 600, fontSize: 36, color: TEXT, letterSpacing: '-.02em', textAlign: 'center', marginBottom: 52 }}
            >
              Les Principes Fondateurs
            </h2>
            <div
              className="principles-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}
            >
              {PRINCIPES.map((p, i) => (
                <div
                  key={p.title}
                  data-fade
                  className="principle-card"
                  style={{ ...fadeStyle, transitionDelay: `${i * 0.07}s` }}
                >
                  <p className="pc-title">{p.title}</p>
                  <p className="pc-desc">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ESSENCE ── */}
        <section className="about-section-alt" style={{ padding: '80px 24px', background: SURFACE, textAlign: 'center' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2
              className="about-h2"
              data-fade
              style={{ ...fadeStyle, fontFamily: fi, fontWeight: 600, fontSize: 36, color: TEXT, letterSpacing: '-.02em', marginBottom: 24 }}
            >
              Notre essence
            </h2>
            <p
              data-fade
              style={{ ...fadeStyle, transitionDelay: '0.1s', fontFamily: fi, fontSize: 17, color: TEXT2, lineHeight: 1.9, maxWidth: 620, margin: '0 auto' }}
            >
              Nouveau Variable est un lieu où l'on transforme des contacts en liens, et des liens en trajectoires. Nous ne cherchons pas le plus grand bruit — nous cherchons la plus grande justesse. Parce qu'un business solide commence par une relation saine.
            </p>
          </div>
        </section>

        {/* ── ENGAGEMENT ── */}
        <section className="about-section" style={{ padding: '80px 24px', background: '#fff' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2
              className="about-h2"
              data-fade
              style={{ ...fadeStyle, fontFamily: fi, fontWeight: 600, fontSize: 36, color: TEXT, letterSpacing: '-.02em', marginBottom: 28 }}
            >
              Engagement
            </h2>
            <div data-fade style={{ ...fadeStyle, transitionDelay: '0.1s' }} className="about-prose">
              <p>
                Nous nous engageons à offrir un cadre où chaque membre peut avancer avec clarté et soutien : des rencontres structurées, des mises en relation pertinentes, et des échanges qui vont au-delà du superficiel. Ce club existe pour éviter à d'autres de vivre cette solitude que j'ai pu connaître à certains moments.
              </p>
              <p>
                Concrètement, Nouveau Variable s'engage à créer des opportunités d'affaires alignées, à favoriser des collaborations mesurables, et à encourager une progression durable : stratégie, posture, leadership, et exécution. Ici, vous trouverez des partenaires, des alliés, et parfois ce déclic qui change tout, comme celui qui a changé ma manière de faire du business.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="about-cta" style={{ padding: '96px 24px', background: GREEN, textAlign: 'center' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2
              data-fade
              style={{ ...fadeStyle, fontFamily: fi, fontWeight: 600, fontSize: 36, color: '#fff', letterSpacing: '-.02em', marginBottom: 20 }}
            >
              Rejoignez le Mouvement
            </h2>
            <p
              data-fade
              style={{
                ...fadeStyle, transitionDelay: '0.1s',
                fontFamily: fi, fontSize: 17, color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.9, maxWidth: 600, margin: '0 auto 40px',
              }}
            >
              Si vous voulez développer votre activité sans renoncer à vos valeurs, Nouveau Variable est fait pour vous. Rejoignez un cercle de leaders qui choisissent la qualité des liens, la force du collectif, et l'audace d'inventer autrement.
            </p>
            <a
              data-fade
              href="/#candidature"
              style={{
                ...fadeStyle, transitionDelay: '0.2s',
                fontFamily: fi, fontWeight: 600,
                display: 'inline-block',
                background: '#D4AF37', color: TEXT,
                border: '2px solid #D4AF37',
                borderRadius: 99, textDecoration: 'none',
                fontSize: 15, padding: '14px 32px',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#E8C547'; e.currentTarget.style.boxShadow = '0 0 24px rgba(212,175,55,0.5)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#D4AF37'; e.currentTarget.style.boxShadow = 'none' }}
            >
              Candidater au club →
            </a>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ padding: '32px 24px', borderTop: `1px solid ${BORDER}`, background: '#fff', textAlign: 'center' }}>
          <p style={{ fontFamily: fi, fontSize: 13, color: TEXT2, margin: 0 }}>
            © {new Date().getFullYear()} Nouveau Variable ·{' '}
            <a href="/mentions-legales" style={{ color: TEXT2, textDecoration: 'underline' }}>Mentions légales</a>
          </p>
        </footer>
      </div>
    </>
  )
}
