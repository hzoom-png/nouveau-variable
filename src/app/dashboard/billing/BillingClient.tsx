'use client'

interface Props {
  isActive: boolean
  memberSince: string
  tokensBalance: number
}

const TOKENS_MAX = 500

export default function BillingClient({ isActive, memberSince, tokensBalance }: Props) {
  const card: React.CSSProperties = {
    background: 'var(--white)',
    borderRadius: 'var(--r-lg)',
    border: '1px solid var(--border)',
    padding: '22px 24px',
    marginBottom: '16px',
  }
  const sectionTitle: React.CSSProperties = {
    fontFamily: 'Jost, sans-serif',
    fontSize: '15px', fontWeight: 700,
    color: 'var(--text)', marginBottom: '16px',
  }
  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '13px', color: 'var(--text-2)',
  }

  return (
    <div style={{ maxWidth: '560px' }}>

      {/* Abonnement */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: 'Jost, sans-serif', fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '2px' }}>
              Plan Nouveau Variable
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>97 € / mois</div>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: 'var(--r-full)',
            fontSize: '11px', fontWeight: 700,
            background: isActive ? 'var(--green-3)' : 'var(--red-2)',
            color: isActive ? 'var(--green)' : 'var(--red)',
            border: `1px solid ${isActive ? 'var(--green-4)' : '#FECACA'}`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
            {isActive ? 'Actif' : 'Inactif'}
          </span>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <div style={row}>
            <span style={{ fontWeight: 500 }}>Membre depuis</span>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{memberSince}</span>
          </div>
          <div style={{ ...row, marginBottom: 0 }}>
            <span style={{ fontWeight: 500 }}>Tokens restants</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '80px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (tokensBalance / TOKENS_MAX) * 100)}%`,
                  background: 'var(--green)', borderRadius: '2px',
                }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                {tokensBalance} / {TOKENS_MAX}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Portail Stripe */}
      <div style={card}>
        <div style={sectionTitle}>Gérer mon abonnement</div>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '18px' }}>
          Modifier le moyen de paiement, télécharger tes factures, annuler ton abonnement.
        </p>
        <div title="Disponible dès l'ouverture officielle">
          <button
            disabled
            style={{
              padding: '10px 20px', borderRadius: 'var(--r-sm)',
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              color: 'var(--text-3)', fontFamily: 'Jost, sans-serif',
              fontSize: '13px', fontWeight: 600,
              cursor: 'not-allowed', opacity: 0.6,
              display: 'inline-flex', alignItems: 'center', gap: '6px',
            }}
          >
            Accéder au portail de facturation
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 6h8M6 2l4 4-4 4"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Note */}
      <div style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.7, textAlign: 'center', padding: '8px 0' }}>
        Paiements sécurisés par Stripe.{' '}
        Questions ?{' '}
        <a href="mailto:contact@nouveauvariable.fr" style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: 500 }}>
          contact@nouveauvariable.fr
        </a>
      </div>
    </div>
  )
}
