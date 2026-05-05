import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'
import { createRequire } from 'module'

const _require = createRequire(import.meta.url)
const { sendAcceptationSafe } = _require('../../../../../../sendAcceptation') as {
  sendAcceptationSafe: (c: Record<string, string>) => Promise<{ success: boolean; error?: string }>
}

const Schema = z.object({ candidatureId: z.string().uuid() })

export async function POST(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const svc = createServiceClient()
  const { data: cand } = await svc.from('candidatures').select('*').eq('id', parsed.data.candidatureId).single()
  if (!cand) return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 })

  const { error } = await svc.from('candidatures')
    .update({ status: 'accepted' }).eq('id', parsed.data.candidatureId)
  if (error) {
    console.error('[admin/candidatures/accept] Erreur:', error.message)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  // SMS Twilio (via API REST directe)
  if (cand.phone) {
    const firstName = (cand.full_name as string).split(' ')[0]
    const msg = `Bonjour ${firstName}, ta candidature Nouveau Variable a été acceptée. Ton lien de paiement t'arrive par email sous 24h. À très vite.`
    const sid  = process.env.TWILIO_ACCOUNT_SID!
    const auth = process.env.TWILIO_AUTH_TOKEN!

    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method:  'POST',
      headers: {
        Authorization:  `Basic ${Buffer.from(`${sid}:${auth}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        MessagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID!,
        To:   cand.phone,
        Body: msg,
      }).toString(),
    }).catch(() => null) // non-bloquant
  }

  // Email d'acceptation au candidat via Brevo (template transactionnel)
  const nameParts = (cand.full_name as string).trim().split(' ')
  const candidat: Record<string, string> = {
    id:              cand.id as string,
    prenom:          nameParts[0] ?? '',
    nom:             nameParts.slice(1).join(' '),
    email:           cand.email as string,
    telephone:       (cand.phone as string | null) ?? '',
    ville:           (cand.city as string | null) ?? '',
    role:            (cand.role as string | null) ?? '',
    secteur:         '',
    experience:      (cand.experience as string | null) ?? '',
    motivation:      (cand.motivation as string | null) ?? '',
    code_parrainage: (cand.referral_code as string | null) ?? '',
  }
  await sendAcceptationSafe(candidat)

  await logAdminAction(adminId, 'accept_candidature', 'candidature', parsed.data.candidatureId, { full_name: cand.full_name, email: cand.email })

  return NextResponse.json({ success: true })
}
