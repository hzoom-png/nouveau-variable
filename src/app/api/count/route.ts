import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const revalidate = 60

const ALLOWED_ORIGINS = [
  'https://nouveauvariable.fr',
  'https://www.nouveauvariable.fr',
  'https://app.nouveauvariable.fr',
  'http://localhost:3000',
]

function isAllowed(origin: string | null): origin is string {
  return !!origin && ALLOWED_ORIGINS.includes(origin)
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (!isAllowed(origin)) return new NextResponse(null, { status: 403 })
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin':  origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  })
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin')
  const svc = createServiceClient()
  const { count } = await svc
    .from('candidatures')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'received', 'reviewed'])

  const res = NextResponse.json({ count: count ?? 0 })
  if (isAllowed(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  }
  return res
}
