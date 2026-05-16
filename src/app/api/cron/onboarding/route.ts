import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, TEMPLATE_IDS } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const svc = createServiceClient()
  const now = new Date()

  const { data: members } = await svc
    .from('profiles')
    .select('id, email, first_name, subscription_start, onboarding_completed, tokens_total_used')
    .eq('is_active', true)
    .not('subscription_start', 'is', null)

  let sent = 0
  const dashboard = 'https://app.nouveauvariable.fr/dashboard'

  for (const member of members ?? []) {
    const start = new Date(member.subscription_start)
    const daysActive = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const base = { to: { email: member.email, name: member.first_name } }

    // J+1 — profil incomplet
    if (daysActive === 1 && !member.onboarding_completed) {
      await sendEmail({
        ...base,
        templateId: TEMPLATE_IDS.ONBOARDING_J1,
        params: { prenom: member.first_name, lien_profil: `${dashboard}/profile` },
        tags: ['onboarding', 'j1'],
      })
      sent++
    }

    // J+3 — pas encore de RDV envoyé
    if (daysActive === 3) {
      const { count } = await svc
        .from('meeting_requests')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', member.id)

      if (!count || count === 0) {
        const { data: suggestions } = await svc
          .from('profiles')
          .select('first_name, role_title, cities, slug')
          .eq('is_active', true)
          .eq('profile_visible', true)
          .neq('id', member.id)
          .limit(3)

        const [m1, m2, m3] = suggestions ?? []
        if (m1 && m2 && m3) {
          await sendEmail({
            ...base,
            templateId: TEMPLATE_IDS.ONBOARDING_J3,
            params: {
              prenom:          member.first_name,
              membre1_prenom:  m1.first_name,  membre1_role: m1.role_title ?? '', membre1_ville: m1.cities?.[0] ?? '', membre1_slug: m1.slug ?? '',
              membre2_prenom:  m2.first_name,  membre2_role: m2.role_title ?? '', membre2_ville: m2.cities?.[0] ?? '', membre2_slug: m2.slug ?? '',
              membre3_prenom:  m3.first_name,  membre3_role: m3.role_title ?? '', membre3_ville: m3.cities?.[0] ?? '', membre3_slug: m3.slug ?? '',
              lien_annuaire:   `${dashboard}/members`,
            },
            tags: ['onboarding', 'j3'],
          })
          sent++
        }
      }
    }

    // J+7 — aucun outil utilisé
    if (daysActive === 7 && (!member.tokens_total_used || member.tokens_total_used === 0)) {
      await sendEmail({
        ...base,
        templateId: TEMPLATE_IDS.ONBOARDING_J7,
        params: {
          prenom:        member.first_name,
          lien_replique: `${dashboard}/tools/replique`,
        },
        tags: ['onboarding', 'j7'],
      })
      sent++
    }

    // J+14 — email fondateur (aucun RDV + aucun outil)
    if (daysActive === 14) {
      const { count: rdvCount } = await svc
        .from('meeting_requests')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', member.id)

      const hasUsedTools = member.tokens_total_used && member.tokens_total_used > 0

      if (!rdvCount && !hasUsedTools) {
        await sendEmail({
          ...base,
          templateId: TEMPLATE_IDS.ONBOARDING_J14,
          params: { prenom: member.first_name },
          tags: ['onboarding', 'j14'],
        })
        sent++
      }
    }
  }

  return NextResponse.json({ sent, processed: members?.length ?? 0 })
}
