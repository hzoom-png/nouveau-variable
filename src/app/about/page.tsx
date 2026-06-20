import type { Metadata } from 'next'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: 'Qui sommes-nous ? — Nouveau Variable',
  description: 'Découvrez l\'histoire, la vision et les principes fondateurs de Nouveau Variable — le club des commerciaux et entrepreneurs ambitieux.',
}

export default function AboutPage() {
  return <AboutClient />
}
