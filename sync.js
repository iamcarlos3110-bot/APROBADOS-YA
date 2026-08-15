/* =============================================
   APROBADOS YA — SyncManager
   Sincroniza datos entre localStorage y Supabase.
   
   Orden de prioridad:
   1. Si hay sesión activa → leer/guardar en Supabase
   2. localStorage como caché temporal/offline
   3. Al iniciar sesión → ofrecer migración de datos locales
============================================= */

import { supabase, currentUser } from './auth.js';

// ─── LEER PROGRESO DESDE SUPABASE ─────────────────────────
export async function loadProgressFromDB() {
  const user = window.currentUser?.();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return null;
    return data;
  } catch (e) {
    console.warn('SyncManager: error leyendo progreso', e);
    return null;
  }
}

// ─── GUARDAR PROGRESO EN SUPABASE ─────────────────────────
export async function saveProgressToDB(progressData) {
  const user = window.currentUser?.();
  if (!user) return false;

  try {
    const payload = {
      user_id: user.id,
      tests_completed: progressData.totalTests || 0,
      questions_answered: (progressData.totalCorrect || 0) + (progressData.mistakes?.length || 0),
      correct_answers: progressData.totalCorrect || 0,
      wrong_answers: (progressData.mistakes || []).length,
      streak: progressData.streak || 0,
      last_active_date: progressData.lastActiveDate || null,
      daily_questions: progressData.dailyQuestions || 0,
      last_permit: progressData.lastPermit || null,
      last_state: progressData.lastState || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_progress')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('SyncManager: error guardando progreso', e);
    return false;
  }
}

// ─── GUARDAR FAVORITO EN SUPABASE ─────────────────────────
export async function addFavoriteToDB(questionId) {
  const user = window.currentUser?.();
  if (!user) return false;

  try {
    const { error } = await supabase
      .from('favorites')
      .upsert({ user_id: user.id, question_id: questionId }, { onConflict: 'user_id,question_id' });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('SyncManager: error añadiendo favorito', e);
    return false;
  }
}

// ─── ELIMINAR FAVORITO DE SUPABASE ────────────────────────
export async function removeFavoriteFromDB(questionId) {
  const user = window.currentUser?.();
  if (!user) return false;

  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('question_id', questionId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('SyncManager: error eliminando favorito', e);
    return false;
  }
}

// ─── LEER FAVORITOS DESDE SUPABASE ────────────────────────
export async function loadFavoritesFromDB() {
  const user = window.currentUser?.();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('question_id')
      .eq('user_id', user.id);
    if (error) throw error;
    return data.map(f => f.question_id);
  } catch (e) {
    console.warn('SyncManager: error leyendo favoritos', e);
    return null;
  }
}

