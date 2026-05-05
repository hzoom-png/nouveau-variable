import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { DealLinkEditor } from './DealLinkEditor'

export default async function EditDealLinkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth?redirect=/dl/${slug}/edit`)

  const { data: dl, error } = await supabase
    .from('deallinks')
    .select(`id, slug, owner_id, prospect_name, prospect_company, prospect_role,
             seller_name, seller_email, seller_phone,
             brand_assets, full_result`)
    .eq('slug', slug)
    .single()

  if (error || !dl) notFound()
  if (dl.owner_id !== user.id) redirect('/dashboard/tools/deallink')

  const fullResult = (dl.full_result ?? {}) as Record<string, unknown>

  return (
    <DealLinkEditor
      slug={dl.slug}
      initialData={{
        prospectName:    dl.prospect_name    ?? '',
        prospectCompany: dl.prospect_company ?? undefined,
        prospectRole:    dl.prospect_role    ?? undefined,
        sellerName:      dl.seller_name      ?? '',
        sellerEmail:     dl.seller_email     ?? undefined,
        sellerPhone:     dl.seller_phone     ?? undefined,
        sections:        (Array.isArray(fullResult.sections) ? fullResult.sections : []) as {
          id: string; type: string; title: string; body: string
        }[],
        tagline:         (fullResult.tagline as string) ?? '',
        brand:           (dl.brand_assets as Record<string, string | undefined>) ?? {},
      }}
    />
  )
}
