/* =============================================
   APROBADOS YA — App Logic
   Pantallas: permits → topics → tests → engine / memo → results
============================================= */
'use strict';

// ─── ESTADO GLOBAL & DATA SERVICE ──────────────────

const state = {
  permit: null,
  topic: null,
  testNum: null,
  testMode: null, // 'test' | 'memo'
  currentQuestion: 0,
  answers: {}, // { index: 'A' }
  score: 0,
  questions: [], // Preguntas del test actual
  isOfficialDgt: false // flag para saber el origen
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
      const end = start + testQs;
      
      const real = bank.slice(start, end);
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
          pregunta: `Pregunta ${i + 1} — Contenido pendiente`,
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
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
}

// ─── NAV HELPERS ────────────────────────────────────

document.getElementById('logoLink').addEventListener('click', (e) => {
  e.preventDefault();
  renderPermits();
});

document.getElementById('backToHome').addEventListener('click', renderPermits);
document.getElementById('backToTopics').addEventListener('click', renderTopics);
document.getElementById('exitTestBtn').addEventListener('click', () => {
  if (confirm('¿Salir del test? Se perderá el progreso.')) renderTests();
});
document.getElementById('exitMemoBtn').addEventListener('click', renderTests);
document.getElementById('goToTestsBtn').addEventListener('click', renderTests);
document.getElementById('retryTestBtn').addEventListener('click', () => {
  startTest(state.testNum, 'test', state.isOfficialDgt);
});


// ─── INIT ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await db.initialize();
  renderPermits();
});

