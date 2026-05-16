import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const ALLOWED_PLANS = new Set(['monthly', 'annual'])

export async function POST(req: NextRequest) {
  const key            = process.env.STRIPE_SECRET_KEY
  const priceMonthly   = process.env.STRIPE_PRICE_MONTHLY
  const priceAnnual    = process.env.STRIPE_PRICE_ANNUAL
  const appUrl         = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.nouveauvariable.fr'

  if (!key) {
    console.error('[Stripe] STRIPE_SECRET_KEY manquante')
    return NextResponse.json({ error: 'Configuration Stripe manquante', code: 'MISSING_KEY' }, { status: 500 })
  }

  try {
    const stripe = new Stripe(key, { apiVersion: '2025-05-28.basil' as any })

    const body = await req.json() as { plan?: unknown; email?: unknown; prenom?: unknown }
    const { plan, email: bodyEmail, prenom } = body

    if (typeof plan !== 'string' || !ALLOWED_PLANS.has(plan)) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    let resolvedEmail: string
    if (typeof bodyEmail === 'string' && bodyEmail.includes('@')) {
      resolvedEmail = bodyEmail
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      let email = user?.email ?? ''
      if (!email.includes('@') && user?.id) {
        const svc = createServiceClient()
        const { data: profile } = await svc.from('profiles').select('email').eq('id', user.id).single()
        email = (profile?.email as string | null) ?? ''
      }
      if (email.includes('@')) {
        resolvedEmail = email
      } else {
        return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
      }
    }

    const safePlan   = plan as 'monthly' | 'annual'
    const safeEmail  = resolvedEmail.trim().toLowerCase().slice(0, 254)
    const safePrenom = typeof prenom === 'string' ? prenom.trim().slice(0, 100) : undefined

    const priceId = safePlan === 'annual' ? priceAnnual! : priceMonthly!

    if (!priceId) {
      console.error('[Stripe] Price ID manquant pour le plan:', safePlan)
      return NextResponse.json({ error: 'Configuration prix manquante', code: 'MISSING_PRICE' }, { status: 500 })
    }

    const customers = await stripe.customers.list({ email: safeEmail, limit: 1 })
    const customer  = customers.data[0] ?? await stripe.customers.create({
      email:    safeEmail,
      name:     safePrenom,
      metadata: { source: 'nouveau_variable' },
    })

    const session = await stripe.checkout.sessions.create({
      customer:              customer.id,
      payment_method_types:  ['card'],
      line_items:            [{ price: priceId, quantity: 1 }],
      mode:                  'subscription',
      success_url:           `${appUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:            `${appUrl}/subscribe?email=${encodeURIComponent(safeEmail)}`,
      metadata:              { prenom: safePrenom ?? '', plan: safePlan },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[Stripe] Erreur:', {
      message: err.message,
      type:    err.type,
      code:    err.code,
    })
    return NextResponse.json({
      error: 'Erreur création session',
      code:  err.code ?? 'UNKNOWN',
    }, { status: 500 })
  }
}
