export const metadata = { title: 'Politique de confidentialité — Nouveau Variable' }

export default function ConfidentialitePage() {
  return (
    <div className="legal-content">
      <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 700, color: '#0F1C17', marginBottom: 8 }}>
        Politique de confidentialité
      </h1>
      <p style={{ fontSize: 13, color: '#9BB5AA', marginBottom: 40 }}>Dernière mise à jour : 6 mai 2026</p>

      <h2>1. Responsable du traitement</h2>
      <p>
        <strong>Nouveau Variable</strong> — Micro-entreprise<br />
        SIRET : 80162289500051<br />
        20 Avenue Debrousse, 69005 Lyon<br />
        Contact : <a href="mailto:contact@nouveauvariable.fr">contact@nouveauvariable.fr</a>
      </p>

      <h2>2. Données collectées</h2>
      <p>Nous collectons les données suivantes selon les interactions avec la plateforme :</p>
      <ul>
        <li><strong>Candidature :</strong> nom, prénom, email, téléphone, ville, rôle professionnel, secteur, expérience, motivation.</li>
        <li><strong>Compte membre :</strong> données de profil (photo, biographie, liens), préférences de meeting, disponibilités.</li>
        <li><strong>Paiement :</strong> email, nom — les données bancaires (numéro de carte, etc.) sont traitées exclusivement par Stripe. Nouveau Variable ne stocke aucune donnée de carte.</li>
        <li><strong>Utilisation :</strong> logs d&apos;utilisation des outils (Réplique, KeyAccount, DealLink, Side Hustle), tokens consommés, points d&apos;affiliation.</li>
        <li><strong>Technique :</strong> adresse IP (pour la sécurité et la lutte contre la fraude), cookies de session.</li>
      </ul>

      <h2>3. Finalités et bases légales</h2>
      <ul>
        <li><strong>Gestion des candidatures</strong> — base légale : intérêt légitime (évaluation des candidats).</li>
        <li><strong>Exécution du contrat d&apos;abonnement</strong> (accès au club, outils, annuaire) — base légale : exécution du contrat.</li>
        <li><strong>Facturation et gestion des paiements</strong> — base légale : exécution du contrat + obligation légale.</li>
        <li><strong>Programme d&apos;affiliation et commissions</strong> — base légale : exécution du contrat.</li>
        <li><strong>Communications transactionnelles</strong> (confirmation d&apos;inscription, factures, alertes) — base légale : exécution du contrat.</li>
        <li><strong>Communications marketing</strong> (newsletter, actualités du club) — base légale : consentement. Retrait possible à tout moment.</li>
        <li><strong>Sécurité de la plateforme</strong> (détection de fraude, rate limiting) — base légale : intérêt légitime.</li>
      </ul>

      <h2>4. Durée de conservation</h2>
      <ul>
        <li><strong>Membres actifs :</strong> données conservées pendant toute la durée de l&apos;abonnement, puis 3 ans après résiliation (prescription légale).</li>
        <li><strong>Candidatures acceptées :</strong> durée de l&apos;abonnement + 3 ans.</li>
        <li><strong>Candidatures non acceptées :</strong> supprimées sous 1 an après la décision.</li>
        <li><strong>Données de facturation :</strong> 10 ans (obligation comptable).</li>
        <li><strong>Logs techniques :</strong> 90 jours.</li>
      </ul>

      <h2>5. Sous-traitants</h2>
      <p>Nouveau Variable fait appel aux sous-traitants suivants, tous soumis à des garanties contractuelles de protection des données :</p>
      <ul>
        <li><strong>Supabase</strong> (base de données, authentification) — région UE. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Politique de confidentialité</a></li>
        <li><strong>Stripe</strong> (paiement) — certifié PCI-DSS. <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer">Politique de confidentialité</a></li>
        <li><strong>Brevo</strong> (emails transactionnels) — hébergement UE. <a href="https://www.brevo.com/fr/legal/privacypolicy/" target="_blank" rel="noopener noreferrer">Politique de confidentialité</a></li>
        <li><strong>Vercel</strong> (hébergement) — USA, couvert par les clauses contractuelles types (CCT) de la Commission européenne. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Politique de confidentialité</a></li>
        <li><strong>Anthropic</strong> (IA — Réplique, Side Hustle) — USA. Les données transmises à l&apos;API Anthropic ne sont pas stockées ni utilisées pour l&apos;entraînement. <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">Politique de confidentialité</a></li>
        <li><strong>Twilio</strong> (SMS OTP) — USA, CCT applicables. <a href="https://www.twilio.com/en-us/legal/privacy" target="_blank" rel="noopener noreferrer">Politique de confidentialité</a></li>
      </ul>

      <h2>6. Transferts hors Union européenne</h2>
      <ul>
        <li><strong>Supabase :</strong> données hébergées en région UE — pas de transfert hors UE.</li>
        <li><strong>Vercel :</strong> hébergement aux États-Unis — transfert encadré par les clauses contractuelles types (CCT) de la Commission européenne.</li>
        <li><strong>Anthropic :</strong> traitement aux États-Unis — les données ne sont pas persistées par Anthropic.</li>
        <li><strong>Twilio :</strong> traitement aux États-Unis — CCT applicables.</li>
      </ul>

      <h2>7. Vos droits</h2>
      <p>Conformément au RGPD (articles 15 à 22), vous disposez des droits suivants :</p>
      <ul>
        <li><strong>Droit d&apos;accès :</strong> obtenir une copie de vos données personnelles.</li>
        <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes.</li>
        <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données (sous réserve des obligations légales de conservation).</li>
        <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et lisible par machine.</li>
        <li><strong>Droit d&apos;opposition :</strong> vous opposer à un traitement fondé sur l&apos;intérêt légitime ou à des fins de marketing direct.</li>
        <li><strong>Droit de retrait du consentement :</strong> à tout moment, pour les traitements fondés sur le consentement.</li>
        <li><strong>Droit de limitation :</strong> restreindre le traitement dans certains cas prévus par le RGPD.</li>
      </ul>
      <p>
        Pour exercer ces droits, contactez-nous à{' '}
        <a href="mailto:contact@nouveauvariable.fr">contact@nouveauvariable.fr</a>.
        Nous répondrons dans un délai d&apos;un mois (article 12 RGPD). En cas de réponse insatisfaisante,
        vous pouvez introduire une réclamation auprès de la{' '}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">CNIL</a>.
      </p>

      <h2>8. Cookies</h2>
      <p>
        Pour le détail des cookies utilisés sur la plateforme, consultez notre{' '}
        <a href="/cookies">politique des cookies</a>.
      </p>

      <h2>9. Sécurité</h2>
      <p>
        Nouveau Variable met en œuvre des mesures techniques et organisationnelles appropriées pour
        protéger vos données : chiffrement en transit (TLS), accès restreint par rôle, authentification
        à deux facteurs pour les administrateurs, surveillance des accès.
      </p>

      <h2>10. Modification de la politique</h2>
      <p>
        Cette politique peut être mise à jour. En cas de modification substantielle, vous serez informé
        par email. La date de dernière mise à jour est indiquée en haut de cette page.
      </p>

      <p style={{ marginTop: 32, fontSize: 13, color: '#9BB5AA' }}>
        Contact : <a href="mailto:contact@nouveauvariable.fr">contact@nouveauvariable.fr</a>
      </p>
    </div>
  )
}
