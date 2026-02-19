haz# Auditoría try-catch — Kamples

> **Fecha:** 19/02/2026  
> **Agente:** AG-SEC  
> **Objetivo:** Identificar y corregir operaciones que pueden fallar silenciosamente por falta de try-catch.

---

## Resumen Ejecutivo

| Ámbito | Hallazgos | Corregidos |
|--------|-----------|------------|
| Hooks React (App/React/hooks/) | 22 funciones async sin try-catch | ✅ |
| Islands React (App/React/islands/) | 18 funciones async sin try-catch | ✅ |
| Componentes React | 8 funciones async sin try-catch | ✅ |
| Stores React | 1 función async sin try-catch | ✅ |
| Servicios React (tema.ts) | 2 localStorage sin try-catch | ✅ |
| Mezclador (motorAudioService.ts) | 3 operaciones Web Audio sin try-catch | ✅ |
| PHP (App/Kamples/) — exec/shell_exec | 12+ llamadas sin try-catch | ✅ |
| PHP — StripeService cURL | 1 bloque sin try-catch | ✅ |
| PHP — @unlink / @file ops prohibidos | 6 usos de @ supresor | ✅ |
| **Total** | **~73 hallazgos** | **✅ todos** |

---

## Hallazgos Detallados — TypeScript/React

### CRÍTICO — Hooks sin try-catch (causa spinner infinito o crash)

| Archivo | Función | Riesgo |
|---------|---------|--------|
| useAdminPanel.ts | cargar (Promise.all KPIs+actividad) | spinner infinito |
| useAdminPanel.ts | cargarUsuarios | error silencioso |
| useAdminPanel.ts | cargarModeracion | error silencioso |
| useAdminPanel.ts | actualizarUsuario | falla sin feedback |
| useAdminPanel.ts | moderar | falla sin feedback |
| useFiltroIds.ts | 3 useEffects con loops paginados | estado inconsistente |
| useHistorialIds.ts | loop paginado | estado inconsistente |
| useDescargas.ts | recargarLimites | error silencioso |
| useDescargasPagina.ts | proveedorSugerencias | error propagado |
| useDescargasPagina.ts | manejarLike | UI optimista sin rollback |
| useFavoritosPagina.ts | proveedorSugerencias | error propagado |
| useFavoritosPagina.ts | manejarLike | UI optimista sin rollback |
| useExploradorPagina.ts | manejarLike | UI optimista sin rollback |
| useMenuContextualSample.ts | descargar onClick | error silencioso |

### CRÍTICO — Islands sin try-catch

| Archivo | Función | Riesgo |
|---------|---------|--------|
| Múltiples islands | Patrón manejarLike repetido en ~12 islands | UI optimista sin rollback ante excepción de red |
| DashboardCreadorIsland.tsx | Promise.all 5 endpoints | spinner infinito |
| NotificacionesIsland.tsx | cargar, marcarLeida, marcarTodas | error silencioso |
| ChatIsland.tsx | cargar, enviar, archivo | mensaje perdido |
| MensajesIsland.tsx | .then() sin .catch() | unhandled rejection |

### ALTO — Componentes/Stores sin try-catch

| Archivo | Función | Riesgo |
|---------|---------|--------|
| BotonLike.tsx | 3 funciones (clickDirecto, reaccion, quitar) | excepción de red no capturada, setCargando(false) no se ejecuta |
| BotonFollow.tsx | manejarClick | excepción de red = setCargando(false) perdido |
| ChatFlotante.tsx | cargar, enviar, archivo | mensaje perdido |
| TopBar.tsx | cargar créditos (useEffect) | error silencioso |
| LandingPublica.tsx | cargar trending | error silencioso |
| FilaColecciones.tsx | cargar colecciones | error silencioso |
| sugerenciasLikeStore.ts | mostrar | cargando: true permanente |

### MEDIO — Servicios

| Archivo | Función | Riesgo |
|---------|---------|--------|
| tema.ts | guardarTemaApp / obtenerTemaGuardado | QuotaExceededError en modo privado |

