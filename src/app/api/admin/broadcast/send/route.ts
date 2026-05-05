import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'
import { escHtml } from '@/lib/html-escape'

const Schema = z.object({
  type:       z.enum(['sms', 'email']),
  subject:    z.string().max(200).optional(),
  message:    z.string().min(1).max(1600),
  recipients: z.enum(['all']).or(z.array(z.string().uuid())),
})

export async function POST(request: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide', details: parsed.error.issues }, { status: 400 })

  const { type, subject, message, recipients } = parsed.data
  const svc = createServiceClient()

  let query = svc.from('profiles').select('id, first_name, last_name, email, phone').eq('is_active', true)
  if (Array.isArray(recipients)) query = query.in('id', recipients)

  const { data: members } = await query
  if (!members?.length) return NextResponse.json({ error: 'Aucun destinataire trouvé' }, { status: 400 })

  const sid    = process.env.TWILIO_ACCOUNT_SID!
  const auth   = process.env.TWILIO_AUTH_TOKEN!
  const brevo  = process.env.BREVO_API_KEY!
  let sentCount = 0

  if (type === 'sms') {
    for (const m of members) {
      if (!m.phone) continue
      try {
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
          method:  'POST',
          headers: {
            Authorization:  `Basic ${Buffer.from(`${sid}:${auth}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            MessagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID!,
            To:   m.phone,
            Body: message,
          }).toString(),
        })
        if (res.ok) sentCount++
        await new Promise(r => setTimeout(r, 100))
      } catch { /* continue */ }
    }
  }

  if (type === 'email') {
    const toList = members.filter(m => m.email).map(m => ({
      email: m.email,
      name:  `${m.first_name} ${m.last_name}`.trim(),
    }))

    try {
      const safeMessage = escHtml(message).replace(/\n/g, '<br>')
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method:  'POST',
        headers: { 'api-key': brevo, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to:          toList.slice(0, 1),
          bcc:         toList.slice(1),
          sender:      { email: 'club@nouveauvariable.fr', name: 'Nouveau Variable' },
          subject:     subject ? escHtml(subject) : 'Message du club',
          htmlContent: `<p>${safeMessage}</p>`,
        }),
      })
      if (res.ok) sentCount = toList.length
    } catch { /* continue */ }
  }

  await svc.from('broadcasts').insert({
    type, subject: subject ?? null, message,
    recipients_count: sentCount,
    sent_by: adminId,
  })
  await logAdminAction(adminId, 'broadcast', 'broadcast', undefined, { type, recipients_count: sentCount })

  return NextResponse.json({ success: true, sentCount })
}
