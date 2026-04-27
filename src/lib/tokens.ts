import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type ToolName = 'terrain' | 'deallink' | 'replique'

const COSTS: Record<ToolName, number> = {
  terrain: 30,
  deallink: 20,
  replique: 25,
}

export async function consumeTokens(userId: string, tool: ToolName): Promise<{
  success: boolean
  tokensLeft: number
  error?: string
}> {
  const cost = COSTS[tool]

  const { data: profile, error: fetchErr } = await admin
    .from('profiles')
    .select('tokens_balance, tokens_total_used')
    .eq('id', userId)
    .single()

  if (fetchErr || !profile) {
    // Migration may not be applied yet — allow through
    return { success: true, tokensLeft: 0 }
  }

  const balance: number = profile.tokens_balance ?? 0
  const totalUsed: number = profile.tokens_total_used ?? 0

  if (balance < cost) {
    return {
      success: false,
      tokensLeft: balance,
      error: `Solde insuffisant — il te reste ${balance} tokens (coût : ${cost}). Visite Mon affiliation pour en gagner.`,
    }
  }

  const newBalance = balance - cost

  await admin.from('tokens_transactions').insert({
    user_id: userId,
    tool,
    tokens_used: cost,
    tokens_before: balance,
    tokens_after: newBalance,
  })

  await admin.from('profiles').update({
    tokens_balance: newBalance,
    tokens_total_used: totalUsed + cost,
  }).eq('id', userId)

  return { success: true, tokensLeft: newBalance }
}
