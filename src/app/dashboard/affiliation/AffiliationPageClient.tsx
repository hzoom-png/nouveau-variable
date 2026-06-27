'use client'

import { useState } from 'react'
import { AffiliationSimulator } from '@/components/affiliation/AffiliationSimulator'
import { AffiliationPipe } from '@/components/affiliation/AffiliationPipe'
import { CopyButton } from '@/components/ui/CopyButton'

export interface ReferralEntry {
  id: string
  level: 1 | 2 | 3
  first_name: string
  last_name: string
  is_active: boolean
  created_at: string
}

interface Props {
  n1Active: number;  n1Total: number
  n2Active: number;  n2Total: number
  n3Active: number;  n3Total: number
  n2RatePercent: number
  isN3Eligible: boolean
  n3EligibleSince: string | null
  subscriptionStart: string | null
  referralCode: string
  affiliateLink: string
  commN1: number
  commN2: number
  commN3: number
  referrals: ReferralEntry[]
}

const RESPONSIVE_CSS = `
  .aff-level-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .aff-link-qr {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 20px;
    align-items: start;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }
  .aff-summary-amount { font-size: 38px; }
  .aff-filter-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
  .aff-referral-row { display: flex; align-items: center; gap: 12px; }
  @media (max-width: 600px) {
    .aff-level-grid { grid-template-columns: 1fr; }
    .aff-summary-amount { font-size: 28px; }
    .aff-share-btn-group { flex-wrap: wrap; }
    .aff-link-qr { grid-template-columns: 1fr; }
  }
`

// ─── Primitives ───────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      style={{ flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--white)', borderRadius: 16, boxShadow: '0 1px 6px rgba(2,79,65,.07)', ...style }}>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
      {children}
    </div>
  )
}

// ─── QR Code + fullscreen overlay ────────────────────────────────────────────

function ExpandIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M9 1h5v5M6 9l8-8M1 9v5h5M9 14l-8-8"/>
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M7.5 2v8M3 9l4.5 4 4.5-4M2 13h11"/>
    </svg>
  )
}

