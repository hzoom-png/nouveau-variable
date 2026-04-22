import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getN2Rate, SUBSCRIPTION, N1_RATE } from '@/lib/constants'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { count: n1Count } = await supabase
    .from('referrals').select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id).eq('level', 1).eq('is_active', true)

  const { count: n2Count } = await supabase
    .from('referrals').select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id).eq('level', 2).eq('is_active', true)

  const n1 = n1Count ?? 0
  const n2 = n2Count ?? 0
  const n2Rate = getN2Rate(n1)
  const commN1 = n1 * SUBSCRIPTION * N1_RATE
  const commN2 = n2 * SUBSCRIPTION * (n2Rate / 100)
  const totalComm = commN1 + commN2

  const { data: history } = await supabase
    .from('commissions')
    .select('*')
    .eq('beneficiary_id', user.id)
    .order('created_at', { ascending: false })
    .limit(12)

  const now = new Date()
  const monthLabel = format(now, 'MMMM yyyy', { locale: fr })

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Current month summary */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
        <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '17px', color: 'var(--text)', marginBottom: '16px' }}>
          Commissions — {monthLabel}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {[
            { label: `N1 (${n1} filleuls × 97€ × 40%)`, value: `${commN1.toFixed(2)} €`, color: '#43695A' },
            { label: `N2 (${n2} filleuls × 97€ × ${n2Rate}%)`, value: `${commN2.toFixed(2)} €`, color: '#4B7BF5' },
            { label: 'Total brut', value: `${totalComm.toFixed(2)} €`, color: '#E8A020' },
          ].map(k => (
            <div key={k.label} style={{ background: 'var(--off)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>{k.label}</div>
              <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 800, fontSize: '22px', color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', fontSize: '13px', color: 'var(--muted)' }}>
          <strong>Rappel fiscal :</strong> Ces commissions sont des revenus BNC (prestations de services). Taux de cotisations auto-entrepreneur : 22%. Seuil AE 2024 : 77 700 €.
        </div>
      </div>

      {/* Billing info */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
        <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '17px', color: 'var(--text)', marginBottom: '16px' }}>
          Informations de facturation
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Nom / Raison sociale', placeholder: 'Dupont Gaultier' },
            { label: 'SIRET', placeholder: '123 456 789 00012' },
            { label: 'Adresse', placeholder: '12 rue de la Paix' },
            { label: 'Code postal / Ville', placeholder: '69001 Lyon' },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>{f.label}</label>
              <input
                type="text"
                placeholder={f.placeholder}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '14px', fontFamily: 'inherit' }}
              />
            </div>
          ))}
        </div>
        <button
          style={{ padding: '10px 20px', borderRadius: '10px', background: '#43695A', color: 'white', fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer' }}
        >
          Générer la facture PDF
        </button>
        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--muted)' }}>
          La génération PDF sera disponible dans la prochaine version. Pour l&apos;instant, utilisez le récapitulatif ci-dessus.
        </div>
      </div>

      {/* History */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 6px rgba(67,105,90,0.07)' }}>
        <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, fontSize: '17px', color: 'var(--text)', marginBottom: '16px' }}>
          Historique des commissions
        </div>
        {!history?.length && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px', fontSize: '14px' }}>
            Aucune commission enregistrée
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {history?.map(c => (
            <div key={String(c.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                  N{c.level} — {String(c.period_month).padStart(2, '0')}/{c.period_year}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{c.commission_rate}%</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontFamily: 'var(--font-jost, Jost, sans-serif)', fontWeight: 700, color: '#43695A', fontSize: '16px' }}>
                  {Number(c.commission_amount).toFixed(2)} €
                </div>
                <div style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                  background: c.status === 'paid' ? 'var(--green-pale)' : c.status === 'invoiced' ? 'var(--blue-pale)' : 'var(--amber-pale)',
                  color: c.status === 'paid' ? '#43695A' : c.status === 'invoiced' ? '#4B7BF5' : '#E8A020',
                }}>
                  {c.status === 'paid' ? 'Payé' : c.status === 'invoiced' ? 'Facturé' : 'En attente'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
