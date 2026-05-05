'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminHeader } from '../_components/AdminHeader'

const C = {
  card:   '#1A2820',
  border: 'rgba(255,255,255,0.07)',
  green:  '#2F5446',
  greenL: '#4A8C6F',
  text:   '#F7FAF8',
  text2:  '#4B6358',
  input:  '#111D18',
}

type Row = {
  id: string
  user_id: string
  tool_name: string
  tokens_used: number
  created_at: string
  profiles: { first_name: string; last_name: string; email: string } | null
}

type Data = {
  activity: Row[]
  total: number
  topTool: string
  topMember: string
  totalTokens: number
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ActivitePage() {
  const [data, setData]     = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')
  const [tool, setTool]     = useState('')
  const [tools, setTools]   = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ period })
    if (tool) params.set('tool', tool)
    const r = await fetch(`/api/admin/activity?${params}`)
    const d = await r.json()
    setData(d)
    if (!tool) {
      const t = Array.from(new Set((d.activity ?? []).map((r: Row) => r.tool_name))) as string[]
      setTools(t)
    }
    setLoading(false)
  }, [period, tool])

  useEffect(() => { load() }, [load])

  const inputSt: React.CSSProperties = {
    background: C.input, border: `1px solid rgba(255,255,255,0.1)`,
    borderRadius: 8, padding: '8px 12px', fontSize: 12,
    color: C.text, fontFamily: 'Inter, sans-serif', outline: 'none',
  }

  const btnSm = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: active ? 700 : 400,
    background: active ? 'rgba(47,84,70,0.25)' : 'transparent',
    border: `1px solid ${active ? C.green : 'rgba(255,255,255,0.1)'}`,
    color: active ? C.text : C.text2, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0F1C17' }}>
      <AdminHeader title="Activité" />
      <div style={{ padding: '28px 40px', maxWidth: 1100 }}>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['today', '7d', '30d'] as const).map(p => (
          <button key={p} style={btnSm(period === p)} onClick={() => setPeriod(p)}>
            {p === 'today' ? "Aujourd'hui" : p === '7d' ? '7 jours' : '30 jours'}
          </button>
        ))}
        <select value={tool} onChange={e => setTool(e.target.value)} style={{ ...inputSt, minWidth: 160 }}>
          <option value="">Tous les outils</option>
          {tools.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Stats */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            ['Utilisations', String(data.total)],
            ['Tokens consommés', String(data.totalTokens)],
            ['Outil le plus utilisé', data.topTool ?? '—'],
            ['Membre le plus actif', data.topMember ?? '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, color: C.text2, textAlign: 'center' }}>Chargement…</div>
        ) : !data?.activity.length ? (
          <div style={{ padding: 40, color: C.text2, textAlign: 'center' }}>Aucune activité</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Membre', 'Outil', 'Tokens', 'Date'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.text2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.activity.map(row => (
                <tr key={row.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '10px 20px' }}>
                    {row.profiles ? (
                      <>
                        <p style={{ color: C.text, fontWeight: 500 }}>{row.profiles.first_name} {row.profiles.last_name}</p>
                        <p style={{ fontSize: 11, color: C.text2 }}>{row.profiles.email}</p>
                      </>
                    ) : (
                      <p style={{ color: C.text2, fontFamily: 'monospace', fontSize: 11 }}>{row.user_id.slice(0, 8)}…</p>
                    )}
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ fontSize: 12, background: 'rgba(47,84,70,0.15)', borderRadius: 6, padding: '3px 8px', color: C.greenL }}>
                      {row.tool_name}
                    </span>
                  </td>
                  <td style={{ padding: '10px 20px', color: C.text, fontWeight: 600 }}>{row.tokens_used}</td>
                  <td style={{ padding: '10px 20px', color: C.text2, fontSize: 12 }}>{fmtDate(row.created_at)}</td>
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
