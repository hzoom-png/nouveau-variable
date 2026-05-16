import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { escHtml } from '@/lib/html-escape'
import { sendSMS, SMS_TEMPLATES } from '@/lib/sms'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: Record<string, unknown> = {}
  try { body = await request.json() } catch { /* no body is fine */ }
  const { chosen_slot } = body

  const service = createServiceClient()

  const { data: meeting } = await service
    .from('meeting_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (!meeting) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  if (meeting.recipient_id !== user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  if (meeting.status !== 'pending') return NextResponse.json({ error: 'Cette demande ne peut plus être acceptée' }, { status: 400 })

  const pointsEarned = meeting.points_cost

  const [{ data: recipientProfile }, { data: requesterProfile }] = await Promise.all([
    service.from('profiles').select('points_balance, email, first_name, phone').eq('id', user.id).single(),
    service.from('profiles').select('email, first_name, phone').eq('id', meeting.requester_id).single(),
  ])

  if (!recipientProfile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 400 })

  const newBalance = recipientProfile.points_balance + pointsEarned
  const phonesAvailable = !!(requesterProfile?.phone && recipientProfile.phone)

  await service.from('meeting_requests')
    .update({
      status: 'accepted',
      chosen_slot: chosen_slot ?? null,
      points_earned: pointsEarned,
      responded_at: new Date().toISOString(),
      sender_phone_revealed: phonesAvailable,
      receiver_phone_revealed: phonesAvailable,
    })
    .eq('id', id)

  await service.from('points_transactions').insert({
    profile_id:         user.id,
    amount:             pointsEarned,
    balance_after:      newBalance,
    transaction_type:   'meeting_accept_credit',
    related_meeting_id: id,
  })

  await service.from('profiles')
    .update({ points_balance: newBalance })
    .eq('id', user.id)

  // SMS phone exchange
  try {
    if (requesterProfile?.phone && recipientProfile.phone) {
      await Promise.all([
        sendSMS(requesterProfile.phone, SMS_TEMPLATES.meetingAccepted(recipientProfile.first_name ?? '', recipientProfile.phone)),
        sendSMS(recipientProfile.phone, SMS_TEMPLATES.yourPhoneShared(requesterProfile.first_name ?? '', requesterProfile.phone)),
      ])
    }
  } catch (e) {
    console.error('[meetings/accept] Erreur SMS:', e instanceof Error ? e.message : e)
  }

  // Email to requester
  try {
    if (requesterProfile?.email && process.env.BREVO_API_KEY) {
      const safeName = escHtml(recipientProfile.first_name ?? '')
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender:      { name: 'Nouveau Variable', email: 'noreply@nouveauvariable.fr' },
          to:          [{ email: requesterProfile.email }],
          subject:     '[NV] Ta demande de rencontre a été acceptée !',
          htmlContent: `<h2>Bonne nouvelle !</h2><p>${safeName} a accepté ta demande de rencontre.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/meetings">Voir les détails →</a></p>`,
        }),
      })
    }
  } catch (e) {
    console.error('[meetings/accept] Erreur email:', e instanceof Error ? e.message : e)
  }

  return NextResponse.json({ success: true })
}
