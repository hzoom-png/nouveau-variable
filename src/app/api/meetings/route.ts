import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { MEETING_TYPES } from '@/lib/constants'
import type { MeetingType } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { recipient_id, meeting_type, proposed_slots, message } = body

  if (!recipient_id || !meeting_type || !proposed_slots?.length) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }
  if (recipient_id === user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas vous inviter vous-même' }, { status: 400 })
  }

  const mt = MEETING_TYPES[meeting_type as MeetingType]
  if (!mt) return NextResponse.json({ error: 'Type de rencontre invalide' }, { status: 400 })
  const pointsCost = mt.points

  // Use service client for points operations
  const service = createServiceClient()

  const { data: requesterProfile } = await service
    .from('profiles')
    .select('points_balance')
    .eq('id', user.id)
    .single()

  if (!requesterProfile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 400 })
  if (requesterProfile.points_balance < pointsCost) {
    return NextResponse.json({ error: 'Solde de points insuffisant' }, { status: 400 })
  }

  // Insert meeting request
  const { data: meeting, error: meetingError } = await service
    .from('meeting_requests')
    .insert({
      requester_id: user.id,
      recipient_id,
      meeting_type,
      proposed_slots,
      message: message ?? null,
      points_cost: pointsCost,
      status: 'pending',
    })
    .select()
    .single()

  if (meetingError) return NextResponse.json({ error: meetingError.message }, { status: 500 })

  const newBalance = requesterProfile.points_balance - pointsCost

  // Insert transaction
  await service.from('points_transactions').insert({
    profile_id: user.id,
    amount: -pointsCost,
    balance_after: newBalance,
    transaction_type: 'meeting_request_debit',
    related_meeting_id: meeting.id,
  })

  // Update balance
  await service.from('profiles')
    .update({ points_balance: newBalance })
    .eq('id', user.id)

  // Email notification via Brevo
  try {
    const { data: recipient } = await service.from('profiles').select('email, first_name').eq('id', recipient_id).single()
    const { data: requester } = await service.from('profiles').select('first_name, last_name').eq('id', user.id).single()

    if (recipient?.email && process.env.BREVO_API_KEY) {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Nouveau Variable', email: 'noreply@nouveauvariable.fr' },
          to: [{ email: recipient.email }],
          subject: `[NV] Nouvelle demande de rencontre de ${requester?.first_name}`,
          htmlContent: `
            <h2>Nouvelle demande de rencontre</h2>
            <p>${requester?.first_name} ${requester?.last_name} t'invite pour un(e) <strong>${mt.label}</strong>.</p>
            ${message ? `<p><em>"${message}"</em></p>` : ''}
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/meetings">Voir la demande →</a></p>
          `,
        }),
      })
    }
  } catch (e) {
    console.error('Email error:', e)
  }

  return NextResponse.json({ success: true, meeting })
}
