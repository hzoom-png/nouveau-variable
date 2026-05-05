import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const svc = createServiceClient()

  const [
    { count: activeMembers },
    { count: inactiveMembers },
    { count: pendingCandidatures },
    { count: totalCandidatures },
    { data: recentCandidatures },
    { data: recentMembers },
    { data: topToolsRaw },
    { data: mrrByMonthRaw },
    { data: commissionsPending },
    { count: totalBroadcasts },
  ] = await Promise.all([
    svc.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('role', 'member'),
    svc.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', false).eq('role', 'member'),
    svc.from('candidatures').select('*', { count: 'exact', head: true }).in('status', ['received', 'reviewed']),
    svc.from('candidatures').select('*', { count: 'exact', head: true }),
    svc.from('candidatures').select('id, full_name, email, status, created_at').order('created_at', { ascending: false }).limit(5),
    svc.from('profiles').select('id, first_name, last_name, email, is_active, plan_id, created_at').eq('role', 'member').order('created_at', { ascending: false }).limit(5),
    svc.from('tokens_transactions').select('tool_name').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).limit(5000),
    svc.from('profiles').select('created_at').eq('is_active', true).eq('role', 'member').gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()),
    svc.from('commissions').select('amount').eq('status', 'pending'),
    svc.from('broadcasts').select('*', { count: 'exact', head: true }),
  ])

  // Aggregate top tools
  const toolCounts: Record<string, number> = {}
  for (const row of (topToolsRaw ?? [])) {
    const t = (row as { tool_name: string }).tool_name
    toolCounts[t] = (toolCounts[t] ?? 0) + 1
  }
  const topTools = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  // MRR by month (last 6 months)
  const monthCounts: Record<string, number> = {}
  for (const row of (mrrByMonthRaw ?? [])) {
    const m = (row as { created_at: string }).created_at.slice(0, 7)
    monthCounts[m] = (monthCounts[m] ?? 0) + 1
  }
  const mrrByMonth = Object.entries(monthCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, mrr: count * 97 }))

  const active = activeMembers ?? 0
  const mrr    = active * 97

  const totalCommissionsPending = (commissionsPending ?? []).reduce(
    (s: number, c: { amount: number }) => s + (c.amount ?? 0), 0
  )

  return NextResponse.json({
    activeMembers:            active,
    inactiveMembers:          inactiveMembers ?? 0,
    mrr,
    arr:                      mrr * 12,
    pendingCandidatures:      pendingCandidatures ?? 0,
    totalCandidatures:        totalCandidatures ?? 0,
    mrrByMonth,
    topTools,
    recentCandidatures:       recentCandidatures ?? [],
    recentMembers:            recentMembers ?? [],
    totalCommissionsPending,
    totalBroadcastsSent:      totalBroadcasts ?? 0,
    occupancyRate:            Math.round(active / 1000 * 100),
  })
}