---

## Hallazgos Detallados — Mezclador

| Archivo | Función | Riesgo |
|---------|---------|--------|
| motorAudioService.ts | iniciar() — new AudioContext | crash si límite de contextos |
| motorAudioService.ts | decodificarBufferLocal() | crash con audio corrupto |
| motorAudioService.ts | crearContextoOffline() — new OfflineAudioContext | crash con duración 0 |

---

## Hallazgos Detallados — PHP

### exec/shell_exec sin try-catch

| Archivo | Método | Operación |
|---------|--------|-----------|
| ProcesadorFFmpeg.php | calcularDuracion | shell_exec FFprobe |
| ProcesadorFFmpeg.php | generarWaveformPeaks | exec + file_get_contents + file_put_contents |
| ProcesadorFFmpeg.php | convertirAMp3 | exec FFmpeg |
| ProcesadorFFmpeg.php | generarPreview | exec FFmpeg |
| DetectorBpm.php | detectar | exec + file_get_contents |
| DetectorTonalidad.php | detectar | exec + file_get_contents |
| DeduplicadorAudio.php | calcularHash | 3x exec + file_get_contents + @unlink |
| PipelineAudio.php | procesar | exec MP3 temporal |

### @unlink (supresor prohibido por protocolo)

| Archivo | Líneas |
|---------|--------|
| ProcesadorFFmpeg.php | L75, L81 |
| DetectorBpm.php | L60, L65 |
| DetectorTonalidad.php | L85, L90 |
| DeduplicadorAudio.php | L148, L156, L170 |

### cURL sin try-catch-finally

| Archivo | Método | Operación |
|---------|--------|-----------|
| StripeService.php | request | curl_exec sin try-catch + SSL no explícito |
| GroqHttpClient.php | peticionCurl | curl_exec sin try-catch-finally |
| GroqHttpClient.php | peticionCurlMultipart | curl_exec sin try-catch-finally |

### Otros PHP

| Archivo | Método | Operación |
|---------|--------|-----------|
| ComentariosInteraccionController.php | convertirAudioComentario | exec sin try-catch |
| ComentariosInteraccionController.php | generarWaveformComentario | exec + @unlink |
| ComentariosInteraccionController.php | obtenerFFmpegBin | shell_exec sin try-catch |
| FFmpegDetector.php | buscarBinario | shell_exec sin try-catch |

---

## Lecciones Aprendidas

- [try-catch]: El patrón `await api(); if (!resp.ok)` NO captura excepciones de red (TypeError, AbortError). SIEMPRE envolver en try-catch.
- [UI optimista]: Sin try-catch, la UI queda desincronizada si la red falla con excepción (no solo con resp.ok=false).
- [Promise.all]: Si cualquier promise rechaza, TODAS se pierden. try-catch obligatorio.
- [localStorage]: Puede lanzar QuotaExceededError o SecurityError en modo privado/restrictivo.
- [AudioContext]: `new AudioContext()` puede fallar si se excede el límite del navegador (6-8 contextos).
- [PHP @unlink]: Protocolo prohíbe usar `@` como supresor. Usar try-catch con logging explícito.
- [PHP curl]: Patrón correcto: `$ch = null; try { $ch = curl_init(); if (!$ch) throw ... } catch { log } finally { if ($ch) curl_close($ch); }`.
- [PHP SSL]: Siempre setear CURLOPT_SSL_VERIFYPEER=true y CURLOPT_SSL_VERIFYHOST=2 explícitamente.
- [spinner infinito]: Si setCargando(true) está antes del await y el catch no ejecuta setCargando(false), el spinner queda permanente.
- [BotonLike/Follow]: Rollback por `resp.ok` es correcto pero no cubre excepciones de red. try-catch necesario para setCargando(false) y rollback.
- [Chat optimista]: Mensajes optimistas sin try-catch dejan mensajes fantasma si la red falla.
- [MensajesIsland]: `marcarConversacionLeida` puede fallar pero no debe bloquear la navegación. try-catch sin rethrow.
