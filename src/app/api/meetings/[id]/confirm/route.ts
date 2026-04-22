import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { location_name, location_city } = body

  if (!location_name) return NextResponse.json({ error: 'Nom du lieu requis' }, { status: 400 })

  const service = createServiceClient()

  const { data: meeting } = await service
    .from('meeting_requests')
    .select('*, requester:profiles!meeting_requests_requester_id_fkey(email, first_name), recipient:profiles!meeting_requests_recipient_id_fkey(email, first_name)')
    .eq('id', id)
    .single()

  if (!meeting) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  if (meeting.recipient_id !== user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  if (meeting.status !== 'accepted') return NextResponse.json({ error: 'La demande doit être acceptée avant confirmation' }, { status: 400 })

  await service.from('meeting_requests')
    .update({ status: 'confirmed', location_name, location_city: location_city ?? null })
    .eq('id', id)

  // Emails to both parties
  try {
    if (process.env.BREVO_API_KEY) {
      const slot = meeting.chosen_slot
      const dateStr = slot ? `le ${slot.date} à ${slot.time}` : ''
      const locationStr = location_city ? `${location_name}, ${location_city}` : location_name

      for (const party of [meeting.requester, meeting.recipient]) {
        if (party?.email) {
          await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender: { name: 'Nouveau Variable', email: 'noreply@nouveauvariable.fr' },
              to: [{ email: party.email }],
              subject: '[NV] Rencontre confirmée !',
              htmlContent: `<h2>Rencontre confirmée !</h2><p>Votre rencontre est confirmée ${dateStr} à <strong>${locationStr}</strong>.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/meetings">Voir les détails →</a></p>`,
            }),
          })
        }
      }
    }
  } catch (e) {
    console.error('Email error:', e)
  }

  return NextResponse.json({ success: true })
}
