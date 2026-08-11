-- ============================================================
-- APROBADOS YA — Políticas RLS adicionales de seguridad
-- Ejecutar en: Supabase > SQL Editor > New query
-- IMPORTANTE: Ejecutar DESPUÉS del supabase_schema.sql original
-- ============================================================

-- ── 1. SUBSCRIPTIONS: Bloquear cualquier escritura por parte del usuario ───
-- El usuario puede VER su suscripción (SELECT), pero NO puede modificarla
-- Solo el webhook del servidor (service_role key) puede actualizar esto.

-- Eliminar políticas de escritura si existieran accidentalmente
DROP POLICY IF EXISTS "subscriptions_insert_own" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_own" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_own" ON subscriptions;

-- Solo SELECT: el usuario ve su propia suscripción
-- (ya existe en el schema original, pero la reforzamos)
DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Confirmar que el RLS está habilitado
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;


-- ── 2. PROFILES: Bloquear cambio de role por el usuario ────────────────────
-- El usuario puede actualizar su propio perfil (nombre, avatar),
-- pero NO puede cambiar su propio rol a 'admin'.

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid()) -- No puede cambiar el rol
  );

-- Política de admin: pueden ver todos los perfiles (para panel admin)
-- Esta política es segura porque el rol 'admin' solo puede ser asignado
-- por el service_role key (backend), no por el propio usuario.
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (
    auth.uid() = id  -- ver el propio
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ── 3. USER_PROGRESS: Solo su propio registro ──────────────────────────────
-- Ya existe del schema original, confirmamos que está habilitado
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;


-- ── 4. FAVORITES: Ya protegidos, confirmamos ───────────────────────────────
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;


-- ── 5. MISTAKES: Ya protegidos, confirmamos ────────────────────────────────
ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;


-- ── 6. TEST_HISTORY: Ya protegidos, confirmamos ────────────────────────────
ALTER TABLE test_history ENABLE ROW LEVEL SECURITY;


-- ── 7. TOPIC_STATS: Ya protegidos, confirmamos ─────────────────────────────
ALTER TABLE topic_stats ENABLE ROW LEVEL SECURITY;


-- ── 8. FUNCIÓN RPC: Verificar si el usuario actual es Premium ──────────────
-- Esta función se puede llamar desde el frontend para doble validación
-- auth.uid() se resuelve automáticamente en el contexto de la sesión
CREATE OR REPLACE FUNCTION is_premium()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND current_period_end > NOW()
  );
$$;

-- Exponer la función al rol authenticated
GRANT EXECUTE ON FUNCTION is_premium() TO authenticated;


-- ── 9. FUNCIÓN RPC: Verificar si el usuario actual es Admin ────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;


-- ============================================================
-- VERIFICACIÓN
-- Después de ejecutar esto, comprueba:
-- 1. En Table Editor > subscriptions > Policies: solo SELECT para authenticated
-- 2. En Table Editor > profiles > Policies: UPDATE no permite cambiar role
-- 3. Intenta desde un cliente autenticado hacer:
--    UPDATE subscriptions SET status='active' WHERE user_id='...'
--    → debe dar error de RLS
-- ============================================================
