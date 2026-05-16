import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const STAGE_LABELS: Record<string, string> = {
  idea:       'Idée (pré-validation)',
  validation: 'Validation (interviews clients)',
  build:      'Construction (développement)',
  launch:     'Lancement (mise sur le marché)',
  growth:     'Croissance (scale)',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401 })

    const { consumeTokens } = await import('@/lib/tokens')
    const tokenCheck = await consumeTokens(user.id, 'sidehustle')
    if (!tokenCheck.success) {
      return new Response(JSON.stringify({ error: tokenCheck.error, code: 'INSUFFICIENT_TOKENS' }), { status: 402 })
    }

    let body: { projectId?: string; name: string; description?: string; objective?: string; target_date?: string; concept?: string; stage?: string }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Body invalide' }), { status: 400 })
    }

    if (!body.name) {
      return new Response(JSON.stringify({ error: 'Champ "name" obligatoire' }), { status: 400 })
    }

    const prompt = `Tu es un expert en stratégie entrepreneuriale et développement business.

PROJET SIDE HUSTLE :
- Nom : ${body.name}
- Description : ${body.description || 'non précisée'}
- Objectif principal : ${body.objective || 'non précisé'}
- Date cible : ${body.target_date || 'non précisée'}
- Stade actuel : ${STAGE_LABELS[body.stage || 'idea']}
- Concept détaillé : ${body.concept || 'non précisé'}

Génère un plan complet : roadmap par phases, Business Model Canvas complet (9 blocs), et prévisionnel 12 mois.

FORMAT JSON UNIQUEMENT, sans texte autour, sans backticks :
{
  "roadmap": [
    {
      "phase": "Phase 1 — Validation",
      "duration": "2 semaines",
      "tasks": [
        { "id": "uuid-1", "text": "Interviewer 10 clients potentiels", "done": false }
      ]
    }
  ],
  "bmc": {
    "value_proposition": "...",
    "customer_segments": "...",
    "channels": "...",
    "customer_relationships": "...",
    "revenue_streams": "...",
    "key_resources": "...",
    "key_activities": "...",
    "key_partnerships": "...",
    "cost_structure": "..."
  },
  "forecast": {
    "months": [
      { "month": "M1", "revenue": 0, "costs": 500, "margin": -500 }
    ],
    "assumptions": "Hypothèses clés du prévisionnel..."
  }
}

Génère 4 à 6 phases dans la roadmap. Chaque phase a 4 à 7 tâches concrètes et actionnables. Génère exactement 12 mois dans le prévisionnel.`

    const encoder = new TextEncoder()
    let accumulated = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const aiStream = anthropic.messages.stream({
            model:      'claude-haiku-4-5-20251001',
            max_tokens: 8000,
            system:     'Tu es un expert en stratégie entrepreneuriale. Tu réponds UNIQUEMENT en JSON valide, sans aucun texte avant ni après, sans backticks, sans markdown. Commence directement par { et termine par }.',
            messages:   [{ role: 'user', content: prompt }],
          })

          for await (const chunk of aiStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              accumulated += chunk.delta.text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk.delta.text })}\n\n`))
            }
          }

          // Save to DB
          try {
            const result = JSON.parse(accumulated.trim().replace(/^```json\s*/i,'').replace(/```\s*$/,''))
            const svc = createServiceClient()
            if (body.projectId) {
              await svc.from('sidehustle_projects').update({
                roadmap: result.roadmap, bmc: result.bmc, forecast: result.forecast,
              }).eq('id', body.projectId).eq('user_id', user.id)
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, result })}\n\n`))
          } catch {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          }
          controller.close()
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erreur'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })
  } catch (err) {
    console.error('[Side Hustle API]', err instanceof Error ? err.message : err)
    return new Response(JSON.stringify({ error: 'Erreur interne', code: 'INTERNAL_ERROR' }), { status: 500 })
  }
}
