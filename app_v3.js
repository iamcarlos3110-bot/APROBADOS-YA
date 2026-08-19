/* =============================================
   APROBADOS YA - App Logic
   Pantallas: permits → topics → tests → engine / memo → results
============================================= */
'use strict';

// ─── ESTADO GLOBAL & DATA SERVICE ──────────────────


// ─── USER MANAGER (Progreso) ─────────────────────────────────
// ─── USER MANAGER (Progreso Avanzado FASE 1 + Reorganización) ────────────────
const UserManager = {
  data: {
    totalTests: 0,
    totalCorrect: 0,
    streak: 0,
    lastActiveDate: null,
    favorites: [],
    mistakes: [],          // Array of Q IDs that user got wrong
    topicStats: {},        // { "B": { "1": { correct: 10, total: 15 } } }
    dailyQuestions: 0,     // Questions answered today
    lastState: null,       // { permitId, testNum, topicId, currentQuestion, answers }
    lastPermit: null       // Last used permit ID
  },
  load() {
    try {
      const stored = localStorage.getItem('ay_progress');
      if (stored) {
        this.data = { ...this.data, ...JSON.parse(stored) };
        if(!this.data.mistakes) this.data.mistakes = [];
        if(!this.data.topicStats) this.data.topicStats = {};
      }
      this.checkDaily();
    } catch(e) { console.warn('No se pudo cargar progreso', e); }
  },
  save() {
    try {
      localStorage.setItem('ay_progress', JSON.stringify(this.data));
      if (typeof window.currentUser === 'function' && window.currentUser() && window.SyncManager?.saveProgressToDB) {
        window.SyncManager.saveProgressToDB(this.data);
      }
    } catch(e) { console.warn('No se pudo guardar progreso', e); }
  },
  checkDaily() {
    const today = new Date().toISOString().split('T')[0];
    if (this.data.lastActiveDate !== today) {
      if (this.data.lastActiveDate) {
        const last = new Date(this.data.lastActiveDate);
        const current = new Date(today);
        const diffDays = Math.ceil(Math.abs(current - last) / (1000 * 60 * 60 * 24)); 
        if (diffDays > 1) this.data.streak = 0; 
        else if (diffDays === 1 && this.data.dailyQuestions >= 30) {
           // Continua racha
        }
      }
      this.data.dailyQuestions = 0; 
    }
  },
  recordActivity() {
    const today = new Date().toISOString().split('T')[0];
    if (this.data.lastActiveDate !== today) {
      this.data.lastActiveDate = today;
      this.data.streak++; 
    }
    this.save();
    this.updateUI();
  },
  recordQuestionResult(permitId, topicId, qId, isCorrect) {
    this.data.dailyQuestions++;
    if(isCorrect) this.data.totalCorrect++;

    if(!isCorrect && !this.data.mistakes.includes(qId)) {
        this.data.mistakes.push(qId);
    } else if (isCorrect && this.data.mistakes.includes(qId)) {
        this.data.mistakes = this.data.mistakes.filter(id => id !== qId);
    }

    if(!this.data.topicStats[permitId]) this.data.topicStats[permitId] = {};
    const t = topicId || 'general';
    if(!this.data.topicStats[permitId][t]) this.data.topicStats[permitId][t] = { correct: 0, total: 0 };
    this.data.topicStats[permitId][t].total++;
    if(isCorrect) this.data.topicStats[permitId][t].correct++;

    this.recordActivity();
  },
  saveLastState(permitObj, testNum, topicObj = null, currentQ = 0, ans = {}) {
    const pId = typeof permitObj === 'object' ? permitObj.id : permitObj;
    const tId = (topicObj && typeof topicObj === 'object') ? topicObj.id : topicObj;
    this.data.lastState = { permitId: pId, testNum, topicId: tId, currentQuestion: currentQ, answers: ans };
    this.data.lastPermit = pId;
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
  },
  reset() {
    this.data = {
      totalTests: 0,
      totalCorrect: 0,
      streak: 0,
      lastActiveDate: null,
      favorites: [],
      mistakes: [],
      topicStats: {},
      dailyQuestions: 0,
      lastState: null,
      lastPermit: null
    };
    try {
      localStorage.removeItem('ay_progress');
      localStorage.removeItem('ay_test_history');
      localStorage.removeItem('dgt_user_data_v2');
      localStorage.removeItem('testProgress');
    } catch(e) {}
    this.updateUI();
  }
};
window.UserManager = UserManager;


// ─── SYNCMANAGER ──────────────────────────────────────────────
// Definido en sync.js como módulo ES.
// Aquí se declara un stub mínimo para evitar ReferenceErrors en la carga inicial.
window.SyncManager = window.SyncManager || {
  async syncFromDB() {},
  async migrateLocalDataToDB() { return { success: false, reason: 'loading' }; },
  async saveProgressToDB() {},
  async saveTestResultToDB() {},
  async recordMistakeToDB() {},
  async recordMistakesBulkToDB() {}
};

const state = {
  permit: null,

  permit: null,
  topic: null,
  testNum: null,
  testMode: null, // 'test' | 'memo'
  currentQuestion: 0,
  answers: {}, // { index: 'A' }
  score: 0,
  questions: [], // Preguntas del test actual
  isOfficialDgt: false, // flag para saber el origen
  isSimulacro: false,
  timerInterval: null,
  timeLeft: 0
};

class DataService {
  constructor() {
    this.permits = [];
    this.themes = {};
    this.dgtTests = [];
    this.dgtQuestions = [];
  }

  async initialize() {
    try {
      const v = Date.now();
      const [pRes, tRes, dtRes, dqRes, ayBRes] = await Promise.all([
        fetch(`data/permits.json?v=${v}`).then(r => r.json()),
        fetch(`data/themes.json?v=${v}`).then(r => r.json()),
        fetch(`data/dgt-tests.json?v=${v}`).then(r => r.json()),
        fetch(`data/dgt-questions.json?v=${v}`).then(r => r.json()),
        fetch(`data/ay-questions-B.json?v=${v}`).then(r => r.json()).catch(() => [])
      ]);
      this.permits = pRes;
      this.themes = tRes;
      this.dgtTests = dtRes;
      this.dgtQuestions = dqRes;
      
      // Shuffle options so the correct answer isn't always A
      this.dgtQuestions.forEach(q => {
        if (!q.respuestas || typeof q.respuestas !== 'object' || Array.isArray(q.respuestas)) return;
        
        const keys = Object.keys(q.respuestas);
        for (let i = keys.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [keys[i], keys[j]] = [keys[j], keys[i]];
        }
        
        const newRespuestas = {};
        let newCorrecta = q.correcta;
        const letters = ['A', 'B', 'C', 'D'];
        
        keys.forEach((oldKey, idx) => {
            const newLetter = letters[idx];
            newRespuestas[newLetter] = q.respuestas[oldKey];
            if (q.correcta === oldKey) {
                newCorrecta = newLetter;
            }
        });
        
        q.respuestas = newRespuestas;
        q.correcta = newCorrecta;
      });

      this.ayQuestionsB = ayBRes;
    } catch (error) {
      console.error("Error loading data:", error);
      // We don't block, maybe the local server isn't running and data.js is fallback
    }
  }

  getPermits() {
    return this.permits;
  }

  getThemes(permitId) {
    return this.themes[permitId] || [];
  }

  getTestsBySource(source, permitId, themeId) {
    if (source === 'DGT') {
      return this.dgtTests.filter(t => !t.permit_id || t.permit_id === permitId);
    }
    // APROBADOS YA mock structure
    return Array.from({length: 100}, (_, i) => ({
      id: `AY-${permitId}-${themeId}-${i+1}`,
      numero: i + 1,
      titulo: `Test de ${themeId}`,
      fuente: 'APROBADOS YA',
      numero_preguntas: 30,
      tipo: 'aprobados_ya_demo'
    }));
  }

  getQuestionsByTest(testId) {
    return this.dgtQuestions.filter(q => q.test_id === testId);
  }

  getAyQuestions(permitId, themeId, testNum) {
    const allPermitQs = this.dgtQuestions.filter(q => q.permit_id === permitId);
    
    // We will distribute the questions across the themes.
    // Let's get the index of the theme to deterministically pick a block of questions.
    const themes = this.getThemes(permitId).filter(t => t.id !== 'oficiales');
    const themeIdx = themes.findIndex(t => t.id === themeId);
    
    let bank = [];
    if (allPermitQs.length > 0) {
        // Find questions that belong to this theme. If none have a specific theme, use the pool.
        const themeQs = allPermitQs.filter(q => q.theme_id === themeId);
        if (themeQs.length > 0) {
            bank = themeQs;
        } else {
            // Fallback for earlier tests where we didn't save theme_id, 
            // we will just use the old offset logic if we have to, or just the pool.
            bank = allPermitQs;
        }
    }
    
    // Check legacy QBANK as fallback
    if (bank.length === 0 && typeof QBANK !== 'undefined') {
      bank = (QBANK[permitId] && QBANK[permitId][themeId]) || [];
    }

    if (bank.length > 0) {
      // If we filtered by theme_id, we just start at (testNum - 1) * 30
      // If we didn't, we might need an offset if we want to simulate it, but we can just use 0 since legacy is QBANK
      const isThemeFiltered = allPermitQs.some(q => q.theme_id === themeId);
      const offset = (!isThemeFiltered && themeIdx !== -1) ? (themeIdx * 10) : 0; 
      
      let testQs = 30;
      if (permitId === 'ADR') {
         if (themeId === 'obtencion_basico') testQs = 30;
         else if (themeId.includes('obtencion')) testQs = 20;
         else if (themeId === 'renovacion_basico') testQs = 20;
         else testQs = 10;
      } else if (permitId === 'C' || permitId === 'CE') {
         testQs = 20;
      }
      
      const start = ((testNum - 1) + offset) * testQs;
      
      const real = [];
      for (let i = 0; i < testQs; i++) {
        real.push(bank[(start + i) % bank.length]);
      }
      const result = [...real];
      
      const formatted = result.map(q => {
        // If it's from github it already has respuestas formatted as dict
        if (q.respuestas && typeof q.respuestas === 'object' && !Array.isArray(q.respuestas)) {
           return q; // already formatted!
        }
        
        // Legacy QBANK formatting
        return {
          id: q.id,
          pregunta: q.q,
          imagen_url: q.image,
          imagen_local: q.image && !q.image.startsWith('http') ? `images/${q.image}` : null,
          respuestas: {
            'A': q.options[0],
            'B': q.options[1],
            'C': q.options[2],
            'D': q.options[3]
          },
          correcta: String.fromCharCode(65 + q.correct),
          explanation: q.explanation,
          fuente: 'APROBADOS YA'
        };
      });

      for (let i = formatted.length; i < testQs; i++) {
        formatted.push({
          id: `PH_${testNum}_${i + 1}`,
          pregunta: `Pregunta ${i + 1} - Contenido pendiente`,
          respuestas: {'A':'Opción A','B':'Opción B','C':'Opción C'},
          correcta: 'A',
          explanation: 'Contenido pendiente de importar.',
          fuente: 'APROBADOS YA',
          isPlaceholder: true
        });
      }
      return formatted;
    }
    return [];
  }
}

