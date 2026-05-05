import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const period   = searchParams.get('period') ?? '7d'
  const tool     = searchParams.get('tool')
  const memberId = searchParams.get('member')

  const periodMap: Record<string, number> = { today: 1, '7d': 7, '30d': 30 }
  const days = periodMap[period] ?? 7
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const svc = createServiceClient()

  let q = svc
    .from('tokens_transactions')
    .select('id, user_id, tool_name, tokens_used, created_at, profiles(first_name, last_name, email)', { count: 'exact' })
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200)

  if (tool)     q = q.eq('tool_name', tool)
  if (memberId) q = q.eq('user_id', memberId)

  const { data, count, error } = await q
  if (error) {
    console.error('[admin/activity] Erreur:', error.message)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  // Stats rapides
  const toolCounts: Record<string, number> = {}
  const memberCounts: Record<string, { name: string; count: number }> = {}
  let totalTokens = 0

  for (const row of (data ?? [])) {
    const r = row as Record<string, unknown>
    const tn = r.tool_name as string
    const uid = r.user_id as string
    const tu = r.tokens_used as number
    toolCounts[tn] = (toolCounts[tn] ?? 0) + 1
    totalTokens += tu ?? 0
    const profile = r.profiles as { first_name?: string; last_name?: string } | null
    const name = profile ? `${profile.first_name} ${profile.last_name}`.trim() : uid
    if (!memberCounts[uid]) memberCounts[uid] = { name, count: 0 }
    memberCounts[uid].count++
  }

  const topTool = Object.entries(toolCounts).sort((a, b) => b[1] - a[1])[0]
  const topMember = Object.entries(memberCounts).sort((a, b) => b[1].count - a[1].count)[0]

  return NextResponse.json({
    activity: data ?? [],
    total: count ?? 0,
    topTool:    topTool?.[0],
    topMember:  topMember?.[1]?.name,
    totalTokens,
  })
}
