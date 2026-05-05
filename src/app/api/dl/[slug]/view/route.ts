import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!slug) return NextResponse.json({ ok: false }, { status: 400 })

  await admin.rpc('increment_deallink_views', { p_slug: slug })

  return NextResponse.json({ ok: true })
}
