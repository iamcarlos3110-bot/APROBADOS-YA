# Aprobados Ya — Walkthrough de Cambios

## Commit: PWA — Aplicación Instalable (Fase 10)
**Fecha:** 2026-08-11

---

### FASE 10 — Progressive Web App (PWA)

Se ha convertido el proyecto web en una aplicación instalable de grado nativo. Los usuarios podrán instalar "Aprobados Ya" en iOS y Android directamente desde el navegador, ganando presencia en la pantalla de inicio y ocultando la barra del navegador (`standalone`).

**Archivos creados:**
1. `manifest.json`: Configuración principal de la PWA (color verde oliva `#5C6B1A`, display `standalone`).
2. `sw.js` (Service Worker): Motor responsable del acceso offline.
   - Cachea recursos estáticos (`index.html`, CSS, JS, imágenes).
   - Bloquea explícitamente llamadas a Supabase, Stripe y la API (protege la seguridad y evita cachear datos obsoletos).
   - En caso de pérdida de conexión, muestra un banner de "Sin conexión a Internet" integrado en la UI (no lanza errores técnicos).
3. `generate_icons.py` (script temporal): Generó automáticamente los iconos necesarios (192x192, 512x512 y Apple Touch Icon) a partir del logo oficial.

**Archivos modificados:**
1. `index.html`:
   - Añadidas etiquetas `meta` de PWA y soporte específico para iOS (`apple-mobile-web-app-capable`, `apple-touch-icon`).
   - Insertada estructura HTML oculta para 3 banners: Instalación PWA, Modo Offline, y Actualización disponible.
   - Datos estructurados JSON-LD integrados para SEO (Organización Educativa).
2. `style_v2.css`:
   - Añadidos estilos CSS fluidos y de tipo "toast" (flotantes) para los 3 nuevos banners.
3. `app_v2.js`:
   - Registro del Service Worker al cargar la página.
   - Listener del evento `beforeinstallprompt` (captura el intento nativo del navegador de instalar la PWA y lo sustituye por un banner elegante).
   - Listeners `online` y `offline` (muestran/ocultan el banner de aviso instantáneamente).
   - Listener de actualizaciones de Service Worker (avisa si hay una nueva versión y permite recargar sin atascar al usuario en caché).

**Seguridad PWA:**
El Service Worker está configurado estrictamente para ignorar URLs como `supabase.co` o `/api/`. Esto asegura que el flujo de autenticación, el pago en Stripe, y la recuperación de contraseña funcionen siempre llamando directamente al servidor, nunca usando una versión cacheada.

**Comprobaciones requeridas:**
Al entrar desde un móvil Android (Chrome) o PC, el navegador debería mostrar el aviso "Instala Aprobados Ya". En iPhone (Safari), el usuario puede usar la opción "Compartir > Añadir a la pantalla de inicio", momento en el cual se activará el `apple-touch-icon`.

---

## Commit: 3639ca7 — Auditoría y Reparación (Fases 2-7)
*(Documentación anterior mantenida en el historial del repositorio)*
