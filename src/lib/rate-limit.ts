import { createServiceClient } from '@/lib/supabase/service'

/**
 * Rate limiting persistant via Supabase.
 * Requires: supabase/migrations/rate_limits.sql + rate_limit_fn.sql applied.
 * Returns true if the request is allowed, false if rate limited.
 */
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const svc = createServiceClient()
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString()

  const { data, error } = await svc.rpc('upsert_rate_limit', {
    p_key:    key,
    p_max:    maxRequests,
    p_window: windowStart,
  })

  if (error) {
    // Si le RPC n'existe pas encore (migration non appliquée) : fail open
    console.error('[rateLimit] RPC indisponible, passage autorisé:', error.message)
    return true
  }

  return data as boolean
}
