import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import DealLinkViewTracker from './DealLinkViewTracker'

type Argument = { titre: string; corps: string }
type Temoignage = { citation: string; auteur: string }
type Objection = { objection: string; reponse: string }
type DLResult = {
  score: number
  accroche: string
  arguments: Argument[]
  temoignage: Temoignage
  cta: string
  objections: Objection[]
}
type BrandColors = { primary: string; secondary: string; bg: string; text: string }
type BrandAssets = BrandColors & { logoUrl?: string | null; siteName?: string | null }

const DEFAULT_COLORS: BrandColors = {
  primary: '#2F5446',
  secondary: '#3D6B58',
  bg: '#FFFFFF',
  text: '#0F1C17',
}

export default async function DealLinkPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: dl } = await supabase
    .from('deallinks')
    .select('prospect_name, product_name, score, content, brand_colors, brand_assets, prospect_sector')
    .eq('slug', slug)
    .single()

  if (!dl) notFound()

  const result = dl.content as DLResult
  const assets = (dl.brand_assets as BrandAssets | null)
  const colors: BrandColors = assets ?? (dl.brand_colors as BrandColors) ?? DEFAULT_COLORS
  const logoUrl = assets?.logoUrl ?? null
  const siteName = assets?.siteName ?? null

  const css = {
    '--dl-primary': colors.primary,
    '--dl-secondary': colors.secondary,
    '--dl-bg': colors.bg,
    '--dl-text': colors.text,
  } as React.CSSProperties

  return (
    <div style={{ ...css, minHeight: '100vh', background: colors.bg, fontFamily: 'Inter, system-ui, sans-serif', color: colors.text }}>
      <DealLinkViewTracker slug={slug} />
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${colors.primary}22`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `${colors.primary}08` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" style={{ height: 28, maxWidth: 120, objectFit: 'contain' }} />
          ) : (
            <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 13, color: colors.primary, letterSpacing: '.03em' }}>
              {siteName ?? 'Nouveau Variable'}
            </span>
          )}
        </div>
        <div style={{ background: `${colors.primary}15`, border: `1px solid ${colors.primary}30`, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: colors.primary }}>
          Score {result.score}/100
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Accroche */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: `${colors.text}66`, marginBottom: 10 }}>
            Bonjour {dl.prospect_name},
          </div>
          <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, lineHeight: 1.3, color: colors.text, letterSpacing: '-.02em' }}>
            {result.accroche}
          </div>
        </div>

        {/* Arguments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {result.arguments?.map((arg, i) => (
            <div key={i} style={{ background: colors.bg, border: `1.5px solid ${colors.primary}20`, borderRadius: 14, padding: '16px 18px', display: 'flex', gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: colors.primary, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'Jost, sans-serif', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 4 }}>{arg.titre}</div>
                <div style={{ fontSize: 13, color: `${colors.text}99`, lineHeight: 1.65 }}>{arg.corps}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Témoignage */}
        {result.temoignage && (
          <div style={{ background: `${colors.primary}08`, border: `1px solid ${colors.primary}25`, borderRadius: 14, padding: '18px 20px', marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: `${colors.text}55`, marginBottom: 10 }}>Témoignage</div>
            <div style={{ fontSize: 14, color: colors.text, fontStyle: 'italic', lineHeight: 1.65, marginBottom: 10 }}>
              &ldquo;{result.temoignage.citation}&rdquo;
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: `${colors.text}77` }}>{result.temoignage.auteur}</div>
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 700, color: `${colors.text}88`, marginBottom: 12 }}>{dl.product_name}</div>
          <a
            href={`mailto:?subject=On discute de ${dl.product_name} ?&body=${encodeURIComponent(result.cta)}`}
            style={{ display: 'inline-block', background: colors.primary, color: '#fff', padding: '13px 32px', borderRadius: 999, fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 700, textDecoration: 'none', letterSpacing: '.01em' }}
          >
            {result.cta}
          </a>
        </div>

        {/* Objections */}
        {result.objections?.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: `${colors.text}55`, marginBottom: 12 }}>Questions fréquentes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.objections.map((o, i) => (
                <div key={i} style={{ border: `1px solid ${colors.primary}18`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{o.objection}</div>
                  <div style={{ fontSize: 13, color: colors.primary }}>→ {o.reponse}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '24px', borderTop: `1px solid ${colors.primary}15`, fontSize: 11, color: `${colors.text}44` }}>
        Généré avec Nouveau Variable · Club des commerciaux ambitieux
      </div>
    </div>
  )
}
