import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Anthropic from '@anthropic-ai/sdk'
import { generatePublicSlug, sanitizeHtml } from '@/lib/deallink'
import { rateLimit } from '@/lib/rate-limit'
import { consumeTokens } from '@/lib/tokens'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Rate limiting
    const allowed = await rateLimit(`ai:${user.id}`, 10, 60)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Limite atteinte — 10 générations par minute maximum.' },
        { status: 429 }
      )
    }

    // Token consumption
    const tokenCheck = await consumeTokens(user.id, 'deallink').catch(() => ({
      success: true,
      tokensLeft: 0,
      error: undefined,
    }))
    if (!tokenCheck.success) {
      return NextResponse.json(
        {
          error: tokenCheck.error,
          tokensLeft: tokenCheck.tokensLeft,
          code: 'INSUFFICIENT_TOKENS',
        },
        { status: 402 }
      )
    }

    // Parse body
    const body = (await req.json()) as Record<string, unknown>
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
      return NextResponse.json({ error: 'prospect_name requis' }, { status: 400 })
    }
    if (!company_name || typeof company_name !== 'string' || !company_name.trim()) {
      return NextResponse.json({ error: 'company_name requis' }, { status: 400 })
    }
    if (!deal_type || typeof deal_type !== 'string') {
      return NextResponse.json({ error: 'deal_type requis' }, { status: 400 })
    }
    if (!deal_context || typeof deal_context !== 'string' || !deal_context.trim()) {
      return NextResponse.json({ error: 'deal_context requis' }, { status: 400 })
    }

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

    // Anthropic generation
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const valueStr = deal_value ? `${deal_value}€` : 'N/A'
    const toneStr = (tone as string) || 'Professionnel'

    const prompt = `Tu es un expert en landing pages pour deals commerciaux B2B.
Génère une landing page HTML/CSS complète et responsive.

INSTRUCTIONS:
- Réponds UNIQUEMENT en JSON valide (pas de texte explicatif)
- N'utilise aucun framework CSS externe (pas de Tailwind, Bootstrap, etc)
- HTML auto-contenu (inline SVG pour icons, pas d'imports externes)
- CSS inline ou <style> tag uniquement

INPUTS:
Prospect: ${prospect_name} at ${company_name}
Deal Type: ${deal_type}
Context: ${deal_context}
Value: ${valueStr}
Seller: ${user_name || 'Sales Team'}, ${user_title || 'Sales'}
Tone: ${toneStr}
${myContent ? `\nContexte site vendeur:\n${myContent}` : ''}
${clientContent ? `\nContexte site prospect:\n${clientContent}` : ''}

TEMPLATE: Clean Enterprise (professional, B2B, sober)

REQUIREMENTS:
- Fully responsive (320px mobile, 768px tablet, 1200px desktop)
- Smooth animations (GPU optimized)
- Editable fields (mark in config.sections)
- Colors: primary=#2F5446, accent=#C8790A (override via config)
- Fonts: Jost (display), Inter (body) — must be web-safe or Google Fonts compatible
- Sections: Hero + Value Props (3) + Timeline + Gallery placeholder + CTA Footer

SECTIONS:
1. Hero: prospect_name + company_name + deal_type (all editable)
2. Value Props: 3 benefits (generated from deal_context, all editable)
3. Timeline: steps to execute (generated from deal_type, all editable)
4. Gallery: placeholder for images ({{ image_1 }}, {{ image_2 }})
5. CTA Footer: "Contact ${user_name || 'Sales'}" (editable)

OUTPUT (strictly JSON, no markdown backticks):
{
  "html": "<html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width'></head><body>...</body></html>",
  "css": "<style>...</style>",
  "config": {
    "colors": {"primary": "#2F5446", "accent": "#C8790A"},
    "fonts": {"display": "Jost", "body": "Inter"},
    "sections": {
      "hero": {"title": "...", "subtitle": "...", "editable": true},
      "value_props": {"items": [{"title": "...", "desc": "..."}, ...]},
      "timeline": {"steps": [{"label": "...", "desc": "..."}, ...]},
      "cta": {"text": "Contact ${user_name || 'Sales'}"}
    }
  }
}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const message = await anthropic.messages.create(
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        signal: controller.signal,
      } as Parameters<typeof anthropic.messages.create>[1]
    )

    clearTimeout(timeout)

    // Parse response
    const responseText =
      message.content[0]?.type === 'text' ? message.content[0].text : ''

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[deallink/generate] JSON not found in response:', responseText.slice(0, 200))
      return NextResponse.json(
        { error: 'Erreur de génération — réponse invalide' },
        { status: 500 }
      )
    }

    let generatedLanding
    try {
      generatedLanding = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error('[deallink/generate] JSON parse error:', e)
      return NextResponse.json(
        { error: 'Erreur de parsing — réponse invalide' },
        { status: 500 }
      )
    }

    // Validate fields
    if (typeof generatedLanding.html !== 'string') {
      return NextResponse.json({ error: 'Field html invalid' }, { status: 400 })
    }
    if (typeof generatedLanding.css !== 'string') {
      return NextResponse.json({ error: 'Field css invalid' }, { status: 400 })
    }
    if (!generatedLanding.config || typeof generatedLanding.config !== 'object') {
      return NextResponse.json({ error: 'Field config invalid' }, { status: 400 })
    }

    // Sanitize HTML
    const sanitized = sanitizeHtml(generatedLanding.html)
    generatedLanding.html = sanitized

    // Check for existing deallink (UPSERT)
    const svc = createServiceClient()
    const { data: existing } = await svc
      .from('deallinks_v2')
      .select('id, public_slug')
      .eq('user_id', user.id)
      .eq('prospect_name', prospect_name)
      .eq('company_name', company_name)
      .maybeSingle()

    const publicSlug = existing?.public_slug || generatePublicSlug()

    const { data: deallink, error: upsertErr } = await svc
      .from('deallinks_v2')
      .upsert(
        [
          {
            id: existing?.id,
            user_id: user.id,
            prospect_name,
            company_name,
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
      console.error('[deallink/generate] upsert error:', upsertErr)
      return NextResponse.json({ error: 'Erreur BDD' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deallink_id: deallink.id,
      public_slug: deallink.public_slug,
      edit_url: `/deallink/${deallink.id}/edit`,
      preview_url: `/deallink/${deallink.public_slug}`,
    })
  } catch (err) {
    console.error('[deallink/generate]', err)
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    )
  }
}
