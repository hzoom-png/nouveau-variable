'use client'

import { useEffect } from 'react'

export default function DealLinkViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/dl/${slug}/view`, { method: 'POST' }).catch(() => {/* non-blocking */})
  }, [slug])

  return null
}
