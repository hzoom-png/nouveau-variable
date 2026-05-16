# Variables d'environnement — Templates Brevo

Après import des 14 templates dans Brevo (Email → Templates → Nouveau template → Éditeur HTML),
noter les IDs générés et les ajouter dans Vercel → Settings → Environment Variables.

```
BREVO_TPL_CANDIDATURE_RECUE=
BREVO_TPL_CANDIDATURE_ACCEPTEE=
BREVO_TPL_CANDIDATURE_REFUSEE=
BREVO_TPL_BIENVENUE_PAIEMENT=
BREVO_TPL_ECHEC_PAIEMENT_1=
BREVO_TPL_ECHEC_PAIEMENT_2=
BREVO_TPL_RESILIATION=
BREVO_TPL_ONBOARDING_J1=
BREVO_TPL_ONBOARDING_J3=
BREVO_TPL_ONBOARDING_J7=
BREVO_TPL_ONBOARDING_J14=
BREVO_TPL_NEWSLETTER=
BREVO_TPL_RENOUVELLEMENT_J7=
BREVO_TPL_NOUVEAU_FILLEUL=
CRON_SECRET=
```

## Migration SQL à exécuter dans Supabase

```sql
alter table profiles add column if not exists payment_failed_count integer default 0;
```
