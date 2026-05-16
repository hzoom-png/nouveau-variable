import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const getAdminSecret = () => {
  const s = process.env.ADMIN_JWT_SECRET
  if (!s) throw new Error('ADMIN_JWT_SECRET non défini')
  return new TextEncoder().encode(s)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── ADMIN ROUTES ──────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname.startsWith('/admin/login') || pathname.startsWith('/admin/setup-totp')) {
      return NextResponse.next()
    }

    const token = request.cookies.get('admin_session')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const { payload } = await jwtVerify(token, getAdminSecret())
      if (payload.role !== 'admin') throw new Error()
      return NextResponse.next()
    } catch {
      const res = NextResponse.redirect(new URL('/admin/login', request.url))
      res.cookies.set('admin_session', '', { maxAge: 0, path: '/' })
      return res
    }
  }

  // ── SUPABASE / DASHBOARD ROUTES ───────────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (pathname.startsWith('/auth') || pathname.startsWith('/api') ||
      pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return supabaseResponse
  }

  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  if (pathname === '/') {
    return NextResponse.next() // Landing page publique — accessible à tous sans redirection
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|gif|webp)$).*)'],
}
