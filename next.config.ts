import type { NextConfig } from "next";

// CSP est géré dynamiquement par middleware.ts (nonce par requête).
// On conserve les autres headers de sécurité ici.
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',        value: 'on' },
  { key: 'X-Frame-Options',               value: 'DENY' },
  { key: 'X-Content-Type-Options',        value: 'nosniff' },
  { key: 'Referrer-Policy',               value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',            value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security',     value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ['pdf-parse', 'mammoth'],
  async headers() {
    return [
      {
        source: '/api/apply',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: process.env.ALLOWED_ORIGIN ?? 'https://nouveauvariable.fr' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig;
