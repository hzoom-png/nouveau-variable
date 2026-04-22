import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
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

  const { data: recipientProfile } = await service
    .from('profiles')
    .select('points_balance, email, first_name')
    .eq('id', user.id)
    .single()

  if (!recipientProfile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 400 })

  const newBalance = recipientProfile.points_balance + pointsEarned

  // Update meeting
  await service.from('meeting_requests')
    .update({ status: 'accepted', chosen_slot, points_earned: pointsEarned })
    .eq('id', id)

  // Transaction
  await service.from('points_transactions').insert({
    profile_id: user.id,
    amount: pointsEarned,
    balance_after: newBalance,
    transaction_type: 'meeting_accept_credit',
    related_meeting_id: id,
  })

  // Update balance
  await service.from('profiles')
    .update({ points_balance: newBalance })
    .eq('id', user.id)

  // Email to requester
  try {
    const { data: requester } = await service.from('profiles').select('email, first_name').eq('id', meeting.requester_id).single()
    if (requester?.email && process.env.BREVO_API_KEY) {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Nouveau Variable', email: 'noreply@nouveauvariable.fr' },
          to: [{ email: requester.email }],
          subject: '[NV] Ta demande de rencontre a été acceptée !',
          htmlContent: `<h2>Bonne nouvelle !</h2><p>${recipientProfile.first_name} a accepté ta demande de rencontre.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/meetings">Voir les détails →</a></p>`,
        }),
      })
    }
  } catch (e) {
    console.error('Email error:', e)
  }

  return NextResponse.json({ success: true })
}
