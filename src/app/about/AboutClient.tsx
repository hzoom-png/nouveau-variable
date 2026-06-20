'use client';

import { useEffect, useState } from 'react';
import { LandingNav } from '@/components/LandingNav';

export default function AboutClient() {
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }));
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll('[data-observe]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', colorScheme: 'light' }}>
      <LandingNav candidateHref="/#candidature" />

      <main className="bg-white">

        {/* ========== HERO ========== */}
        <section className="py-16 md:py-32 px-6 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-3xl mx-auto text-center">
            <h1
              className="text-4xl md:text-6xl font-900 text-gray-900 mb-6 leading-tight"
              style={{ fontFamily: 'Inter' }}
              data-observe
              id="hero"
            >
              Qui sommes-nous ?
            </h1>
            <p
              className="text-lg md:text-xl text-gray-600 font-400 leading-relaxed max-w-2xl mx-auto"
              style={{ fontFamily: 'Inter' }}
              data-observe
            >
              Nouveau Variable naît d'une simple observation : les commerciaux osent, et les entrepreneurs aussi. Mais tous deux manquent d'un lieu où pouvoir avancer ensemble.
            </p>
          </div>
        </section>

        {/* ========== HISTOIRE DU FONDATEUR ========== */}
        <section
          className="py-16 md:py-20 px-6"
          data-observe
          id="histoire"
        >
          <div className="max-w-2xl mx-auto">
            <div
              className={`transition-all duration-700 ${
                visibleSections['histoire'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="space-y-6 md:space-y-8">

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  J'ai côtoyé des centaines de commerciaux au cours de ma carrière, et j'ai également fait la rencontre d'un très grand nombre d'entrepreneurs.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Et finalement, je me suis rendu compte que ces deux profils n'en formaient qu'un seul : Il s'agit de personnes qui osent.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Et aussi vrai que les entrepreneurs doivent apprendre à vendre et diffuser leurs idées, les commerciaux doivent faire preuve de résilience, et d'ambition, si ils souhaitent survivre.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  <span className="font-600">Survivre.</span> C'est bien de cela dont il s'agit.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Quand j'ai découvert le monde la tech et que j'ai vu de nombreux collègues être licenciés à cause d'un coup de mou de 30 jours, j'ai compris qu'être commercial, c'était aussi être entre le marteau et l'enclume.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Puis, on m'a aussi expliqué qu'être commercial n'était pas un "job alimentaire" et qu'on ne pouvait pas entreprendre en parallèle.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  En regardant ma propre trajectoire, je me rendais compte que je devenais esclave de mes performances et qu'il était possible de toucher plus de 4000€ en Janvier pour tomber a 1800€ en Février, d'être une rockstar le Lundi et d'être mis en surveillance le Vendredi suite à un deal raté.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Bref, il manquait pour moi un environnement dans lequel chaque commercial pourrait embrasser son coté entrepreneur, et où chaque entrepreneur pourrait trouver la force de vendre.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Cet environnement, j'ai décidé de le nommer <span className="font-600">Nouveau Variable</span>, parce qu'il vient compléter l'ancien, le réinventer.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Je suis fier que tu puisses le découvrir.
                </p>

              </div>
            </div>
          </div>
        </section>

        {/* ========== VISION ========== */}
        <section
          className="py-16 md:py-20 px-6 bg-gray-50"
          data-observe
          id="vision"
        >
          <div className="max-w-2xl mx-auto">
            <div
              className={`transition-all duration-700 ${
                visibleSections['vision'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <h2
                className="text-3xl md:text-4xl font-900 text-gray-900 mb-8"
                style={{ fontFamily: 'Inter' }}
              >
                La Vision
              </h2>

              <div className="space-y-6 md:space-y-8">

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Nouveau Variable est un club d'affaires conçu comme un espace de relations authentiques, collaboratives et transformatrices.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Ici, le réseau n'est pas une vitrine : c'est un atelier. On y vient pour créer des opportunités, oui, mais surtout pour créer des alliances qui tiennent dans le temps.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Nous croyons à une nouvelle manière de faire du business : plus claire, plus humaine, plus courageuse.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Nos membres partagent une même intention : bâtir avec intégrité, décider avec lucidité, et avancer avec une ambition qui élève, soi-même, les autres, et les projets que l'on porte.
                </p>

              </div>
            </div>
          </div>
        </section>

        {/* ========== PRINCIPES FONDATEURS ========== */}
        <section
          className="py-16 md:py-20 px-6"
          data-observe
          id="principes"
        >
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-3xl md:text-4xl font-900 text-gray-900 mb-10 md:mb-12 text-center"
              style={{ fontFamily: 'Inter' }}
            >
              Les Principes Fondateurs
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

              {[
                { title: 'Authenticité', desc: 'Se présenter sans masque : la confiance naît de la vérité, pas de la posture.' },
                { title: 'Collaboration', desc: 'Remplacer la logique de silo par des synergies concrètes et généreuses.' },
                { title: 'Exigence Bienveillante', desc: 'Se challenger avec respect : viser haut, sans écraser.' },
                { title: 'Innovation', desc: 'Oser de nouveaux formats, de nouvelles idées, de nouvelles façons de créer de la valeur.' },
                { title: 'Croissance Partagée', desc: 'Réussir ensemble : les victoires durables sont celles qui se multiplient.' },
                { title: 'Réciprocité', desc: 'Donner avant de demander, et construire des échanges équilibrés dans le temps.' },
              ].map((p) => (
                <div
                  key={p.title}
                  className="group p-6 md:p-8 border border-gray-200 rounded-xl hover:border-green hover:bg-gray-50 transition-all duration-300 cursor-default"
                >
                  <h3 className="text-lg font-600 text-gray-900 mb-3 group-hover:text-green transition" style={{ fontFamily: 'Inter' }}>
                    {p.title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed" style={{ fontFamily: 'Inter' }}>
                    {p.desc}
                  </p>
                </div>
              ))}

            </div>
          </div>
        </section>

        {/* ========== ESSENCE ========== */}
        <section
          className="py-16 md:py-20 px-6 bg-gray-50"
          data-observe
          id="essence"
        >
          <div className="max-w-2xl mx-auto text-center">
            <div
              className={`transition-all duration-700 ${
                visibleSections['essence'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <h2
                className="text-3xl md:text-4xl font-900 text-gray-900 mb-8"
                style={{ fontFamily: 'Inter' }}
              >
                Notre essence
              </h2>

              <div className="space-y-6">

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Nouveau Variable est un lieu où l'on transforme des contacts en liens, et des liens en trajectoires.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Nous ne cherchons pas le plus grand bruit — nous cherchons la plus grande justesse.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Parce qu'un business solide commence par une relation saine.
                </p>

              </div>
            </div>
          </div>
        </section>

        {/* ========== ENGAGEMENT ========== */}
        <section
          className="py-16 md:py-20 px-6"
          data-observe
          id="engagement"
        >
          <div className="max-w-2xl mx-auto">
            <div
              className={`transition-all duration-700 ${
                visibleSections['engagement'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <h2
                className="text-3xl md:text-4xl font-900 text-gray-900 mb-8"
                style={{ fontFamily: 'Inter' }}
              >
                Engagement
              </h2>

              <div className="space-y-6 md:space-y-8">

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Nous nous engageons à offrir un cadre où chaque membre peut avancer avec clarté et soutien : des rencontres structurées, des mises en relation pertinentes, et des échanges qui vont au-delà du superficiel.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Ce club existe pour éviter à d'autres de vivre cette solitude que j'ai pu connaitre à certains moments.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Concrètement, Nouveau Variable s'engage à créer des opportunités d'affaires alignées, à favoriser des collaborations mesurables, et à encourager une progression durable : stratégie, posture, leadership, et exécution.
                </p>

                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Ici, vous trouverez des partenaires, des alliés, et parfois ce déclic qui change tout, comme celui qui a changé ma manière de faire du business.
                </p>

              </div>
            </div>
          </div>
        </section>

        {/* ========== CTA FINAL ========== */}
        <section
          className="py-16 md:py-20 px-6 bg-green text-white"
          data-observe
          id="cta"
        >
          <div className="max-w-2xl mx-auto text-center">
            <div
              className={`transition-all duration-700 ${
                visibleSections['cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <h2
                className="text-3xl md:text-4xl font-900 mb-8"
                style={{ fontFamily: 'Inter' }}
              >
                Rejoignez le Mouvement
              </h2>

              <div className="space-y-6 mb-10 md:mb-12">

                <p className="text-base md:text-lg leading-8 opacity-90" style={{ fontFamily: 'Inter' }}>
                  Si vous voulez développer votre activité sans renoncer à vos valeurs, Nouveau Variable est fait pour vous.
                </p>

                <p className="text-base md:text-lg leading-8 opacity-90" style={{ fontFamily: 'Inter' }}>
                  Rejoignez un cercle de leaders qui choisissent la qualité des liens, la force du collectif, et l'audace d'inventer autrement.
                </p>

                <p className="text-base md:text-lg leading-8 opacity-90" style={{ fontFamily: 'Inter' }}>
                  Ensemble, faisons du business un espace de sens, et une dynamique qui élève.
                </p>

              </div>

              <a
                href="/#candidature"
                className="inline-block px-8 py-4 bg-white text-green font-600 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontFamily: 'Inter', textDecoration: 'none' }}
              >
                Candidater au club →
              </a>
            </div>
          </div>
        </section>

      </main>

      <footer style={{ padding: '28px 24px', borderTop: '1px solid #E4EEEA', background: '#fff', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13, color: '#4B6358', margin: 0 }}>
          © {new Date().getFullYear()} Nouveau Variable ·{' '}
          <a href="/mentions-legales" style={{ color: '#4B6358', textDecoration: 'underline' }}>Mentions légales</a>
        </p>
      </footer>
    </div>
  );
}
