import re

with open('app_v2.js', 'r', encoding='utf-8') as f:
    js = f.read()

memo_patch = '''
// ─── MEMORIZAR Y FAVORITOS ───

// Estado local para memorizar y favoritos
const memoState = {
   questions: [],
   currentIndex: 0,
   selectedOpt: null,
   mode: 'memo' // 'memo' or 'fav'
};

async function showMemorizeScreen() {
  showScreen('screen-memo');
  memoState.mode = 'memo';
  
  // Si no hay preguntas activas (ej. no ha entrado desde un test o no hay lastPermit), cargar B por defecto
  let permit = UserManager.data.lastPermit || 'B';
  let allQuestions = [];
  
  if (state.questions && state.questions.length > 0 && state.testMode === 'test') {
     allQuestions = [...state.questions];
  } else {
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
     } catch(e) { console.error(e); }
  }
  
  if(allQuestions.length === 0) {
      document.getElementById('memoList').innerHTML = '<div style="padding:40px;text-align:center">No hay preguntas disponibles.</div>';
      return;
  }
  
  memoState.questions = allQuestions;
  memoState.currentIndex = 0;
  memoState.selectedOpt = null;
  
  document.getElementById('memoTitle').innerText = 'Memorizar: Permiso ' + permit;
  document.getElementById('memoSubtitle').innerText = 'Estudia y repasa las preguntas';
  
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
  
  // Fetch ALL questions to find the favorites. This is brute force but works client-side.
  let allQuestions = [];
  try {
     const rawB = await db.fetchB();
     rawB.forEach(t => allQuestions = allQuestions.concat(t.questions));
     const rawDGT = await db.fetchDGT();
     for(let p in rawDGT.tests) {
         rawDGT.tests[p].general.forEach(t => allQuestions = allQuestions.concat(t.questions));
         for(let k in rawDGT.tests[p].topics) {
             rawDGT.tests[p].topics[k].forEach(t => allQuestions = allQuestions.concat(t.questions));
         }
     }
  } catch(e) { console.error(e); }
  
  const favQs = allQuestions.filter(q => UserManager.data.favorites.includes(q.id));
  
  if(favQs.length === 0) {
      list.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text3)">Tus favoritos no se han encontrado en la base de datos actual.</div>';
      return;
  }
  
  memoState.questions = favQs;
  memoState.currentIndex = 0;
  memoState.selectedOpt = null;
  
  renderMemoCard(list);
}

function renderMemoCard(container = document.getElementById('memoList')) {
   const q = memoState.questions[memoState.currentIndex];
   if(!q) return;
   
   const isFav = UserManager.data.favorites.includes(q.id);
   const favIcon = isFav ? '★' : '☆';
   const favClass = isFav ? 'active' : '';
   
   let html = `
     <div class="memo-card">
       <button class="memo-fav-btn ${favClass}" onclick="toggleFavorite('${q.id}')" title="Favorito">${favIcon}</button>
       <div class="memo-q">${memoState.currentIndex + 1}. ${q.q}</div>
   `;
   
   if (q.image) {
       html += `<img src="img/${q.image}" style="max-width:100%; border-radius:12px; margin-bottom:16px; display:block;">`;
   }
   
   html += `<div class="memo-opts">`;
   const letters = ['A','B','C','D'];
   q.options.forEach((opt, idx) => {
       // If selected, show correctness
       let btnClass = 'memo-opt-btn';
       if (memoState.selectedOpt !== null) {
           if (idx === q.correct) btnClass += ' correct';
           else if (idx === memoState.selectedOpt) btnClass += ' wrong';
       }
       
       html += `<button class="${btnClass}" onclick="handleMemoAnswer(${idx})" ${memoState.selectedOpt !== null ? 'disabled' : ''}>
          <strong>${letters[idx]}.</strong> ${opt}
       </button>`;
   });
   html += `</div>`;
   
   if (memoState.selectedOpt !== null) {
       const isOk = (memoState.selectedOpt === q.correct);
       const fbClass = isOk ? 'success' : 'error';
       const fbText = isOk ? '¡Correcto!' : 'Incorrecto.';
       html += `
         <div class="memo-feedback show ${fbClass}">
            ${fbText} ${q.explanation ? '<br><br><strong>Explicación:</strong> ' + q.explanation : ''}
         </div>
       `;
   }
   
   html += `
     <div class="memo-actions">
       <button class="outline-btn" onclick="prevMemoQuestion()" ${memoState.currentIndex === 0 ? 'disabled' : ''}>Anterior</button>
       ${memoState.selectedOpt === null ? `<button class="outline-btn" onclick="showMemoAnswer()">👁 Ver respuesta</button>` : ''}
       <button class="primary-btn" onclick="nextMemoQuestion()" ${memoState.currentIndex === memoState.questions.length - 1 ? 'disabled' : ''}>Siguiente</button>
     </div>
   </div>`;
   
   container.innerHTML = html;
}

function handleMemoAnswer(idx) {
    memoState.selectedOpt = idx;
    const container = memoState.mode === 'fav' ? document.getElementById('favoritesList') : document.getElementById('memoList');
    renderMemoCard(container);
}

function showMemoAnswer() {
    const q = memoState.questions[memoState.currentIndex];
    memoState.selectedOpt = q.correct; // Force correct answer highlight
    const container = memoState.mode === 'fav' ? document.getElementById('favoritesList') : document.getElementById('memoList');
    renderMemoCard(container);
}

function nextMemoQuestion() {
    if (memoState.currentIndex < memoState.questions.length - 1) {
        memoState.currentIndex++;
        memoState.selectedOpt = null;
        const container = memoState.mode === 'fav' ? document.getElementById('favoritesList') : document.getElementById('memoList');
        renderMemoCard(container);
    }
}

function prevMemoQuestion() {
    if (memoState.currentIndex > 0) {
        memoState.currentIndex--;
        memoState.selectedOpt = null;
        const container = memoState.mode === 'fav' ? document.getElementById('favoritesList') : document.getElementById('memoList');
        renderMemoCard(container);
    }
}

function toggleFavorite(qId) {
   const idx = UserManager.data.favorites.indexOf(qId);
   if (idx === -1) {
       UserManager.data.favorites.push(qId);
   } else {
       UserManager.data.favorites.splice(idx, 1);
   }
   UserManager.save();
   
   // Re-render
   const container = memoState.mode === 'fav' ? document.getElementById('favoritesList') : document.getElementById('memoList');
   
   if (memoState.mode === 'fav' && idx !== -1) {
       // If removed from favs while in favs view, remove it from list
       memoState.questions = memoState.questions.filter(q => q.id !== qId);
       if (memoState.currentIndex >= memoState.questions.length) memoState.currentIndex--;
       if (memoState.questions.length === 0) {
           showFavoritesScreen(); // re-init empty state
           return;
       }
   }
   renderMemoCard(container);
}

window.toggleFavorite = toggleFavorite;
window.handleMemoAnswer = handleMemoAnswer;
window.showMemoAnswer = showMemoAnswer;
window.nextMemoQuestion = nextMemoQuestion;
window.prevMemoQuestion = prevMemoQuestion;
window.startSpecialTest = startSpecialTest;
'''

js = re.sub(r'function showFavoritesScreen\(\) \{.*?\}\n(?=function showMemorizeScreen)', '', js, flags=re.DOTALL)
js = re.sub(r'function showMemorizeScreen\(\) \{.*?\}\n(?=// Favoritos Logic)', '', js, flags=re.DOTALL)
js = re.sub(r'// Favoritos Logic para el futuro.*?UserManager\.save\(\);\n\}', '', js, flags=re.DOTALL)

# Append to the end of file
js += '\n' + memo_patch

with open('app_v2.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("app_v2.js updated memorize and favorites.")
