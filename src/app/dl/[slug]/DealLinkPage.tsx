'use client'

import { useState, useEffect } from 'react'

type Argument    = { rank: number; title: string; body: string; icon: string }
type Testimonial = { quote: string; author: string; role: string }
type Objection   = { question: string; answer: string }

export type DLResult = {
  score: number
  hook: string
  subhook?: string
  arguments: Argument[]
  testimonial: Testimonial
  cta_text: string
  cta_subtext?: string
  objections: Objection[]
}

export type BrandAssets = {
  primaryColor: string
  secondaryColor: string
  logoUrl?: string | null
  siteName?: string | null
  faviconUrl?: string | null
}

interface Props {
  slug: string
  prospectName: string
  productName: string
  result: DLResult
  brandAssets: BrandAssets
  sellerName?: string | null
  sellerEmail?: string | null
  sellerPhone?: string | null
}

export default function DealLinkPage({ slug, prospectName, productName, result, brandAssets, sellerName, sellerEmail, sellerPhone }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const primary   = brandAssets.primaryColor   ?? '#2F5446'
  const pBg       = primary + '12'
  const pBorder   = primary + '28'
  const pLight    = primary + '18'

  useEffect(() => {
    fetch(`/api/dl/${slug}/view`, { method: 'POST' }).catch(() => {})
  }, [slug])

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', color: '#0F1C17' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .dl-fade { animation: dlFade .55s ease both; }
        .dl-d1 { animation-delay: .05s; }
        .dl-d2 { animation-delay: .15s; }
        .dl-d3 { animation-delay: .25s; }
        .dl-d4 { animation-delay: .35s; }
        .dl-d5 { animation-delay: .45s; }
        .dl-d6 { animation-delay: .55s; }
        @keyframes dlFade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dlScore { from { width: 0; } to { width: ${result.score}%; } }
        .dl-score-fill { animation: dlScore 1.4s cubic-bezier(.16,1,.3,1) .7s both; }
        .dl-arg { transition: transform .18s, box-shadow .18s; cursor: default; }
        .dl-arg:hover { transform: translateY(-2px); box-shadow: 0 8px 24px ${pBorder}; }
        .dl-faq-row { border-bottom: 1px solid ${pBorder}; }
        .dl-faq-row:last-child { border-bottom: none; }
        .dl-faq-btn { background: none; border: none; cursor: pointer; width: 100%; text-align: left; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px; }
        .dl-faq-btn:hover { background: ${pBg}; }
        .dl-faq-icon { font-size: 20px; font-weight: 700; color: ${primary}; transition: transform .2s; flex-shrink: 0; line-height: 1; }
        .dl-faq-icon.open { transform: rotate(45deg); }
        .dl-cta-btn { display: inline-block; background: ${primary}; color: #fff; padding: 15px 40px; border-radius: 999px; font-family: inherit; font-size: 15px; font-weight: 700; text-decoration: none; cursor: pointer; border: none; transition: opacity .18s, transform .14s; letter-spacing: .01em; }
        .dl-cta-btn:hover { opacity: .9; transform: scale(1.025); }
        @media (max-width: 600px) {
          .dl-args-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: `1px solid ${pBorder}`,
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {brandAssets.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brandAssets.logoUrl} alt="" style={{ height: 26, maxWidth: 120, objectFit: 'contain' }} />
          ) : (
            <span style={{ fontWeight: 800, fontSize: 14, color: primary, letterSpacing: '-.01em' }}>
              {brandAssets.siteName ?? productName}
            </span>
          )}
        </div>
        <div style={{
          background: pBg, border: `1px solid ${pBorder}`,
          padding: '4px 13px', borderRadius: 999,
          fontSize: 11, fontWeight: 700, color: primary,
        }}>
          Score {result.score}/100
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 660, margin: '0 auto', padding: '52px 24px 40px' }}>
        <div className="dl-fade dl-d1" style={{ fontSize: 11, fontWeight: 700, color: primary, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 14 }}>
          Bonjour {prospectName},
        </div>
        <h1 className="dl-fade dl-d2" style={{ fontSize: 'clamp(22px, 4.5vw, 30px)', fontWeight: 800, lineHeight: 1.25, color: '#0F1C17', letterSpacing: '-.02em', marginBottom: 14 }}>
          {result.hook}
        </h1>
        {result.subhook && (
          <p className="dl-fade dl-d3" style={{ fontSize: 16, color: '#556B63', lineHeight: 1.7, marginBottom: 26 }}>
            {result.subhook}
          </p>
        )}
        {/* Score bar */}
        <div className="dl-fade dl-d4">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#9BAAA4', marginBottom: 7 }}>
            <span>Pertinence pour votre profil</span>
            <span style={{ color: primary }}>{result.score}/100</span>
          </div>
          <div style={{ height: 5, background: '#EEF2F0', borderRadius: 999, overflow: 'hidden' }}>
            <div className="dl-score-fill" style={{ height: 5, background: primary, borderRadius: 999, width: result.score + '%' }} />
          </div>
        </div>
      </section>

      {/* Arguments */}
      <section style={{ maxWidth: 660, margin: '0 auto', padding: '0 24px 44px' }}>
        <div className="dl-fade dl-d3" style={{ fontSize: 11, fontWeight: 700, color: '#9BAAA4', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14 }}>
          Pourquoi ça vous correspond
        </div>
        <div className="dl-args-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          {result.arguments?.map((arg, i) => (
            <div
              key={i}
              className={`dl-arg dl-fade dl-d${Math.min(i + 4, 6)}`}
              style={{
                background: '#fff', border: `1.5px solid ${pBorder}`,
                borderRadius: 14, padding: '18px 20px',
                display: 'flex', gap: 16, alignItems: 'flex-start',
              }}
            >
              <div style={{
                flexShrink: 0, width: 46, height: 46, borderRadius: 12,
                background: pBg, border: `1px solid ${pLight}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>
                {arg.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1C17', marginBottom: 5 }}>{arg.title}</div>
                <div style={{ fontSize: 13, color: '#556B63', lineHeight: 1.7 }}>{arg.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      {result.testimonial?.quote && (
        <section style={{ background: primary, padding: '44px 24px', marginBottom: 44 }}>
          <div style={{ maxWidth: 580, margin: '0 auto' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 16 }}>
              Témoignage
            </div>
            <blockquote style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', fontWeight: 500, color: '#fff', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 20 }}>
              &ldquo;{result.testimonial.quote}&rdquo;
            </blockquote>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.18)',
                display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {result.testimonial.author.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{result.testimonial.author}</div>
                {result.testimonial.role && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>{result.testimonial.role}</div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px 52px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9BAAA4', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 14 }}>
          {productName}
        </div>
        <button
          className="dl-cta-btn"
          onClick={() => {
            if (sellerEmail) {
              window.location.href = `mailto:${sellerEmail}?subject=Suite à votre présentation — ${productName}`
            }
          }}
        >
          {result.cta_text}
        </button>
        {result.cta_subtext && (
          <div style={{ fontSize: 13, color: '#9BAAA4', marginTop: 10 }}>{result.cta_subtext}</div>
        )}
        {(sellerName || sellerEmail || sellerPhone) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', fontSize: 13, marginTop: 20 }}>
            {sellerName && <span style={{ fontWeight: 600, color: '#0F1C17' }}>{sellerName}</span>}
            {sellerEmail && (
              <a href={`mailto:${sellerEmail}`} style={{ color: primary, textDecoration: 'none', fontWeight: 500 }}>
                {sellerEmail}
              </a>
            )}
            {sellerPhone && (
              <a href={`tel:${sellerPhone}`} style={{ color: '#556B63', textDecoration: 'none' }}>
                {sellerPhone}
              </a>
            )}
          </div>
        )}
      </section>

      {/* FAQ / Objections */}
      {result.objections?.length > 0 && (
        <section style={{ maxWidth: 660, margin: '0 auto', padding: '0 24px 52px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9BAAA4', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14 }}>
            Questions fréquentes
          </div>
          <div style={{ border: `1px solid ${pBorder}`, borderRadius: 12, overflow: 'hidden' }}>
            {result.objections.map((o, i) => (
              <div key={i} className="dl-faq-row">
                <button className="dl-faq-btn" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0F1C17', lineHeight: 1.45 }}>{o.question}</span>
                  <span className={`dl-faq-icon${openIdx === i ? ' open' : ''}`}>+</span>
                </button>
                {openIdx === i && (
                  <div style={{ padding: '0 20px 16px', fontSize: 13, color: '#556B63', lineHeight: 1.7 }}>
                    {o.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${pBorder}`, padding: '22px 24px', textAlign: 'center', fontSize: 11, color: '#9BAAA4' }}>
        Propulsé par{' '}
        <a href="https://nouveauvariable.fr" target="_blank" rel="noopener noreferrer" style={{ color: primary, textDecoration: 'none', fontWeight: 700 }}>
          Nouveau Variable
        </a>
        {' · '}Club des commerciaux ambitieux
      </footer>
    </div>
  )
}
