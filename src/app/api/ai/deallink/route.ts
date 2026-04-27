import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { consumeTokens } from '@/lib/tokens'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const rateLimitMap = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 20
const WINDOW_MS = 60 * 60 * 1000

async function fetchSiteContent(url: string): Promise<string> {
  if (!url) return ''
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NVBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000)
  } catch {
    return ''
  }
}

type BrandColors = { primary: string; secondary: string; bg: string; text: string }
type BrandAssets = BrandColors & { logoUrl: string | null; siteName: string | null }

async function extractBrandAssets(url: string): Promise<BrandAssets> {
  const DEFAULT: BrandAssets = { primary: '#2F5446', secondary: '#3D6B58', bg: '#FFFFFF', text: '#0F1C17', logoUrl: null, siteName: null }
  if (!url) return DEFAULT
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NVBot/1.0)', Accept: 'text/html' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return DEFAULT
    const html = await res.text()

    // Site name
    const ogSite = html.match(/property="og:site_name"\s+content="([^"]+)"/i)?.[1]
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
    const siteName = ogSite ?? titleMatch?.split(/[|\-–]/)[0].trim() ?? null

    // Logo
    const logoPatterns = [
      /\<img[^>]+(?:class|id)="[^"]*logo[^"]*"[^>]+src="([^"]+)"/i,
      /\<img[^>]+src="([^"]+logo[^"]*\.(png|svg|webp))"/i,
      /\<link[^>]+rel="[^"]*icon[^"]*"[^>]+href="([^"]+)"/i,
    ]
    let logoUrl: string | null = null
    for (const pat of logoPatterns) {
      const m = html.match(pat)
      if (m?.[1]) {
        logoUrl = m[1].startsWith('http') ? m[1] : new URL(m[1], url).href
        break
      }
    }

    // Colors
    const hexColors = [...html.matchAll(/(?:color|background(?:-color)?|border-color)\s*:\s*(#[0-9A-Fa-f]{6})\b/g)]
      .map(m => m[1].toLowerCase())
      .filter(c => c !== '#ffffff' && c !== '#000000' && c !== '#f0f0f0' && c !== '#333333')
    const freq: Record<string, number> = {}
    hexColors.forEach(c => { freq[c] = (freq[c] || 0) + 1 })
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(e => e[0])
    const isReadable = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
      const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      return l < 0.85 && l > 0.05
    }
    const readable = sorted.filter(isReadable)

    return {
      primary: readable[0] ?? DEFAULT.primary,
      secondary: readable[1] ?? DEFAULT.secondary,
      bg: '#FFFFFF',
      text: '#0F1C17',
      logoUrl,
      siteName,
    }
  } catch {
    return DEFAULT
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401 })

  const now = Date.now()
  const entry = rateLimitMap.get(user.id)
  if (entry && now < entry.reset) {
    if (entry.count >= RATE_LIMIT) {
      return new Response(JSON.stringify({ error: 'Limite atteinte. Réessaie dans une heure.' }), { status: 429 })
    }
    entry.count++
  } else {
    rateLimitMap.set(user.id, { count: 1, reset: now + WINDOW_MS })
  }

  const tokenCheck = await consumeTokens(user.id, 'deallink').catch(() => ({ success: true, tokensLeft: 0, error: undefined }))
  if (!tokenCheck.success) {
    return new Response(JSON.stringify({ error: tokenCheck.error, tokensLeft: tokenCheck.tokensLeft, code: 'INSUFFICIENT_TOKENS' }), { status: 402, headers: { 'Content-Type': 'application/json' } })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('commercial_context')
    .eq('id', user.id)
    .single()
  const ctx = (profile?.commercial_context ?? {}) as Record<string, string>

  const body = await request.json() as Record<string, string>
  const { prospectName, prospectCompany, sector, productName: rawProductName, problem, arguments: args, tone: rawTone, myWebsite, clientWebsite } = body

  // Fall back to commercial context if form fields are empty
  const productName = rawProductName || ctx.product || ''
  const tone        = rawTone        || ctx.tone    || 'Professionnel'

  if (!prospectName || !productName || !problem) {
    return new Response(JSON.stringify({ error: 'Données manquantes' }), { status: 400 })
  }

  if (prospectName.length > 100 || productName.length > 200 || problem.length > 2000) {
    return new Response(JSON.stringify({ error: 'Données trop longues' }), { status: 400 })
  }

  const [myContent, clientContent, brandAssets] = await Promise.all([
    fetchSiteContent(myWebsite || ''),
    fetchSiteContent(clientWebsite || ''),
    extractBrandAssets(myWebsite || ''),
  ])
  const brandColors: BrandColors = { primary: brandAssets.primary, secondary: brandAssets.secondary, bg: brandAssets.bg, text: brandAssets.text }

  const ctxBlock = (ctx.product || ctx.icp) ? `
CONTEXTE COMMERCIAL DU MEMBRE :
Produit / service : ${ctx.product ?? 'non renseigné'}
Client idéal : ${ctx.icp ?? 'non renseigné'}
Proposition de valeur : ${ctx.value_prop ?? 'non renseignée'}
Objections récurrentes : ${ctx.typical_objections ?? 'non renseignées'}
Secteur cible : ${ctx.sector ?? 'non renseigné'}

Utilise ce contexte pour affiner le positionnement, les arguments et le ton.
` : ''

  const prompt = `Tu es un expert en vente B2B francophone.${ctxBlock}
Tu dois créer un DealLink personnalisé pour un commercial.

Prospect : ${prospectName}${prospectCompany ? ' — ' + prospectCompany : ''}
Secteur : ${sector || 'non précisé'}
Produit / service : ${productName}
Problème principal : ${problem}
Arguments fournis : ${args || 'aucun — choisis les 3 meilleurs'}
Ton : ${tone || 'Professionnel'}
${myContent ? `\nContexte commercial (site vendeur) :\n${myContent}` : ''}
${clientContent ? `\nContexte prospect (site client) :\n${clientContent}` : ''}

RÈGLES :
- Arguments dans le langage du prospect, pas du vendeur
- Commence par le bénéfice, pas la feature
- Témoignage d'un profil similaire au prospect
- Accroche = nommer explicitement le problème
- Ne mentionne jamais les outils utilisés dans le contenu
- Score honnête de 1 à 100

Réponds UNIQUEMENT en JSON valide sans markdown :
{
  "score": 87,
  "accroche": "accroche 2-3 phrases — tutoie si ton décontracté, vouvoie sinon",
  "arguments": [
    { "titre": "bénéfice court", "corps": "développement 2-3 phrases" },
    { "titre": "...", "corps": "..." },
    { "titre": "...", "corps": "..." }
  ],
  "temoignage": {
    "citation": "témoignage réaliste d'un client similaire",
    "auteur": "Prénom N. · Titre · Contexte similaire"
  },
  "cta": "formulation exacte du CTA, courte et percutante",
  "objections": [
    { "objection": "objection probable", "reponse": "réponse courte" },
    { "objection": "...", "reponse": "..." },
    { "objection": "...", "reponse": "..." }
  ]
}`

  const encoder = new TextEncoder()
  const slug = `${prospectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = ''
      try {
        const anthropicStream = anthropic.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        })

        for await (const chunk of anthropicStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            buffer += chunk.delta.text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk.delta.text })}\n\n`))
          }
        }

        const jsonMatch = buffer.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const result = JSON.parse(jsonMatch[0])
            await supabase.from('deallinks').insert({
              owner_id: user.id,
              prospect_name: prospectName,
              prospect_company: prospectCompany || null,
              prospect_sector: sector || null,
              product_name: productName,
              slug,
              score: result.score,
              hook: result.accroche || null,
              content: result,
              my_website: myWebsite || null,
              client_website: clientWebsite || null,
              brand_colors: brandColors,
              brand_assets: brandAssets,
            })
          } catch { /* save failure is non-blocking */ }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, slug })}\n\n`))
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
