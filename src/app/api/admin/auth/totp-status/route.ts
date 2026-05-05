import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ configured: false, authenticated: false })

  const svc = createServiceClient()
  const { data } = await svc
    .from('admin_totp')
    .select('verified')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ configured: !!data?.verified, authenticated: true })
}
