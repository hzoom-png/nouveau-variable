import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendRawEmail } from '@/lib/email'
import { escHtml } from '@/lib/html-escape'

const Schema = z.object({
  message: z.string().min(10).max(300),
  domain: z.string().min(1).max(100),
  availability: z.enum(['immediate', '2-4weeks', 'flexible']),
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: projectId } = await context.params

  // Verify user is active
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('id', user.id)
    .single()

  if (!profile?.is_active) {
    return NextResponse.json(
      { error: 'Compte inactif ou supprimé' },
      { status: 403 }
    )
  }

  let rawBody: unknown
  try { rawBody = await request.json() } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = Schema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  const { message, domain, availability } = parsed.data

  const service = createServiceClient()

  // Check if project exists and get owner
  const { data: project } = await service
    .from('projects')
    .select('id, user_id, title')
    .eq('id', projectId)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 })
  }

  // Prevent user from collaborating on their own project
  if (project.user_id === user.id) {
    return NextResponse.json(
      { error: 'Vous ne pouvez pas collaborer sur votre propre projet' },
      { status: 400 }
    )
  }

  // Check if already collaborating
  const { data: existing } = await service
    .from('project_interactions')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .eq('type', 'collaboration')
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'Vous avez déjà proposé une collaboration', code: 'ALREADY_COLLABORATING' },
      { status: 409 }
    )
  }

  // Insert collaboration request
  const { data: collab, error } = await service
    .from('project_interactions')
    .insert({
      project_id: projectId,
      user_id: user.id,
      type: 'collaboration',
      collab_domain: domain,
      collab_message: message,
      collab_availability: availability,
      collab_status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('[POST /api/projects/[id]/collaborate] insert error:', error.code)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  // Fire & forget — notify project owner by email
  void (async () => {
    try {
      const [{ data: owner }, { data: sender }] = await Promise.all([
        service.from('profiles').select('email, first_name').eq('id', project.user_id).single(),
        service.from('profiles').select('first_name, last_name, slug').eq('id', user.id).single(),
      ])
      if (!owner?.email) return
      const senderName = [sender?.first_name, sender?.last_name].filter(Boolean).join(' ') || 'Un membre'
      const senderSlug = sender?.slug
      const projectTitle = String((project as Record<string, unknown>).title ?? 'ton projet')
      const profileUrl = senderSlug
        ? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nouveauvariable.com'}/p/${senderSlug}`
        : `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nouveauvariable.com'}/dashboard/projects`
      const projectUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nouveauvariable.com'}/dashboard/projects`
      await sendRawEmail({
        to: { email: owner.email, name: owner.first_name },
        subject: `${senderName} souhaite collaborer sur "${projectTitle}"`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
            <div style="background:#024f41;padding:28px 32px;border-radius:12px 12px 0 0">
              <p style="color:#fff;font-size:13px;opacity:.7;margin:0 0 4px">Nouveau Variable</p>
              <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0">Nouvelle demande de collaboration</h1>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
              <p style="font-size:15px;line-height:1.6;margin:0 0 20px">
                Bonjour ${escHtml(owner.first_name ?? '')} 👋<br><br>
                <strong>${escHtml(senderName)}</strong> souhaite collaborer sur ton projet
                <strong>"${escHtml(projectTitle)}"</strong>.
              </p>
              ${domain ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin-bottom:20px">
                <p style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px">Domaine d'expertise</p>
                <p style="font-size:14px;color:#1a1a1a;margin:0">${escHtml(domain)}</p>
              </div>` : ''}
              ${message ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin-bottom:20px">
                <p style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px">Message</p>
                <p style="font-size:14px;color:#1a1a1a;margin:0;white-space:pre-line">${escHtml(message)}</p>
              </div>` : ''}
              <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px">
                <a href="${profileUrl}" style="background:#024f41;color:#fff;padding:10px 22px;border-radius:99px;font-weight:600;font-size:14px;text-decoration:none">
                  Voir le profil →
                </a>
                <a href="${projectUrl}" style="background:#f9fafb;color:#024f41;border:1px solid #024f41;padding:10px 22px;border-radius:99px;font-weight:600;font-size:14px;text-decoration:none">
                  Gérer mes projets
                </a>
              </div>
            </div>
          </div>`,
        tags: ['collaboration', 'project'],
      })
    } catch (err) {
      console.error('[collaborate] email error:', err instanceof Error ? err.message : err)
    }
  })()

  return NextResponse.json({ success: true, collaboration: collab })
}
