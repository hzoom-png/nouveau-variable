import { createServiceClient } from '@/lib/supabase/service'

export interface ClubSettings {
  waitlist_mode: boolean
}

let settingsCache: { data: ClubSettings; fetchedAt: number } | null = null
const CACHE_TTL_MS = 60_000

export async function getClubSettings(): Promise<ClubSettings> {
  const now = Date.now()

  if (settingsCache && now - settingsCache.fetchedAt < CACHE_TTL_MS) {
    return settingsCache.data
  }

  const svc = createServiceClient()
  const { data, error } = await svc
    .from('club_settings')
    .select('waitlist_mode')
    .eq('id', 1)
    .single()

  if (error || !data) {
    console.error('[SETTINGS] getClubSettings failed', error)
    return { waitlist_mode: true }
  }

  settingsCache = { data, fetchedAt: now }
  return data
}

export async function setWaitlistMode(enabled: boolean): Promise<void> {
  const svc = createServiceClient()
  const { error } = await svc
    .from('club_settings')
    .update({ waitlist_mode: enabled, updated_at: new Date().toISOString() })
    .eq('id', 1)

  if (error) {
    console.error('[SETTINGS] setWaitlistMode failed', error)
    throw new Error('Impossible de mettre à jour le paramètre waitlist_mode')
  }

  settingsCache = null
  console.log('[SETTINGS] waitlist_mode updated', { enabled })
}
