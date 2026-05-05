'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminHeader } from '../_components/AdminHeader'

const C = {
  bg:     '#0F1C17',
  card:   '#1A2820',
  border: 'rgba(255,255,255,0.07)',
  green:  '#2F5446',
  greenL: '#4A8C6F',
  amber:  '#C8790A',
  text:   '#F7FAF8',
  text2:  '#4B6358',
  input:  '#111D18',
}

type Affiliate = {
  id: string
  first_name: string
  last_name: string
  email: string
  referral_code: string | null
  active_referrals: number
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

const BASE_URL = 'https://nouveauvariable.fr'

export default function AffiliationsPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [copied, setCopied]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/admin/affiliations/list')
    const d = await r.json()
    setAffiliates(d.affiliates ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function copyLink(code: string) {
    const link = `${BASE_URL}?ref=${code}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(code)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const filtered = affiliates.filter(a => {
    const q = search.toLowerCase()
    if (!q) return true
    return `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) || (a.email ?? '').toLowerCase().includes(q)
  })

  const totalActif = affiliates.reduce((s, a) => s + a.active_referrals, 0)
  const bestAffiliate = [...affiliates].sort((a, b) => b.active_referrals - a.active_referrals)[0]

  const inputSt: React.CSSProperties = {
    background: C.input, border: `1px solid rgba(255,255,255,0.1)`,
    borderRadius: 8, padding: '9px 12px', fontSize: 13,
    color: C.text, fontFamily: 'Inter, sans-serif', outline: 'none',
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: C.bg }}>
        <AdminHeader title="Affiliations" />
        <div style={{ padding: 40, color: C.text2 }}>Chargement…</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: C.bg }}>
      <AdminHeader title="Affiliations" subtitle={`${affiliates.filter(a => a.referral_code).length} membres affiliés`} />

      <div style={{ padding: '28px 40px', maxWidth: 1100 }}>
        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              Membres parrainés actifs
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: C.text }}>{totalActif}</p>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              Meilleur parrain
            </p>
            {bestAffiliate && bestAffiliate.active_referrals > 0 ? (
              <>
                <p style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{bestAffiliate.first_name} {bestAffiliate.last_name}</p>
                <p style={{ fontSize: 12, color: C.greenL, marginTop: 2 }}>{bestAffiliate.active_referrals} filleul{bestAffiliate.active_referrals > 1 ? 's' : ''}</p>
              </>
            ) : (
              <p style={{ fontSize: 16, fontWeight: 800, color: C.text2 }}>—</p>
            )}
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              Affiliés avec code actif
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: C.text }}>
              {affiliates.filter(a => a.referral_code).length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            style={{ ...inputSt, minWidth: 260 }}
            placeholder="Rechercher un membre…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.text2 }}>Aucun affilié</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Membre', 'Code parrain', 'Lien complet', 'Parrainés N1', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px 20px' }}>
                      <p style={{ fontWeight: 600, color: C.text }}>{a.first_name} {a.last_name}</p>
                      <p style={{ fontSize: 11, color: C.text2 }}>{a.email}</p>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      {a.referral_code ? (
                        <span style={{ fontFamily: 'monospace', fontSize: 13, color: C.greenL, background: 'rgba(47,84,70,0.15)', padding: '3px 8px', borderRadius: 6 }}>
                          {a.referral_code}
                        </span>
                      ) : (
                        <span style={{ color: C.text2 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      {a.referral_code ? (
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.text2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {BASE_URL}?ref={a.referral_code}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: a.active_referrals > 0 ? C.greenL : C.text2 }}>
                        {a.active_referrals}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      {a.referral_code && (
                        <button
                          onClick={() => copyLink(a.referral_code!)}
                          style={{
                            padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: copied === a.referral_code ? 'rgba(47,84,70,0.3)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${copied === a.referral_code ? C.green : 'rgba(255,255,255,0.1)'}`,
                            color: copied === a.referral_code ? C.greenL : C.text2,
                            fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                            transition: 'all .15s',
                          }}
                        >
                          {copied === a.referral_code ? '✓ Copié !' : 'Copier le lien'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
