import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const SALT      = 'nv-iban-v1'

function getDerivedKey(): Buffer {
  const raw = process.env.IBAN_ENCRYPTION_KEY
  if (!raw || raw.length < 32) {
    throw new Error('IBAN_ENCRYPTION_KEY manquante ou trop courte (min 32 chars)')
  }
  return scryptSync(raw, SALT, 32)
}

// Format stocké: <iv_hex>:<authTag_hex>:<ciphertext_hex>
export function encryptIban(iban: string): string {
  const key = getDerivedKey()
  const iv  = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(iban, 'utf-8'), cipher.final()])
  const authTag   = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptIban(stored: string): string {
  const parts = stored.split(':')
  if (parts.length !== 3) throw new Error('Format IBAN chiffré invalide')
  const [ivHex, authTagHex, ciphertextHex] = parts

  const key      = getDerivedKey()
  const iv       = Buffer.from(ivHex, 'hex')
  const authTag  = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]).toString('utf-8')
}

// Détecte si un IBAN est déjà chiffré (migration progressive)
export function isEncryptedIban(value: string): boolean {
  return /^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/i.test(value)
}
