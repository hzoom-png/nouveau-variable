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

  // Match last 9 digits to handle any phone format stored in candidatures
  const last9 = user.phone.replace(/\D/g, '').slice(-9)

  const svc = createServiceClient()
  const { data: cand } = await svc
    .from('candidatures')
    .select('full_name, email, phone, is_founder, is_founder_mode, status')
    .ilike('phone', `%${last9}`)
    .limit(1)
    .single()

  if (!cand) return NextResponse.json({ isFounder: false })

  // Accept if is_founder_mode = true OR (status = accepted AND is_founder = true)
  if (cand.is_founder_mode !== true && (cand.status !== 'accepted' || cand.is_founder !== true)) {
    return NextResponse.json({ isFounder: false })
  }

  const nameParts = (cand.full_name as string).trim().split(' ')
  const prenom = nameParts[0] ?? ''
  const nom = nameParts.slice(1).join(' ')

  return NextResponse.json({ isFounder: true, prenom, nom, email: cand.email as string })
}
