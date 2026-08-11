/**
 * ================================================================
 * ADSENSE.JS — Aprobados Ya
 * ================================================================
 * Gestiona la carga y visibilidad de Google AdSense.
 *
 * REGLAS:
 *  - SOLO se carga publicidad para usuarios FREE.
 *  - NUNCA se carga para usuarios PREMIUM.
 *  - NUNCA se carga sin consentimiento previo de cookies.
 *  - NO se cargan anuncios durante un test activo.
 *
 * CONFIGURACIÓN MANUAL NECESARIA:
 * ───────────────────────────────
 * 1. Registrar la web en Google AdSense: https://adsense.google.com
 * 2. Tras la aprobación (puede tardar días), obtendrás:
 *    - Client ID: formato ca-pub-XXXXXXXXXXXXXXXX
 *    - Slot IDs: número de 10 dígitos, uno por cada bloque de anuncio
 * 3. Sustituir los valores null de abajo por tus IDs reales.
 * ================================================================
 */

// ─────────────────────────────────────────
// CONFIGURACIÓN — Pon aquí tus IDs reales
// ─────────────────────────────────────────
const ADSENSE_CLIENT_ID  = 'ca-pub-5821896155002687'; // Google AdSense Publisher ID
const ADSENSE_SLOT_TOP   = null; // Ejemplo: '1234567890'  (slot del banner superior)
const ADSENSE_SLOT_CONTENT = null; // Ejemplo: '0987654321' (slot del banner de contenido)
const ADSENSE_SLOT_BOTTOM  = null; // Ejemplo: '1122334455' (slot del banner inferior)

let adsenseLoaded = false;
let currentTestActive = false; // Se actualiza desde app_v2.js

// ─────────────────────────────────────────
// Marcar si hay un test activo (llamar desde app_v2.js)
// ─────────────────────────────────────────
window.AY_Ads = {
  setTestActive: (active) => {
    currentTestActive = active;
    if (active) {
      hideAllAdSlots();
    } else {
      showAdSlots();
    }
  }
};

function hideAllAdSlots() {
  document.querySelectorAll('.ay-ad-slot').forEach(el => {
    el.style.display = 'none';
  });
}

function showAdSlots() {
  if (!adsenseLoaded) return;
  document.querySelectorAll('.ay-ad-slot').forEach(el => {
    el.style.display = 'block';
  });
}

// ─────────────────────────────────────────
// Inyectar el script de AdSense
// ─────────────────────────────────────────
function loadAdSenseScript() {
  if (adsenseLoaded || !ADSENSE_CLIENT_ID) return;
  adsenseLoaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
  document.head.appendChild(script);

  console.log('[AdSense] Script cargado para cliente:', ADSENSE_CLIENT_ID);
  renderAds();
}

function renderAds() {
  const slots = [
    { id: 'ad-slot-top',     slotId: ADSENSE_SLOT_TOP,     format: 'horizontal' },
    { id: 'ad-slot-content', slotId: ADSENSE_SLOT_CONTENT, format: 'rectangle'  },
    { id: 'ad-slot-bottom',  slotId: ADSENSE_SLOT_BOTTOM,  format: 'horizontal' }
  ];

  slots.forEach(({ id, slotId, format }) => {
    const container = document.getElementById(id);
    if (!container || !slotId) return;

    container.innerHTML = `
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="${ADSENSE_CLIENT_ID}"
           data-ad-slot="${slotId}"
           data-ad-format="${format}"
           data-full-width-responsive="true"></ins>
    `;
    container.style.display = 'block';

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('[AdSense] Error al renderizar slot:', id, e);
    }
  });
}

// ─────────────────────────────────────────
// Activar/Desactivar publicidad según estado Premium
// Llamado desde auth.js tras verificar el estado real
// ─────────────────────────────────────────
window.initAdSense = function(isPremiumUser) {
  if (isPremiumUser) {
    // Usuario Premium → nunca cargar publicidad
    hideAllAdSlots();
    console.log('[AdSense] Usuario Premium: publicidad desactivada.');
    return;
  }

  // Usuario FREE → verificar consentimiento de cookies
  const consent = JSON.parse(localStorage.getItem('ay_cookie_consent') || '{}');
  if (consent.ads !== true) {
    console.log('[AdSense] Sin consentimiento de publicidad. No se cargan anuncios.');
    return;
  }

  loadAdSenseScript();
};

// Escuchar actualización de consentimiento
document.addEventListener('ay:consent-updated', () => {
  // Solo cargamos si el usuario es FREE (verificado externamente)
  const isPremium = window._cachedPremiumStatus === true;
  window.initAdSense(isPremium);
});
