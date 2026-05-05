import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) return NextResponse.json({ members: [] })

  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, first_name, last_name, avatar_url, referral_code, role_title, slug')
    .eq('is_active', true)
    .or(`display_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,referral_code.ilike.%${q}%`)
    .neq('id', user.id)
    .limit(8)

  return NextResponse.json({ members: data ?? [] })
}
