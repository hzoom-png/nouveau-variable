# Audit de sécurité — Fixes appliqués

Date : 2026-05-03

---

## Variables d'environnement à ajouter

### `.env.local` (développement) et Vercel Dashboard (production)

| Variable | Valeur | Description |
|---|---|---|
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (Stripe Dashboard → Webhooks → Signing secret) | Validation de signature webhook Stripe |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Clé secrète Stripe pour le webhook |
| `ADMIN_EMAILS` | `ton@email.fr` (séparés par virgule si plusieurs) | Emails autorisés à configurer le TOTP admin |
| `ALLOWED_ORIGIN` | `https://nouveauvariable.fr` | Origine CORS autorisée pour `/api/apply` |
| `BYPASS_REFERRAL_CODES` | `GODMODE` (ou vide en prod) | Codes de parrainage bypass (supprimable en production) |
| `ADMIN_EMAIL` | `gaultier@nouveauvariable.fr` | Email de notification des candidatures |

### Note : `ADMIN_JWT_SECRET` maintenant obligatoire
Le fallback `'dev-secret-CHANGE-IN-PRODUCTION'` a été supprimé. Cette variable **doit** être définie ou l'application ne démarrera pas.

---

## Migrations SQL Supabase à appliquer

Dans l'ordre, via Supabase Dashboard → SQL Editor :

1. `supabase/migrations/consume_tokens_fn.sql` — Fonction atomique de consommation de tokens (CRITIQUE)
2. `supabase/migrations/rate_limits.sql` — Table de rate limiting persistant (ÉLEVÉ)
3. `supabase/migrations/rate_limit_fn.sql` — Fonction RPC de rate limiting (ÉLEVÉ)

### RLS Supabase à vérifier manuellement
Vérifier dans Supabase Dashboard → Table Editor → chaque table → Policies :
- `profiles` — RLS active avec policy `SELECT/UPDATE WHERE id = auth.uid()`
- `replique_scripts` — RLS active
- `tokens_transactions` — RLS active
- `candidatures` — RLS active (accessible uniquement via service_role)
- `affiliations` — RLS active

---

## CRITIQUE — Fixes appliqués

### [CRITIQUE-1] Secret JWT admin — fallback hardcodé supprimé
- `src/middleware.ts` ligne 5-8 : `?? 'dev-secret-CHANGE-IN-PRODUCTION'` → lève une erreur si absent
- `src/lib/admin-auth.ts` ligne 5-8 : idem

### [CRITIQUE-2] Dashboard layout — `getSession()` remplacé par `getUser()`
- `src/app/dashboard/layout.tsx` ligne 8 : `getSession()` → `getUser()`

### [CRITIQUE-3] Race condition tokens — opération atomique via RPC
- `src/lib/tokens.ts` : lecture-comparaison-écriture non-atomique → RPC `consume_tokens` avec `FOR UPDATE`
- `supabase/migrations/consume_tokens_fn.sql` : fonction créée

### [CRITIQUE-4] Content Security Policy absent — CSP ajouté
- `next.config.ts` : ajout d'un header CSP complet couvrant tous les domaines du projet

### [CRITIQUE-A] Webhook Stripe absent
- `src/app/api/webhooks/stripe/route.ts` : créé avec validation `stripe.webhooks.constructEvent`
- Lazy-initialization du client Stripe pour éviter les erreurs de build

### [CRITIQUE-B/C] Double vérification auth admin
- `src/lib/admin-auth.ts` : `requireAdminAuth()` appelle désormais `supabase.auth.getUser()` en plus de vérifier le JWT
- `src/app/api/admin/auth/setup-totp/route.ts` : vérification de l'email admin via `ADMIN_EMAILS`

---

## ÉLEVÉ — Fixes appliqués

### [ÉLEVÉ-1] Rate limiting en mémoire → Supabase persistant
- `src/lib/rate-limit.ts` : créé avec RPC `upsert_rate_limit`
- `src/app/api/ai/replique/route.ts` : rate limit `ai:{userId}` 10 req/60s
- `src/app/api/ai/deallink/route.ts` : idem, remplacement du Map in-memory
- `src/app/api/apply/route.ts` : rate limit `apply:{ip}` 5 req/300s

