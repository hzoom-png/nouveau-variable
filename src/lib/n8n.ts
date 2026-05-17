/**
 * Fire-and-forget webhook calls to N8N.
 * If N8N is down or the env var is missing, nothing breaks.
 */
export function notifyN8N(envKey: string, data: Record<string, unknown>): void {
  const url = process.env[envKey]
  if (!url) return
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(err => console.error(`[n8n:${envKey}]`, err.message))
}
