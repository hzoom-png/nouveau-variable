import { createServiceClient } from './supabase/service'

export const BADGES = {
  // Affiliation badges
  affiliate_1: {
    id: 'affiliate_1',
    name: 'Parrain Initié',
    description: '1 filleul actif',
    icon: '👥',
    color: '#36a64f',
    rarity: 3,
  },
  affiliate_5: {
    id: 'affiliate_5',
    name: 'Parrain Actif',
    description: '5 filleuls actifs',
    icon: '👥👥',
    color: '#2F5446',
    rarity: 4,
  },
  affiliate_10: {
    id: 'affiliate_10',
    name: 'Réseau Pro',
    description: '10 filleuls actifs',
    icon: '🌐',
    color: '#1a3a2e',
    rarity: 5,
  },
  affiliate_20: {
    id: 'affiliate_20',
    name: 'Force Gravitationnelle',
    description: '20 filleuls actifs',
    icon: '⭐',
    color: '#D4AF37',
    rarity: 6,
  },
  affiliate_50: {
    id: 'affiliate_50',
    name: 'Maître du Réseau',
    description: '50 filleuls actifs',
    icon: '👑',
    color: '#D4AF37',
    rarity: 7,
  },
  affiliate_100: {
    id: 'affiliate_100',
    name: 'Mentor Légendaire',
    description: '100 filleuls actifs',
    icon: '♦️',
    color: '#D4AF37',
    rarity: 8,
  },

  // Project badges
  project_1: {
    id: 'project_1',
    name: 'Créateur',
    description: '1 projet publié',
    icon: '💡',
    color: '#4A90E2',
    rarity: 4,
  },
  project_5: {
    id: 'project_5',
    name: 'Entrepreneur Confirmé',
    description: '5 projets publiés',
    icon: '🚀',
    color: '#5BA3F5',
    rarity: 5,
  },
  project_10: {
    id: 'project_10',
    name: 'Portfolio Star',
    description: '10 projets publiés',
    icon: '✨',
    color: '#D4AF37',
    rarity: 6,
  },

  // Engagement badges
  engagement_10: {
    id: 'engagement_10',
    name: 'Contributeur',
    description: '10+ interactions (likes, suggestions)',
    icon: '💬',
    color: '#7C3AED',
    rarity: 4,
  },
  engagement_50: {
    id: 'engagement_50',
    name: 'Supporter en Or',
    description: '50+ interactions',
    icon: '💎',
    color: '#D4AF37',
    rarity: 6,
  },

  // VIP badge
  vip: {
    id: 'vip',
    name: 'Accès VIP',
    description: 'Membre VIP du club',
    icon: '🔑',
    color: '#D4AF37',
    rarity: 8,
  },
} as const

export type BadgeId = keyof typeof BADGES

export async function checkBadgeConditions(userId: string): Promise<BadgeId[]> {
  const service = createServiceClient()

  // 1. Get user's current stats in parallel
  const [profileRes, projectsRes, interactionsRes, badgesRes] = await Promise.all([
    service
      .from('profiles')
      .select('referral_code, is_vip')
      .eq('id', userId)
      .single(),
    service
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true),
    service
      .from('project_interactions')
      .select('id')
      .eq('user_id', userId)
      .in('type', ['like', 'suggestion']),
    service
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId),
  ])

  const profile = profileRes.data
  if (!profile) return []

  // 2. Count active filleuls
  const affiliatesRes = await service
    .from('profiles')
    .select('id')
    .eq('referred_by', profile.referral_code)
    .eq('is_active', true)

  const stats = {
    affiliates_count: affiliatesRes.data?.length ?? 0,
    projects_published: projectsRes.data?.length ?? 0,
    engagement_interactions: interactionsRes.data?.length ?? 0,
    is_vip: profile.is_vip ?? false,
  }

  const existingBadges = badgesRes.data?.map(b => b.badge_id) ?? []
  const newBadges: BadgeId[] = []

  // 3. Check each badge condition
  const badgeKeys = Object.keys(BADGES) as BadgeId[]
  for (const badgeId of badgeKeys) {
    if (existingBadges.includes(badgeId)) continue

    let unlocked = false

    if (badgeId.startsWith('affiliate_')) {
      const count = parseInt(badgeId.split('_')[1])
      unlocked = stats.affiliates_count >= count
    } else if (badgeId.startsWith('project_')) {
      const count = parseInt(badgeId.split('_')[1])
      unlocked = stats.projects_published >= count
    } else if (badgeId.startsWith('engagement_')) {
      const count = parseInt(badgeId.split('_')[1])
      unlocked = stats.engagement_interactions >= count
    } else if (badgeId === 'vip') {
      unlocked = stats.is_vip
    }

    if (unlocked) newBadges.push(badgeId)
  }

  return newBadges
}
