/**
 * Validate that a URL is safe to fetch server-side.
 * Blocks private IPs, metadata endpoints, and non-HTTP(S) protocols.
 */
export function isSafeUrl(raw: string): boolean {
  if (!raw || typeof raw !== 'string') return false

  try {
    const u = new URL(raw)

    if (!['http:', 'https:'].includes(u.protocol)) return false

    const h = u.hostname.toLowerCase()

    // Block private IP ranges and loopback
    const privatePatterns = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^169\.254\./,    // link-local (AWS instance metadata)
      /^0\.0\.0\.0$/,
      /^::1$/,
      /^fc00:/,
      /^fe80:/,
    ]

    if (privatePatterns.some(p => p.test(h))) return false

    return true
  } catch {
    return false
  }
}
