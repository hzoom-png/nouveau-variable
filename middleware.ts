import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { randomBytes } from 'crypto'

const ADMIN_PUBLIC = ['/admin/login', '/admin/setup-totp']

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.brevo.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

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

  // ── Pages HTML (dashboard, onboarding, admin, landing) ───────────
  // Génère un nonce par requête pour la CSP script-src
  const nonce = randomBytes(16).toString('base64')
  const csp   = buildCsp(nonce)

  // Inject nonce dans les headers de la requête pour que le layout puisse le lire
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  // Auth gates — construit la réponse avec le nonce déjà dans les headers
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
    if (!hasSupabaseSession(request)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (pathname.startsWith('/admin')) {
    if (!ADMIN_PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))) {
      if (!await checkAdminJwt(request)) {
        const res = NextResponse.redirect(new URL('/admin/login', request.url))
        res.cookies.delete('admin_session')
        return res
      }
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  // Toutes les pages HTML — exclure _next/static, _next/image, et fichiers statiques
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot)$).*)'],
}
