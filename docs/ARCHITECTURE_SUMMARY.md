# Nouveau Variable — Architecture Summary
> Senior Staff Engineer Review · 2026-05-18

---

## Vue d'ensemble

| Dimension | Valeur |
|-----------|--------|
| Stack | Next.js 16.2.4 · React 19 · TypeScript · Supabase · Vercel |
| Taille | ~18k LOC · 240+ fichiers |
| API routes | 68 routes (public, user, admin, webhooks, crons) |
| Tables DB | 14 tables Supabase + RLS |
| Services ext. | Stripe · Brevo · Twilio · Anthropic · Slack · Vercel Blob |
| Migrations | 19 fichiers SQL |
| Auth | 2 systèmes séparés (Supabase Auth membres / JWT+TOTP admin) |

---

## Forces architecturales ✅

**1. Séparation d'auth admin/membres**
Deux systèmes complètement isolés. Un cookie membre compromis ne donne jamais accès au backoffice. JWT HS256 8h + TOTP 2FA requis pour l'admin — c'est solide.

**2. RLS Supabase sur toutes les tables**
Chaque table a ses policies. Le service client (service role) est réservé aux routes admin uniquement. Le pattern `createClient()` / `createServerClient()` / `createServiceClient()` est bien respecté.

**3. Fire & forget pour les services externes**
Slack, email, SMS ne bloquent jamais la réponse HTTP principale. `.catch(() => null)` systématique. Bonne résistance aux pannes externes.

**4. Rate limiting persistant via Supabase RPC**
`upsert_rate_limit(key, max, window)` résiste aux redéploiements. Fail-open intentionnel. Bien pensé pour un contexte serverless.

**5. consumeTokens() atomique**
Déduction tokens via RPC Supabase — évite le double-spend sur les outils IA. Pattern correct.

**6. Validation Zod systématique**
Tous les POST ont un schema Zod. Pas d'injection possible côté input parsing.

**7. Audit trail complet**
`logAdminAction()` sur toutes les mutations admin. Table `admin_audit_log` avec entity_type/entity_id/data JSONB. Traçabilité totale.

**8. Performance landing page**
ISR (revalidate 60s) + useRef pour le fill-title effect (0 re-renders React à 60fps). Bonne attention aux performances critiques.

---

## Issues identifiées 🔴🟡

### 🔴 Moyen — À corriger prochainement

**1. Pas de `middleware.ts`**
Toute l'auth est gérée in-route. Si une nouvelle route oublie `requireAdminAuth()` ou `createServerClient()`, elle est publique par défaut. Un middleware edge sur `/dashboard/*` et `/admin/*` servirait de filet de sécurité.
> Fix: créer `/middleware.ts` — 30 lignes.

**2. Points/tokens non transactionnels**
`deductPoints()` puis `INSERT token_transactions` sont 2 opérations séparées. Si la 2e échoue, les points sont déjà débités sans trace.
> Fix: RPC Supabase `deduct_points_and_log(user_id, amount, reason)`.

**3. 9 fetch() directs vers Brevo au lieu de `sendRawEmail()`**
9 fichiers font `fetch('https://api.brevo.com/v3/smtp/email', ...)` directement au lieu d'utiliser le helper centralisé `src/lib/email.ts`. Gestion d'erreur inconsistante, code dupliqué.
> Fix: remplacer par `sendRawEmail()` existant.

### 🟡 Bas — Dette technique acceptable

**4. `checkTotpRateLimit()` in-memory**
Utilise un `Map` en mémoire Node.js. En serverless, chaque instance a son propre état → reset au redéploiement ou sur nouvelle instance.
> Fix: migrer vers Supabase RPC (déjà disponible dans le projet).

**5. `.select('*')` dans 15+ fichiers**
Over-fetching. Potentiellement expoer des champs internes si le schéma change.
> Fix: sélectionner explicitement les colonnes nécessaires.

**6. 3 domaines aliasés manuellement après chaque deploy**
Si on oublie `vercel alias set`, le domaine pointe sur l'ancienne version.
> Fix: configurer comme Production Domains dans le dashboard Vercel (5 minutes).

**7. Pas de tests E2E**
Les flows critiques (candidature → paiement, support ticket, AI tool) ne sont pas couverts.
> Fix: Playwright sur 4-5 scenarios critiques.

**8. `src/lib/n8n.ts` encore référencé**
`notifyN8N()` encore appelé dans `/api/apply` malgré l'abandon de N8N. Code mort.
> Fix: supprimer l'appel + le fichier.

---

## Data Flows critiques

### 1. Candidature → Activation (le plus important)
```
Landing → POST /api/apply → candidatures DB → Slack
→ Admin accepte → email Brevo + SMS Twilio
→ User paie Stripe → webhook → is_active=true + commissions N1/N2
→ Email bienvenue Brevo
```

### 2. AI Tool (token-gated)
```
Dashboard Tool → POST /api/ai/* → auth check → rate limit (Supabase RPC)
→ consumeTokens() atomique → Anthropic API → response
→ INSERT token_transactions
```

### 3. Support Ticket
```
SupportWidget → POST /api/support/create → DB + auto-email Brevo + Slack
→ Admin répond → PATCH + email user → résolution
```

---

## Recommandations prioritaires

| # | Priorité | Effort | Action |
|---|----------|--------|--------|
| 1 | 🔴 High | 30min | Créer `middleware.ts` pour protéger `/dashboard/*` et `/admin/*` |
| 2 | 🔴 High | 1h | Installer Sentry pour observer les erreurs fire & forget |
| 3 | 🔴 High | 5min | Configurer les 3 domaines comme Production Domains Vercel |
| 4 | 🟡 Med | 2h | RPC atomique `deduct_points_and_log()` |
| 5 | 🟡 Med | 2h | Centraliser les 9 fetch Brevo dans `sendRawEmail()` |
| 6 | 🟡 Med | 6h | Tests Playwright sur flows critiques |
| 7 | 🟢 Low | 30min | Migrer TOTP rate limit vers Supabase RPC |
| 8 | 🟢 Low | 1h | Nettoyer `select('*')` et `n8n.ts` |

---

## Verdict global

Architecture **solide et pragmatique** pour une équipe solo en phase de lancement. Les choix techniques sont cohérents (Supabase, Vercel, Next.js App Router). La sécurité est bien pensée (2 systèmes d'auth, RLS partout, secrets server-only).

Les issues identifiées sont de la **dette technique normale** pour un MVP — rien de bloquant. La priorité immédiate est le middleware.ts (sécurité) et Sentry (observabilité).

Le système d'affiliation multi-niveau et le token/rate-limiting via Supabase RPC montrent une réflexion architecturale au-delà du simple CRUD.

---

## Fichiers de référence

| Fichier | Usage |
|---------|-------|
| `docs/ARCHITECTURE_MAP.html` | Carte interactive — double-clic pour ouvrir dans le navigateur |
| `docs/architecture.json` | JSON structuré pour agents IA / documentation devs |
| `docs/ARCHITECTURE_SUMMARY.md` | Ce fichier — lecture rapide 5 min |
| `src/lib/admin-auth.ts` | Auth admin: JWT, TOTP, logAdminAction |
| `src/lib/email.ts` | Tous les templates email Brevo |
| `src/lib/slack.ts` | Notifications Slack |
| `src/lib/rate-limit.ts` | Rate limiting Supabase RPC |
| `src/lib/tokens.ts` | Token consumption atomique |
| `supabase/migrations/` | 19 migrations SQL (source de vérité du schéma) |
