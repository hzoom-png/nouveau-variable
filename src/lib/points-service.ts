import { createServiceClient } from './supabase/service'
import { sendEmail, TEMPLATE_IDS } from './email'

export const POINTS_CONFIG = {
  affiliate: {
    first_accepted: 100,
    monthly_active: 20,
    milestone_5: 50,
    milestone_10: 100,
  },
  meetings: {
    accept_meeting: 30,
    complete_collaboration: 50,
  },
  projects: {
    publish_project: 50,
    reach_10_interactions: 25,
  },
  engagement: {
    like_given: 2,
    suggestion_given: 5,
  },
  milestones: {
    500: 100,
    1000: 200,
    5000: 500,
    10000: 1000,
  },
} as const

export async function awardPoints(
  userId: string,
  pointsAmount: number,
  action: string,
  actionId?: string,
): Promise<void> {
  if (pointsAmount <= 0) {
    console.warn('[POINTS] Non-positive points attempted:', { userId, pointsAmount, action })
    return
  }

  const service = createServiceClient()

  // 1. Get current totals
  const current = await service
    .from('user_points')
    .select('total_points, lifetime_points')
    .eq('user_id', userId)
    .single()

  const newTotal = (current.data?.total_points ?? 0) + pointsAmount
  const newLifetime = (current.data?.lifetime_points ?? 0) + pointsAmount

  // 2. Upsert user_points
  const { error: updateErr } = await service
    .from('user_points')
    .upsert(
      {
        user_id: userId,
        total_points: newTotal,
        lifetime_points: newLifetime,
        updated_at: new Date(),
      },
      { onConflict: 'user_id' },
    )

  if (updateErr) {
    console.error('[POINTS] Upsert error:', updateErr)
    return
  }

  // 3. Log in history
  const { error: historyErr } = await service
    .from('user_points_history')
    .insert({
      user_id: userId,
      points_earned: pointsAmount,
      action,
      action_id: actionId,
      metadata: { timestamp: new Date().toISOString() },
    })

  if (historyErr) console.error('[POINTS] History insert error:', historyErr)

  // 4. Check milestones
  const previousLifetime = current.data?.lifetime_points ?? 0
  const milestonesToUnlock = checkMilestones(previousLifetime, newLifetime)

  for (const milestone of milestonesToUnlock) {
    const bonusPoints = POINTS_CONFIG.milestones[milestone as keyof typeof POINTS_CONFIG.milestones]
    // Recursive call for milestone bonus (will not trigger nested milestones in practice)
    await awardPoints(userId, bonusPoints, `milestone_${milestone}`).catch(err =>
      console.error('[POINTS] Milestone bonus error:', err),
    )

    // Send milestone email (async, fire & forget)
    sendMilestoneEmail(userId, milestone).catch(err =>
      console.error('[POINTS] Milestone email error:', err),
    )
  }

  console.log('[POINTS AWARDED]', { userId, points: pointsAmount, action, newTotal })
}

function checkMilestones(before: number, after: number): number[] {
  const milestones = [500, 1000, 5000, 10000]
  return milestones.filter(m => before < m && after >= m)
}

export async function getUserPoints(
  userId: string,
): Promise<{ total: number; lifetime: number; history: any[] } | null> {
  const service = createServiceClient()

  const [pointsRes, historyRes] = await Promise.all([
    service
      .from('user_points')
      .select('total_points, lifetime_points')
      .eq('user_id', userId)
      .single(),
    service
      .from('user_points_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!pointsRes.data) return null

  return {
    total: pointsRes.data.total_points ?? 0,
    lifetime: pointsRes.data.lifetime_points ?? 0,
    history: historyRes.data ?? [],
  }
}

export function getNextMilestone(current: number): number {
  const milestones = [500, 1000, 5000, 10000]
  return milestones.find(m => m > current) ?? 10000
}

export function getLevelEmoji(points: number): string {
  if (points < 500) return '🌱'
  if (points < 1000) return '🌿'
  if (points < 5000) return '🌳'
  if (points < 10000) return '🌲'
  return '🏔️'
}

async function sendMilestoneEmail(userId: string, milestone: number): Promise<void> {
  const service = createServiceClient()

  const user = await service
    .from('profiles')
    .select('email, first_name')
    .eq('id', userId)
    .single()

  if (!user.data) return

  const bonusPoints =
    POINTS_CONFIG.milestones[milestone as keyof typeof POINTS_CONFIG.milestones] ?? 0

  await sendEmail({
    to: { email: user.data.email, name: user.data.first_name },
    templateId: TEMPLATE_IDS.MILESTONE_ATTEINT,
    params: {
      prenom: user.data.first_name,
      milestone: String(milestone),
      bonus_points: String(bonusPoints),
    },
  })
}
