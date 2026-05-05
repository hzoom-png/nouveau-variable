import { NextRequest, NextResponse } from 'next/server'

// Rate limit simple : 3 inscriptions par IP par heure
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3_600_000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessaie dans 1 heure.' },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 })
  }

  const { name, email, role } = body

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: 'Prénom et email obligatoires' },
      { status: 400 }
    )
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  }

  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.error('BREVO_API_KEY manquante')
    return NextResponse.json(
      { error: 'Configuration serveur manquante' },
      { status: 500 }
    )
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        attributes: {
          FIRSTNAME: name.trim().slice(0, 50),
          ROLE: role?.trim() || 'Non précisé',
          SOURCE: 'waiting_list_landing',
        },
        listIds: [3],
        updateEnabled: true,
      }),
    })

    if (res.status === 201 || res.status === 204) {
      return NextResponse.json({ success: true })
    }

    const data = await res.json().catch(() => ({}))
    console.error('Brevo error:', res.status, data)

    if (res.status === 400 && data?.code === 'duplicate_parameter') {
      return NextResponse.json({ success: true, already: true })
    }

    return NextResponse.json({ error: 'Erreur Brevo — réessaie' }, { status: 502 })
  } catch (err: unknown) {
    console.error('Waitlist fetch error:', err)
    return NextResponse.json({ error: 'Erreur réseau — réessaie' }, { status: 500 })
  }
}
