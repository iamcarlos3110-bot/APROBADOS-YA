const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20' });
const { createClient } = require('@supabase/supabase-js');

// Supabase con SERVICE ROLE KEY para operaciones de backend
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { priceId, userId } = req.body;

    if (!priceId || !userId) {
      return res.status(400).json({ error: 'Missing priceId or userId' });
    }

    const host = req.headers.host || 'aprobadosya.com';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;

    // Comprobar si el usuario ya tiene un stripe_customer_id
    // para reutilizarlo y no crear clientes duplicados en Stripe
    let stripeCustomerId = null;
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (existingSub?.stripe_customer_id) {
      stripeCustomerId = existingSub.stripe_customer_id;
    }

    // Crear sesión de Stripe Checkout
    const sessionParams = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      client_reference_id: userId, // CRÍTICO: asociar el pago al usuario
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel.html`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    };

    // Si ya tiene Customer en Stripe, reutilizarlo
    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('[create-checkout] Error:', error);
    res.status(500).json({ error: error.message });
  }
}
