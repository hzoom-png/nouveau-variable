import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { text, activity, audience, goal, formats } = body

  if (!text && !activity) {
    return NextResponse.json({ error: 'Contenu ou activité requis' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `Tu es un expert en content marketing BtoB. Génère un plan éditorial complet basé sur ce contexte.

CONTEXTE :
- Activité / Expertise : ${activity || 'non précisé'}
- Audience cible : ${audience || 'commerciaux et dirigeants'}
- Objectif : ${goal || 'visibilité et autorité'}
- Formats souhaités : ${formats?.join(', ') || 'LinkedIn, Articles, Vidéo'}
${text ? `\nCONTENU SOURCE :\n${text.slice(0, 2000)}` : ''}

Génère un JSON STRICT avec exactement cette structure :
{
  "publications": [
    {
      "id": 1,
      "platform": "LinkedIn",
      "format": "Post texte",
      "theme": "<sujet du post>",
      "content": "<contenu complet du post, max 300 mots>",
      "hashtags": ["#tag1", "#tag2", "#tag3"],
      "best_day": "Mardi",
      "best_time": "9h00"
    }
  ],
  "calendar": [
    {
      "week": 1,
      "day": "Lundi",
      "date_label": "Semaine 1",
      "platform": "LinkedIn",
      "theme": "<sujet>",
      "preview": "<aperçu 20 mots>"
    }
  ],
  "ideas_visuels": [
    { "concept": "<idée de visuel>", "format": "Carrousel" }
  ]
}

Génère exactement 10 publications variées (différents formats/plateformes) et 12 entrées calendrier.`

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Réponse IA invalide' }, { status: 500 })

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error('AI error:', err)
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 500 })
  }
}
