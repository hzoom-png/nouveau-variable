import type { Metadata } from 'next'
import { Jost, Inter } from 'next/font/google'
import './globals.css'

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Nouveau Variable — Espace membre',
  description: 'Club privé des commerciaux ambitieux.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${jost.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}
