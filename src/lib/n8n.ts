/**
 * Await-able N8N webhook call with 5s timeout.
 * Never throws — if N8N is down or the env var is missing, nothing breaks.
 */
export async function notifyN8N(envKey: string, data: Record<string, unknown>): Promise<void> {
  const url = process.env[envKey]
  if (!url) return
  try {
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
      signal:  AbortSignal.timeout(5000),
    })
    if (!res.ok) console.error(`[n8n:${envKey}] HTTP ${res.status}`)
  } catch (err) {
    console.error(`[n8n:${envKey}]`, err instanceof Error ? err.message : err)
  }
}
