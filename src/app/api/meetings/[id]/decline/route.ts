import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { escHtml } from '@/lib/html-escape'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const service = createServiceClient()

  const { data: meeting } = await service
    .from('meeting_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (!meeting) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  if (meeting.recipient_id !== user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  if (meeting.status !== 'pending') return NextResponse.json({ error: 'Cette demande ne peut plus être refusée' }, { status: 400 })

  const refundAmount = meeting.points_cost

  const { data: requesterProfile } = await service
    .from('profiles')
    .select('points_balance, email, first_name')
    .eq('id', meeting.requester_id)
    .single()

  if (!requesterProfile) return NextResponse.json({ error: 'Profil demandeur introuvable' }, { status: 400 })

  const newBalance = requesterProfile.points_balance + refundAmount

  await service.from('meeting_requests').update({ status: 'declined' }).eq('id', id)

  await service.from('points_transactions').insert({
    profile_id:         meeting.requester_id,
    amount:             refundAmount,
    balance_after:      newBalance,
    transaction_type:   'meeting_request_debit',
    related_meeting_id: id,
    note:               'refund_declined',
  })

  await service.from('profiles')
    .update({ points_balance: newBalance })
    .eq('id', meeting.requester_id)

  try {
    if (requesterProfile.email && process.env.BREVO_API_KEY) {
      const safeAmount = escHtml(String(refundAmount))
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender:      { name: 'Nouveau Variable', email: 'noreply@nouveauvariable.fr' },
          to:          [{ email: requesterProfile.email }],
          subject:     '[NV] Ta demande de rencontre a été déclinée',
          htmlContent: `<h2>Demande déclinée</h2><p>Ta demande de rencontre a été déclinée. Tes ${safeAmount} points ont été remboursés.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/members">Découvrir d'autres membres →</a></p>`,
        }),
      })
    }
  } catch (e) {
    console.error('[meetings/decline] Erreur email:', e instanceof Error ? e.message : e)
  }

  return NextResponse.json({ success: true })
}
