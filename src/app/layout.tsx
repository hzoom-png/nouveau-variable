import type { Metadata } from 'next'
import { Jost, Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/theme'

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
  title: 'Nouveau Variable',
  description: 'Le club des commerciaux ambitieux.',
  icons: {
    icon: '/nv-logo-black.png',
    apple: '/nv-logo-black.png',
    shortcut: '/nv-logo-black.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${jost.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var saved = localStorage.getItem('nv-theme');
              var preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              document.documentElement.setAttribute('data-theme', saved || preferred);
            } catch(e) {}
          })();
        `}} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
