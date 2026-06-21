/**
 * Vérification profil utilisateur — fonction pure, pas d'appel DB.
 * Le profil est déjà chargé dans dashboard/layout.tsx.
 *
 * Utilisée par :
 *   - src/app/dashboard/layout.tsx (bannière)
 *   - src/app/dashboard/page.tsx (redirection)
 */

export interface ProfileCompletion {
  isComplete: boolean
  percentComplete: number
  missingCount: number
}

interface ProfileFields {
  onboarding_completed?: boolean | null
  first_name?: string | null
  last_name?: string | null
  role_title?: string | null
  cities?: string[] | null
  phone?: string | null
}

export function getProfileCompletion(profile: ProfileFields): ProfileCompletion {
  // Source de vérité : flag explicite
  if (profile.onboarding_completed === true) {
    return { isComplete: true, percentComplete: 100, missingCount: 0 }
  }

  const checks = [
    !!profile.first_name?.trim(),
    !!profile.last_name?.trim(),
    !!profile.role_title?.trim(),
    Array.isArray(profile.cities) && profile.cities.length > 0,
    !!profile.phone?.trim(),
  ]

  const done = checks.filter(Boolean).length
  const total = checks.length

  return {
    isComplete: done === total,
    percentComplete: Math.round((done / total) * 100),
    missingCount: total - done,
  }
}
