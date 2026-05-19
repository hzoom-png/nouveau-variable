import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.phone) return NextResponse.json({ isFounder: false })

  // Match last 9 digits to handle any phone format stored in candidatures
  const last9 = user.phone.replace(/\D/g, '').slice(-9)

  const svc = createServiceClient()
  const { data: cand } = await svc
    .from('candidatures')
    .select('full_name, email, phone')
    .eq('status', 'accepted')
    .eq('is_founder', true)
    .ilike('phone', `%${last9}`)
    .limit(1)
    .single()

  if (!cand) return NextResponse.json({ isFounder: false })

  const nameParts = (cand.full_name as string).trim().split(' ')
  const prenom = nameParts[0] ?? ''
  const nom = nameParts.slice(1).join(' ')

  return NextResponse.json({ isFounder: true, prenom, nom, email: cand.email as string })
}
