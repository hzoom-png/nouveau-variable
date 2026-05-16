'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Invoice {
  id: string
  created_at: string
  amount_eur: number
  invoice_pdf_url: string | null
  period_start: string | null
  period_end: string | null
}

interface Props {
  email: string
  isActive: boolean
  memberSince: string
  tokensBalance: number
  subscriptionStatus: string
  subscriptionPlan: string | null
  renewalDate: string | null
  hasStripeCustomer: boolean
  isManuallyActivated: boolean
  invoices: Invoice[]
}

const TOKENS_MAX = 500

const STATUS_LABEL: Record<string, string> = {
  active:   'Actif',
  inactive: 'Inactif',
  past_due: 'Paiement en retard',
}
const STATUS_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  active:   { bg: 'var(--green-3)', color: 'var(--green)',  border: 'var(--green-4)' },
  inactive: { bg: 'var(--red-2)',   color: 'var(--red)',    border: '#FECACA' },
  past_due: { bg: '#FEF3E2',        color: '#854F0B',       border: '#F9CB75' },
}

export default function BillingClient({
  email,
  isActive,
  memberSince,
  tokensBalance,
  subscriptionStatus,
  subscriptionPlan,
  renewalDate,
  hasStripeCustomer,
  isManuallyActivated,
  invoices,
}: Props) {
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError]     = useState('')

  const card: React.CSSProperties = {
    background:    'var(--white)',
    borderRadius:  'var(--r-lg)',
    border:        '1px solid var(--border)',
    padding:       '22px 24px',
    marginBottom:  '16px',
  }
  const sectionTitle: React.CSSProperties = {
    fontFamily: 'Jost, sans-serif',
    fontSize:   '15px', fontWeight: 700,
    color:      'var(--text)', marginBottom: '16px',
  }
  const row: React.CSSProperties = {
    display:        'flex', alignItems:     'center',
    justifyContent: 'space-between', marginBottom: '10px',
    fontSize:       '13px', color: 'var(--text-2)',
  }

  const statusStyle = STATUS_COLOR[subscriptionStatus] ?? STATUS_COLOR.inactive

  async function openPortal() {
    setPortalLoading(true)
    setPortalError('')
    try {
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        setPortalError('Impossible d\'accéder au portail. Réessaie.')
        setPortalLoading(false)
      }
    } catch {
      setPortalError('Une erreur est survenue.')
      setPortalLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px' }}>

      {/* Abonnement actuel */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: 'Jost, sans-serif', fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '2px' }}>
              {subscriptionPlan === 'annual' ? 'Plan Annuel' : 'Plan Mensuel'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>
              {subscriptionPlan === 'annual' ? '899 € / an' : '97 € / mois'}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: 'var(--r-full)',
              fontSize: '11px', fontWeight: 700,
              background: statusStyle.bg, color: statusStyle.color,
              border: `1px solid ${statusStyle.border}`,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
              {STATUS_LABEL[subscriptionStatus] ?? 'Inconnu'}
            </span>
            {isManuallyActivated && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--r-full)', background: 'var(--green-3)', color: 'var(--green)', border: '1px solid var(--green-4)' }}>
                Accès manuel
              </span>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <div style={row}>
            <span style={{ fontWeight: 500 }}>Membre depuis</span>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{memberSince}</span>
          </div>
          {renewalDate && (
            <div style={row}>
              <span style={{ fontWeight: 500 }}>Prochain renouvellement</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{renewalDate}</span>
            </div>
          )}
          <div style={{ ...row, marginBottom: 0 }}>
            <span style={{ fontWeight: 500 }}>Tokens restants</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '80px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height:       '100%',
                  width:        `${Math.min(100, (tokensBalance / TOKENS_MAX) * 100)}%`,
                  background:   'var(--green)', borderRadius: '2px',
                }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                {tokensBalance} / {TOKENS_MAX}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gérer mon abonnement */}
      <div style={card}>
        <div style={sectionTitle}>Gérer mon abonnement</div>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '18px' }}>
          Modifier le moyen de paiement, annuler ton abonnement, télécharger les factures via Stripe.
        </p>
        {hasStripeCustomer ? (
          <>
            <button
              onClick={openPortal}
              disabled={portalLoading}
              style={{
                padding:     '10px 20px', borderRadius: 'var(--r-sm)',
                background:  portalLoading ? 'var(--surface)' : 'var(--green)',
                border:      portalLoading ? '1.5px solid var(--border)' : 'none',
                color:       portalLoading ? 'var(--text-3)' : '#fff',
                fontFamily:  'Jost, sans-serif',
                fontSize:    '13px', fontWeight: 600,
                cursor:      portalLoading ? 'wait' : 'pointer',
                display:     'inline-flex', alignItems: 'center', gap: '6px',
                transition:  'opacity .2s',
              }}
            >
              {portalLoading ? 'Redirection…' : 'Gérer mon abonnement →'}
            </button>
            {portalError && (
              <p style={{ marginTop: 10, fontSize: 12, color: '#B91C1C' }}>{portalError}</p>
            )}
          </>
        ) : (
          <a
            href={`/subscribe?email=${encodeURIComponent(email)}`}
            style={{
              display: 'inline-block', padding: '10px 20px', borderRadius: 'var(--r-sm)',
              background: 'var(--green)', color: '#fff', textDecoration: 'none',
              fontFamily: 'Jost, sans-serif', fontSize: '13px', fontWeight: 600,
            }}
          >
            Activer mon abonnement →
          </a>
        )}
      </div>

      {/* Factures */}
      <div style={card}>
        <div style={sectionTitle}>Mes factures</div>
        {invoices.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-3)', fontStyle: 'italic' }}>
            Aucune facture pour l&apos;instant.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Montant', 'Période', ''].map(h => (
                  <th key={h} style={{ padding: '8px 0', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-2)' }}>
                    {format(new Date(inv.created_at), 'd MMM yyyy', { locale: fr })}
                  </td>
                  <td style={{ padding: '10px 0', fontWeight: 600, color: 'var(--text)' }}>
                    {inv.amount_eur.toFixed(2)} €
                  </td>
                  <td style={{ padding: '10px 0', color: 'var(--text-3)', fontSize: 12 }}>
                    {inv.period_start && inv.period_end
                      ? `${format(new Date(inv.period_start), 'd MMM', { locale: fr })} – ${format(new Date(inv.period_end), 'd MMM yyyy', { locale: fr })}`
                      : '—'}
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>
                    {inv.invoice_pdf_url ? (
                      <a
                        href={inv.invoice_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}
                      >
                        PDF ↗
                      </a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
