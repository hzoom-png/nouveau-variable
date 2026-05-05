import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const svc = createServiceClient()

  // Membres avec code parrainage
  const { data: members } = await svc
    .from('profiles')
    .select('id, first_name, last_name, email, referral_code, referred_by, is_active')
    .not('referral_code', 'is', null)
    .order('created_at', { ascending: false })

  // Compte les filleuls N1 par code parrainage
  const { data: allProfiles } = await svc
    .from('profiles').select('referred_by, is_active')

  const n1Map: Record<string, number> = {}
  for (const p of (allProfiles ?? [])) {
    if (p.referred_by && p.is_active) {
      n1Map[p.referred_by] = (n1Map[p.referred_by] ?? 0) + 1
    }
  }

  // Commissions avec nom de l'affilié
  const { data: commissionsRaw } = await svc
    .from('commissions')
    .select('*, profiles(first_name, last_name)')
    .order('created_at', { ascending: false })

  const commissions = (commissionsRaw ?? []).map(c => {
    const r = c as Record<string, unknown>
    const profile = r.profiles as { first_name?: string; last_name?: string } | null
    return {
      id:             r.id,
      affiliate_id:   r.affiliate_id,
      affiliate_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : String(r.affiliate_id ?? ''),
      amount:         r.amount,
      month:          r.month,
      status:         r.status,
    }
  })

  const affiliates = (members ?? []).map(m => ({
    id:              m.id,
    first_name:      m.first_name,
    last_name:       m.last_name,
    email:           m.email,
    referral_code:   m.referral_code,
    active_referrals: n1Map[m.referral_code ?? ''] ?? 0,
  }))

  return NextResponse.json({ affiliates, commissions: commissions ?? [] })
}
