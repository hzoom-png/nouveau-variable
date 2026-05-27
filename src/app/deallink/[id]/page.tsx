import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'

export default async function PublicDealLinkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: deallink, error } = await supabase
    .from('deallinks_v2')
    .select('id, html_rendered, css_rendered, prospect_name, company_name')
    .eq('public_slug', id)
    .eq('status', 'published')
    .single()

  if (error || !deallink) {
    notFound()
  }

  // Log analytics asynchronously (fire & forget)
  const svc = createServiceClient();
  (async () => {
    try {
      await svc
        .from('deallink_analytics')
        .insert({
          deallink_id: deallink.id,
          event_type: 'view',
          device_type: 'unknown',
          timestamp: new Date().toISOString(),
        })
      console.log('[Analytics] View logged')
    } catch (err) {
      console.error('[Analytics error]', err)
    }
  })()

  return (
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{deallink.prospect_name} — Nouveau Variable</title>
        <meta property="og:title" content={deallink.prospect_name} />
        <meta
          property="og:description"
          content={`Deal with ${deallink.company_name}`}
        />
      </head>
      <body>
        <style dangerouslySetInnerHTML={{ __html: deallink.css_rendered }} />
        <div
          dangerouslySetInnerHTML={{ __html: deallink.html_rendered }}
        />
      </body>
    </html>
  )
}
