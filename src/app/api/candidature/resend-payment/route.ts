import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { FEATURES } from '@/lib/features'
import { resendPaymentLink } from '@/lib/payment/resend'

const VALID_CHARS = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/

const Schema = z.object({
  email:        z.string().email().max(254),
  code_parrain: z.string().min(1).max(10)
    .transform(s => s.toUpperCase().trim())
    .pipe(z.string().regex(VALID_CHARS, 'Code invalide (8 caractères, majuscules)')),
})

const ERROR_MAP: Record<string, { status: number; message: string }> = {
  NOT_FOUND:    { status: 404, message: "Aucune candidature trouvée avec ces informations." },
  NOT_ACCEPTED: { status: 400, message: "Ta candidature n'est pas encore acceptée." },
  FOUNDER:      { status: 400, message: "Les fondateurs accèdent directement sans paiement." },
  EXPIRED:      { status: 400, message: "Le délai de 15 jours pour finaliser ton inscription est dépassé. Contacte-nous à contact@nouveauvariable.fr" },
  RATE_LIMITED: { status: 429, message: "Tu as atteint la limite de 3 envois par jour. Réessaie demain." },
  INTERNAL:     { status: 500, message: "Erreur interne. Réessaie dans quelques instants." },
}

export async function POST(request: NextRequest) {
  if (!FEATURES.RESEND_PAYMENT) {
    return NextResponse.json({ error: 'Fonctionnalité non disponible' }, { status: 404 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }

  const result = await resendPaymentLink(parsed.data.email, parsed.data.code_parrain)

  if (!result.ok) {
    const { status, message } = ERROR_MAP[result.code] ?? { status: 500, message: 'Erreur inconnue.' }
    return NextResponse.json({ error: message }, { status })
  }

  return NextResponse.json({ success: true })
}
