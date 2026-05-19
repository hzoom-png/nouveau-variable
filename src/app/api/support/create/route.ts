import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/rate-limit'
import { sendRawEmail } from '@/lib/email'
import { notifySlack } from '@/lib/slack'
import { z } from 'zod'

const Schema = z.object({
  user_email:  z.string().email().max(254),
  user_name:   z.string().min(1).max(150).trim(),
  ticket_type: z.enum(['bug', 'feature', 'billing', 'general', 'other']),
  subject:     z.string().min(1).max(255).trim(),
  message:     z.string().min(1).max(2000).trim(),
})

const TYPE_LABELS: Record<string, string> = {
  bug: 'Bug', feature: 'Suggestion', billing: 'Facturation', general: 'Question', other: 'Autre',
}

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { user_email, user_name, ticket_type, subject, message } = parsed.data

  const allowed = await rateLimit(`support:${user_email}`, 5, 3600)
  if (!allowed) return NextResponse.json({ error: 'Trop de tickets envoyés. Réessaie dans 1h.' }, { status: 429 })

  // Récupère user_id si connecté
  let userId: string | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) userId = user.id
  } catch { /* non bloquant */ }

  const svc = createServiceClient()
  const { data: ticket, error } = await svc.from('support_tickets').insert({
    user_id:     userId,
    user_email,
    user_name,
    ticket_type,
    subject,
    message,
    status:   'open',
    priority: 'medium',
  }).select('id').single()

  if (error || !ticket) {
    console.error('[support/create]', error?.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  const shortId = ticket.id.slice(0, 8).toUpperCase()

  // Auto-reply candidat (fire & forget)
  sendRawEmail({
    to: { email: user_email, name: user_name },
    subject: `Ton message a bien été reçu — #${shortId}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#2F5446">Bonjour ${user_name.split(' ')[0]} 👋</h2>
        <p>Nous avons bien reçu ton message (<strong>#${shortId}</strong>) et reviendrons vers toi rapidement.</p>
        <p style="background:#f5f5f5;border-left:3px solid #2F5446;padding:10px 14px;border-radius:4px;color:#444">
          <strong>Sujet :</strong> ${subject}<br/>
          <strong>Type :</strong> ${TYPE_LABELS[ticket_type]}
        </p>
        <p style="color:#888;font-size:13px">L'équipe Nouveau Variable</p>
      </div>
    `,
    tags: ['support', 'auto-reply'],
  }).catch(() => null)

  // Slack — fire & forget
  notifySlack({
    title: '🎫 Nouveau ticket support',
    description: subject,
    fields: [
      { title: 'Nom',   value: user_name },
      { title: 'Email', value: user_email },
      { title: 'Type',  value: TYPE_LABELS[ticket_type] },
      { title: 'ID',    value: `#${shortId}` },
    ],
    color: '#ff9900',
    channel: 'support',
  }).catch(() => null)

  return NextResponse.json({ success: true, ticketId: ticket.id })
}
