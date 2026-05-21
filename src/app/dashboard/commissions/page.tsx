'use client'

import { useEffect, useState, useRef } from 'react'

type CommissionRequest = {
  id: string
  month_year: string
  status: 'pending' | 'facture_recue' | 'validee' | 'payee' | 'rejetee'
  revenue_earned: number | null
  commission_amount: number | null
  submitted_at: string | null
  payment_date: string | null
  payment_reference: string | null
  admin_notes: string | null
  rejection_reason: string | null
  facture_url: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pending:       'En attente',
  facture_recue: 'Facture reçue — en cours de vérification',
  validee:       'Validée — paiement en cours',
  payee:         'Payée',
  rejetee:       'Rejetée',
}

const STATUS_COLORS: Record<string, string> = {
  pending:       '#C8790A',
  facture_recue: '#4A8C6F',
  validee:       '#4B7BF5',
  payee:         '#43695A',
  rejetee:       '#E05252',
}

function fmtEur(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('fr-FR')
}

function getCurrentMonthYear() {
  return new Date().toISOString().slice(0, 7)
}

export default function CommissionsPage() {
  const [requests, setRequests]     = useState<CommissionRequest[]>([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState<'list' | 'submit'>('list')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg]   = useState<{ ok: boolean; text: string } | null>(null)

  // Formulaire upload
  const [monthYear, setMonthYear]       = useState(getCurrentMonthYear())
  const [revenue, setRevenue]           = useState('')
  const [iban, setIban]                 = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [file, setFile]                 = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadRequests() {
    setLoading(true)
    const r = await fetch('/api/commissions/my-requests')
    const d = await r.json()
    setRequests(d.requests ?? [])
    setLoading(false)
  }

  useEffect(() => { loadRequests() }, [])

  // Pré-remplir IBAN si déjà soumis
  useEffect(() => {
    if (requests.length > 0 && !iban) {
      // pas besoin de pré-remplir depuis le back, l'affilié le saisit une fois
    }
  }, [requests, iban])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setSubmitMsg({ ok: false, text: 'Sélectionne une facture PDF' }); return }
    setSubmitting(true)
    setSubmitMsg(null)

    const form = new FormData()
    form.append('month_year', monthYear)
    form.append('revenue_earned', revenue)
    form.append('facture', file)
    if (iban) form.append('iban', iban)
    if (accountHolder) form.append('account_holder', accountHolder)

    const r = await fetch('/api/commissions/submit', { method: 'POST', body: form })
    const d = await r.json()

    if (r.ok) {
      setSubmitMsg({ ok: true, text: 'Facture soumise avec succès. L\'admin va vérifier sous 48h.' })
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      setRevenue('')
      await loadRequests()
      setTimeout(() => setTab('list'), 2000)
    } else {
      setSubmitMsg({ ok: false, text: d.error ?? 'Erreur inconnue' })
    }
    setSubmitting(false)
  }

  const inputSt: React.CSSProperties = {
    width: '100%', background: 'var(--off)', border: '1.5px solid var(--border)',
    borderRadius: 10, padding: '10px 14px', fontSize: 14, color: 'var(--text)',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }
  const labelSt: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em',
    textTransform: 'uppercase', display: 'block', marginBottom: 6,
  }

  const alreadySubmittedThisMonth = requests.some(r => r.month_year === monthYear && r.status !== 'rejetee')

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 800, fontSize: 24, color: 'var(--text)', marginBottom: 24 }}>
        Mes commissions
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--off)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {(['list', 'submit'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: tab === t ? 'var(--white)' : 'transparent',
              color: tab === t ? 'var(--text)' : 'var(--muted)',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t === 'list' ? 'Mes demandes' : 'Soumettre une facture'}
          </button>
        ))}
      </div>

      {/* Liste des demandes */}
      {tab === 'list' && (
        <div>
          {loading ? (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Chargement…</p>
          ) : requests.length === 0 ? (
            <div style={{ background: 'var(--white)', borderRadius: 14, padding: 32, textAlign: 'center', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Aucune demande pour l&apos;instant.</p>
              <button
                onClick={() => setTab('submit')}
                style={{ marginTop: 16, padding: '10px 20px', borderRadius: 8, background: '#43695A', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Soumettre ma première facture
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {requests.map(req => (
                <div
                  key={req.id}
                  style={{ background: 'var(--white)', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)', display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}
                >
                  {/* Mois */}
                  <div style={{ minWidth: 80 }}>
                    <div style={{ fontSize: 18, fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 800, color: 'var(--text)' }}>
                      {req.month_year}
                    </div>
                  </div>

                  {/* Montants */}
                  <div style={{ flex: 1, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Déclaré</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{fmtEur(req.revenue_earned)}</div>
                    </div>
                    {req.commission_amount != null && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>À recevoir</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#43695A' }}>{fmtEur(req.commission_amount)}</div>
                      </div>
                    )}
                    {req.payment_date && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Payé le</div>
                        <div style={{ fontSize: 14, color: 'var(--text)' }}>{fmtDate(req.payment_date)}</div>
                      </div>
                    )}
                    {req.payment_reference && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Référence</div>
                        <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'monospace' }}>{req.payment_reference}</div>
                      </div>
                    )}
                  </div>

                  {/* Statut + actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                      background: `${STATUS_COLORS[req.status]}22`,
                      color: STATUS_COLORS[req.status] ?? 'var(--muted)',
                      letterSpacing: '0.06em',
                    }}>
                      {STATUS_LABELS[req.status] ?? req.status}
                    </span>
                    {req.facture_url && (
                      <a
                        href={req.facture_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px' }}
                      >
                        Voir facture PDF
                      </a>
                    )}
                  </div>

                  {/* Notes admin */}
                  {req.admin_notes && (
                    <div style={{ width: '100%', background: 'rgba(67,105,90,0.06)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text)' }}>
                      Note admin : {req.admin_notes}
                    </div>
                  )}
                  {req.rejection_reason && (
                    <div style={{ width: '100%', background: 'rgba(224,82,82,0.07)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#E05252' }}>
                      Rejet : {req.rejection_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulaire de soumission */}
      {tab === 'submit' && (
        <div style={{ background: 'var(--white)', borderRadius: 14, padding: '28px 32px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
          <h2 style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: 18, color: 'var(--text)', margin: '0 0 20px' }}>
            Soumettre une facture de commission
          </h2>

          {alreadySubmittedThisMonth && (
            <div style={{ background: 'rgba(200,121,10,0.1)', border: '1px solid rgba(200,121,10,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#C8790A' }}>
              Tu as déjà soumis une demande pour {monthYear}. Change le mois ou attends la validation.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelSt}>Mois concerné</label>
              <input
                type="month"
                value={monthYear}
                onChange={e => setMonthYear(e.target.value)}
                max={getCurrentMonthYear()}
                required
                style={inputSt}
              />
            </div>

            <div>
              <label style={labelSt}>Revenus générés ce mois (€ N1 + N2 + missions)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="Ex: 1200.00"
                value={revenue}
                onChange={e => setRevenue(e.target.value)}
                required
                style={inputSt}
              />
            </div>

            <div>
              <label style={labelSt}>Facture PDF <span style={{ color: '#E05252' }}>*</span></label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                required
                style={{ ...inputSt, padding: '8px 14px' }}
              />
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>PDF uniquement, max 5 Mo</p>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />

            <div>
              <label style={labelSt}>IBAN (pour le virement)</label>
              <input
                type="text"
                placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                value={iban}
                onChange={e => setIban(e.target.value)}
                style={inputSt}
              />
            </div>

            <div>
              <label style={labelSt}>Nom du titulaire du compte</label>
              <input
                type="text"
                placeholder="Prénom Nom"
                value={accountHolder}
                onChange={e => setAccountHolder(e.target.value)}
                style={inputSt}
              />
            </div>

            {submitMsg && (
              <div style={{
                padding: '12px 16px', borderRadius: 10, fontSize: 13,
                background: submitMsg.ok ? 'rgba(67,105,90,0.1)' : 'rgba(224,82,82,0.1)',
                color: submitMsg.ok ? '#43695A' : '#E05252',
                border: `1px solid ${submitMsg.ok ? 'rgba(67,105,90,0.3)' : 'rgba(224,82,82,0.3)'}`,
              }}>
                {submitMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || alreadySubmittedThisMonth}
              style={{
                padding: '12px 24px', borderRadius: 10, background: '#43695A', border: 'none',
                color: 'white', fontSize: 14, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer',
                fontFamily: 'inherit', opacity: alreadySubmittedThisMonth ? 0.4 : 1,
              }}
            >
              {submitting ? 'Envoi en cours…' : 'Soumettre ma facture'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
