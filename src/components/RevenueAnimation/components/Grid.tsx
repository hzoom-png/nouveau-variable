'use client'

import { motion, MotionValue } from 'framer-motion'
import { SVG_W, SVG_H, PAD, COLORS, toX, toY, X_LABELS, Y_LABELS } from '../constants'

interface GridProps {
  gridOpacity:  MotionValue<number>
  axesOpacity:  MotionValue<number>
}

export function Grid({ gridOpacity, axesOpacity }: GridProps) {
  return (
    <>
      {/* Horizontal gridlines at Y label positions */}
      <motion.g style={{ opacity: gridOpacity }}>
        {Y_LABELS.map(({ v }) => {
          const y = toY(v)
          return (
            <line
              key={v}
              x1={PAD.l} y1={y}
              x2={SVG_W - PAD.r} y2={y}
              stroke={COLORS.grid}
              strokeWidth={1}
            />
          )
        })}
        {/* Vertical gridlines at X label positions */}
        {X_LABELS.map(({ m }) => {
          const x = toX(m)
          return (
            <line
              key={m}
              x1={x} y1={PAD.t}
              x2={x} y2={SVG_H - PAD.b}
              stroke={COLORS.grid}
              strokeWidth={1}
            />
          )
        })}
        {/* Baseline */}
        <line
          x1={PAD.l} y1={SVG_H - PAD.b}
          x2={SVG_W - PAD.r} y2={SVG_H - PAD.b}
          stroke={COLORS.grid}
          strokeWidth={1.5}
        />
        <line
          x1={PAD.l} y1={PAD.t}
          x2={PAD.l} y2={SVG_H - PAD.b}
          stroke={COLORS.grid}
          strokeWidth={1.5}
        />
      </motion.g>

      {/* Axis labels */}
      <motion.g style={{ opacity: axesOpacity }} fontFamily="Inter, system-ui, sans-serif" fontSize={11} fill={COLORS.axis}>
        {X_LABELS.map(({ m, label }) => (
          <text key={m} x={toX(m)} y={SVG_H - PAD.b + 16} textAnchor="middle">{label}</text>
        ))}
        {Y_LABELS.map(({ v, label }) => (
          <text key={v} x={PAD.l - 6} y={toY(v) + 4} textAnchor="end">{label}</text>
        ))}
      </motion.g>
    </>
  )
}
