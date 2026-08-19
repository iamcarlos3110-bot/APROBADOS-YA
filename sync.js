/* =============================================
   APROBADOS YA — SyncManager
   Sincroniza datos entre localStorage y Supabase.
   
   Orden de prioridad:
   1. Si hay sesión activa → Supabase es la FUENTE DE VERDAD
   2. localStorage funciona como caché temporal/offline
   3. Al iniciar sesión → se ofrece migrar los datos locales una sola vez
============================================= */

import { supabase, currentUser } from './auth.js';

// ─── UTILS: LOG DE ERRORES DETALLADO (REGLA DE CONTRATACIÓN) ───
function logSupabaseError(operation, table, error) {
  if (!error) return;
  console.error(
    `[SYNC PROGRESS ERROR]\n` +
    `operación: ${operation}\n` +
    `tabla: ${table}\n` +
    `error de Supabase: ${JSON.stringify(error)}\n` +
    `código: ${error.code || 'N/A'}\n` +
    `mensaje: ${error.message || 'N/A'}\n` +
    `detalles: ${error.details || 'N/A'}`
  );
}

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

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logSupabaseError('select', 'user_progress', error);
      throw error;
    }
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
      total_tests_taken: progressData.totalTests || 0,
      total_questions_answered: (progressData.totalCorrect || 0) + (progressData.mistakes?.length || 0),
      total_correct_answers: progressData.totalCorrect || 0,
      current_streak: progressData.streak || 0,
      best_streak: progressData.bestStreak || progressData.streak || 0,
      last_test_date: progressData.lastActiveDate || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_progress')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      logSupabaseError('upsert', 'user_progress', error);
      throw error;
    }
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
    if (error) {
      logSupabaseError('upsert', 'favorites', error);
      throw error;
    }
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
    if (error) {
      logSupabaseError('delete', 'favorites', error);
      throw error;
    }
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
    if (error) {
      logSupabaseError('select', 'favorites', error);
      throw error;
    }
    return data ? data.map(f => f.question_id) : [];
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
      const { data: existing } = await supabase
        .from('mistakes')
        .select('*')
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .single();

      if (existing) {
        const { error } = await supabase.from('mistakes').update({
          times_correct: existing.times_correct + 1,
          updated_at: new Date().toISOString()
        }).eq('user_id', user.id).eq('question_id', questionId);
        if (error) {
          logSupabaseError('update', 'mistakes', error);
          throw error;
        }
      }
    } else {
      const { data: existing } = await supabase
        .from('mistakes')
        .select('*')
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .single();

      if (existing) {
        const { error } = await supabase.from('mistakes').update({
          times_wrong: existing.times_wrong + 1,
          last_wrong_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('user_id', user.id).eq('question_id', questionId);
        if (error) {
          logSupabaseError('update', 'mistakes', error);
          throw error;
        }
      } else {
        const { error } = await supabase.from('mistakes').insert({
          user_id: user.id,
          question_id: questionId,
          times_wrong: 1,
          times_correct: 0
        });
        if (error) {
          logSupabaseError('insert', 'mistakes', error);
          throw error;
        }
      }
    }
    return true;
  } catch (e) {
    console.warn('SyncManager: error guardando error', e);
    return false;
  }
}

// ─── GUARDADO DE ERRORES EN LOTE (OPTIMIZADO) ─────────────
export async function recordMistakesBulkToDB(results) {
  const user = window.currentUser?.();
  if (!user || !Array.isArray(results) || results.length === 0) return false;

  try {
    const { data: existing, error: selectError } = await supabase
      .from('mistakes')
      .select('*')
      .eq('user_id', user.id);

    if (selectError) {
      logSupabaseError('select', 'mistakes', selectError);
      throw selectError;
    }

    const existingMap = {};
    (existing || []).forEach(m => {
      existingMap[m.question_id] = m;
    });

    const upserts = [];
    results.forEach(r => {
      if (!r || !r.q || !r.q.id) return;
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
      if (upsertError) {
        logSupabaseError('upsert', 'mistakes', upsertError);
        throw upsertError;
      }
    }

    return true;
  } catch (e) {
    console.warn('SyncManager: error en guardado masivo de errores', e);
    return false;
  }
}

// ─── GUARDAR ESTADÍSTICAS POR TEMA EN LOTE ───────────────
export async function saveTopicStatsBulkToDB(topicStats) {
  const user = window.currentUser?.();
  if (!user || !topicStats) return false;

  try {
    const upserts = [];
    Object.keys(topicStats).forEach(permitId => {
      const topics = topicStats[permitId];
      if (topics && typeof topics === 'object') {
        Object.keys(topics).forEach(topicId => {
          const stats = topics[topicId];
          if (stats) {
            upserts.push({
              user_id: user.id,
              permit_id: permitId,
              topic_id: topicId,
              correct: stats.correct || 0,
              total: stats.total || 0,
              updated_at: new Date().toISOString()
            });
          }
        });
      }
    });

    if (upserts.length > 0) {
      const { error } = await supabase
        .from('topic_stats')
        .upsert(upserts, { onConflict: 'user_id,permit_id,topic_id' });
      if (error) {
        logSupabaseError('upsert', 'topic_stats', error);
        throw error;
      }
    }
    return true;
  } catch (e) {
    console.warn('SyncManager: error en guardado de estadísticas por tema', e);
    return false;
  }
}

// ─── LEER ESTADÍSTICAS POR TEMA DESDE SUPABASE ───────────
export async function loadTopicStatsFromDB() {
  const user = window.currentUser?.();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from('topic_stats')
      .select('permit_id, topic_id, correct, total')
      .eq('user_id', user.id);

    if (error) {
      logSupabaseError('select', 'topic_stats', error);
      throw error;
    }

    const topicStats = {};
    (data || []).forEach(row => {
      if (!topicStats[row.permit_id]) topicStats[row.permit_id] = {};
      topicStats[row.permit_id][row.topic_id] = {
        correct: row.correct,
        total: row.total
      };
    });
    return topicStats;
  } catch (e) {
    console.warn('SyncManager: error leyendo estadísticas por tema', e);
    return null;
  }
}