// ─── THEME LOGIC ────────────────────────────────────
function initTheme() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const iconLight = document.querySelector('.theme-icon-light');
  const iconDark = document.querySelector('.theme-icon-dark');
  
  const savedTheme = localStorage.getItem('ay_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    iconLight.style.display = 'none';
    iconDark.style.display = 'inline';
  }
  
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      if (current === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('ay_theme', 'light');
        iconLight.style.display = 'inline';
        iconDark.style.display = 'none';
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('ay_theme', 'dark');
        iconLight.style.display = 'none';
        iconDark.style.display = 'inline';
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
    card.innerHTML = `
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

function renderTopics() {
  const p = state.permit;
  document.getElementById('topicsPermitBadge').textContent = `${p.icon} ${p.name}`;
  document.getElementById('topicsTitle').textContent = `Temario ${p.name}`;
  
  const container = document.getElementById('topicsGrid');
  container.innerHTML = '';

  db.getThemes(p.id).forEach(t => {
    const card = document.createElement('div');
    card.className = 'topic-card';
    card.innerHTML = `
      <div class="topic-info">
        <div class="topic-name">${t.name}</div>
        ${t.id === 'oficiales' ? '<span class="status-badge" style="background:var(--olive); color:white; font-size:11px; padding:3px 8px; border-radius:6px; margin-top:4px; display:inline-block;">★ OFICIAL DGT</span>' : ''}
      </div>
      <div class="topic-caret">
        <span class="outline-btn sm" style="padding: 6px 14px; font-size: 11px; border-radius: 99px; pointer-events: none;">Entrar</span>
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
  
  document.getElementById('testsPermitBadge').textContent = `${p.icon} ${p.name}`;
  document.getElementById('testsTitle').textContent = `Tests: ${t.name}`;
  
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
          <p class="status-desc" style="font-size:14px; margin-bottom:10px;">${test.numero_preguntas} preguntas · Publicado en ${test.fecha}</p>
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

      const card = document.createElement('div');
      card.className = `test-card${isEmpty ? ' empty-test' : ''}`;
      card.innerHTML = `
        <div class="test-card-header">
          <h3>TEST ${n.toString().padStart(2, '0')}</h3>
          <span class="status-badge">${label}</span>
        </div>
        <p class="status-desc">TEST DE APROBADOS YA - ${testQs} preguntas</p>
        <div class="test-card-btns">
          <button class="tc-btn primary" data-n="${n}" data-mode="test" ${isEmpty ? 'disabled' : ''}>▶ Hacer test</button>
          <button class="tc-btn secondary" data-n="${n}" data-mode="memo" ${isEmpty ? 'disabled' : ''}>🧠 Memorizar</button>
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
function startTest(testIdentifier, mode, isOfficial = false) {
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

function renderQuestion(index) {
  state.currentQuestion = index;
  const q = state.questions[index];
  const total = state.questions.length;
  
  // Progress
  const pct = Math.round(((index + 1) / total) * 100);
  document.getElementById('testProgFill').style.width = `${pct}%`;
  document.getElementById('testProgCurrent').textContent = index + 1;
  document.getElementById('testProgTotal').textContent = total;
  document.getElementById('testQCounter').textContent = `${index + 1}/${total}`;
  
  document.getElementById('questionNum').textContent = `Pregunta ${index + 1} de ${total}`;
  
  const qText = document.getElementById('questionText');
  qText.textContent = q.pregunta;
  if (q.isPlaceholder) {
    qText.innerHTML = `<span style="color:#d9534f;">⚠️ ${q.pregunta}</span>`;
  }

  // Imagen
  const imgEl = document.getElementById('questionImg');
  if (q.imagen_url) {
    const src = q.imagen_local || q.imagen_url;
    if (src.includes('.jpg') || src.includes('.png') || src.startsWith('http')) {
      imgEl.innerHTML = `<img src="${src}" alt="Ilustración de la pregunta" style="max-width:100%; max-height:220px; object-fit:contain; border-radius:4px; display:block;" />`;
    } else {
      imgEl.innerHTML = q.imagen_url;
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
      btn.disabled = true;
      if (key === q.correcta) btn.classList.add('correct-opt');
      else if (state.answers[index] === key) btn.classList.add('wrong-opt');
    }

    btn.innerHTML = `<span class="option-letter">${key}</span><span>${q.respuestas[key]}</span>`;

    if (!answered && !q.isPlaceholder) {
      btn.addEventListener('click', () => {
        state.answers[index] = key;
        if (key === q.correcta) state.score++;
        
        renderQuestion(index);
      });
    }
    
    optsContainer.appendChild(btn);
  });

  const feedback = document.getElementById('questionFeedback');
  const fhdr = document.getElementById('feedbackHeader');
  const fexp = document.getElementById('feedbackExplanation');
  const nextBtn = document.getElementById('nextQuestionBtn');

  if (answered || q.isPlaceholder) {
    feedback.style.display = 'block';
    
    if (q.isPlaceholder) {
        fhdr.className = 'feedback-header';
        fhdr.textContent = 'Pendiente de importar';
        fexp.innerHTML = `<em>${q.explanation}</em>`;
    } else {
      const isCorrect = state.answers[index] === q.correcta;
      fhdr.className = `feedback-header ${isCorrect ? 'correct' : 'wrong'}`;
      fhdr.textContent = isCorrect ? '✅ ¡Respuesta correcta!' : `❌ Incorrecto — La correcta era: ${q.correcta}`;
      fexp.textContent = q.explanation || (q.fuente === 'Revista DGT' ? 'Respuesta oficial DGT: ' + q.correcta : '');
    }

    nextBtn.textContent = (index === total - 1) ? 'Finalizar Test' : 'Siguiente pregunta →';
    nextBtn.onclick = () => {
      if (index === total - 1) {
        showResults();
      } else {
        renderQuestion(index + 1);
      }
    };
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
  const skipped = total - results.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  document.getElementById('resultScoreText').textContent = `${correct}/${total}`;
  const circle = document.getElementById('resultScoreCircle');
  circle.className = `result-score-circle${pct < 70 ? ' fail' : ''}`;
  
  document.getElementById('resultEmoji').textContent = pct >= 90 ? '🎉' : pct >= 70 ? '👍' : '📚';
  document.getElementById('resultTitle').textContent = pct >= 90 ? '¡Excelente resultado!' : pct >= 70 ? '¡Buen trabajo!' : 'Sigue practicando';
  document.getElementById('resultSubtitle').textContent = `Has acertado ${correct} de ${total} preguntas (${pct}%).${pct < 70 ? ' Revisa las respuestas y vuelve a intentarlo.' : ''}`;

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
    div.innerHTML = `
      <div class="rr-icon">${ok ? '✅' : '❌'}</div>
      <div class="rr-content">
        <div class="rr-q">${i+1}. ${r.q.pregunta}</div>
        <div class="rr-ans">
          ${!ok ? `<span class="err-a">${r.selected ? r.q.respuestas[r.selected] : 'Ninguna'}</span>` : ''}
          <span class="ok-a">✓ ${r.q.respuestas[r.q.correcta]}</span>
        </div>
      </div>
    `;
    reviewEl.appendChild(div);
  });

  showScreen('screen-result');
}

// ─── MEMORIZAR ──────────────────────────────────────
function renderMemo() {
  const p = state.permit;
  document.getElementById('memoPermitBadge').textContent = `${p.icon} ${p.name}`;
  
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
    if (q.imagen_url) {
      const src = q.imagen_local || q.imagen_url;
      if (src.includes('.jpg') || src.includes('.png') || src.startsWith('http')) {
        imgHtml = `<div class="memo-img" style="border:none; background:transparent;"><img src="${src}" alt="Ilustración" style="max-width:100%; max-height:200px; object-fit:contain; border-radius:4px; display:block; margin:0 auto;" /></div>`;
      } else {
        imgHtml = `<div class="memo-img">${q.imagen_url}</div>`;
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
