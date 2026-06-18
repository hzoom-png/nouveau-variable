import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const authHeader = req.headers.get('authorization') ?? ''
  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(authHeader)
  if (expected.length !== received.length) return false
  return timingSafeEqual(expected, received)
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const svc = createServiceClient()

  // Find active members subscribed 6+ months ago who aren't yet marked N3 eligible
  const sixMonthsAgo = new Date(Date.now() - 6 * 30.44 * 24 * 60 * 60 * 1000).toISOString()

  const { data: profiles, error: fetchError } = await svc
    .from('profiles')
    .select('id, subscription_start')
    .is('n3_eligible_since', null)
    .eq('subscription_status', 'active')
    .not('subscription_start', 'is', null)
    .lt('subscription_start', sixMonthsAgo)

  if (fetchError) {
    console.error('[n3-eligibility-cron] fetch error:', fetchError.message)
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  }

  let updatedCount = 0

  for (const profile of (profiles ?? [])) {
    // Set n3_eligible_since to the exact date they crossed the 6-month threshold
    const eligibleSince = new Date(
      new Date(profile.subscription_start as string).getTime() + 6 * 30.44 * 24 * 60 * 60 * 1000
    ).toISOString()

    const { error: updateError } = await svc
      .from('profiles')
      .update({ n3_eligible_since: eligibleSince })
      .eq('id', profile.id)
      .is('n3_eligible_since', null)

    if (!updateError) {
      updatedCount++
    } else {
      console.error('[n3-eligibility-cron] update error for', profile.id, ':', updateError.message)
    }
  }

  console.log(`[n3-eligibility-cron] ${updatedCount}/${(profiles ?? []).length} profiles marked N3 eligible`)

  return NextResponse.json({
    success: true,
    checked: (profiles ?? []).length,
    updated: updatedCount,
  })
}
