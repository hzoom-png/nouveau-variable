'use client'

import { motion, MotionValue, useMotionTemplate } from 'framer-motion'
import {
  SVG_W, SVG_H,
  COLORS, GRAY_PATH, GREEN_PATH,
} from '../constants'
import { Grid } from './Grid'

interface GraphCurvesProps {
  grayOpacity:  MotionValue<number>
  grayDraw:     MotionValue<number>   // 0→1 pathLength (progressive reveal)
  greenDraw:    MotionValue<number>   // 0→1 pathLength
  glowIntensity: MotionValue<number>  // 0→20px blur
  gridOpacity:  MotionValue<number>
  axesOpacity:  MotionValue<number>
}

export function GraphCurves({
  grayOpacity,
  grayDraw,
  greenDraw,
  glowIntensity,
  gridOpacity,
  axesOpacity,
}: GraphCurvesProps) {
  // Neon glow: layered drop-shadow driven by glowIntensity
  const glowFilter = useMotionTemplate`drop-shadow(0 0 ${glowIntensity}px rgba(54,166,79,.85)) drop-shadow(0 0 ${glowIntensity}px rgba(54,166,79,.45))`

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      width="100%"
      height="100%"
      style={{ overflow: 'visible' }}
    >
      {/* Grid + axes */}
      <Grid gridOpacity={gridOpacity} axesOpacity={axesOpacity} />

      {/* Gray curve — flat rémunération actuelle (dessinée progressivement) */}
      <motion.path
        d={GRAY_PATH}
        stroke={COLORS.gray}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{ opacity: grayOpacity, pathLength: grayDraw }}
      />

      {/* Gray label */}
      <motion.text
        x={SVG_W - 30}
        y={345}
        fontFamily="Inter, system-ui, sans-serif"
        fontSize={10}
        fill={COLORS.gray}
        textAnchor="end"
        style={{ opacity: grayOpacity }}
      >
        Sans NV
      </motion.text>

      {/* Green curve — avec NV (pathLength draws progressively) */}
      <motion.g style={{ filter: glowFilter }}>
        {/* Thick outer glow pass */}
        <motion.path
          d={GREEN_PATH}
          stroke={COLORS.green}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeOpacity={0.2}
          style={{ pathLength: greenDraw }}
        />
        {/* Main stroke */}
        <motion.path
          d={GREEN_PATH}
          stroke={COLORS.green}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{ pathLength: greenDraw }}
        />
      </motion.g>
    </svg>
  )
}
