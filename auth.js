/* =============================================
   APROBADOS YA — Supabase Auth v2
   - Premium validado en tabla subscriptions (no user_metadata)
   - SyncManager completo con merge no destructivo
   - Auth: Login, Registro, Recovery, Logout
   Las claves ANON/PUBLIC van aquí (diseñadas para ser públicas con RLS)
   NUNCA poner la service_role key en frontend
============================================= */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CONFIGURACIÓN ───────────────────────────
const SUPABASE_URL = 'https://rnxqjmlmskyovgjjsfzy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3vjl9g75rHA7qa-Nj75x_Q_5tksclNY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exponer el cliente para que SyncManager en app_v2.js pueda usarlo
// (app_v2.js es un script clásico, no un ES module)
window._authModule = { supabase };

// ─── ESTADO DE SESIÓN ─────────────────────────
export let currentUser = null;

// Cache de suscripción para no repetir consultas innecesarias
let _subscriptionCache = null;
let _subscriptionCacheTime = 0;
const CACHE_TTL_MS = 60000; // 1 minuto

// ─── FUNCIÓN CENTRAL isPremium() ─────────────
// Fuente de verdad: tabla subscriptions en Supabase
// NO depende de user_metadata, localStorage ni DOM
export async function isPremium() {
  if (!currentUser) return false;

  const now = Date.now();
  // Usar caché si es reciente
  if (_subscriptionCache && (now - _subscriptionCacheTime) < CACHE_TTL_MS) {
    return _isSubscriptionActive(_subscriptionCache);
  }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status, current_period_end, stripe_subscription_id, stripe_customer_id')
      .eq('user_id', currentUser.id)
      .single();

    if (error || !data) {
      _subscriptionCache = null;
      return false;
    }

    _subscriptionCache = data;
    _subscriptionCacheTime = now;
    return _isSubscriptionActive(data);
  } catch (e) {
    console.warn('[isPremium] Error consultando suscripción:', e);
    return false;
  }
}

// Valida si una fila de subscriptions es Premium activo
function _isSubscriptionActive(sub) {
  if (!sub) return false;
  if (sub.status !== 'active') return false;
  if (!sub.current_period_end) return false;
  const endDate = new Date(sub.current_period_end);
  return endDate > new Date();
}

// Limpiar caché cuando cambia la sesión
function _clearSubscriptionCache() {
  _subscriptionCache = null;
  _subscriptionCacheTime = 0;
}

// Obtener datos completos de suscripción (para mostrar en perfil)
export async function getSubscription() {
  if (!currentUser) return null;
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();
    if (error) return null;
    return data;
  } catch (e) {
    return null;
  }
}

// ─── INICIALIZAR AUTH ─────────────────────────
export async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user ?? null;
  updateAuthUI();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user ?? null;
    _clearSubscriptionCache();
    updateAuthUI();

    if (_event === 'SIGNED_IN') {
      closeAuthModal();
      // Pequeño retardo para que el DOM esté listo
      setTimeout(async () => {
        checkLocalDataMigration();
        if (window.SyncManager?.syncFromDB) {
          await window.SyncManager.syncFromDB();
        }
      }, 600);
    }

    if (_event === 'SIGNED_OUT') {
      _clearSubscriptionCache();
      updateAuthUI();
    }

    // Manejar redirección de recuperación de contraseña
    if (_event === 'PASSWORD_RECOVERY') {
      showPasswordResetForm();
    }
  });
}

// ─── REGISTRO ─────────────────────────────────
export async function signUp(name, email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name }
    }
  });
  if (error) throw error;
  return data;
}

// ─── LOGIN ────────────────────────────────────
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// ─── RECUPERAR CONTRASEÑA ─────────────────────
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/?reset=true'
  });
  if (error) throw error;
}

