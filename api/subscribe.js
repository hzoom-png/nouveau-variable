export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, profil } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const PROFIL_LABELS = { b2b: 'BtoB', b2c: 'BtoC', both: 'BtoB + BtoC' };

  const payload = {
    email,
    listIds: [parseInt(process.env.BREVO_LIST_ID, 10)],
    attributes: {
      PROFIL_COMMERCIAL: PROFIL_LABELS[profil] || profil || 'non renseigné',
      SOURCE: 'Nouveau Variable — Landing',
    },
    updateEnabled: true,
  };

  const response = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  return res.status(response.ok || response.status === 204 ? 200 : response.status).json({
    ...data,
    calendlyLink: process.env.CALENDLY_LINK,
  });
}
