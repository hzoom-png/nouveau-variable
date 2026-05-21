import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const svc = createServiceClient()

  const { data, error } = await svc
    .from('commission_requests')
    .select('id, month_year, status, revenue_earned, commission_amount, submitted_at, validated_at, payment_date, payment_reference, admin_notes, rejection_reason, facture_url')
    .eq('affiliate_id', user.id)
    .order('month_year', { ascending: false })

  if (error) {
    console.error('[commissions/my-requests] Error:', error.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  return NextResponse.json({ requests: data ?? [] })
}
