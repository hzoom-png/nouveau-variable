import { createServiceClient } from '@/lib/supabase/service'
import LandingClient from './LandingClient'

export const revalidate = 60

async function getWaitlistCount(): Promise<number> {
  try {
    const svc = createServiceClient()
    const { count } = await svc
      .from('candidatures')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'accepted', 'active', 'pending_payment'])
    return count ?? 0
  } catch {
    return 0
  }
}

export default async function Page() {
  const count = await getWaitlistCount()
  return <LandingClient waitlistCount={count} />
}
