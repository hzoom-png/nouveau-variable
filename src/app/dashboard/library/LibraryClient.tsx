'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeDate } from '@/lib/dateUtils'

type DLResult = {
  accroche: string
  arguments: { titre: string; corps: string }[]
  temoignage: { citation: string; auteur: string }
  cta: string
  objections: { objection: string; reponse: string }[]
}

type DbDealLink = {
  id: string
  prospect_name: string | null
  prospect_company: string | null
  product_name: string | null
  slug: string | null
  score: number | null
  content: DLResult | null
  opened_at: string | null
  created_at: string
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function LibraryClient() {
  const [deallinks, setDeallinks] = useState<DbDealLink[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDL, setExpandedDL] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('deallinks')
        .select('id, prospect_name, prospect_company, product_name, slug, score, content, opened_at, created_at')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      setDeallinks((data as DbDealLink[]) ?? [])
      setLoading(false)
    })
  }, [])

  async function deleteDealLink(id: string) {
    const supabase = createClient()
    await supabase.from('deallinks').delete().eq('id', id)
    setDeallinks(prev => prev.filter(d => d.id !== id))
  }

  function copyDealLink(slug: string | null) {
    if (!slug) return
    navigator.clipboard.writeText(`${window.location.origin}/dl/${slug}`)
    setCopiedId(slug)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div style={{ maxWidth: '860px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '4px 12px', borderRadius: 'var(--r-full)', background: 'var(--green-3)', border: '1px solid var(--green-4)', fontSize: '11px', fontWeight: 700, color: 'var(--green)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 1h8v10L6 8.5 2 11V1z"/></svg>
          Ma bibliothèque
        </div>
        <div style={{ fontFamily: 'var(--font-jost)', fontSize: '28px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em', marginBottom: '8px' }}>Tes DealLinks sauvegardés</div>
        <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, maxWidth: '560px' }}>
          Chaque DealLink est conservé ici. Retrouve, réutilise, analyse les ouvertures.
        </div>
      </div>

      {loading && (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>Chargement…</div>
      )}

      {!loading && deallinks.length === 0 && (
        <EmptyState
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>}
          title="Aucun DealLink encore"
          desc="Génère ton premier DealLink pour le voir apparaître ici."
          href="/dashboard/tools/deallink"
          cta="Créer un DealLink →"
        />
      )}

      {!loading && deallinks.map(dl => {
        const res = dl.content
        const isExpanded = expandedDL === dl.id
        return (
          <div key={dl.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: '12px', transition: '.14s' }}>
            <div style={{ height: '3px', background: dl.score ? (dl.score >= 75 ? 'var(--green)' : dl.score >= 50 ? 'var(--amber)' : 'var(--red)') : 'var(--border)' }} />
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--r-sm)', flexShrink: 0, background: 'var(--green-3)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-jost)', fontSize: '12px', fontWeight: 700, color: 'var(--green)' }}>
                  {getInitials(dl.prospect_name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-jost)' }}>
                    {dl.prospect_name || '—'}{dl.prospect_company ? ` · ${dl.prospect_company}` : ''}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '1px' }}>
                    {dl.product_name || '—'} · {formatDate(dl.created_at)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {dl.score !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '60px', height: '4px', background: 'var(--surface-2)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
                        <div style={{ height: '4px', background: dl.score >= 75 ? 'var(--green)' : dl.score >= 50 ? 'var(--amber)' : 'var(--red)', width: dl.score + '%' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-2)' }}>{dl.score}/100</span>
                    </div>
                  )}
                  <span style={{ padding: '2px 9px', borderRadius: 'var(--r-full)', fontSize: '10px', fontWeight: 600, background: dl.opened_at ? 'var(--green-3)' : 'var(--surface)', color: dl.opened_at ? 'var(--green)' : 'var(--text-3)', border: `1px solid ${dl.opened_at ? 'var(--green-4)' : 'var(--border)'}` }}>
                    {dl.opened_at ? `Ouvert ${formatRelativeDate(dl.opened_at)}` : 'Non ouvert'}
                  </span>
                </div>
              </div>

              {res?.accroche && (
                <div style={{ fontSize: '12px', color: 'var(--text-2)', background: 'var(--surface)', borderRadius: 'var(--r-sm)', padding: '7px 10px', marginBottom: '10px', lineHeight: 1.5, fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                  {res.accroche}
                </div>
              )}

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {res && (
                  <button onClick={() => setExpandedDL(isExpanded ? null : dl.id)} style={{ padding: '6px 12px', borderRadius: 'var(--r-sm)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: isExpanded ? 'var(--green-3)' : 'var(--surface)', color: isExpanded ? 'var(--green)' : 'var(--text-2)', border: '1px solid var(--border)', transition: '.14s' }}>
                    Voir le contenu {isExpanded ? '▴' : '▾'}
                  </button>
                )}
                <button onClick={() => copyDealLink(dl.slug)} style={{ padding: '6px 12px', borderRadius: 'var(--r-sm)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: copiedId === dl.slug ? 'var(--green-3)' : 'var(--surface)', color: copiedId === dl.slug ? 'var(--green)' : 'var(--text-2)', border: '1px solid var(--border)', transition: '.14s' }}>
                  {copiedId === dl.slug ? '✓ Copié' : 'Copier le lien'}
                </button>
                <button onClick={() => deleteDealLink(dl.id)} style={{ padding: '6px 12px', borderRadius: 'var(--r-sm)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)', transition: '.14s', marginLeft: 'auto' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--red-2)'; e.currentTarget.style.color = 'var(--red)' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-3)' }}
                >×</button>
              </div>

              {isExpanded && res && (
                <div style={{ marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '8px' }}>Arguments</div>
                    {res.arguments?.map((arg, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'var(--green)', display: 'grid', placeItems: 'center', fontSize: '10px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>{arg.titre}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>{arg.corps}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {res.temoignage && (
                    <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: '10px 12px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text)', marginBottom: '5px' }}>&ldquo;{res.temoignage.citation}&rdquo;</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)' }}>{res.temoignage.auteur}</div>
                    </div>
                  )}
                  <div style={{ background: 'var(--green-3)', borderRadius: 'var(--r-sm)', padding: '8px 12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)' }}>CTA : </span>
                    <span style={{ fontSize: '12px', color: 'var(--text)' }}>{res.cta}</span>
                  </div>
                  {res.objections?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '6px' }}>Objections</div>
                      {res.objections.map((o, i) => (
                        <div key={i} style={{ marginBottom: '6px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>— {o.objection}</div>
                          <div style={{ fontSize: '12px', color: 'var(--green)' }}>→ {o.reponse}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EmptyState({ icon, title, desc, href, cta }: {
  icon: React.ReactNode; title: string; desc: string; href: string; cta: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '280px' }}>
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '48px 40px', textAlign: 'center', maxWidth: '380px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ width: '52px', height: '52px', background: 'var(--green-3)', borderRadius: 'var(--r-lg)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
          {icon}
        </div>
        <div style={{ fontFamily: 'var(--font-jost)', fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '20px' }}>{desc}</div>
        <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--green)', color: '#fff', padding: '9px 20px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-jost)', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
          {cta}
        </Link>
      </div>
    </div>
  )
}
