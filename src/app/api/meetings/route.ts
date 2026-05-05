import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { MEETING_TYPES } from '@/lib/constants'
import type { MeetingType } from '@/lib/types'
import { z } from 'zod'
import { escHtml } from '@/lib/html-escape'

const Schema = z.object({
  recipient_id:       z.string().uuid(),
  meeting_type:       z.string().min(1).max(50),
  proposed_slots:     z.array(z.unknown()).max(20).optional(),
  preferred_days:     z.array(z.string().max(20)).max(7).optional().nullable(),
  preferred_moments:  z.array(z.string().max(20)).max(5).optional().nullable(),
  message:            z.string().max(1000).trim().optional().nullable(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let rawBody: unknown
  try { rawBody = await request.json() } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = Schema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  const { recipient_id, meeting_type, proposed_slots, preferred_days, preferred_moments, message } = parsed.data

  if (recipient_id === user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas vous inviter vous-même' }, { status: 400 })
  }

  const mt = MEETING_TYPES[meeting_type as MeetingType]
  if (!mt) return NextResponse.json({ error: 'Type de rencontre invalide' }, { status: 400 })
  const pointsCost = mt.points

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

  const { data: meeting, error: meetingError } = await service
    .from('meeting_requests')
    .insert({
      requester_id:      user.id,
      recipient_id,
      meeting_type,
      proposed_slots:    proposed_slots ?? [],
      preferred_days:    preferred_days    ?? null,
      preferred_moments: preferred_moments ?? null,
      message:           message ?? null,
      points_cost:       pointsCost,
      status:            'pending',
    })
    .select()
    .single()

  if (meetingError) {
    console.error('[meetings] Erreur insert:', meetingError.message)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  const newBalance = requesterProfile.points_balance - pointsCost

  await service.from('points_transactions').insert({
    profile_id:         user.id,
    amount:             -pointsCost,
    balance_after:      newBalance,
    transaction_type:   'meeting_request_debit',
    related_meeting_id: meeting.id,
  })

  await service.from('profiles')
    .update({ points_balance: newBalance })
    .eq('id', user.id)

  try {
    const { data: recipient } = await service.from('profiles').select('email, first_name').eq('id', recipient_id).single()
    const { data: requester } = await service.from('profiles').select('first_name, last_name').eq('id', user.id).single()

    if (recipient?.email && process.env.BREVO_API_KEY) {
      const safeFirst = escHtml(requester?.first_name ?? '')
      const safeLast  = escHtml(requester?.last_name  ?? '')
      const safeLabel = escHtml(mt.label)
      const safeMsg   = message ? `<p><em>&ldquo;${escHtml(message)}&rdquo;</em></p>` : ''

      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender:      { name: 'Nouveau Variable', email: 'noreply@nouveauvariable.fr' },
          to:          [{ email: recipient.email }],
          subject:     `[NV] Nouvelle demande de rencontre de ${safeFirst}`,
          htmlContent: `<h2>Nouvelle demande de rencontre</h2><p>${safeFirst} ${safeLast} t'invite pour un(e) <strong>${safeLabel}</strong>.</p>${safeMsg}<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/meetings">Voir la demande →</a></p>`,
        }),
      })
    }
  } catch (e) {
    console.error('[meetings] Erreur email:', e instanceof Error ? e.message : e)
  }

  return NextResponse.json({ success: true, meeting })
}
