import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, TEMPLATE_IDS } from '@/lib/email'
import { z } from 'zod'

const Schema = z.object({ candidatureId: z.string().uuid() })

export async function POST(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const svc = createServiceClient()
  const { data: cand } = await svc.from('candidatures').select('id, email, full_name').eq('id', parsed.data.candidatureId).single()
  if (!cand) return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 })

  const nameParts = (cand.full_name as string).trim().split(' ')
  const prenom = nameParts[0] ?? ''
  const nom = nameParts.slice(1).join(' ')
  const email = cand.email as string

  const expiration = new Date(Date.now() + 48 * 60 * 60 * 1000)
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  await sendEmail({
    to: { email, name: `${prenom} ${nom}`.trim() },
    templateId: TEMPLATE_IDS.CANDIDATURE_ACCEPTEE,
    params: {
      prenom,
      lien_paiement: `https://app.nouveauvariable.fr/subscribe?email=${encodeURIComponent(email)}&prenom=${encodeURIComponent(prenom)}`,
      lien_connexion: `https://app.nouveauvariable.fr/auth?from=acceptance`,
      expiration,
    },
    tags: ['candidature', 'acceptation', 'resend'],
  })

  await logAdminAction(adminId, 'resend_acceptance_email', 'candidature', parsed.data.candidatureId, { full_name: cand.full_name, email })

  return NextResponse.json({ success: true })
}