const db = new DataService();

// ─── PANTALLAS ──────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  window.scrollTo(0,0);

  // Sincronizar clases active en los enlaces de navegación (escritorio y móvil)
  let targetId = id;
  if (id === 'screen-prep') targetId = 'screen-progress';
  if (id === 'screen-memo') targetId = 'screen-memorize';
  if (id === 'screen-senales' || id === 'screen-apuntes' || id === 'screen-favorites') targetId = 'screen-premium';
  
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    if (link.getAttribute('data-target') === targetId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  const safeScreens = ['screen-home', 'screen-premium', 'screen-profile', 'screen-progress', 'screen-senales', 'screen-apuntes', 'screen-memo', 'screen-favorites', 'screen-prep', 'screen-por-libre'];
  if (safeScreens.includes(id)) {
      localStorage.setItem('lastActiveScreen', id);
  } else {
      localStorage.setItem('lastActiveScreen', 'screen-home');
  }
}

// ─── NAV HELPERS ────────────────────────────────────

  if(document.getElementById('logoLink')) document.getElementById('logoLink').addEventListener('click', (e) => {
    e.preventDefault();
    renderPermits();
  });

if(document.getElementById('backToHome')) document.getElementById('backToHome').addEventListener('click', renderPermits);
if(document.getElementById('backToTopics')) document.getElementById('backToTopics').addEventListener('click', renderTopics);
if(document.getElementById('exitTestBtn')) document.getElementById('exitTestBtn').addEventListener('click', () => {
  showAppConfirm('Salir del test', '¿Seguro que quieres salir? Se perderá tu progreso actual.', () => {
      if (state.timerInterval) {
          clearInterval(state.timerInterval);
          state.timerInterval = null;
      }
      if (document.getElementById('simulacroTimerBox')) document.getElementById('simulacroTimerBox').style.display = 'none';
      if (document.getElementById('btnSubmitExam')) document.getElementById('btnSubmitExam').style.display = 'none';
      if (document.getElementById('testQuestionWrap')) document.getElementById('testQuestionWrap').classList.remove('simulacro-mode');
      state.isSimulacro = false;

      if (!state.topic) {
          if(typeof showPrepScreen === 'function') showPrepScreen(); else startPreparation();
      } else {
          renderTests();
      }
  });
});
if(document.getElementById('exitMemoBtn')) document.getElementById('exitMemoBtn').addEventListener('click', renderPermits);
if(document.getElementById('goToTestsBtn')) document.getElementById('goToTestsBtn').addEventListener('click', renderTests);
if(document.getElementById('retryTestBtn')) document.getElementById('retryTestBtn').addEventListener('click', () => {
  startTest(state.testNum, 'test', state.isOfficialDgt);
});


// ─── INIT ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Capture last screen before renderPermits overwrites it
  const lastScreen = localStorage.getItem('lastActiveScreen');

  initTheme();

  UserManager.load();
  UserManager.updateUI();
  initNav();

  await db.initialize();
  renderPermits();

  // Restore safe screens from localStorage
  const safeScreens = ['screen-premium', 'screen-profile', 'screen-progress', 'screen-senales', 'screen-apuntes', 'screen-memo', 'screen-favorites', 'screen-prep', 'screen-por-libre'];
  if (lastScreen && safeScreens.includes(lastScreen)) {
      if (lastScreen === 'screen-senales' && typeof openPremiumSenales === 'function') {
          openPremiumSenales();
      } else if (lastScreen === 'screen-apuntes' && typeof openPremiumApuntes === 'function') {
          openPremiumApuntes();
      } else if (lastScreen === 'screen-memo') {
          showMemorizeScreen();
      } else if (lastScreen === 'screen-favorites') {
          showFavoritesScreen();
      } else if (lastScreen === 'screen-prep' || lastScreen === 'screen-progress') {
          if (typeof showPrepScreen === 'function') showPrepScreen(); else showScreen(lastScreen);
      } else {
          showScreen(lastScreen);
      }
  }

  // Inicializar Auth (Supabase) si está disponible
  if (typeof window.initAuth === 'function') {
    await window.initAuth();
  }
});

// ─── THEME LOGIC ────────────────────────────────────
function initTheme() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const iconLight = document.querySelector('.theme-icon-light');
  const iconDark = document.querySelector('.theme-icon-dark');
  
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem('ay_theme');
  } catch (e) {
    console.warn('localStorage not available', e);
  }
  
  function setDark() {
      document.body.classList.add('dark-theme');
      localStorage.setItem('ay_theme', 'dark');
      if(iconLight) iconLight.style.display = 'none';
      if(iconDark) iconDark.style.display = 'block';
      const mCheck = document.getElementById('mobileThemeCheckbox');
      if(mCheck) mCheck.checked = true;
    }
    
    function setLight() {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('ay_theme', 'light');
      if(iconLight) iconLight.style.display = 'block';
      if(iconDark) iconDark.style.display = 'none';
      const mCheck = document.getElementById('mobileThemeCheckbox');
      if(mCheck) mCheck.checked = false;
    }

  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    setDark();
  } else {
    setLight();
  }
  
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-theme');
      if (isDark) setDark(); else setLight();
    });
  }

  // Mobile Theme Toggle uses same logic as desktop
  const mobileThemeCheckbox = document.getElementById('mobileThemeCheckbox');
  if(mobileThemeCheckbox) {
    mobileThemeCheckbox.addEventListener('change', (e) => {
      if(e.target.checked) {
        setDark();
      } else {
        setLight();
      }
    });
  }
}

// ─── RENDER PERMITS ─────────────────────────────────

