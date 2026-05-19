'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Toggle to revert to ClassicWhatsInTheClubSection in LandingClient
export const USE_REVENUE_ANIMATION = true

// Lazy-loaded — Framer Motion only loads when the component renders
const DesktopAnim = dynamic(() => import('./Desktop').then(m => ({ default: m.Desktop })), { ssr: false })
const MobileAnim  = dynamic(() => import('./Mobile').then(m  => ({ default: m.Mobile  })), { ssr: false })

export function RevenueAnimation() {
  const [isMobile, setIsMobile] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    setReady(true)
  }, [])

  if (!ready) {
    // SSR / hydration placeholder — matches approximate section height
    return (
      <div style={{ height: isMobile ? '600px' : '400vh', background: '#ffffff' }} />
    )
  }

  return isMobile ? <MobileAnim /> : <DesktopAnim />
}
