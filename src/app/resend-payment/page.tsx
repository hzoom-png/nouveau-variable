import { notFound } from 'next/navigation'
import { FEATURES } from '@/lib/features'
import { ResendPaymentForm } from './ResendPaymentForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Renvoyer mon lien de paiement — Nouveau Variable',
  robots: { index: false },
}

export default function ResendPaymentPage() {
  if (!FEATURES.RESEND_PAYMENT) notFound()

  return (
    <main style={{
      minHeight:      '100dvh',
      background:     'var(--surface)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '24px 16px',
    }}>
      <ResendPaymentForm />
    </main>
  )
}
