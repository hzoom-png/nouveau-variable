'use client'

import { RefObject } from 'react'
import { useScroll, MotionValue } from 'framer-motion'

// Returns a 0→1 MotionValue as the containerRef scrolls through the viewport.
// Uses Framer Motion's useScroll (sticky-friendly, no wheel capture needed).
export function useScrollProgress(
  containerRef: RefObject<HTMLElement | null>
): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target: containerRef as RefObject<HTMLElement>,
    offset: ['start start', 'end end'],
  })
  return scrollYProgress
}
