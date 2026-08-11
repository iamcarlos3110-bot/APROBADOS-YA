import re

with open('app_v2.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Insert UserManager below state
user_mgr_code = '''
// ─── USER MANAGER (Progreso) ─────────────────────────────────
const UserManager = {
  data: {
    totalTests: 0,
    totalCorrect: 0,
    streak: 0,
    lastActiveDate: null,
    favorites: [],
    lastState: null // { permit, testNum, topic }
  },
  load() {
    try {
      const stored = localStorage.getItem('ay_progress');
      if (stored) {
        this.data = { ...this.data, ...JSON.parse(stored) };
      }
      this.checkStreak();
    } catch(e) { console.warn('No se pudo cargar progreso', e); }
  },
  save() {
    try {
      localStorage.setItem('ay_progress', JSON.stringify(this.data));
    } catch(e) { console.warn('No se pudo guardar progreso', e); }
  },
  checkStreak() {
    const today = new Date().toISOString().split('T')[0];
    if (this.data.lastActiveDate) {
      const last = new Date(this.data.lastActiveDate);
      const current = new Date(today);
      const diffTime = Math.abs(current - last);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays === 1) {
        // Streak continua
      } else if (diffDays > 1) {
        this.data.streak = 0; // Perdió racha
      }
    }
    this.save();
  },
  recordActivity() {
    const today = new Date().toISOString().split('T')[0];
    if (this.data.lastActiveDate !== today) {
      this.data.lastActiveDate = today;
      this.data.streak++;
      this.save();
    }
    this.updateUI();
  },
  saveLastState(permit, testNum, topic = null) {
    this.data.lastState = { permit, testNum, topic };
    this.save();
  },
  updateUI() {
    const ids = ['streakCount', 'mobileStreakCount', 'profileStreak'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if(el) el.innerText = this.data.streak;
    });
    
    const pTotal = document.getElementById('profileTotalTests');
    if(pTotal) pTotal.innerText = this.data.totalTests;
    
    const pCorrect = document.getElementById('profileCorrect');
    if(pCorrect) pCorrect.innerText = this.data.totalCorrect;
  }
};
'''

js = js.replace('const state = {', user_mgr_code + '\nconst state = {')

# 2. Add Init logic
init_logic = '''
  UserManager.load();
  UserManager.updateUI();
  initNav();
'''
js = js.replace('initTheme();', 'initTheme();\n' + init_logic)

# 3. Modify showResults to record stats
results_hook = '''
  // Registrar estadísticas
  UserManager.data.totalTests++;
  UserManager.data.totalCorrect += correct;
  UserManager.recordActivity();
  UserManager.save();
'''
js = js.replace('const wrong = results.filter(r => !r.isCorrect).length;', 'const wrong = results.filter(r => !r.isCorrect).length;\n' + results_hook)


# 4. Modify renderPermits to inject Welcome Card
welcome_card = '''
  // Tarjeta de Bienvenida
  const wc = document.getElementById('welcomeCardContainer');
  if (wc) {
    if (UserManager.data.lastState) {
      const ls = UserManager.data.lastState;
      let title = `Permiso ${ls.permit} - Test ${ls.testNum}`;
      if (ls.topic) title = `Permiso ${ls.permit} - Tema ${ls.topic} - Test ${ls.testNum}`;
      
      wc.innerHTML = `
        <div class="welcome-card">
          <div class="wc-info">
            <h3>👋 ¡Bienvenido de nuevo!</h3>
            <p>Continúa donde lo dejaste: <strong>${title}</strong></p>
            <div class="wc-progress"><div class="wc-progress-bar" style="width: 50%"></div></div>
          </div>
          <button class="wc-btn" onclick="continueLastTest()">CONTINUAR →</button>
        </div>
      `;
    } else {
      wc.innerHTML = '';
    }
  }
'''
js = js.replace('const container = document.getElementById(\'permitsGrid\');', welcome_card + '\n  const container = document.getElementById(\'permitsGrid\');')

# 5. Append Nav and new features logic
new_features = '''
// ─── NAVIGATION & NEW FEATURES ──────────────────────────────
function initNav() {
  // Desktop Nav
  document.querySelectorAll('.nav-link, .nav-icon-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      if(e.target.classList.contains('nav-link')) e.target.classList.add('active');
      const target = e.target.getAttribute('data-target') || e.target.closest('a').getAttribute('data-target');
      
      if (target === 'screen-home') renderPermits();
      else if (target === 'screen-progress') showProgressScreen();
      else if (target === 'screen-favorites') showFavoritesScreen();
      else if (target === 'screen-memorize') showMemorizeScreen();
      else showScreen(target);
    });
  });

  // Mobile Menu
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNavOverlay = document.getElementById('mobileNavOverlay');
  const mobileNavClose = document.getElementById('mobileNavClose');

  if(mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => mobileNavOverlay.classList.add('active'));
  if(mobileNavClose) mobileNavClose.addEventListener('click', () => mobileNavOverlay.classList.remove('active'));

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      mobileNavOverlay.classList.remove('active');
      const target = e.target.getAttribute('data-target');
      if (target === 'screen-home') renderPermits();
      else if (target === 'screen-progress') showProgressScreen();
      else if (target === 'screen-favorites') showFavoritesScreen();
      else if (target === 'screen-memorize') showMemorizeScreen();
      else showScreen(target);
    });
  });

  // Profile Modal
  const profileBtn = document.getElementById('profileBtn');
  const mobileProfileBtn = document.getElementById('mobileProfileBtn');
  const profileModal = document.getElementById('profileModal');
  const closeProfileBtn = document.getElementById('closeProfileBtn');

  if(profileBtn) profileBtn.addEventListener('click', () => profileModal.classList.add('active'));
  if(mobileProfileBtn) {
    mobileProfileBtn.addEventListener('click', () => {
      mobileNavOverlay.classList.remove('active');
      profileModal.classList.add('active');
    });
  }
  if(closeProfileBtn) closeProfileBtn.addEventListener('click', () => profileModal.classList.remove('active'));
  
  // Mobile Theme Toggle uses same logic as desktop
  const mobileThemeBtn = document.getElementById('mobileThemeBtn');
  if(mobileThemeBtn) {
    mobileThemeBtn.addEventListener('click', () => {
      document.getElementById('themeToggleBtn').click();
    });
  }
}

function showProgressScreen() {
  showScreen('screen-progress');
  const grid = document.getElementById('progressStatsGrid');
  grid.innerHTML = `
    <div class="progress-card olive">
      <h4>Tests Realizados</h4>
      <div class="val">${UserManager.data.totalTests}</div>
    </div>
    <div class="progress-card">
      <h4>Preguntas Acertadas</h4>
      <div class="val">${UserManager.data.totalCorrect}</div>
    </div>
    <div class="progress-card">
      <h4>Días de Racha</h4>
      <div class="val">${UserManager.data.streak} 🔥</div>
    </div>
    <div class="progress-card">
      <h4>Preguntas Favoritas</h4>
      <div class="val">${UserManager.data.favorites.length}</div>
    </div>
  `;
}

function showFavoritesScreen() {
  showScreen('screen-favorites');
  const list = document.getElementById('favoritesList');
  if (UserManager.data.favorites.length === 0) {
    list.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text3)">Aún no tienes preguntas guardadas en favoritos.</div>';
  } else {
    list.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text3)">Aquí aparecerán tus preguntas favoritas (En desarrollo la conexión con DB).</div>';
  }
}

function showMemorizeScreen() {
  showScreen('screen-memo');
  const list = document.getElementById('memoList');
  
  if (state.questions && state.questions.length > 0) {
     // User is already inside a test or selected one
     document.getElementById('memoTitle').innerText = 'Memorizar: ' + (state.topic ? 'Tema ' + state.topic : 'General');
  } else {
     // Skeleton view
     document.getElementById('memoTitle').innerText = 'Modo Memorizar';
     document.getElementById('memoSubtitle').innerText = 'Selecciona un test desde Inicio para memorizar sus preguntas, o espera a que conectemos la base global de preguntas.';
     list.innerHTML = `
        <div class="memo-item">
          <div class="memo-q-text">1. ¿Cuál es la velocidad máxima en autopista para un turismo? (Ejemplo)</div>
          <div class="memo-options">
            <div class="memo-opt memo-opt-correct"><strong>A.</strong> 120 km/h</div>
            <div class="memo-opt"><strong>B.</strong> 100 km/h</div>
            <div class="memo-opt"><strong>C.</strong> 90 km/h</div>
          </div>
        </div>
     `;
  }
}

// Favoritos Logic para el futuro
function toggleFavorite(qId) {
   const idx = UserManager.data.favorites.indexOf(qId);
   if (idx === -1) {
       UserManager.data.favorites.push(qId);
   } else {
       UserManager.data.favorites.splice(idx, 1);
   }
   UserManager.save();
}

async function continueLastTest() {
  const ls = UserManager.data.lastState;
  if (!ls) return;
  // Restore state
  state.permit = ls.permit;
  state.topic = ls.topic;
  state.testNum = ls.testNum;
  state.testMode = 'test';
  
  try {
      if (state.permit === 'B') {
          const raw = await db.fetchB();
          const match = raw.find(t => t.id == ls.testNum);
          if(match) state.questions = match.questions;
      } else {
          const raw = await db.fetchDGT();
          const perms = raw.tests[state.permit];
          if(perms) {
              const arr = state.topic ? perms.topics[state.topic] : perms.general;
              const match = arr.find(t => t.id == ls.testNum);
              if(match) state.questions = match.questions;
          }
      }
      
      if (state.questions && state.questions.length > 0) {
          state.isOfficialDgt = (state.permit !== 'B');
          renderEngine();
      } else {
          alert('No se pudo cargar el test guardado. Puede que la base de datos haya cambiado.');
      }
  } catch(e) {
      console.error(e);
      alert('Error al reanudar el test.');
  }
}

// Make globally accessible
window.continueLastTest = continueLastTest;
'''
js += '\n' + new_features

# 6. Save lastState when starting a test
save_state_hook = '''
  // Guardar estado
  UserManager.saveLastState(state.permit, state.testNum, state.topic);
'''
js = js.replace('state.currentQuestion = 0;', 'state.currentQuestion = 0;\n' + save_state_hook)

with open('app_v2.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("app_v2.js updated successfully.")