### [ÉLEVÉ-2] Messages d'erreur internes exposés → masqués
Tous les `return NextResponse.json({ error: error.message })` remplacés par
`{ error: 'Erreur interne', code: 'INTERNAL_ERROR' }` dans :
- `src/app/api/profile/route.ts`
- `src/app/api/profile/complete-onboarding/route.ts`
- `src/app/api/admin/members/list/route.ts`
- `src/app/api/admin/members/update/route.ts`
- `src/app/api/admin/members/delete/route.ts`
- `src/app/api/admin/broadcast/list/route.ts`
- `src/app/api/admin/candidatures/list/route.ts`
- `src/app/api/admin/candidatures/update-status/route.ts`
- `src/app/api/admin/candidatures/accept/route.ts`
- `src/app/api/admin/events/create/route.ts`
- `src/app/api/admin/events/update/route.ts`
- `src/app/api/admin/events/delete/route.ts`
- `src/app/api/admin/events/list/route.ts`
- `src/app/api/admin/activity/route.ts`
- `src/app/api/admin/commissions/mark-paid/route.ts`
- `src/app/api/ai/deallink/route.ts`
- `src/app/api/public/meeting-request/route.ts`
- `src/app/api/extract/route.ts`
- `src/app/api/account/delete/route.ts`
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/route.ts`

### [ÉLEVÉ-3] XSS dans emails HTML — `escHtml()` appliqué
- `src/lib/html-escape.ts` : créé
- `src/app/api/meetings/route.ts` : escHtml sur tous les champs interpolés
- `src/app/api/meetings/[id]/accept/route.ts` : idem
- `src/app/api/meetings/[id]/decline/route.ts` : idem
- `src/app/api/admin/broadcast/send/route.ts` : idem
- `src/app/api/apply/route.ts` : idem

### [ÉLEVÉ-4] Validation Zod manquante — schemas ajoutés
- `src/app/api/auth/signup/route.ts` : schema complet avec limites
- `src/app/api/meetings/route.ts` : schema avec message max 1000 chars
- `src/app/api/projects/route.ts` : schema avec what/how/why max 2000 chars
- `src/app/api/projects/[id]/route.ts` : schema + validation UUID param

### [ÉLEVÉ-5] Injection PostgREST via paramètre search — sanitisé
- `src/app/api/admin/members/list/route.ts` : regex de sanitisation, slice 100 chars

### [ÉLEVÉ-6] `consumeTokens` — erreur DB laissait passer gratuitement — bloqué
- `src/lib/tokens.ts` : erreur RPC → `{ success: false }` en production

---

## MOYEN — Fixes appliqués

### [MOYEN-1] CORS `/api/apply` — `*` → variable d'environnement
- `next.config.ts` et `src/app/api/apply/route.ts` : `ALLOWED_ORIGIN` env var

### [MOYEN-2] Soldes tokens/points pouvaient devenir négatifs
- `src/app/api/admin/members/update/route.ts` : `Math.max(0, ...)` sur tokens et points

### [MOYEN-3] `dashboard/layout.tsx` — client admin inline remplacé
- `src/app/dashboard/layout.tsx` : `createAdmin(URL, KEY)` → `createServiceClient()`

### [MOYEN-4] Log exposait le contenu généré par l'AI
- `src/app/api/ai/replique/route.ts` : suppression de `accumulated.slice(0, 200)` dans le log

### [MOYEN-5] `setup-totp` accessible à tout utilisateur Supabase
- `src/app/api/admin/auth/setup-totp/route.ts` : vérification `ADMIN_EMAILS`

---

## FAIBLE — Fixes appliqués

### [FAIBLE-1] X-Frame-Options SAMEORIGIN → DENY
- `next.config.ts` : `SAMEORIGIN` → `DENY`

### [FAIBLE-2] Code GODMODE hardcodé → variable d'environnement
- `src/app/api/auth/signup/route.ts` : `BYPASS_REFERRAL_CODES` env var

### [FAIBLE-3] Email admin hardcodé — fallback supprimé
- `src/app/api/apply/route.ts` : suppression du fallback `'gaultier@nouveauvariable.fr'`

### [FAIBLE-4] `admin/stats` — requête tokens sans limite
- `src/app/api/admin/stats/route.ts` : `.limit(5000)` ajouté

---

## npm audit — État final

| Sévérité | Nombre | Action |
|---|---|---|
| Critical | 0 | — |
| High | 0 | — |
| Moderate | 2 | Voir ci-dessous |
| Low | 0 | — |

**Vulnérabilités moderate restantes :**
- `postcss <8.5.10` dans `node_modules/next/node_modules/postcss` — faux positif. Le "fix" npm installerait Next.js 9.3.3 (régression catastrophique). Non exploitable dans le contexte d'une application Next.js standard.

**Vulnérabilité corrigée :**
- `@anthropic-ai/sdk 0.79.0-0.91.0` (GHSA-p7fg-763f-g4gf) — mis à jour vers 0.92.0+

---

## Éléments hors périmètre code — À faire manuellement

1. **Stripe Dashboard** : créer un webhook pointant vers `https://[domaine]/api/webhooks/stripe`, copier le Signing Secret → `STRIPE_WEBHOOK_SECRET`
2. **Supabase Dashboard** : appliquer les 3 migrations SQL dans l'ordre
3. **Supabase Dashboard** : auditer et activer les RLS sur les tables listées ci-dessus
4. **Vercel Dashboard** : ajouter toutes les variables d'environnement listées en section 1
