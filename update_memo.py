import os

def update_memo():
    with open('app_v2.js', 'r', encoding='utf-8') as f:
        js = f.read()

    start_idx = js.find('const memoState = {')
    end_idx = js.find('window.startSpecialTest = startSpecialTest;')
    
    if start_idx == -1 or end_idx == -1:
        print("Couldn't find markers")
        return

    new_memo_code = """const memoState = { questions: [], currentIndex: 0, selectedOpt: null, mode: 'memo', permitId: 'B', topicId: 'general' };

async function showMemorizeScreen() {
  showScreen('screen-memo');
  memoState.mode = 'memo';
  memoState.permitId = UserManager.data.lastPermit || 'B';
  memoState.topicId = 'general';
  
  await renderMemoSelectors();
  await loadMemoQuestions();
}

async function renderMemoSelectors() {
    const subtitle = document.getElementById('memoSubtitle');
    let html = `<div style="display:flex; gap:10px; margin-top:10px;">
        <select id="memoPermitSelect" onchange="handleMemoPermitChange(this.value)" style="padding:8px; border-radius:8px; border:1px solid #ddd;">`;
    
    db.getPermits().forEach(p => {
        html += `<option value="${p.id}" ${memoState.permitId === p.id ? 'selected' : ''}>Permiso ${p.name}</option>`;
    });
    html += `</select>`;
    
    html += `<select id="memoTopicSelect" onchange="handleMemoTopicChange(this.value)" style="padding:8px; border-radius:8px; border:1px solid #ddd;">`;
    html += `<option value="general" ${memoState.topicId === 'general' ? 'selected' : ''}>Todos los temas</option>`;
    
    db.getThemes(memoState.permitId).forEach(t => {
        html += `<option value="${t.id}" ${memoState.topicId === t.id ? 'selected' : ''}>Tema: ${t.name}</option>`;
    });
    html += `</select></div>`;
    
    subtitle.innerHTML = html;
    
    const pObj = db.getPermits().find(p => p.id === memoState.permitId);
    document.getElementById('memoTitle').innerText = 'Memorizar: Permiso ' + (pObj ? pObj.name : memoState.permitId);
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
     if (memoState.permitId === 'B') {
        const raw = await db.fetchB();
        if (memoState.topicId === 'general') {
            raw.forEach(t => allQs = allQs.concat(t.questions));
        } else {
            const match = raw.find(t => t.id == memoState.topicId);
            if(match) allQs = match.questions;
        }
     } else {
        const raw = await db.fetchDGT();
        const pData = raw.tests[memoState.permitId];
        if (pData) {
            if (memoState.topicId === 'general') {
                pData.general.forEach(t => allQs = allQs.concat(t.questions));
                for(let k in pData.topics) pData.topics[k].forEach(t => allQs = allQs.concat(t.questions));
            } else {
                if(pData.topics[memoState.topicId]) {
                    pData.topics[memoState.topicId].forEach(t => allQs = allQs.concat(t.questions));
                }
            }
        }
     }
  } catch(e) {}
  
  if(allQs.length === 0) {
      document.getElementById('memoList').innerHTML = '<div style="padding:40px;text-align:center">No hay preguntas disponibles para esta selección.</div>';
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

"""
    
    new_js = js[:start_idx] + new_memo_code + js[end_idx:]
    with open('app_v2.js', 'w', encoding='utf-8') as f:
        f.write(new_js)

update_memo()
