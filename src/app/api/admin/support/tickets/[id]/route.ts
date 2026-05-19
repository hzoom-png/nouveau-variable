import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { sendRawEmail } from '@/lib/email'
import { notifySlack } from '@/lib/slack'
import { z } from 'zod'

const Schema = z.object({
  status:         z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority:       z.enum(['low', 'medium', 'high']).optional(),
  admin_response: z.string().max(2000).trim().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

  const parsed = Schema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })

  const svc = createServiceClient()
  const { data: existing } = await svc.from('support_tickets').select('*').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 })

  const patch: Record<string, unknown> = {}
  if (parsed.data.status)         patch.status = parsed.data.status
  if (parsed.data.priority)       patch.priority = parsed.data.priority
  if (parsed.data.admin_response) {
    patch.admin_response = parsed.data.admin_response
    patch.admin_id       = adminId
    if (!parsed.data.status)      patch.status = 'in_progress'
  }
  if (parsed.data.status === 'resolved' || parsed.data.status === 'closed') {
    patch.resolved_at = new Date().toISOString()
  }

  const { error } = await svc.from('support_tickets').update(patch).eq('id', id)
  if (error) {
    console.error('[admin/support/tickets/[id]] PATCH error:', error.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  const shortId = id.slice(0, 8).toUpperCase()

  // Email réponse admin
  if (parsed.data.admin_response) {
    const prenom = (existing.user_name as string).split(' ')[0]
    sendRawEmail({
      to: { email: existing.user_email as string, name: existing.user_name as string },
      subject: `Réponse à ton message #${shortId}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
          <h2 style="color:#2F5446">Bonjour ${prenom} 👋</h2>
          <p>Voici la réponse à ta demande <strong>#${shortId}</strong> :</p>
          <div style="background:#f5f5f5;border-left:3px solid #2F5446;padding:12px 14px;border-radius:4px;color:#333;white-space:pre-wrap">
${parsed.data.admin_response}
          </div>
          <p style="color:#888;font-size:13px;margin-top:20px">
            N'hésite pas à nous recontacter si tu as d'autres questions.<br/>L'équipe Nouveau Variable
          </p>
        </div>
      `,
      tags: ['support', 'response'],
    }).catch(() => null)

    notifySlack({
      title: '✅ Réponse support envoyée',
      fields: [
        { title: 'ID',      value: `#${shortId}` },
        { title: 'Pour',    value: existing.user_name as string },
        { title: 'Email',   value: existing.user_email as string },
      ],
      color: '#36a64f',
      channel: 'support',
    }).catch(() => null)
  }

  if (parsed.data.status === 'resolved') {
    notifySlack({
      title: '🎉 Ticket résolu',
      fields: [
        { title: 'ID',   value: `#${shortId}` },
        { title: 'Pour', value: existing.user_name as string },
      ],
      color: '#36a64f',
      channel: 'support',
    }).catch(() => null)
  }

  await logAdminAction(adminId, 'update_support_ticket', 'support_ticket', id, {
    status: parsed.data.status,
    responded: !!parsed.data.admin_response,
  })

  return NextResponse.json({ success: true })
}
