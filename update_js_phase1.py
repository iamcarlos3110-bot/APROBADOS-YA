import re

with open('app_v2.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update saveLastState hooks
js = js.replace(
    'UserManager.saveLastState(state.permit, state.testNum, state.topic);',
    'UserManager.saveLastState(state.permit, state.testNum, state.topic, state.currentQuestion, state.answers);'
)

# 2. Update renderPermits to call renderTopCards
# We will inject renderTopCards call right after getting the container
render_permits_patch = '''
  const container = document.getElementById('permitsGrid');
  if(!container) return;
  renderTopCards();
'''
js = js.replace('''  const container = document.getElementById('permitsGrid');''', render_permits_patch)


# 3. Add TopCards and Special Tests logic
new_functions = '''
// ─── FASE 1: TARJETAS SUPERIORES Y TESTS ESPECIALES ───

function renderTopCards() {
  const wc = document.getElementById('homeTopCards');
  if (!wc) return;
  
  let html = '';
  
  // 1. Tarjeta Continuar
  if (UserManager.data.lastState && UserManager.data.lastState.testNum) {
    const ls = UserManager.data.lastState;
    let title = `Permiso ${ls.permit} - Test ${ls.testNum}`;
    if (ls.topic) title = `Permiso ${ls.permit} - Tema ${ls.topic} - Test ${ls.testNum}`;
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
        <h3 style="margin-top:0;">🎯 Empieza a prepararte</h3>
        <p style="color:var(--text2); font-size:14px; margin-top:8px;">Elige tu permiso abajo y comienza tu primer test oficial.</p>
      </div>
    `;
  }

  // 2. Test Rápido
  html += `
    <div class="home-card-btn" onclick="startSpecialTest('quick')">
      <div class="icon">⚡</div>
      <h3>Test Rápido</h3>
      <p style="font-size:12px; color:var(--text3); margin-top:4px;">10 preguntas</p>
    </div>
  `;

  // 3. Mis Errores
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
  let permit = UserManager.data.lastPermit;
  if (!permit) {
     const p = prompt("Introduce el permiso (ej: B, A, AM) para el test especial:", "B");
     if(p) permit = p.toUpperCase();
     else return;
  }
  
  let allQuestions = [];
  try {
     if (permit === 'B') {
        const raw = await db.fetchB();
        raw.forEach(t => allQuestions = allQuestions.concat(t.questions));
     } else {
        const raw = await db.fetchDGT();
        const pData = raw.tests[permit];
        if (pData) {
           pData.general.forEach(t => allQuestions = allQuestions.concat(t.questions));
           for(let k in pData.topics) {
               pData.topics[k].forEach(t => allQuestions = allQuestions.concat(t.questions));
           }
        }
     }
  } catch(e) { console.error(e); alert('Error cargando preguntas.'); return; }
  
  if (allQuestions.length === 0) {
      alert("No hay preguntas disponibles para el permiso " + permit);
      return;
  }

  state.permit = permit;
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
  
  state.isOfficialDgt = (permit !== 'B');
  renderEngine();
}
'''
js += '\n' + new_functions


# 4. Modify test engine answer clicking to hook into UserManager
# Inside handleAnswerClick, we want to record the result immediately. But actually, results are calculated in showResults.
# The user wants "El progreso debe actualizarse automáticamente cuando el usuario responde preguntas."
# I will patch handleAnswerClick in renderEngine.
engine_patch = '''
function handleAnswerClick(index) {
  state.answers[state.currentQuestion] = index;
  // FASE 1: Guardar estado al responder
  UserManager.saveLastState(state.permit, state.testNum, state.topic, state.currentQuestion, state.answers);
  renderEngine();
}
'''
js = re.sub(r'function handleAnswerClick\(index\) \{.*?\}', engine_patch, js, flags=re.DOTALL)


# 5. Patch showResults to use the new topicStats and daily goals
# We completely rewrite the showResults injection made earlier
results_logic_old = '''  // Registrar estadísticas
  UserManager.data.totalTests++;
  UserManager.data.totalCorrect += correct;
  UserManager.recordActivity();
  UserManager.save();'''

results_logic_new = '''  // FASE 1: Registrar estadísticas detalladas
  UserManager.data.totalTests++;
  UserManager.recordActivity(); // Saves and updates UI
  
  // Analizar cada pregunta
  results.forEach(r => {
      UserManager.recordQuestionResult(state.permit, state.topic, r.q.id, r.isCorrect);
  });
  
  // Limpiar lastState si terminó
  UserManager.data.lastState = null;
  UserManager.save();
'''
js = js.replace(results_logic_old, results_logic_new)


# 6. Rewrite continueLastTest to restore exact currentQuestion and answers
continue_patch = '''
async function continueLastTest() {
  const ls = UserManager.data.lastState;
  if (!ls) return;
  state.permit = ls.permit;
  state.topic = ls.topic;
  state.testNum = ls.testNum;
  state.testMode = 'test';
  state.currentQuestion = ls.currentQuestion || 0;
  state.answers = ls.answers || {};
  
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
          showScreen('screen-engine');
          renderEngine();
      } else {
          alert('No se pudo cargar el test guardado. Puede que la base de datos haya cambiado.');
      }
  } catch(e) {
      console.error(e);
      alert('Error al reanudar el test.');
  }
}
'''
js = re.sub(r'async function continueLastTest\(\) \{.*?\}\n', continue_patch, js, flags=re.DOTALL)


# 7. Rewrite showProgressScreen
progress_patch = '''
function showProgressScreen() {
  showScreen('screen-progress');
  const grid = document.getElementById('progressStatsGrid');
  
  const dailyPct = Math.min(100, Math.round((UserManager.data.dailyQuestions / 30) * 100));
  
  // Calcular Temas a Mejorar
  let topicsHtml = '';
  let allTopics = [];
  for (let p in UserManager.data.topicStats) {
      for (let t in UserManager.data.topicStats[p]) {
          const stat = UserManager.data.topicStats[p][t];
          if(stat.total >= 5) { // Minimum 5 questions to analyze
              const pct = Math.round((stat.correct / stat.total) * 100);
              allTopics.push({ name: `Permiso ${p} - ${t==='general'?'General':'Tema '+t}`, pct });
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
      topicsHtml = `<div class="progress-item"><span class="progress-item-name" style="color:var(--text3)">Necesitamos más preguntas para analizar tus temas.</span></div>`;
  }
  
  grid.innerHTML = `
    <div class="progress-card" style="grid-column: 1 / -1; text-align: left;">
      <h3 style="margin-top:0">🎯 Objetivo Diario</h3>
      <p style="color:var(--text2); font-size:14px; margin-top:4px;">${UserManager.data.dailyQuestions} / 30 preguntas respondidas</p>
      <div class="daily-goal-bar-wrap"><div class="daily-goal-bar" style="width: ${dailyPct}%"></div></div>
    </div>
    
    <div class="progress-card olive">
      <h4>Tests Realizados</h4>
      <div class="val">${UserManager.data.totalTests}</div>
    </div>
    <div class="progress-card">
      <h4>Preguntas Acertadas</h4>
      <div class="val">${UserManager.data.totalCorrect}</div>
    </div>
    <div class="progress-card">
      <h4>Mis Errores</h4>
      <div class="val" style="color:#E74C3C">${UserManager.data.mistakes.length}</div>
    </div>
    <div class="progress-card">
      <h4>Días de Racha</h4>
      <div class="val">${UserManager.data.streak} 🔥</div>
    </div>
    
    <div style="grid-column: 1 / -1; margin-top:20px;">
      <h3>📊 Temas a mejorar</h3>
      <div class="progress-list">
         ${topicsHtml}
      </div>
    </div>
  `;
}
'''
js = re.sub(r'function showProgressScreen\(\) \{.*?\}\n(?=function)', progress_patch, js, flags=re.DOTALL)

with open('app_v2.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("app_v2.js updated Phase 1 mostly.")
