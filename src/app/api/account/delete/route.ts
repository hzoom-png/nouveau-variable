import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function DELETE(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    await admin.from('deallinks').delete().eq('owner_id', user.id)
    await admin.from('meeting_requests').delete().eq('requester_id', user.id)
    await admin.from('meeting_requests').delete().eq('recipient_id', user.id)
    await admin.from('tokens_transactions').delete().eq('user_id', user.id)
    await admin.from('referrals').delete().eq('referrer_id', user.id)
    await admin.from('referrals').delete().eq('referee_id', user.id)
    await admin.from('profiles').delete().eq('id', user.id)
    await admin.auth.admin.deleteUser(user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
