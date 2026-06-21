import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, TEMPLATE_IDS } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

const MAX_AGE_DAYS = 15
const RATE_LIMIT_PER_DAY = 3

export type ResendResult =
  | { ok: true }
  | { ok: false; code: 'NOT_FOUND' | 'NOT_ACCEPTED' | 'FOUNDER' | 'EXPIRED' | 'RATE_LIMITED' | 'INTERNAL' }

export async function resendPaymentLink(
  email: string,
  code_parrain: string,
): Promise<ResendResult> {
  const normalizedEmail = email.toLowerCase().trim()
  const normalizedCode  = code_parrain.toUpperCase().trim()

  const allowed = await rateLimit(`resend-payment:${normalizedEmail}`, RATE_LIMIT_PER_DAY, 86_400)
  if (!allowed) return { ok: false, code: 'RATE_LIMITED' }

  const svc = createServiceClient()
  const { data: cand, error } = await svc
    .from('candidatures')
    .select('email, full_name, status, is_founder, created_at')
    .eq('email', normalizedEmail)
    .eq('code_parrain', normalizedCode)
    .maybeSingle()

  if (error) {
    console.error('[resendPaymentLink] DB error:', error.message)
    return { ok: false, code: 'INTERNAL' }
  }

  if (!cand)                                       return { ok: false, code: 'NOT_FOUND' }
  if ((cand.status as string) !== 'accepted')      return { ok: false, code: 'NOT_ACCEPTED' }
  if (cand.is_founder as boolean)                  return { ok: false, code: 'FOUNDER' }

  const ageMs   = Date.now() - new Date(cand.created_at as string).getTime()
  const ageDays = ageMs / (1_000 * 60 * 60 * 24)
  if (ageDays > MAX_AGE_DAYS)                      return { ok: false, code: 'EXPIRED' }

  const nameParts = (cand.full_name as string).trim().split(' ')
  const prenom    = nameParts[0] ?? ''
  const nom       = nameParts.slice(1).join(' ')

  const expiration = new Date(Date.now() + 48 * 60 * 60 * 1_000)
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.nouveauvariable.fr'
  const lien_paiement  = `${base}/subscribe?email=${encodeURIComponent(normalizedEmail)}&prenom=${encodeURIComponent(prenom)}`
  const lien_connexion = `${base}/auth?from=acceptance`

  // Use dedicated resend template if configured, otherwise reuse the acceptance template
  const templateId = TEMPLATE_IDS.PAYMENT_RESEND || TEMPLATE_IDS.CANDIDATURE_ACCEPTEE

  sendEmail({
    to: { email: normalizedEmail, name: `${prenom} ${nom}`.trim() },
    templateId,
    params: { prenom, lien_paiement, lien_connexion, expiration },
    tags: ['candidature', 'resend-paiement'],
  }).catch(err => console.error('[resendPaymentLink] Email error:', err))

  return { ok: true }
}
