# Auditoría de Sincronización Desktop — Seguridad, Optimización y Escalabilidad

**Fecha:** 2026-03-14 | **Versión:** 1.0 | **Alcance:** desktop/src/services/sync*, App/React/hooks/usePanelSincronizacion

## 1. Arquitectura Actual

### Ventanas y Responsabilidades

| Ventana | Label | Responsabilidad Sync |
|---------|-------|----|
| Main | `main` | Ejecuta watcher, upload queue, polling, sync completo |
| Sync Panel | `sync-panel` | Solo lectura: historial, colecciones, diagnóstico |
| Config | `config-sync` | Configuración de carpeta y preferencias |

### Flujo de Datos

```
[Tauri Store: auth.json] ─── token JWT ───→ [fetch interceptor]
                                                    │
[syncTrackingService] ← persiste tracking ←─ [syncWatcherSetup]
         │                                          │
         ├── historialSamples                  filesystem watcher
         ├── colecciones                            │
         └── estadoSync                     [uploadQueueService]
                                                    │
                                            API: /sync/check → download
                                            API: /sync/upload → upload
```

### Comunicación Cross-Window

- **Auth:** Tauri Store (`auth.json`) compartido. Evento `auth-cambiada` propaga login/logout entre ventanas.
- **Sync Data:** `window.__KAMPLES_SYNC__` expone funciones del syncService. Cada ventana tiene su propia instancia en memoria.
- **Stores Zustand:** Per-window (no compartidos). Cada ventana tiene su propio `syncStore`.

## 2. Hallazgos de Seguridad

### 2.1. Token JWT en Headers (OK)

- Token se inyecta via `Authorization: Bearer {jwt}` en el fetch interceptor.
- Fallback `X-Kamples-Auth` para entornos donde el proxy strip Authorization.
- Solo se envía en peticiones a `/wp-json/` (no en requests a CDN u otros dominios).

### 2.2. Token Expiry y Auto-Logout (MEJORADO - QK16)

- **401 detectado** en el fetch interceptor → `manejarSesionExpirada()`.
- Guard de concurrencia (`manejando401`) evita múltiples logouts simultáneos.
- **MEJORADO (QK36):** Evento `auth-cambiada` propaga logout a todas las ventanas.

### 2.3. Almacenamiento Seguro (OK)

- Tauri Store Plugin cifra `auth.json` en disco (cifrado por defecto de Tauri).
- Las credenciales nunca se exponen en `localStorage` ni `sessionStorage`.

### 2.4. CORS para Audio Estático (MEJORADO - QK34)

- Archivos MP3 en `/wp-content/uploads/` ahora tienen headers CORS para `localhost:*` y `tauri://localhost`.
- Whitelist con `SetEnvIf Origin` — no wildcard.

### 2.5. Riesgos Identificados

| Riesgo | Severidad | Estado | Mitigación |
|--------|-----------|--------|------------|
| Token JWT sin refresh automático | Media | Pendiente | Duración 30 días. Si expira, auto-logout vía 401 handler. TO-DO: implementar refresh token antes de expiración. |
| Upload sin validación de tipo MIME en cliente | Baja | Diseño | El servidor valida tipo MIME + magic bytes. El cliente confía en el servidor. |
| Sync watcher puede leer archivos fuera de carpeta sync | Baja | Mitigado | `syncWatcherSetup` solo observa la carpeta configurada. No hay path traversal posible. |
| `syncTrackingService` no cifra datos locales | Baja | Aceptado | El tracking contiene metadata (nombres, estados), no contenido audio. Riesgo bajo. |

## 3. Optimización para Escala

### 3.1. Polling y Bandwidth

- **Sync check:** `/sync/check` se ejecuta cada N minutos (configurable). Envía solo IDs/hashes para comparar.
- **Batch operations:** Downloads y uploads se hacen en lotes, no uno por uno.
- **Upload queue:** Cola con retry automático y backoff exponencial.

### 3.2. Problemas de Escala Identificados

| Problema | Impacto | Solución Propuesta |
|----------|---------|-------------------|
| `historialSamples` crece sin límite | Memoria en ventana sync | Limitar a últimos 500 entries. Implementar paginación. |
| `rehidratarImagenesPendientesSync()` re-procesa todo | CPU al abrir panel | Cache de imágenes resueltas. Solo procesar entries nuevas. |
| `sincronizarConServidor()` compara todo el catálogo | Red en catálogos grandes | Implementar delta sync: servidor envía solo cambios desde última sync (timestamp). |
| Watcher de filesystem genera eventos por cada archivo | CPU con muchos archivos | Debounce agrupado: acumular cambios 2s antes de procesar. |