// ─── LEER HISTORIAL DE TESTS PARA RECONSTRUIR PUNTUACIONES ───
export async function loadTestHistoryFromDB() {
  const user = window.currentUser?.();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from('test_history')
      .select('test_id, score')
      .eq('user_id', user.id);

    if (error) {
      logSupabaseError('select', 'test_history', error);
      throw error;
    }

    const testScores = {};
    (data || []).forEach(row => {
      // Find the highest score for each test ID
      const numScore = Math.round(row.score);
      if (testScores[row.test_id] === undefined || numScore > testScores[row.test_id]) {
        testScores[row.test_id] = numScore;
      }
    });
    return testScores;
  } catch (e) {
    console.warn('SyncManager: error leyendo historial de tests', e);
    return null;
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
    if (error) {
      logSupabaseError('insert', 'test_history', error);
      throw error;
    }
    return true;
  } catch (e) {
    console.warn('SyncManager: error guardando historial', e);
    return false;
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
    if (error) {
      logSupabaseError('select', 'mistakes', error);
      throw error;
    }
    return data ? data.map(m => m.question_id) : [];
  } catch (e) {
    console.warn('SyncManager: error leyendo errores', e);
    return null;
  }
}

// ─── CARGAR DATOS DE SUPABASE AL INICIO (FUENTE DE VERDAD) ───
export async function syncFromDB() {
  const user = window.currentUser?.();
  if (!user || typeof UserManager === 'undefined') return;

  try {
    console.log('SyncManager: Descargando progreso del usuario desde la nube...');
    const [progressData, favData, mistakeData, topicStatsData, testScoresData] = await Promise.all([
      loadProgressFromDB(),
      loadFavoritesFromDB(),
      loadMistakesFromDB(),
      loadTopicStatsFromDB(),
      loadTestHistoryFromDB()
    ]);

    // Supabase es la fuente de verdad. Reemplazamos los datos en UserManager sin Math.max.
    if (progressData) {
      UserManager.data.totalTests = progressData.total_tests_taken || 0;
      UserManager.data.totalCorrect = progressData.total_correct_answers || 0;
      UserManager.data.streak = progressData.current_streak || 0;
      UserManager.data.bestStreak = progressData.best_streak || 0;
      UserManager.data.lastActiveDate = progressData.last_test_date || null;
      UserManager.data.dailyQuestions = 0; // Se reinicia al iniciar sesión/refrescar
      UserManager.data.lastPermit = UserManager.data.lastPermit || null;
      UserManager.data.lastState = UserManager.data.lastState || null;
    } else {
      console.log('SyncManager: No existe registro en la nube. Creando progreso inicial...');
      await saveProgressToDB(UserManager.data);
    }

    if (favData) {
      UserManager.data.favorites = favData;
    }

    if (mistakeData) {
      UserManager.data.mistakes = mistakeData;
    }

    if (topicStatsData) {
      UserManager.data.topicStats = topicStatsData;
    }

    if (testScoresData) {
      UserManager.data.testScores = testScoresData;
    }

    // Guardar en caché local e hidratar UI
    localStorage.setItem('ay_progress', JSON.stringify(UserManager.data));
    UserManager.updateUI();
    console.log('SyncManager: Sincronización e hidratación completada con éxito.');
  } catch (e) {
    console.warn('SyncManager: error sincronizando desde DB', e);
  }
}

