import os

def update_js():
    with open('app_v2_bak2.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    out = []
    in_user_manager = False
    in_show_results = False
    in_render_permits = False
    in_init_nav = False
    in_continue_last = False
    in_progress_screen = False
    in_favorites_screen = False
    in_memorize_screen = False
    in_init = False

    for i, line in enumerate(lines):
        # 1. Replace UserManager
        if line.strip().startswith('const UserManager = {'):
            in_user_manager = True
            out.append('''// ─── USER MANAGER (Progreso Avanzado FASE 1 + Reorganización) ────────────────
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
  }
};
''')
            continue
            
        if in_user_manager:
            if line.strip().startswith('const state = {'):
                in_user_manager = False
                out.append(line)
            continue
            
        # 2. Modify saveLastState hook inside engine
        if 'UserManager.saveLastState(state.permit, state.testNum, state.topic);' in line:
            out.append('  UserManager.saveLastState(state.permit, state.testNum, state.topic, state.currentQuestion, state.answers);\n')
            continue
            
        if 'state.answers[state.currentQuestion] = index;' in line:
            out.append(line)
            out.append('  UserManager.saveLastState(state.permit, state.testNum, state.topic, state.currentQuestion, state.answers);\n')
            continue

        # 3. Modify showResults to record detailed stats
        if line.strip().startswith('function showResults('):
            in_show_results = True
            out.append(line)
            continue
            
        if in_show_results:
            if '// Registrar estadísticas' in line:
                out.append('''  // FASE 1: Registrar estadísticas detalladas
  UserManager.data.totalTests++;
  UserManager.recordActivity(); 
  
  const pId = typeof state.permit === 'object' ? state.permit.id : state.permit;
  const tId = (state.topic && typeof state.topic === 'object') ? state.topic.id : state.topic;
  
  results.forEach(r => {
      UserManager.recordQuestionResult(pId, tId, r.q.id, r.isCorrect);
  });
  
  UserManager.data.lastState = null;
  UserManager.save();
''')
                continue
            if 'UserManager.data.totalTests++;' in line or 'UserManager.data.totalCorrect += correct;' in line or 'UserManager.recordActivity();' in line or 'UserManager.save();' in line:
                continue
            if line.startswith('}'):
                in_show_results = False
                out.append(line)
                continue
            out.append(line)
            continue

        # 4. Modify navigation bindings to include screen-prep
        if 'document.getElementById(\'nav-home\').addEventListener(\'click\'' in line:
            out.append(line)
            out.append("  const navPrep = document.getElementById('nav-progress'); if(navPrep) { navPrep.addEventListener('click', (e) => { e.preventDefault(); showPrepScreen(); document.querySelectorAll('.nav-links a').forEach(a=>a.classList.remove('active')); e.currentTarget.classList.add('active');}); }\n")
            out.append("  const mobileNavPrep = document.getElementById('mobile-nav-progress'); if(mobileNavPrep) { mobileNavPrep.addEventListener('click', (e) => { e.preventDefault(); showPrepScreen(); closeMobileMenu(); }); }\n")
            continue

        if 'document.getElementById(\'nav-progress\').addEventListener(\'click\'' in line or 'document.getElementById(\'mobile-nav-progress\').addEventListener(\'click\'' in line:
            continue # We manually injected it above

        # 5. Remove the welcome card logic from renderPermits entirely
        if '// Tarjeta de Bienvenida' in line:
            in_render_permits = True
            continue
        if in_render_permits:
            if 'const container = document.getElementById(\'permitsGrid\');' in line:
                in_render_permits = False
                out.append(line)
            continue

        # Skip existing unimplemented functions
        if line.strip().startswith('function showProgressScreen()'):
            in_progress_screen = True
            continue
        if in_progress_screen:
            if line.startswith('}'): in_progress_screen = False
            continue
            
        if line.strip().startswith('function showFavoritesScreen()'):
            in_favorites_screen = True
            continue
        if in_favorites_screen:
            if line.startswith('}'): in_favorites_screen = False
            continue
            
        if line.strip().startswith('function showMemorizeSkeleton()') or line.strip().startswith('function showMemorizeScreen()'):
            in_memorize_screen = True
            continue
        if in_memorize_screen:
            if line.startswith('}'): in_memorize_screen = False
            continue

        if line.strip().startswith('async function continueLastTest()'):
            in_continue_last = True
            continue
        if in_continue_last:
            if line.startswith('}'): in_continue_last = False
            continue

        out.append(line)

    # Append new functions at the end
    out.append('''
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
      <div class="home-card-btn" style="grid-column: span 2; align-items: flex-start; text-align: left;">
        <h3 style="margin-top:0;">🎯 ¡Comienza tu preparación!</h3>
        <p style="color:var(--text2); font-size:14px; margin-top:8px;">Inicia un test para activar tu seguimiento diario.</p>
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

async function startSpecialTest(type) {
  let permitId = UserManager.data.lastPermit;
  if (!permitId) {
     const p = prompt("Introduce el permiso (ej: B, A, AM) para el test especial:", "B");
     if(p) permitId = p.toUpperCase();
     else return;
  }
  
  let allQuestions = [];
  try {
     if (permitId === 'B') {
        const raw = await db.fetchB();
        raw.forEach(t => allQuestions = allQuestions.concat(t.questions));
     } else {
        const raw = await db.fetchDGT();
        const pData = raw.tests[permitId];
        if (pData) {
           pData.general.forEach(t => allQuestions = allQuestions.concat(t.questions));
           for(let k in pData.topics) {
               pData.topics[k].forEach(t => allQuestions = allQuestions.concat(t.questions));
           }
        }
     }
  } catch(e) { console.error(e); alert('Error cargando preguntas.'); return; }
  
  if (allQuestions.length === 0) {
      alert("No hay preguntas disponibles para el permiso " + permitId);
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
          alert("¡Enhorabuena! No tienes preguntas falladas guardadas para este permiso.");
          return;
      }
      state.questions = mistakesQ.sort(() => 0.5 - Math.random()).slice(0, 30);
  }
  
  state.isOfficialDgt = (permitId !== 'B');
  showScreen('screen-engine');
  renderEngine();
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
      if (ls.permitId === 'B') {
          const raw = await db.fetchB();
          const match = raw.find(t => t.id == ls.testNum);
          if(match) state.questions = match.questions;
      } else {
          const raw = await db.fetchDGT();
          const perms = raw.tests[ls.permitId];
          if(perms) {
              const arr = ls.topicId ? perms.topics[ls.topicId] : perms.general;
              const match = arr.find(t => t.id == ls.testNum);
              if(match) state.questions = match.questions;
          }
      }
      
      if (state.questions && state.questions.length > 0) {
          state.isOfficialDgt = (ls.permitId !== 'B');
          showScreen('screen-engine');
          renderEngine();
      } else {
          alert('No se pudo cargar el test guardado.');
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

const memoState = { questions: [], currentIndex: 0, selectedOpt: null, mode: 'memo' };

async function showMemorizeScreen() {
  showScreen('screen-memo');
  memoState.mode = 'memo';
  let permitId = UserManager.data.lastPermit || 'B';
  let allQs = [];
  try {
     if (permitId === 'B') {
        const raw = await db.fetchB();
        raw.forEach(t => allQs = allQs.concat(t.questions));
     } else {
        const raw = await db.fetchDGT();
        const pData = raw.tests[permitId];
        if (pData) {
           pData.general.forEach(t => allQs = allQs.concat(t.questions));
           for(let k in pData.topics) pData.topics[k].forEach(t => allQs = allQs.concat(t.questions));
        }
     }
  } catch(e) {}
  
  if(allQs.length === 0) {
      document.getElementById('memoList').innerHTML = '<div style="padding:40px;text-align:center">No hay preguntas disponibles.</div>';
      return;
  }
  memoState.questions = allQs; memoState.currentIndex = 0; memoState.selectedOpt = null;
  const pObj = db.getPermits().find(p => p.id === permitId);
  document.getElementById('memoTitle').innerText = 'Memorizar: Permiso ' + (pObj ? pObj.name : permitId);
  document.getElementById('memoSubtitle').innerText = 'Estudia y repasa las preguntas de tu último permiso';
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
  let allQs = [];
  try {
     const rawB = await db.fetchB(); rawB.forEach(t => allQs = allQs.concat(t.questions));
     const rawDGT = await db.fetchDGT();
     for(let p in rawDGT.tests) {
         rawDGT.tests[p].general.forEach(t => allQs = allQs.concat(t.questions));
         for(let k in rawDGT.tests[p].topics) rawDGT.tests[p].topics[k].forEach(t => allQs = allQs.concat(t.questions));
     }
  } catch(e) {}
  
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
       <div class="memo-q">${memoState.currentIndex + 1}. ${q.q}</div>`;
   if (q.image) html += `<img src="img/${q.image}" style="max-width:100%; border-radius:12px; margin-bottom:16px; display:block;">`;
   html += `<div class="memo-opts">`;
   
   const letters = ['A','B','C','D'];
   q.options.forEach((opt, idx) => {
       let btnClass = 'memo-opt-btn';
       if (memoState.selectedOpt !== null) {
           if (idx === q.correct) btnClass += ' correct';
           else if (idx === memoState.selectedOpt) btnClass += ' wrong';
       }
       html += `<button class="${btnClass}" onclick="handleMemoAnswer(${idx})" ${memoState.selectedOpt !== null ? 'disabled' : ''}><strong>${letters[idx]}.</strong> ${opt}</button>`;
   });
   html += `</div>`;
   
   if (memoState.selectedOpt !== null) {
       const isOk = (memoState.selectedOpt === q.correct);
       const fbClass = isOk ? 'success' : 'error';
       const fbText = isOk ? '¡Correcto!' : 'Incorrecto.';
       html += `<div class="memo-feedback show ${fbClass}">${fbText} ${q.explanation ? '<br><br><strong>Explicación:</strong> ' + q.explanation : ''}</div>`;
   }
   
   html += `<div class="memo-actions">
       <button class="outline-btn" onclick="prevMemoQuestion()" ${memoState.currentIndex === 0 ? 'disabled' : ''}>Anterior</button>
       ${memoState.selectedOpt === null ? `<button class="outline-btn" onclick="showMemoAnswer()">👁 Ver respuesta</button>` : ''}
       <button class="primary-btn" onclick="nextMemoQuestion()" ${memoState.currentIndex === memoState.questions.length - 1 ? 'disabled' : ''}>Siguiente</button>
     </div></div>`;
   container.innerHTML = html;
}

function handleMemoAnswer(idx) { memoState.selectedOpt = idx; renderMemoCard(memoState.mode === 'fav' ? document.getElementById('favoritesList') : document.getElementById('memoList')); }
function showMemoAnswer() { memoState.selectedOpt = memoState.questions[memoState.currentIndex].correct; renderMemoCard(memoState.mode === 'fav' ? document.getElementById('favoritesList') : document.getElementById('memoList')); }
function nextMemoQuestion() { if (memoState.currentIndex < memoState.questions.length - 1) { memoState.currentIndex++; memoState.selectedOpt = null; renderMemoCard(memoState.mode === 'fav' ? document.getElementById('favoritesList') : document.getElementById('memoList')); } }
function prevMemoQuestion() { if (memoState.currentIndex > 0) { memoState.currentIndex--; memoState.selectedOpt = null; renderMemoCard(memoState.mode === 'fav' ? document.getElementById('favoritesList') : document.getElementById('memoList')); } }
function toggleFavorite(qId) {
   const idx = UserManager.data.favorites.indexOf(qId);
   if (idx === -1) UserManager.data.favorites.push(qId);
   else UserManager.data.favorites.splice(idx, 1);
   UserManager.save();
   
   const container = memoState.mode === 'fav' ? document.getElementById('favoritesList') : document.getElementById('memoList');
   if (memoState.mode === 'fav' && idx !== -1) {
       memoState.questions = memoState.questions.filter(q => q.id !== qId);
       if (memoState.currentIndex >= memoState.questions.length) memoState.currentIndex--;
       if (memoState.questions.length === 0) { showFavoritesScreen(); return; }
   }
   renderMemoCard(container);
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
''')
        
    with open('app_v2.js', 'w', encoding='utf-8') as f:
        f.writelines(out)

update_js()
