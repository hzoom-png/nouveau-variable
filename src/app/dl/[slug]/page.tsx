import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { SalesPage, type DealLinkResult, type BrandAssets } from './SalesPage'
import DealLinkViewTracker from './DealLinkViewTracker'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('deallinks')
    .select('prospect_name, prospect_company, seller_name')
    .eq('slug', slug)
    .single()
  if (!data) return { title: 'DealLink' }
  return {
    title: `${data.seller_name} — ${data.prospect_name}${data.prospect_company ? ` · ${data.prospect_company}` : ''}`,
    robots: 'noindex, nofollow',
  }
}

export default async function DealLinkPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: dl, error } = await supabase
    .from('deallinks')
    .select(`
      id, slug,
      prospect_name, prospect_company, prospect_role,
      seller_name, seller_email, seller_phone,
      brand_assets, full_result
    `)
    .eq('slug', slug)
    .single()

  if (error || !dl) notFound()

  const rawResult = dl.full_result as Record<string, unknown> | null
  if (!rawResult) notFound()

  const rawBrand = (dl.brand_assets || {}) as Record<string, unknown>

  const brand: BrandAssets = {
    primaryColor:     rawBrand.primaryColor     as string | undefined,
    secondaryColor:   rawBrand.secondaryColor   as string | undefined,
    backgroundColor:  rawBrand.backgroundColor  as string | undefined,
    textColor:        rawBrand.textColor        as string | undefined,
    fontFamily:       rawBrand.fontFamily       as string | undefined,
    logoUrl:          rawBrand.logoUrl          as string | undefined,
    prospectLogoUrl:  rawBrand.prospectLogoUrl  as string | undefined,
    caseStudyUrl:     rawBrand.caseStudyUrl     as string | undefined,
    calendlyUrl:      rawBrand.calendlyUrl      as string | undefined,
    calendlyCtaLabel: rawBrand.calendlyCtaLabel as string | undefined,
    quoteUrl:         rawBrand.quoteUrl         as string | undefined,
    quoteCtaLabel:    rawBrand.quoteCtaLabel    as string | undefined,
  }

  // Normalise : supporte nouveau format (sections[]) et ancien format (hook/arguments)
  let result: DealLinkResult
  if (Array.isArray(rawResult.sections) && rawResult.sections.length > 0) {
    result = rawResult as unknown as DealLinkResult
  } else {
    // Ancien format — construit des sections à partir des données existantes
    const hook     = (rawResult.hook     as string) || (rawResult.accroche as string) || ''
    const subhook  = (rawResult.subhook  as string) || ''
    const ctaText  = (rawResult.cta_text as string) || (rawResult.cta as string) || ''
    const args     = rawResult.arguments as { title?: string; body?: string; titre?: string; corps?: string }[] | undefined

    result = {
      tagline: hook,
      sections: [
        { id: 'hero',      type: 'hero',      title: hook,    body: subhook || hook },
        ...(args ?? []).slice(0, 3).map((a, i) => ({
          id:    `value_prop_${i}`,
          type:  'value_prop' as const,
          title: a.title || a.titre || '',
          body:  a.body  || a.corps || '',
        })),
        ...(ctaText ? [{ id: 'cta', type: 'cta' as const, title: ctaText, body: (rawResult.cta_subtext as string) || '' }] : []),
      ],
      brand_colors: {
        primary:    rawBrand.primaryColor   as string || '#2F5446',
        secondary:  rawBrand.secondaryColor as string || '#3D6B58',
        background: '#FAFAF9',
        text:       '#0F1C17',
        accent:     '#C8790A',
      },
    }
  }

  return (
    <>
      <DealLinkViewTracker slug={slug} />
      <SalesPage
        deallink={{
          slug:            dl.slug,
          prospectName:    dl.prospect_name    ?? '',
          prospectCompany: dl.prospect_company ?? undefined,
          prospectRole:    dl.prospect_role    ?? undefined,
          sellerName:      dl.seller_name      ?? '',
          sellerEmail:     dl.seller_email     ?? undefined,
          sellerPhone:     dl.seller_phone     ?? undefined,
        }}
        result={result}
        brand={brand}
      />
    </>
  )
}