function QRSection({ referralCode, affiliateLink }: { referralCode: string; affiliateLink: string }) {
  const [fullscreen, setFullscreen] = useState(false)
  if (!referralCode) return null

  const qrUrl = (size: number) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(affiliateLink)}`

  function handleDownload() {
    const a = document.createElement('a')
    a.href = qrUrl(600)
    a.download = `nv-affiliation-${referralCode}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <>
      <div className="aff-link-qr">
        {/* QR compact */}
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 140, height: 140, borderRadius: 12, overflow: 'hidden',
            border: '2px solid var(--border)', background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src={qrUrl(280)} alt="QR code affiliation" width={140} height={140} style={{ display: 'block' }} />
          </div>
        </div>

        {/* Info + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>QR code de parrainage</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              Montre ce QR code à quelqu&apos;un pour qu&apos;il rejoigne NV via ton lien.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setFullscreen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: '#43695A', color: 'white', border: 'none', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <ExpandIcon /> Agrandir
            </button>
            <button
              onClick={handleDownload}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: 'var(--off)', color: 'var(--text)', border: '1.5px solid var(--border)', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <DownloadIcon /> Télécharger
            </button>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#e8f5ef', borderRadius: 8, padding: '5px 10px',
            fontSize: 12, fontWeight: 700, color: '#43695A', fontFamily: 'monospace', letterSpacing: '.06em',
            alignSelf: 'flex-start',
          }}>
            {referralCode}
          </div>
        </div>
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          onClick={() => setFullscreen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
            cursor: 'pointer',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
          >
            <div style={{
              background: 'white', borderRadius: 20, padding: 20,
              boxShadow: '0 20px 60px rgba(0,0,0,.4)',
            }}>
              <img src={qrUrl(400)} alt="QR code affiliation" width={280} height={280} style={{ display: 'block' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: 13, marginBottom: 6, opacity: .7 }}>Scanner pour rejoindre Nouveau Variable</div>
              <div style={{
                background: 'rgba(255,255,255,.12)', borderRadius: 10, padding: '6px 16px',
                fontSize: 15, fontWeight: 700, color: 'white', fontFamily: 'monospace', letterSpacing: '.1em',
              }}>
                {referralCode}
              </div>
            </div>
          </div>
          <button
            onClick={() => setFullscreen(false)}
            style={{
              padding: '10px 24px', borderRadius: 30, fontSize: 13, fontWeight: 600,
              background: 'rgba(255,255,255,.15)', color: 'white', border: '1.5px solid rgba(255,255,255,.3)',
              cursor: 'pointer',
            }}
          >
            Fermer
          </button>
        </div>
      )}
    </>
  )
}

// ─── Level card ───────────────────────────────────────────────────────────────

const LEVEL_CONFIG = {
  1: { label: 'N1', color: '#43695A', bg: '#e8f5ef' },
  2: { label: 'N2', color: '#4B7BF5', bg: '#eef1fe' },
  3: { label: 'N3', color: '#C8790A', bg: '#FEF3E2' },
} as const

function LevelCard({ level, active, total, comm, rateLabel, locked }: {
  level: 1 | 2 | 3
  active: number
  total: number
  comm: number
  rateLabel: string
  locked?: boolean
}) {
  const cfg = LEVEL_CONFIG[level]
  return (
    <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: cfg.bg, color: cfg.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 13,
        }}>
          {cfg.label}
        </div>
        {locked
          ? <span style={{ fontSize: 16 }}>🔒</span>
          : <div style={{ fontSize: 17, fontWeight: 700, color: cfg.color }}>{comm > 0 ? `+${comm.toFixed(0)} €` : '—'}</div>
        }
      </div>

      {locked ? (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>Non débloqué</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>Actif après 6 mois d&apos;abonnement consécutif</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
            {active}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginLeft: 6 }}>actif{active !== 1 ? 's' : ''}</span>
          </div>
          {total > active && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
              {total - active} inactif{total - active !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)' }}>
        {locked ? `Taux : ${rateLabel}` : `Commission : ${rateLabel}`}
      </div>
    </Card>
  )
}

// ─── Network list ─────────────────────────────────────────────────────────────

function NetworkList({ referrals }: { referrals: ReferralEntry[] }) {
  const [filter, setFilter] = useState<'all' | 1 | 2 | 3>('all')
  const filtered = filter === 'all' ? referrals : referrals.filter(r => r.level === filter)

  return (
    <div>
      <div className="aff-filter-tabs" style={{ marginBottom: 14 }}>
        {(['all', 1, 2, 3] as Array<'all' | 1 | 2 | 3>).map(lvl => {
          const count = lvl === 'all' ? referrals.length : referrals.filter(r => r.level === lvl).length
          const active = filter === lvl
          const cfg = lvl !== 'all' ? LEVEL_CONFIG[lvl] : null
          return (
            <button key={String(lvl)} onClick={() => setFilter(lvl)} style={{
              padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all .15s',
              background: active ? (cfg ? cfg.bg : 'var(--off)') : 'var(--off)',
              color:      active ? (cfg ? cfg.color : 'var(--text)') : 'var(--muted)',
              outline:    active ? `1.5px solid ${cfg ? cfg.color : 'var(--border)'}` : '1.5px solid transparent',
            }}>
              {lvl === 'all' ? `Tous · ${count}` : `N${lvl} · ${count}`}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>👥</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {filter === 'all' ? 'Pas encore de filleuls' : `Aucun filleul N${filter}`}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map(r => {
          const initials = (`${r.first_name[0] ?? ''}${r.last_name[0] ?? ''}`).toUpperCase() || '?'
          const cfg = LEVEL_CONFIG[r.level]
          return (
            <div key={r.id} className="aff-referral-row" style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--off)' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: cfg.bg, color: cfg.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 12,
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.first_name} {r.last_name}
              </div>
              <div style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0, background: cfg.bg, color: cfg.color }}>
                N{r.level}
              </div>
              <div style={{
                padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, flexShrink: 0,
                background: r.is_active ? 'var(--green-pale)' : 'var(--border)',
                color:      r.is_active ? '#43695A' : 'var(--muted)',
              }}>
                {r.is_active ? '● Actif' : '○ Inactif'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Accordion ────────────────────────────────────────────────────────────────

function Accordion({ title, meta, children }: { title: string; meta?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Card style={{ overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', border: 'none', background: 'transparent', cursor: 'pointer', gap: 12, textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, overflow: 'hidden' }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', whiteSpace: 'nowrap' }}>{title}</span>
          {!open && meta && <span style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</span>}
        </div>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px 20px' }}>
          {children}
        </div>
      )}
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AffiliationPageClient({
  n1Active, n1Total,
  n2Active, n2Total,
  n3Active, n3Total,
  n2RatePercent,
  isN3Eligible,
  n3EligibleSince, subscriptionStart,
  referralCode,
  affiliateLink,
  commN1, commN2, commN3,
  referrals,
}: Props) {
  const totalComm   = commN1 + commN2 + commN3
  const totalActive = referrals.filter(r => r.is_active).length
  const totalCount  = referrals.length

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>

      <div style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── 1. Summary ── */}
        <Card style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <Label>Revenus d&apos;affiliation estimés</Label>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="aff-summary-amount" style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 700, color: '#43695A', lineHeight: 1 }}>
                  {totalComm > 0 ? `${totalComm.toFixed(0)} €` : '0 €'}
                </span>
                <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>/mois</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{totalActive}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Actifs</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{totalCount}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Filleuls</div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── 2. Affiliate link ── */}
        <Card style={{ padding: '20px 24px' }}>
          <Label>Ton lien d&apos;affiliation</Label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <div style={{
              flex: 1, minWidth: 0,
              background: 'var(--off)', border: '1.5px solid var(--border)',
              borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--text)',
              fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {affiliateLink || 'Complète ton profil pour obtenir ton code'}
            </div>
            {affiliateLink && <CopyButton text={affiliateLink} />}
          </div>
          {affiliateLink && (
            <div className="aff-share-btn-group" style={{ display: 'flex', gap: 8 }}>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(affiliateLink)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#0077B5', color: 'white', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                LinkedIn
              </a>
              <a href={`https://wa.me/?text=${encodeURIComponent('Rejoins le club Nouveau Variable : ' + affiliateLink)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#25D366', color: 'white', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                WhatsApp
              </a>
              <a href={`mailto:?subject=Rejoins Nouveau Variable&body=${encodeURIComponent('Je t\'invite à rejoindre le club : ' + affiliateLink)}`}
                style={{ padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'var(--off)', color: 'var(--text)', textDecoration: 'none', border: '1.5px solid var(--border)', whiteSpace: 'nowrap' }}>
                Email
              </a>
            </div>
          )}

          <QRSection referralCode={referralCode} affiliateLink={affiliateLink} />
        </Card>

        {/* ── 3. Level breakdown ── */}
        <div>
          <Label>Mes niveaux</Label>
          <div className="aff-level-grid">
            <LevelCard level={1} active={n1Active} total={n1Total} comm={commN1} rateLabel="30% du HT" />
            <LevelCard level={2} active={n2Active} total={n2Total} comm={commN2} rateLabel={`${n2RatePercent}% du HT`} />
            <LevelCard level={3} active={n3Active} total={n3Total} comm={commN3} rateLabel="5% du HT" locked={!isN3Eligible} />
          </div>
        </div>

        {/* ── 4. Network list ── */}
        <Card style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Label>Mon réseau</Label>
            {totalCount > 0 && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                {totalCount} membre{totalCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <NetworkList referrals={referrals} />
        </Card>

        {/* ── 5. Pipeline ── */}
        <Accordion title="Pipeline d'affiliation" meta="Prospects en cours">
          <AffiliationPipe embedded />
        </Accordion>

        {/* ── 6. Simulator ── */}
        <Accordion title="Simule tes gains" meta={`~${Math.round(totalComm)} €/mois actuel`}>
          <AffiliationSimulator
            n1Actifs={n1Active}
            n3Actifs={n3Active}
            isN3Eligible={isN3Eligible}
            n3EligibleSince={n3EligibleSince}
            subscriptionStart={subscriptionStart}
            embedded
          />
        </Accordion>

      </div>
    </>
  )
}
