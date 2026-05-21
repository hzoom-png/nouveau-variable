import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { escHtml } from '@/lib/html-escape'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Non authentifié', { status: 401 })

  const svc = createServiceClient()

  const { data: sh } = await svc
    .from('sidehustle_projects')
    .select('id, name, description, objective, concept, stage, bmc, forecast')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!sh) return new Response('Projet introuvable', { status: 404 })

  const [{ data: assumptions }, { data: aiForecasts }] = await Promise.all([
    svc.from('side_hustle_assumptions')
      .select('category, key, value, unit, is_key')
      .eq('project_id', id)
      .order('category').order('order_index'),
    svc.from('side_hustle_forecasts')
      .select('duration_months, granularity, forecast_data, forecast_summary, generated_at')
      .eq('project_id', id)
      .eq('is_current', true)
      .order('duration_months')
      .limit(1),
  ])

  return new Response(buildHtml(sh, assumptions ?? [], aiForecasts?.[0] ?? null), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

const STAGE_LABELS: Record<string, string> = {
  idea: 'Idée', validation: 'Validation', build: 'Construction', launch: 'Lancement', growth: 'Croissance',
}

const BMC_LABELS: [string, string][] = [
  ['value_proposition',    'Proposition de valeur'],
  ['customer_segments',    'Segments clients'],
  ['channels',             'Canaux'],
  ['customer_relationships','Relations clients'],
  ['revenue_streams',      'Sources de revenus'],
  ['key_resources',        'Ressources clés'],
  ['key_activities',       'Activités clés'],
  ['key_partnerships',     'Partenaires clés'],
  ['cost_structure',       'Structure de coûts'],
]

function buildHtml(sh: Record<string, unknown>, assumptions: Record<string, unknown>[], forecast: Record<string, unknown> | null): string {
  const bmc = sh.bmc as Record<string, string> | null

  const bmcHtml = bmc
    ? BMC_LABELS.map(([key, label]) => `
        <div class="bmc-cell">
          <div class="bmc-cell-title">${label}</div>
          <div class="bmc-cell-body">${escHtml(String(bmc[key] || '—'))}</div>
        </div>`).join('')
    : '<p class="empty">Business Model Canvas non généré.</p>'

  const byCategory: Record<string, Record<string, unknown>[]> = {}
  for (const a of assumptions) {
    const cat = String(a.category)
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(a)
  }

  const assumptionsHtml = Object.entries(byCategory).map(([cat, rows]) => `
    <div style="margin-bottom:16px">
      <div class="cat-title">${escHtml(cat)}</div>
      <table class="data-table">
        <thead><tr><th>Hypothèse</th><th>Valeur</th></tr></thead>
        <tbody>
          ${rows.map(r => `<tr><td>${escHtml(String(r.key))}</td><td><strong>${escHtml(String(r.value))}${r.unit ? ' ' + escHtml(String(r.unit)) : ''}</strong></td></tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('')

  let forecastHtml = '<p class="empty">Prévisionnel IA non généré. Génère-le depuis l\'outil Side Hustle.</p>'
  if (forecast) {
    const data = (forecast.forecast_data as Record<string, unknown>[] | null) ?? []
    const summary = (forecast.forecast_summary as Record<string, unknown> | null) ?? {}
    forecastHtml = `
      <div class="summary-grid">
        <div class="summary-card"><div class="summary-label">Revenu total</div><div class="summary-value">${Number(summary.total_revenue ?? 0).toLocaleString('fr-FR')} €</div></div>
        <div class="summary-card"><div class="summary-label">Coûts totaux</div><div class="summary-value">${Number(summary.total_cost ?? 0).toLocaleString('fr-FR')} €</div></div>
        <div class="summary-card"><div class="summary-label">Rentabilité</div><div class="summary-value">${summary.breakeven_month ? `Mois ${summary.breakeven_month}` : '—'}</div></div>
        <div class="summary-card"><div class="summary-label">Statut final</div><div class="summary-value">${escHtml(String(summary.final_status ?? '—'))}</div></div>
      </div>
      <table class="data-table">
        <thead><tr><th>Période</th><th>MRR</th><th>Cashflow</th><th>Status</th></tr></thead>
        <tbody>
          ${data.map(p => {
            const cf = Number(p.cashflow ?? 0)
            const cls = cf >= 100 ? 'positive' : cf <= -100 ? 'negative' : ''
            return `<tr><td>${escHtml(String(p.period))}</td><td>${p.mrr != null ? Number(p.mrr).toLocaleString('fr-FR') + ' €' : '—'}</td><td class="${cls}">${cf.toLocaleString('fr-FR')} €</td><td>${escHtml(String(p.status ?? ''))}</td></tr>`
          }).join('')}
        </tbody>
      </table>`
  }

  const date = new Date().toLocaleDateString('fr-FR')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${escHtml(String(sh.name))} — Nouveau Variable</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0F1C17;background:#fff;font-size:14px}
    .page{max-width:900px;margin:0 auto;padding:40px 32px}
    header{border-bottom:2px solid #2F5446;padding-bottom:20px;margin-bottom:32px;display:flex;justify-content:space-between;align-items:flex-end}
    .logo{font-size:12px;font-weight:800;color:#2F5446;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px}
    h1{font-size:24px;font-weight:800;color:#0F1C17;margin-bottom:4px}
    .subtitle{font-size:13px;color:#4B6358}
    .badge{display:inline-block;padding:3px 10px;border-radius:99px;background:#EAF2EE;color:#2F5446;font-size:11px;font-weight:700}
    section{margin-bottom:36px}
    section h2{font-size:15px;font-weight:800;color:#2F5446;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #E4EEEA}
    .bmc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    .bmc-cell{border:1px solid #E4EEEA;border-radius:8px;padding:12px}
    .bmc-cell-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#2F5446;margin-bottom:6px}
    .bmc-cell-body{font-size:12px;line-height:1.6;color:#374151}
    .cat-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#2F5446;margin-bottom:8px}
    .data-table{width:100%;border-collapse:collapse;font-size:12px}
    .data-table th{background:#EAF2EE;padding:8px 12px;text-align:left;font-weight:700;color:#2F5446;border:1px solid #D4E8DF}
    .data-table td{padding:7px 12px;border:1px solid #E4EEEA;color:#374151}
    .data-table tr:nth-child(even) td{background:#F7FAF8}
    .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
    .summary-card{border:1px solid #E4EEEA;border-radius:8px;padding:12px;text-align:center}
    .summary-label{font-size:10px;color:#4B6358;font-weight:600;margin-bottom:6px}
    .summary-value{font-size:15px;font-weight:800;color:#2F5446}
    .positive{color:#16a34a;font-weight:700}
    .negative{color:#dc2626;font-weight:700}
    .empty{font-size:13px;color:#9CA3AF;font-style:italic}
    footer{border-top:1px solid #E4EEEA;padding-top:14px;margin-top:36px;display:flex;justify-content:space-between;font-size:11px;color:#9CA3AF}
    .confidential{color:#dc2626;font-weight:700}
    .print-btn{position:fixed;top:16px;right:16px;padding:10px 20px;background:#2F5446;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(47,84,70,.3)}
    @media print{.print-btn{display:none}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:20px}section{page-break-inside:avoid}}
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Imprimer / Enregistrer PDF</button>
  <div class="page">
    <header>
      <div>
        <div class="logo">Nouveau Variable</div>
        <h1>${escHtml(String(sh.name))}</h1>
        ${sh.description ? `<div class="subtitle">${escHtml(String(sh.description).slice(0, 200))}</div>` : ''}
      </div>
      <div style="text-align:right">
        <span class="badge">${escHtml(STAGE_LABELS[String(sh.stage)] ?? String(sh.stage))}</span>
        <div style="font-size:11px;color:#9CA3AF;margin-top:6px">Généré le ${date}</div>
      </div>
    </header>

    ${sh.objective ? `
    <section>
      <h2>Objectif</h2>
      <p style="font-size:14px;line-height:1.7">${escHtml(String(sh.objective))}</p>
    </section>` : ''}

    ${bmc ? `
    <section>
      <h2>Business Model Canvas</h2>
      <div class="bmc-grid">${bmcHtml}</div>
    </section>` : ''}

    ${assumptions.length > 0 ? `
    <section>
      <h2>Hypothèses financières (${assumptions.length})</h2>
      ${assumptionsHtml}
    </section>` : ''}

    <section>
      <h2>Prévisionnel financier</h2>
      ${forecastHtml}
    </section>

    <footer>
      <span class="confidential">CONFIDENTIEL</span>
      <span>Nouveau Variable · ${escHtml(String(sh.name))} · ${new Date().getFullYear()}</span>
    </footer>
  </div>
</body>
</html>`
}
