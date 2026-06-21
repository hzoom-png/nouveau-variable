/**
 * Feature flags globaux NV
 * Activer/désactiver depuis Vercel → Settings → Environment Variables
 * sans redéployer.
 *
 * Par défaut : TOUT est false (safe).
 */
export const FEATURES = {
  /** Redirige /dashboard → /dashboard/profile si profil incomplet */
  ONBOARDING_REDIRECT: process.env.FEATURE_ONBOARDING_REDIRECT === 'true',
} as const

if (typeof window === 'undefined') {
  const active = (Object.entries(FEATURES) as [string, boolean][])
    .filter(([, v]) => v)
    .map(([k]) => k)
  if (active.length > 0) {
    console.log('[FEATURES_ACTIVE]', active.join(', '))
  }
}