// ─── MIGRAR LOCALSTORAGE → SUPABASE (UNA SOLA VEZ) ─────────
export async function migrateLocalDataToDB() {
  const user = window.currentUser?.();
  if (!user) return { success: false, reason: 'no_user' };

  try {
    const raw = localStorage.getItem('ay_progress');
    if (!raw) return { success: false, reason: 'no_local_data' };
    const local = JSON.parse(raw);

    const [dbProgress, dbFavs, dbMistakes, dbTopicStats] = await Promise.all([
      loadProgressFromDB(),
      loadFavoritesFromDB(),
      loadMistakesFromDB(),
      loadTopicStatsFromDB()
    ]);

    // Combinar acumulativos usando Math.max solo durante la migración única
    const mergedProgress = {
      totalTests: Math.max(local.totalTests || 0, dbProgress?.total_tests_taken || 0),
      totalCorrect: Math.max(local.totalCorrect || 0, dbProgress?.total_correct_answers || 0),
      streak: Math.max(local.streak || 0, dbProgress?.current_streak || 0),
      bestStreak: Math.max(local.bestStreak || local.streak || 0, dbProgress?.best_streak || 0),
      lastActiveDate: local.lastActiveDate || dbProgress?.last_test_date || null,
    };

    const localFavs = Array.isArray(local.favorites) ? local.favorites : [];
    const dbFavsList = Array.isArray(dbFavs) ? dbFavs : [];
    const allFavs = [...new Set([...localFavs, ...dbFavsList])].filter(id => typeof id === 'string' && id.trim() !== '');

    const localMistakes = Array.isArray(local.mistakes) ? local.mistakes : [];
    const dbMistakesList = Array.isArray(dbMistakes) ? dbMistakes : [];
    const allMistakes = [...new Set([...localMistakes, ...dbMistakesList])].filter(id => typeof id === 'string' && id.trim() !== '');

    const mergedTopicStats = { ...(dbTopicStats || {}) };
    if (local.topicStats && typeof local.topicStats === 'object') {
      Object.keys(local.topicStats).forEach(permitId => {
        const localPermitStats = local.topicStats[permitId];
        if (localPermitStats && typeof localPermitStats === 'object') {
          if (!mergedTopicStats[permitId]) mergedTopicStats[permitId] = {};
          Object.keys(localPermitStats).forEach(topicId => {
            const localVal = localPermitStats[topicId];
            const dbVal = mergedTopicStats[permitId]?.[topicId];
            if (localVal && typeof localVal === 'object') {
              mergedTopicStats[permitId][topicId] = {
                correct: Math.max(Number(localVal.correct) || 0, Number(dbVal?.correct) || 0),
                total: Math.max(Number(localVal.total) || 0, Number(dbVal?.total) || 0)
              };
            }
          });
        }
      });
    }

    // Upserts masivos
    // A. Progreso general
    const payload = {
      user_id: user.id,
      total_tests_taken: mergedProgress.totalTests,
      total_questions_answered: mergedProgress.totalCorrect + allMistakes.length,
      total_correct_answers: mergedProgress.totalCorrect,
      current_streak: mergedProgress.streak,
      best_streak: mergedProgress.bestStreak,
      last_test_date: mergedProgress.lastActiveDate,
      updated_at: new Date().toISOString()
    };
    const { error: progErr } = await supabase
      .from('user_progress')
      .upsert(payload, { onConflict: 'user_id' });
    if (progErr) {
      logSupabaseError('upsert', 'user_progress', progErr);
      throw progErr;
    }

    // B. Favoritos
    if (allFavs.length > 0) {
      const favRows = allFavs.map(qId => ({ user_id: user.id, question_id: qId }));
      const { error: favErr } = await supabase
        .from('favorites')
        .upsert(favRows, { onConflict: 'user_id,question_id' });
      if (favErr) {
        logSupabaseError('upsert', 'favorites', favErr);
        throw favErr;
      }
    }

    // C. Errores
    if (allMistakes.length > 0) {
      const mistakeRows = allMistakes.map(qId => ({
        user_id: user.id,
        question_id: qId,
        times_wrong: 1,
        times_correct: 0,
        last_wrong_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      const { error: mistErr } = await supabase
        .from('mistakes')
        .upsert(mistakeRows, { onConflict: 'user_id,question_id' });
      if (mistErr) {
        logSupabaseError('upsert', 'mistakes', mistErr);
        throw mistErr;
      }
    }

    // D. Topic Stats
    await saveTopicStatsBulkToDB(mergedTopicStats);

    // Actualizar UserManager local
    UserManager.data.totalTests = mergedProgress.totalTests;
    UserManager.data.totalCorrect = mergedProgress.totalCorrect;
    UserManager.data.streak = mergedProgress.streak;
    UserManager.data.bestStreak = mergedProgress.bestStreak;
    UserManager.data.lastActiveDate = mergedProgress.lastActiveDate;
    UserManager.data.favorites = allFavs;
    UserManager.data.mistakes = allMistakes;
    UserManager.data.topicStats = mergedTopicStats;

    localStorage.setItem('ay_progress', JSON.stringify(UserManager.data));
    UserManager.updateUI();

    console.log('SyncManager: Migración de datos locales completada.');
    return { success: true };
  } catch (e) {
    console.error('SyncManager: error en migración', e);
    return { success: false, reason: e.message };
  }
}

// ─── EXPONER AL SCOPE GLOBAL ──────────────────────────────
window.SyncManager = {
  loadProgressFromDB,
  saveProgressToDB,
  addFavoriteToDB,
  removeFavoriteFromDB,
  loadFavoritesFromDB,
  loadMistakesFromDB,
  recordMistakeToDB,
  recordMistakesBulkToDB,
  saveTopicStatsBulkToDB,
  loadTopicStatsFromDB,
  loadTestHistoryFromDB,
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
