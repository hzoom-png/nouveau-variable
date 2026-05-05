import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

const rateLimitMap = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (entry && now < entry.reset) {
    if (entry.count >= RATE_LIMIT) {
      return NextResponse.json({ error: 'Trop de demandes. Réessaie dans une heure.' }, { status: 429 })
    }
    entry.count++
  } else {
    rateLimitMap.set(ip, { count: 1, reset: now + WINDOW_MS })
  }

  const body = await request.json() as {
    recipient_slug?: string
    visitorName?: string
    visitorEmail?: string
    meetingType?: string
    proposedAvailability?: string
    message?: string
  }

  const { recipient_slug, visitorName, visitorEmail, meetingType, proposedAvailability, message } = body

  if (!recipient_slug || !visitorName?.trim() || !visitorEmail?.trim()) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  if (!proposedAvailability?.trim()) {
    return NextResponse.json({ error: 'Indique tes disponibilités proposées' }, { status: 400 })
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(visitorEmail)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: recipient } = await supabase
    .from('profiles')
    .select('id')
    .eq('slug', recipient_slug)
    .single()

  if (!recipient) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  const { error } = await supabase.from('public_meeting_requests').insert({
    recipient_id: recipient.id,
    requester_name: visitorName.trim().slice(0, 100),
    requester_email: visitorEmail.trim().slice(0, 200),
    message: message?.trim().slice(0, 1000) ?? null,
    proposed_availability: proposedAvailability.trim().slice(0, 500),
    meeting_type: meetingType ?? 'coffee',
  })

  if (error) {
    console.error('[public/meeting-request] Erreur insert:', error.message)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
