import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { checkBadgeConditions } from '@/lib/badges'
import { sendEmail, TEMPLATE_IDS } from '@/lib/email'

export async function GET(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const service = createServiceClient()
  let totalBadgesUnlocked = 0

  // Fetch all active users
  const { data: users } = await service
    .from('profiles')
    .select('id, email, first_name')
    .eq('is_active', true)

  if (!users || users.length === 0) {
    return NextResponse.json({ badgesUnlocked: 0 })
  }

  for (const user of users) {
    try {
      const newBadges = await checkBadgeConditions(user.id)

      if (newBadges.length > 0) {
        // Insert new badges
        const { error: insertErr } = await service
          .from('user_badges')
          .insert(newBadges.map(badgeId => ({
            user_id: user.id,
            badge_id: badgeId,
          })))

        if (insertErr) {
          console.error(`[badges-daily] insert error for user ${user.id}:`, insertErr.code)
          continue
        }

        totalBadgesUnlocked += newBadges.length

        // Send email notification (fire & forget)
        sendEmail({
          to: { email: user.email, name: user.first_name },
          templateId: TEMPLATE_IDS.BADGE_UNLOCK,
          params: {
            prenom: user.first_name,
            badges_count: String(newBadges.length),
            badge_names: newBadges.join(', '),
          },
        }).catch(err => console.error(`[badges-daily] email error for user ${user.id}:`, err))
      }
    } catch (err) {
      console.error(`[badges-daily] error for user ${user.id}:`, err)
      continue
    }
  }

  return NextResponse.json({ badgesUnlocked: totalBadgesUnlocked })
}
