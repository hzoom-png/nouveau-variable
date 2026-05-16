// v2 — uses Brevo template API
import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, TEMPLATE_IDS } from '@/lib/email'
import { sendSMS } from '@/lib/sms'
import { z } from 'zod'

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

  const nameParts = (cand.full_name as string).trim().split(' ')
  const prenom = nameParts[0] ?? ''
  const nom = nameParts.slice(1).join(' ')
  const email = cand.email as string
  const telephone = (cand.phone as string | null) ?? ''
  const isFounder = !!(cand.is_founder as boolean | null)

  const expiration = new Date(Date.now() + 48 * 60 * 60 * 1000)
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  if (!isFounder) await sendEmail({
    to: { email, name: `${prenom} ${nom}`.trim() },
    templateId: TEMPLATE_IDS.CANDIDATURE_ACCEPTEE,
    params: {
      prenom,
      lien_paiement: `https://app.nouveauvariable.fr/subscribe?email=${encodeURIComponent(email)}&prenom=${encodeURIComponent(prenom)}`,
      lien_connexion: `https://app.nouveauvariable.fr/auth?from=acceptance`,
      expiration,
    },
    tags: ['candidature', 'acceptation'],
  })

  if (telephone && !isFounder) {
    await sendSMS(
      telephone,
      `Nouveau Variable — Ta candidature a été acceptée, ${prenom} ! Consulte ta boîte email pour finaliser ton accès.`
    )
  }

  await logAdminAction(adminId, 'accept_candidature', 'candidature', parsed.data.candidatureId, { full_name: cand.full_name, email })

  return NextResponse.json({ success: true })
}
