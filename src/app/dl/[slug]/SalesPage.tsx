'use client'

export interface DealLinkResult {
  tagline: string
  sections: {
    id: string
    type: 'hero' | 'context' | 'value_prop' | 'proof' | 'cta'
    title: string
    body: string
  }[]
  brand_colors?: {
    primary?: string
    secondary?: string
    background?: string
    text?: string
    accent?: string
  }
  caseStudyUrl?: string
}

export interface BrandAssets {
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  textColor?: string
  fontFamily?: string
  logoUrl?: string
  prospectLogoUrl?: string
  caseStudyUrl?: string
  calendlyUrl?: string
  calendlyCtaLabel?: string
  quoteUrl?: string
  quoteCtaLabel?: string
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
  result: DealLinkResult
  brand: BrandAssets
}

export function SalesPage({ deallink, result, brand }: Props) {
  const P      = brand.primaryColor    || result.brand_colors?.primary    || '#2F5446'
  const BG     = brand.backgroundColor || result.brand_colors?.background || '#FAFAF9'
  const TEXT   = brand.textColor       || result.brand_colors?.text       || '#0F1C17'
  const ACCENT = result.brand_colors?.accent || '#C8790A'
  const FONT   = brand.fontFamily || 'system-ui, -apple-system, sans-serif'

  const caseStudy    = brand.caseStudyUrl  || result.caseStudyUrl
  const sellerLogo   = brand.logoUrl
  const prospectLogo = brand.prospectLogoUrl
  const calendlyUrl  = brand.calendlyUrl
  const quoteUrl     = brand.quoteUrl

  const heroSection   = result.sections.find(s => s.type === 'hero')
  const otherSections = result.sections.filter(s => s.type !== 'hero' && s.type !== 'cta')
  const ctaSection    = result.sections.find(s => s.type === 'cta')

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${BG}; color: ${TEXT}; font-family: ${FONT}; -webkit-font-smoothing: antialiased; }
        ::selection { background: ${P}33; }
      `}</style>

      <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: FONT }}>

        {/* NAV */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: `${BG}f0`, backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${TEXT}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px clamp(20px, 5vw, 48px)',
        }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: P }}>{deallink.sellerName}</span>
          {deallink.sellerEmail && (
            <a href={`mailto:${deallink.sellerEmail}`} style={{
              background: P, color: '#fff',
              padding: '9px 20px', borderRadius: 99,
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>
              Nous contacter
            </a>
          )}
        </nav>

        {/* LOGO HERO */}
        {(sellerLogo || prospectLogo) && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 24, padding: '36px clamp(20px, 5vw, 48px) 0',
          }}>
            {sellerLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sellerLogo} alt={deallink.sellerName} style={{ height: 56, maxWidth: 180, objectFit: 'contain' }} />
            )}
            {sellerLogo && prospectLogo && (
              <span style={{ opacity: 0.2, fontSize: 24, fontWeight: 300, lineHeight: 1 }}>×</span>
            )}
            {prospectLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={prospectLogo} alt={deallink.prospectCompany || ''} style={{ height: 48, maxWidth: 160, objectFit: 'contain', opacity: 0.8 }} />
            )}
          </div>
        )}

        {/* HERO */}
        <section style={{ padding: '72px clamp(20px, 5vw, 48px) 64px', maxWidth: 800, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: `${P}12`, border: `1px solid ${P}28`,
            borderRadius: 99, padding: '6px 14px', marginBottom: 32,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: P, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: P, letterSpacing: '0.04em' }}>
              Préparé exclusivement pour{' '}
              {deallink.prospectName}
              {deallink.prospectCompany ? ` · ${deallink.prospectCompany}` : ''}
              {deallink.prospectRole ? ` · ${deallink.prospectRole}` : ''}
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.4rem)', fontWeight: 900,
            lineHeight: 1.1, letterSpacing: '-0.03em',
            marginBottom: 24, color: TEXT,
          }}>
            {result.tagline}
          </h1>

          {heroSection && (
            <p style={{ fontSize: 'clamp(16px, 2vw, 18px)', lineHeight: 1.7, color: TEXT, opacity: 0.72, maxWidth: 620 }}>
              {heroSection.body}
            </p>
          )}

          {(calendlyUrl || quoteUrl || deallink.sellerEmail || deallink.sellerPhone) && (
            <div style={{ marginTop: 36, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {calendlyUrl ? (
                <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" style={{
                  background: P, color: '#fff',
                  padding: '13px 28px', borderRadius: 99,
                  fontSize: 15, fontWeight: 700, textDecoration: 'none',
                }}>
                  {brand.calendlyCtaLabel || `Réserver un créneau avec ${deallink.sellerName.split(' ')[0]}`}
                </a>
              ) : deallink.sellerEmail ? (
                <a href={`mailto:${deallink.sellerEmail}`} style={{
                  background: P, color: '#fff',
                  padding: '13px 28px', borderRadius: 99,
                  fontSize: 15, fontWeight: 700, textDecoration: 'none',
                }}>
                  Échanger avec {deallink.sellerName.split(' ')[0]}
                </a>
              ) : null}
              {quoteUrl && (
                <a href={quoteUrl} target="_blank" rel="noopener noreferrer" style={{
                  background: 'transparent', color: P,
                  padding: '13px 28px', borderRadius: 99,
                  border: `1.5px solid ${P}40`,
                  fontSize: 15, fontWeight: 600, textDecoration: 'none',
                }}>
                  {brand.quoteCtaLabel || 'Obtenir un devis'}
                </a>
              )}
              {deallink.sellerPhone && (
                <a href={`tel:${deallink.sellerPhone}`} style={{
                  background: 'transparent', color: P,
                  padding: '13px 28px', borderRadius: 99,
                  border: `1.5px solid ${P}40`,
                  fontSize: 15, fontWeight: 600, textDecoration: 'none',
                }}>
                  Appeler
                </a>
              )}
            </div>
          )}
        </section>

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 clamp(20px, 5vw, 48px)' }}>
          <div style={{ height: 1, background: `${TEXT}0f` }} />
        </div>

        {/* SECTIONS DYNAMIQUES */}
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 clamp(20px, 5vw, 48px)' }}>
          {otherSections.map((section, i) => (
            <section key={section.id} style={{
              padding: '56px 0',
              borderBottom: i < otherSections.length - 1 ? `1px solid ${TEXT}0f` : 'none',
            }}>
              {(section.type === 'context' || section.type === 'value_prop' || section.type === 'proof') && (
                <span style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: ACCENT, marginBottom: 14,
                }}>
                  {section.type === 'context'    && 'Votre situation'}
                  {section.type === 'value_prop' && 'Ce que vous gagnez'}
                  {section.type === 'proof'      && 'Notre expérience'}
                </span>
              )}
              <h2 style={{
                fontSize: 'clamp(1.3rem, 3vw, 1.9rem)', fontWeight: 800,
                letterSpacing: '-0.025em', lineHeight: 1.2,
                marginBottom: 18, color: TEXT,
              }}>
                {section.title}
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: TEXT, opacity: 0.75, maxWidth: 640 }}>
                {section.body}
              </p>
            </section>
          ))}
        </div>

        {/* CAS CLIENT */}
        {caseStudy && (
          <div style={{ maxWidth: 800, margin: '0 auto 56px', padding: '0 clamp(20px, 5vw, 48px)' }}>
            <div style={{
              background: `${P}0a`, border: `1px solid ${P}22`,
              borderRadius: 16, padding: '28px 32px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 20, flexWrap: 'wrap',
            }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: P, marginBottom: 8 }}>
                  Cas client
                </p>
                <p style={{ fontSize: 15, color: TEXT, opacity: 0.8, lineHeight: 1.5 }}>
                  Un exemple concret de résultats obtenus pour un profil similaire.
                </p>
                <p style={{ fontSize: 11, color: TEXT, opacity: 0.38, marginTop: 6 }}>
                  Étude de cas fournie par {deallink.sellerName}
                </p>
              </div>
              <a href={caseStudy} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: P, color: '#fff',
                padding: '11px 22px', borderRadius: 99,
                fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Voir le cas client →
              </a>
            </div>
          </div>
        )}

        {/* CTA FINAL */}
        {ctaSection && (
          <section style={{ maxWidth: 800, margin: '0 auto 80px', padding: '0 clamp(20px, 5vw, 48px)' }}>
            <div style={{
              background: P, borderRadius: 20,
              padding: 'clamp(36px, 6vw, 60px) clamp(24px, 5vw, 48px)',
              textAlign: 'center',
            }}>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 900, color: '#fff',
                letterSpacing: '-0.025em', marginBottom: 14,
              }}>
                {ctaSection.title}
              </h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.78)', marginBottom: 32, lineHeight: 1.65 }}>
                {ctaSection.body}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {calendlyUrl ? (
                  <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" style={{
                    background: '#fff', color: P,
                    padding: '14px 28px', borderRadius: 99,
                    fontSize: 15, fontWeight: 700, textDecoration: 'none',
                  }}>
                    {brand.calendlyCtaLabel || `Réserver un créneau avec ${deallink.sellerName.split(' ')[0]}`}
                  </a>
                ) : deallink.sellerEmail ? (
                  <a href={`mailto:${deallink.sellerEmail}`} style={{
                    background: '#fff', color: P,
                    padding: '14px 28px', borderRadius: 99,
                    fontSize: 15, fontWeight: 700, textDecoration: 'none',
                  }}>
                    Écrire à {deallink.sellerName.split(' ')[0]}
                  </a>
                ) : null}
                {quoteUrl && (
                  <a href={quoteUrl} target="_blank" rel="noopener noreferrer" style={{
                    background: 'rgba(255,255,255,0.15)', color: '#fff',
                    padding: '14px 28px', borderRadius: 99,
                    border: '1.5px solid rgba(255,255,255,0.3)',
                    fontSize: 15, fontWeight: 600, textDecoration: 'none',
                  }}>
                    {brand.quoteCtaLabel || 'Obtenir un devis'}
                  </a>
                )}
                {deallink.sellerPhone && (
                  <a href={`tel:${deallink.sellerPhone}`} style={{
                    background: 'rgba(255,255,255,0.15)', color: '#fff',
                    padding: '14px 28px', borderRadius: 99,
                    border: '1.5px solid rgba(255,255,255,0.3)',
                    fontSize: 15, fontWeight: 600, textDecoration: 'none',
                  }}>
                    Appeler
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer style={{
          borderTop: `1px solid ${TEXT}0f`,
          padding: '24px clamp(20px, 5vw, 48px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ fontSize: 12, color: TEXT, opacity: 0.35 }}>
            Page créée par {deallink.sellerName}
          </span>
          <span style={{ fontSize: 10, color: TEXT, opacity: 0.2, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Nouveau Variable
          </span>
        </footer>
      </div>
    </>
  )
}