function renderPermits() {
  
  const container = document.getElementById('permitsGrid');
  container.innerHTML = '';
  
  if (db.getPermits().length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; background: #fff3f3; color: #d9534f; padding: 20px; border-radius: 8px; border: 1px solid #ffcccc; text-align: center;">
        <h3 style="margin-top:0;">⚠️ Error de Carga</h3>
        <p>No se han podido cargar los datos de los tests.</p>
        <p>Como ahora usamos una arquitectura profesional con archivos <b>.json</b>, tu navegador bloquea la lectura directa por seguridad si estás abriendo el archivo haciendo doble clic (protocolo <code>file://</code>).</p>
        <p style="font-weight:bold; margin-top:15px;">Solución:</p>
        <p>Debes abrir esta web usando un servidor local. Si usas VSCode, instala la extensión <b>Live Server</b> y dale a "Go Live", o pídele al asistente que inicie un servidor por ti.</p>
      </div>
    `;
    showScreen('screen-home');
    return;
  }

  db.getPermits().forEach(p => {
    const card = document.createElement('div');
    card.className = 'permit-card';
    const isPopular = (p.id === 'B');
    if (isPopular) card.classList.add('permit-card--popular');
    card.innerHTML = `
      ${isPopular ? '<div class="permit-popular-badge">⭐ Más popular</div>' : ''}
      <div class="permit-icon">${p.icon}</div>
      <div class="permit-name">${p.name}</div>
      <div class="permit-desc">${p.subtitle}</div>
      <div class="permit-arrow">
        <span class="permit-topics-count">DGT</span>
        <span class="primary-btn" style="padding: 6px 14px; font-size: 12px; border-radius: 99px;">Entrar ➔</span>
      </div>
    `;
    card.addEventListener('click', () => {
      state.permit = p;
      renderTopics();
    });
    container.appendChild(card);
  });
  showScreen('screen-home');
}

// ─── RENDER TOPICS ──────────────────────────────────

function getThemeIcon(id, name) {
    const txt = (id + ' ' + name).toLowerCase();
    if (txt.includes('oficial')) return '🏛️';
    if (txt.includes('señal') || txt.includes('señali')) return '🛑';
    if (txt.includes('norma')) return '📏';
    if (txt.includes('prioridad')) return '🚦';
    if (txt.includes('velocidad')) return '⏱️';
    if (txt.includes('adelantam')) return '🚙';
    if (txt.includes('alcohol') || txt.includes('droga')) return '🍷';
    if (txt.includes('mecánic') || txt.includes('mecanic')) return '⚙️';
    if (txt.includes('ilumin') || txt.includes('luces')) return '💡';
    if (txt.includes('ambiente') || txt.includes('contamin')) return '🌱';
    if (txt.includes('accidente') || txt.includes('auxilio')) return '🚑';
    if (txt.includes('maniobra')) return '🔄';
    if (txt.includes('conductor') || txt.includes('estado')) return '👤';
    if (txt.includes('vía') || txt.includes('via') || txt.includes('calzada')) return '🛣️';
    if (txt.includes('seguridad')) return '🛡️';
    if (txt.includes('document')) return '📁';
    if (txt.includes('carga')) return '📦';
    if (txt.includes('pasajero')) return '👥';
    if (txt.includes('motocicleta')) return '🏍️';
    return '📚';
}

function renderTopics() {
  const p = state.permit;
  if(document.getElementById('topicsPermitBadge')) document.getElementById('topicsPermitBadge').textContent = `${p.icon} ${p.name}`;
  if(document.getElementById('topicsTitle')) document.getElementById('topicsTitle').textContent = `Temario ${p.name}`;
  
  const container = document.getElementById('topicsGrid');
  container.innerHTML = '';

  db.getThemes(p.id).forEach(t => {
    const card = document.createElement('div');
    card.className = 'topic-card';
    const icon = getThemeIcon(t.id, t.name);
    card.innerHTML = `
      <div class="topic-info" style="display:flex; align-items:center; gap:14px;">
        <span style="font-size:28px; flex-shrink:0; line-height:1;">${icon}</span>
        <div>
          <div class="topic-name" style="margin-bottom:0;">${t.name}</div>
          ${t.id === 'oficiales' ? '<span class="status-badge" style="background:var(--olive); color:white; font-size:11px; padding:3px 8px; border-radius:6px; margin-top:4px; display:inline-block;">★ OFICIAL DGT</span>' : ''}
        </div>
      </div>
      <div class="topic-caret">
        <span class="primary-btn sm" style="padding: 6px 14px; font-size: 11px; border-radius: 99px; pointer-events: none;">Entrar</span>
      </div>
    `;
    card.addEventListener('click', () => {
        state.topic = t;
        renderTests();
    });
    container.appendChild(card);
  });

  showScreen('screen-topics');
}

// ─── RENDER TESTS ───────────────────────────────────

function renderTests() {
  const p = state.permit;
  const t = state.topic;
  if (!t) { renderPermits(); return; }
  
  if(document.getElementById('testsPermitBadge')) document.getElementById('testsPermitBadge').textContent = `${p.icon} ${p.name}`;
  if(document.getElementById('testsTitle')) document.getElementById('testsTitle').textContent = `Tests: ${t.name}`;
  
  const container = document.getElementById('testsGrid');
  container.innerHTML = '';

  if (t.id === 'oficiales') {
    // OFICIAL DGT TESTS
    const dgtTests = db.getTestsBySource('DGT', p.id, t.id);
    if (dgtTests.length === 0) {
      container.innerHTML = '<p style="grid-column:1/-1;">No hay tests oficiales importados todavía.</p>';
    } else {
      dgtTests.forEach(test => {
        const card = document.createElement('div');
        card.className = 'test-card';
        card.innerHTML = `
          <div class="test-card-header">
            <h3>Test DGT ${test.numero || test.id.replace('DGT-','')}</h3>
            <span class="status-badge" style="background:var(--primary); color:white;">★ OFICIAL DGT</span>
          </div>
          <div class="status-desc" style="font-size:12px; margin-bottom:15px; color:var(--text2); display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <span style="background:rgba(0,0,0,0.05); padding:4px 10px; border-radius:12px; font-weight:500;">📝 ${test.numero_preguntas || 30} Preguntas</span>
            <span style="background:rgba(0,0,0,0.05); padding:4px 10px; border-radius:12px; font-weight:500;">📅 ${test.fecha || 'Reciente'}</span>
          </div>
          <div class="test-card-btns">
            <button class="tc-btn primary" data-id="${test.id}" data-mode="test">▶ Hacer test</button>
            <button class="tc-btn secondary" data-id="${test.id}" data-mode="memo">🧠 Memorizar</button>
          </div>
        `;
        container.appendChild(card);
      });
    }
  } else {
    // APROBADOS YA TESTS
    const allPermitQs = db.dgtQuestions.filter(q => q.permit_id === p.id);
    const themes = db.getThemes(p.id).filter(th => th.id !== 'oficiales');
    const themeIdx = themes.findIndex(th => th.id === t.id);
    const offset = themeIdx !== -1 ? (themeIdx * 10) : 0;
    
    for (let n = 1; n <= t.numTests; n++) {
      let isEmpty = false;
      let label = '○ Próximamente';
      
      let testQs = 30;
      if (p.id === 'ADR') {
          if (t.id === 'obtencion_basico') testQs = 30;
          else if (t.id.includes('obtencion')) testQs = 20;
          else if (t.id === 'renovacion_basico') testQs = 20;
          else testQs = 10;
      } else if (p.id === 'C' || p.id === 'CE') {
          testQs = 20;
      }

      const isThemeFiltered = allPermitQs.some(q => q.theme_id === t.id);
      const computedOffset = (!isThemeFiltered && themeIdx !== -1) ? (themeIdx * 10) : 0;
      const start = ((n - 1) + computedOffset) * testQs;
      
      // Check if we have enough questions in the master pool for this test
      if (allPermitQs.length > start) {
         // Also check if we specifically filter by theme, do we have enough?
         if (isThemeFiltered) {
             const themeQs = allPermitQs.filter(q => q.theme_id === t.id);
             if (themeQs.length > start) {
                 label = '● Disponible';
             } else {
                 isEmpty = true;
             }
         } else {
             label = '● Disponible';
         }
      } else {
        // Comprobar disponibilidad si tenemos data.js (legacy)
        if (typeof QBANK !== 'undefined' && QBANK[p.id] && QBANK[p.id][t.id]) {
          const bank = QBANK[p.id][t.id];
          const legStart = (n - 1) * 30;
          if (bank.length > legStart) {
            const real = bank.slice(legStart, n * 30).length;
            label = real > 0 ? '● Disponible' : '◑ Demo';
          } else {
            isEmpty = true;
          }
        } else {
          isEmpty = true;
        }
      }
      
      if (isEmpty) continue;

      const card = document.createElement('div');
      card.className = 'test-card';
      card.innerHTML = `
        <div class="test-card-header">
          <h3>TEST ${n.toString().padStart(2, '0')}</h3>
          <span class="status-badge">${label}</span>
        </div>
        <div class="status-desc" style="font-size:12px; margin-bottom:15px; color:var(--text2); display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <span style="background:rgba(0,0,0,0.05); padding:4px 10px; border-radius:12px; font-weight:500;">📝 ${testQs} Preguntas</span>
            <span style="background:rgba(0,0,0,0.05); padding:4px 10px; border-radius:12px; font-weight:500;">💡 Exclusivo</span>
        </div>
        <div class="test-card-btns">
          <button class="tc-btn primary" data-n="${n}" data-mode="test">▶ Hacer test</button>
          <button class="tc-btn secondary" data-n="${n}" data-mode="memo">🧠 Memorizar</button>
        </div>
      `;
      container.appendChild(card);
    }
  }

  // Bind clicks
  container.querySelectorAll('.tc-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = e.target.getAttribute('data-mode');
      const dgtId = e.target.getAttribute('data-id');
      const testNum = e.target.getAttribute('data-n');
      
      if (dgtId) {
        startTest(dgtId, mode, true);
      } else if (testNum) {
        startTest(parseInt(testNum), mode, false);
      }
    });
  });

  showScreen('screen-tests');
}

// ─── START TEST ─────────────────────────────────────
// ASYNC: la validación Premium consulta Supabase de forma segura
async function startTest(testIdentifier, mode, isOfficial = false) {
  // Limpiar temporizador y estado de simulacro previo si existe
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  if (document.getElementById('simulacroTimerBox')) document.getElementById('simulacroTimerBox').style.display = 'none';
  if (document.getElementById('btnSubmitExam')) document.getElementById('btnSubmitExam').style.display = 'none';
  if (document.getElementById('testQuestionWrap')) document.getElementById('testQuestionWrap').classList.remove('simulacro-mode');
  state.isSimulacro = false;

  // Determinar número del test para lógica freemium
  let testNum = 1;
  if (typeof testIdentifier === 'string' && testIdentifier.includes('-')) {
    // Para DGT tests, el número está en la posición 2: DGT-B-1 → 1
    const parts = testIdentifier.split('-');
    testNum = parseInt(parts[parts.length - 1]) || 1;
  } else {
    testNum = parseInt(testIdentifier) || 1;
  }

  // ── LÓGICA FREEMIUM ──────────────────────────────
  if (testNum > 1) {
    const user = typeof window.currentUser === 'function' ? window.currentUser() : null;

    if (!user) {
      // Sin cuenta: pedir registro (no pago)
      if (typeof window.triggerPaywall === 'function') {
        window.triggerPaywall('register');
      }
      return;
    }

    // Con cuenta FREE: consultar estado real en Supabase
    const isUserPremium = typeof window.isPremium === 'function' ? await window.isPremium() : false;
    if (!isUserPremium) {
      if (typeof window.triggerPaywall === 'function') {
        window.triggerPaywall('premium');
      }
      return;
    }
  }
  // ── FIN LÓGICA FREEMIUM ───────────────────────────

  state.testMode = mode;
  state.isOfficialDgt = isOfficial;
  state.testNum = testIdentifier;

  if (isOfficial) {
    state.questions = db.getQuestionsByTest(testIdentifier);
  } else {
    state.questions = db.getAyQuestions(state.permit.id, state.topic.id, testIdentifier);
  }

  if (mode === 'test') {
    state.currentQuestion = 0;
    // Guardar estado para continuar después
    UserManager.saveLastState(state.permit, state.testNum, state.topic, state.currentQuestion, state.answers);
    state.answers = {};
    state.score = 0;
    renderEngineUI();
    renderQuestion(0);
    showScreen('screen-test');
  } else {
    renderMemo();
    showScreen('screen-memo');
  }
}

// ─── TEST ENGINE ────────────────────────────────────
function renderEngineUI() {
  const title = document.getElementById('testLabel');
  if (state.isOfficialDgt) {
    title.innerHTML = `TEST DGT: ${state.testNum.replace('DGT-','')} <span style="font-size:12px; background:var(--olive); padding:3px 8px; border-radius:6px; color:white; vertical-align:middle;">OFICIAL</span>`;
  } else {
    title.textContent = `TEST ${state.testNum.toString().padStart(2, '0')}`;
  }
}

function renderQuestion(index) { if(!UserManager.data.favorites) UserManager.data.favorites = [];
  state.currentQuestion = index;
  const q = state.questions[index]; if (!q) { if(document.getElementById('questionText')) document.getElementById('questionText').textContent = 'Error: No se pudo cargar la pregunta (BD vaca o ndice invlido).'; return; }
  const total = state.questions.length;
  
  // Progress
  const pct = Math.round(((index + 1) / total) * 100);
  if(document.getElementById('testProgFill')) document.getElementById('testProgFill').style.width = `${pct}%`;
  if(document.getElementById('testProgCurrent')) document.getElementById('testProgCurrent').textContent = index + 1;
  if(document.getElementById('testProgTotal')) document.getElementById('testProgTotal').textContent = total;
  const qc = document.getElementById('testQCounter');
  if (qc) qc.textContent = `${index + 1}/${total}`;
  
  if(document.getElementById('questionNum')) document.getElementById('questionNum').textContent = `Pregunta ${index + 1} de ${total}`;
    
    const btnFav = document.getElementById('btnToggleFavorite');
    if (btnFav) {
      const isFav = UserManager.data.favorites.includes(q.id);
      btnFav.textContent = isFav ? '⭐' : '☆';
      btnFav.style.color = isFav ? 'var(--olive)' : 'var(--text3)';
      btnFav.onclick = () => {
         toggleFavorite(q.id);
         const nowFav = UserManager.data.favorites.includes(q.id);
         btnFav.textContent = nowFav ? '⭐' : '☆';
         btnFav.style.color = nowFav ? 'var(--olive)' : 'var(--text3)';
      };
    }
    
    const qText = document.getElementById('questionText');
  qText.textContent = q.pregunta;
  if (q.isPlaceholder) {
    qText.innerHTML = `<span style="color:#d9534f;">⚠️ ${q.pregunta}</span>`;
  }

  // Imagen
  const imgEl = document.getElementById('questionImg');
  if (q.imagen_url || q.imagen_local) {
    const src = q.imagen_local || q.imagen_url;
    if (typeof src === 'string' && (src.includes('.jpg') || src.includes('.JPG') || src.includes('.png') || src.startsWith('http'))) {
      imgEl.innerHTML = `<img src="${src}" referrerpolicy="no-referrer" alt="Ilustración de la pregunta" style="max-width:100%; max-height:220px; object-fit:contain; border-radius:4px; display:block; margin: 0 auto;" />`;
    } else {
      imgEl.innerHTML = q.imagen_url || q.imagen_local;
    }
    imgEl.style.display = 'flex';
  } else {
    imgEl.style.display = 'none';
  }

  // Opciones
  const optsContainer = document.getElementById('questionOptions');
  optsContainer.innerHTML = '';
  
  const answered = state.answers[index] !== undefined;
  
  Object.keys(q.respuestas).forEach(key => {
    if(!q.respuestas[key]) return;

    const btn = document.createElement('button');
    btn.className = 'option-btn';
    
    if (answered) {
      if (state.isSimulacro) {
         if (state.answers[index] === key) btn.classList.add('selected');
      } else {
         btn.disabled = true;
         if (key === q.correcta) btn.classList.add('correct-opt');
         else if (state.answers[index] === key) btn.classList.add('wrong-opt');
      }
    }

    btn.innerHTML = `<span class="option-letter">${key}</span><span>${q.respuestas[key]}</span>`;

    if (!q.isPlaceholder) {
      if (!answered || state.isSimulacro) {
        btn.addEventListener('click', () => {
          state.answers[index] = key;
          if (!state.isSimulacro && key === q.correcta && !answered) state.score++;
          renderQuestion(index);
        });
      }
    }
    
    optsContainer.appendChild(btn);
  });

  const feedback = document.getElementById('questionFeedback');
  const fhdr = document.getElementById('feedbackHeader');
  const fexp = document.getElementById('feedbackExplanation');
  const nextBtn = document.getElementById('nextQuestionBtn');

  if (answered) {
    if (feedback) feedback.style.display = 'block';
    
    if (state.isSimulacro) {
        if (fhdr) fhdr.style.display = 'none';
        if (fexp) fexp.style.display = 'none';
    } else {
        if (fhdr) fhdr.style.display = 'block';
        if (fexp) fexp.style.display = 'block';
        if (q.isPlaceholder) {
            if (fhdr) {
                fhdr.className = 'feedback-header wrong';
                fhdr.textContent = 'Pendiente de importar';
            }
            if (fexp) fexp.innerHTML = `<em>${q.explanation}</em>`;
        } else {
            const isCorrect = state.answers[index] === q.correcta;
            if (fhdr) {
                fhdr.className = `feedback-header ${isCorrect ? 'correct' : 'wrong'}`;
                fhdr.textContent = isCorrect ? '✅ ¡Respuesta correcta!' : `❌ Incorrecto - La correcta era: ${q.correcta}`;
            }
            if (fexp) fexp.textContent = q.explanation || (q.fuente === 'Revista DGT' ? 'Respuesta oficial DGT: ' + q.correcta : '');
        }
    }

    if (nextBtn) {
        nextBtn.textContent = (index === total - 1) ? 'Finalizar Test' : 'Siguiente pregunta →';
        nextBtn.onclick = () => {
          if (index === total - 1) {
            if (state.isSimulacro) {
                submitSimulacro();
            } else {
                showResults();
            }
          } else {
            renderQuestion(index + 1);
          }
        };
    }
  } else {
    feedback.style.display = 'none';
  }
}

// ─── RESULTADOS ─────────────────────────────────────
function showResults() {
  const results = Object.keys(state.answers).map(idx => ({
    isCorrect: state.answers[idx] === state.questions[idx].correcta,
    q: state.questions[idx],
    selected: state.answers[idx]
  }));

  const correct = state.score;
  const total = state.questions.filter(q => !q.isPlaceholder).length;
  const wrong = results.filter(r => !r.isCorrect).length;

  // FASE 1: Registrar estadísticas detalladas sin lanzar 30 peticiones red concurrentes
  UserManager.data.totalTests++;
  
  const pId = (state.permit && typeof state.permit === 'object') ? state.permit.id : (state.permit || 'B');
  const tId = (state.topic && typeof state.topic === 'object') ? state.topic.id : (state.topic || 'general');
  
  results.forEach(r => {
      UserManager.data.dailyQuestions++;
      if (r.isCorrect) UserManager.data.totalCorrect++;

      if (!r.isCorrect && !UserManager.data.mistakes.includes(r.q.id)) {
          UserManager.data.mistakes.push(r.q.id);
      } else if (r.isCorrect && UserManager.data.mistakes.includes(r.q.id)) {
          UserManager.data.mistakes = UserManager.data.mistakes.filter(id => id !== r.q.id);
      }

      if (!UserManager.data.topicStats[pId]) UserManager.data.topicStats[pId] = {};
      const t = tId || 'general';
      if (!UserManager.data.topicStats[pId][t]) UserManager.data.topicStats[pId][t] = { correct: 0, total: 0 };
      UserManager.data.topicStats[pId][t].total++;
      if (r.isCorrect) UserManager.data.topicStats[pId][t].correct++;
  });
  
  UserManager.data.lastState = null;
  UserManager.recordActivity(); // Guarda localmente y lanza una sola petición de progreso en la nube

  // ─── FASE F: Sincronizar con Supabase si hay sesión ────────
  if (window.SyncManager && typeof window.currentUser === 'function' && window.currentUser()) {
    const testId = state.isOfficialDgt
      ? `DGT-${pId}-${state.testNum}`
      : `AY-${pId}-${tId}-${state.testNum}`;

    // Guardar historial del test
    window.SyncManager.saveTestResultToDB({
      testId, permitId: pId, topicId: tId, correct, wrong, total
    });

    // Guardar errores/aciertos en lote en la DB (2 peticiones en total)
    if (typeof window.SyncManager.recordMistakesBulkToDB === 'function') {
      window.SyncManager.recordMistakesBulkToDB(results);
    } else {
      results.forEach(r => {
        window.SyncManager.recordMistakeToDB(r.q.id, r.isCorrect);
      });
    }
  }


  const skipped = total - results.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  if(document.getElementById('resultScoreText')) document.getElementById('resultScoreText').textContent = `${correct}/${total}`;
  const circle = document.getElementById('resultScoreCircle');
  circle.className = `result-score-circle${pct < 70 ? ' fail' : ''}`;
  
  if(document.getElementById('resultEmoji')) document.getElementById('resultEmoji').textContent = pct >= 90 ? '🎉' : pct >= 70 ? '👍' : '📚';
  if(document.getElementById('resultTitle')) document.getElementById('resultTitle').textContent = pct >= 90 ? '¡Excelente resultado!' : pct >= 70 ? '¡Buen trabajo!' : 'Sigue practicando';
  if(document.getElementById('resultSubtitle')) document.getElementById('resultSubtitle').textContent = `Has acertado ${correct} de ${total} preguntas (${pct}%).${pct < 70 ? ' Revisa las respuestas y vuelve a intentarlo.' : ''}`;

  const statsEl = document.getElementById('resultStats');
  statsEl.innerHTML = `
    <div class="rs-pill green"><div class="rs-val">${correct}</div><div class="rs-lab">Correctas</div></div>
    <div class="rs-pill red">  <div class="rs-val">${wrong}</div>  <div class="rs-lab">Incorrectas</div></div>
    <div class="rs-pill">      <div class="rs-val">${skipped}</div><div class="rs-lab">Sin responder</div></div>
    <div class="rs-pill">      <div class="rs-val">${pct}%</div>   <div class="rs-lab">Aciertos</div></div>
  `;

  const reviewEl = document.getElementById('resultReview');
  reviewEl.innerHTML = '';
  results.forEach((r, i) => {
    const ok = r.isCorrect;
    const div = document.createElement('div');
    div.className = `rr-item ${ok ? 'ok' : 'err'}`;
    const explText = typeof r.q.explanation === 'string' ? r.q.explanation : (r.q.explanation ? JSON.stringify(r.q.explanation) : (r.q.explicacion ? (typeof r.q.explicacion === 'string' ? r.q.explicacion : JSON.stringify(r.q.explicacion)) : ''));
    div.innerHTML = `
      <div class="rr-icon">${ok ? '✅' : '❌'}</div>
      <div class="rr-content">
        <div class="rr-q">${i+1}. ${r.q.pregunta}</div>
        <div class="rr-ans">
          ${!ok ? `<span class="err-a">${r.selected ? r.q.respuestas[r.selected] : 'Ninguna'}</span>` : ''}
          <span class="ok-a">✓ ${r.q.respuestas[r.q.correcta]}</span>
        </div>
        ${explText ? `
          <div class="rr-expl" style="margin-top: 10px; padding: 10px 14px; background: var(--bg-warm); border-left: 3px solid var(--olive); border-radius: 6px; font-size: 13px; line-height: 1.5; color: var(--text2);">
            <strong>💡 Explicación:</strong> ${explText}
          </div>
        ` : ''}
      </div>
    `;
    reviewEl.appendChild(div);
  });

  showScreen('screen-result');
}

// ─── MEMORIZAR ──────────────────────────────────────
function renderMemo() {
  const p = state.permit;
  if(document.getElementById('memoPermitBadge')) document.getElementById('memoPermitBadge').textContent = `${p.icon} ${p.name}`;
  
  const title = document.getElementById('memoTitle');
  if (state.isOfficialDgt) {
    title.innerHTML = `Test DGT: ${state.testNum.replace('DGT-','')} <span style="font-size:12px; background:var(--olive); padding:3px 8px; border-radius:6px; color:white; vertical-align:middle;">OFICIAL</span>`;
  } else {
    title.textContent = `Memorizar TEST ${state.testNum.toString().padStart(2, '0')}`;
  }
  
  const container = document.getElementById('memoList');
  container.innerHTML = '';
  
  state.questions.forEach((q, i) => {
    const card = document.createElement('div');
    card.className = 'memo-card';
    
    const placeholderBadge = q.isPlaceholder 
      ? `<div class="memo-placeholder-badge">⚠️ Contenido pendiente de importar</div>`
      : '';

    let imgHtml = '';
    if (q.imagen_url || q.imagen_local) {
      const src = q.imagen_local || q.imagen_url;
      if (typeof src === 'string' && (src.includes('.jpg') || src.includes('.JPG') || src.includes('.png') || src.startsWith('http'))) {
        imgHtml = `<div class="memo-img" style="border:none; background:transparent;"><img src="${src}" referrerpolicy="no-referrer" alt="Ilustración" style="max-width:100%; max-height:200px; object-fit:contain; border-radius:4px; display:block; margin:0 auto;" /></div>`;
      } else {
        imgHtml = `<div class="memo-img">${src}</div>`;
      }
    }

    let optionsHtml = '';
    Object.keys(q.respuestas).forEach(key => {
      if(!q.respuestas[key]) return;
      const isCorrect = key === q.correcta;
      optionsHtml += `
        <div class="memo-option ${isCorrect ? 'correct' : ''}">
          <span style="font-weight:bold; margin-right:8px;">${key}</span> 
          ${q.respuestas[key]}
        </div>
      `;
    });

    card.innerHTML = `
      <div class="memo-card-header">
        <span class="memo-qnum">Pregunta ${i + 1}</span>
      </div>
      ${placeholderBadge}
      <div class="memo-text">${q.pregunta}</div>
      ${imgHtml}
      <div class="memo-options-list">
        ${optionsHtml}
      </div>
      <div class="memo-explanation">
        ${q.explanation || (q.fuente === 'Revista DGT' ? 'Respuesta oficial DGT: ' + q.correcta : '')}
      </div>
    `;
    container.appendChild(card);
  });
}


// ─── NAVIGATION & NEW FEATURES ──────────────────────────────
function initNav() {
  // Desktop Nav
  document.querySelectorAll('.nav-link, .nav-icon-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      if(e.target.classList.contains('nav-link')) e.target.classList.add('active');
      const target = e.target.getAttribute('data-target') || e.target.closest('a').getAttribute('data-target');
      
      if (target === 'screen-home') {
          renderPermits();
          setTimeout(() => {
              const grid = document.getElementById('permitsGrid');
              if (grid) { const y = grid.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo({ top: y, behavior: 'smooth' }); }
          }, 50);
      }
      else if (target === 'screen-progress') showPrepScreen();
      else if (target === 'screen-favorites') showFavoritesScreen();
      else if (target === 'screen-memorize') showMemorizeScreen();
      else showScreen(target);
    });
  });

  // Mobile Menu
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNavOverlay = document.getElementById('mobileNavOverlay');
  const mobileNavClose = document.getElementById('mobileNavClose');

  if(mobileMenuBtn && mobileNavOverlay) mobileMenuBtn.addEventListener('click', () => mobileNavOverlay.classList.add('active'));
  if(mobileNavClose && mobileNavOverlay) mobileNavClose.addEventListener('click', () => mobileNavOverlay.classList.remove('active'));

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (mobileNavOverlay) mobileNavOverlay.classList.remove('active');
      const target = e.target.getAttribute('data-target') || e.target.closest('a').getAttribute('data-target');
      if (target === 'screen-home') {
          renderPermits();
          setTimeout(() => {
              const grid = document.getElementById('permitsGrid');
              if (grid) { const y = grid.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo({ top: y, behavior: 'smooth' }); }
          }, 50);
      }
      else if (target === 'screen-progress') showPrepScreen();
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

  if(profileBtn) profileBtn.addEventListener('click', () => {
    if (typeof window.openProfileModal === 'function') window.openProfileModal();
    else if (profileModal) profileModal.classList.add('active');
  });
  if(mobileProfileBtn) {
    mobileProfileBtn.addEventListener('click', () => {
      if (mobileNavOverlay) mobileNavOverlay.classList.remove('active');
      if (typeof window.openProfileModal === 'function') window.openProfileModal();
      else if (profileModal) profileModal.classList.add('active');
    });
  }
  // closeProfileBtn is now handled dynamically by auth.js renderProfileModal
  if(closeProfileBtn && profileModal) closeProfileBtn.addEventListener('click', () => profileModal.classList.remove('active'));
}







// Make globally accessible
window.continueLastTest = continueLastTest;

// ─── FASE 1: REORGANIZACIÓN (MI PREPARACIÓN) Y NUEVAS FUNCIONES ───

function renderTopCards() {
  const wc = document.getElementById('homeTopCards');
  if (!wc) return;
  
  let html = '';
  
  if (UserManager.data.lastState && UserManager.data.lastState.testNum) {
    const ls = UserManager.data.lastState;
    // Get real names
    const pObj = db.getPermits().find(p => p.id === ls.permitId);
    let title = `Permiso ${pObj ? pObj.name : ls.permitId} - Test ${ls.testNum}`;
    
    if (ls.topicId && pObj) {
       const tObj = db.getThemes(ls.permitId).find(t => t.id === ls.topicId);
       if (tObj) title = `Permiso ${pObj.name} - Tema: ${tObj.name} - Test ${ls.testNum}`;
    }

    const qNum = (ls.currentQuestion || 0) + 1;
    const progressPct = Math.round(((qNum - 1) / 30) * 100) || 5;
    
    html += `
      <div class="home-card-btn" style="grid-column: span 2; align-items: flex-start; text-align: left;" onclick="continueLastTest()">
        <h3 style="margin-top:0;">👋 ¡Bienvenido de nuevo!</h3>
        <p style="color:var(--text2); font-size:14px; margin-top:8px;">Continúa donde lo dejaste:<br><strong>${title}</strong></p>
        <p style="font-size:12px; margin-top:8px;">Pregunta ${qNum}/30</p>
        <div class="daily-goal-bar-wrap" style="margin: 8px 0;"><div class="daily-goal-bar" style="width: ${progressPct}%"></div></div>
        <button class="primary-btn" style="margin-top:8px; padding: 8px 16px; font-size:14px;">CONTINUAR →</button>
      </div>
    `;
  } else {
    html += `
      <div class="home-card-btn" style="grid-column: span 2; align-items: flex-start; text-align: left; cursor: pointer;" onclick="startPreparation()">
        <h3 style="margin-top:0;">🎯 ¡Comienza tu preparación!</h3>
        <p style="color:var(--text2); font-size:14px; margin-top:8px;">Haz clic aquí para elegir un tema e iniciar un test.</p>
      </div>
    `;
  }

  html += `
    <div class="home-card-btn" onclick="startSpecialTest('quick')">
      <div class="icon">⚡</div>
      <h3>Test Rápido</h3>
      <p style="font-size:12px; color:var(--text3); margin-top:4px;">10 preguntas</p>
    </div>
  `;

  html += `
    <div class="home-card-btn" onclick="startSpecialTest('mistakes')">
      <div class="icon">❌</div>
      <h3>Mis Errores</h3>
      <p style="font-size:12px; color:var(--text3); margin-top:4px;">${UserManager.data.mistakes.length} preguntas</p>
    </div>
  `;

  wc.innerHTML = html;
}

function showAppAlert(title, message) {
    let overlay = document.getElementById('customAlertOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'customAlertOverlay';
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '100000';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width: 350px; text-align: center; padding: 30px 20px;">
                <h3 id="customAlertTitle" style="margin-top:0; font-size: 20px; color: var(--text);"></h3>
                <p id="customAlertMessage" style="color: var(--text2); margin: 15px 0 25px;"></p>
                <button class="primary-btn" onclick="if(document.getElementById('customAlertOverlay')) document.getElementById('customAlertOverlay').classList.remove('active')" style="width: 100%;">Entendido</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    if(document.getElementById('customAlertTitle')) document.getElementById('customAlertTitle').textContent = title;
    if(document.getElementById('customAlertMessage')) document.getElementById('customAlertMessage').textContent = message;
    overlay.classList.add('active');
}
window.showAppAlert = showAppAlert;

function showAppConfirm(title, message, onConfirm) {
    let overlay = document.getElementById('customConfirmOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'customConfirmOverlay';
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '100000';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width: 350px; text-align: center; padding: 30px 20px;">
                <h3 id="customConfirmTitle" style="margin-top:0; font-size: 20px; color: var(--text);"></h3>
                <p id="customConfirmMessage" style="color: var(--text2); margin: 15px 0 25px;"></p>
                <div style="display: flex; gap: 10px;">
                    <button class="secondary-btn" id="customConfirmCancelBtn" style="flex:1;">Cancelar</button>
                    <button class="primary-btn" id="customConfirmOkBtn" style="flex:1; background-color: #d9534f; color: white;">Aceptar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        if(document.getElementById('customConfirmCancelBtn')) document.getElementById('customConfirmCancelBtn').onclick = () => {
            if(document.getElementById('customConfirmOverlay')) document.getElementById('customConfirmOverlay').classList.remove('active');
        };
    }
    
    if(document.getElementById('customConfirmTitle')) document.getElementById('customConfirmTitle').textContent = title;
    if(document.getElementById('customConfirmMessage')) document.getElementById('customConfirmMessage').textContent = message;
    
    if(document.getElementById('customConfirmOkBtn')) document.getElementById('customConfirmOkBtn').onclick = () => {
        if(document.getElementById('customConfirmOverlay')) document.getElementById('customConfirmOverlay').classList.remove('active');
        if (typeof onConfirm === 'function') onConfirm();
    };
    
    overlay.classList.add('active');
}
window.showAppConfirm = showAppConfirm;


function startPreparation() {
    const permitId = UserManager.data.lastPermit || 'B';
    const pObj = db.getPermits().find(p => p.id === permitId);
    if (pObj) {
        state.permit = pObj;
        renderTopics();
    } else {
        renderPermits();
    }
}
window.startPreparation = startPreparation;

async function startSpecialTest(type) {
  let permitId = UserManager.data.lastPermit || 'B';
  
  let allQuestions = [];
  try {
     allQuestions = db.dgtQuestions.filter(q => q.permit_id === permitId);
  } catch(e) { console.error(e); showAppAlert('Error', 'Error cargando preguntas.'); return; }
  
  if (allQuestions.length === 0) {
      showAppAlert("Sin preguntas", "No hay preguntas disponibles para el permiso " + permitId);
      return;
  }

  const pObj = db.getPermits().find(p => p.id === permitId);
  state.permit = pObj || { id: permitId, name: 'Permiso ' + permitId, icon: '🚗' };
  state.topic = null;
  state.testMode = 'test';
  
  if (type === 'quick') {
      state.testNum = 'Rápido';
      state.questions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
  } else if (type === 'mistakes') {
      state.testNum = 'Mis Errores';
      const mistakesQ = allQuestions.filter(q => UserManager.data.mistakes.includes(q.id));
      if (mistakesQ.length === 0) {
          showAppAlert("¡Enhorabuena!", "No tienes preguntas falladas guardadas para este permiso.");
          return;
      }
      state.questions = mistakesQ.sort(() => 0.5 - Math.random()).slice(0, 30);
  }
  
  state.isOfficialDgt = (permitId !== 'B');
  
  state.currentQuestion = 0;
  state.answers = {};
  state.score = 0;

  showScreen('screen-test');
  renderEngineUI();
  renderQuestion(0);
}

async function continueLastTest() {
  const ls = UserManager.data.lastState;
  if (!ls) return;
  
  const pObj = db.getPermits().find(p => p.id === ls.permitId);
  state.permit = pObj || { id: ls.permitId, name: 'Permiso ' + ls.permitId, icon: '🚗' };
  
  if (ls.topicId) {
      const tObj = db.getThemes(ls.permitId).find(t => t.id === ls.topicId);
      state.topic = tObj || { id: ls.topicId, name: 'Tema ' + ls.topicId };
  } else {
      state.topic = null;
  }
  
  state.testNum = ls.testNum;
  state.testMode = 'test';
  state.currentQuestion = ls.currentQuestion || 0;
  state.answers = ls.answers || {};
  
  try {
      const isOfficial = ls.testNum && typeof ls.testNum === 'string' && ls.testNum.startsWith('DGT');
      if (ls.testNum === 'Pregunta del Día') {
          const allPermitQs = db.dgtQuestions.filter(q => q.permit_id === ls.permitId);
          if (allPermitQs.length > 0) {
              const seedStr = new Date().toISOString().slice(0, 10);
              let seed = 0;
              for(let i=0; i<seedStr.length; i++) seed += seedStr.charCodeAt(i);
              const randomIndex = seed % allPermitQs.length;
              state.questions = [allPermitQs[randomIndex]];
          } else {
              state.questions = [];
          }
      } else if (isOfficial) {
          state.questions = db.getQuestionsByTest(ls.testNum);
      } else {
          state.questions = db.getAyQuestions(ls.permitId, ls.topicId, parseInt(ls.testNum));
      }
      
      if (state.questions && state.questions.length > 0) {
          state.isOfficialDgt = isOfficial;
          showScreen('screen-test');
          renderEngineUI();
          renderQuestion(state.currentQuestion);
      } else {
          showAppAlert('Error', 'No se pudo cargar el test guardado.');
      }
  } catch(e) { console.error(e); }
}

function showPrepScreen() {
  showScreen('screen-prep');
  renderTopCards();
  
  const grid = document.getElementById('progressStatsGrid');
  const dailyPct = Math.min(100, Math.round((UserManager.data.dailyQuestions / 30) * 100));
  
  let topicsHtml = '';
  let allTopics = [];
  for (let pId in UserManager.data.topicStats) {
      const pObj = db.getPermits().find(p => p.id === pId);
      const pName = pObj ? pObj.name : pId;
      
      for (let tId in UserManager.data.topicStats[pId]) {
          const stat = UserManager.data.topicStats[pId][tId];
          if(stat.total >= 5) { 
              const pct = Math.round((stat.correct / stat.total) * 100);
              let tName = 'General';
              if (tId !== 'general') {
                  const tObj = db.getThemes(pId).find(t => t.id === tId);
                  tName = tObj ? tObj.name : 'Tema ' + tId;
              }
              allTopics.push({ name: `Permiso ${pName} - ${tName}`, pct });
          }
      }
  }
  allTopics.sort((a,b) => a.pct - b.pct);
  
  if (allTopics.length > 0) {
      allTopics.forEach(t => {
          let dot = '🟢'; let color = 'score-green';
          if(t.pct < 60) { dot = '🔴'; color = 'score-red'; }
          else if(t.pct < 80) { dot = '🟠'; color = 'score-orange'; }
          topicsHtml += `<div class="progress-item"><span class="progress-item-name">${dot} ${t.name}</span><span class="progress-item-score ${color}">${t.pct}%</span></div>`;
      });
  } else {
      topicsHtml = `<div class="progress-item"><span class="progress-item-name" style="color:var(--text3)">Responde al menos 5 preguntas de un tema para analizarlo.</span></div>`;
  }
  
  const pctTotal = UserManager.data.totalTests > 0 ? Math.round((UserManager.data.totalCorrect / (UserManager.data.totalTests * 30)) * 100) || 0 : 0;
  
  grid.innerHTML = `
    <div style="grid-column: 1 / -1; margin-bottom: 20px;">
        <h3 style="margin-top:0">🎯 Objetivo Diario</h3>
        <p style="color:var(--text2); font-size:14px; margin-top:4px;">${UserManager.data.dailyQuestions} / 30 preguntas respondidas</p>
        <div class="daily-goal-bar-wrap"><div class="daily-goal-bar" style="width: ${dailyPct}%"></div></div>
    </div>
    
    <div class="progress-card olive"><h4>Tests Realizados</h4><div class="val">${UserManager.data.totalTests}</div></div>
    <div class="progress-card"><h4>Preguntas Acertadas</h4><div class="val">${UserManager.data.totalCorrect}</div></div>
    <div class="progress-card"><h4>Aciertos Totales</h4><div class="val">${pctTotal}%</div></div>
    <div class="progress-card"><h4>Mis Errores</h4><div class="val" style="color:#E74C3C">${UserManager.data.mistakes.length}</div></div>
    <div class="progress-card"><h4>Días de Racha</h4><div class="val">${UserManager.data.streak} 🔥</div></div>
    
    <div style="grid-column: 1 / -1; margin-top:20px;"><h3>📚 Temas a mejorar</h3><div class="progress-list">${topicsHtml}</div></div>
  `;
}

const memoState = { questions: [], currentIndex: 0, selectedOpt: null, mode: 'memo', permitId: 'B', topicId: 'general' };

async function showMemorizeScreen() {
  showScreen('screen-memo');
  memoState.mode = 'memo';
  memoState.permitId = UserManager.data.lastPermit || 'B';
  memoState.topicId = 'general';
  
  await renderMemoSelectors();
  await loadMemoQuestions();
}

document.addEventListener('click', function(e) {
    const toggleBtn = e.target.closest('.custom-dropdown-toggle');
    if (toggleBtn) {
        e.preventDefault();
        e.stopPropagation();
        const dropdown = toggleBtn.closest('.custom-dropdown');
        const id = dropdown.id;
        document.querySelectorAll('.custom-dropdown').forEach(d => {
            if (d.id !== id) d.classList.remove('open');
        });
        dropdown.classList.toggle('open');
        return;
    }

    const itemBtn = e.target.closest('.custom-dropdown-item');
    if (itemBtn) {
        e.preventDefault();
        e.stopPropagation();
        const action = itemBtn.getAttribute('data-action');
        const val = itemBtn.getAttribute('data-val');
        if (action === 'permit' && typeof handleMemoPermitChange === 'function') handleMemoPermitChange(val);
        if (action === 'topic' && typeof handleMemoTopicChange === 'function') handleMemoTopicChange(val);
        document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('open'));
        return;
    }

    if (!e.target.closest('.custom-dropdown')) {
        document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('open'));
    }
});

async function renderMemoSelectors() {
    const subtitle = document.getElementById('memoSubtitle');
    if(!subtitle) return;
    
    const pObj = db.getPermits().find(p => p.id === memoState.permitId);
    
    let permitOpts = '';
    db.getPermits().forEach(p => {
        permitOpts += `<div class="custom-dropdown-item ${memoState.permitId === p.id ? 'active' : ''}" data-action="permit" data-val="${p.id}">Permiso ${p.name}</div>`;
    });
    
    let topicOpts = `<div class="custom-dropdown-item ${memoState.topicId === 'general' ? 'active' : ''}" data-action="topic" data-val="general">Todos los temas</div>`;
    db.getThemes(memoState.permitId).forEach(t => {
        topicOpts += `<div class="custom-dropdown-item ${memoState.topicId === t.id ? 'active' : ''}" data-action="topic" data-val="${t.id}">${t.name}</div>`;
    });
    
    const activeTheme = memoState.topicId === 'general' ? 'Todos los temas' : db.getThemes(memoState.permitId).find(t => t.id === memoState.topicId)?.name || 'Temas';

    let html = `
    <div style="display:flex; gap:12px; margin-top:16px;">
      <div class="custom-dropdown" id="dd-permit">
        <button class="custom-dropdown-toggle">
          <span>🚘 Permiso ${pObj ? pObj.name : memoState.permitId}</span> <span style="opacity:0.5; font-size:12px;">▼</span>
        </button>
        <div class="custom-dropdown-menu">${permitOpts}</div>
      </div>
      
      <div class="custom-dropdown" id="dd-topic">
        <button class="custom-dropdown-toggle">
          <span>📚 ${activeTheme}</span> <span style="opacity:0.5; font-size:12px;">▼</span>
        </button>
        <div class="custom-dropdown-menu">${topicOpts}</div>
      </div>
    </div>`;
    
    subtitle.innerHTML = html;
    const mt = document.getElementById('memoTitle');
    if(mt) mt.innerHTML = 'Memorizar: <span style="color:var(--olive);">' + (pObj ? pObj.name : 'Permiso ' + memoState.permitId) + '</span>';
}

window.handleMemoPermitChange = async function(val) {
    memoState.permitId = val;
    memoState.topicId = 'general';
    await renderMemoSelectors();
    await loadMemoQuestions();
};

window.handleMemoTopicChange = async function(val) {
    memoState.topicId = val;
    await loadMemoQuestions();
};

async function loadMemoQuestions() {
  let allQs = [];
  try {
     const allPermitQs = db.dgtQuestions.filter(q => q.permit_id === memoState.permitId);
     if (memoState.topicId === 'general') {
         allQs = allPermitQs;
     } else {
         allQs = allPermitQs.filter(q => q.theme_aprobados_ya === memoState.topicId || q.theme_id === memoState.topicId);
         
         // Fallback for "Aprobados Ya" logic where themes are simulated via offsets
         if (allQs.length === 0 && allPermitQs.length > 0) {
             const themes = db.getThemes(memoState.permitId).filter(t => t.id !== 'oficiales');
             const themeIdx = themes.findIndex(t => t.id === memoState.topicId);
             if (themeIdx !== -1) {
                 const offset = themeIdx * 10;
                 let testQs = 30;
                 if (memoState.permitId === 'ADR') {
                     testQs = memoState.topicId.includes('obtencion') ? 20 : (memoState.topicId.includes('basico') ? 30 : 10);
                     if (memoState.topicId === 'renovacion_basico') testQs = 20;
                 } else if (memoState.permitId === 'C' || memoState.permitId === 'CE') {
                     testQs = 20;
                 }
                 const startIndex = (offset * testQs) % allPermitQs.length;
                 const reordered = [];
                 for (let i = 0; i < allPermitQs.length; i++) {
                     reordered.push(allPermitQs[(startIndex + i) % allPermitQs.length]);
                 }
                 allQs = reordered;
             } else {
                 allQs = allPermitQs;
             }
         }
     }
  } catch(e) {}
  
  if(allQs.length === 0) {
      if(document.getElementById('memoList')) document.getElementById('memoList').innerHTML = '<div style="padding:40px;text-align:center">No hay preguntas disponibles para esta selección.</div>';
      return;
  }
  memoState.questions = allQs; 
  memoState.currentIndex = 0; 
  memoState.selectedOpt = null;
  renderMemoCard();
}

async function showFavoritesScreen() {
  showScreen('screen-favorites');
  memoState.mode = 'fav';
  const list = document.getElementById('favoritesList');
  if (UserManager.data.favorites.length === 0) {
    list.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text3)">Aún no tienes preguntas guardadas en favoritos.</div>';
    return;
  }
  let allQs = db.dgtQuestions ? [...db.dgtQuestions] : [];
  
  const favQs = allQs.filter(q => UserManager.data.favorites.includes(q.id));
  if(favQs.length === 0) { list.innerHTML = '<div style="text-align:center">Tus favoritos no se han encontrado en la base de datos actual.</div>'; return; }
  
  memoState.questions = favQs; memoState.currentIndex = 0; memoState.selectedOpt = null;
  renderMemoCard(list);
}

function renderMemoCard(container = document.getElementById('memoList')) {
   const q = memoState.questions[memoState.currentIndex];
   if(!q) return;
   const isFav = UserManager.data.favorites.includes(q.id);
   const favIcon = isFav ? '★' : '☆';
   const favClass = isFav ? 'active' : '';
   
   let html = `<div class="memo-card">
       <button class="memo-fav-btn ${favClass}" onclick="toggleFavorite('${q.id}')" title="Favorito">${favIcon}</button>
       <div class="memo-q" style="font-size:18px; margin-bottom:15px; padding-right:30px;"><strong>${memoState.currentIndex + 1}/${memoState.questions.length}</strong>. ${q.pregunta || q.q}</div>`;
   
   const imgUrl = q.imagen_local || (q.imagen_url && !q.imagen_url.startsWith('http') ? 'images/' + q.imagen_url : q.imagen_url) || (q.image ? 'img/' + q.image : null);
   if (imgUrl) html += `<img src="${imgUrl}" referrerpolicy="no-referrer" style="max-width:100%; max-height:250px; border-radius:12px; margin-bottom:20px; display:block; object-fit:contain; border:1px solid var(--border);">`;
   
   html += `<div class="memo-opts" style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">`;
   
   let parsedOpts = {};
   if (q.respuestas) parsedOpts = q.respuestas;
   else if (q.options) {
       q.options.forEach((o, i) => {
           let t = typeof o === 'string' ? o : (o.text || o.label || JSON.stringify(o));
           parsedOpts[String.fromCharCode(65+i)] = t;
       });
   }
   const respKeys = Object.keys(parsedOpts);
   
   respKeys.forEach(k => {
       const optText = parsedOpts[k];
       let btnClass = 'memo-opt-btn outline-btn';
       let btnStyle = 'text-align:left; justify-content:flex-start; padding:15px; font-weight:normal; border-color:var(--border); font-size:16px;';
       
       if (memoState.selectedOpt !== null) {
           const correctKey = q.correcta || String.fromCharCode(65 + q.correct);
           if (k === correctKey) {
               btnClass += ' correct';
               btnStyle += ' background:var(--green-light); border-color:var(--green); color:var(--text); font-weight:bold;';
           } else if (k === memoState.selectedOpt) {
               btnClass += ' wrong';
               btnStyle += ' background:#ffe5e5; border-color:#ff4444; color:var(--text);';
           }
       }
       html += `<button class="${btnClass}" style="${btnStyle}" onclick="handleMemoAnswer('${k}')" ${memoState.selectedOpt !== null ? 'disabled' : ''}><strong>${k}.</strong> ${optText}</button>`;
   });
   html += `</div>`;
   
   if (memoState.selectedOpt !== null) {
       const correctKey = q.correcta || String.fromCharCode(65 + q.correct);
       const isOk = (memoState.selectedOpt === correctKey);
       const fbClass = isOk ? 'success' : 'error';
       const fbText = isOk ? '✅ ¡Correcto!' : '❌ Incorrecto.';
       const explText = typeof q.explanation === 'string' ? q.explanation : (q.explanation ? JSON.stringify(q.explanation) : (q.explicacion ? (typeof q.explicacion === 'string' ? q.explicacion : JSON.stringify(q.explicacion)) : ''));
       
       html += `<div class="memo-feedback show ${fbClass}" style="margin-bottom:20px; padding:15px; border-radius:8px; background:${isOk?'var(--green-light)':'#ffe5e5'}; color:var(--text); font-size:15px;">
           <strong>${fbText}</strong>
           ${explText ? '<div style="margin-top:10px;"><strong>Explicación:</strong> ' + explText + '</div>' : ''}
       </div>`;
   }
   
   html += `<div class="memo-actions" style="display:flex; gap:10px; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:20px;">
       <button class="outline-btn" style="flex:1;" onclick="prevMemoQuestion()" ${memoState.currentIndex === 0 ? 'disabled' : ''}>← Anterior</button>
       ${memoState.selectedOpt === null ? `<button class="primary-btn" style="flex:1;" onclick="showMemoAnswer()">👁 Ver respuesta</button>` : ''}
       <button class="primary-btn" style="flex:1;" onclick="nextMemoQuestion()" ${memoState.currentIndex === memoState.questions.length - 1 ? 'disabled' : ''}>Siguiente →</button>
     </div></div>`;
   container.innerHTML = html;
}

function handleMemoAnswer(idx) { memoState.selectedOpt = idx; renderMemoCard(memoState.mode === 'fav' ? document.getElementById('favoritesList') : document.getElementById('memoList')); }
function showMemoAnswer() { memoState.selectedOpt = memoState.questions[memoState.currentIndex].correcta || String.fromCharCode(65 + memoState.questions[memoState.currentIndex].correct); renderMemoCard(memoState.mode === 'fav' ? document.getElementById('favoritesList') : document.getElementById('memoList')); }
function nextMemoQuestion() { if (memoState.currentIndex < memoState.questions.length - 1) { memoState.currentIndex++; memoState.selectedOpt = null; renderMemoCard(memoState.mode === 'fav' ? document.getElementById('favoritesList') : document.getElementById('memoList')); } }
function prevMemoQuestion() { if (memoState.currentIndex > 0) { memoState.currentIndex--; memoState.selectedOpt = null; renderMemoCard(memoState.mode === 'fav' ? document.getElementById('favoritesList') : document.getElementById('memoList')); } }

function toggleFavorite(qId) {
    const idx = UserManager.data.favorites.indexOf(qId);
    const isAdding = idx === -1;
    if (isAdding) UserManager.data.favorites.push(qId);
    else UserManager.data.favorites.splice(idx, 1);
    UserManager.save();
    
    if (window.SyncManager && typeof window.currentUser === 'function' && window.currentUser()) {
        if (isAdding) {
            window.SyncManager.addFavoriteToDB(qId);
        } else {
            window.SyncManager.removeFavoriteFromDB(qId);
        }
    }
    
    const container = memoState.mode === 'fav' ? document.getElementById('favoritesList') : document.getElementById('memoList');
    if (container) {
        if (memoState.mode === 'fav' && !isAdding) {
            memoState.questions = memoState.questions.filter(q => q.id !== qId);
            if (memoState.currentIndex >= memoState.questions.length) memoState.currentIndex--;
            if (memoState.questions.length === 0) { showFavoritesScreen(); return; }
        }
        if (memoState.questions && memoState.questions.length > 0) renderMemoCard(container);
    }
}

window.startSpecialTest = startSpecialTest;
window.continueLastTest = continueLastTest;
window.showPrepScreen = showPrepScreen;
window.showMemorizeScreen = showMemorizeScreen;
window.showFavoritesScreen = showFavoritesScreen;
window.toggleFavorite = toggleFavorite;
window.handleMemoAnswer = handleMemoAnswer;
window.showMemoAnswer = showMemoAnswer;
window.nextMemoQuestion = nextMemoQuestion;
window.prevMemoQuestion = prevMemoQuestion;

/* ══════════════════════════════════════════
   PWA & OFFLINE LOGIC
══════════════════════════════════════════ */
let deferredPrompt;
const installPrompt = document.getElementById('installPrompt');
const btnInstallApp = document.getElementById('btnInstallApp');
const btnCloseInstall = document.getElementById('btnCloseInstall');
const offlineBanner = document.getElementById('offlineBanner');
const updateBanner = document.getElementById('updateBanner');
const btnUpdateApp = document.getElementById('btnUpdateApp');

// 1. Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('SW registrado con scope:', registration.scope);
      
      // Detectar actualizaciones del Service Worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Hay una nueva versión
            if (updateBanner) updateBanner.style.display = 'flex';
            if (btnUpdateApp) {
              btnUpdateApp.onclick = () => {
                newWorker.postMessage('SKIP_WAITING');
              };
            }
          }
        });
      });
    }).catch(err => {
      console.error('Error registrando SW:', err);
    });

    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}

