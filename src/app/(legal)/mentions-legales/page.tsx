export const metadata = { title: 'Mentions légales — Nouveau Variable' }

export default function MentionsLegalesPage() {
  return (
    <div className="legal-content">
      <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 700, color: '#0F1C17', marginBottom: 8 }}>
        Mentions légales
      </h1>
      <p style={{ fontSize: 13, color: '#9BB5AA', marginBottom: 40 }}>Dernière mise à jour : 6 mai 2026</p>

      <h2>Éditeur du site</h2>
      <p>
        <strong>Nouveau Variable</strong> — Micro-entreprise<br />
        SIRET : 80162289500051<br />
        Siège social : 20 Avenue Debrousse, 69005 Lyon<br />
        Email : contact@nouveauvariable.fr<br />
        Directeur de la publication : Gaultier Hazoumé
      </p>

      <h2>Hébergement</h2>
      <p>
        Vercel Inc.<br />
        340 Pine Street Suite 1501<br />
        San Francisco, CA 94104, USA<br />
        <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L'ensemble des contenus présents sur le site (textes, images, logos, vidéos) sont protégés
        par le droit d'auteur et sont la propriété exclusive de Nouveau Variable, sauf mention contraire.
        Toute reproduction, distribution ou utilisation sans autorisation expresse est interdite.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Les données collectées via le site sont traitées conformément à notre politique de confidentialité
        et au Règlement Général sur la Protection des Données (RGPD). Pour exercer vos droits
        (accès, rectification, suppression), contactez-nous à contact@nouveauvariable.fr.
      </p>

      <h2>Cookies</h2>
      <p>
        Le site utilise des cookies techniques nécessaires à son fonctionnement. Aucun cookie de
        traçage tiers n'est déposé sans votre consentement.
      </p>

      <h2>Limitation de responsabilité</h2>
      <p>
        Nouveau Variable s'efforce de maintenir les informations du site à jour mais ne peut garantir
        leur exactitude exhaustive. La responsabilité de Nouveau Variable ne saurait être engagée pour
        des dommages directs ou indirects liés à l'utilisation du site.
      </p>

      <h2>Droit applicable</h2>
      <p>
        Le présent site et les présentes mentions légales sont soumis au droit français.
        Tout litige relatif à l'utilisation du site relève de la compétence exclusive
        des tribunaux français.
      </p>
    </div>
  )
}
