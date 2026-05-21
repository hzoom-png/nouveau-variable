import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const STAGE_LABELS: Record<string, string> = {
  idea:       'Idée (pré-validation)',
  validation: 'Validation (interviews clients)',
  build:      'Construction (développement)',
  launch:     'Lancement (mise sur le marché)',
  growth:     'Croissance (scale)',
}

export type AssumptionRow = {
  category: string
  key: string
  value: string
  unit?: string
  is_key: boolean
  order_index: number
}

export type ForecastPeriod = {
  period: string
  mrr?: number
  arr?: number
  churn?: number
  cac?: number
  ltv?: number
  cashflow: number
  status: 'negative' | 'breakeven' | 'positive'
}

export type ForecastSummary = {
  total_revenue: number
  total_cost: number
  breakeven_month?: number | null
  final_status: 'negative' | 'breakeven' | 'positive'
}

export async function generateAssumptions(project: {
  name: string
  description?: string | null
  objective?: string | null
  stage?: string | null
  concept?: string | null
  bmc?: unknown
}): Promise<AssumptionRow[]> {
  const prompt = `Tu es un expert financier spécialisé dans les projets entrepreneuriaux.

PROJET :
- Nom : ${project.name}
- Description : ${project.description || 'non précisée'}
- Objectif : ${project.objective || 'non précisé'}
- Stade : ${STAGE_LABELS[project.stage || 'idea']}
- Concept : ${project.concept || 'non précisé'}
${project.bmc ? `- Business Model Canvas : ${JSON.stringify(project.bmc)}` : ''}

Génère les hypothèses financières clés structurées. Le champ "category" doit être EXACTEMENT l'une de ces 5 valeurs (en majuscules, en français, sans variation) :
- "TARIFICATION" : prix abonnement, tarifs, freemium, upsell
- "CAC" : coût d'acquisition client par canal
- "RETENTION" : taux de churn mensuel, LTV calculée
- "COUTS" : coûts fixes mensuels, coûts variables, infrastructure
- "CROISSANCE" : taux de croissance mensuel, objectifs clients

IMPORTANT : Tous les textes (category, key, unit) doivent être en français uniquement. N'utilise aucune autre langue.

FORMAT JSON UNIQUEMENT, sans texte autour :
[
  {
    "category": "TARIFICATION",
    "key": "Abonnement mensuel Pro",
    "value": "49",
    "unit": "€/mois",
    "is_key": true,
    "order_index": 0
  }
]

Génère 15 à 25 hypothèses couvrant toutes les catégories. Valeurs réalistes pour le stade ${STAGE_LABELS[project.stage || 'idea']}.
is_key = true pour les 5 à 8 hypothèses les plus critiques.
order_index = position dans la catégorie (0, 1, 2…).`

  const response = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 3000,
    system:     'Tu es un expert financier français. Tu réponds UNIQUEMENT en JSON valide (tableau JSON), sans aucun texte avant ni après, sans backticks, sans markdown. Tous les textes dans le JSON sont en français. Le champ "category" ne peut être que l\'une de ces valeurs exactes : "TARIFICATION", "CAC", "RETENTION", "COUTS", "CROISSANCE".',
    messages:   [{ role: 'user', content: prompt }],
  }, { timeout: 15_000 })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '')
  return JSON.parse(cleaned) as AssumptionRow[]
}

export async function generateForecast(params: {
  project: { name: string; description?: string | null; stage?: string | null }
  assumptions: Array<{ category: string; key: string; value: string; unit?: string | null }>
  duration_months: number
  granularity: 'monthly' | 'quarterly' | 'annual'
}): Promise<{ forecast_data: ForecastPeriod[]; forecast_summary: ForecastSummary }> {
  const { project, assumptions, duration_months, granularity } = params

  const periods = granularity === 'monthly'   ? duration_months
    : granularity === 'quarterly' ? Math.ceil(duration_months / 3)
    : Math.ceil(duration_months / 12)

  const periodLabel = granularity === 'monthly' ? 'M' : granularity === 'quarterly' ? 'Q' : 'A'

  const prompt = `Tu es un expert en modélisation financière pour startups et side hustles.

PROJET : ${project.name}
STADE : ${STAGE_LABELS[project.stage || 'idea']}

HYPOTHÈSES :
${assumptions.map(a => `- [${a.category}] ${a.key}: ${a.value}${a.unit ? ' ' + a.unit : ''}`).join('\n')}

Génère un prévisionnel sur ${duration_months} mois (granularité: ${granularity}).
Génère exactement ${periods} périodes de ${periodLabel}1 à ${periodLabel}${periods}.

FORMAT JSON UNIQUEMENT :
{
  "forecast_data": [
    {
      "period": "${periodLabel}1",
      "mrr": 0,
      "arr": 0,
      "churn": 0.05,
      "cac": 150,
      "ltv": 500,
      "cashflow": -2000,
      "status": "negative"
    }
  ],
  "forecast_summary": {
    "total_revenue": 0,
    "total_cost": 0,
    "breakeven_month": 8,
    "final_status": "positive"
  }
}

Règles :
- status = "negative" si cashflow < -100, "breakeven" si entre -100 et +100, "positive" si > +100
- breakeven_month = numéro du mois calendaire du premier cashflow cumulé positif (null si jamais atteint)
- mrr/arr en euros, cashflow = revenus - coûts de la période
- Utilise les hypothèses pour calculer des chiffres réalistes et cohérents entre eux`

  const response = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    system:     'Tu es un expert financier. Tu réponds UNIQUEMENT en JSON valide, sans aucun texte avant ni après, sans backticks.',
    messages:   [{ role: 'user', content: prompt }],
  }, { timeout: 15_000 })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '')
  return JSON.parse(cleaned) as { forecast_data: ForecastPeriod[]; forecast_summary: ForecastSummary }
}
