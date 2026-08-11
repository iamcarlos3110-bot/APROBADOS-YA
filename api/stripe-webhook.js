const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-03-31.basil' });
const { createClient } = require('@supabase/supabase-js');

// Configuración: bodyParser desactivado para verificar firma de Stripe
export const config = {
  api: { bodyParser: false },
};

// Helper para leer el body como raw Buffer
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Supabase con SERVICE ROLE KEY (ignora RLS - solo para operaciones seguras de backend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper: actualizar tabla subscriptions en Supabase
async function updateSubscription(userId, stripeCustomerId, subscriptionId, status, currentPeriodEnd, plan = 'monthly') {
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscriptionId,
      status,
      plan,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('[webhook] Error actualizando subscriptions:', error);
    throw error;
  }
}

// Helper: actualizar metadatos del usuario (solo para compatibilidad visual de UI)
async function updateUserPremiumMeta(userId, isPremium) {
  try {
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { is_premium: isPremium }
    });
  } catch (e) {
    console.warn('[webhook] No se pudo actualizar user_metadata (no crítico):', e.message);
  }
}

// Helper: buscar userId por stripe_subscription_id o stripe_customer_id
async function findUserBySubscription(subscriptionId, customerId) {
  // Primero intentar por subscription_id
  if (subscriptionId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();
    if (data?.user_id) return data.user_id;
  }
  // Fallback: por customer_id
  if (customerId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();
    if (data?.user_id) return data.user_id;
  }
  return null;
}

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
    console.error('[webhook] Firma inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[webhook] Evento recibido: ${event.type}`);

  try {
    // ─── CHECKOUT COMPLETADO (Primer pago / Alta) ────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      if (!userId) {
        console.error('[webhook] Sin userId (client_reference_id) en la sesión:', session.id);
        return res.status(200).json({ received: true });
      }

      // Obtener detalles de la suscripción
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      const plan = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly';

      await updateSubscription(userId, customerId, subscriptionId, 'active', currentPeriodEnd, plan);
      await updateUserPremiumMeta(userId, true);

      console.log(`[webhook] ✅ Suscripción activada para usuario ${userId}`);
    }

    // ─── SUSCRIPCIÓN ACTUALIZADA (Renovación, cambio de plan) ────
    else if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const status = subscription.status;
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

      const userId = await findUserBySubscription(subscription.id, subscription.customer);
      if (!userId) {
        console.warn('[webhook] Suscripción no encontrada en BD:', subscription.id);
        return res.status(200).json({ received: true });
      }

      await updateSubscription(userId, subscription.customer, subscription.id, status, currentPeriodEnd);

      // Actualizar meta solo si el estado cambia de forma significativa
      const isPremiumNow = status === 'active' && new Date(currentPeriodEnd) > new Date();
      await updateUserPremiumMeta(userId, isPremiumNow);

      console.log(`[webhook] ✅ Suscripción actualizada a ${status} para usuario ${userId}`);
    }

    // ─── SUSCRIPCIÓN CANCELADA / ELIMINADA ───────────────────────
    else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const userId = await findUserBySubscription(subscription.id, subscription.customer);

      if (!userId) {
        console.warn('[webhook] Suscripción cancelada no encontrada en BD:', subscription.id);
        return res.status(200).json({ received: true });
      }

      await updateSubscription(
        userId, subscription.customer, subscription.id, 'canceled',
        new Date(subscription.current_period_end * 1000).toISOString()
      );
      await updateUserPremiumMeta(userId, false);

      console.log(`[webhook] ✅ Suscripción cancelada para usuario ${userId}`);
    }

    // ─── PAGO FALLIDO (Renovación fallida) ──────────────────────
    else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      const customerId = invoice.customer;

      const userId = await findUserBySubscription(subscriptionId, customerId);
      if (!userId) {
        console.warn('[webhook] Usuario no encontrado para factura fallida:', invoice.id);
        return res.status(200).json({ received: true });
      }

      // Marcar como past_due sin quitar acceso inmediatamente
      // Stripe reintentará el cobro automáticamente
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      console.log(`[webhook] ⚠️ Pago fallido para usuario ${userId} - marcado como past_due`);
    }

    // ─── SUSCRIPCIÓN CREADA (Alta inicial, a veces llega antes que checkout.completed) ─
    else if (event.type === 'customer.subscription.created') {
      // Este evento puede llegar antes que checkout.session.completed
      // Lo manejamos para completitud, pero checkout.session.completed es el principal
      console.log(`[webhook] Suscripción creada: ${event.data.object.id}`);
    }

    // Responder 200 OK a Stripe inmediatamente
    res.status(200).json({ received: true });

  } catch (err) {
    console.error('[webhook] Error procesando evento:', err);
    res.status(500).send('Server Error');
  }
}
