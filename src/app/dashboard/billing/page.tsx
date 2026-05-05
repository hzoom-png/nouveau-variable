import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import BillingClient from './BillingClient'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_active, created_at, tokens_balance')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const memberSince = profile.created_at
    ? format(new Date(profile.created_at), 'd MMMM yyyy', { locale: fr })
    : '—'

  return (
    <BillingClient
      isActive={profile.is_active ?? false}
      memberSince={memberSince}
      tokensBalance={profile.tokens_balance ?? 0}
    />
  )
}
