// ============================================================
// NOUVEAU VARIABLE — sendAcceptation()
// ------------------------------------------------------------
// Remplace le stub existant dans le backoffice admin.
// Envoie l'email d'acceptation via Brevo (API transactionnelle)
// avec le lien de paiement Stripe personnalisé.
//
// PRÉREQUIS (à dire à Claude Code) :
//   1. Installer le SDK : npm install @getbrevo/brevo
//   2. Ajouter dans .env :
//        BREVO_API_KEY=votre_clé_api_brevo
//        BREVO_TEMPLATE_ID=XX          ← ID du template après import
//        BREVO_SENDER_EMAIL=no-reply@nouveauvariable.fr
//        BREVO_SENDER_NAME=Nouveau Variable
//        STRIPE_PAYMENT_BASE_URL=https://buy.stripe.com/XXXX  ← lien Stripe à créer
//   3. Importer template-email-acceptation.html dans Brevo :
//        Brevo > Email > Templates > "Nouveau template" > coller le HTML
//        Noter l'ID du template créé → BREVO_TEMPLATE_ID
// ============================================================

const { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } = require('@getbrevo/brevo');
const fs = require('fs');
const path = require('path');

// ── Configuration ──────────────────────────────────────────
const transacEmailApi = new TransactionalEmailsApi();
transacEmailApi.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// ── Template HTML local ─────────────────────────────────────
function buildHtml(params) {
  const tplPath = path.join(__dirname, 'template-email-acceptation.html');
  let html = fs.readFileSync(tplPath, 'utf8');
  Object.entries(params).forEach(([key, val]) => {
    html = html.replace(new RegExp(`\\{\\{params\\.${key}\\}\\}`, 'g'), val ?? '');
  });
  html = html.replace(/\{\{unsubscribe\}\}/g, '#');
  return html;
}

// ── Générateur de lien de paiement ─────────────────────────
// Utilise lien_paiement si déjà fourni (ex: route /subscribe?email=…),
// sinon construit depuis STRIPE_PAYMENT_BASE_URL (fallback legacy).
function buildPaymentLink(candidat) {
  if (candidat.lien_paiement) return candidat.lien_paiement;
  const base = process.env.STRIPE_PAYMENT_BASE_URL;
  const params = new URLSearchParams({
    prefilled_email: candidat.email,
    client_reference_id: candidat.id || candidat.email,
    utm_source: 'backoffice',
    utm_medium: 'email_acceptation',
    utm_campaign: 'onboarding',
  });
  if (candidat.code_parrainage) {
    params.set('metadata[parrain_code]', candidat.code_parrainage);
  }
  return `${base}?${params.toString()}`;
}

// ── Fonction principale ─────────────────────────────────────
/**
 * Envoie l'email d'acceptation au candidat via Brevo.
 *
 * @param {Object} candidat - Données du formulaire de candidature
 * @param {string} candidat.prenom
 * @param {string} candidat.nom
 * @param {string} candidat.email
 * @param {string} candidat.telephone
 * @param {string} candidat.ville
 * @param {string} candidat.role
 * @param {string} candidat.secteur
 * @param {string} candidat.experience
 * @param {string} candidat.motivation
 * @param {string} [candidat.code_parrainage]
 * @param {string} [candidat.id] - ID interne de la candidature (si dispo)
 *
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendAcceptation(candidat) {
  try {
    // Valider les champs minimum
    if (!candidat.email || !candidat.prenom) {
      throw new Error('Email et prénom requis pour envoyer l\'acceptation');
    }

    const lienPaiement = buildPaymentLink(candidat);

    const htmlContent = buildHtml({
      prenom:       candidat.prenom,
      nom:          candidat.nom || '',
      email:        candidat.email,
      lien_paiement: lienPaiement,
      role:         candidat.role || '',
      ville:        candidat.ville || '',
      expiration:   new Date(Date.now() + 48 * 60 * 60 * 1000)
        .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    });

    const emailData = {
      to: [
        {
          email: candidat.email,
          name: `${candidat.prenom} ${candidat.nom || ''}`.trim(),
        }
      ],
      subject: `${candidat.prenom}, ta candidature Nouveau Variable est acceptée`,
      htmlContent,
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME,
      },
      replyTo: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME,
      },
      tags: ['acceptation', 'onboarding'],
    };

    const response = await transacEmailApi.sendTransacEmail(emailData);

    console.log(`✅ Email acceptation envoyé à ${candidat.email} — messageId: ${response.messageId}`);

    return {
      success: true,
      messageId: response.messageId,
      lienPaiement, // retourné pour l'afficher dans le backoffice si besoin
    };

  } catch (error) {
    // Log détaillé pour debug sans crasher le backoffice
    console.error(`❌ Erreur envoi acceptation à ${candidat?.email}:`, {
      message: error.message,
      status: error.status,
      body: error.response?.body,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

// ── Anti-doublon : vérifier si déjà envoyé ─────────────────
// À intégrer dans le backoffice avant d'appeler sendAcceptation()
// pour éviter un double-clic admin qui enverrait 2 emails.
const acceptationsEnvoyees = new Set(); // En prod : stocker en DB

async function sendAcceptationSafe(candidat) {
  const key = candidat.email;

  if (acceptationsEnvoyees.has(key)) {
    console.warn(`⚠️ Acceptation déjà envoyée à ${key} — doublon ignoré`);
    return { success: false, error: 'Déjà envoyé' };
  }

  const result = await sendAcceptation(candidat);

  if (result.success) {
    acceptationsEnvoyees.add(key); // Marquer comme envoyé
  }

  return result;
}

module.exports = { sendAcceptation, sendAcceptationSafe, buildPaymentLink };


// ============================================================
// INTÉGRATION DANS LE BACKOFFICE
// ------------------------------------------------------------
// Remplacer le stub actuel par :
//
//   const { sendAcceptationSafe } = require('./sendAcceptation');
//
//   // Dans le handler du bouton "Accepter" :
//   btnAccepter.addEventListener('click', async () => {
//     btnAccepter.disabled = true;
//     btnAccepter.textContent = 'Envoi…';
//
//     const result = await sendAcceptationSafe(candidat);
//
//     if (result.success) {
//       // Mettre à jour le statut dans l'UI
//       updateCandidatureStatut(candidat.id, 'accepté');
//       showToast(`✅ Email envoyé à ${candidat.email}`);
//     } else {
//       btnAccepter.disabled = false;
//       btnAccepter.textContent = 'Accepter';
//       showToast(`❌ Erreur : ${result.error}`, 'error');
//     }
//   });
// ============================================================


// ============================================================
// TEST RAPIDE (node sendAcceptation.js)
// ------------------------------------------------------------
// Décommenter pour tester sans passer par le backoffice :
//
// if (require.main === module) {
//   sendAcceptation({
//     prenom: 'Gaultier',
//     nom: 'H.',
//     email: 'hzoom@outlook.fr',
//     telephone: '0612345678',
//     ville: 'Paris',
//     role: 'Account Executive',
//     secteur: 'SaaS B2B',
//     experience: '5 à 10 ans',
//     motivation: 'Développer mon réseau et mes revenus variables.',
//     code_parrainage: 'NV-TEST',
//   }).then(console.log);
// }
// ============================================================
