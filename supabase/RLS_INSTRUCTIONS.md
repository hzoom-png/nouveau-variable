# RLS — Table candidatures

## État actuel (migration 20250001_admin_backoffice.sql)

```sql
ALTER TABLE candidatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert_candidatures" ON candidatures FOR INSERT WITH CHECK (true);
```

- RLS activé ✓
- INSERT public autorisé (formulaire de candidature) ✓
- SELECT non défini → seul le service_role (backoffice) peut lire ✓
- UPDATE non défini → bloqué pour les utilisateurs anonymes ✓
- DELETE non défini → bloqué pour les utilisateurs anonymes ✓

## Aucune action requise

La configuration actuelle est correcte pour ce cas d'usage :
- Le formulaire public peut insérer des candidatures (clé `anon`)
- Le backoffice lit et modifie les candidatures via `service_role` (clé non exposée)
- Les candidats ne peuvent pas lire, modifier ou supprimer les données

## Vérification dans le dashboard

Dashboard Supabase → Table Editor → candidatures → RLS → vérifier que :
1. RLS est bien activé (toggle bleu)
2. La policy `public_insert_candidatures` est présente sur `INSERT`
3. Aucune policy `SELECT` publique n'est accidentellement active

## Si une policy SELECT admin est nécessaire (backoffice auth Supabase)

Si tu passes le backoffice à une auth Supabase native (hors JWT custom actuel),
ajoute cette policy pour les admins authentifiés :

```sql
CREATE POLICY "admin_select_candidatures"
  ON candidatures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
```