// 2. Offline / Online events
window.addEventListener('online', () => {
  if (offlineBanner) offlineBanner.style.display = 'none';
  // Intentar sincronizar si volvió la conexión
  if (window.SyncManager && window.currentUser) {
    window.SyncManager.syncFromDB();
  }
});

window.addEventListener('offline', () => {
  if (offlineBanner) offlineBanner.style.display = 'block';
});

// 3. PWA Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // Evitar que el navegador muestre el suyo por defecto
  deferredPrompt = e;
  
  // Mostrar el nuestro si no lo ha cerrado antes
  if (localStorage.getItem('ay_pwa_dismissed') !== 'true' && installPrompt) {
    installPrompt.style.display = 'flex';
  }
});

if (btnInstallApp) {
  btnInstallApp.addEventListener('click', async () => {
    if (installPrompt) installPrompt.style.display = 'none';
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Instalación de PWA: ${outcome}`);
      deferredPrompt = null;
    }
  });
}

if (btnCloseInstall) {
  btnCloseInstall.addEventListener('click', () => {
    if (installPrompt) installPrompt.style.display = 'none';
    localStorage.setItem('ay_pwa_dismissed', 'true');
  });
}

// --- NUEVAS FUNCIONES DE APRENDIZAJE ---

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Senales
  let allSigns = [];
  let currentSignType = 'peligro';
  
  fetch('data/senales.json?v=37')
    .then(r => r.json())
    .then(data => {
      allSigns = data;
      renderSigns(currentSignType);
    })
    .catch(err => console.error("Error cargando senales:", err));

  const signsGrid = document.getElementById('signsGrid');
  const signTabs = document.querySelectorAll('.sign-tab');
  
  signTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      signTabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentSignType = e.target.getAttribute('data-type');
      renderSigns(currentSignType);
    });
  });

  let signsRendered = false;
  window.renderSigns = function renderSigns(tipo) {
    if (!tipo) tipo = 'peligro';
    currentSignType = tipo;
    if (!signsGrid) return;
    
    if (!signsRendered && allSigns.length > 0) {
      signsGrid.innerHTML = '';
      allSigns.forEach(s => {
        const card = document.createElement('div');
        card.className = 'sign-card';
        card.dataset.tipo = s.tipo;
        card.innerHTML = `
          <img src="${s.imagen}" loading="lazy" alt="${s.nombre}">
          <div class="sign-id">${s.id}</div>
          <div class="sign-name">${s.nombre}</div>
        `;
        card.addEventListener('click', () => {
          if (typeof showAppAlert === 'function') showAppAlert(s.nombre, s.descripcion);
        });
        signsGrid.appendChild(card);
      });
      signsRendered = true;
    }
    
    // Toggle visibility without rebuilding DOM to prevent flickering
    if (signsGrid.children.length > 0) {
      Array.from(signsGrid.children).forEach(card => {
        if (card.dataset.tipo === tipo) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }
  };
  
  // LÓGICA DE SIMULACRO
  const btnSubmitExam = document.getElementById('btnSubmitExam');
  if (btnSubmitExam) {
      btnSubmitExam.addEventListener('click', () => {
          showAppConfirm('Entregar examen', '¿Seguro que quieres entregar el examen ahora?', () => {
             submitSimulacro();
          });
      });
  }
});

// 🎓🎓🎓 FUNCIONES SIMULACRO REAL 🎓🎓🎓
async function startSimulacro() {
  const user = typeof window.currentUser === 'function' ? window.currentUser() : null;
  const isUserPremium = typeof window.isPremium === 'function' ? await window.isPremium() : false;
  
  if (!window.PROMO_FREE_MODE) {
    if (!user) {
      if (typeof window.triggerPaywall === 'function') window.triggerPaywall('register');
      return;
    }
    if (!isUserPremium) {
      if (typeof window.triggerPaywall === 'function') window.triggerPaywall('premium');
      return;
    }
  }

  const allPermitQs = db.dgtQuestions.filter(q => q.permit_id === 'B' && q.test_id); 
  const testIds = [...new Set(allPermitQs.map(q => q.test_id))];
  const randomTestId = testIds[Math.floor(Math.random() * testIds.length)];

  state.testMode = 'test';
  state.isOfficialDgt = true;
  state.testNum = randomTestId;
  state.questions = db.getQuestionsByTest(randomTestId);
  state.currentQuestion = 0;
  state.answers = {};
  state.score = 0;
  state.isSimulacro = true;
  state.timeLeft = 30 * 60; // 30 minutes

  // Ensure test size is 30
  if(state.questions.length > 30) state.questions = state.questions.slice(0, 30);

  renderEngineUI();
  if(document.getElementById('testLabel')) document.getElementById('testLabel').textContent = "SIMULACRO DGT";
  
  if(document.getElementById('simulacroTimerBox')) document.getElementById('simulacroTimerBox').style.display = 'block';
  if(document.getElementById('btnSubmitExam')) document.getElementById('btnSubmitExam').style.display = 'block';
  if(document.getElementById('testQuestionWrap')) document.getElementById('testQuestionWrap').classList.add('simulacro-mode');
  
  updateTimerUI();
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    updateTimerUI();
    if (state.timeLeft <= 0) {
       submitSimulacro();
    }
  }, 1000);

  renderQuestion(0);
  showScreen('screen-test');
}

function updateTimerUI() {
  const mins = Math.floor(state.timeLeft / 60).toString().padStart(2, '0');
  const secs = (state.timeLeft % 60).toString().padStart(2, '0');
  if(document.getElementById('simulacroTimerTxt')) document.getElementById('simulacroTimerTxt').textContent = `${mins}:${secs}`;
}

function submitSimulacro() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.isSimulacro = false;
  if(document.getElementById('simulacroTimerBox')) document.getElementById('simulacroTimerBox').style.display = 'none';
  if(document.getElementById('btnSubmitExam')) document.getElementById('btnSubmitExam').style.display = 'none';
  if(document.getElementById('testQuestionWrap')) document.getElementById('testQuestionWrap').classList.remove('simulacro-mode');

  let aciertos = 0;
  state.questions.forEach((q, idx) => {
    const ans = state.answers[idx];
    if (ans === q.correcta) aciertos++;
  });

  const fallos = state.questions.length - aciertos;
  const apto = fallos <= 3;

  let resultsScreen = document.getElementById('screen-results');
  if (!resultsScreen) {
      resultsScreen = document.createElement('section');
      resultsScreen.id = 'screen-results';
      resultsScreen.className = 'screen';
      if(document.getElementById('appMain')) document.getElementById('appMain').appendChild(resultsScreen);
  }
  
  resultsScreen.innerHTML = `
    <div class="inner-wrap" style="text-align:center; padding-top:60px; max-width:500px; margin:0 auto;">
      <div style="font-size: 80px; margin-bottom: 20px;">${apto ? '🎉' : '💀'}</div>
      <h2 style="font-size: 40px; font-weight: 900; margin-bottom: 10px; color: ${apto ? 'var(--olive)' : '#e53e3e'}">${apto ? '¡APTO!' : 'NO APTO'}</h2>
      <p style="font-size: 18px; margin-bottom: 40px; color: var(--text2);">Has tenido <strong>${fallos}</strong> fallos de ${state.questions.length} preguntas.</p>
      
      <div style="display:flex; flex-direction:column; gap:16px;">
          <button class="primary-btn" onclick="reviewSimulacro()" style="font-size:18px; padding:16px; border-radius:12px; cursor:pointer;">👁️ Revisar examen</button>
          <button class="outline-btn" onclick="document.querySelector('[data-target=\\'screen-premium\\']').click()" style="font-size:18px; padding:16px; border-radius:12px; cursor:pointer;">Volver a Premium</button>
      </div>
    </div>
  `;
  showScreen('screen-results');
}

function reviewSimulacro() {
  showScreen('screen-test');
  renderQuestion(0);
}

window.startSimulacro = startSimulacro;
window.submitSimulacro = submitSimulacro;
window.reviewSimulacro = reviewSimulacro;

// 🔥 DIRECTORIO PREMIUM
async function openPremiumSenales() {
  if (!window.PROMO_FREE_MODE) {
    const isUserPremium = typeof window.isPremium === 'function' ? await window.isPremium() : false;
    if (!isUserPremium) {
      if (typeof window.triggerPaywall === 'function') window.triggerPaywall('premium');
      return;
    }
  }
  showScreen('screen-senales');
  if (typeof window.renderSigns === 'function') {
    window.renderSigns('peligro');
  }
}
window.openPremiumSenales = openPremiumSenales;

// 📚 APUNTES PREMIUM
async function openPremiumApuntes() {
  if (!window.PROMO_FREE_MODE) {
    const isUserPremium = typeof window.isPremium === 'function' ? await window.isPremium() : false;
    if (!isUserPremium) {
      if (typeof window.triggerPaywall === 'function') window.triggerPaywall('premium');
      return;
    }
  }
  showScreen('screen-apuntes');
}
window.openPremiumApuntes = openPremiumApuntes;

// 🔥 PREGUNTA DEL DÍA
async function startPreguntaDelDia() {
  if (!window.PROMO_FREE_MODE) {
    const isUserPremium = typeof window.isPremium === 'function' ? await window.isPremium() : false;
    if (!isUserPremium) {
      if (typeof window.triggerPaywall === 'function') window.triggerPaywall('premium');
      return;
    }
  }
  
  const currentPermit = UserManager.data.lastPermit || 'B';
  const allPermitQs = db.dgtQuestions.filter(q => q.permit_id === currentPermit);
  
  if (allPermitQs.length === 0) {
    showAppAlert('Aviso', 'No hay preguntas disponibles para tu permiso.');
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * allPermitQs.length);
  const questionDelDia = allPermitQs[randomIndex];
  const pObj = db.getPermits().find(p => p.id === currentPermit);
  state.permit = pObj || { id: currentPermit, name: 'Permiso ' + currentPermit, icon: '🚗' };
  state.topic = null;
  state.testMode = 'test';
  state.isOfficialDgt = true;
  state.testNum = 'Pregunta del Día';
  state.questions = [questionDelDia];
  state.currentQuestion = 0;
  state.answers = {};
  state.score = 0;
  state.isSimulacro = false;
  
  renderEngineUI();
  if(document.getElementById('testLabel')) document.getElementById('testLabel').textContent = "PREGUNTA DEL DÍA";
  if(document.getElementById('simulacroTimerBox')) document.getElementById('simulacroTimerBox').style.display = 'none';
  if(document.getElementById('btnSubmitExam')) document.getElementById('btnSubmitExam').style.display = 'none';
  if(document.getElementById('testQuestionWrap')) document.getElementById('testQuestionWrap').classList.remove('simulacro-mode');
  
  renderQuestion(0);
  showScreen('screen-test');
}
window.startPreguntaDelDia = startPreguntaDelDia;

// Lógica de detección de Adblock (Se ejecuta 2 segundos después de cargar la página)
setTimeout(async () => {
    // Si el usuario es premium, no nos importa si usa AdBlock
    const isUserPremium = typeof window.isPremium === 'function' ? await window.isPremium() : false;
    if (isUserPremium) return;

    // Verificar consentimiento de cookies para anuncios
    const consent = JSON.parse(localStorage.getItem('ay_cookie_consent') || '{}');
    const adsConsented = consent.ads === true;

    // Crear un cebo para los bloqueadores de DOM
    let bait = document.createElement('div');
    bait.innerHTML = '&nbsp;';
    bait.className = 'adsbox ad-placement doubleclick ad-placeholder';
    bait.style.width = '1px';
    bait.style.height = '1px';
    bait.style.position = 'absolute';
    bait.style.left = '-10000px';
    document.body.appendChild(bait);

    setTimeout(() => {
        let adblockEnabled = false;
        
        // Si el cebo no tiene altura, o si el script de AdSense (adsbygoogle) fue bloqueado por DNS
        if (bait.offsetHeight === 0 || bait.clientHeight === 0 || window.getComputedStyle(bait).display === 'none') {
            adblockEnabled = true;
        }
        
        // Comprobar si Google Adsense se pudo cargar (solo si el usuario lo consintió)
        if (adsConsented && typeof adsbygoogle === 'undefined') {
            adblockEnabled = true;
        }

        if (adblockEnabled) {
            const modal = document.getElementById('adblock-modal');
            if (modal) modal.style.display = 'flex';
        }
        
        document.body.removeChild(bait);
    }, 100);
}, 2000);

window.appState = state;
window.startTest = startTest;
window.renderTests = renderTests;
