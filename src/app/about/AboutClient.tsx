'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';

export default function AboutClient() {
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.2 }
    );
    document.querySelectorAll('[data-observe]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Header />

      <main className="bg-white">

        {/* HERO */}
        <section className="py-16 md:py-32 px-6 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-3xl mx-auto text-center">
            <h1
              className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight"
              style={{ fontFamily: 'Inter' }}
              data-observe
              id="hero"
            >
              Qui sommes-nous ?
            </h1>
            <p
              className="text-lg md:text-xl text-gray-600 font-normal leading-relaxed max-w-2xl mx-auto"
              style={{ fontFamily: 'Inter' }}
            >
              Nouveau Variable naît d'une simple observation : Les commerciaux et les entrepreneurs ont beaucoup de points communs, mais pas un lieu où se retrouver pour atteindre mutuellement leurs objectifs.
            </p>
          </div>
        </section>

        {/* HISTOIRE */}
        <section className="py-16 md:py-20 px-6" data-observe id="histoire">
          <div className="max-w-2xl mx-auto">
            <div className={`transition-all duration-700 ${visibleSections['histoire'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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
                  <span className="font-semibold">Survivre.</span> C'est bien de cela dont il s'agit.
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
                  Cet environnement, j'ai décidé de le nommer <span className="font-semibold">Nouveau Variable</span>, parce qu'il vient compléter l'ancien, le réinventer.
                </p>
                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Je suis fier que tu puisses le découvrir.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* VISION */}
        <section className="py-16 md:py-20 px-6 bg-gray-50" data-observe id="vision">
          <div className="max-w-2xl mx-auto">
            <div className={`transition-all duration-700 ${visibleSections['vision'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-8" style={{ fontFamily: 'Inter' }}>
                La Vision
              </h2>
              <div className="space-y-6 md:space-y-8">
                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  Nouveau Variable est un club-outil. C'est à dire un espace collaboratif, bénéficiant de ses propres avantages, où chaque membre profite autant des services qu'il y contribue lui-même.
                </p>
                <p className="text-base md:text-lg text-gray-700 leading-8" style={{ fontFamily: 'Inter' }}>
                  On y vient pour créer des opportunités, découvrir des missions, parler de son projet, multiplier ses sources de revenus ou gagner du temps sur de l'exécution commerciale quotidienne et de la gestion de projets.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CE QUI TE PERMET D'AVANCER */}
        <section className="py-16 md:py-20 px-6" data-observe id="principes">
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-3xl md:text-4xl font-black text-gray-900 mb-10 md:mb-12 text-center"
              style={{ fontFamily: 'Inter' }}
            >
              Ce qui te permet d'avancer
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

              <div className="group p-6 md:p-8 border border-gray-200 rounded-xl hover:border-green hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-green transition" style={{ fontFamily: 'Inter' }}>La force du réseau</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed" style={{ fontFamily: 'Inter' }}>
                  Plus le club grandira, plus ses services prendront de la valeur, plus il sera simple pour toi de le recommander, et donc de déclencher des commissions d'affiliation.
                </p>
              </div>

              <div className="group p-6 md:p-8 border border-gray-200 rounded-xl hover:border-green hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-green transition" style={{ fontFamily: 'Inter' }}>Des outils pratiques</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed" style={{ fontFamily: 'Inter' }}>
                  Keyaccount, Réplique, Deallink et Side Hustle existent tous pour t'aider à vendre ou entreprendre. Ils ont été pensés par des commerciaux et sont nés d'échanges réguliers avec des entrepreneurs.
                </p>
              </div>

              <div className="group p-6 md:p-8 border border-gray-200 rounded-xl hover:border-green hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-green transition" style={{ fontFamily: 'Inter' }}>Des missions</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed" style={{ fontFamily: 'Inter' }}>
                  Tu sais vendre et tu souhaites accéder à des opportunités sans prospecter ? Accède aux missions du club et développe une activité complémentaire.
                </p>
              </div>

              <div className="group p-6 md:p-8 border border-gray-200 rounded-xl hover:border-green hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-green transition" style={{ fontFamily: 'Inter' }}>Des projets</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed" style={{ fontFamily: 'Inter' }}>
                  Tu souhaites faire la promotion de ton projet ou te greffer sur celui d'un des membres du club ? Cette section te permettra de trouver ce qu'il te manque pour passer à l'étape supérieure.
                </p>
              </div>

              <div className="group p-6 md:p-8 border border-gray-200 rounded-xl hover:border-green hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-green transition" style={{ fontFamily: 'Inter' }}>Annuaire et RDV</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed" style={{ fontFamily: 'Inter' }}>
                  Café, visios, calls, toutes ces activités sont bien plus faciles à organiser avec la bonne interface. Choisis n'importe quel membre du club et fais des rencontres dans la vraie vie.
                </p>
              </div>

              <div className="group p-6 md:p-8 border border-gray-200 rounded-xl hover:border-green hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-green transition" style={{ fontFamily: 'Inter' }}>Événements</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed" style={{ fontFamily: 'Inter' }}>
                  On fait des merveilles derrière un écran, mais se retrouver tous ensemble pour parler affaires (ou d'autres choses, aussi) est un excellent moyen d'avancer sereinement. Et de gagner de l'argent en participant à l'organisation, mais on en reparlera :)
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ESSENCE */}
        <section className="py-16 md:py-20 px-6 bg-gray-50" data-observe id="essence">
          <div className="max-w-2xl mx-auto text-center">
            <div className={`transition-all duration-700 ${visibleSections['essence'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-8" style={{ fontFamily: 'Inter' }}>
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

        {/* ENGAGEMENT */}
        <section className="py-16 md:py-20 px-6" data-observe id="engagement">
          <div className="max-w-2xl mx-auto">
            <div className={`transition-all duration-700 ${visibleSections['engagement'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-8" style={{ fontFamily: 'Inter' }}>
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

        {/* CTA */}
        <section className="py-16 md:py-20 px-6 bg-green text-white" data-observe id="cta">
          <div className="max-w-2xl mx-auto text-center">
            <div className={`transition-all duration-700 ${visibleSections['cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="text-3xl md:text-4xl font-black mb-8" style={{ fontFamily: 'Inter' }}>
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
                className="inline-block px-8 py-4 bg-white text-green font-extrabold rounded-lg hover:bg-gray-50 transition-colors"
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
