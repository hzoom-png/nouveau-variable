'use client'

import { useState, useRef } from 'react'

const FORMATS = ['LinkedIn', 'Article blog', 'Newsletter', 'Thread X', 'Vidéo script', 'Carrousel']
const GOALS = ['Visibilité & autorité', 'Génération de leads', 'Recrutement', 'Personal branding']

type Publication = { id: number; platform: string; format: string; theme: string; content: string; hashtags: string[]; best_day: string; best_time: string }
type CalendarEntry = { week: number; day: string; date_label: string; platform: string; theme: string; preview: string }
type CorpusResult = { publications: Publication[]; calendar: CalendarEntry[]; ideas_visuels: { concept: string; format: string }[] }

export default function CorpusPage() {
  const [text, setText] = useState('')
  const [form, setForm] = useState({ activity: '', audience: '', goal: '', formats: [] as string[] })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CorpusResult | null>(null)
  const [activeTab, setActiveTab] = useState<'publications' | 'calendar' | 'visuels'>('publications')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editedContents, setEditedContents] = useState<Record<number, string>>({})
  const dropRef = useRef<HTMLDivElement>(null)

  function toggleFormat(f: string) {
    setForm(fm => fm.formats.includes(f)
      ? { ...fm, formats: fm.formats.filter(x => x !== f) }
      : { ...fm, formats: [...fm.formats, f] }
    )
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setText(ev.target?.result as string)
    reader.readAsText(file)
    if (dropRef.current) dropRef.current.classList.add('has-content')
  }

  async function generate() {
    if (!text && !form.activity) { setError('Ajoute du contenu ou précise ton activité'); return }
    setError('')
    setLoading(true)
    setResult(null)

    const res = await fetch('/api/ai/corpus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, ...form }),
    })

    setLoading(false)
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Erreur'); return }
    const data = await res.json()
    setResult(data.result)
  }

  function copyPost(pub: Publication) {
    const content = editedContents[pub.id] ?? pub.content
    navigator.clipboard.writeText(content + '\n\n' + pub.hashtags.join(' '))
    setCopied(pub.id)
    setTimeout(() => setCopied(null), 2000)
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 13px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: '13px', color: 'var(--text)', background: 'var(--white)', outline: 'none', fontFamily: 'inherit' }
  const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--text-2)', letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '4px 12px', borderRadius: 'var(--r-full)', background: '#F0EDFF', border: '1px solid #D4C8FF', fontSize: '11px', fontWeight: 700, color: '#7C5CBF', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
          IA · Plan éditorial
        </div>
        <div style={{ fontFamily: 'var(--font-jost)', fontSize: '28px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em', marginBottom: '8px' }}>Corpus</div>
        <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, maxWidth: '560px' }}>
          Donne-nous ta matière brute ou décris ton expertise. On génère 10 publications prêtes à publier, un calendrier 4 semaines et des idées de visuels.
        </div>
      </div>

      {!result ? (
        <div>
          {/* Drop zone */}
          <div
            ref={dropRef}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            style={{ border: '2px dashed var(--border-2)', borderRadius: 'var(--r-lg)', padding: '36px 24px', textAlign: 'center', cursor: 'pointer', background: 'var(--white)', marginBottom: '18px', transition: '.2s' }}
          >
            <div style={{ width: '44px', height: '44px', background: 'var(--green-3)', borderRadius: 'var(--r-md)', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--green)" strokeWidth="1.6"><path d="M10 13V4M7 7l3-3 3 3"/><path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2"/></svg>
            </div>
            <div style={{ fontFamily: 'var(--font-jost)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Glisse un fichier ici</div>
            <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '16px' }}>TXT, DOCX, PDF — ou colle ton texte ci-dessous</div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {['TXT', 'DOCX', 'PDF', 'Copier-coller'].map(t => (
                <span key={t} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '5px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' }}>{t}</span>
              ))}
            </div>
          </div>

          <textarea
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, marginBottom: '18px' }}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Ou colle directement ton texte, tes notes, tes idées..."
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div><label style={labelStyle}>Ton activité / expertise</label><input style={inputStyle} value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))} placeholder="Ex: Commercial BtoB SaaS senior" /></div>
            <div><label style={labelStyle}>Ton audience cible</label><input style={inputStyle} value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} placeholder="Ex: DSI et directeurs commerciaux" /></div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Objectif principal</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {GOALS.map(g => (
                <button key={g} onClick={() => setForm(f => ({ ...f, goal: g }))} style={{ padding: '6px 13px', borderRadius: 'var(--r-full)', fontSize: '12px', fontWeight: form.goal === g ? 600 : 500, border: `1.5px solid ${form.goal === g ? 'var(--green)' : 'var(--border)'}`, color: form.goal === g ? 'var(--green)' : 'var(--text-2)', background: form.goal === g ? 'var(--green-3)' : 'var(--white)', cursor: 'pointer', transition: '.14s' }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Formats souhaités</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {FORMATS.map(f => (
                <button key={f} onClick={() => toggleFormat(f)} style={{ padding: '6px 13px', borderRadius: 'var(--r-full)', fontSize: '12px', fontWeight: form.formats.includes(f) ? 600 : 500, border: `1.5px solid ${form.formats.includes(f) ? 'var(--green)' : 'var(--border)'}`, color: form.formats.includes(f) ? 'var(--green)' : 'var(--text-2)', background: form.formats.includes(f) ? 'var(--green-3)' : 'var(--white)', cursor: 'pointer', transition: '.14s' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ color: 'var(--red)', fontSize: '13px', background: 'var(--red-2)', padding: '10px 14px', borderRadius: 'var(--r-sm)', marginBottom: '12px' }}>{error}</div>}

          <button onClick={generate} disabled={loading} style={{ background: loading ? 'var(--green-4)' : 'var(--green)', color: '#fff', padding: '12px 28px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-jost)', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Génération...</> : '✦ Générer le plan éditorial'}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontFamily: 'var(--font-jost)', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Plan éditorial généré ✦</div>
            <button onClick={() => setResult(null)} style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>← Nouveau corpus</button>
          </div>

          {/* Tabs */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              {([['publications', 'Publications'], ['calendar', 'Calendrier'], ['visuels', 'Idées visuels']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '12px 18px', fontSize: '13px', fontWeight: 600, color: activeTab === id ? 'var(--green)' : 'var(--text-2)', cursor: 'pointer', marginBottom: '-1px', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === id ? 'var(--green)' : 'transparent'}` }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ padding: '18px 20px' }}>
              {/* Publications */}
              {activeTab === 'publications' && (
                <div>
                  {result.publications?.map(pub => (
                    <div key={pub.id} style={{ background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: '16px', marginBottom: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{pub.platform} · {pub.format}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{pub.best_day} {pub.best_time}</span>
                      </div>
                      {editingId === pub.id ? (
                        <textarea
                          rows={6}
                          style={{ width: '100%', padding: '8px 12px', border: '1.5px solid var(--green)', borderRadius: 'var(--r-sm)', fontSize: '13px', fontFamily: 'inherit', lineHeight: 1.65, resize: 'vertical', marginBottom: '10px' }}
                          value={editedContents[pub.id] ?? pub.content}
                          onChange={e => setEditedContents(c => ({ ...c, [pub.id]: e.target.value }))}
                        />
                      ) : (
                        <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.65, marginBottom: '10px', whiteSpace: 'pre-line' }}>
                          {editedContents[pub.id] ?? pub.content}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: 'var(--green)', marginBottom: '10px' }}>{pub.hashtags?.join(' ')}</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => copyPost(pub)} style={{ background: 'var(--white)', border: '1px solid var(--border)', color: 'var(--text-2)', padding: '5px 12px', borderRadius: 'var(--r-sm)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                          {copied === pub.id ? '✓ Copié' : 'Copier'}
                        </button>
                        <button onClick={() => setEditingId(editingId === pub.id ? null : pub.id)} style={{ background: 'var(--white)', border: '1px solid var(--border)', color: 'var(--text-2)', padding: '5px 12px', borderRadius: 'var(--r-sm)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                          {editingId === pub.id ? 'Terminer' : 'Modifier'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Calendar */}
              {activeTab === 'calendar' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {result.calendar?.map((c, i) => (
                    <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '11px', cursor: 'pointer' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '.07em' }}>{c.date_label} · {c.day}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)', marginBottom: '5px' }}>{c.platform}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.preview}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Visuels */}
              {activeTab === 'visuels' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.ideas_visuels?.map((v, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--surface)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                      <div style={{ width: '32px', height: '32px', background: '#F0EDFF', borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: '14px' }}>🎨</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{v.concept}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{v.format}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