// ─── ACTUALIZAR CONTRASEÑA (tras recovery link) ─
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// ─── CERRAR SESIÓN ────────────────────────────
export async function signOut() {
  _clearSubscriptionCache();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ─── MOSTRAR FORMULARIO DE NUEVA CONTRASEÑA ───
function showPasswordResetForm() {
  let modal = document.getElementById('authModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal-content auth-modal-content">
      <div class="auth-logo">
        <div class="logo-mark" style="font-size:20px; padding:10px 14px;">AY</div>
        <strong style="font-size:18px; color:var(--text);">Aprobados<span style="color:var(--olive)">YA</span></strong>
      </div>
      <h3 style="color:var(--text); margin-bottom:8px;">Nueva contraseña</h3>
      <form id="newPasswordForm">
        <div class="form-group">
          <label class="form-label" for="newPwd">Nueva contraseña</label>
          <input class="form-input" type="password" id="newPwd" placeholder="Mínimo 6 caracteres" required minlength="6" autocomplete="new-password"/>
        </div>
        <div class="form-group">
          <label class="form-label" for="newPwdConfirm">Confirmar contraseña</label>
          <input class="form-input" type="password" id="newPwdConfirm" placeholder="Repite tu contraseña" required autocomplete="new-password"/>
        </div>
        <p id="newPwdError" class="auth-error" style="display:none;"></p>
        <p id="newPwdSuccess" class="auth-success" style="display:none;"></p>
        <button type="submit" class="primary-btn auth-submit-btn" id="newPwdBtn">Guardar nueva contraseña</button>
      </form>
    </div>
  `;
  modal.classList.add('active');

  document.getElementById('newPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('newPwdBtn');
    const errEl = document.getElementById('newPwdError');
    const sucEl = document.getElementById('newPwdSuccess');
    const pwd = document.getElementById('newPwd').value;
    const conf = document.getElementById('newPwdConfirm').value;

    errEl.style.display = 'none';
    sucEl.style.display = 'none';

    if (pwd !== conf) {
      errEl.textContent = 'Las contraseñas no coinciden.';
      errEl.style.display = 'block';
      return;
    }

    setLoadingBtn(btn, true, 'Guardando...');
    try {
      await updatePassword(pwd);
      sucEl.textContent = '✅ Contraseña actualizada. Ya puedes iniciar sesión.';
      sucEl.style.display = 'block';
      setTimeout(() => modal.classList.remove('active'), 2500);
    } catch (err) {
      errEl.textContent = translateAuthError(err.message);
      errEl.style.display = 'block';
    } finally {
      setLoadingBtn(btn, false, 'Guardar nueva contraseña');
    }
  });
}

// ─── ACTUALIZAR UI SEGÚN SESIÓN ───────────────
export function updateAuthUI() {
  const profileBtn = document.getElementById('profileBtn');
  const mobileProfileBtn = document.getElementById('mobileProfileBtn');

  if (currentUser) {
    const initials = (currentUser.user_metadata?.full_name || currentUser.email || 'U')
      .charAt(0).toUpperCase();
    if (profileBtn) {
      profileBtn.innerHTML = `<div class="profile-avatar-small">${initials}</div>`;
      profileBtn.title = currentUser.email;
    }
    if (mobileProfileBtn) {
      mobileProfileBtn.innerHTML = `👤 ${currentUser.user_metadata?.full_name || currentUser.email}`;
    }
  } else {
    if (profileBtn) {
      profileBtn.innerHTML = '👤';
      profileBtn.title = 'Iniciar sesión';
    }
    if (mobileProfileBtn) {
      mobileProfileBtn.innerHTML = '👤 Iniciar sesión';
    }
  }

  renderProfileModal();
}

// ─── RENDERIZAR MODAL DE PERFIL ───────────────
export async function renderProfileModal() {
  const modal = document.getElementById('profileModal');
  if (!modal) return;
  const content = modal.querySelector('.modal-content');
  if (!content) return;

  if (currentUser) {
    const name = currentUser.user_metadata?.full_name || 'Usuario';
    const email = currentUser.email;
    const createdAt = new Date(currentUser.created_at).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const initials = name.charAt(0).toUpperCase();

    // Mostrar estado de carga mientras consultamos Supabase
    content.innerHTML = `
      <button class="modal-close" id="closeProfileBtn">✕</button>
      <div style="text-align:center; padding: 40px 20px; color:var(--text2);">
        <div style="font-size:40px; margin-bottom:10px;">⏳</div>
        <p>Cargando tu perfil...</p>
      </div>
    `;
    document.getElementById('closeProfileBtn')?.addEventListener('click', closeProfileModal);

    // Consultar suscripción real desde Supabase
    const [premiumStatus, subscription] = await Promise.all([isPremium(), getSubscription()]);
    const planBadge = premiumStatus
      ? '<span class="plan-badge premium">⭐ PREMIUM</span>'
      : '<span class="plan-badge free">FREE</span>';

    // Estadísticas desde UserManager (local, sincronizadas)
    const stats = typeof UserManager !== 'undefined' ? UserManager.data : {};

    // Calcular fecha de renovación si es Premium
    let renewalHtml = '';
    if (premiumStatus && subscription?.current_period_end) {
      const renewDate = new Date(subscription.current_period_end).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      renewalHtml = `<p style="font-size:12px; color:var(--text2); margin:4px 0;">Próxima renovación: <strong>${renewDate}</strong></p>`;
    }

    content.innerHTML = `
      <button class="modal-close" id="closeProfileBtn">✕</button>
      <div class="profile-header">
        <div class="profile-avatar-large">${initials}</div>
        <h3>${name}</h3>
        <p class="profile-email">${email}</p>
        ${planBadge}
        ${renewalHtml}
        <p class="profile-date">Miembro desde ${createdAt}</p>
      </div>

      ${!premiumStatus ? `
      <div style="background: rgba(162, 187, 85, 0.1); border: 1px solid var(--olive); border-radius: 12px; padding: 16px; margin-top: 16px; text-align: center;">
        <h4 style="margin: 0 0 8px 0; color: var(--text);">Desbloquea todo el contenido</h4>
        <p style="margin: 0 0 16px 0; color: var(--text2); font-size: 14px;">Acceso ilimitado a todos los tests, permisos y funciones premium.</p>
        <button class="primary-btn" id="upgradeBtn" style="width:100%; font-size: 14px; padding: 10px;">⭐ Hacerse Premium (4,99€/mes)</button>
      </div>
      ` : `
      <div style="background: rgba(162, 187, 85, 0.1); border: 1px solid var(--olive); border-radius: 12px; padding: 16px; margin-top: 16px; text-align: center;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: var(--text2);">Tienes acceso completo a todo el contenido.</p>
        <button class="outline-btn" id="manageSubBtn" style="width:100%; font-size: 14px; padding: 10px;">⚙️ Gestionar suscripción</button>
      </div>
      `}

      <div class="profile-stats">
        <div class="p-stat">
          <span class="p-stat-val">${stats.totalTests || 0}</span>
          <span class="p-stat-lbl">Tests hechos</span>
        </div>
        <div class="p-stat">
          <span class="p-stat-val">${stats.totalCorrect || 0}</span>
          <span class="p-stat-lbl">Aciertos totales</span>
        </div>
        <div class="p-stat">
          <span class="p-stat-val">${stats.streak || 0}🔥</span>
          <span class="p-stat-lbl">Días de racha</span>
        </div>
      </div>
      <div class="profile-actions">
        <button class="outline-btn" id="signOutBtn" style="width:100%; margin-top:16px;">
          🚪 Cerrar sesión
        </button>
      </div>
    `;

    // Bind botones
    document.getElementById('closeProfileBtn')?.addEventListener('click', closeProfileModal);

    document.getElementById('signOutBtn')?.addEventListener('click', async () => {
      try {
        await signOut();
        closeProfileModal();
      } catch(e) {
        alert('Error al cerrar sesión: ' + e.message);
      }
    });

    const upgradeBtn = document.getElementById('upgradeBtn');
    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', () => _startCheckout(upgradeBtn));
    }

    const manageSubBtn = document.getElementById('manageSubBtn');
    if (manageSubBtn) {
      manageSubBtn.addEventListener('click', async () => {
        manageSubBtn.textContent = '⏳ Abriendo portal...';
        manageSubBtn.disabled = true;
        try {
          const res = await fetch('/api/customer-portal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
          });
          const data = await res.json();
          if (data.url) {
            window.location.href = data.url;
          } else {
            throw new Error(data.error || 'No se pudo abrir el portal');
          }
        } catch (e) {
          alert('Error: ' + e.message);
          manageSubBtn.textContent = '⚙️ Gestionar suscripción';
          manageSubBtn.disabled = false;
        }
      });
    }

  } else {
    // Usuario no autenticado
    const stats = typeof UserManager !== 'undefined' ? UserManager.data : {};
    content.innerHTML = `
      <button class="modal-close" id="closeProfileBtn">✕</button>
      <div class="profile-header">
        <div class="profile-avatar-large">👤</div>
        <h3>Mi cuenta</h3>
        <p class="profile-email" style="color:var(--text2);">Inicia sesión para guardar tu progreso en todos tus dispositivos.</p>
      </div>
      <div class="profile-actions" style="display:flex; flex-direction:column; gap:12px; margin-top:8px;">
        <button class="primary-btn" id="openLoginBtn" style="width:100%;">🔑 Iniciar sesión</button>
        <button class="outline-btn" id="openRegisterBtn" style="width:100%;">✨ Crear cuenta gratis</button>
      </div>
      <div class="profile-stats" style="margin-top:20px;">
        <div class="p-stat">
          <span class="p-stat-val">${stats.totalTests || 0}</span>
          <span class="p-stat-lbl">Tests hechos</span>
        </div>
        <div class="p-stat">
          <span class="p-stat-val">${stats.totalCorrect || 0}</span>
          <span class="p-stat-lbl">Aciertos</span>
        </div>
        <div class="p-stat">
          <span class="p-stat-val">${stats.streak || 0}🔥</span>
          <span class="p-stat-lbl">Racha</span>
        </div>
      </div>
    `;

    document.getElementById('closeProfileBtn')?.addEventListener('click', closeProfileModal);
    document.getElementById('openLoginBtn')?.addEventListener('click', () => { closeProfileModal(); openAuthModal('login'); });
    document.getElementById('openRegisterBtn')?.addEventListener('click', () => { closeProfileModal(); openAuthModal('register'); });
  }
}

// ─── MODAL PAYWALL (Freemium) ─────────────────
export async function triggerPaywall(reason = 'premium') {
  let modal = document.getElementById('paywallModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'paywallModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  const isAuthenticated = !!currentUser;

  // Determinar el mensaje según la razón
  const isRegistrationRequired = reason === 'register';
  const title = isRegistrationRequired ? '📚 Continúa tu preparación' : '⭐ Contenido Premium';
  const message = isRegistrationRequired
    ? 'Has completado tu test gratuito. Crea una cuenta gratis para guardar tu progreso y continuar con todos los tests.'
    : 'Este contenido es exclusivo para usuarios Premium. Desbloquea todos los tests y permisos.';

  modal.innerHTML = `
    <div class="modal-content auth-modal-content" style="text-align: center;">
      <button class="modal-close" id="closePaywallBtn">✕</button>
      <div style="font-size: 50px; margin-bottom: 16px;">${isRegistrationRequired ? '📝' : '⭐'}</div>
      <h2 style="color: var(--text); margin-bottom: 8px;">${title}</h2>
      <p style="color: var(--text2); margin-bottom: 24px; line-height: 1.5;">${message}</p>

      ${isRegistrationRequired && !isAuthenticated ? `
        <button class="primary-btn" id="paywallRegisterBtn" style="width: 100%; margin-bottom: 12px;">✨ Crear cuenta gratis</button>
        <button class="outline-btn" id="paywallLoginBtn2" style="width: 100%;">🔑 Ya tengo cuenta</button>
      ` : isAuthenticated ? `
        <button class="primary-btn" id="paywallUpgradeBtn" style="width: 100%;">⭐ Hacerse Premium (4,99€/mes)</button>
      ` : `
        <p style="color: var(--text); font-weight: 600; margin-bottom: 12px;">Inicia sesión para continuar.</p>
        <button class="primary-btn" id="paywallLoginBtn" style="width: 100%; margin-bottom: 12px;">🔑 Iniciar sesión</button>
        <button class="outline-btn" id="paywallRegisterBtn2" style="width: 100%;">✨ Crear cuenta gratis</button>
      `}
    </div>
  `;

  modal.classList.add('active');

  document.getElementById('closePaywallBtn')?.addEventListener('click', () => modal.classList.remove('active'));

  document.getElementById('paywallRegisterBtn')?.addEventListener('click', () => {
    modal.classList.remove('active');
    openAuthModal('register');
  });
  document.getElementById('paywallRegisterBtn2')?.addEventListener('click', () => {
    modal.classList.remove('active');
    openAuthModal('register');
  });
  document.getElementById('paywallLoginBtn')?.addEventListener('click', () => {
    modal.classList.remove('active');
    openAuthModal('login');
  });
  document.getElementById('paywallLoginBtn2')?.addEventListener('click', () => {
    modal.classList.remove('active');
    openAuthModal('login');
  });

  const upgradeBtn = document.getElementById('paywallUpgradeBtn');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => _startCheckout(upgradeBtn));
  }
}

// Helper para lanzar el checkout de Stripe
async function _startCheckout(btn) {
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="loader"></span>';
  btn.disabled = true;
  try {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: 'price_1U3ICvFkC2ssduzMweZ873xW',
        userId: currentUser.id
      })
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (e) {
    alert('Error al iniciar el pago: ' + e.message);
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

window.triggerPaywall = triggerPaywall;

// ─── MODAL AUTH (Login/Registro/Recuperar) ────
export function openAuthModal(tab = 'login') {
  let modal = document.getElementById('authModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  renderAuthModal(modal, tab);
  modal.classList.add('active');
}

export function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('active');
}

function renderAuthModal(modal, tab) {
  modal.innerHTML = `
    <div class="modal-content auth-modal-content">
      <button class="modal-close" id="closeAuthModalBtn">✕</button>

      <div class="auth-logo">
        <div class="logo-mark" style="font-size:20px; padding:10px 14px;">AY</div>
        <strong style="font-size:18px; color:var(--text);">Aprobados<span style="color:var(--olive)">YA</span></strong>
      </div>

      <!-- Tabs -->
      <div class="auth-tabs" id="authTabs">
        <button class="auth-tab ${tab === 'login' ? 'active' : ''}" data-tab="login">Iniciar sesión</button>
        <button class="auth-tab ${tab === 'register' ? 'active' : ''}" data-tab="register">Crear cuenta</button>
      </div>

      <!-- Panel Login -->
      <div class="auth-panel ${tab === 'login' ? 'active' : ''}" id="authPanelLogin">
        <form id="loginForm">
          <div class="form-group">
            <label class="form-label" for="loginEmail">Correo electrónico</label>
            <input class="form-input" type="email" id="loginEmail" placeholder="correo@ejemplo.com" required autocomplete="email"/>
          </div>
          <div class="form-group">
            <label class="form-label" for="loginPassword">Contraseña</label>
            <input class="form-input" type="password" id="loginPassword" placeholder="Tu contraseña" required autocomplete="current-password"/>
          </div>
          <div class="form-group" style="display:flex; align-items:center; gap:10px;">
            <input type="checkbox" id="rememberMe" style="accent-color:var(--olive); width:16px; height:16px;"/>
            <label for="rememberMe" style="font-size:13px; color:var(--text2); cursor:pointer;">Recordar sesión</label>
          </div>
          <p id="loginError" class="auth-error" style="display:none;"></p>
          <button type="submit" class="primary-btn auth-submit-btn" id="loginSubmitBtn">Iniciar sesión</button>
          <button type="button" class="auth-link-btn" id="forgotPasswordBtn">¿Olvidaste tu contraseña?</button>
        </form>
      </div>

      <!-- Panel Registro -->
      <div class="auth-panel ${tab === 'register' ? 'active' : ''}" id="authPanelRegister">
        <form id="registerForm">
          <div class="form-group">
            <label class="form-label" for="regName">Nombre completo</label>
            <input class="form-input" type="text" id="regName" placeholder="Tu nombre" required autocomplete="name"/>
          </div>
          <div class="form-group">
            <label class="form-label" for="regEmail">Correo electrónico</label>
            <input class="form-input" type="email" id="regEmail" placeholder="correo@ejemplo.com" required autocomplete="email"/>
          </div>
          <div class="form-group">
            <label class="form-label" for="regPassword">Contraseña</label>
            <input class="form-input" type="password" id="regPassword" placeholder="Mínimo 6 caracteres" required autocomplete="new-password" minlength="6"/>
          </div>
          <div class="form-group">
            <label class="form-label" for="regPasswordConfirm">Confirmar contraseña</label>
            <input class="form-input" type="password" id="regPasswordConfirm" placeholder="Repite tu contraseña" required autocomplete="new-password"/>
          </div>
          <div class="form-group" style="display:flex; align-items:flex-start; gap:10px; margin-top:4px;">
            <input type="checkbox" id="acceptTerms" style="accent-color:var(--olive); width:16px; height:16px; margin-top:2px; flex-shrink:0;" required/>
            <label for="acceptTerms" style="font-size:13px; color:var(--text2); cursor:pointer; line-height:1.4;">
              Acepto los <a href="/terminos.html" target="_blank" style="color:var(--olive);">Términos y condiciones</a> y la
              <a href="/privacidad.html" target="_blank" style="color:var(--olive);">Política de privacidad</a>.
            </label>
          </div>
          <p id="registerError" class="auth-error" style="display:none;"></p>
          <p id="registerSuccess" class="auth-success" style="display:none;"></p>
          <button type="submit" class="primary-btn auth-submit-btn" id="registerSubmitBtn">Crear cuenta gratuita</button>
        </form>
      </div>

      <!-- Panel Recuperar contraseña -->
      <div class="auth-panel" id="authPanelReset">
        <form id="resetForm">
          <p style="font-size:14px; color:var(--text2); margin-bottom:20px; line-height:1.5;">
            Escribe tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>
          <div class="form-group">
            <label class="form-label" for="resetEmail">Correo electrónico</label>
            <input class="form-input" type="email" id="resetEmail" placeholder="correo@ejemplo.com" required autocomplete="email"/>
          </div>
          <p id="resetError" class="auth-error" style="display:none;"></p>
          <p id="resetSuccess" class="auth-success" style="display:none;"></p>
          <button type="submit" class="primary-btn auth-submit-btn" id="resetSubmitBtn">Enviar enlace</button>
          <button type="button" class="auth-link-btn" id="backToLoginBtn">← Volver al inicio de sesión</button>
        </form>
      </div>

    </div>
  `;

  document.getElementById('closeAuthModalBtn').addEventListener('click', closeAuthModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeAuthModal(); });

  modal.querySelectorAll('.auth-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      modal.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`authPanel${capitalize(btn.dataset.tab)}`).classList.add('active');
    });
  });

  document.getElementById('forgotPasswordBtn').addEventListener('click', () => {
    modal.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    modal.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('authPanelReset').classList.add('active');
  });

  document.getElementById('backToLoginBtn').addEventListener('click', () => {
    modal.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    modal.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('authPanelLogin').classList.add('active');
    modal.querySelector('[data-tab="login"]').classList.add('active');
  });

  // ── Login Form ──
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginSubmitBtn');
    const errEl = document.getElementById('loginError');
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    setLoadingBtn(btn, true, 'Iniciando sesión...');
    errEl.style.display = 'none';
    try {
      await signIn(email, password);
    } catch(err) {
      errEl.textContent = translateAuthError(err.message);
      errEl.style.display = 'block';
    } finally {
      setLoadingBtn(btn, false, 'Iniciar sesión');
    }
  });

  // ── Register Form ──
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('registerSubmitBtn');
    const errEl = document.getElementById('registerError');
    const successEl = document.getElementById('registerSuccess');
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regPasswordConfirm').value;
    const terms = document.getElementById('acceptTerms').checked;

    errEl.style.display = 'none';
    successEl.style.display = 'none';

    if (password !== confirm) {
      errEl.textContent = 'Las contraseñas no coinciden.';
      errEl.style.display = 'block';
      return;
    }
    if (!terms) {
      errEl.textContent = 'Debes aceptar los términos y condiciones.';
      errEl.style.display = 'block';
      return;
    }

    setLoadingBtn(btn, true, 'Creando cuenta...');
    try {
      await signUp(name, email, password);
      successEl.textContent = '✅ ¡Cuenta creada! Revisa tu correo para verificar tu dirección antes de iniciar sesión.';
      successEl.style.display = 'block';
      document.getElementById('registerForm').reset();
    } catch(err) {
      errEl.textContent = translateAuthError(err.message);
      errEl.style.display = 'block';
    } finally {
      setLoadingBtn(btn, false, 'Crear cuenta gratuita');
    }
  });

  // ── Reset Password Form ──
  document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('resetSubmitBtn');
    const errEl = document.getElementById('resetError');
    const successEl = document.getElementById('resetSuccess');
    const email = document.getElementById('resetEmail').value.trim();
    setLoadingBtn(btn, true, 'Enviando...');
    errEl.style.display = 'none';
    successEl.style.display = 'none';
    try {
      await resetPassword(email);
      successEl.textContent = '📧 Enlace enviado. Revisa tu bandeja de entrada (y el spam).';
      successEl.style.display = 'block';
    } catch(err) {
      errEl.textContent = translateAuthError(err.message);
      errEl.style.display = 'block';
    } finally {
      setLoadingBtn(btn, false, 'Enviar enlace');
    }
  });
}

// ─── MODAL PERFIL ─────────────────────────────
export function openProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) {
    renderProfileModal();
    modal.classList.add('active');
  }
}

export function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.remove('active');
}

// ─── MIGRACIÓN DE LOCALSTORAGE ────────────────
function checkLocalDataMigration() {
  try {
    const local = localStorage.getItem('ay_progress');
    if (!local) return;
    const data = JSON.parse(local);
    const hasData = (data.totalTests > 0) || (data.favorites?.length > 0) || (data.mistakes?.length > 0);
    if (!hasData) return;
    if (localStorage.getItem('ay_sync_done') === 'true') return;

    showMigrationBanner(data);
  } catch(e) { /* sin datos locales */ }
}

function showMigrationBanner(data) {
  if (document.getElementById('migrationBanner')) return;

  const banner = document.createElement('div');
  banner.id = 'migrationBanner';
  banner.style.cssText = `
    position:fixed; bottom:20px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:2px solid var(--olive);
    border-radius:16px; padding:20px 24px; max-width:440px; width:90%;
    z-index:9999; box-shadow:0 8px 32px rgba(0,0,0,0.2);
    animation: slideUp 0.4s ease;
  `;
  banner.innerHTML = `
    <h4 style="margin:0 0 8px; font-size:15px; color:var(--text);">📦 Tienes datos guardados en este dispositivo</h4>
    <p style="margin:0 0 16px; font-size:13px; color:var(--text2); line-height:1.5;">
      Hemos encontrado tu progreso local (${data.totalTests || 0} tests, ${data.favorites?.length || 0} favoritos).
      ¿Quieres sincronizarlos con tu cuenta en la nube?
    </p>
    <div style="display:flex; gap:10px;">
      <button class="primary-btn" id="migrateSyncBtn" style="flex:1; padding:10px;">☁️ Sincronizar</button>
      <button class="outline-btn" id="migrateDismissBtn" style="flex:1; padding:10px;">Ahora no</button>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('migrateSyncBtn').addEventListener('click', async () => {
    const btn = document.getElementById('migrateSyncBtn');
    btn.textContent = '⏳ Sincronizando...';
    btn.disabled = true;
    try {
      if (window.SyncManager?.migrateLocalDataToDB) {
        const result = await window.SyncManager.migrateLocalDataToDB();
        if (result.success) {
          localStorage.setItem('ay_sync_done', 'true');
          banner.innerHTML = '<p style="text-align:center; padding:10px; color:var(--olive); font-weight:600;">✅ ¡Datos sincronizados correctamente!</p>';
        } else {
          banner.innerHTML = `<p style="text-align:center; padding:10px; color:var(--red);">❌ Error al sincronizar: ${result.error || 'Inténtalo de nuevo.'}</p>`;
        }
      } else {
        localStorage.setItem('ay_sync_done', 'true');
        banner.innerHTML = '<p style="text-align:center; padding:10px; color:var(--olive);">✅ ¡Datos sincronizados!</p>';
      }
    } catch(e) {
      banner.innerHTML = `<p style="text-align:center; padding:10px; color:var(--red);">❌ Error: ${e.message}</p>`;
    }
    setTimeout(() => banner.remove(), 3000);
  });

  document.getElementById('migrateDismissBtn').addEventListener('click', () => banner.remove());
}

// ─── UTILIDADES ────────────────────────────────
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function setLoadingBtn(btn, loading, text) {
  btn.textContent = text;
  btn.disabled = loading;
  btn.style.opacity = loading ? '0.7' : '1';
}

function translateAuthError(msg) {
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('Email not confirmed')) return 'Confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.';
  if (msg.includes('User already registered')) return 'Ya existe una cuenta con ese email.';
  if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('Unable to validate')) return 'Sesión expirada. Vuelve a iniciar sesión.';
  if (msg.includes('rate limit')) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  return msg;
}

// ─── EXPONER AL SCOPE GLOBAL ─────────────────────────
window.initAuth = initAuth;
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.signOut = signOut;
window.currentUser = () => currentUser;
// isPremium se expone para uso en app_v2.js (verificación async de paywall)
window.isPremium = isPremium;

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}
