import { createServiceClient } from '@/lib/supabase/service'

// Génère une URL signée valable 1 heure
export async function getSignedAvatarUrl(avatarPath: string): Promise<string | null> {
  if (!avatarPath) return null
  const svc = createServiceClient()
  const { data, error } = await svc.storage
    .from('avatars')
    .createSignedUrl(avatarPath, 3600)
  if (error || !data) return null
  return data.signedUrl
}

// Fallback sur avatar_url si avatar_path absent
export async function resolveAvatar(profile: { avatar_url?: string; avatar_path?: string }): Promise<string | null> {
  if (profile.avatar_path) return getSignedAvatarUrl(profile.avatar_path)
  return profile.avatar_url ?? null
}
