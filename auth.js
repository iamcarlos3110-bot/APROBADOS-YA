/* =============================================
   APROBADOS YA — Supabase Auth
   Gestión de cuentas: Login, Registro, Perfil
   Las claves públicas van aquí (son seguras)
   NUNCA poner la service_role key en frontend
============================================= */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CONFIGURACIÓN ───────────────────────────
const SUPABASE_URL = 'https://rnxqjmlmskyovgjjsfzy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3vjl9g75rHA7qa-Nj75x_Q_5tksclNY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── ESTADO DE SESIÓN ─────────────────────────
export let currentUser = null;

// ─── INICIALIZAR AUTH ─────────────────────────
export async function initAuth() {
  // Obtener sesión actual (si existe cookie/token)
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user ?? null;
  updateAuthUI();

  // Escuchar cambios de sesión en tiempo real
  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    updateAuthUI();
    if (_event === 'SIGNED_IN') {
      closeAuthModal();
      checkLocalDataMigration();
      // Sincronizar datos de Supabase al estado local
      setTimeout(() => {
        if (window.SyncManager?.syncFromDB) window.SyncManager.syncFromDB();
      }, 500);
    }
    if (_event === 'SIGNED_OUT') {
      updateAuthUI();
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

// ─── CERRAR SESIÓN ────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
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

  // Actualizar el modal de perfil si está visible
  renderProfileModal();
}

// ─── RENDERIZAR MODAL DE PERFIL ───────────────
export function renderProfileModal() {
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
    const isPremium = currentUser.user_metadata?.is_premium || false;
    const planBadge = isPremium
      ? '<span class="plan-badge premium">⭐ PREMIUM</span>'
      : '<span class="plan-badge free">FREE</span>';

    // Estadísticas locales actuales
    const stats = typeof UserManager !== 'undefined' ? UserManager.data : {};

    content.innerHTML = `
      <button class="modal-close" id="closeProfileBtn">✕</button>
      <div class="profile-header">
        <div class="profile-avatar-large">${initials}</div>
        <h3>${name}</h3>
        <p class="profile-email">${email}</p>
        ${planBadge}
        <p class="profile-date">Miembro desde ${createdAt}</p>
      </div>
      <div class="profile-stats">
        <div class="p-stat">
          <span class="p-stat-val" id="profileTotalTests">${stats.totalTests || 0}</span>
          <span class="p-stat-lbl">Tests hechos</span>
        </div>
        <div class="p-stat">
          <span class="p-stat-val" id="profileCorrect">${stats.totalCorrect || 0}</span>
          <span class="p-stat-lbl">Aciertos totales</span>
        </div>
        <div class="p-stat">
          <span class="p-stat-val" id="profileStreak">${stats.streak || 0}</span>
          <span class="p-stat-lbl">Días de racha</span>
        </div>
      </div>
      <div class="profile-actions">
        <button class="outline-btn" id="signOutBtn" style="width:100%; margin-top:16px;">
          🚪 Cerrar sesión
        </button>
      </div>
    `;

    // Bind cerrar sesión
    document.getElementById('signOutBtn')?.addEventListener('click', async () => {
      try {
        await signOut();
        closeProfileModal();
      } catch(e) {
        alert('Error al cerrar sesión: ' + e.message);
      }
    });

    // Bind close modal
    document.getElementById('closeProfileBtn')?.addEventListener('click', closeProfileModal);

  } else {
    // Usuario no autenticado: mostrar botones de Login/Registro
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
          <span class="p-stat-val" id="profileTotalTests">0</span>
          <span class="p-stat-lbl">Tests hechos</span>
        </div>
        <div class="p-stat">
          <span class="p-stat-val" id="profileCorrect">0</span>
          <span class="p-stat-lbl">Aciertos totales</span>
        </div>
        <div class="p-stat">
          <span class="p-stat-val" id="profileStreak">0</span>
          <span class="p-stat-lbl">Días de racha</span>
        </div>
      </div>
    `;

    document.getElementById('closeProfileBtn')?.addEventListener('click', closeProfileModal);
    document.getElementById('openLoginBtn')?.addEventListener('click', () => { closeProfileModal(); openAuthModal('login'); });
    document.getElementById('openRegisterBtn')?.addEventListener('click', () => { closeProfileModal(); openAuthModal('register'); });
  }
}

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

  // ── Bind: cerrar modal ──
  document.getElementById('closeAuthModalBtn').addEventListener('click', closeAuthModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeAuthModal(); });

  // ── Bind: tabs ──
  modal.querySelectorAll('.auth-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      modal.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`authPanel${capitalize(btn.dataset.tab)}`).classList.add('active');
    });
  });

  // ── Bind: olvidé contraseña ──
  document.getElementById('forgotPasswordBtn').addEventListener('click', () => {
    modal.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    modal.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('authPanelReset').classList.add('active');
  });

  // ── Bind: volver al login desde reset ──
  document.getElementById('backToLoginBtn').addEventListener('click', () => {
    modal.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    modal.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('authPanelLogin').classList.add('active');
    modal.querySelector('[data-tab="login"]').classList.add('active');
  });

  // ── Bind: Login Form ──
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
      // onAuthStateChange manejará el cierre del modal
    } catch(err) {
      errEl.textContent = translateAuthError(err.message);
      errEl.style.display = 'block';
    } finally {
      setLoadingBtn(btn, false, 'Iniciar sesión');
    }
  });

  // ── Bind: Register Form ──
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

  // ── Bind: Reset Password Form ──
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

    // Mostrar banner de migración
    showMigrationBanner(data);
  } catch(e) { /* sin datos locales */ }
}

function showMigrationBanner(data) {
  // Evitar duplicados
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
      ¿Quieres sincronizarlos con tu cuenta?
    </p>
    <div style="display:flex; gap:10px;">
      <button class="primary-btn" id="migrateSyncBtn" style="flex:1; padding:10px;">Sincronizar</button>
      <button class="outline-btn" id="migrateDismissBtn" style="flex:1; padding:10px;">Ahora no</button>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('migrateSyncBtn').addEventListener('click', async () => {
    const btn = document.getElementById('migrateSyncBtn');
    btn.textContent = 'Sincronizando...';
    btn.disabled = true;
    try {
      if (window.SyncManager?.migrateLocalDataToDB) {
        const result = await window.SyncManager.migrateLocalDataToDB();
        if (result.success) {
          banner.innerHTML = '<p style="text-align:center; padding:10px; color:var(--olive); font-weight:600;">✅ ¡Datos sincronizados correctamente!</p>';
        } else {
          banner.innerHTML = '<p style="text-align:center; padding:10px; color:var(--red);">❌ Error al sincronizar. Inténtalo de nuevo.</p>';
        }
      } else {
        banner.innerHTML = '<p style="text-align:center; padding:10px; color:var(--olive);">✅ ¡Datos sincronizados!</p>';
      }
    } catch(e) {
      banner.innerHTML = '<p style="text-align:center; padding:10px; color:var(--red);">❌ Error: ' + e.message + '</p>';
    }
    setTimeout(() => banner.remove(), 2500);
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
  if (msg.includes('Email not confirmed')) return 'Confirma tu email antes de iniciar sesión.';
  if (msg.includes('User already registered')) return 'Ya existe una cuenta con ese email.';
  if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('Unable to validate')) return 'Sesión expirada. Vuelve a iniciar sesión.';
  return msg;
}

// ─── EXPONER AL SCOPE GLOBAL ─────────────────────────
// Como auth.js es un ES module, las funciones no son globales por defecto.
// Las exponemos en window para que app_v2.js (script clásico) pueda llamarlas.
window.initAuth = initAuth;
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.signOut = signOut;
window.currentUser = () => currentUser;

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}
