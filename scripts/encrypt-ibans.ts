/**
 * One-shot migration script — chiffre les IBANs existants en plaintext.
 * À exécuter UNE SEULE FOIS après avoir ajouté IBAN_ENCRYPTION_KEY à l'env.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/encrypt-ibans.ts
 *
 * Prérequis:
 *   - IBAN_ENCRYPTION_KEY défini dans l'env (même valeur qu'en production)
 *   - NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans l'env
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { encryptIban, isEncryptedIban } from '../src/lib/encryption'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data: rows, error } = await supabase
    .from('affiliate_banking_info')
    .select('id, affiliate_id, iban')

  if (error) {
    console.error('Erreur lecture:', error.message)
    process.exit(1)
  }

  if (!rows || rows.length === 0) {
    console.log('Aucun IBAN à migrer.')
    return
  }

  let skipped = 0
  let migrated = 0

  for (const row of rows) {
    if (!row.iban) { skipped++; continue }

    if (isEncryptedIban(row.iban)) {
      console.log(`⏭  Déjà chiffré: affiliate ${row.affiliate_id}`)
      skipped++
      continue
    }

    const encrypted = encryptIban(row.iban)
    const { error: updateError } = await supabase
      .from('affiliate_banking_info')
      .update({ iban: encrypted })
      .eq('id', row.id)

    if (updateError) {
      console.error(`✗ Erreur affiliate ${row.affiliate_id}:`, updateError.message)
    } else {
      console.log(`✓ Chiffré: affiliate ${row.affiliate_id}`)
      migrated++
    }
  }

  console.log(`\nMigration terminée: ${migrated} chiffrés, ${skipped} ignorés.`)
}

main().catch(err => { console.error(err); process.exit(1) })
