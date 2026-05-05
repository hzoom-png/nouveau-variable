import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

// En App Router, req.text() retourne le body brut — pas besoin de désactiver le body parser

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeKey || !webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_SECRET_KEY ou STRIPE_WEBHOOK_SECRET non défini')
    return new Response('Configuration manquante', { status: 500 })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2026-04-22.dahlia' })

  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return new Response('Signature manquante', { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[Stripe Webhook] Signature invalide:', err instanceof Error ? err.message : err)
    return new Response('Signature invalide', { status: 400 })
  }

  const svc = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // Paiement réussi via Payment Link ou Checkout
        // Adapter selon les métadonnées Stripe configurées (ex: candidature_id, user_id)
        console.log('[Stripe Webhook] checkout.session.completed:', event.data.object.id)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('[Stripe Webhook] subscription event:', subscription.id, subscription.status)
        break
      }

      case 'customer.subscription.deleted': {
        // Abonnement annulé — désactiver le membre si applicable
        console.log('[Stripe Webhook] subscription deleted:', event.data.object.id)
        break
      }

      default:
        // Événement non géré — logguer sans erreur
        console.log('[Stripe Webhook] Événement ignoré:', event.type)
    }
  } catch (err) {
    console.error('[Stripe Webhook] Erreur traitement:', err instanceof Error ? err.message : err)
    // Renvoyer 200 pour éviter les retentatives Stripe sur des erreurs métier
    return new Response('Erreur traitement', { status: 200 })
  }

  void svc // satisfaire le linter si svc non utilisé dans tous les cas

  return new Response('OK', { status: 200 })
}
