import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Anthropic from '@anthropic-ai/sdk'
import { generatePublicSlug, sanitizeHtml } from '@/lib/deallink'
import { rateLimit } from '@/lib/rate-limit'
import { consumeTokens } from '@/lib/tokens'

export async function POST(req: Request) {
  try {
    console.log('[1] POST /api/deallink/generate')

    // Auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[2] Auth failed:', authError?.message)
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    console.log('[2] Auth OK:', user.id)

    // Rate limiting
    const allowed = await rateLimit(`ai:${user.id}`, 10, 60)
    if (!allowed) {
      console.warn('[3] Rate limit exceeded')
      return NextResponse.json(
        { error: 'Limite atteinte — 10 générations par minute maximum.' },
        { status: 429 }
      )
    }
    console.log('[3] Rate limit OK')

    // Token consumption
    const tokenCheck = await consumeTokens(user.id, 'deallink').catch(() => ({
      success: true,
      tokensLeft: 0,
      error: undefined,
    }))
    if (!tokenCheck.success) {
      console.warn('[4] Insufficient tokens')
      return NextResponse.json(
        {
          error: tokenCheck.error,
          tokensLeft: tokenCheck.tokensLeft,
          code: 'INSUFFICIENT_TOKENS',
        },
        { status: 402 }
      )
    }
    console.log('[4] Token check OK')

    // Parse body
    const body = (await req.json()) as Record<string, unknown>
    console.log('[5] Body parsed:', {
      prospect: body.prospect_name,
      company: body.company_name,
      deal_type: body.deal_type,
      deal_context: String(body.deal_context).substring(0, 50),
    })

    const {
      prospect_name,
      company_name,
      deal_type,
      deal_context,
      deal_value,
      user_name,
      user_title,
      tone,
      myWebsite,
      clientWebsite,
    } = body

    // Validation
    if (!prospect_name || typeof prospect_name !== 'string' || !prospect_name.trim()) {
      console.error('[6] Missing prospect_name')
      return NextResponse.json({ error: 'Nom du prospect requis' }, { status: 400 })
    }
    if (!deal_type || typeof deal_type !== 'string') {
      console.error('[6] Missing deal_type')
      return NextResponse.json({ error: 'Type de deal requis' }, { status: 400 })
    }
    if (!deal_context || typeof deal_context !== 'string' || !deal_context.trim()) {
      console.error('[6] Missing deal_context')
      return NextResponse.json({ error: 'Contexte du deal requis' }, { status: 400 })
    }
    console.log('[6] Validation OK')

    // company_name is optional
    const safeCompanyName = (company_name && typeof company_name === 'string') ? company_name.trim() : 'N/A'
    console.log('[7] Safe company name:', safeCompanyName)

    // Fetch website contents if provided
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
          .slice(0, 2000)
      } catch {
        return ''
      }
    }

    const [myContent, clientContent] = await Promise.all([
      fetchSiteContent((myWebsite as string) || ''),
      fetchSiteContent((clientWebsite as string) || ''),
    ])
    console.log('[8] Website contents fetched')

    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[9] ANTHROPIC_API_KEY not set')
      return NextResponse.json(
        { error: 'Erreur de configuration serveur' },
        { status: 500 }
      )
    }
    console.log('[9] API key present')

    // Anthropic generation
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
    console.log('[10] Anthropic client created')

    const valueStr = deal_value ? `€${deal_value}` : 'TBD'

    const deallinkPrompt = `Tu génères une landing page PERSONNALISÉE pour un prospect spécifique.

DONNÉES DU DEAL:
- Prospect Name: ${prospect_name}
- Company: ${safeCompanyName}
- Deal Type: ${deal_type}
- Context: ${deal_context}
- Value: ${valueStr}

RÈGLES:

1. LA PAGE S'ADRESSE DIRECTEMENT AU PROSPECT
   - Utilise son prénom (exemple: "${prospect_name.split(' ')[0]},")
   - Parle de sa company comme si tu la connais
   - Ton: personnel, professionnel, pas corporate

2. STRUCTURE REQUISE (sections)
   a) HERO: Nom du prospect + hook pertinent au deal
   b) POURQUOI: Explique le contexte du deal
   c) LA SOLUTION: Décris ce qu'on propose
   d) IMPACT: Bénéfices concrets (bullet points)
   e) CTA: "Prise RDV" ou "Discutons"
   f) FOOTER: Info du fondateur (vague, on va remplir)

3. DESIGN
   - Premium, moderne, Stripe/Vercel level
   - Use CSS variables for colors (--primary, --accent)
   - Responsive mobile/tablet/desktop
   - Whitespace generous
   - No clutter
   - Smooth animations

4. CONTENU
   - Clair et direct
   - Pas de fluff
   - Deal value visible
   - CTA prominent
   - Professional tone

5. TECHNICAL
   - Valid HTML + CSS
   - Self-contained (no external deps)
   - CSS in <style> tag
   - Inline everything
   - Optimized

OUTPUT:

Return ONLY this JSON (no markdown backticks):
{
  "html": "<html>...</html>",
  "css": "/* all CSS here, will be inlined */",
  "config": {
    "colors": {
      "primary": "#2F5446",
      "accent": "#C8790A"
    }
  }
}

Génère une landing page SUBLIME, PERSONNALISÉE, ADRESSÉE À CE PROSPECT.`

    const prompt = deallinkPrompt

    console.log('[11] Prompt ready, length:', prompt.length)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    console.log('[12] Timeout set: 30s')

    let message
    try {
      console.log('[13] Calling Anthropic API with model: claude-3-5-sonnet-20241022')
      message = await anthropic.messages.create(
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          signal: controller.signal,
        } as Parameters<typeof anthropic.messages.create>[1]
      )
      console.log('[13] Anthropic API response received, content type:', message.content[0]?.type)
    } catch (apiErr) {
      clearTimeout(timeout)
      const errMsg = (apiErr as any)?.message || String(apiErr)
      console.error('[13] Anthropic API error:', errMsg)
      console.error('[13] Error type:', (apiErr as any)?.status || 'unknown')
      return NextResponse.json(
        { error: 'Erreur lors de la génération — réessaie.' },
        { status: 500 }
      )
    }

    clearTimeout(timeout)
    console.log('[14] Timeout cleared')

    // Parse response
    const responseText =
      message.content[0]?.type === 'text' ? message.content[0].text : ''

    console.log('[15] Response text length:', responseText.length)
    console.log('[15] First 300 chars:', responseText.substring(0, 300))

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[16] JSON not found in response')
      console.error('[16] Full response:', responseText)
      return NextResponse.json(
        { error: 'Erreur de génération — réponse invalide' },
        { status: 500 }
      )
    }

    console.log('[16] JSON extracted, length:', jsonMatch[0].length)

    let generatedLanding
    try {
      generatedLanding = JSON.parse(jsonMatch[0])
      console.log('[17] JSON parsed OK')
      console.log('[17] Config keys:', Object.keys(generatedLanding.config || {}))
    } catch (e) {
      console.error('[17] JSON parse error:', (e as Error).message)
      console.error('[17] JSON text:', jsonMatch[0].substring(0, 200))
      return NextResponse.json(
        { error: 'Erreur de parsing — réponse invalide' },
        { status: 500 }
      )
    }

    // Validate fields
    if (typeof generatedLanding.html !== 'string') {
      console.error('[18] html field invalid, type:', typeof generatedLanding.html)
      return NextResponse.json({ error: 'Field html invalid' }, { status: 400 })
    }
    if (typeof generatedLanding.css !== 'string') {
      console.error('[18] css field invalid, type:', typeof generatedLanding.css)
      return NextResponse.json({ error: 'Field css invalid' }, { status: 400 })
    }
    if (!generatedLanding.config || typeof generatedLanding.config !== 'object') {
      console.error('[18] config field invalid, type:', typeof generatedLanding.config)
      return NextResponse.json({ error: 'Field config invalid' }, { status: 400 })
    }
    console.log('[18] Field validation OK')

    // Sanitize HTML
    const sanitized = sanitizeHtml(generatedLanding.html)
    generatedLanding.html = sanitized
    console.log('[19] HTML sanitized')

    // Check for existing deallink (UPSERT)
    const svc = createServiceClient()
    const { data: existing } = await svc
      .from('deallinks_v2')
      .select('id, public_slug')
      .eq('user_id', user.id)
      .eq('prospect_name', prospect_name)
      .eq('company_name', safeCompanyName)
      .maybeSingle()

    console.log('[20] Existing deallink check:', existing ? 'found' : 'new')

    const publicSlug = existing?.public_slug || generatePublicSlug()
    console.log('[21] Public slug:', publicSlug)

    const { data: deallink, error: upsertErr } = await svc
      .from('deallinks_v2')
      .upsert(
        [
          {
            id: existing?.id,
            user_id: user.id,
            prospect_name,
            company_name: safeCompanyName,
            deal_type,
            deal_context,
            deal_value: deal_value ? parseFloat(deal_value as string) : null,
            template_name: 'clean_enterprise',
            config: generatedLanding.config,
            html_rendered: generatedLanding.html,
            css_rendered: generatedLanding.css,
            status: 'draft',
            public_slug: publicSlug,
            updated_at: new Date().toISOString(),
          },
        ],
        {
          onConflict: 'id',
        }
      )
      .select()
      .single()

    if (upsertErr || !deallink) {
      console.error('[22] Upsert error:', upsertErr?.message)
      return NextResponse.json({ error: 'Erreur BDD' }, { status: 500 })
    }

    console.log('[22] Deallink created/updated:', deallink.id)

    console.log('[23] SUCCESS - deallink generated')

    return NextResponse.json({
      success: true,
      deallink_id: deallink.id,
      public_slug: deallink.public_slug,
      edit_url: `/deallink/${deallink.id}/edit`,
      preview_url: `/deallink/${deallink.public_slug}`,
    })
  } catch (err) {
    const errMsg = (err as Error).message || String(err)
    console.error('[FINAL ERROR]', errMsg)
    console.error('[Stack]', (err as Error).stack)
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    )
  }
}
