/**
 * ================================================================
 * ANALYTICS.JS — Aprobados Ya
 * ================================================================
 * Sistema centralizado de tracking para Google Analytics (GA4)
 * y Google Ads.
 *
 * CONFIGURACIÓN MANUAL NECESARIA:
 * ───────────────────────────────
 * 1. Crear cuenta en Google Analytics 4: https://analytics.google.com
 * 2. Crear propiedad y obtener tu Measurement ID (formato: G-XXXXXXXXXX)
 * 3. Sustituir 'G-XXXXXXXXXX' en la variable GA_MEASUREMENT_ID.
 * 4. Para Google Ads, crear una conversión en Google Ads y obtener
 *    el Conversion ID (formato: AW-XXXXXXXXX) y sustituirlo abajo.
 * ================================================================
 */

// ─────────────────────────────────────────
// CONFIGURACIÓN — Pon aquí tus IDs reales
// ─────────────────────────────────────────
const GA_MEASUREMENT_ID = null; // Ejemplo: 'G-AB12CD34EF'
const GOOGLE_ADS_ID      = null; // Ejemplo: 'AW-123456789'

// ─────────────────────────────────────────
// Inyección del script de Google Tag
// Solo se carga si hay un ID configurado
// ─────────────────────────────────────────
function loadGoogleTag() {
  if (!GA_MEASUREMENT_ID) return; // Sin ID, no cargamos nada

  // Comprobar consentimiento (cookies.js lo guarda en localStorage)
  const consent = JSON.parse(localStorage.getItem('ay_cookie_consent') || '{}');
  if (consent.analytics !== true) return; // Usuario no ha aceptado analítica

  if (window._gtag_loaded) return; // No cargar dos veces
  window._gtag_loaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { dataLayer.push(arguments); };

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
    anonymize_ip: true
  });

  // Configurar Google Ads si está disponible
  if (GOOGLE_ADS_ID) {
    gtag('config', GOOGLE_ADS_ID);
  }

  console.log('[Analytics] Google Tag cargado:', GA_MEASUREMENT_ID);
}

// ─────────────────────────────────────────
// trackEvent() — Función central de eventos
// ─────────────────────────────────────────
window.trackEvent = function(eventName, params = {}) {
  if (!GA_MEASUREMENT_ID) return; // Sin ID, no enviamos nada
  if (typeof window.gtag !== 'function') return;

  const consent = JSON.parse(localStorage.getItem('ay_cookie_consent') || '{}');
  if (consent.analytics !== true) return;

  window.gtag('event', eventName, params);
  console.log(`[Analytics] Evento: ${eventName}`, params);
};

// ─────────────────────────────────────────
// Conversiones Google Ads
// ─────────────────────────────────────────
window.trackAdsConversion = function(conversionLabel, value = 0) {
  if (!GOOGLE_ADS_ID || !conversionLabel) return;
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${conversionLabel}`,
    value: value,
    currency: 'EUR'
  });
  console.log(`[Google Ads] Conversión: ${GOOGLE_ADS_ID}/${conversionLabel}`);
};

// ─────────────────────────────────────────
// Eventos predefinidos (usar desde app_v2.js y auth.js)
// ─────────────────────────────────────────
window.AY_Events = {
  viewTest:      (permit, topic)  => trackEvent('view_test', { permit, topic }),
  startTest:     (testId)         => trackEvent('start_test', { test_id: testId }),
  completeTest:  (testId, score)  => {
    trackEvent('complete_test', { test_id: testId, score });
    trackAdsConversion('COMPLETE_TEST_LABEL'); // Sustituir COMPLETE_TEST_LABEL
  },
  register:      ()               => {
    trackEvent('sign_up', { method: 'email' });
    trackAdsConversion('REGISTER_LABEL'); // Sustituir REGISTER_LABEL
  },
  login:         ()               => trackEvent('login', { method: 'email' }),
  startCheckout: (plan)           => {
    trackEvent('begin_checkout', { currency: 'EUR', items: [{ item_name: plan }] });
    trackAdsConversion('CHECKOUT_LABEL'); // Sustituir CHECKOUT_LABEL
  },
  purchase:      (value, plan)    => {
    trackEvent('purchase', { currency: 'EUR', value, items: [{ item_name: plan }] });
    trackAdsConversion('PURCHASE_LABEL', value); // Sustituir PURCHASE_LABEL
  }
};

// ─────────────────────────────────────────
// Cargar al inicio
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadGoogleTag);

// Recargar analítica si el usuario acepta después de cargar la página
document.addEventListener('ay:consent-updated', loadGoogleTag);
