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
  const sixMonthsAgo = new Date(Date.now() - 6 * 30.44 * 24 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  // 1. Members subscribed 6+ months ago
  const { data: bySubscription, error: fetchError } = await svc
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

  // 2. Founders not yet marked eligible
  const { data: founders, error: foundersError } = await svc
    .from('profiles')
    .select('id')
    .is('n3_eligible_since', null)
    .eq('is_founder', true)

  if (foundersError) {
    console.error('[n3-eligibility-cron] founders fetch error:', foundersError.message)
  }

  let updatedCount = 0

  for (const profile of (bySubscription ?? [])) {
    const eligibleSince = new Date(
      new Date(profile.subscription_start as string).getTime() + 6 * 30.44 * 24 * 60 * 60 * 1000
    ).toISOString()
    const { error } = await svc
      .from('profiles')
      .update({ n3_eligible_since: eligibleSince })
      .eq('id', profile.id)
      .is('n3_eligible_since', null)
    if (!error) updatedCount++
    else console.error('[n3-eligibility-cron] update error:', profile.id, error.message)
  }

  for (const founder of (founders ?? [])) {
    const { error } = await svc
      .from('profiles')
      .update({ n3_eligible_since: now })
      .eq('id', founder.id)
      .is('n3_eligible_since', null)
    if (!error) updatedCount++
    else console.error('[n3-eligibility-cron] founder update error:', founder.id, error.message)
  }

  const total = (bySubscription ?? []).length + (founders ?? []).length
  console.log(`[n3-eligibility-cron] ${updatedCount}/${total} profiles marked N3 eligible`)

  return NextResponse.json({
    success: true,
    checked: total,
    updated: updatedCount,
  })
}
