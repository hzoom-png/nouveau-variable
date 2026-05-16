import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, TEMPLATE_IDS } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const svc    = createServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.nouveauvariable.fr'

  const { count } = await svc
    .from('candidatures')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (!count || count < 100) {
    return NextResponse.json({ skipped: true, count: count ?? 0 })
  }

  const { data: candidates } = await svc
    .from('candidatures')
    .select('id, email, full_name')
    .eq('status', 'pending')

  if (!candidates?.length) {
    return NextResponse.json({ skipped: true, count: 0 })
  }

  let sent = 0
  let errors = 0

  const results = await Promise.allSettled(
    candidates.map(async (cand) => {
      const nameParts = (cand.full_name as string).trim().split(' ')
      const prenom    = nameParts[0] ?? ''
      const email     = cand.email as string

      const lien_paiement = `${appUrl}/subscribe?email=${encodeURIComponent(email)}&prenom=${encodeURIComponent(prenom)}`

      const ok = await sendEmail({
        to:         { email, name: (cand.full_name as string) },
        templateId: TEMPLATE_IDS.BIENVENUE_PAIEMENT,
        params:     { prenom, lien_paiement },
        tags:       ['waitlist', 'paiement'],
      })

      if (!ok) throw new Error(`Email failed for ${email}`)

      await svc
        .from('candidatures')
        .update({ status: 'pending_payment' })
        .eq('id', cand.id)
    })
  )

  for (const r of results) {
    if (r.status === 'fulfilled') sent++
    else errors++
  }

  console.log(`[cron/check-100-candidates] count=${count} sent=${sent} errors=${errors}`)

  return NextResponse.json({ triggered: true, count, sent, errors })
}
