const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    // Obtener stripe_customer_id desde Supabase
    const { data: sub, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (error || !sub?.stripe_customer_id) {
      return res.status(404).json({ error: 'No se encontró suscripción activa para este usuario.' });
    }

    const host = req.headers.host || 'aprobadosya.com';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const returnUrl = `${protocol}://${host}/`;

    // Crear sesión del Stripe Customer Portal
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: returnUrl
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('[customer-portal] Error:', error);
    res.status(500).json({ error: error.message });
  }
}
