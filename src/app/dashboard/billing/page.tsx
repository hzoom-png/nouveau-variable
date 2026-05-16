import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import BillingClient from './BillingClient'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const svc = createServiceClient()

  const { data: profile } = await svc
    .from('profiles')
    .select('is_active, created_at, tokens_balance, subscription_status, subscription_plan, subscription_start, stripe_customer_id, is_manually_activated')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const { data: invoices } = await svc
    .from('invoices')
    .select('id, created_at, amount_eur, invoice_pdf_url, period_start, period_end')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(24)

  const memberSince = profile.created_at
    ? format(new Date(profile.created_at), 'd MMMM yyyy', { locale: fr })
    : '—'

  const renewalDate = profile.subscription_start
    ? (() => {
        const start = new Date(profile.subscription_start)
        const next  = new Date(start)
        if (profile.subscription_plan === 'annual') {
          next.setFullYear(next.getFullYear() + 1)
        } else {
          next.setMonth(next.getMonth() + 1)
        }
        return format(next, 'd MMMM yyyy', { locale: fr })
      })()
    : null

  return (
    <BillingClient
      email={user.email ?? ''}
      isActive={profile.is_active ?? false}
      memberSince={memberSince}
      tokensBalance={profile.tokens_balance ?? 0}
      subscriptionStatus={profile.subscription_status ?? 'inactive'}
      subscriptionPlan={profile.subscription_plan ?? null}
      renewalDate={renewalDate}
      hasStripeCustomer={!!profile.stripe_customer_id}
      isManuallyActivated={profile.is_manually_activated ?? false}
      invoices={(invoices ?? []).map(inv => ({
        id:             inv.id as string,
        created_at:     inv.created_at as string,
        amount_eur:     inv.amount_eur as number,
        invoice_pdf_url: inv.invoice_pdf_url as string | null,
        period_start:   inv.period_start as string | null,
        period_end:     inv.period_end as string | null,
      }))}
    />
  )
}
