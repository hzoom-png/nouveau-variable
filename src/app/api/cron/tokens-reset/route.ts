import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Only execute on 1st of month
  const now = new Date()
  if (now.getDate() !== 1) {
    return NextResponse.json({
      executed: false,
      message: `Non exécuté — aujourd'hui est le ${now.getDate()}, pas le 1er.`,
    })
  }

  const service = createServiceClient()

  // Reset tokens for all active subscriptions
  const { error, data } = await service
    .rpc('reset_tokens_monthly', { p_amount: 500 })

  if (error) {
    console.error('[tokens-reset] RPC error:', error.message)
    return NextResponse.json(
      { error: 'Erreur lors du reset des tokens' },
      { status: 500 }
    )
  }

  // If RPC doesn't exist, fallback to direct update
  if (!data) {
    const { count, error: updateErr } = await service
      .from('profiles')
      .update({ tokens_balance: 500 })
      .eq('subscription_status', 'active')

    if (updateErr) {
      console.error('[tokens-reset] update error:', updateErr.code)
      return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
    }

    return NextResponse.json({
      executed: true,
      profilesReset: count ?? 0,
    })
  }

  return NextResponse.json({
    executed: true,
    profilesReset: data,
  })
}
