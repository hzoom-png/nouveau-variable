import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Anthropic from '@anthropic-ai/sdk'
import { consumeTokens } from '@/lib/tokens'
import { rateLimit } from '@/lib/rate-limit'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

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

type BrandAssets = {
  primaryColor: string
  secondaryColor: string
  logoUrl: string | null
  siteName: string | null
  faviconUrl: string | null
}

async function extractBrandAssets(url: string): Promise<BrandAssets> {
  const DEFAULT: BrandAssets = {
    primaryColor: '#2F5446', secondaryColor: '#3D6B58',
    logoUrl: null, siteName: null, faviconUrl: null,
  }
  if (!url) return DEFAULT
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NVBot/1.0)', Accept: 'text/html' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return DEFAULT
    const html = await res.text()

    const ogSite   = html.match(/property="og:site_name"\s+content="([^"]+)"/i)?.[1]
    const title    = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
    const siteName = ogSite ?? title?.split(/[|\-–]/)[0].trim() ?? null

    const logoPatterns = [
      /\<img[^>]+(?:class|id)="[^"]*logo[^"]*"[^>]+src="([^"]+)"/i,
      /\<img[^>]+src="([^"]+logo[^"]*\.(png|svg|webp))"/i,
    ]
    let logoUrl: string | null = null
    for (const pat of logoPatterns) {
      const m = html.match(pat)
      if (m?.[1]) { logoUrl = m[1].startsWith('http') ? m[1] : new URL(m[1], url).href; break }
    }

    const faviconMatch = html.match(/<link[^>]+rel="[^"]*(?:shortcut )?icon[^"]*"[^>]+href="([^"]+)"/i)
    const faviconUrl   = faviconMatch?.[1]
      ? (faviconMatch[1].startsWith('http') ? faviconMatch[1] : new URL(faviconMatch[1], url).href)
      : null

    const hexColors = [...html.matchAll(/(?:color|background(?:-color)?|border-color)\s*:\s*(#[0-9A-Fa-f]{6})\b/g)]
      .map(m => m[1].toLowerCase())
      .filter(c => c !== '#ffffff' && c !== '#000000' && c !== '#f0f0f0' && c !== '#333333')
    const freq: Record<string, number> = {}
    hexColors.forEach(c => { freq[c] = (freq[c] || 0) + 1 })
    const sorted  = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(e => e[0])
    const isReadable = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
      const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      return l < 0.85 && l > 0.05
    }
    const readable = sorted.filter(isReadable)
    return { primaryColor: readable[0] ?? DEFAULT.primaryColor, secondaryColor: readable[1] ?? DEFAULT.secondaryColor, logoUrl, siteName, faviconUrl }
  } catch {
    return DEFAULT
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Rate limiting persistant — 10 générations par minute par user
  const allowed = await rateLimit(`ai:${user.id}`, 10, 60)
  if (!allowed) {
    return NextResponse.json({ error: 'Limite atteinte — 10 générations par minute maximum.' }, { status: 429 })
  }

  // Tokens
  const tokenCheck = await consumeTokens(user.id, 'deallink').catch(() => ({ success: true, tokensLeft: 0, error: undefined }))
  if (!tokenCheck.success) {
    return NextResponse.json(
      { error: tokenCheck.error, tokensLeft: tokenCheck.tokensLeft, code: 'INSUFFICIENT_TOKENS' },
      { status: 402 }
    )
  }

  // Contexte commercial du membre
  const { data: profile } = await supabase
    .from('profiles').select('commercial_context').eq('id', user.id).single()
  const ctx = (profile?.commercial_context ?? {}) as Record<string, string>

  const body = await request.json() as Record<string, string>
  const bodyBrandAssets = (body as unknown as { brandAssets?: Record<string, string> }).brandAssets
  const {
    prospectName, prospectCompany, prospectRole, sector,
    productName: rawProductName, problem, arguments: args,
    tone: rawTone, myWebsite, clientWebsite,
    sellerName, sellerEmail, sellerPhone,
  } = body

  const productName = rawProductName || ctx.product || ''
  const tone        = rawTone || ctx.tone || 'Professionnel'

  if (!prospectName || !productName || !problem)
    return NextResponse.json({ error: 'Données manquantes : prénom prospect, produit et problème sont requis.' }, { status: 400 })

  if (prospectName.length > 100 || productName.length > 200 || problem.length > 2000)
    return NextResponse.json({ error: 'Données trop longues' }, { status: 400 })

  const [myContent, clientContent, autoBrand] = await Promise.all([
    fetchSiteContent(myWebsite || ''),
    fetchSiteContent(clientWebsite || ''),
    extractBrandAssets(myWebsite || ''),
  ])
  const brandAssets = { ...autoBrand, ...(bodyBrandAssets || {}) }

  const ctxBlock = (ctx.product || ctx.icp) ? `
CONTEXTE COMMERCIAL DU VENDEUR :
Produit / service : ${ctx.product ?? 'non renseigné'}
Client idéal : ${ctx.icp ?? 'non renseigné'}
Proposition de valeur : ${ctx.value_prop ?? 'non renseignée'}
Secteur cible : ${ctx.sector ?? 'non renseigné'}
` : ''

  const prompt = `Tu es un expert en pages de vente B2B personnalisées.
Tu génères UNIQUEMENT du JSON valide, sans markdown, sans backticks, sans texte autour.${ctxBlock}

Prospect : ${prospectName}${prospectRole ? `, ${prospectRole}` : ''}${prospectCompany ? ` — ${prospectCompany}` : ''}
Secteur : ${sector || 'non précisé'}
Produit / service du vendeur : ${productName}
Ton : ${tone}
Problème principal : ${problem}
Arguments fournis : ${args || 'aucun — détermine les plus pertinents'}
${myContent ? `\nContexte site vendeur :\n${myContent}` : ''}
${clientContent ? `\nContexte site prospect :\n${clientContent}` : ''}

Réponds avec exactement ce schéma JSON :
{
  "tagline": "accroche principale percutante, 10-15 mots max, centrée sur le bénéfice prospect",
  "sections": [
    { "id": "hero", "type": "hero", "title": "titre section hero", "body": "2-3 phrases d'intro, contexte du prospect, ton conversationnel direct" },
    { "id": "context", "type": "context", "title": "titre : décrit le problème du prospect", "body": "2-3 phrases décrivant précisément la situation actuelle, ses pain points" },
    { "id": "value_prop", "type": "value_prop", "title": "titre : ce que tu apportes spécifiquement", "body": "3-4 phrases concrètes sur la valeur apportée, résultats attendus si possible" },
    { "id": "proof", "type": "proof", "title": "titre : crédibilité / expérience", "body": "2-3 phrases sur l'expérience et les résultats pour des profils similaires. Ne jamais inventer de témoignage ou nommer un client." },
    { "id": "cta", "type": "cta", "title": "phrase d'appel à l'action", "body": "1-2 phrases de closing, ton direct et humain" }
  ],
  "brand_colors": {
    "primary": "${brandAssets.primaryColor}",
    "secondary": "${brandAssets.secondaryColor}",
    "background": "#FAFAF9",
    "text": "#0F1C17",
    "accent": "#C8790A"
  }
}

Consignes :
- Contenu adressé UNIQUEMENT à ${prospectName}${prospectCompany ? ` de ${prospectCompany}` : ''}
- Adapte le ton selon le secteur (formel pour finance/juridique, direct pour tech/startup)
- Ne jamais mentionner un outil technologique dans le contenu
- Ne jamais inventer de chiffres clients ou cas clients`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw     = response.content[0].type === 'text' ? response.content[0].text : ''
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

  let parsedResult: {
    tagline: string
    sections: { id: string; type: string; title: string; body: string }[]
    brand_colors: { primary: string; secondary: string; background: string; text: string; accent: string }
  }

  try {
    parsedResult = JSON.parse(cleaned)
    if (!Array.isArray(parsedResult.sections) || parsedResult.sections.length === 0)
      throw new Error('sections manquantes')
    if (!parsedResult.tagline)
      throw new Error('tagline manquant')
  } catch (e) {
    console.error('[deallink/generate] JSON parse error:', e, '\nRaw:', raw.slice(0, 200))
    return NextResponse.json({ error: 'Erreur de génération — structure invalide. Réessaie.' }, { status: 500 })
  }

  const baseSlug = `${slugify(prospectName)}-${slugify(prospectCompany || '')}-${Date.now().toString(36)}`
    .replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()

  // Service client pour l'insert — bypass RLS, user déjà authentifié ci-dessus
  const supabaseAdmin = createServiceClient()

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('deallinks')
    .insert({
      owner_id:         user.id,
      slug:             baseSlug,
      prospect_name:    prospectName,
      prospect_company: prospectCompany || null,
      prospect_role:    prospectRole    || null,
      prospect_sector:  sector          || null,
      product_name:     productName,
      seller_name:      sellerName      || null,
      seller_email:     sellerEmail     || null,
      seller_phone:     sellerPhone     || null,
      my_website:       myWebsite       || null,
      client_website:   clientWebsite   || null,
      full_result:      parsedResult,
      brand_assets:     brandAssets,
    })
    .select('slug')
    .single()

  if (insertError || !inserted) {
    console.error('[deallink/generate] insert error:', insertError?.code, insertError?.message)
    return NextResponse.json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ slug: inserted.slug, success: true })
}
