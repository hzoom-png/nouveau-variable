'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { OneVsFiveStatic } from './Static'

// Toggle: set to false to revert to the static (non-animated) version
export const USE_ONE_VS_FIVE_ANIMATION = true

const OneVsFiveAnimated = dynamic(
  () => import('./Animated').then(m => ({ default: m.OneVsFiveAnimated })),
  { ssr: false },
)

export function OneVsFive() {
  // Default: render Static (SSR-safe, visible on mobile immediately).
  // After mount on desktop: swap to Animated so LandingClient's .sf IO
  // always finds .cmp-section in the DOM at the right time.
  const [showAnimated, setShowAnimated] = useState(false)

  useEffect(() => {
    if (USE_ONE_VS_FIVE_ANIMATION && window.innerWidth >= 768) {
      setShowAnimated(true)
    }
  }, [])

  if (showAnimated) {
    return <OneVsFiveAnimated />
  }

  return <OneVsFiveStatic />
}
