import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const Schema = z.object({
  phone:       z.string().min(8),
  first_name:  z.string().optional(),
  last_name:   z.string().optional(),
  referral_code: z.string().optional(),
  is_active:   z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide', details: parsed.error.flatten() }, { status: 400 })

  const { phone, first_name, last_name, referral_code, is_active } = parsed.data
  const svc = createServiceClient()

  // Create Supabase Auth user with phone
  const { data: authData, error: authError } = await svc.auth.admin.createUser({
    phone,
    phone_confirm: true,
  })
  if (authError) {
    console.error('[admin/members/create] Auth error:', authError.message)
    return NextResponse.json({ error: 'Erreur création compte', code: 'AUTH_ERROR' }, { status: 400 })
  }

  const newUserId = authData.user.id

  // Resolve referrer if code provided
  let referrerId: string | null = null
  if (referral_code) {
    const { data: referrer } = await svc
      .from('profiles')
      .select('id')
      .eq('referral_code', referral_code)
      .single()
    referrerId = referrer?.id ?? null
  }

  // Generate a unique referral_code for new member
  const newCode = Math.random().toString(36).slice(2, 8).toUpperCase()

  // Create profile
  const { error: profileError } = await svc.from('profiles').insert({
    id:           newUserId,
    phone,
    first_name:   first_name ?? null,
    last_name:    last_name ?? null,
    is_active,
    role:         'member',
    referral_code: newCode,
    referred_by:  referral_code ?? null,
    tokens_balance: 0,
    tokens_total_used: 0,
    points_balance: 0,
    onboarding_completed: false,
  })

  if (profileError) {
    await svc.auth.admin.deleteUser(newUserId)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Create referral relation if applicable
  if (referrerId) {
    await svc.from('referrals').insert({
      referrer_id: referrerId,
      referred_id: newUserId,
      level: 1,
    })
  }

  await logAdminAction(adminId, 'create_member', 'member', newUserId, { phone, is_active })

  return NextResponse.json({ success: true, userId: newUserId })
}
