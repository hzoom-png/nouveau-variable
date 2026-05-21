'use client'

import { useLenis } from '@/hooks/useLenis'

// Mounts Lenis globally — renders nothing, just initializes smooth scroll.
export function LenisInit() {
  useLenis()
  return null
}
