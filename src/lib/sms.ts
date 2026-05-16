import twilio from 'twilio'

function getClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  )
}

export async function sendSMS(to: string, message: string): Promise<boolean> {
  const FROM = process.env.TWILIO_PHONE_NUMBER
  if (!FROM || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('[SMS] Variables Twilio manquantes — SMS non envoyé')
    return false
  }
  try {
    const formatted = to.startsWith('+') ? to : `+33${to.replace(/^0/, '')}`
    await getClient().messages.create({ to: formatted, from: FROM, body: message })
    console.log('[SMS] Envoyé à:', formatted.slice(0, 6) + '****')
    return true
  } catch (err: unknown) {
    const e = err as { message?: string; code?: number | string; status?: number }
    console.error('[TWILIO SMS]', { error: e.message, code: e.code, status: e.status, to: to.slice(0, 6) + '****' })
    return false
  }
}

export const SMS_TEMPLATES = {
  newMeetingRequest: (senderName: string) =>
    `Nouveau Variable — ${senderName} souhaite te rencontrer. Réponds sur app.nouveauvariable.fr/dashboard/meetings`,

  meetingAccepted: (receiverName: string, phone: string) =>
    `Nouveau Variable — ${receiverName} a accepté ta demande de RDV. Son numéro : ${phone}. Bonne rencontre 🤝`,

  yourPhoneShared: (senderName: string, phone: string) =>
    `Nouveau Variable — Tu as accepté le RDV avec ${senderName}. Son numéro : ${phone}. Bonne rencontre 🤝`,

  meetingDeclined: (receiverName: string) =>
    `Nouveau Variable — ${receiverName} n'est pas disponible pour un RDV pour le moment.`,

  meetingCancelled: (cancellerName: string) =>
    `Nouveau Variable — ${cancellerName} a annulé sa demande de RDV.`,
}
