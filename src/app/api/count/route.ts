import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const revalidate = 60

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors() })
}

export async function GET() {
  const svc = createServiceClient()
  const { count } = await svc
    .from('candidatures')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  return NextResponse.json({ count: count ?? 0 }, { headers: cors() })
}
