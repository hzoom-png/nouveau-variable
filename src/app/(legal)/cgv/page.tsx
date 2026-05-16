export const metadata = { title: 'CGV — Nouveau Variable' }

export default function CgvPage() {
  return (
    <div className="legal-content">
      <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 700, color: '#0F1C17', marginBottom: 8 }}>
        Conditions Générales de Vente
      </h1>
      <p style={{ fontSize: 13, color: '#9BB5AA', marginBottom: 40 }}>Dernière mise à jour : 6 mai 2026</p>

      <h2>1. Vendeur</h2>
      <p>
        Nouveau Variable — Micro-entreprise<br />
        SIRET : 80162289500051<br />
        Siège social : 20 Avenue Debrousse, 69005 Lyon<br />
        Email : contact@nouveauvariable.fr
      </p>

      <h2>2. Objet</h2>
      <p>
        Les présentes CGV s&apos;appliquent à la vente d&apos;abonnements donnant accès à la plateforme
        Nouveau Variable, club privé en ligne à destination des professionnels de la vente (BtoB).
        Elles sont conformes au droit français et à la directive européenne 2011/83/UE relative aux
        droits des consommateurs.
      </p>

      <h2>3. Offres et tarifs</h2>
      <p>Deux formules d&apos;abonnement sont disponibles :</p>
      <ul>
        <li><strong>Mensuel</strong> : 97 € TTC par mois, résiliable à tout moment.</li>
        <li><strong>Annuel</strong> : 899 € TTC par an (soit 74,92 €/mois), avec un engagement d&apos;un an.</li>
      </ul>
      <p>
        Les prix sont indiqués en euros toutes taxes comprises (TTC). Nouveau Variable se réserve le droit
        de modifier ses tarifs à tout moment. Les nouveaux tarifs s&apos;appliquent au renouvellement suivant
        la notification du membre.
      </p>

      <h2>4. Commande et paiement</h2>
      <p>
        La souscription s&apos;effectue via la page de paiement sécurisée Stripe, accessible après acceptation
        de la candidature. Le paiement est exigible immédiatement à la souscription.
      </p>
      <p>
        Les paiements sont traités par Stripe Inc. (prestataire de paiement certifié PCI-DSS).
        Nouveau Variable ne stocke aucune donnée bancaire. Les moyens de paiement acceptés sont ceux
        proposés par Stripe (carte bancaire Visa, Mastercard, American Express, etc.).
      </p>

      <h2>5. Renouvellement automatique</h2>
      <p>
        L&apos;abonnement est renouvelé automatiquement à l&apos;échéance (mensuelle ou annuelle) par débit
        automatique du moyen de paiement enregistré. Le membre est informé du prochain renouvellement
        dans son espace Dashboard → Billing.
      </p>
      <p>
        Pour éviter le renouvellement, le membre doit résilier son abonnement avant la date d&apos;échéance
        depuis son espace membre ou via le portail Stripe.
      </p>

      <h2>6. Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L221-18 du Code de la consommation, le membre dispose d&apos;un délai
        de 14 jours à compter de la souscription pour exercer son droit de rétractation, sans avoir
        à justifier sa décision.
      </p>
      <p>
        <strong>Exception :</strong> En cas d&apos;accès immédiat au service numérique, le membre reconnaît
        expressément, lors de la souscription, que l&apos;exécution du contrat commence avant l&apos;expiration
        du délai de rétractation et renonce en conséquence à ce droit conformément à l&apos;article
        L221-28 du Code de la consommation.
      </p>
      <p>
        Pour exercer ce droit (si applicable), contactez contact@nouveauvariable.fr avec votre numéro de commande.
      </p>

      <h2>7. Résiliation et remboursements</h2>
      <p>
        <strong>Abonnement mensuel :</strong> résiliable à tout moment. L&apos;accès reste actif jusqu&apos;à
        la fin de la période mensuelle en cours. Aucun remboursement au prorata.
      </p>
      <p>
        <strong>Abonnement annuel :</strong> résiliable à tout moment, avec prise d&apos;effet à la fin
        de la période annuelle. Aucun remboursement partiel n&apos;est accordé sauf exercice du droit de
        rétractation dans les conditions prévues à l&apos;article 6 ci-dessus.
      </p>
      <p>
        En cas d&apos;impayé, l&apos;accès est suspendu automatiquement. Le membre dispose de 7 jours pour
        régulariser sa situation. Passé ce délai, l&apos;abonnement est résilié.
      </p>

      <h2>8. Facturation</h2>
      <p>
        Une facture électronique est émise automatiquement à chaque paiement. Elle est accessible
        dans l&apos;espace Dashboard → Billing et envoyée par email à l&apos;adresse renseignée lors de la
        souscription.
      </p>

      <h2>9. Force majeure</h2>
      <p>
        Nouveau Variable ne saurait être tenu responsable de tout manquement à ses obligations contractuelles
        en cas de force majeure (catastrophe naturelle, défaillance réseau, cyberattaque, etc.).
      </p>

      <h2>10. Litiges et médiation</h2>
      <p>
        En cas de litige, le membre peut recourir gratuitement à un médiateur de la consommation
        conformément aux articles L611-1 et suivants du Code de la consommation. Les coordonnées du
        médiateur compétent seront communiquées sur demande à contact@nouveauvariable.fr.
      </p>
      <p>
        La plateforme de résolution en ligne des litiges de la Commission européenne est accessible à :
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer"> ec.europa.eu/consumers/odr</a>.
      </p>

      <h2>11. Droit applicable</h2>
      <p>
        Les présentes CGV sont soumises au droit français. Tout litige non résolu à l&apos;amiable
        relève de la compétence des tribunaux français du ressort du siège de Nouveau Variable.
      </p>

      <p style={{ marginTop: 32, fontSize: 13, color: '#9BB5AA' }}>
        Contact : contact@nouveauvariable.fr
      </p>
    </div>
  )
}
