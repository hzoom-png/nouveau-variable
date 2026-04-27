'use client'

import { useState, useEffect, useRef } from 'react'
import type { RepliqueScript, ScriptBlock } from '../types'

const BLOCK_STYLES: Record<string, { border: string; bg: string; labelColor: string; number: string }> = {
  hook:     { border: '#C5DDD5', bg: '#F0F7F4',   labelColor: '#2F5446', number: '#2F5446' },
  pitch:    { border: '#BFDBFE', bg: '#EFF6FF',   labelColor: '#1D4ED8', number: '#1D4ED8' },
  question: { border: '#DDD6FE', bg: '#F5F3FF',   labelColor: '#6D28D9', number: '#6D28D9' },
  barrage:  { border: '#FDE68A', bg: '#FFFBEB',   labelColor: '#92400E', number: '#92400E' },
  cta:      { border: '#C5DDD5', bg: '#2F5446',   labelColor: '#fff',    number: '#fff'    },
  rebound:  { border: '#FBD5D5', bg: '#FEF2F2',   labelColor: '#991B1B', number: '#991B1B' },
  closing:  { border: '#A7F3D0', bg: '#ECFDF5',   labelColor: '#065F46', number: '#065F46' },
  default:  { border: 'var(--border)', bg: 'var(--surface)', labelColor: 'var(--text-2)', number: 'var(--text-3)' },
}

const DIFF_STYLE: Record<string, { bg: string; color: string }> = {
  facile:    { bg: 'var(--green-3)',  color: 'var(--green)' },
  moyen:     { bg: 'var(--amber-2)', color: 'var(--amber)' },
  difficile: { bg: 'var(--red-2)',   color: 'var(--red)'   },
}

const OBJECTIVE_LABELS: Record<string, string> = {
  rdv: 'Prise de RDV', qualification: 'Qualification', barrage: 'Barrage secrétaire',
  relance: 'Relance', closing: 'Closing', cold: 'Cold Call',
}
const CONTACT_LABELS: Record<string, string> = {
  decision_maker: 'Décideur', manager: 'Manager', secretary: 'Secrétaire',
  technical: 'Profil tech', user: 'Utilisateur',
}

interface Props {
  script: RepliqueScript
  onNew: () => void
}

