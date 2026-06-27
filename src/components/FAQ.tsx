'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: "Qu'est-ce que Nouveau Variable exactement ?",
    answer:
      "Nouveau Variable est un club privé doté de son propre SaaS. Le club s'adresse à des commerciaux ambitieux (SDR, BDR, AE, KAM, freelances, etc) et entrepreneurs. C'est 3 choses en 1 : des outils propriétaires, une marketplace d'opportunités, et un réseau de commerciaux connectés. Tu payes un abonnement sans engagement pour accéder à tout, et tu génères des revenus par plusieurs leviers à la fois.",
  },
  {
    question: 'Pour qui exactement ? Je dois avoir quel profil ?',
    answer:
      "SDR, BDR, AE, KAM, agents commerciaux, freelances, indépendants, entrepreneurs — essentiellement toute personne qui vend, prospecte, close, ou construit quelque chose. Pas de minimum d'expérience requis.",
  },
  {
    question: "C'est quoi ces outils propriétaires ? Ça sert à quoi ?",
    answer:
      "Réplique génère des scripts de prospection en quelques secondes (objections, relances, follow-ups). Missions est une marketplace interne où tu peux proposer tes services ou en trouver (signature de contrats, création de leads, conseil). Deallink crée des pages de présentation pour vendre tes offres/services aux autres membres. Side Hustle structure ton projet personnel (structure d'affaires, prévisionnel, feuille de route). Annuaire est un réseau de commerciaux filtrables (rôle, secteur, etc.). Tout est construit pour convertir l'activité directement en revenus.",
  },
  {
    question: "Comment je gagne de l'argent dans NV ?",
    answer:
      "4 leviers : Missions — tu acceptes des missions (signature de contrats, création de leads, conseil). Marketplace Projets — entrepreneurs postent des projets et tu proposes tes services. Affiliation N1/N2/N3 — tu parraines un membre et tu touches 30% (N1), 5% (N2), 5% (N3) du CA HT généré. Outils — certains outils t'aident à générer du CA directement. Tout est tracké, transparent, viré sur ton compte professionnel sur présentation d'une facture mensuelle.",
  },
  {
    question: "C'est du MLM ?",
    answer:
      "Non. Trois différences clés : Pas de quota — tu peux parrainer 0 membres et gagner 100% sur les missions, sur les projets, ou en utilisant les outils. Pas de pay-to-play — tu peux parrainer de nouveaux membres même sans abonnement actif. Pas de « niveaux » infinis — seulement N1, N2, N3.",
  },
  {
    question: "Si j'annule mon abo, je perds mon lien d'affiliation ?",
    answer:
      "Non. C'est une règle d'or chez NV : pas de pay-to-play. Si tu annules, tu perds l'accès aux outils/marketplace, OUI. Mais ton lien d'affiliation reste actif à vie. Si tu avais parrainé 5 membres et qu'ils paient toujours, tu continues de toucher leurs commissions : N1 = 30% du CA HT généré par tes filleuls directs. N2 = 5% du CA HT généré par les filleuls de tes filleuls. N3 = 5% du CA HT (débloqué après 6 mois d'activité). Même sans abonnement actif.",
  },
  {
    question: "Quel est le prix ? Y a-t-il un engagement ?",
    answer:
      "Membre : 97€/mois ou option annuelle (à coût réduit). Paiement mensuel ou annuel, tu peux annuler quand tu veux. Droit de rétractation 14 jours (légal). Aucun engagement long terme.",
  },
  {
    question: 'Comment accéder au club ?',
    answer:
      "Remplis le formulaire de candidature sur notre site. On examine chaque candidature manuellement. Si tu corresponds au profil, on te contacte pour valider les détails et te proposer un lien de paiement Stripe. Une fois le paiement reçu, tu as accès immédiatement à tous les outils et au réseau. Aucun délai, c'est automatique.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section style={{ width: '100%', background: '#ffffff', padding: '80px 24px' }}>
      <style>{`
        @keyframes faqFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .faq-answer {
          animation: faqFadeIn 0.35s ease forwards;
        }
        .faq-item-btn:hover {
          background: #F7FAF8 !important;
        }
        .faq-item-btn.open {
          background: #EAF2EE !important;
          color: #2F5446 !important;
        }
      `}</style>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{
            fontFamily: 'var(--fi), Inter, sans-serif',
            fontSize: 13, fontWeight: 500,
            color: '#4B6358', marginBottom: 8, margin: '0 0 8px',
          }}>
            Tes questions
          </p>
          <h2 style={{
            fontFamily: 'var(--fi), Inter, sans-serif',
            fontSize: 24, fontWeight: 500,
            color: '#0F1C17', margin: 0,
          }}>
            nos réponses
          </h2>
        </div>

        {/* Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={idx}
                style={{
                  border: '1px solid #E4EEEA',
                  borderRadius: 14,
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  className={`faq-item-btn${isOpen ? ' open' : ''}`}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: 16,
                    background: isOpen ? '#EAF2EE' : '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: isOpen ? '#2F5446' : '#0F1C17',
                    fontFamily: 'var(--fi), Inter, sans-serif',
                    fontSize: 15,
                    fontWeight: 500,
                    lineHeight: 1.5,
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  aria-expanded={isOpen}
                >
                  <span style={{ flex: 1 }}>{faq.question}</span>
                  <ChevronDown
                    size={20}
                    color="#2F5446"
                    style={{
                      flexShrink: 0,
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>

                {isOpen && (
                  <div
                    className="faq-answer"
                    style={{
                      background: '#F7FAF8',
                      borderTop: '1px solid #E4EEEA',
                      padding: 16,
                      fontFamily: 'var(--fi), Inter, sans-serif',
                      fontSize: 14,
                      fontWeight: 400,
                      color: '#4B6358',
                      lineHeight: 1.6,
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
