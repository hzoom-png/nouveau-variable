'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DealLinkEditPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard deallink tool (modal-based editor)
    router.push('/dashboard/tools/deallink')
  }, [router])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ fontSize: '16px', color: '#666' }}>Redirection en cours...</p>
    </div>
  )
}