### 3.3. Recomendaciones de Optimización (Prioridad)

1. **Delta sync (Alta):** Cambiar `/sync/check` para que acepte `since=timestamp`. El servidor retorna solo samples modificados después de esa fecha. Reduce payload de O(n) a O(delta).

2. **Historial paginado (Media):** Limitar `obtenerHistorialSamplesSync()` a 100 entries por página. El panel muestra la primera página y carga más bajo demanda.

3. **Upload concurrente (Media):** Actualmente uploads son secuenciales. Permitir 2-3 uploads simultáneos con semáforo para maximizar throughput sin saturar.

4. **Cache de portadas (Baja):** Las portadas se re-resuelven en cada render del historial. Cachear `sampleId → portadaUrl` con TTL 5min.

## 4. Bugs Encontrados y Fixes Aplicados (QK36)

### 4.1. Auth No Se Sincroniza Cross-Window (CORREGIDO)

**Síntoma:** Login en main window → sync window sigue sin auth. Después de restart, auth inconsistente.

**Root Cause:** Cada ventana Tauri tiene su propio JS context. `guardarToken()` en main actualiza `auth.json` y el fetch interceptor local, pero la sync window no se entera.

**Fix:** Sistema de eventos Tauri (`auth-cambiada`):
- `guardarToken()` emite `{ tipo: 'login' }` después de guardar.
- `cerrarSesionDesktop()` emite `{ tipo: 'logout' }` después de limpiar.
- `escucharCambiosAuth()` registra listener en cada ventana. Al recibir evento, re-lee `auth.json` y actualiza fetch interceptor + authStore + GLORY_CONTEXT.
- Guard `procesandoEventoAuth` previene re-entrancia.
- Guard `token !== tokenEnMemoria` previene self-processing (la ventana emisora ya actualizó su estado localmente).

**Archivos:** `authDesktopService.ts` (+60 líneas), `desktopService.ts` (+2 líneas), `sync.tsx` (+2 líneas).

### 4.2. Pantalla de Inicio en Sync Panel (DIAGNOSTICADO)

**Síntoma:** Sync panel muestra contenido vacío que el usuario interpreta como "página de inicio".

**Root Cause:** Si no hay auth al abrir el panel, las API calls fallan silenciosamente. El panel muestra "Sin actividad reciente" con nombre "Usuario" — parece una pantalla de bienvenida.

**Fix:** Con el fix 4.1, cuando el usuario hace login en main, el panel sync recibe el evento y se actualiza automáticamente.

**TO-DO:** Agregar estado visual explícito "Inicia sesión para sincronizar" cuando no hay token.

### 4.3. Google Login en Desktop (YA CORREGIDO - QK16)

Resuelto en QK16: CSP actualizado + Google Client ID inyectado vía Vite define.

## 5. Checklist de Seguridad Sync

- [x] Token JWT nunca se envía a dominios externos (solo `/wp-json/`)
- [x] Auto-logout en 401 con guard de concurrencia
- [x] Credenciales en Tauri Store cifrado (no localStorage)
- [x] CORS whitelist para audio estático (solo localhost/tauri)
- [x] Upload con validación server-side (tipo MIME + magic bytes)
- [x] Sync watcher limitado a carpeta configurada (no path traversal)
- [x] Cross-window auth sync vía eventos Tauri
- [ ] TO-DO: Refresh token antes de expiración (actual: 30 días hardcoded)
- [ ] TO-DO: Rate limiting en upload queue (prevenir abuse si comprometen token)
- [ ] TO-DO: Verificación de integridad de archivos descargados (checksum)

## 6. Lecciones

- [Tauri events]: `emit()` de `@tauri-apps/api/event` envía a TODAS las ventanas, incluyendo la emisora. Usar guard de self-processing.
- [Auth cross-window]: Cada webview tiene su propio `window.fetch` y stores Zustand. No se comparten automáticamente.
- [Sync soloLectura]: La ventana sync inicializa con `{ soloLectura: true }` para evitar duplicar watchers/uploads. Solo la ventana main ejecuta sync activo.
- [mod_headers]: El contenedor Docker WP no tiene `mod_headers` habilitado por defecto. Necesario para CORS en archivos estáticos.
