# Nouveau Variable — Guide de test pour Gaultier

## C'est quoi ce système ?

Un script qui vérifie automatiquement que tout fonctionne sur le site.
Il lance 21 tests en 30 secondes et te dit ce qui passe et ce qui casse.

**Ce qu'il vérifie :**
- La landing page se charge correctement
- L'API d'inscription reçoit et enregistre les candidatures
- Le code parrain est généré et a le bon format
- Le système anti-doublon bloque un même email deux fois
- Les pages admin répondent (sans erreur 500)
- Les endpoints protégés rejettent les accès non autorisés
- Le webhook Stripe existe
- Les jobs automatiques (crons) sont protégés

---

## Lancer les tests (2 étapes)

### Étape 1 — Ouvre le terminal

Dans VS Code : `Ctrl + J` (Windows)

Ou ouvre "Invite de commandes" / "PowerShell" depuis le menu Windows.

### Étape 2 — Lance le script

```bash
cd C:\Users\Gaultier\Desktop\nouveau-variable\app
npm run test
```

Attends 30 secondes. Tu vois les résultats s'afficher ligne par ligne.

---

## Lire les résultats dans le terminal

```
══════════════════════════════════════════════════════════════
  NOUVEAU VARIABLE — Suite de tests automatisés
  17/05/2026 09:14:32
══════════════════════════════════════════════════════════════

  ▸ Landing
    ✓ Landing charge en moins de 5s (1 234ms)
    ✓ Landing contient "Nouveau Variable" (89ms)
    ✓ Landing contient un compteur (91ms)

  ▸ API Apply
    — Tests suivants : 3 requêtes utilisées sur le rate limit —
    ✓ POST valide → 200 + candidatureId + code_parrain (1 823ms)
    ✗ Anti-doublon email → 409
      → 1ère insertion : HTTP 429

══════════════════════════════════════════════════════════════
  🟡 ATTENTION — Quelques tests en échec
  Résultat : 20/21 tests (95%)
══════════════════════════════════════════════════════════════
```

**Légende :**
| Symbole | Signification |
|---------|--------------|
| `✓` | Test réussi — tout va bien |
| `✗` | Test échoué — problème détecté |
| `🟢 STABLE` | Tous les tests passent |
| `🟡 ATTENTION` | 80-99% passent |
| `🔴 CRITIQUE` | Moins de 80% passent |

---

## Voir le dashboard visuel

Après chaque run, le script génère un fichier HTML.

1. Va dans le dossier `scripts/`
2. Double-clique sur `dashboard.html`
3. Il s'ouvre dans ton navigateur

Tu y verras :
- Le score du dernier test (%)
- Un graphique de l'historique
- Le détail de chaque test (OK / FAIL + durée)

---

## Règle importante : rate limit

Les tests qui créent de vraies candidatures (marqués ⚠️) sont limités à **3 par heure**.

- **1 run par heure maximum** (sinon les tests ⚠️ retournent 429)
- Si tu vois "HTTP 429" → attends 1 heure et relance

Les candidatures de test ont un email `test-suite-*@test-nv.com`.
Tu peux les **rejeter depuis l'admin** (`/admin/candidatures`) sans problème.

---

## Que faire si un test échoue ?

### ✗ "Landing charge en moins de 5s"
→ Le site est lent (Vercel cold start) ou en panne.
→ Attends 2 min et relance. Si ça persiste, check le dashboard Vercel.

### ✗ "Landing contient Nouveau Variable"
→ Le déploiement a échoué ou la page est cassée.
→ Va sur `nouveauvariable.fr` manuellement. Si la page est blanche, signale-moi.

### ✗ "POST valide → 200" ou "HTTP 429"
→ Si 429 : rate limit atteint. Attends 1h.
→ Si 500 : bug serveur. Envoie-moi le message d'erreur.
→ Si autre : check les variables d'env Vercel (SUPABASE_SERVICE_ROLE_KEY, etc.)

### ✗ "Anti-doublon email → 409"
→ Si 429 : tu as déjà lancé les tests récemment. Attends 1h.
→ Si 200 : l'anti-doublon ne fonctionne plus ! Signale-moi immédiatement.

### ✗ "GET /api/admin/stats → 401"
→ Si 200 : URGENT — l'API admin n'est plus protégée. Signale-moi.
→ Si 500 : bug serveur. Signale-moi.

### ✗ "POST /api/webhooks/stripe → endpoint existe"
→ Le webhook Stripe a été supprimé ou renommé. Les paiements ne fonctionneront plus.

### ✗ N'importe quel test avec "HTTP 500"
→ Erreur serveur. Copie le nom du test et le message d'erreur et envoie-moi.

---

## À quelle fréquence lancer les tests ?

| Situation | Fréquence recommandée |
|-----------|----------------------|
| Après chaque déploiement | Immédiatement (1x) |
| Semaine normale | 1 fois par jour le matin |
| Après un bug signalé | Immédiatement |
| Avant un événement important | La veille |

---

## Branches Git : main vs develop

| Branche | Rôle |
|---------|------|
| `main` | Production — ce que voient tes membres |
| `develop` | Zone de test — les nouveautés avant validation |

**Règle :** tout nouveau code va d'abord sur `develop`.
Après avoir lancé les tests et vérifié que tout passe → on merge sur `main`.

---

## Commandes clés

```bash
# Lancer les tests
npm run test

# Voir les logs Vercel (dernière erreur)
npx vercel logs --prod

# Déployer en production
git push origin master:main
```

---

## Aide

Si tu vois quelque chose que tu ne comprends pas, copie :
1. Le nom exact du test qui échoue
2. Le message d'erreur affiché
3. L'heure à laquelle tu as lancé les tests

Et envoie-moi ces 3 infos — je peux diagnostiquer en moins de 2 minutes.
