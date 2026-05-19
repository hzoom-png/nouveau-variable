'use client'

import { useRef } from 'react'
import { motion, useTransform, MotionValue } from 'framer-motion'
import { useScrollProgress } from './hooks/useScrollHijack'
import { GraphCurves } from './components/GraphCurves'
import { ContentPoints } from './components/ContentPoints'
import { T } from './constants'

export function Desktop() {
  const containerRef = useRef<HTMLDivElement>(null)
  const progress = useScrollProgress(containerRef)

  // ── Spatial / zoom ──────────────────────────────────────────────
  const scale = useTransform(progress,
    [0, 0.12, 0.30, 0.60, 0.72, 1.0],
    [3.0, 2.6, 1.5, 1.5, 1.85, 1.5],
  )

  // Origin: bottom-left → center → upper-right (0–1 fractions for Framer Motion)
  const originX = useTransform(progress, [0, 0.30, 0.60, 0.72], [0.09, 0.50, 0.50, 0.68])
  const originY = useTransform(progress, [0, 0.30, 0.60, 0.72], [0.88, 0.50, 0.50, 0.20])

  // ── Background ──────────────────────────────────────────────────
  const bgOpacity = useTransform(progress, [...T.bgIn], [0, 1])

  // ── Graph elements ──────────────────────────────────────────────
  const gridOpacity   = useTransform(progress, [...T.gridIn], [0, 0.45])
  const axesOpacity   = useTransform(progress, [...T.axesIn], [0, 1])
  const grayOpacity   = useTransform(progress,
    [...T.grayIn, ...T.grayOut], [0, 0.6, 0.6, 0],
  )
  const greenDraw     = useTransform(progress, [...T.greenDraw], [0, 1])
  const glowIntensity = useTransform(progress,
    [...T.glowUp, ...T.glowMax, 0.85],
    [0, 10, 20, 20, 12],
  )

  // ── Section label ───────────────────────────────────────────────
  const labelOpacity = useTransform(progress, [0, 0.12, 0.55, 0.70], [0, 1, 1, 0])

  // ── Content points — explicit calls to satisfy Rules of Hooks ───
  // Ranges mirror CONTENT_POINTS: [0.72,0.84] [0.84,0.91] [0.91,0.96] [0.96,1.00]
  const p0op = useTransform(progress, [0.72, 0.76, 0.78, 0.82, 0.84], [0, 1, 1, 1, 0])
  const p1op = useTransform(progress, [0.84, 0.86, 0.875, 0.89, 0.91], [0, 1, 1, 1, 0])
  const p2op = useTransform(progress, [0.91, 0.93, 0.935, 0.94, 0.96], [0, 1, 1, 1, 0])
  const p3op = useTransform(progress, [0.96, 0.975, 0.98, 0.99, 1.00], [0, 1, 1, 1, 0])
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
          top: 40,
          left: 0, right: 0,
          textAlign: 'center',
          opacity: labelOpacity,
          pointerEvents: 'none',
          zIndex: 2,
        }}>
          <p style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: '#9BB5AA',
            margin: 0,
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
            width: '90vw',
            maxWidth: 800,
            aspectRatio: '2 / 1',
          }}>
            <GraphCurves
              grayOpacity={grayOpacity}
              greenDraw={greenDraw}
              glowIntensity={glowIntensity}
              gridOpacity={gridOpacity}
              axesOpacity={axesOpacity}
            />
          </div>
        </motion.div>

        {/* ── Content points (staggered fade) ─────────────────── */}
        <ContentPoints opacities={pointOpacities} />

      </div>
    </div>
  )
}
