-- ============================================================
-- APROBADOS YA — Esquema de Base de Datos Supabase
-- Ejecutar este script en: Supabase > SQL Editor > New query
-- ============================================================

-- ─── 1. PERFILES DE USUARIO ─────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  name          TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'admin'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ─── 2. PROGRESO DEL USUARIO ────────────────────────────────
CREATE TABLE IF NOT EXISTS user_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tests_completed   INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_answers   INTEGER NOT NULL DEFAULT 0,
  wrong_answers     INTEGER NOT NULL DEFAULT 0,
  streak            INTEGER NOT NULL DEFAULT 0,
  last_active_date  DATE,
  daily_goal        INTEGER NOT NULL DEFAULT 30,
  daily_questions   INTEGER NOT NULL DEFAULT 0,
  last_permit       TEXT,
  last_state        JSONB,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);


-- ─── 3. FAVORITOS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id  TEXT NOT NULL,             -- ID de la pregunta (ej: 'DGT-B-1-P01')
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id)             -- Sin duplicados
);


-- ─── 4. ERRORES DEL USUARIO ─────────────────────────────────
CREATE TABLE IF NOT EXISTS mistakes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id    TEXT NOT NULL,
  times_wrong    INTEGER NOT NULL DEFAULT 1,
  times_correct  INTEGER NOT NULL DEFAULT 0,
  last_wrong_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);


-- ─── 5. HISTORIAL DE TESTS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS test_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  test_id      TEXT NOT NULL,             -- ej: 'DGT-B-1' o 'AY-B-senales-3'
  permit_id    TEXT NOT NULL,             -- ej: 'B', 'A1A2'
  topic_id     TEXT,
  score        NUMERIC(5,2),              -- Porcentaje 0-100
  correct      INTEGER NOT NULL DEFAULT 0,
  wrong        INTEGER NOT NULL DEFAULT 0,
  total        INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── 6. ESTADÍSTICAS POR TEMA ───────────────────────────────
CREATE TABLE IF NOT EXISTS topic_stats (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permit_id  TEXT NOT NULL,
  topic_id   TEXT NOT NULL,
  correct    INTEGER NOT NULL DEFAULT 0,
  total      INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, permit_id, topic_id)
);


-- ─── 7. SUSCRIPCIONES (STRIPE) ──────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT UNIQUE,
  status                  TEXT NOT NULL DEFAULT 'inactive',  -- active | inactive | canceled | past_due
  plan                    TEXT NOT NULL DEFAULT 'free',       -- free | monthly | annual
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Trigger: crear entrada de suscripción vacía al crear perfil
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_progress (user_id) VALUES (NEW.id);
  INSERT INTO public.subscriptions (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- CRÍTICO: Cada usuario solo puede ver/modificar SUS propios datos
-- ============================================================

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE mistakes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_stats   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;


-- ── PROFILES ────────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins pueden ver todos los perfiles (para panel admin)
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ── USER_PROGRESS ────────────────────────────────────────────
CREATE POLICY "progress_select_own" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "progress_insert_own" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "progress_update_own" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);


-- ── FAVORITES ────────────────────────────────────────────────
CREATE POLICY "favorites_select_own" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_own" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_own" ON favorites
  FOR DELETE USING (auth.uid() = user_id);


-- ── MISTAKES ─────────────────────────────────────────────────
CREATE POLICY "mistakes_select_own" ON mistakes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mistakes_insert_own" ON mistakes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mistakes_update_own" ON mistakes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "mistakes_delete_own" ON mistakes
  FOR DELETE USING (auth.uid() = user_id);


-- ── TEST_HISTORY ─────────────────────────────────────────────
CREATE POLICY "history_select_own" ON test_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "history_insert_own" ON test_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ── TOPIC_STATS ──────────────────────────────────────────────
CREATE POLICY "topic_stats_select_own" ON topic_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "topic_stats_insert_own" ON topic_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "topic_stats_update_own" ON topic_stats
  FOR UPDATE USING (auth.uid() = user_id);


-- ── SUBSCRIPTIONS ────────────────────────────────────────────
-- Los usuarios solo ven SU suscripción. El backend (webhook Stripe)
-- usa service_role key (que ignora RLS) para actualizar el estado.
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);


-- ============================================================
-- FIN DEL ESQUEMA
-- ============================================================
-- Después de ejecutar esto, verifica en Table Editor que existen:
--   profiles, user_progress, favorites, mistakes,
--   test_history, topic_stats, subscriptions
-- ============================================================
