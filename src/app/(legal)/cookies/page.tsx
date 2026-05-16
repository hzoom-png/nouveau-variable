export const metadata = { title: 'Politique des cookies — Nouveau Variable' }

export default function CookiesPage() {
  return (
    <div className="legal-content">
      <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 700, color: '#0F1C17', marginBottom: 8 }}>
        Politique des cookies
      </h1>
      <p style={{ fontSize: 13, color: '#9BB5AA', marginBottom: 40 }}>Dernière mise à jour : 6 mai 2026</p>

      <h2>Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p>
        Un cookie est un petit fichier texte déposé sur votre navigateur lors de la visite d&apos;un site.
        Il permet au site de mémoriser des informations sur votre session ou vos préférences.
      </p>

      <h2>Cookies utilisés sur Nouveau Variable</h2>
      <p>
        Nous n&apos;utilisons <strong>aucun cookie publicitaire</strong>, <strong>aucun cookie de tracking tiers</strong>
        et <strong>aucun outil d&apos;audience</strong> (pas de Google Analytics, pas de Meta Pixel).
      </p>

      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 16 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E4EEEA' }}>
              {['Nom', 'Type', 'Durée', 'Finalité'].map(h => (
                <th key={h} style={{
                  padding: '10px 12px', textAlign: 'left',
                  fontSize: 11, fontWeight: 700, color: '#9BB5AA',
                  letterSpacing: '.08em', textTransform: 'uppercase',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'supabase-auth-token', type: 'Nécessaire', duration: 'Session', purpose: 'Authentification du membre — maintient la session active.' },
              { name: 'admin_session', type: 'Nécessaire', duration: '24h', purpose: 'Authentification de l\'administrateur (JWT sécurisé).' },
              { name: 'nv_ref', type: 'Fonctionnel', duration: '30 jours', purpose: 'Mémorise le code de parrainage pour attribuer les commissions d\'affiliation.' },
              { name: 'nv_loader_played', type: 'Fonctionnel', duration: 'Session', purpose: 'Évite de rejouer l\'animation d\'introduction de la landing page.' },
              { name: 'stripe_*', type: 'Nécessaire', duration: 'Session', purpose: 'Sécurité des transactions de paiement gérées par Stripe.' },
            ].map((row, i) => (
              <tr key={row.name} style={{ borderBottom: '1px solid #E4EEEA', background: i % 2 === 0 ? '#fff' : '#F7FAF8' }}>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: '#0F1C17', fontWeight: 600 }}>{row.name}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    display: 'inline-block', fontSize: 11, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 99,
                    background: row.type === 'Nécessaire' ? '#EAF2EE' : '#F0F4FF',
                    color: row.type === 'Nécessaire' ? '#2F5446' : '#3B5BDB',
                  }}>{row.type}</span>
                </td>
                <td style={{ padding: '10px 12px', color: '#4B6358', whiteSpace: 'nowrap' }}>{row.duration}</td>
                <td style={{ padding: '10px 12px', color: '#4B6358', lineHeight: 1.6 }}>{row.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Base légale</h2>
      <p>
        Conformément à la directive ePrivacy (2002/58/CE) et aux recommandations de la CNIL :
      </p>
      <ul>
        <li>
          <strong>Cookies nécessaires</strong> (supabase-auth-token, admin_session, stripe_*) :
          exemptés de consentement. Ils sont indispensables au fonctionnement du service et ne peuvent
          pas être désactivés sans empêcher l&apos;accès à la plateforme.
        </li>
        <li>
          <strong>Cookies fonctionnels</strong> (nv_ref, nv_loader_played) :
          déposés uniquement avec votre consentement, recueilli via le bandeau cookies lors de votre
          première visite. Vous pouvez refuser leur dépôt sans que cela affecte l&apos;accès au service.
        </li>
      </ul>

      <h2>Gestion de vos préférences</h2>
      <p>
        Lors de votre première visite, un bandeau vous permet d&apos;accepter ou de refuser les cookies
        fonctionnels. Votre choix est mémorisé via <code>localStorage</code> (clé <code>nv_cookie_consent</code>)
        et ne nécessite pas de cookie lui-même.
      </p>
      <p>
        Pour modifier votre choix à tout moment, videz les données de site de votre navigateur
        (Paramètres → Confidentialité → Effacer les données de navigation) ou contactez-nous à{' '}
        <a href="mailto:contact@nouveauvariable.fr">contact@nouveauvariable.fr</a>.
      </p>

      <h2>Cookies tiers</h2>
      <p>
        <strong>Aucun cookie tiers de tracking ou publicitaire n&apos;est déposé.</strong>{' '}
        Les cookies Stripe sont nécessaires au traitement sécurisé des paiements et ne servent pas
        à vous profiler à des fins publicitaires.
      </p>

      <p style={{ marginTop: 32, fontSize: 13, color: '#9BB5AA' }}>
        Contact : <a href="mailto:contact@nouveauvariable.fr">contact@nouveauvariable.fr</a>
      </p>
    </div>
  )
}
