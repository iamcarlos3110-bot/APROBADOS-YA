# Aprobados Ya — Walkthrough de Cambios

## Commit: 3639ca7 — Auditoría y Reparación (Fases 2-7)
**Fecha:** 2026-08-11

---

### FASE 2 — Backup
- Rama de seguridad creada: `backup/pre-auditoria-2026-08-11`
- Estado anterior preservado en GitHub para rollback inmediato.

---

### FASE 3 — Auth + Premium Seguro (`auth.js`)

**Cambios críticos:**

| Antes | Ahora |
|---|---|
| `isPremium` = `user_metadata.is_premium` (JWT local) | `isPremium()` = función async que consulta tabla `subscriptions` en Supabase |
| El paywall podía ser engañado desde DevTools | El paywall consulta la BD real en cada intento |
| No había recuperación de contraseña completa | Formulario de nueva contraseña funcional con `updatePassword()` |
| El perfil no mostraba fecha de renovación | Muestra `current_period_end` de Supabase |
| Sin botón "Gestionar suscripción" | Botón que abre Stripe Customer Portal |

**Nueva función central `isPremium()`:**
- Consulta tabla `subscriptions` con `status = 'active'` y `current_period_end > NOW()`
- Caché de 60 segundos para no sobrecargar la BD
- Se invalida al cerrar/iniciar sesión
- Expuesta como `window.isPremium` para uso en `app_v2.js`

**Exposición del cliente Supabase:**
- `window._authModule = { supabase }` permite al `SyncManager` (en `app_v2.js`) usar el mismo cliente autenticado sin reimportar

---

### FASE 4 — Supabase + RLS (`supabase_rls_security.sql`)

> ⚠️ **REQUIERE EJECUCIÓN MANUAL** en Supabase > SQL Editor

**Nuevas políticas:**
- `subscriptions`: Usuario solo puede hacer `SELECT`. El backend (webhook) con `service_role` es el único que puede escribir.
- `profiles.UPDATE`: El usuario no puede cambiar su propio `role` (campo protegido por `WITH CHECK`).
- Función RPC `is_premium()` disponible para llamadas desde frontend como doble validación.
- Función RPC `is_admin()` para verificar rol de admin desde frontend.

---

### FASE 5 — SyncManager completo (`app_v2.js`)

**Implementado el `SyncManager` con merge no destructivo:**

| Función | Comportamiento |
|---|---|
| `syncFromDB()` | Al login: Lee Supabase, fusiona con local tomando el mayor valor |
| `migrateLocalDataToDB()` | Migra localStorage → Supabase sin duplicar |
| `saveProgressToDB()` | Guarda progreso general tras cada test |
| `saveTestResultToDB()` | Inserta historial de test (nunca duplica) |
| `recordMistakeToDB()` | Upsert de errores por question_id |
| `syncFavorite()` | Añadir/quitar favorito en la BD en tiempo real |

**Estrategia de merge:**
- Estadísticas (totalTests, totalCorrect, streak): **Max(local, cloud)**
- Mistakes: **Set por question_id** (sin duplicados), considerando times_wrong vs times_correct
- Favoritos: **Union de Sets** por question_id
- Banner de migración: no se muestra de nuevo si `ay_sync_done = 'true'` en localStorage

---

### FASE 6 — Freemium corregido (`app_v2.js`)

**Flujo exacto implementado:**

```
Sin cuenta → Test 1: ✅ Libre
Sin cuenta → Test 2+: Modal "Crea tu cuenta" (no paywall de pago)

FREE registrado → Test 1: ✅ Libre
FREE registrado → Test 2+: Modal "Hazte Premium" (paywall real)

PREMIUM → Todos los tests: ✅ Libres
```

**`startTest()` ahora es `async`** — espera respuesta real de Supabase antes de bloquear o permitir. No hay forma de saltárselo modificando localStorage.

---

### FASE 7 — Stripe mejorado

**`api/create-checkout.js`:**
- Lee `stripe_customer_id` de Supabase antes de crear la sesión
- Si ya existe, lo reutiliza (evita clientes duplicados en Stripe)

**`api/stripe-webhook.js`:**
- Maneja todos los eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `customer.subscription.created`
- `invoice.payment_failed`: marca como `past_due` sin quitar acceso inmediatamente (Stripe reintentará)
- Usa helper `findUserBySubscription()` para encontrar usuarios por `subscription_id` o `customer_id`
- `user_metadata.is_premium` se actualiza como dato de compatibilidad visual, NO como fuente de verdad

**`api/customer-portal.js` (NUEVO):**
- Abre Stripe Customer Portal para gestionar suscripción, pagos y cancelación
- Requiere `stripe_customer_id` existente en Supabase

---

### Archivos modificados

| Archivo | Tipo | Razón |
|---|---|---|
| `auth.js` | Modificado | `isPremium()` real, recuperación contraseña, perfil mejorado, Customer Portal |
| `app_v2.js` | Modificado | SyncManager completo, freemium async seguro, fix imágenes Memorizar |
| `api/create-checkout.js` | Modificado | Reutilización de stripe_customer_id |
| `api/stripe-webhook.js` | Modificado | Todos los eventos, pago fallido, helper búsqueda de usuario |
| `api/customer-portal.js` | **NUEVO** | Stripe Customer Portal endpoint |
| `.env.example` | Modificado | Separación clara público/secreto |
| `supabase_rls_security.sql` | **NUEVO** | Políticas RLS adicionales para producción |

---

## ⚠️ Tareas manuales pendientes (requieren acción del usuario)

1. **Ejecutar `supabase_rls_security.sql`** en Supabase > SQL Editor
2. **Verificar variables de entorno en Vercel:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
3. **Configurar Stripe Customer Portal** en Stripe Dashboard > Billing > Customer Portal (activar la función y configurar las opciones permitidas)
4. **Actualizar Stripe Webhook** para incluir los nuevos eventos: `invoice.payment_failed`, `customer.subscription.created`
5. **Dominio:** Proporcionar el dominio real para configurar DNS y URLs de Supabase Auth

---

## Estado actual

| Sistema | Estado |
|---|---|
| Auth (Registro/Login/Logout) | ✅ Funcional |
| Recuperación de contraseña | ✅ Implementado |
| Premium validado en BD | ✅ Implementado |
| SyncManager | ✅ Implementado |
| Freemium correcto | ✅ Implementado |
| Stripe Checkout | ✅ Funcional (con mejoras) |
| Stripe Webhook completo | ✅ Implementado |
| Customer Portal | ✅ Implementado (requiere configuración en Stripe) |
| RLS Supabase | ⚠️ Requiere ejecutar SQL manualmente |
| Admin Panel | 🔲 Pendiente (Fase 9) |
| Dominio y DNS | ⚠️ Requiere información del usuario |
| SEO | 🔲 Pendiente (Fase 10) |