function BlockCard({ block, index }: { block: ScriptBlock; index: number }) {
  const styles = BLOCK_STYLES[block.type] ?? BLOCK_STYLES.default
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(block.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isCta = block.type === 'cta'

  return (
    <div style={{ border: `1.5px solid ${styles.border}`, background: styles.bg, borderRadius: 'var(--r-lg)', padding: '16px 18px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: styles.number === '#fff' ? 'rgba(255,255,255,.2)' : styles.number, display: 'grid', placeItems: 'center', fontSize: '10px', fontWeight: 800, color: isCta ? '#fff' : '#fff', flexShrink: 0 }}>
            {index + 1}
          </div>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: styles.labelColor }}>
            {block.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {block.duration && (
            <span style={{ fontSize: '10px', color: isCta ? 'rgba(255,255,255,.6)' : 'var(--text-3)', fontStyle: 'italic' }}>{block.duration}</span>
          )}
          <button onClick={copy} title="Copier" style={{ fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', color: isCta ? 'rgba(255,255,255,.7)' : 'var(--text-3)', padding: '2px' }}>
            {copied ? '✓' : '📋'}
          </button>
        </div>
      </div>
      <p style={{ fontSize: '14px', color: isCta ? '#fff' : 'var(--text)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>
        {block.content}
      </p>
      {block.tip && (
        <p style={{ fontSize: '12px', color: isCta ? 'rgba(255,255,255,.7)' : 'var(--text-3)', fontStyle: 'italic', marginTop: '10px', marginBottom: 0, lineHeight: 1.5 }}>
          💡 {block.tip}
        </p>
      )}
    </div>
  )
}

function ModeAppel({ script, onClose }: { script: RepliqueScript; onClose: () => void }) {
  const [current, setCurrent] = useState(0)
  const [showObj, setShowObj] = useState<number | null>(null)
  const touchStartX = useRef(0)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setCurrent(c => Math.min(c + 1, script.blocks.length - 1))
      if (e.key === 'ArrowLeft') setCurrent(c => Math.max(c - 1, 0))
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [script.blocks.length, onClose])

  const block = script.blocks[current]
  const isLast = current === script.blocks.length - 1

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#0F1C17', zIndex: 200, display: 'flex', flexDirection: 'column' }}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchStartX.current
        if (dx < -50) setCurrent(c => Math.min(c + 1, script.blocks.length - 1))
        if (dx > 50) setCurrent(c => Math.max(c - 1, 0))
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Mode appel</span>
        <button onClick={onClose} style={{ color: 'rgba(255,255,255,.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '16px 24px' }}>
        <button onClick={() => setCurrent(c => Math.max(c - 1, 0))} disabled={current === 0} style={{ color: current === 0 ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.7)', background: 'none', border: 'none', cursor: current === 0 ? 'default' : 'pointer', fontSize: '20px' }}>←</button>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{current + 1} / {script.blocks.length}</span>
        <button onClick={() => setCurrent(c => Math.min(c + 1, script.blocks.length - 1))} disabled={isLast} style={{ color: isLast ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.7)', background: 'none', border: 'none', cursor: isLast ? 'default' : 'pointer', fontSize: '20px' }}>→</button>
      </div>

      {/* Block */}
      <div style={{ flex: 1, padding: '0 24px 16px', overflow: 'auto' }}>
        <div style={{ background: isLast ? 'var(--green)' : 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 'var(--r-xl)', padding: '28px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: '8px' }}>{block?.label}</div>
          <p style={{ fontSize: '17px', color: '#fff', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>{block?.content}</p>
          {block?.tip && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.55)', fontStyle: 'italic', marginTop: '16px', marginBottom: 0 }}>💡 {block.tip}</p>
          )}
        </div>
      </div>

      {/* Objections rapides */}
      {script.objections.length > 0 && (
        <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,.1)', maxHeight: '200px', overflow: 'auto' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: '8px' }}>Objections rapides</div>
          {script.objections.map((o, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <button onClick={() => setShowObj(showObj === i ? null : i)} style={{ width: '100%', textAlign: 'left', background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 'var(--r-sm)', padding: '8px 12px', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,.8)', fontWeight: 600 }}>
                🗣 &ldquo;{o.objection}&rdquo;
              </button>
              {showObj === i && (
                <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,.04)', borderRadius: '0 0 var(--r-sm) var(--r-sm)', fontSize: '12px', color: 'rgba(255,255,255,.65)', lineHeight: 1.6 }}>
                  ↩ {o.rebound}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RepliqueScriptView({ script, onNew }: Props) {
  const [modeAppel, setModeAppel] = useState(false)
  const [showAllObj, setShowAllObj] = useState(false)
  const diff = DIFF_STYLE[script.difficulty] ?? DIFF_STYLE.moyen

  return (
    <>
      {modeAppel && <ModeAppel script={script} onClose={() => setModeAppel(false)} />}

      {/* Header */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
              Script {OBJECTIVE_LABELS[script.config.objective]} · {CONTACT_LABELS[script.config.contact_type]}
              {script.config.company_sector ? ` · ${script.config.company_sector}` : ''}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {script.estimated_duration && (
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: 'var(--r-full)', background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                  ⏱ {script.estimated_duration}
                </span>
              )}
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: 'var(--r-full)', background: diff.bg, color: diff.color }}>
                {script.difficulty}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={onNew} style={{ padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-2)' }}>
              Nouveau script
            </button>
            <button onClick={() => setModeAppel(true)} style={{ padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', background: '#0F1C17', border: 'none', color: '#fff' }}>
              Mode appel →
            </button>
          </div>
        </div>
      </div>

      {/* Script blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {script.blocks.map((block, i) => (
          <BlockCard key={block.id || i} block={block} index={i} />
        ))}
      </div>

      {/* Objections */}
      {script.objections.length > 0 && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px 20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Objections probables
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(showAllObj ? script.objections : script.objections.slice(0, 3)).map((o, i) => (
              <div key={i} style={{ background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: '14px 16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>🗣 &ldquo;{o.objection}&rdquo;</div>
                <div style={{ fontSize: '13px', color: 'var(--green)', lineHeight: 1.6, marginBottom: '6px' }}>↩ {o.rebound}</div>
                {o.tone_tip && <div style={{ fontSize: '11px', color: 'var(--text-3)', fontStyle: 'italic' }}>🎯 {o.tone_tip}</div>}
              </div>
            ))}
          </div>
          {script.objections.length > 3 && (
            <button onClick={() => setShowAllObj(!showAllObj)} style={{ marginTop: '10px', fontSize: '12px', fontWeight: 600, color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              {showAllObj ? 'Réduire' : `+ Voir toutes les objections (${script.objections.length})`}
            </button>
          )}
        </div>
      )}

      {/* Dos & Don'ts */}
      {(script.dos.length > 0 || script.donts.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'var(--green-3)', border: '1px solid var(--green-4)', borderRadius: 'var(--r-lg)', padding: '16px 18px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--green)', marginBottom: '10px' }}>À faire</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {script.dos.map((d, i) => (
                <div key={i} style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓ </span>{d}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--red-2)', border: '1px solid #FECACA', borderRadius: 'var(--r-lg)', padding: '16px 18px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '10px' }}>À éviter</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {script.donts.map((d, i) => (
                <div key={i} style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--red)', fontWeight: 700 }}>✗ </span>{d}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
