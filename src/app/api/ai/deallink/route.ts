import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { prospectName, prospectCompany, sector, productName, problem, arguments: args, tone } = body

  if (!prospectName || !productName || !problem) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `Tu es un expert en vente BtoB. Génère un DealLink ultra-personnalisé pour un commercial.

CONTEXTE :
- Prospect : ${prospectName}${prospectCompany ? ` (${prospectCompany})` : ''}
- Secteur : ${sector || 'non précisé'}
- Produit/Service : ${productName}
- Problème adressé : ${problem}
- Arguments clés : ${args || 'aucun'}
- Ton souhaité : ${tone || 'professionnel'}

Génère un JSON STRICT avec exactement cette structure (sans commentaires, sans markdown) :
{
  "score": <nombre entre 1 et 100>,
  "accroche": "<phrase d'accroche percutante max 20 mots>",
  "arguments": [
    { "titre": "<titre argument 1>", "corps": "<explication 2-3 phrases>" },
    { "titre": "<titre argument 2>", "corps": "<explication 2-3 phrases>" },
    { "titre": "<titre argument 3>", "corps": "<explication 2-3 phrases>" }
  ],
  "temoignage": {
    "citation": "<témoignage fictif crédible 2-3 phrases>",
    "auteur": "<Prénom N., Titre, Secteur>"
  },
  "cta": "<appel à l'action court et percutant>",
  "objections": [
    { "objection": "<objection courante>", "reponse": "<réponse courte et efficace>" }
  ]
}`

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Réponse IA invalide' }, { status: 500 })

    const result = JSON.parse(jsonMatch[0])

    // Generate slug
    const slug = `${prospectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`

    // Save to database
    await supabase.from('deallinks').insert({
      owner_id: user.id,
      prospect_name: prospectName,
      prospect_company: prospectCompany || null,
      prospect_sector: sector || null,
      product_name: productName,
      slug,
      score: result.score,
      content: result,
    })

    return NextResponse.json({ success: true, result, slug })
  } catch (err) {
    console.error('AI error:', err)
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 500 })
  }
}
