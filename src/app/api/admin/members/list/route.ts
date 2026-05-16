import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  // Sanitisation : caractères alphanumériques, espaces, @ . _ - et accents français uniquement
  const search   = (searchParams.get('search') ?? '')
    .replace(/[^a-zA-Z0-9 @._\-éèêëàâùûüïî]/g, '')
    .slice(0, 100)
  const status   = searchParams.get('status')   ?? 'all'
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = 50

  const svc = createServiceClient()

  let q = svc.from('profiles')
    .select('id, first_name, last_name, email, phone, is_active, is_manually_activated, tokens_balance, points_balance, subscription_plan, referral_code, created_at, profile_visible', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (status === 'active')   q = q.eq('is_active', true)
  if (status === 'inactive') q = q.eq('is_active', false)

  if (search) {
    q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data, count, error } = await q

  if (error) {
    console.error('[admin/members/list] Erreur:', error.message)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  const members = (data ?? []).map(m => {
    const row = m as unknown as Record<string, unknown>
    return {
      ...m,
      tokens:  row.tokens_balance ?? 0,
      points:  row.points_balance ?? 0,
      plan_id: row.subscription_plan ?? null,
    }
  })

  return NextResponse.json({ members, total: count ?? 0, page, pageSize })
}
