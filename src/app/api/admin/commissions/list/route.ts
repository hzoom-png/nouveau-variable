import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? ''
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  const svc = createServiceClient()

  let query = svc
    .from('commission_requests')
    .select(`
      id,
      month_year,
      status,
      revenue_earned,
      commission_amount,
      submitted_at,
      validated_at,
      payment_date,
      payment_reference,
      admin_notes,
      rejection_reason,
      facture_url,
      profiles!affiliate_id (
        id,
        first_name,
        last_name,
        email
      )
    `, { count: 'exact' })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) {
    console.error('[admin/commissions/list] Error:', error.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  const items = (data ?? []).map(r => {
    const raw = r.profiles as unknown
    const profileArr = Array.isArray(raw) ? raw : (raw ? [raw] : [])
    const profile = (profileArr[0] ?? null) as { id: string; first_name: string | null; last_name: string | null; email: string } | null
    return {
      id:                r.id,
      month_year:        r.month_year,
      status:            r.status,
      revenue_earned:    r.revenue_earned,
      commission_amount: r.commission_amount,
      submitted_at:      r.submitted_at,
      validated_at:      r.validated_at,
      payment_date:      r.payment_date,
      payment_reference: r.payment_reference,
      admin_notes:       r.admin_notes,
      rejection_reason:  r.rejection_reason,
      facture_url:       r.facture_url,
      affiliate: profile ? {
        id:        profile.id,
        prenom:    profile.first_name ?? '',
        nom:       profile.last_name ?? '',
        email:     profile.email,
      } : null,
    }
  })

  return NextResponse.json({ total: count ?? 0, items })
}
