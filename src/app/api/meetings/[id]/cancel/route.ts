import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { sendSMS, SMS_TEMPLATES } from '@/lib/sms'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const service = createServiceClient()

  const { data: meeting } = await service
    .from('meeting_requests')
    .select('*, requester:profiles!meeting_requests_requester_id_fkey(first_name, last_name, phone), recipient:profiles!meeting_requests_recipient_id_fkey(first_name, last_name, phone)')
    .eq('id', id)
    .single()

  if (!meeting) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  if (meeting.requester_id !== user.id && meeting.recipient_id !== user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  if (!['pending', 'accepted'].includes(meeting.status)) {
    return NextResponse.json({ error: 'Cette demande ne peut plus être annulée' }, { status: 400 })
  }

  await service.from('meeting_requests')
    .update({ status: 'cancelled' })
    .eq('id', id)

  const isRequester = meeting.requester_id === user.id
  const canceller = isRequester ? meeting.requester : meeting.recipient
  const other = isRequester ? meeting.recipient : meeting.requester

  try {
    if (other?.phone) {
      const cancellerName = `${canceller?.first_name ?? ''} ${canceller?.last_name ?? ''}`.trim()
      await sendSMS(other.phone, SMS_TEMPLATES.meetingCancelled(cancellerName))
    }
  } catch (e) {
    console.error('[meetings/cancel] Erreur SMS:', e instanceof Error ? e.message : e)
  }

  return NextResponse.json({ success: true })
}