// ─── GUARDAR ERROR EN SUPABASE ────────────────────────────
export async function recordMistakeToDB(questionId, isCorrect) {
  const user = window.currentUser?.();
  if (!user) return false;

  try {
    if (isCorrect) {
      // Si acierta, incrementar times_correct
      const { data: existing } = await supabase
        .from('mistakes')
        .select('*')
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .single();

      if (existing) {
        await supabase.from('mistakes').update({
          times_correct: existing.times_correct + 1,
          updated_at: new Date().toISOString()
        }).eq('user_id', user.id).eq('question_id', questionId);
      }
    } else {
      // Si falla, insertar o incrementar times_wrong
      const { data: existing } = await supabase
        .from('mistakes')
        .select('*')
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .single();

      if (existing) {
        await supabase.from('mistakes').update({
          times_wrong: existing.times_wrong + 1,
          last_wrong_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('user_id', user.id).eq('question_id', questionId);
      } else {
        await supabase.from('mistakes').insert({
          user_id: user.id,
          question_id: questionId,
          times_wrong: 1,
          times_correct: 0
        });
      }
    }
    return true;
  } catch (e) {
    console.warn('SyncManager: error guardando error', e);
    return false;
  }
}

export async function recordMistakesBulkToDB(results) {
  const user = window.currentUser?.();
  if (!user || !Array.isArray(results) || results.length === 0) return false;

  try {
    const { data: existing, error: selectError } = await supabase
      .from('mistakes')
      .select('*')
      .eq('user_id', user.id);

    if (selectError) throw selectError;

    const existingMap = {};
    (existing || []).forEach(m => {
      existingMap[m.question_id] = m;
    });

    const upserts = [];
    results.forEach(r => {
      if (!r || !r.q || !r.q.id) return; // Safeguard against placeholders or missing data
      const qId = r.q.id;
      const isCorrect = r.isCorrect;
      const dbRow = existingMap[qId];

      if (isCorrect) {
        if (dbRow) {
          upserts.push({
            user_id: user.id,
            question_id: qId,
            times_wrong: dbRow.times_wrong,
            times_correct: dbRow.times_correct + 1,
            last_wrong_at: dbRow.last_wrong_at,
            updated_at: new Date().toISOString()
          });
        }
      } else {
        if (dbRow) {
          upserts.push({
            user_id: user.id,
            question_id: qId,
            times_wrong: dbRow.times_wrong + 1,
            times_correct: dbRow.times_correct,
            last_wrong_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } else {
          upserts.push({
            user_id: user.id,
            question_id: qId,
            times_wrong: 1,
            times_correct: 0,
            last_wrong_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    });

    if (upserts.length > 0) {
      const { error: upsertError } = await supabase
        .from('mistakes')
        .upsert(upserts, { onConflict: 'user_id,question_id' });
      if (upsertError) throw upsertError;
    }

    return true;
  } catch (e) {
    console.warn('SyncManager: error en guardado masivo de errores', e);
    return false;
  }
}

// ─── GUARDAR RESULTADO DE TEST EN HISTORIAL ───────────────
export async function saveTestResultToDB({ testId, permitId, topicId, correct, wrong, total }) {
  const user = window.currentUser?.();
  if (!user) return false;

  const score = total > 0 ? Math.round((correct / total) * 100 * 10) / 10 : 0;

  try {
    const { error } = await supabase.from('test_history').insert({
      user_id: user.id,
      test_id: testId,
      permit_id: permitId,
      topic_id: topicId || null,
      score,
      correct,
      wrong,
      total
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('SyncManager: error guardando historial', e);
    return false;
  }
}

// ─── MIGRAR LOCALSTORAGE → SUPABASE ──────────────────────
export async function migrateLocalDataToDB() {
  const user = window.currentUser?.();
  if (!user) return { success: false, reason: 'no_user' };

  try {
    const raw = localStorage.getItem('ay_progress');
    if (!raw) return { success: false, reason: 'no_local_data' };
    const local = JSON.parse(raw);

    // 1. Subir progreso principal
    await saveProgressToDB(local);

    // 2. Subir favoritos (sin duplicados gracias al UNIQUE)
    if (Array.isArray(local.favorites) && local.favorites.length > 0) {
      const rows = local.favorites.map(qId => ({ user_id: user.id, question_id: qId }));
      await supabase.from('favorites')
        .upsert(rows, { onConflict: 'user_id,question_id' });
    }

    // 3. Subir errores (sin duplicados)
    if (Array.isArray(local.mistakes) && local.mistakes.length > 0) {
      const rows = local.mistakes.map(qId => ({
        user_id: user.id,
        question_id: qId,
        times_wrong: 1,
        times_correct: 0
      }));
      await supabase.from('mistakes')
        .upsert(rows, { onConflict: 'user_id,question_id', ignoreDuplicates: true });
    }

    return { success: true };
  } catch (e) {
    console.error('SyncManager: error en migración', e);
    return { success: false, reason: e.message };
  }
}

// ─── LEER ERRORES DESDE SUPABASE ─────────────────────────
export async function loadMistakesFromDB() {
  const user = window.currentUser?.();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from('mistakes')
      .select('question_id')
      .eq('user_id', user.id);
    if (error) throw error;
    return data ? data.map(m => m.question_id) : [];
  } catch (e) {
    console.warn('SyncManager: error leyendo errores', e);
    return null;
  }
}

// ─── CARGAR DATOS DE SUPABASE AL INICIO ──────────────────
// Llamar cuando el usuario inicia sesión
export async function syncFromDB() {
  const user = window.currentUser?.();
  if (!user || typeof UserManager === 'undefined') return;

  try {
    const [progressData, favData, mistakeData] = await Promise.all([
      loadProgressFromDB(),
      loadFavoritesFromDB(),
      loadMistakesFromDB()
    ]);

    if (progressData) {
      // Combinar datos de DB con los locales (tomar el mayor en tests/streak)
      const local = UserManager.data;
      UserManager.data = {
        ...local,
        totalTests: Math.max(local.totalTests || 0, progressData.tests_completed || 0),
        totalCorrect: Math.max(local.totalCorrect || 0, progressData.correct_answers || 0),
        streak: Math.max(local.streak || 0, progressData.streak || 0),
        lastActiveDate: progressData.last_active_date || local.lastActiveDate,
        dailyQuestions: progressData.daily_questions || local.dailyQuestions || 0,
        lastPermit: progressData.last_permit || local.lastPermit,
        lastState: progressData.last_state || local.lastState,
      };
    }

    if (favData) {
      // Fusionar favoritos locales y de DB (sin duplicados)
      const localFavs = UserManager.data.favorites || [];
      const allFavs = [...new Set([...localFavs, ...favData])];
      UserManager.data.favorites = allFavs;
    }

    if (mistakeData) {
      // Fusionar errores locales y de DB (sin duplicados)
      const localMistakes = UserManager.data.mistakes || [];
      const allMistakes = [...new Set([...localMistakes, ...mistakeData])];
      UserManager.data.mistakes = allMistakes;
    }

    localStorage.setItem('ay_progress', JSON.stringify(UserManager.data));
    UserManager.updateUI();
    console.log('SyncManager: datos sincronizados desde Supabase');
  } catch (e) {
    console.warn('SyncManager: error sincronizando desde DB', e);
  }
}

window.SyncManager = {
  loadProgressFromDB,
  saveProgressToDB,
  addFavoriteToDB,
  removeFavoriteFromDB,
  loadFavoritesFromDB,
  loadMistakesFromDB,
  recordMistakeToDB,
  recordMistakesBulkToDB,
  saveTestResultToDB,
  migrateLocalDataToDB,
  syncFromDB
};

console.log('SyncManager cargado ✓');

// Si ya hay un usuario con sesión activa en window, lanzar sincronización inmediata
(async () => {
  const user = window.currentUser?.();
  if (user) {
    console.log('SyncManager: detectado usuario al cargar, iniciando syncFromDB...');
    await syncFromDB();
  }
})();
