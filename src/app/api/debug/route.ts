import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const allCookies = request.cookies.getAll()
  const sbCookies = allCookies.filter(c => c.name.startsWith('sb-'))

  let session = null
  let sessionError = null

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )
    const result = await supabase.auth.getSession()
    session = result.data.session
    sessionError = result.error
  } catch (e) {
    sessionError = String(e)
  }

  // Check if profile exists
  let profile = null
  let profileError = null
  let userFromGetUser = null
  if (session) {
    try {
      const supabase2 = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return request.cookies.getAll() }, setAll() {} } }
      )
      const { data: { user }, error: ue } = await supabase2.auth.getUser()
      userFromGetUser = user?.id ?? null
      if (ue) profileError = `getUser error: ${ue.message}`
      if (user) {
        const { data, error: pe } = await supabase2.from('profiles').select('id, first_name').eq('id', user.id).single()
        profile = data
        if (pe) profileError = (profileError ?? '') + ` | profiles error: ${pe.message} (code: ${pe.code})`
      }
    } catch(e) { profileError = String(e) }
  }

  return NextResponse.json({
    totalCookies: allCookies.length,
    sbCookies: sbCookies.map(c => ({ name: c.name, len: c.value.length })),
    sessionFound: !!session,
    sessionError,
    userId: session?.user?.id ?? null,
    userFromGetUser,
    profileFound: !!profile,
    profileFirstName: (profile as { first_name?: string } | null)?.first_name ?? null,
    profileError,
  })
}
