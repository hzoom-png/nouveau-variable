import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'
import type { CommercialContext } from '@/lib/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('commercial_context')
    .eq('id', user.id)
    .single()

  const initialCtx: CommercialContext = (profile?.commercial_context as CommercialContext) ?? {}

  return <SettingsClient initialCtx={initialCtx} />
}
