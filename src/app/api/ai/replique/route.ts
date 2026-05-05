import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import type { RepliqueConfig } from '@/app/dashboard/tools/replique/types'
import { rateLimit } from '@/lib/rate-limit'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const OBJECTIVE_LABELS: Record<string, string> = {
  rdv:           'décrocher un rendez-vous',
  qualification: 'qualifier le besoin et le projet',
  barrage:       "passer le barrage secrétaire pour atteindre le décideur",
  relance:       "relancer après envoi d'un document ou d'une proposition",
  closing:       'valider la décision et closer',
  cold:          'faire un cold call et susciter l\'intérêt',
}

const CONTACT_LABELS: Record<string, string> = {
  decision_maker: 'décideur (DG, PDG, DAF, directeur)',
  manager:        'manager intermédiaire',
  secretary:      'secrétaire ou standardiste',
  technical:      'profil technique (DSI, CTO, responsable IT)',
  user:           'utilisateur final du produit',
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401 })

  const allowed = await rateLimit(`ai:${user.id}`, 10, 60)
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Limite atteinte — 10 générations par minute maximum.' }), { status: 429 })
  }

  const { consumeTokens } = await import('@/lib/tokens')
  const tokenCheck = await consumeTokens(user.id, 'replique')
  if (!tokenCheck.success) {
    return new Response(JSON.stringify({ error: tokenCheck.error, code: 'INSUFFICIENT_TOKENS' }), { status: 402 })
  }

  const body = await req.json() as { config: RepliqueConfig }
  const config = body.config

  if (!config.product || !config.objective || !config.contact_type) {
    return new Response(JSON.stringify({ error: 'Champs obligatoires manquants' }), { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('commercial_context, display_name')
    .eq('id', user.id)
    .single()
  const ctx = (profile?.commercial_context ?? {}) as Record<string, string>

  const prompt = `Tu es un formateur commercial expert, auteur de scripts d'appels BtoB.
Tu as formé des centaines de commerciaux français sur la prospection téléphonique.
Tu connais les techniques SPIN Selling, MEDDIC, Challenger Sale et l'école française de la vente consultative.

MISSION : Générer un script d'appel complet, opérationnel, immédiatement utilisable.
Pas de théorie. Du concret. Chaque mot doit pouvoir être dit à voix haute.

CONTEXTE COMMERCIAL :
- Produit / service : ${config.product}
- Proposition de valeur : ${config.valueprop || ctx.value_prop || 'non précisée'}
- Interlocuteur : ${CONTACT_LABELS[config.contact_type]}
- Titre exact : ${config.contact_role || 'non précisé'}
- Secteur de l'entreprise cible : ${config.company_sector || 'non précisé'}
- Taille entreprise : ${config.company_size || 'non précisée'}
- Objectif de l'appel : ${OBJECTIVE_LABELS[config.objective]}
- Premier contact : ${config.previous_contact ? 'Non, déjà en contact' : 'Oui, cold call'}
- Contexte additionnel : ${config.context || 'aucun'}
- Douleur connue : ${config.known_pain || 'aucune'}

RÈGLES :
1. Script dit, pas lu — langage oral, naturel, jamais corporate
2. Chaque bloc a une durée indicative
3. Questions ouvertes provoquant la réflexion
4. Rebonds chaleureux, jamais défensifs
5. CTA unique, direct, proposant 2 options (jamais oui/non)
6. Pour barrage : ton assuré, jamais suppliant
7. Pour closing : urgence sans pression agressive
8. Adapte le registre au profil

FORMAT JSON UNIQUEMENT (aucun texte autour) :
{
  "blocks": [{"id":"hook","type":"hook","label":"Accroche d'ouverture","content":"texte exact","tip":"conseil","duration":"~10 sec"}],
  "objections": [{"objection":"objection probable","rebound":"réponse exacte","tone_tip":"conseil de ton"}],
  "dos": ["conseil 1","conseil 2","conseil 3"],
  "donts": ["erreur 1","erreur 2","erreur 3"],
  "estimated_duration": "2 à 3 minutes",
  "difficulty": "moyen"
}

BLOCS selon l'objectif "${config.objective}" :
${config.objective === 'barrage' ? 'hook → barrage_approach → if_transferred → pitch_15s → cta' : ''}
${config.objective === 'rdv' || config.objective === 'cold' ? 'hook → pitch_30s → question_ouverture → traitement_contexte → cta' : ''}
${config.objective === 'qualification' ? 'hook → rappel_contexte → question_budget → question_projet → question_decision → question_timing → synthese → cta' : ''}
${config.objective === 'relance' ? 'hook → reference_envoi → question_retour → recentrage_valeur → cta' : ''}
${config.objective === 'closing' ? 'hook → recap_valeur → question_decision → traitement_frein → cta' : ''}

Génère 3 à 5 objections probables avec leurs rebonds.`

  const encoder = new TextEncoder()
  let accumulated = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4000,
          system: 'Tu es un expert en techniques de vente BtoB. Tu réponds UNIQUEMENT en JSON valide, sans aucun texte avant ni après, sans balises markdown, sans backticks. Commence directement par { et termine par }.',
          messages: [{ role: 'user', content: prompt }],
        })

        for await (const chunk of anthropicStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            accumulated += chunk.delta.text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk.delta.text })}\n\n`))
          }
        }

        // Save to DB after streaming
        try {
          const result = JSON.parse(accumulated)
          void supabase.from('replique_scripts').insert({
            user_id: user.id,
            config: body.config,
            blocks: result.blocks ?? [],
            objections: result.objections ?? [],
            dos: result.dos ?? [],
            donts: result.donts ?? [],
            estimated_duration: result.estimated_duration,
            difficulty: result.difficulty,
          })
        } catch (e) {
          console.error('[Réplique API] Échec sauvegarde DB — JSON invalide:', e instanceof Error ? e.message : 'parse error')
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        controller.close()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`))
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
