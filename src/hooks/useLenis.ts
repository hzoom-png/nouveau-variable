'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

// Toggle to false to disable smooth scroll globally
const ENABLE_LENIS = true

export function useLenis() {
  useEffect(() => {
    if (!ENABLE_LENIS) return

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false, // leave native touch scroll on mobile
    })

    let rafId: number

    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])
}
