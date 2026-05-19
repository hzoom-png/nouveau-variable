'use client'

import { useRef } from 'react'
import { motion, useTransform, MotionValue } from 'framer-motion'
import { useScrollProgress } from './hooks/useScrollHijack'
import { GraphCurves } from './components/GraphCurves'
import { ContentPoints } from './components/ContentPoints'
import { T } from './constants'

interface DesktopProps {
  isMobile?: boolean
}

export function Desktop({ isMobile = false }: DesktopProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const progress = useScrollProgress(containerRef)

  // ── Spatial / zoom ──────────────────────────────────────────────
  // Mobile: zoom initial réduit (2.2x vs 3.0x) pour mieux tenir sur petit écran
  const scaleOut = isMobile
    ? [2.2, 1.9, 1.2, 1.2, 1.45, 1.2]
    : [3.0, 2.6, 1.5, 1.5, 1.85, 1.5]
  const scale = useTransform(progress,
    [0, 0.12, 0.28, 0.52, 0.62, 1.0],
    scaleOut,
  )

  const originX = useTransform(progress, [0, 0.28, 0.52, 0.62], [0.09, 0.50, 0.50, 0.68])
  const originY = useTransform(progress, [0, 0.28, 0.52, 0.62], [0.88, 0.50, 0.50, 0.20])

  // ── Background ──────────────────────────────────────────────────
  const bgOpacity = useTransform(progress, [...T.bgIn], [0, 1])

  // ── Graph elements ──────────────────────────────────────────────
  const gridOpacity   = useTransform(progress, [...T.gridIn], [0, 0.45])
  const axesOpacity   = useTransform(progress, [...T.axesIn], [0, 1])
  const grayOpacity   = useTransform(progress,
    [...T.grayIn, ...T.grayOut], [0, 0.6, 0.6, 0],
  )
  const grayDraw      = useTransform(progress, [...T.grayDraw], [0, 1])
  const greenDraw     = useTransform(progress, [...T.greenDraw], [0, 1])
  // Mobile: glow réduit (8px max vs 20px) pour CPU mobile
  const glowOut = isMobile ? [0, 5, 8, 8, 4] : [0, 10, 20, 20, 8]
  const glowIntensity = useTransform(progress,
    [...T.glowUp, ...T.glowMax, 1.0],
    glowOut,
  )

  // ── Section label ───────────────────────────────────────────────
  const labelOpacity = useTransform(progress, [0, 0.10, 0.45, 0.58], [0, 1, 1, 0])

  // ── Content points — 10% chacun = ~1500ms ───────────────────────
  const p0op = useTransform(progress, [0.60, 0.62, 0.65, 0.68, 0.70], [0, 1, 1, 1, 0])
  const p1op = useTransform(progress, [0.70, 0.72, 0.75, 0.78, 0.80], [0, 1, 1, 1, 0])
  const p2op = useTransform(progress, [0.80, 0.82, 0.85, 0.88, 0.90], [0, 1, 1, 1, 0])
  const p3op = useTransform(progress, [0.90, 0.92, 0.95, 0.98, 1.00], [0, 1, 1, 1, 0])
  const pointOpacities: MotionValue<number>[] = [p0op, p1op, p2op, p3op]

  return (
    // 400vh outer container — the sticky inner div plays through it
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

        {/* White background fade in */}
        <motion.div style={{
          position: 'absolute', inset: 0,
          background: '#ffffff',
          opacity: bgOpacity,
        }} />

        {/* Section label */}
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

        {/* ── SVG graph container (scaled + origin animated) ────── */}
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
        }}>
          <div style={{
            width: isMobile ? '100%' : '90vw',
            maxWidth: isMobile ? 480 : 800,
            padding: isMobile ? '0 12px' : 0,
            aspectRatio: '2 / 1',
          }}>
            <GraphCurves
              grayOpacity={grayOpacity}
              grayDraw={grayDraw}
              greenDraw={greenDraw}
              glowIntensity={glowIntensity}
              gridOpacity={gridOpacity}
              axesOpacity={axesOpacity}
            />
          </div>
        </motion.div>

        {/* ── Content points ───────────────────────────────────────
            Desktop : à droite du graphe
            Mobile  : overlaid en bas (centré, pleine largeur)        */}
        <ContentPoints
          opacities={pointOpacities}
          position={isMobile ? 'bottom' : 'right'}
        />

      </div>
    </div>
  )
}
