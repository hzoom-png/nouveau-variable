import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { TerrainProspect } from '@/app/dashboard/tools/terrain/types'
import { consumeTokens } from '@/lib/tokens'

const rateLimitMap = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 10
const WINDOW_MS = 60 * 60 * 1000

type RawProspect = Omit<TerrainProspect, 'id'>

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const now = Date.now()
  const entry = rateLimitMap.get(user.id)
  if (entry && now < entry.reset) {
    if (entry.count >= RATE_LIMIT) {
      return NextResponse.json({ error: 'Limite atteinte. Réessaie dans une heure.' }, { status: 429 })
    }
    entry.count++
  } else {
    rateLimitMap.set(user.id, { count: 1, reset: now + WINDOW_MS })
  }

  const tokenCheck = await consumeTokens(user.id, 'terrain').catch(() => ({ success: true, tokensLeft: 0, error: undefined }))
  if (!tokenCheck.success) {
    return NextResponse.json({ error: tokenCheck.error, tokensLeft: tokenCheck.tokensLeft, code: 'INSUFFICIENT_TOKENS' }, { status: 402 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('commercial_context')
    .eq('id', user.id)
    .single()
  const ctx = (profile?.commercial_context ?? {}) as Record<string, string>

  const body = await request.json()
  const { rawText } = body as { rawText?: string }

  if (!rawText || !rawText.trim()) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const trimmed = rawText.trim().slice(0, 8000)

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const ctxBlock = (ctx.product || ctx.icp) ? `
CONTEXTE COMMERCIAL DU MEMBRE :
Produit / service : ${ctx.product ?? 'non renseigné'}
Client idéal : ${ctx.icp ?? 'non renseigné'}
Proposition de valeur : ${ctx.value_prop ?? 'non renseignée'}
Objections récurrentes : ${ctx.typical_objections ?? 'non renseignées'}
Ton de communication : ${ctx.tone ?? 'professionnel'}

Adapte l'analyse et les angles commerciaux à ce contexte. Les pain points et messages doivent résonner avec ce profil vendeur.
` : ''

  const prompt = `Tu es un expert commercial BtoB.${ctxBlock}
Analyse le texte suivant qui contient des données brutes sur des prospects commerciaux (noms d'entreprises, profils LinkedIn, listes, notes, etc.).

Pour chaque prospect identifié, génère une fiche enrichie avec :
- Entreprise (company)
- Contact (prénom nom, ou "—" si absent)
- Rôle/titre (role, déduit du contexte si nécessaire, ou "—")
- Secteur d'activité (sector, déduit si possible)
- Signal d'opportunité (signal : en 1 phrase, pourquoi ce prospect est pertinent à contacter)
- Score de priorité (score : entier 0-100 basé sur le potentiel commercial détecté)
- Niveau de priorité (priority : "hot" si score ≥ 75, "warm" si score entre 50 et 74, "cold" si score < 50)
- Action recommandée (action : une action concrète courte, ex "Appel de découverte", "Email personnalisé LinkedIn")

TEXTE À ANALYSER :
${trimmed}

Retourne UNIQUEMENT un JSON valide sans markdown ni commentaires :
{
  "prospects": [
    {
      "company": "...",
      "contact": "...",
      "role": "...",
      "sector": "...",
      "signal": "...",
      "score": 80,
      "priority": "hot",
      "action": "..."
    }
  ],
  "summary": "Résumé en 1-2 phrases de l'analyse du terrain commercial."
}

Si aucun prospect identifiable n'est trouvé, retourne {"prospects":[],"summary":"Aucun prospect identifiable dans le texte fourni."}.`

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Réponse invalide' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0]) as { prospects: RawProspect[]; summary: string }
    const prospects = parsed.prospects.map((p, i) => ({ ...p, id: 'tp' + (Date.now() + i) }))

    return NextResponse.json({ prospects, summary: parsed.summary })
  } catch (err) {
    console.error('Terrain AI error:', err)
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('credit') || msg.includes('billing')) {
      return NextResponse.json({ error: 'Crédits insuffisants. Recharge ton compte Anthropic.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Erreur lors de l\'analyse' }, { status: 500 })
  }
}
