const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Configuración especial requerida por Stripe Webhooks en Vercel
export const config = {
  api: {
    bodyParser: false, // Stripe requiere el raw body para verificar la firma
  },
};

// Helper para leer el body en raw
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Inicializar Supabase con SERVICE ROLE KEY (Ignora RLS para modificar la DB)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // ─── MANEJO DE EVENTOS STRIPE ─────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      if (!userId) {
        console.error('⚠️  No userId (client_reference_id) en la sesión.', session.id);
        return res.status(200).json({ received: true });
      }

      // Obtener detalles de la suscripción para el fin del periodo
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

      // Guardar en Supabase
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: 'active',
          plan: 'monthly',
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error actualizando Supabase:', error);
        throw error;
      }

      // Actualizar metadatos del usuario para que el frontend lo sepa
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { is_premium: true }
      });

      console.log(`✅ Suscripción activada para el usuario ${userId}`);
    }

    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (fetchError || !data) {
        console.error('⚠️  No se encontró la suscripción en la BD.');
        return res.status(200).json({ received: true });
      }

      const status = subscription.status; // 'active', 'past_due', 'canceled', etc.
      
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) throw error;

      // Si se cancela o expira, quitar premium
      if (status !== 'active') {
        await supabase.auth.admin.updateUserById(data.user_id, {
          user_metadata: { is_premium: false }
        });
      }

      console.log(`✅ Suscripción actualizada a ${status} para usuario ${data.user_id}`);
    }

    // Responder 200 OK a Stripe rápidamente
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error procesando webhook:', err);
    res.status(500).send(`Server Error`);
  }
}
