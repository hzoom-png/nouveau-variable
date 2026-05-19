'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Toggle to revert to ClassicWhatsInTheClubSection in LandingClient
export const USE_REVENUE_ANIMATION = true

// < 1024px → same cinematic animation, rescaled for mobile
const DesktopAnim = dynamic<{ isMobile?: boolean }>(
  () => import('./Desktop').then(m => ({ default: m.Desktop })),
  { ssr: false },
)

export function RevenueAnimation() {
  const [isMobile, setIsMobile] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024)
    setReady(true)
  }, [])

  if (!ready) {
    return <div style={{ height: '400vh', background: '#ffffff' }} />
  }

  return <DesktopAnim isMobile={isMobile} />
}
