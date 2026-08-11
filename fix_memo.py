import os
import re

# Fix app_v2.js
with open('app_v2.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Fix the duplicate 'Permiso Permiso B' text in renderMemoSelectors
js = js.replace("document.getElementById('memoTitle').innerText = 'Memorizar: Permiso ' + (pObj ? pObj.name : memoState.permitId);", 
                "document.getElementById('memoTitle').innerText = 'Memorizar: ' + (pObj ? pObj.name : 'Permiso ' + memoState.permitId);")

# Replace loadMemoQuestions
load_qs_start = js.find('async function loadMemoQuestions() {')
load_qs_end = js.find('async function showFavoritesScreen() {')
new_load_qs = """async function loadMemoQuestions() {
  let allQs = [];
  try {
     const allPermitQs = db.dgtQuestions.filter(q => q.permit_id === memoState.permitId);
     if (memoState.topicId === 'general') {
         allQs = allPermitQs;
     } else {
         allQs = allPermitQs.filter(q => q.theme_aprobados_ya === memoState.topicId || q.theme_id === memoState.topicId);
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

"""
if load_qs_start != -1 and load_qs_end != -1:
    js = js[:load_qs_start] + new_load_qs + js[load_qs_end:]
else:
    print("Could not find loadMemoQuestions")


# Replace renderMemoCard
render_card_start = js.find("function renderMemoCard(container = document.getElementById('memoList')) {")
if render_card_start != -1:
    render_card_end = js.find("function handleMemoAnswer(idx) {", render_card_start)
    new_render_card = """function renderMemoCard(container = document.getElementById('memoList')) {
   const q = memoState.questions[memoState.currentIndex];
   if(!q) return;
   const isFav = UserManager.data.favorites.includes(q.id);
   const favIcon = isFav ? '★' : '☆';
   const favClass = isFav ? 'active' : '';
   
   let html = `<div class="memo-card">
       <button class="memo-fav-btn ${favClass}" onclick="toggleFavorite('${q.id}')" title="Favorito">${favIcon}</button>
       <div class="memo-q" style="font-size:18px; margin-bottom:15px; padding-right:30px;"><strong>${memoState.currentIndex + 1}/${memoState.questions.length}</strong>. ${q.pregunta || q.q}</div>`;
   
   const imgUrl = q.imagen_local || (q.imagen_url && !q.imagen_url.startsWith('http') ? 'images/' + q.imagen_url : q.imagen_url) || (q.image ? 'img/' + q.image : null);
   if (imgUrl) html += `<img src="${imgUrl}" style="max-width:100%; max-height:250px; border-radius:12px; margin-bottom:20px; display:block; object-fit:contain; border:1px solid var(--border);">`;
   
   html += `<div class="memo-opts" style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">`;
   
   const respKeys = q.respuestas ? Object.keys(q.respuestas) : (q.options ? ['A','B','C','D'].slice(0, q.options.length) : []);
   
   respKeys.forEach(k => {
       const optText = q.respuestas ? q.respuestas[k] : q.options[k.charCodeAt(0)-65];
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
       html += `<div class="memo-feedback show ${fbClass}" style="margin-bottom:20px; padding:15px; border-radius:8px; background:${isOk?'var(--green-light)':'#ffe5e5'}; color:var(--text); font-size:15px;">
           <strong>${fbText}</strong>
           ${q.explanation ? '<div style="margin-top:10px;"><strong>Explicación:</strong> ' + q.explanation + '</div>' : ''}
       </div>`;
   }
   
   html += `<div class="memo-actions" style="display:flex; gap:10px; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:20px;">
       <button class="outline-btn" style="flex:1;" onclick="prevMemoQuestion()" ${memoState.currentIndex === 0 ? 'disabled' : ''}>← Anterior</button>
       ${memoState.selectedOpt === null ? `<button class="primary-btn" style="flex:1;" onclick="showMemoAnswer()">👁 Ver respuesta</button>` : ''}
       <button class="primary-btn" style="flex:1;" onclick="nextMemoQuestion()" ${memoState.currentIndex === memoState.questions.length - 1 ? 'disabled' : ''}>Siguiente →</button>
     </div></div>`;
   container.innerHTML = html;
}

"""
    js = js[:render_card_start] + new_render_card + js[render_card_end:]
    
    # Also update the handle functions to accept strings like 'A'
    js = js.replace("memoState.selectedOpt = memoState.questions[memoState.currentIndex].correct;", "memoState.selectedOpt = memoState.questions[memoState.currentIndex].correcta || String.fromCharCode(65 + memoState.questions[memoState.currentIndex].correct);")

with open('app_v2.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Updated app_v2.js successfully")

# Fix index.html duplicate nav link and bump version
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove the second "Tests" button
html = html.replace('<a href="#" class="nav-link" data-target="screen-home">📚 Tests</a>\n', '')

# Bump version to v=7
html = re.sub(r'app_v2\.js\?v=\d+', 'app_v2.js?v=7', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated index.html successfully")
