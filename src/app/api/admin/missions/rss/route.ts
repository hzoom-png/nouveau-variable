import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const RSS_SOURCES = [
  {
    name: 'APEC — Cadres commerciaux',
    url: 'https://cadres.apec.fr/rss/offres.rss?motsCles=commercial&typesContrat=MIS,FRE',
  },
  {
    name: 'Indeed France — Mission commerciale',
    url: 'https://fr.indeed.com/rss?q=mission+commerciale+commission&l=France&sort=date',
  },
  {
    name: 'Welcome to the Jungle — Sales Freelance',
    url: 'https://www.welcometothejungle.com/fr/jobs.rss?query=sales&contract_type[]=freelance',
  },
]

export async function GET() {
  return NextResponse.json({
    sources: RSS_SOURCES.map((s, i) => ({ index: i, name: s.name })),
  })
}

export async function POST(req: NextRequest) {
  const adminId = await requireAdminAuth()
  if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { sourceIndex } = await req.json()
  const source = RSS_SOURCES[sourceIndex ?? 0]
  if (!source) return NextResponse.json({ error: 'Source invalide' }, { status: 400 })

  let rssText: string
  try {
    const rssRes = await fetch(source.url, {
      headers: { 'User-Agent': 'NouveauVariable/1.0 contact@nouveauvariable.fr' },
      signal: AbortSignal.timeout(10000),
    })
    if (!rssRes.ok) {
      return NextResponse.json({
        error: `Flux indisponible (${rssRes.status}). Essaie une autre source ou ajoute la mission manuellement.`,
        missions: [],
      }, { status: 502 })
    }
    rssText = await rssRes.text()
  } catch {
    return NextResponse.json({
      error: 'Impossible de contacter cette source. Essaie une autre source ou ajoute la mission manuellement.',
      missions: [],
    }, { status: 502 })
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: 'Tu extrais des données depuis du XML RSS. Tu réponds UNIQUEMENT en JSON valide. Pas de texte. Pas de backticks.',
      messages: [{
        role: 'user',
        content: `Extrait les 8 missions les plus pertinentes pour des commerciaux BtoB français (closing, apport d'affaires, freelance commercial, commission) depuis ce flux RSS.

Pour chaque mission retourne exactement :
{
  "title": "titre",
  "company": "entreprise ou null",
  "description": "2-3 phrases max",
  "remuneration": "rémunération ou null",
  "location": "ville/région ou 'France entière'",
  "remote": true/false,
  "url_source": "lien direct",
  "category": "closing|apport_affaires|freelance|conseil|formation|affiliation|autre",
  "tags": ["tag1","tag2","tag3"]
}

Exclure les offres non pertinentes pour des commerciaux BtoB.
Retourne un array JSON. Si aucune offre pertinente : [].

Flux RSS (8000 premiers caractères) :
${rssText.slice(0, 8000)}`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '')
    const missions = JSON.parse(cleaned)

    return NextResponse.json({ missions, source: source.name, count: missions.length })
  } catch (err: any) {
    console.error('[RSS] Erreur parsing:', err.message)
    return NextResponse.json({ error: 'Erreur analyse du flux.', missions: [] }, { status: 500 })
  }
}
