import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const memberId = new URL(request.url).searchParams.get('id')
  if (!memberId) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const svc = createServiceClient()

  const [{ data: profile }, { data: tokensTx }, { data: referrals }] = await Promise.all([
    svc.from('profiles').select('*').eq('id', memberId).single(),
    svc.from('tokens_transactions').select('*').eq('user_id', memberId).order('created_at', { ascending: false }).limit(10),
    svc.from('profiles').select('id, first_name, last_name, email, created_at').eq('referred_by', memberId),
  ])

  if (!profile) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  return NextResponse.json({ profile, tokensTx: tokensTx ?? [], referrals: referrals ?? [] })
}
