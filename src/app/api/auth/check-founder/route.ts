import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.phone) return NextResponse.json({ isFounder: false })

  // ADMIN BYPASS: 0650434090
  if (user.phone === '+33650434090' || user.phone === '0650434090') {
    return NextResponse.json({ isFounder: true, prenom: 'Admin', nom: 'User', email: user.email as string })
  }

  // Find candidature by last 9 digits (flexible phone format matching)
  const last9 = user.phone.replace(/\D/g, '').slice(-9)

  const svc = createServiceClient()
  const { data: cand } = await svc
    .from('candidatures')
    .select('full_name, email, phone, is_founder, is_founder_mode, status')
    .ilike('phone', `%${last9}`)
    .maybeSingle()

  if (!cand) return NextResponse.json({ isFounder: false })

  // Two paths to founder access:
  // 1. Has is_founder OR is_founder_mode flag
  // 2. Has accepted candidature AND is_founder
  const hasFounderFlag = cand.is_founder === true || cand.is_founder_mode === true
  const hasAcceptedStatus = cand.status === 'accepted'

  if (!hasFounderFlag && !hasAcceptedStatus) {
    return NextResponse.json({ isFounder: false })
  }

  const nameParts = (cand.full_name as string).trim().split(' ')
  const prenom = nameParts[0] ?? ''
  const nom = nameParts.slice(1).join(' ')

  return NextResponse.json({ isFounder: true, prenom, nom, email: cand.email as string })
}
