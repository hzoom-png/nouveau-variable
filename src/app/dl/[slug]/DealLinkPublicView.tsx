'use client'

interface Section {
  id: string
  type: 'hero' | 'context' | 'value_prop' | 'proof' | 'cta'
  title: string
  body: string
}

interface Props {
  deallink: {
    slug: string
    prospectName: string
    prospectCompany?: string
    prospectRole?: string
    sellerName: string
    sellerEmail?: string
    sellerPhone?: string
  }
  result: {
    tagline?: string
    sections?: Section[]
    brand_colors?: {
      primary?: string
      secondary?: string
      background?: string
      text?: string
      accent?: string
    }
    caseStudyUrl?: string
    sellerLogoUrl?: string
    prospectLogoUrl?: string
  }
  brand: {
    primaryColor?: string
    secondaryColor?: string
    backgroundColor?: string
    textColor?: string
    fontFamily?: string
    logoUrl?: string
    prospectLogoUrl?: string
    caseStudyUrl?: string
  }
}

const SECTION_LABELS: Record<string, string> = {
  context: 'Contexte',
  value_prop: 'Ce que ça change',
  proof: 'Preuve',
  cta: 'Appel à l\'action',
}

export function DealLinkPublicView({ deallink, result, brand }: Props) {
  const primary   = brand.primaryColor   || result.brand_colors?.primary   || '#2F5446'
  const secondary = brand.secondaryColor || result.brand_colors?.secondary || '#3D6B58'
  const bg        = brand.backgroundColor || result.brand_colors?.background || '#F7FAF8'
  const textColor = brand.textColor      || result.brand_colors?.text      || '#0F1C17'
  const accent    = result.brand_colors?.accent || '#C8790A'
  const font      = brand.fontFamily || 'system-ui, sans-serif'

  const sellerLogo    = brand.logoUrl          || result.sellerLogoUrl
  const prospectLogo  = brand.prospectLogoUrl  || result.prospectLogoUrl
  const caseStudyUrl  = brand.caseStudyUrl     || result.caseStudyUrl

  const sections      = result.sections || []
  const heroSection   = sections.find(s => s.type === 'hero')
  const bodySections  = sections.filter(s => s.type !== 'hero' && s.type !== 'cta')
  const ctaSection    = sections.find(s => s.type === 'cta')

  const prospectBadge = [deallink.prospectName, deallink.prospectCompany, deallink.prospectRole]
    .filter(Boolean).join(' · ')

  const css = `
    :root {
      --dl-primary: ${primary};
      --dl-secondary: ${secondary};
      --dl-bg: ${bg};
      --dl-text: ${textColor};
      --dl-accent: ${accent};
      --dl-font: ${font};
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--dl-bg); color: var(--dl-text); font-family: var(--dl-font); }
    .dl-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block; animation: dlPulse 2s ease-in-out infinite; }
    @keyframes dlPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .5; transform: scale(.85); } }
    .dl-nav-btn { display: inline-flex; align-items: center; background: var(--dl-primary); color: #fff; padding: 8px 18px; border-radius: 99px; font-size: 13px; font-weight: 700; text-decoration: none; transition: opacity .18s; }
    .dl-nav-btn:hover { opacity: .88; }
    .dl-cta-btn-main { display: inline-block; background: #fff; color: var(--dl-primary); padding: 14px 36px; border-radius: 99px; font-size: 15px; font-weight: 800; text-decoration: none; transition: opacity .18s, transform .14s; cursor: pointer; border: none; font-family: inherit; }
    .dl-cta-btn-main:hover { opacity: .9; transform: scale(1.02); }
    .dl-cta-btn-sec { display: inline-block; background: rgba(255,255,255,.15); color: #fff; padding: 14px 36px; border-radius: 99px; font-size: 15px; font-weight: 700; text-decoration: none; transition: opacity .18s; border: 1.5px solid rgba(255,255,255,.4); }
    .dl-cta-btn-sec:hover { opacity: .8; }
  `

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textColor, fontFamily: font }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(8px)',
        background: bg + 'e8',
        borderBottom: `1px solid ${primary}20`,
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {sellerLogo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={sellerLogo} alt="" style={{ height: '26px', maxWidth: '120px', objectFit: 'contain' }} />
            : <span style={{ fontWeight: 700, fontSize: '14px', color: primary }}>{deallink.sellerName}</span>
          }
          {prospectLogo && (
            <>
              <span style={{ color: primary, fontWeight: 700, fontSize: '14px', opacity: .5 }}>×</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={prospectLogo} alt="" style={{ height: '22px', maxWidth: '100px', objectFit: 'contain' }} />
            </>
          )}
        </div>
        {deallink.sellerEmail && (
          <a href={`mailto:${deallink.sellerEmail}`} className="dl-nav-btn">
            Nous contacter
          </a>
        )}
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '80px 32px 64px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: primary + '15', border: `1px solid ${primary}30`,
          color: primary, borderRadius: '99px', padding: '5px 14px',
          fontSize: '12px', fontWeight: 600, marginBottom: '28px',
        }}>
          <span className="dl-dot" />
          Préparé pour {prospectBadge}
        </div>

        {result.tagline && (
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.15,
            color: textColor, marginBottom: '20px',
          }}>
            {result.tagline}
          </h1>
        )}

        {heroSection?.body && (
          <p style={{ fontSize: '18px', opacity: 0.75, maxWidth: '620px', lineHeight: 1.65 }}>
            {heroSection.body}
          </p>
        )}
      </section>

      {/* BODY SECTIONS */}
      {bodySections.length > 0 && (
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 32px' }}>
          {bodySections.map((section, i) => (
            <div
              key={section.id}
              style={{
                paddingBottom: '40px', marginBottom: '40px',
                borderBottom: i < bodySections.length - 1 ? `1px solid ${primary}15` : 'none',
              }}
            >
              {(section.type === 'value_prop' || section.type === 'proof') && (
                <div style={{
                  fontSize: '11px', fontWeight: 700, letterSpacing: '.1em',
                  textTransform: 'uppercase', color: accent, marginBottom: '10px',
                }}>
                  {SECTION_LABELS[section.type]}
                </div>
              )}
              <h2 style={{
                fontSize: 'clamp(1.2rem, 3vw, 1.75rem)', fontWeight: 800,
                color: textColor, marginBottom: '12px', lineHeight: 1.3,
              }}>
                {section.title}
              </h2>
              <p style={{ fontSize: '16px', opacity: 0.78, lineHeight: 1.7 }}>
                {section.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* CAS CLIENT */}
      {caseStudyUrl && (
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 32px 52px' }}>
          <div style={{
            background: primary + '08', border: `1px solid ${primary}20`,
            borderRadius: '16px', padding: '28px 32px',
          }}>
            <p style={{ fontSize: '15px', color: textColor, marginBottom: '18px', lineHeight: 1.6 }}>
              Découvrez comment nos clients ont transformé leurs résultats.
            </p>
            <a
              href={caseStudyUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block', background: primary, color: '#fff',
                padding: '10px 22px', borderRadius: '99px',
                fontSize: '13px', fontWeight: 700, textDecoration: 'none',
              }}
            >
              Voir le cas client →
            </a>
            <p style={{ fontSize: '11px', opacity: 0.5, marginTop: '14px' }}>
              Témoignage authentique fourni par {deallink.sellerName}
            </p>
          </div>
        </div>
      )}

      {/* CTA FINAL */}
      {ctaSection && (
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 32px 80px' }}>
          <div style={{
            background: primary, borderRadius: '20px',
            padding: '52px 40px', textAlign: 'center',
          }}>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: '#fff', marginBottom: '14px' }}>
              {ctaSection.title}
            </h2>
            <p style={{ fontSize: '16px', color: '#fff', opacity: 0.78, marginBottom: '32px', lineHeight: 1.65 }}>
              {ctaSection.body}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {deallink.sellerEmail && (
                <a href={`mailto:${deallink.sellerEmail}`} className="dl-cta-btn-main">
                  Écrire à {deallink.sellerName}
                </a>
              )}
              {deallink.sellerPhone && (
                <a href={`tel:${deallink.sellerPhone}`} className="dl-cta-btn-sec">
                  Appeler
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{
        borderTop: `1px solid ${primary}15`,
        padding: '24px', textAlign: 'center',
      }}>
        <p style={{ fontSize: '12px', opacity: 0.4, marginBottom: '4px' }}>
          Page créée par {deallink.sellerName}
        </p>
        <p style={{ fontSize: '11px', opacity: 0.25, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          Nouveau Variable
        </p>
      </footer>
    </div>
  )
}
