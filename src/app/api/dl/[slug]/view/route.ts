import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!slug) return NextResponse.json({ ok: false }, { status: 400 })

  const admin = createServiceClient()
  await admin.rpc('increment_deallink_views', { p_slug: slug })

  return NextResponse.json({ ok: true })
}
