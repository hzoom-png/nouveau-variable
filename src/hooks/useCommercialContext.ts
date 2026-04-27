'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CommercialContext } from '@/lib/types'

export type { CommercialContext }

export function useCommercialContext() {
  const [ctx, setCtx]       = useState<CommercialContext>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase
        .from('profiles')
        .select('commercial_context')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setCtx((data?.commercial_context as CommercialContext) ?? {})
          setLoading(false)
        })
    })
  }, [])

  return { ctx, loading }
}
