import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
}

export async function POST() {
  const stripe = getStripe()
  // Auth Supabase obligatoire — un utilisateur non connecté ne peut jamais accéder au portail d'un autre
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const svc = createServiceClient()
  const { data: profile } = await svc
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'Aucun abonnement Stripe associé' }, { status: 404 })
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer:   profile.stripe_customer_id,
      return_url: 'https://app.nouveauvariable.fr/dashboard/billing',
    })
    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json({ error: 'Erreur paiement', code: 'PAYMENT_ERROR' }, { status: 500 })
  }
}
