import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, TEMPLATE_IDS } from '@/lib/email'
import { z } from 'zod'

const Schema = z.object({
  candidatureId: z.string().uuid(),
  is_founder:    z.boolean(),
})

export async function POST(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const { candidatureId, is_founder } = parsed.data
  const svc = createServiceClient()

  // Fetch before update to have email/name for the VIP email
  const { data: cand, error: fetchError } = await svc
    .from('candidatures')
    .select('id, email, full_name, status')
    .eq('id', candidatureId)
    .single()

  if (fetchError || !cand) {
    console.error('[toggle-founder] Candidature introuvable', fetchError)
    return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 })
  }

  const { error } = await svc.from('candidatures').update({
    is_founder,
    founder_activated_at: is_founder ? new Date().toISOString() : null,
  }).eq('id', candidatureId)

  if (error) {
    console.error('[toggle-founder]', error.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  // Send VIP email when enabling founder mode on an already-accepted candidature.
  // When acceptance happens first (button disappears after), the accept route never
  // sees is_founder=true, so this is the only place the email can be triggered.
  if (is_founder && cand.status === 'accepted') {
    console.log('[toggle-founder] Envoi email VIP founder', { email: cand.email, status: cand.status })
    const prenom = (cand.full_name as string).trim().split(' ')[0] ?? ''
    sendEmail({
      to: { email: cand.email as string, name: (cand.full_name as string).trim() },
      templateId: TEMPLATE_IDS.FOUNDER_ACCES_VIP,
      params: {
        prenom,
        lien_connexion: `https://app.nouveauvariable.fr/auth?from=founder`,
      },
      tags: ['fondateur', 'acces-vip'],
    }).then(ok => {
      console.log('[toggle-founder] Email VIP founder result', { ok })
    })
  }

  await logAdminAction(
    adminId,
    is_founder ? 'enable_founder_mode' : 'disable_founder_mode',
    'candidature',
    candidatureId,
    { is_founder }
  )

  return NextResponse.json({
    id:         candidatureId,
    is_founder,
    message:    is_founder ? 'Mode founder activé' : 'Mode founder révoqué',
  })
}
