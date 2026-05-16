import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, TEMPLATE_IDS } from '@/lib/email'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  // body en texte brut — obligatoire pour valider la signature Stripe
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    // Aucune action en base avant ce point — la signature n'est pas validée
    return new Response('Signature invalide', { status: 400 })
  }

  // À partir d'ici, l'événement est authentifié
  const svc = createServiceClient()

  // ── PAIEMENT RÉUSSI ──────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session    = event.data.object as Stripe.Checkout.Session
    const email      = session.customer_details?.email
    const plan       = session.metadata?.plan as 'monthly' | 'annual' | undefined
    const customerId = session.customer as string
    const subId      = session.subscription as string

    if (!email || !plan || !['monthly', 'annual'].includes(plan)) {
      return NextResponse.json({ received: true })
    }

    const { data: profile } = await svc
      .from('profiles')
      .select('id, first_name, referred_by, referral_code')
      .eq('email', email)
      .single()

    if (profile) {
      const prenom = profile.first_name ?? ''

      await svc.from('profiles').update({
        stripe_customer_id:     customerId,
        stripe_subscription_id: subId,
        subscription_status:    'active',
        subscription_plan:      plan,
        subscription_start:     new Date().toISOString(),
        is_active:              true,
        payment_failed_count:   0,
      }).eq('id', profile.id)

      // 2c — Bienvenue post-paiement
      await sendEmail({
        to: { email, name: prenom },
        templateId: TEMPLATE_IDS.BIENVENUE_PAIEMENT,
        params: {
          prenom,
          lien_dashboard: 'https://app.nouveauvariable.fr/dashboard',
          lien_profil:    'https://app.nouveauvariable.fr/dashboard/profile',
          lien_facture:   'https://app.nouveauvariable.fr/dashboard/billing',
        },
        tags: ['paiement', 'bienvenue'],
      })

      const commN1 = plan === 'annual' ? 89.90 : 9.70
      const commN2 = plan === 'annual' ? 44.95 : 4.85
      const paymentIntent = session.payment_intent as string | null

      if (profile.referred_by) {
        const { data: parrain1 } = await svc
          .from('profiles')
          .select('id, referred_by')
          .eq('referral_code', profile.referred_by)
          .single()

        // Anti-fraude : parrain != payeur
        if (parrain1 && parrain1.id !== profile.id) {
          const { count: existN1 } = await svc
            .from('affiliate_commissions')
            .select('id', { count: 'exact', head: true })
            .eq('payer_user_id', profile.id)
            .eq('beneficiary_id', parrain1.id)
            .eq('level', 1)
            .eq('stripe_payment_intent', paymentIntent ?? '')

          if ((existN1 ?? 0) === 0) {
            await svc.from('affiliate_commissions').insert({
              payer_user_id:         profile.id,
              beneficiary_id:        parrain1.id,
              level:                 1,
              plan,
              amount_eur:            commN1,
              status:                'pending',
              stripe_payment_intent: paymentIntent,
            })

            // 2f — Notifier le parrain N1
            const { data: parrain1Profile } = await svc
              .from('profiles')
              .select('email, first_name')
              .eq('id', parrain1.id)
              .single()

            if (parrain1Profile) {
              await sendEmail({
                to: { email: parrain1Profile.email, name: parrain1Profile.first_name },
                templateId: TEMPLATE_IDS.NOUVEAU_FILLEUL,
                params: {
                  prenom:           parrain1Profile.first_name,
                  filleul_prenom:   prenom,
                  commission:       commN1.toString(),
                  date_versement:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
                  lien_affiliation: 'https://app.nouveauvariable.fr/dashboard/affiliation',
                },
                tags: ['affiliation', 'commission'],
              })
            }
          }

          if (parrain1.referred_by) {
            const { data: parrain2 } = await svc
              .from('profiles')
              .select('id')
              .eq('referral_code', parrain1.referred_by)
              .single()

            // Anti-fraude : parrain2 != payeur et != parrain1
            if (parrain2 && parrain2.id !== profile.id && parrain2.id !== parrain1.id) {
              const { count: existN2 } = await svc
                .from('affiliate_commissions')
                .select('id', { count: 'exact', head: true })
                .eq('payer_user_id', profile.id)
                .eq('beneficiary_id', parrain2.id)
                .eq('level', 2)
                .eq('stripe_payment_intent', paymentIntent ?? '')

              if ((existN2 ?? 0) === 0) {
                await svc.from('affiliate_commissions').insert({
                  payer_user_id:         profile.id,
                  beneficiary_id:        parrain2.id,
                  level:                 2,
                  plan,
                  amount_eur:            commN2,
                  status:                'pending',
                  stripe_payment_intent: paymentIntent,
                })
              }
            }
          }
        }
      }

      if (session.invoice) {
        try {
          const inv = await stripe.invoices.retrieve(session.invoice as string)
          await svc.from('invoices').insert({
            user_id:                profile.id,
            stripe_invoice_id:      inv.id,
            stripe_payment_intent:  paymentIntent,
            amount_eur:             inv.amount_paid / 100,
            status:                 'paid',
            invoice_pdf_url:        inv.invoice_pdf,
            period_start:           new Date(inv.period_start * 1000).toISOString(),
            period_end:             new Date(inv.period_end   * 1000).toISOString(),
          })
        } catch {
          // Non-bloquant — l'activation membre est déjà faite
        }
      }
    }
  }

  // ── ABONNEMENT ANNULÉ ────────────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription

    const { data: cancelledProfile } = await svc
      .from('profiles')
      .select('email, first_name')
      .eq('stripe_subscription_id', sub.id)
      .single()

    await svc.from('profiles').update({
      subscription_status: 'inactive',
      is_active:           false,
    }).eq('stripe_subscription_id', sub.id)

    // 2e — Email résiliation
    if (cancelledProfile) {
      await sendEmail({
        to: { email: cancelledProfile.email, name: cancelledProfile.first_name },
        templateId: TEMPLATE_IDS.RESILIATION,
        params: {
          prenom:             cancelledProfile.first_name,
          lien_affiliation:   'https://app.nouveauvariable.fr/dashboard/affiliation',
          lien_reactivation:  `https://app.nouveauvariable.fr/subscribe?email=${encodeURIComponent(cancelledProfile.email)}`,
        },
        tags: ['abonnement', 'resiliation'],
      })
    }
  }

  // ── ABONNEMENT MODIFIÉ ───────────────────────────────────────────
  if (event.type === 'customer.subscription.updated') {
    const sub    = event.data.object as Stripe.Subscription
    const status = sub.status === 'active' ? 'active' : 'inactive'
    await svc.from('profiles').update({
      subscription_status: status,
      is_active:           status === 'active',
    }).eq('stripe_subscription_id', sub.id)
  }

  // ── PAIEMENT ÉCHOUÉ ──────────────────────────────────────────────
  if (event.type === 'invoice.payment_failed') {
    const inv = event.data.object as Stripe.Invoice

    const { data: failedProfile } = await svc
      .from('profiles')
      .select('email, first_name, payment_failed_count')
      .eq('stripe_customer_id', inv.customer as string)
      .single()

    const failCount = (failedProfile?.payment_failed_count ?? 0) + 1

    await svc.from('profiles').update({
      subscription_status:  'past_due',
      payment_failed_count: failCount,
    }).eq('stripe_customer_id', inv.customer as string)

    if (failedProfile) {
      // 2d — J+0 : premier email d'échec
      if (failCount === 1) {
        await sendEmail({
          to: { email: failedProfile.email, name: failedProfile.first_name },
          templateId: TEMPLATE_IDS.ECHEC_PAIEMENT_1,
          params: {
            prenom:      failedProfile.first_name,
            lien_paiement: 'https://app.nouveauvariable.fr/dashboard/billing',
            date_limite:   new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
              .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
          },
          tags: ['paiement', 'echec'],
        })
      }

      // 2d — J+2 : second email si toujours en échec
      if (failCount >= 2) {
        await sendEmail({
          to: { email: failedProfile.email, name: failedProfile.first_name },
          templateId: TEMPLATE_IDS.ECHEC_PAIEMENT_2,
          params: {
            prenom:        failedProfile.first_name,
            lien_paiement: 'https://app.nouveauvariable.fr/subscribe',
          },
          tags: ['paiement', 'echec-2'],
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
