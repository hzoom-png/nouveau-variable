export const metadata = { title: 'CGU — Nouveau Variable' }

export default function CguPage() {
  return (
    <div className="legal-content">
      <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 700, color: '#0F1C17', marginBottom: 8 }}>
        Conditions Générales d&apos;Utilisation
      </h1>
      <p style={{ fontSize: 13, color: '#9BB5AA', marginBottom: 40 }}>Dernière mise à jour : 6 mai 2026</p>

      <h2>1. Objet</h2>
      <p>
        Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation de la plateforme
        Nouveau Variable, club privé en ligne réservé aux professionnels de la vente, éditée par Nouveau Variable.
        Tout accès au service implique l&apos;acceptation sans réserve des présentes CGU.
      </p>

      <h2>2. Accès au service</h2>
      <p>
        L&apos;accès à la plateforme est réservé aux membres dont la candidature a été acceptée par Nouveau Variable
        et qui ont souscrit un abonnement payant (mensuel à 97 € ou annuel à 899 €).
        Chaque compte est strictement personnel et non transférable.
      </p>
      <p>
        L&apos;accès est conditionné au maintien d&apos;un abonnement actif. En cas de résiliation ou d&apos;impayé,
        l&apos;accès aux fonctionnalités réservées aux membres sera suspendu.
      </p>

      <h2>3. Obligations des membres</h2>
      <p>Le membre s&apos;engage à :</p>
      <ul>
        <li>Fournir des informations exactes lors de l&apos;inscription et les maintenir à jour.</li>
        <li>Utiliser la plateforme conformément à son objet et aux lois en vigueur.</li>
        <li>Ne pas partager ses identifiants de connexion avec des tiers.</li>
        <li>Respecter les autres membres et s&apos;abstenir de tout comportement abusif, diffamatoire ou discriminatoire.</li>
        <li>Ne pas utiliser les outils et données du club à des fins concurrentielles ou de revente.</li>
        <li>Respecter la confidentialité des informations échangées au sein du club.</li>
      </ul>

      <h2>4. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus accessibles via la plateforme (outils, textes, données, interfaces) sont
        la propriété de Nouveau Variable ou font l&apos;objet d&apos;une licence d&apos;utilisation. Toute reproduction,
        extraction ou exploitation commerciale sans autorisation expresse est interdite.
      </p>

      <h2>5. Protection des données personnelles (RGPD)</h2>
      <p>
        Nouveau Variable collecte et traite vos données personnelles (nom, email, téléphone, données d&apos;utilisation)
        dans le cadre de l&apos;exécution du contrat d&apos;abonnement et de l&apos;amélioration du service.
      </p>
      <p>
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression et
        de portabilité de vos données. Pour exercer ces droits : contact@nouveauvariable.fr.
        Vous pouvez également introduire une réclamation auprès de la CNIL (cnil.fr).
      </p>
      <p>
        Les données ne sont pas cédées à des tiers à des fins commerciales. Elles peuvent être partagées
        avec des sous-traitants techniques (hébergement, paiement, email) dans le respect du RGPD.
      </p>

      <h2>6. Résiliation</h2>
      <p>
        Le membre peut résilier son abonnement mensuel à tout moment depuis son espace personnel
        (Dashboard → Billing) ou via le portail Stripe. La résiliation prend effet à la fin de la période
        en cours. Aucun remboursement au prorata n&apos;est accordé pour les jours non consommés.
      </p>
      <p>
        Nouveau Variable se réserve le droit de suspendre ou résilier l&apos;accès d&apos;un membre en cas de
        manquement aux présentes CGU, sans préavis et sans indemnité.
      </p>

      <h2>7. Limitation de responsabilité</h2>
      <p>
        La plateforme est fournie &quot;en l&apos;état&quot;. Nouveau Variable s&apos;efforce d&apos;assurer une disponibilité maximale
        mais ne garantit pas l&apos;absence d&apos;interruptions. La responsabilité de Nouveau Variable est limitée
        au montant des sommes versées par le membre au cours des 3 derniers mois.
      </p>

      <h2>8. Modification des CGU</h2>
      <p>
        Nouveau Variable peut modifier les présentes CGU à tout moment. Les membres seront informés par
        email de toute modification substantielle. La poursuite de l&apos;utilisation du service après
        notification vaut acceptation des nouvelles CGU.
      </p>

      <h2>9. Droit applicable et juridiction</h2>
      <p>
        Les présentes CGU sont régies par le droit français. En cas de litige, les parties s&apos;engagent
        à rechercher une solution amiable avant tout recours judiciaire. À défaut, les tribunaux
        compétents seront ceux du ressort du siège social de Nouveau Variable.
      </p>

      <p style={{ marginTop: 32, fontSize: 13, color: '#9BB5AA' }}>
        Contact : contact@nouveauvariable.fr
      </p>
    </div>
  )
}
