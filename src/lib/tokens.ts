import { createServiceClient } from './supabase/service'

export type ToolName = 'terrain' | 'deallink' | 'replique' | 'sidehustle'

const COSTS: Record<ToolName, number> = {
  terrain:    5,
  deallink:   5,
  replique:   3,
  sidehustle: 8,
}

export async function consumeTokens(userId: string, tool: ToolName): Promise<{
  success: boolean
  tokensLeft: number
  error?: string
}> {
  const cost  = COSTS[tool]
  const admin = createServiceClient()

  // Appel atomique via RPC — évite la race condition read-then-write
  const { data, error } = await admin.rpc('consume_tokens', {
    p_user_id: userId,
    p_tool:    tool,
  })

  if (error) {
    console.error('[tokens] Erreur RPC consume_tokens:', error.message)
    return { success: false, tokensLeft: 0, error: `[RPC] ${error.message}` }
  }

  const result = data as { success: boolean; error?: string; tokensLeft: number }
  return {
    success:    result.success,
    tokensLeft: result.tokensLeft ?? 0,
    error:      result.error,
  }
}
