# Guide Airtable + N8N — Nouveau Variable

## Vue d'ensemble (lis ça en premier)

### C'est quoi Airtable ?

Airtable = un tableau Excel dans le cloud, mais 10x plus puissant.
- Tu vois toutes tes candidatures dans un tableau clair
- Tu peux filtrer, trier, grouper sans coder
- Tout le monde dans l'équipe peut accéder (juste un lien)
- Ressemble à ça : des colonnes (prenom, email, status...) et des lignes (une par candidat)

### C'est quoi N8N ?

N8N = un outil d'automatisation visuel.
- Tu crées des "workflows" (enchaînements d'actions)
- Exemple : "Quand il y a un nouveau candidat → ajoute-le dans Airtable + envoie une notif Slack"
- Tu n'écris aucun code, tu assembles des blocs visuels
- Ressemble à un diagramme avec des flèches entre des boîtes

### Comment tout ça s'articule ?

```
Candidat remplit le formulaire sur nouveauvariable.fr
    ↓
Code Next.js (inchangé) — sauvegarde dans Supabase + envoie l'email de confirmation
    ↓
N8N Webhook déclenché (automatiquement, 300ms après)
    ↓
N8N fait 2 choses en parallèle :
    1. Ajoute le candidat dans Airtable (tu le vois apparaître)
    2. Notifie Slack : "Nouveau candidat : Jean Dupont"
    ↓
Tu vois tout dans Airtable.
Tu acceptes depuis la page admin (app.nouveauvariable.fr/admin/candidatures).
    ↓
À l'acceptation → N8N met à jour Airtable + notifie Slack.
    ↓
Candidat paye Stripe → N8N met Airtable à "actif" + notifie Slack.
```

**Important :** Supabase reste la vraie base de données. Airtable est une copie de lecture
pour que tu puisses tout voir facilement. Pas de risque de casser quoi que ce soit.

---

## Coûts

| Service | Plan gratuit | Limite gratuit | Plan payant |
|---------|-------------|----------------|-------------|
| Airtable | Oui | 1 000 lignes, 5 éditeurs | $20/mois (Pro) |
| N8N Cloud | Oui | 2 500 exécutions/mois | $20/mois (Pro) |
| Slack | Oui | OK pour usage standard | — |

**Pour commencer : $0.** Le gratuit est largement suffisant jusqu'à 500 membres.

---

## Étape 1 — Créer la base Airtable (30 min)

### 1.1 Créer un compte

1. Va sur **https://airtable.com**
2. Clique **"Sign up for free"**
3. Remplis email + mot de passe
4. Confirme ton email

### 1.2 Créer la base "NV Admin"

1. Une fois connecté, tu vois l'écran d'accueil Airtable
2. Clique le bouton **"+ Create a base"** (ou "Add a base")
3. Choisis **"Start from scratch"** (commencer de zéro)
4. Nom de la base : tape **`Nouveau Variable Admin`**
5. Clique **"Create"**

Tu arrives dans ta nouvelle base avec une table vide nommée "Table 1".

### 1.3 Créer la Table "Candidatures"

**Renommer la table par défaut :**
1. Clique sur le nom "Table 1" en haut à gauche (onglet)
2. Clique sur les 3 points `...` à droite de "Table 1"
3. Clique **"Rename table"**
4. Tape **`Candidatures`**
5. Appuie sur Entrée

**Tu vois déjà des colonnes par défaut** (Name, Notes...). On va les supprimer et en créer de nouvelles.

**Supprimer les colonnes inutiles :**
- Clique droit sur le titre "Notes" → "Delete field" → confirme
- Garde uniquement "Name" pour l'instant (on la modifiera)

**Renommer la colonne "Name" :**
1. Clique sur le titre "Name"
2. Clique sur l'icône crayon (modifier)
3. Renomme en **`prenom`**
4. Type : **"Single line text"** (déjà sélectionné, garder)
5. Clique "Save"

**Ajouter les colonnes :** Pour chaque ligne ci-dessous, clique le **"+" en haut à droite** du tableau.

| Nom du champ | Type à choisir | Note |
|---|---|---|
| `nom` | Single line text | |
| `email` | Email | |
| `role` | Single line text | |
| `experience` | Single line text | |
| `telephone` | Phone number | |
| `ville` | Single line text | |
| `secteur` | Single line text | |
| `pourquoi` | Long text | Clique sur "Long text" dans la liste |
| `code_parrain` | Single line text | |
| `referrer_code` | Single line text | |
| `status` | Single select | Voir options ci-dessous |
| `is_founder` | Checkbox | |
| `date_created` | Date | |
| `date_acceptation` | Date | |
| `date_payment` | Date | |
| `plan` | Single select | monthly / annual |
| `supabase_id` | Single line text | ID technique, ne pas modifier |
| `projet_nom` | Single line text | |

**Configurer le champ "status" (Single select) :**
Quand tu crées ce champ, tu dois ajouter les options :
1. Type : Single select
2. Clique "Add an option" et ajoute :
   - `received` (couleur gris)
   - `accepted` (couleur vert)
   - `active` (couleur bleu)
   - `rejected` (couleur rouge)
3. Clique "Save"

**Configurer le champ "plan" (Single select) :**
- Options : `monthly`, `annual`

### 1.4 Créer la Table "Commissions"

1. Clique le **"+"** à côté de l'onglet "Candidatures" (en bas à gauche)
2. Choisis "Create new table"
3. Nom : **`Commissions`**
4. Ajoute ces champs :

| Nom du champ | Type |
|---|---|
| `membre_email` | Single line text |
| `parrain_email` | Single line text |
| `niveau` | Single select (N1, N2) |
| `montant_eur` | Number (décimales activées) |
| `plan` | Single select (monthly, annual) |
| `status` | Single select (pending, paid) |
| `date_created` | Date |

### 1.5 Créer la Table "Settings"

1. Encore un **"+"** → Create new table → Nom : **`Settings`**
2. Champs :
   - `setting_name` (Single line text) — colonne primaire
   - `setting_value` (Single line text)
   - `description` (Long text)

3. **Ajoute ces lignes directement dans Airtable** (clique dans le tableau et tape) :

| setting_name | setting_value | description |
|---|---|---|
| club_name | Nouveau Variable | Nom du club |
| club_price_monthly | 97 | Prix mensuel en € |
| club_price_annual | 899 | Prix annuel en € |
| commission_n1_pct | 10 | Commission parrain N1 (%) |
| commission_n2_pct | 5 | Commission parrain N2 (%) |
| max_members | 1000 | Nombre max de membres |

### 1.6 Récupérer l'ID de ta base

Tu en auras besoin pour configurer N8N.

1. Regarde l'URL dans ton navigateur quand tu es dans ta base
2. Elle ressemble à : `https://airtable.com/appXXXXXXXXXXXX/tblYYYY...`
3. La partie **`appXXXXXXXXXXXX`** = ton **Base ID**
4. Note-la dans un fichier texte

### 1.7 Créer un Personal Access Token Airtable

N8N a besoin d'un token pour accéder à ta base.

1. Va sur **https://airtable.com/create/tokens**
2. Clique **"Create new token"**
3. Nom : `N8N - NV`
4. Scopes (permissions) — sélectionne :
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
5. Access : sélectionne ta base "Nouveau Variable Admin"
6. Clique **"Create token"**
7. **COPIE LE TOKEN IMMÉDIATEMENT** (il ne s'affiche qu'une fois !)
8. Colle-le dans un fichier texte sécurisé

---

## Étape 2 — Créer un compte N8N (10 min)

1. Va sur **https://n8n.io** → clique "Get started for free"
2. Choisis **"N8N Cloud"** (pas besoin d'installer quoi que ce soit)
3. Crée ton compte avec email + mot de passe
4. Confirme ton email
5. Tu arrives sur le tableau de bord N8N

---

## Étape 3 — Configurer les credentials N8N (15 min)

Avant d'importer les workflows, configure les connexions aux services externes.

### 3.1 Airtable

1. Dans N8N, clique ton nom en bas à gauche → **"Credentials"**
2. Clique **"Add credential"**
3. Cherche **"Airtable Token API"** → clique dessus
4. Nom : `Airtable - NV`
5. **Personal Access Token** : colle le token que tu as copié à l'étape 1.7
6. Clique **"Save"** → N8N va tester la connexion

### 3.2 Slack (optionnel mais recommandé)

Pour recevoir des notifs Slack quand il y a un nouveau candidat ou un paiement.

**D'abord créer une app Slack :**
1. Va sur **https://api.slack.com/apps**
2. Clique **"Create New App"** → "From scratch"
3. Nom : `NV Notifications`
4. Choisis ton workspace
5. Dans "OAuth & Permissions" → "Scopes" → ajoute `chat:write` et `chat:write.public`
6. Clique "Install to workspace" → autorise
7. Copie le **"Bot User OAuth Token"** (commence par `xoxb-...`)

**Dans N8N :**
1. Credentials → Add credential → "Slack OAuth2 API"
2. Colle le token Slack
3. Nom : `Slack - NV`
4. Save

---

## Étape 4 — Importer les 3 workflows (20 min)

Les fichiers JSON des workflows sont dans `/scripts/n8n/` de ton projet.
Tu les trouves dans VS Code → dossier `scripts` → `n8n`.

### Importer Workflow 1 (Nouvelle candidature)

1. Dans N8N, clique **"Workflows"** dans le menu gauche
2. Clique **"Add workflow"** → **"Import from file"**
3. Sélectionne le fichier **`workflow-1-new-candidate.json`**
4. N8N importe le workflow avec 3 blocs : Webhook → Airtable → Slack

**Configurer le bloc Airtable :**
1. Clique sur le bloc **"📊 Airtable - Créer ligne"**
2. Dans "Base" : remplace `REMPLACE_PAR_TON_AIRTABLE_BASE_ID` par ton Base ID (ex: `appABCDEF`)
3. Dans "Credential" : sélectionne `Airtable - NV`
4. Clique **"Save"**

**Configurer le bloc Slack :**
1. Clique sur **"💬 Slack - Notif admin"**
2. Dans "Channel" : tape le nom de ton channel Slack (ex: `general` ou `admin`)
3. Dans "Credential" : sélectionne `Slack - NV`
4. Clique **"Save"**

**Récupérer l'URL du webhook :**
1. Clique sur le bloc **"🔗 Webhook - Nouvelle candidature"**
2. Tu vois un champ **"Test URL"** et **"Production URL"**
3. Copie la **Production URL** (ex: `https://ton-instance.n8n.cloud/webhook/nv-new-candidate`)
4. Tu en auras besoin à l'étape 5

**Activer le workflow :**
1. En haut à droite, le bouton est sur "Inactive"
2. Clique dessus pour passer à **"Active"**
3. Le workflow est maintenant live

**Répète cette procédure pour :**
- `workflow-2-candidate-accepted.json` → copie l'URL du webhook
- `workflow-3-stripe-payment.json` → copie l'URL du webhook

---

## Étape 5 — Connecter les webhooks dans Vercel (5 min)

Tu as 3 URLs de webhook N8N. Tu dois les ajouter comme variables d'environnement dans Vercel.

1. Va sur **https://vercel.com** → ton projet `nv-app`
2. Clique **"Settings"** → **"Environment Variables"**
3. Ajoute ces 3 variables (clique "Add" pour chacune) :

| Variable | Valeur |
|---|---|
| `N8N_WEBHOOK_NEW_CANDIDATE` | URL du webhook Workflow 1 |
| `N8N_WEBHOOK_CANDIDATE_ACCEPTED` | URL du webhook Workflow 2 |
| `N8N_WEBHOOK_STRIPE_PAYMENT` | URL du webhook Workflow 3 |

4. Pour chaque variable : sélectionne **"Production"** uniquement
5. Clique **"Save"**

**Redéployer pour appliquer les nouvelles variables :**
1. Va dans **"Deployments"** dans Vercel
2. Clique sur le dernier déploiement
3. Clique les 3 points `...` → **"Redeploy"**
4. Attends 2-3 minutes

---

## Étape 6 — Tester (10 min)

### Test 1 : Nouvelle candidature

1. Va sur **https://nouveauvariable.fr**
2. Remplis le formulaire avec une fausse candidature (email `test-n8n@test.com`)
3. Soumets

**Ce que tu dois voir :**
- Dans Airtable : une nouvelle ligne apparaît dans "Candidatures" (peut prendre 30s)
- Dans Slack : un message `🆕 Nouvelle candidature ! Test N8N...`
- Dans l'admin Next.js (`/admin/candidatures`) : la candidature est là aussi

Si tu ne vois rien dans Airtable :
→ Va dans N8N → clique sur le workflow 1 → "Executions"
→ Tu vois si le workflow s'est déclenché et s'il y a eu une erreur

### Test 2 : Vérifier les logs N8N

1. Dans N8N, clique ton workflow → **"Executions"** (onglet en haut)
2. Tu vois la liste de tous les déclenchements
3. Clique sur un pour voir le détail (quelles données ont passé, s'il y a eu erreur)

---

## Vue quotidienne dans Airtable

Une fois tout en place, voici comment tu l'utilises :

**Voir toutes les candidatures :**
→ Ouvre Airtable → base "Nouveau Variable Admin" → table "Candidatures"
→ Tu vois tout en tableau, triable, filtrable

**Filtrer par status :**
1. Clique **"Filter"** en haut
2. Champ : `status`
3. Condition : "is" → `received`
→ Tu vois uniquement les candidatures à traiter

**Créer une vue "À traiter" :**
1. Clique le "+" à côté des onglets de vue (gauche)
2. Choisis "Gallery" ou "Grid"
3. Nom : "À traiter"
4. Ajoute un filtre : status = received

**Accepter une candidature :**
→ Tu acceptes toujours depuis **app.nouveauvariable.fr/admin/candidatures** (pas depuis Airtable)
→ L'action d'acceptation (email Stripe, SMS) est trop complexe pour N8N, elle reste dans le code
→ Airtable se mettra à jour automatiquement via N8N après l'acceptation

---

## Dépannage

### "N8N ne reçoit pas les données"

**Vérifie :**
1. Les variables d'env Vercel sont bien ajoutées (pas de faute de frappe)
2. Vercel a été redéployé après l'ajout des variables
3. Le workflow N8N est bien en état "Active" (pas "Inactive")
4. L'URL du webhook copiée est bien la "Production URL" (pas "Test URL")

**Comment déboguer dans N8N :**
1. Workflow → "Executions"
2. Si la liste est vide → le webhook n'a pas été appelé (problème côté Vercel)
3. Si il y a des exécutions avec une croix rouge → clique pour voir l'erreur

### "Airtable n'est pas mis à jour"

1. Va dans N8N → Executions du workflow concerné
2. Clique sur une exécution en erreur
3. Regarde quel bloc a échoué (la boîte rouge)
4. Erreur "Base not found" → le Base ID est mal configuré
5. Erreur "Unauthorized" → le token Airtable est expiré, recrée-en un

### "Slack ne reçoit pas les notifs"

1. Vérifie que le channel Slack existe (le nom exact, sans `#`)
2. Vérifie que le bot Slack a bien été installé dans le workspace
3. Dans Slack : ajoute le bot au channel → `/invite @NV Notifications`

### "Le formulaire ne fonctionne plus du tout"

Aucun risque — les webhooks N8N sont "fire and forget".
Si N8N est en panne ou que la variable n'est pas configurée, le formulaire continue à fonctionner normalement. Seule la synchro Airtable + Slack est désactivée.

---

## Récapitulatif des accès

| Service | URL | Identifiant |
|---|---|---|
| Airtable | https://airtable.com | Ton email |
| N8N | https://app.n8n.cloud | Ton email |
| Vercel | https://vercel.com | Ton email |
| Admin NV | https://app.nouveauvariable.fr/admin | Login admin |

---

## Variables d'environnement à ajouter dans Vercel

```
N8N_WEBHOOK_NEW_CANDIDATE       = https://xxx.n8n.cloud/webhook/nv-new-candidate
N8N_WEBHOOK_CANDIDATE_ACCEPTED  = https://xxx.n8n.cloud/webhook/nv-candidate-accepted
N8N_WEBHOOK_STRIPE_PAYMENT      = https://xxx.n8n.cloud/webhook/nv-stripe-payment
```

Environnement : **Production uniquement** (pas Preview, pas Development)

---

## Support

Si quelque chose bloque :

1. Copie le message d'erreur exact (dans N8N Executions ou dans les logs Vercel)
2. Note l'étape où ça bloque
3. Envoie-moi les 2 infos → je diagnostique en 5 minutes
