import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys, SendSmtpEmail } from '@getbrevo/brevo'

function makeApi() {
  const api = new TransactionalEmailsApi()
  api.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!)
  return api
}

interface SendEmailOptions {
  to: { email: string; name?: string }
  templateId: number
  params: Record<string, string>
  tags?: string[]
}

export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  if (!opts.templateId || opts.templateId === 0) {
    console.warn(`[Email] Template ID non configuré pour l'envoi à ${opts.to.email.slice(0, 4)}****`)
    return false
  }
  try {
    const api = makeApi()
    const email = new SendSmtpEmail()
    email.to           = [opts.to]
    email.templateId   = opts.templateId
    email.params       = opts.params
    if (process.env.BREVO_BCC_EMAIL) {
      email.bcc = [{ email: process.env.BREVO_BCC_EMAIL }]
    }
    email.sender       = {
      email: process.env.BREVO_SENDER_EMAIL!,
      name:  process.env.BREVO_SENDER_NAME ?? 'Nouveau Variable',
    }
    email.tags = opts.tags ?? []
    await api.sendTransacEmail(email)
    console.log(`[Email] Envoyé template ${opts.templateId} à ${opts.to.email.slice(0, 4)}****`)
    return true
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[Email] Erreur template ${opts.templateId}:`, msg)
    return false
  }
}

// IDs des templates — à remplir après import dans Brevo
export const TEMPLATE_IDS = {
  CANDIDATURE_RECUE:    parseInt(process.env.BREVO_TPL_CANDIDATURE_RECUE    ?? '0'),
  CANDIDATURE_ACCEPTEE: parseInt(process.env.BREVO_TPL_CANDIDATURE_ACCEPTEE ?? '0'),
  CANDIDATURE_REFUSEE:  parseInt(process.env.BREVO_TPL_CANDIDATURE_REFUSEE  ?? '0'),
  BIENVENUE_PAIEMENT:   parseInt(process.env.BREVO_TPL_BIENVENUE_PAIEMENT   ?? '0'),
  ECHEC_PAIEMENT_1:     parseInt(process.env.BREVO_TPL_ECHEC_PAIEMENT_1     ?? '0'),
  ECHEC_PAIEMENT_2:     parseInt(process.env.BREVO_TPL_ECHEC_PAIEMENT_2     ?? '0'),
  RESILIATION:          parseInt(process.env.BREVO_TPL_RESILIATION           ?? '0'),
  ONBOARDING_J1:        parseInt(process.env.BREVO_TPL_ONBOARDING_J1        ?? '0'),
  ONBOARDING_J3:        parseInt(process.env.BREVO_TPL_ONBOARDING_J3        ?? '0'),
  ONBOARDING_J7:        parseInt(process.env.BREVO_TPL_ONBOARDING_J7        ?? '0'),
  ONBOARDING_J14:       parseInt(process.env.BREVO_TPL_ONBOARDING_J14       ?? '0'),
  NEWSLETTER_MENSUELLE: parseInt(process.env.BREVO_TPL_NEWSLETTER            ?? '0'),
  RENOUVELLEMENT_J7:    parseInt(process.env.BREVO_TPL_RENOUVELLEMENT_J7    ?? '0'),
  NOUVEAU_FILLEUL:      parseInt(process.env.BREVO_TPL_NOUVEAU_FILLEUL      ?? '0'),
}
