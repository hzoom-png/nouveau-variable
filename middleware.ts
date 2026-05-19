import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const ADMIN_PUBLIC = ['/admin/login', '/admin/setup-totp']

function getAdminSecret(): Uint8Array | null {
  const s = process.env.ADMIN_JWT_SECRET
  if (!s) return null
  return new TextEncoder().encode(s)
}

// Check Supabase session cookie presence without importing @supabase/ssr.
// Full JWT verification happens at the route level — this is just a fast redirect gate.
function hasSupabaseSession(request: NextRequest): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const projectRef = url.replace('https://', '').split('.')[0]
  if (!projectRef) return false
  // Supabase SSR may chunk the cookie across sb-<ref>-auth-token.0, .1, etc.
  return request.cookies.getAll().some(
    c => c.name === `sb-${projectRef}-auth-token` ||
         c.name.startsWith(`sb-${projectRef}-auth-token.`)
  )
}

async function checkAdminJwt(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return false
  const secret = getAdminSecret()
  if (!secret) return false
  try {
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── /dashboard/* + /onboarding/* — Supabase session cookie gate ──
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
    if (!hasSupabaseSession(request)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // ── /api/admin/auth/* — login flow endpoints, pass through ───────
  if (pathname.startsWith('/api/admin/auth')) {
    return NextResponse.next()
  }

  // ── /api/admin/* — admin JWT check → 401 ────────────────────────
  if (pathname.startsWith('/api/admin')) {
    if (!await checkAdminJwt(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // ── /admin/* — admin JWT check → redirect ────────────────────────
  if (pathname.startsWith('/admin')) {
    if (ADMIN_PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))) {
      return NextResponse.next()
    }
    if (!await checkAdminJwt(request)) {
      const res = NextResponse.redirect(new URL('/admin/login', request.url))
      res.cookies.delete('admin_session')
      return res
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/admin/:path*', '/api/admin/:path*'],
}
