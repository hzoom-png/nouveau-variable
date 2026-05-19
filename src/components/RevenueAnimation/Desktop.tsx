'use client'

import { useRef } from 'react'
import { motion, useTransform, MotionValue, useMotionValueEvent } from 'framer-motion'
import { useScrollProgress } from './hooks/useScrollHijack'
import { GraphCurves } from './components/GraphCurves'
import { ContentPoints } from './components/ContentPoints'
import { T, GREEN_DATA, SVG_W, SVG_H, toX, toY } from './constants'

interface DesktopProps {
  isMobile?: boolean
}

export function Desktop({ isMobile = false }: DesktopProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const progress = useScrollProgress(containerRef)

  // ── Spatial / zoom ──────────────────────────────────────────────
  const scaleOut = isMobile
    ? [2.2, 1.9, 1.2, 1.2, 1.0, 1.0]
    : [3.0, 2.6, 1.5, 1.5, 1.0, 1.0]
  const scale = useTransform(progress,
    [0, 0.12, 0.28, 0.52, 0.62, 1.0],
    scaleOut,
  )
  const originX = useTransform(progress, [0, 0.28, 0.52, 0.62], [0.09, 0.50, 0.50, 0.68])
  const originY = useTransform(progress, [0, 0.28, 0.52, 0.62], [0.88, 0.50, 0.50, 0.20])

  // ── Background ──────────────────────────────────────────────────
  const bgOpacity = useTransform(progress, [...T.bgIn], [0, 1])

  // ── Graph elements ──────────────────────────────────────────────
  const gridOpacity    = useTransform(progress, [...T.gridIn], [0, 0.45])
  const axesOpacity    = useTransform(progress, [...T.axesIn], [0, 1])
  const grayOpacity    = useTransform(progress,
    [...T.grayIn, ...T.grayOut], [0, 0.6, 0.6, 0],
  )
  const grayDraw       = useTransform(progress, [...T.grayDraw], [0, 1])
  const greenDraw      = useTransform(progress, [...T.greenDraw], [0, 1])
  const glowIntensity  = useTransform(progress,
    [0.38, 0.52, 0.54, 1.0],
    isMobile ? [0, 8, 8, 4] : [0, 20, 20, 8],
  )

  // ── Graph container fade-out (whole graph disappears before content points) ──
  const graphContainerOpacity = useTransform(progress, [...T.graphOut], [1, 0])

  // ── Section label ───────────────────────────────────────────────
  const labelOpacity = useTransform(progress, [0, 0.10, 0.42, 0.50], [0, 1, 1, 0])

  // ── Dynamic counter (direct DOM — no re-render) ─────────────────
  const counterRef = useRef<HTMLDivElement>(null)
  useMotionValueEvent(progress, 'change', (p) => {
    const el = counterRef.current
    if (!el) return

    // Appear when green tip reaches ~2600€ (month 3, progress ~0.36)
    // Fade out with graph at T.graphOut start
    let opacity = 0
    if      (p >= 0.35 && p < 0.39) opacity = (p - 0.35) / 0.04
    else if (p >= 0.39 && p < 0.51) opacity = 1
    else if (p >= 0.51 && p < 0.55) opacity = 1 - (p - 0.51) / 0.04

    if (opacity <= 0) { el.style.opacity = '0'; return }

    // Interpolate GREEN_DATA along drawing progress (new range 0.30→0.54)
    const drawFrac = Math.max(0, Math.min(1, (p - 0.30) / (0.54 - 0.30)))
    const month    = drawFrac * 12
    const idx      = Math.min(Math.floor(month), GREEN_DATA.length - 2)
    const frac     = month - idx
    const gv       = GREEN_DATA[idx].v + frac * (GREEN_DATA[idx + 1].v - GREEN_DATA[idx].v)

    // Tip X+Y in % of SVG container (clamped to stay visible)
    const xPct = Math.max(8, Math.min(90, (toX(month) / SVG_W) * 100))
    const yPct = Math.max(8, Math.min(85, (toY(gv)   / SVG_H) * 100))

    el.style.opacity = String(opacity)
    el.style.left    = xPct + '%'
    el.style.top     = yPct + '%'
    el.textContent   = Math.round(gv).toLocaleString('fr-FR') + ' €'
  })

  // ── Content points — 4 × 10% = 40% of scroll, each centered ────
  const p0op = useTransform(progress, [0.62, 0.65, 0.68, 0.70], [0, 1, 1, 0])
  const p1op = useTransform(progress, [0.70, 0.73, 0.78, 0.80], [0, 1, 1, 0])
  const p2op = useTransform(progress, [0.80, 0.83, 0.88, 0.90], [0, 1, 1, 0])
  const p3op = useTransform(progress, [0.90, 0.93, 0.98, 1.00], [0, 1, 1, 0])
  const pointOpacities: MotionValue<number>[] = [p0op, p1op, p2op, p3op]

  return (
    <div
      ref={containerRef}
      style={{ height: '400vh', position: 'relative' }}
      aria-hidden="true"
    >
      {/* ── Sticky viewport ─────────────────────────────────────── */}
      <div style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>

        {/* White background */}
        <motion.div style={{
          position: 'absolute', inset: 0,
          background: '#ffffff',
          opacity: bgOpacity,
        }} />

        {/* Section label — fades before graph disappears */}
        <motion.div style={{
          position: 'absolute',
          top: isMobile ? 20 : 40,
          left: 0, right: 0,
          textAlign: 'center',
          opacity: labelOpacity,
          pointerEvents: 'none',
          zIndex: 2,
        }}>
          <p style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: isMobile ? 9 : 11,
            fontWeight: 700,
            letterSpacing: '.10em',
            textTransform: 'uppercase',
            color: '#9BB5AA',
            margin: 0,
            padding: '0 16px',
          }}>
            Comment NV génère des revenus supplémentaires
          </p>
        </motion.div>

        {/* ── SVG graph container — fades out entirely at graphOut ── */}
        <motion.div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          scale,
          originX,
          originY,
          willChange: 'transform',
          opacity: graphContainerOpacity,
        }}>
          <div style={{
            width: isMobile ? '100%' : '90vw',
            maxWidth: isMobile ? 480 : 800,
            padding: isMobile ? '0 12px' : 0,
            aspectRatio: '2 / 1',
            position: 'relative',
          }}>
            <GraphCurves
              grayOpacity={grayOpacity}
              grayDraw={grayDraw}
              greenDraw={greenDraw}
              glowIntensity={glowIntensity}
              gridOpacity={gridOpacity}
              axesOpacity={axesOpacity}
            />
            {/* Dynamic counter — follows green curve tip */}
            <div
              ref={counterRef}
              style={{
                position: 'absolute',
                left: '8%',
                top: '82%',
                transform: 'translate(-50%, -130%)',
                opacity: 0,
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: isMobile ? 12 : 16,
                fontWeight: 700,
                color: '#36a64f',
                letterSpacing: '.02em',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                textShadow: '0 0 8px #fff, 0 0 14px #fff, 0 1px 3px rgba(0,0,0,0.12)',
                zIndex: 4,
              }}
            />
          </div>
        </motion.div>

        {/* ── Content points — centered, one at a time ─────────────
            Graph is already gone (graphOut) when these appear       */}
        <ContentPoints
          opacities={pointOpacities}
          position="center"
          isMobile={isMobile}
        />

      </div>
    </div>
  )
}
