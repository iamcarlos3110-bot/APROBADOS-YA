/**
 * ================================================================
 * COOKIES.JS — Aprobados Ya
 * Consentimiento GDPR — Banner no bloqueante
 * ================================================================
 * Gestiona el consentimiento del usuario para cookies según
 * la normativa europea (GDPR/LOPDGDD).
 *
 * Categorías:
 *  - necessary: siempre activas (sesión, preferencias)
 *  - analytics: Google Analytics
 *  - ads: Google AdSense
 * ================================================================
 */

const COOKIE_KEY = 'ay_cookie_consent';

function getConsent() {
  try {
    return JSON.parse(localStorage.getItem(COOKIE_KEY) || 'null');
  } catch { return null; }
}

function saveConsent(analytics, ads) {
  const consent = { necessary: true, analytics, ads, date: new Date().toISOString() };
  localStorage.setItem(COOKIE_KEY, JSON.stringify(consent));
  document.dispatchEvent(new Event('ay:consent-updated'));
  return consent;
}

function hideBanner() {
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.style.display = 'none';
}

function showBanner() {
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.style.display = 'flex';
}

function showPanel() {
  const panel = document.getElementById('cookiePanel');
  if (panel) panel.style.display = 'flex';
}

function hidePanel() {
  const panel = document.getElementById('cookiePanel');
  if (panel) panel.style.display = 'none';
}

function syncCheckboxes(consent) {
  const chkAnalytics = document.getElementById('chkAnalytics');
  const chkAds = document.getElementById('chkAds');
  if (chkAnalytics) chkAnalytics.checked = consent?.analytics === true;
  if (chkAds) chkAds.checked = consent?.ads === true;
}

function init() {
  const existing = getConsent();

  // Si ya existe preferencia guardada, aplicarla directamente
  if (existing) {
    hideBanner();
    // Disparar evento para que analytics.js y adsense.js reaccionen
    setTimeout(() => document.dispatchEvent(new Event('ay:consent-updated')), 100);
    return;
  }

  // Primera visita → mostrar banner
  showBanner();
}

document.addEventListener('DOMContentLoaded', () => {
  init();

  // Botón "Aceptar todo"
  const btnAcceptAll = document.getElementById('cookieBtnAcceptAll');
  if (btnAcceptAll) {
    btnAcceptAll.addEventListener('click', () => {
      saveConsent(true, true);
      hideBanner();
    });
  }

  // Botón "Rechazar todo"
  const btnRejectAll = document.getElementById('cookieBtnRejectAll');
  if (btnRejectAll) {
    btnRejectAll.addEventListener('click', () => {
      saveConsent(false, false);
      hideBanner();
    });
  }

  // Botón "Configurar"
  const btnConfigure = document.getElementById('cookieBtnConfigure');
  if (btnConfigure) {
    btnConfigure.addEventListener('click', () => {
      hideBanner();
      const consent = getConsent();
      syncCheckboxes(consent);
      showPanel();
    });
  }

  // Panel: Guardar preferencias
  const btnSavePrefs = document.getElementById('cookieBtnSave');
  if (btnSavePrefs) {
    btnSavePrefs.addEventListener('click', () => {
      const analytics = document.getElementById('chkAnalytics')?.checked || false;
      const ads = document.getElementById('chkAds')?.checked || false;
      saveConsent(analytics, ads);
      hidePanel();
    });
  }

  // Panel: Cerrar sin guardar
  const btnClosePanel = document.getElementById('cookiePanelClose');
  if (btnClosePanel) {
    btnClosePanel.addEventListener('click', () => {
      hidePanel();
      if (!getConsent()) showBanner(); // Volver a mostrar si no hay preferencia
    });
  }

  // Enlace "Gestionar cookies" en el footer
  document.querySelectorAll('[data-action="manage-cookies"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const consent = getConsent();
      syncCheckboxes(consent);
      showPanel();
    });
  });
});
