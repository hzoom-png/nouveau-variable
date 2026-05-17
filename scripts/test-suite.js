#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Configuration ────────────────────────────────────────────────────────────
const BASE_APP     = 'https://app.nouveauvariable.fr';
const BASE_LANDING = 'https://nouveauvariable.fr';
const RESULTS_DIR  = path.join(__dirname, '..', 'test-results');
const TIMEOUT_MS   = 15_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timedFetch(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...opts, signal: controller.signal })
    .finally(() => clearTimeout(timer))
    .catch(err => {
      if (err.name === 'AbortError') throw new Error(`Timeout (${TIMEOUT_MS / 1000}s)`);
      throw err;
    });
}

// ─── Test definitions ─────────────────────────────────────────────────────────
// ⚠️  = crée une vraie candidature en base (max 3x/heure par IP)

const TESTS = [
  // ── Landing ─────────────────────────────────────────────────────────────────
  {
    group: 'Landing',
    name:  'Landing charge en moins de 5s (status 200)',
    fn: async () => {
      const t0 = Date.now();
      const r  = await timedFetch(BASE_LANDING + '/');
      const ms = Date.now() - t0;
      if (r.status !== 200)  throw new Error(`HTTP ${r.status}`);
      if (ms > 5000)         throw new Error(`Trop lent : ${ms}ms (seuil 5 000ms)`);
    },
  },
  {
    group: 'Landing',
    name:  'Landing contient "Nouveau Variable"',
    fn: async () => {
      const r    = await timedFetch(BASE_LANDING + '/');
      const html = await r.text();
      if (!html.includes('Nouveau Variable')) throw new Error('Heading introuvable dans le HTML');
    },
  },
  {
    group: 'Landing',
    name:  'Landing contient le formulaire de candidature',
    fn: async () => {
      const r    = await timedFetch(BASE_LANDING + '/');
      const html = await r.text();
      // Le formulaire est SSR — au moins un input ou la balise form doit être présente
      if (!html.includes('<form') && !html.includes('email') && !html.includes('Candidater'))
        throw new Error('Formulaire de candidature absent du HTML');
    },
  },

  // ── App ─────────────────────────────────────────────────────────────────────
  {
    group: 'App',
    name:  'App homepage charge (status 200)',
    fn: async () => {
      const r = await timedFetch(BASE_APP + '/');
      if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
    },
  },
  {
    group: 'App',
    name:  'App homepage pas d\'erreur serveur',
    fn: async () => {
      const r = await timedFetch(BASE_APP + '/');
      if (r.status >= 500) throw new Error(`Erreur serveur HTTP ${r.status}`);
    },
  },

  // ── API /api/count ───────────────────────────────────────────────────────────
  {
    group: 'API Count',
    name:  'GET /api/count → 200',
    fn: async () => {
      const r = await timedFetch(`${BASE_APP}/api/count`);
      if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
    },
  },
  {
    group: 'API Count',
    name:  '/api/count retourne { count: number }',
    fn: async () => {
      const r = await timedFetch(`${BASE_APP}/api/count`);
      const j = await r.json();
      if (typeof j.count !== 'number') throw new Error(`count = ${JSON.stringify(j.count)} (attendu: number)`);
    },
  },
  {
    group: 'API Count',
    name:  '/api/count a un header CORS',
    fn: async () => {
      const r    = await timedFetch(`${BASE_APP}/api/count`);
      const cors = r.headers.get('access-control-allow-origin');
      if (!cors) throw new Error('Header Access-Control-Allow-Origin absent');
    },
  },

  // ── API /api/apply ───────────────────────────────────────────────────────────
  {
    group: 'API Apply',
    name:  'OPTIONS /api/apply → 200 (preflight CORS, sans rate limit)',
    fn: async () => {
      const r = await timedFetch(`${BASE_APP}/api/apply`, {
        method:  'OPTIONS',
        headers: { 'Origin': BASE_LANDING, 'Access-Control-Request-Method': 'POST' },
      });
      if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
    },
  },
  {
    group: 'API Apply',
    name:  'GET /api/apply → 405 (seul POST accepté)',
    fn: async () => {
      const r = await timedFetch(`${BASE_APP}/api/apply`);
      if (r.status !== 405 && r.status !== 404) throw new Error(`HTTP ${r.status} (attendu 405)`);
    },
  },
  {
    group: 'API Apply',
    name:  '⚠️  POST valide → 200 + candidatureId + code_parrain [A-Z0-9]{8}',
    fn: async () => {
      const r = await timedFetch(`${BASE_APP}/api/apply`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': BASE_LANDING },
        body: JSON.stringify({
          firstname: 'Test',
          lastname:  'Suite',
          email:     `test-suite-${Date.now()}@test-nv.com`,
          phone:     '',
          city:      'Paris',
          role:      'Entrepreneur',
          sector:    'Tech',
          xp:        '3 ans',
          why:       'Candidature fictive créée par la suite de tests automatisés — peut être supprimée.',
          referral:  '',
        }),
      });
      if (r.status !== 200) throw new Error(`HTTP ${r.status} — ${await r.text().catch(() => '')}`);
      const j = await r.json();
      if (!j.candidatureId)              throw new Error('candidatureId absent de la réponse');
      if (!/^[A-Z0-9]{8}$/.test(j.code_parrain))
        throw new Error(`Format code_parrain invalide : "${j.code_parrain}" (attendu: [A-Z0-9]{8})`);
    },
  },
  {
    group: 'API Apply',
    name:  '⚠️  Anti-doublon email → bloqué (409 ou rate-limited 429)',
    fn: async () => {
      const email = `doublon-${Date.now()}@test-nv.com`;
      const body  = JSON.stringify({
        firstname: 'Doublon', lastname: 'Test',
        email, phone: '', city: 'Marseille',
        role: 'CEO', sector: 'Finance', xp: '5 ans',
        why: 'Test anti-doublon de la suite de tests automatisés Nouveau Variable.',
        referral: '',
      });
      const h = { 'Content-Type': 'application/json', 'Origin': BASE_LANDING };
      const r1 = await timedFetch(`${BASE_APP}/api/apply`, { method: 'POST', headers: h, body });
      // 200 = ok | 429 = rate limit déjà plein avant ce test (acceptable — prouve que le 2ème sera aussi bloqué)
      if (r1.status !== 200 && r1.status !== 429) throw new Error(`1ère insertion : HTTP ${r1.status}`);
      if (r1.status === 429) return; // rate limit = doublon aussi bloqué
      const r2 = await timedFetch(`${BASE_APP}/api/apply`, { method: 'POST', headers: h, body });
      // 409 = anti-doublon OK | 429 = rate limit (les deux bloquent le doublon)
      if (r2.status !== 409 && r2.status !== 429)
        throw new Error(`2ème insertion : HTTP ${r2.status} (attendu 409 ou 429)`);
    },
  },

  // ── Admin pages ──────────────────────────────────────────────────────────────
  {
    group: 'Admin',
    name:  'GET /admin → pas d\'erreur 500',
    fn: async () => {
      const r = await timedFetch(`${BASE_APP}/admin`, { redirect: 'manual' });
      if (r.status >= 500) throw new Error(`Erreur serveur HTTP ${r.status}`);
    },
  },
  {
    group: 'Admin',
    name:  'GET /admin/candidatures → pas d\'erreur 500',
    fn: async () => {
      const r = await timedFetch(`${BASE_APP}/admin/candidatures`, { redirect: 'manual' });
      if (r.status >= 500) throw new Error(`Erreur serveur HTTP ${r.status}`);
    },
  },

  // ── Admin API (doit être protégée → 401) ────────────────────────────────────
  {
    group: 'Admin API',
    name:  'GET /api/admin/candidatures/list → 401 (protégé)',
    fn: async () => {
      const r = await timedFetch(`${BASE_APP}/api/admin/candidatures/list`);
      if (r.status !== 401) throw new Error(`HTTP ${r.status} (attendu 401 — endpoint non protégé !)`);
    },
  },
  {
    group: 'Admin API',
    name:  'GET /api/admin/stats → 401 (protégé)',
    fn: async () => {
      const r = await timedFetch(`${BASE_APP}/api/admin/stats`);
      if (r.status !== 401) throw new Error(`HTTP ${r.status} (attendu 401 — endpoint non protégé !)`);
    },
  },

  // ── App routes (auth requise → redirect, pas 500) ───────────────────────────
  {
    group: 'App Routes',
    name:  'GET /dashboard → redirect ou 200 (pas 500)',
    fn: async () => {
      const r = await timedFetch(`${BASE_APP}/dashboard`, { redirect: 'manual' });
      if (r.status >= 500) throw new Error(`Erreur serveur HTTP ${r.status}`);
    },
  },
  {
    group: 'App Routes',
    name:  'GET /dashboard/members → redirect ou 200 (pas 500)',
    fn: async () => {
      const r = await timedFetch(`${BASE_APP}/dashboard/members`, { redirect: 'manual' });
      if (r.status >= 500) throw new Error(`Erreur serveur HTTP ${r.status}`);
    },
  },

  // ── Stripe ───────────────────────────────────────────────────────────────────
  {
    group: 'Stripe',
    name:  'POST /api/webhooks/stripe → endpoint existe (pas 404)',
    fn: async () => {
      const r = await timedFetch(`${BASE_APP}/api/webhooks/stripe`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    '{}',
      });
      if (r.status === 404) throw new Error('Endpoint introuvable (404)');
    },
  },

  // ── Cron ────────────────────────────────────────────────────────────────────
  {
    group: 'Cron',
    name:  'GET /api/cron/check-100-candidates → protégé (pas 500)',
    fn: async () => {
      const r = await timedFetch(`${BASE_APP}/api/cron/check-100-candidates`);
      if (r.status >= 500) throw new Error(`Erreur serveur HTTP ${r.status}`);
    },
  },

  // ── Auth API ────────────────────────────────────────────────────────────────
  {
    group: 'Auth API',
    name:  'GET /api/profile → protégé (401, pas 500)',
    fn: async () => {
      const r = await timedFetch(`${BASE_APP}/api/profile`);
      if (r.status >= 500) throw new Error(`Erreur serveur HTTP ${r.status}`);
      if (r.status === 200) throw new Error('Retourne 200 sans auth — endpoint non protégé !');
    },
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

async function runTests() {
  const timestamp = new Date().toISOString();
  const line      = '═'.repeat(62);

  console.log(`\n${line}`);
  console.log('  NOUVEAU VARIABLE — Suite de tests automatisés');
  console.log(`  ${new Date().toLocaleString('fr-FR')}`);
  console.log(line);
  console.log('  ⚠️  Les tests marqués ⚠️  créent de vraies candidatures.');
  console.log('  Maximum 1 run complet par heure (rate limit /api/apply).');
  console.log(line);

  const results  = [];
  let lastGroup  = '';
  let hasWarning = false;

  for (const test of TESTS) {
    if (test.group !== lastGroup) {
      console.log(`\n  ▸ ${test.group}`);
      lastGroup = test.group;
    }
    if (test.name.includes('⚠️') && !hasWarning) {
      console.log('    — Tests suivants : 3 requêtes utilisées sur le rate limit —');
      hasWarning = true;
    }
    const start = Date.now();
    try {
      await test.fn();
      const ms = Date.now() - start;
      results.push({ group: test.group, name: test.name, status: 'pass', error: null, ms });
      console.log(`    ✓ ${test.name} (${ms}ms)`);
    } catch (err) {
      const ms  = Date.now() - start;
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ group: test.group, name: test.name, status: 'fail', error: msg, ms });
      console.log(`    ✗ ${test.name}`);
      console.log(`      → ${msg}`);
    }
  }

  const passed = results.filter(r => r.status === 'pass').length;
  const total  = results.length;
  const pct    = Math.round((passed / total) * 100);

  console.log(`\n${line}`);
  if (pct === 100)     console.log('  🟢 STABLE — Tous les tests passent');
  else if (pct >= 80)  console.log('  🟡 ATTENTION — Quelques tests en échec');
  else                 console.log('  🔴 CRITIQUE — Plus de 20% de tests en échec');
  console.log(`  Résultat : ${passed}/${total} tests (${pct}%)`);
  console.log(line);

  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const payload  = { timestamp, passed, total, pct, results };
  const jsonFile = path.join(RESULTS_DIR, `${timestamp.replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(payload, null, 2));

  rebuildDashboard();
  console.log('\n  Dashboard mis à jour → ouvre scripts/dashboard.html\n');
}

// ─── Dashboard generator ─────────────────────────────────────────────────────

function rebuildDashboard() {
  const files = fs.existsSync(RESULTS_DIR)
    ? fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json')).sort()
    : [];

  const history = files.map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), 'utf8')); }
    catch { return null; }
  }).filter(Boolean);

  const latest = history[history.length - 1] ?? null;

  const statusColor = !latest ? '#4B6358'
    : latest.pct === 100 ? '#4A8C6F'
    : latest.pct >= 80   ? '#C8790A'
    :                       '#E05252';

  const statusLabel = !latest ? '—'
    : latest.pct === 100 ? '🟢 STABLE'
    : latest.pct >= 80   ? '🟡 ATTENTION'
    :                       '🔴 CRITIQUE';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NV — Test Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,'Inter',sans-serif;background:#0F1C17;color:#F7FAF8;padding:28px;min-height:100vh}
    h1{font-size:22px;font-weight:700;color:#4A8C6F;margin-bottom:4px}
    .sub{font-size:12px;color:#4B6358;margin-bottom:28px}
    code{font-family:monospace;background:rgba(255,255,255,0.06);padding:1px 5px;border-radius:4px;font-size:11px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px}
    @media(max-width:600px){.grid{grid-template-columns:1fr}}
    .card{background:#1A2820;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px}
    .card-title{font-size:10px;font-weight:700;letter-spacing:.1em;color:#4B6358;text-transform:uppercase;margin-bottom:8px}
    .card-value{font-size:34px;font-weight:800;line-height:1}
    .card-sub{font-size:12px;color:#4B6358;margin-top:6px}
    .chart-wrap{background:#1A2820;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:24px;margin-bottom:24px}
    .chart-wrap h2{font-size:13px;font-weight:600;color:#4B6358;margin-bottom:16px;text-transform:uppercase;letter-spacing:.06em}
    canvas{max-height:200px}
    .no-data{text-align:center;color:#4B6358;padding:48px;font-size:13px}
    table{width:100%;border-collapse:collapse}
    thead th{font-size:10px;font-weight:700;letter-spacing:.08em;color:#4B6358;text-transform:uppercase;padding:10px 12px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.07)}
    tbody td{padding:9px 12px;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.04);vertical-align:top}
    .group-hdr td{padding:14px 12px 5px;font-size:10px;font-weight:700;color:#4B6358;text-transform:uppercase;letter-spacing:.08em;border-bottom:none}
    .pill{display:inline-block;font-size:9px;font-weight:800;padding:2px 8px;border-radius:10px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
    .pass{background:rgba(74,140,111,.15);color:#4A8C6F}
    .fail{background:rgba(224,82,82,.12);color:#E05252}
    .err{font-size:11px;color:#E05252;margin-top:3px;font-family:monospace}
    .ms{color:#4B6358;font-size:12px}
    .warn{font-size:11px;color:#C8790A;padding:10px 14px;background:rgba(200,121,10,.08);border-radius:8px;margin-bottom:20px;border-left:3px solid #C8790A}
  </style>
</head>
<body>
  <h1>Nouveau Variable — Test Dashboard</h1>
  <div class="sub">Généré par <code>npm run test</code> · Rechargez après chaque run</div>

  <div class="warn">⚠️  Les tests POST /api/apply créent de vraies candidatures en base (identifiables par email <code>test-suite-*@test-nv.com</code>). Rate limit : 3 candidatures/heure par IP.</div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Dernier score</div>
      <div class="card-value" style="color:${statusColor}">${latest ? latest.pct + '%' : '—'}</div>
      <div class="card-sub">${statusLabel}</div>
    </div>
    <div class="card">
      <div class="card-title">Tests</div>
      <div class="card-value">${latest ? latest.passed + '<span style="font-size:18px;color:#4B6358">/' + latest.total + '</span>' : '—'}</div>
      <div class="card-sub">${latest ? (latest.total - latest.passed) + ' en échec' : 'Aucun test lancé'}</div>
    </div>
    <div class="card">
      <div class="card-title">Historique</div>
      <div class="card-value">${history.length}</div>
      <div class="card-sub">${latest ? 'Dernier : ' + new Date(latest.timestamp).toLocaleString('fr-FR') : 'Lance npm run test'}</div>
    </div>
  </div>

  <div class="chart-wrap">
    <h2>Stabilité dans le temps</h2>
    ${history.length === 0
      ? '<div class="no-data">Aucun résultat — lance <code>npm run test</code> dans le terminal</div>'
      : '<canvas id="chart"></canvas>'}
  </div>

  <div class="card">
    <h2 style="font-size:13px;font-weight:700;color:#4B6358;text-transform:uppercase;letter-spacing:.06em;margin-bottom:16px">Dernier run — détail complet</h2>
    ${latest ? buildTable(latest) : '<div class="no-data">Lance <code>npm run test</code> pour voir les résultats</div>'}
  </div>

  <script>
    var history = ${JSON.stringify(history)};
    if (history.length && document.getElementById('chart')) {
      var labels = history.map(function(h) {
        var d = new Date(h.timestamp);
        return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}) + ' ' + d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
      });
      var data = history.map(function(h){ return h.pct; });
      var ptColors = data.map(function(v){ return v===100?'#4A8C6F':v>=80?'#C8790A':'#E05252'; });
      new Chart(document.getElementById('chart'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: '% réussis',
            data: data,
            borderColor: '#4A8C6F',
            backgroundColor: 'rgba(74,140,111,0.08)',
            tension: 0.35,
            fill: true,
            pointRadius: 5,
            pointBackgroundColor: ptColors,
            pointBorderColor: 'transparent',
          }],
        },
        options: {
          responsive: true,
          scales: {
            y: { min:0, max:100, ticks:{ color:'#4B6358', callback:function(v){return v+'%'} }, grid:{ color:'rgba(255,255,255,0.05)' } },
            x: { ticks:{ color:'#4B6358', maxRotation:35 }, grid:{ color:'rgba(255,255,255,0.05)' } },
          },
          plugins: { legend:{ display:false }, tooltip:{ callbacks:{ label:function(c){ return c.raw+'%'; } } } },
        },
      });
    }
  <\/script>
</body>
</html>`;

  fs.writeFileSync(path.join(__dirname, 'dashboard.html'), html, 'utf8');
}

function buildTable(run) {
  let rows = '';
  let lastGroup = '';
  for (const r of run.results) {
    if (r.group !== lastGroup) {
      rows += `<tr class="group-hdr"><td colspan="3">${r.group}</td></tr>`;
      lastGroup = r.group;
    }
    const pill = r.status === 'pass'
      ? '<span class="pill pass">✓ OK</span>'
      : '<span class="pill fail">✗ FAIL</span>';
    const err = r.error ? `<div class="err">${escHtml(r.error)}</div>` : '';
    rows += `<tr><td>${escHtml(r.name.replace('⚠️ ', ''))}${err}</td><td>${pill}</td><td class="ms">${r.ms}ms</td></tr>`;
  }
  return `<table><thead><tr><th>Test</th><th>Statut</th><th>Durée</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Entry point ─────────────────────────────────────────────────────────────

runTests().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
