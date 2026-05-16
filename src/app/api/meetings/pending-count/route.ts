import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 })

  const { count } = await supabase
    .from('meeting_requests')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('status', 'pending')

  return NextResponse.json({ count: count ?? 0 })
}
