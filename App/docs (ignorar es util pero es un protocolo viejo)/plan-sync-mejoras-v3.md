# Plan Sync Mejoras v3 — Auditoría de Seguridad

> **Version:** 3.0 | **Fecha:** 11/03/2026
> **Scope:** Seguridad del sistema sync. Proteccion de datos de usuario, validacion de archivos, control de acceso, prevencion de ataques.
> **Base:** Auditoria de SyncController, DescargasController/Stream, ColeccionesCrud, AuthMiddleware, SyncChangelogRepository, SyncRepository, ColeccionesRepository, uploadQueueService, syncGuards, principal.json (Tauri), JwtService.

---

## Resumen Ejecutivo

La seguridad base del sync es solida: JWT con firebase/php-jwt, HMAC-SHA256 en tokens de descarga, user_id filtrado en todas las queries, advisory locks para concurrencia, MIME validation server-side con magic bytes. Sin embargo, se identifican **2 hallazgos criticos**, **4 altos**, **4 medios** y **3 bajos** que deben corregirse para garantizar que datos confidenciales de usuarios no queden expuestos ni vulnerables.

### Estado de v2 (diferidos pendientes)

| Item v2 | Estado | Relevancia v3 |
|---------|--------|---------------|
| A3+A4 Service layer PHP | Pendiente | No bloquea seguridad, TO-DO en codigo |
| TM3 Migracion v1->v2 | Pendiente | Bajo riesgo seguridad |
| TM4 Hash post-descarga | Pendiente | **SEC-M3** en esta auditoria |
| TB1 TypedStore wrapper | Pendiente | No bloquea seguridad |
| TB3 DIP syncWatcherSetup | Pendiente | No bloquea seguridad |

---

## SECCION A — Hallazgos Criticos

### SEC-C1. INTERVAL interpolado en purgar() — SQL injection teorico

- **Archivo:** `SyncChangelogRepository.php` L271
- **Problema:** `"NOW() - INTERVAL '{$diasRetencion} days'"` — variable PHP interpolada en SQL. Aunque tiene whitelist de valores validos [30, 60, 90, 180, 365] (L265-268), la interpolacion viola defensa en profundidad. Si un caller futuro se salta la whitelist o se cambia el metodo, la inyeccion se abre.
- **Impacto:** SQL injection que permite DELETE arbitrario o extraccion de datos via error-based injection.
- **Severidad:** CRITICO (por patron, no por explotabilidad actual)
- **Solucion:**
  ```php
  /* Reemplazar interpolacion por MAKE_INTERVAL parametrizado */
  $sql = "DELETE FROM " . SyncChangelogCols::TABLA
      . " WHERE " . SyncChangelogCols::CREATED_AT
      . " < NOW() - MAKE_INTERVAL(days => :dias)";
  return static::ejecutar($sql, ['dias' => $diasRetencion]);
  ```
- **Esfuerzo:** Trivial (~5 min)

### SEC-C2. Fallback secret hardcodeado en DescargasStreamController

- **Archivo:** `DescargasStreamController.php` L25
- **Problema:** `defined('AUTH_SALT') ? AUTH_SALT : 'kamples-descarga-segura-2026'` — si AUTH_SALT no esta definido (ej: migration de wp-config, nuevo entorno), TODOS los tokens de descarga usan un secreto publico predecible. Cualquiera con acceso al codigo fuente puede generar tokens validos para CUALQUIER sample.
- **Impacto:** Acceso no autorizado a audio premium de cualquier usuario. Bypasa el sistema de creditos/pagos.
- **Severidad:** CRITICO
- **Solucion:**
  ```php
  public static function generarFirmaDescarga(int $sampleId, int $userId, int $expira): string
  {
      if (!\defined('AUTH_SALT') || AUTH_SALT === '') {
          KamplesLogger::critical('DescargasStream: AUTH_SALT no configurado — descargas deshabilitadas');
          throw new \RuntimeException('Configuracion de seguridad incompleta');
      }
      return \hash_hmac('sha256', "{$sampleId}:{$userId}:{$expira}", AUTH_SALT);
  }
  ```
- **Esfuerzo:** Trivial (~10 min)

---

## SECCION B — Hallazgos Altos

### SEC-A1. Tauri filesystem scope demasiado amplio

- **Archivo:** `desktop/src-tauri/capabilities/principal.json` L32
- **Problema:** `fs:scope-home-recursive` da acceso de lectura/escritura a TODO el directorio home del usuario (~, %USERPROFILE%). La app solo necesita acceso a la carpeta de sync (configurada por usuario, ej: ~/Kamples) y AppData.
- **Impacto:** Si la app tiene un bug de path traversal (o una dependencia comprometida), puede acceder a SSH keys, criptowallets, documentos privados, tokens de sesion de otros programas.
- **Severidad:** ALTO
- **Solucion:**
  ```json
  /* Reemplazar fs:scope-home-recursive por scopes especificos */
  /* Opcion A: Scope dinamico (requiere Tauri plugin) */
  "fs:scope-download-recursive",
  "fs:scope-appdata-recursive",
  "fs:scope-document-recursive"
  
  /* Opcion B: Scope custom via tauri.conf.json */
  /* El usuario selecciona carpeta sync via dialog:allow-open */
  /* Solo esa carpeta queda autorizada */
  ```
  **Nota:** Eliminar `fs:scope-home-recursive` puede romper funcionalidad si alguna ruta de sync apunta a subcarpetas del home que no estan cubiertas por document/download. Requiere testing.
- **Esfuerzo:** Bajo (~30 min) + testing manual

### SEC-A2. JWT sin rotacion ni revocacion — token robado = acceso 30 dias

- **Archivo:** `JwtService.php` L29 (exp: 30 dias), `syncGuards.ts` (almacenamiento en memoria)
- **Problema:** Token JWT valido por 30 dias, sin mecanismo de revocacion server-side. Si un token es robado (memory dump, Tauri debug, request logging), el atacante tiene acceso completo durante un mes.
- **Severidad:** ALTO
- **Subsistema afectado:** Todo el API (sync, descargas, colecciones, perfil)
- **Solucion progresiva:**
  - **Fase 1 (rapida):** Reducir expiracion a 7 dias. Agregar refresh endpoint.
  - **Fase 2 (robusta):** Access token 15min + refresh token 7 dias. Refresh token rotativo (cada uso genera nuevo par). Blacklist de tokens revocados en Redis/transient.
  - **Fase 3 (ideal):** Almacenar refresh token en OS keyring via Tauri plugin `tauri-plugin-keyring`.
- **Esfuerzo:** Fase 1: Bajo (~1h). Fase 2: Medio (~4h). Fase 3: Alto (~6h + plugin).

### SEC-A3. Validacion de tipo de archivo solo server-side — cliente envia cualquier cosa

- **Archivo:** `uploadQueueService.ts` (sin validacion de extension), `SamplesUploadController.php` L30-82 (valida server-side)
- **Problema:** El cliente desktop no valida que el archivo sea audio antes de enviarlo. Server-side SI valida (MIME magic bytes + whitelist), pero:
  1. Se desperdicia ancho de banda enviando archivos invalidos
  2. Si el server-side validation tiene un bug o bypass futuro, no hay defensa en profundidad
  3. Un atacante modificando el binario Tauri puede enviar payloads maliciosos
- **Impacto:** Bajo (server protege), pero viola defensa en profundidad.
- **Severidad:** ALTO (por principio de defensa en profundidad)
- **Solucion:**
  ```ts
  /* uploadQueueService.ts — agregar whitelist ANTES de encolar */
  const EXTENSIONES_AUDIO_VALIDAS = new Set(['.wav', '.mp3', '.flac', '.aiff', '.aif', '.ogg']);
  
  async function encolarArchivoInterno(ruta: string, ...): boolean {
      const ext = ruta.substring(ruta.lastIndexOf('.')).toLowerCase();
      if (!EXTENSIONES_AUDIO_VALIDAS.has(ext)) {
          logSync.warning('uploadQueue', `Archivo ignorado (no audio): ${ruta}`);
          return false;
      }
      /* ... resto del flujo */
  }
  ```
  **Adicional:** Agregar validacion de magic bytes en cliente (leer primeros 12 bytes del archivo):
  - RIFF → WAV
  - ID3/\xFF\xFB → MP3
  - fLaC → FLAC
  - FORM → AIFF
  - OggS → OGG
- **Esfuerzo:** Extension whitelist: Trivial (~15 min). Magic bytes: Bajo (~30 min).

### SEC-A4. Error responses revelan detalles internos en modo desarrollo

- **Archivos:** Multiples controllers PHP
- **Problema:** En catch blocks, el mensaje de error de `\Throwable` puede incluir paths del servidor, nombres de tablas, detalles de queries. Estos se pasan a `KamplesLogger` (correcto) pero tambien en algunos casos al response body (incorrecto).
- **Impacto:** Information disclosure — atacante aprende estructura interna, paths de archivos, nombres de queries.
- **Severidad:** ALTO
- **Solucion:** Patron estandardizado para catch en controllers REST:
  ```php
  catch (\Throwable $e) {
      KamplesLogger::error('Contexto: descripcion', ['error' => $e->getMessage()]);
      /* NUNCA pasar $e->getMessage() al response */
      return new \WP_REST_Response(['error' => 'Error interno del servidor'], 500);
  }
  ```
  **Verificar y corregir:** Todos los controllers que expongan `$e->getMessage()` en responses.
- **Esfuerzo:** Medio (~1.5h) — auditar todos los controllers + fix

---

## SECCION C — Hallazgos Medios

### SEC-M1. Cursor delta sin firma — enumeracion teorica de changelog

- **Archivo:** `SyncChangelogRepository.php` L155-195, `SyncController.php`
- **Problema:** El cursor es un ID numerico simple (1, 2, 3...). Cada usuario solo ve SU changelog (filtro `WHERE usuario_id = :id` en L158), pero un atacante autenticado podria iterar cursores para inferir ritmo de actividad de la plataforma (cuantos cambios hay, frecuencia).
- **Impacto:** Bajo — no expone datos de otros usuarios. Solo metadata de volumen de actividad global.
- **Severidad:** MEDIO (el user_id filter mitiga el riesgo real)
- **Solucion (opcional, mejora futura):** Cursor opaco: `base64(HMAC(userId + cursorId, secret))`. El server decodifica y verifica antes de usar. Esto impide cualquier inferencia.
- **Esfuerzo:** Medio (~1h)

### SEC-M2. Rate limiting ausente en endpoints de lectura sync

- **Archivo:** `SyncController.php` (endpoints GET)
- **Problema:** Los endpoints GET (colecciones, delta) no tienen rate limiting. Un script malicioso puede hacer miles de requests/minuto, saturando la BD.
- **Impacto:** DoS del servicio sync. No afecta datos pero afecta disponibilidad.
- **Severidad:** MEDIO
- **Solucion:**
  ```php
  /* SyncController.php — agregar rate limit a endpoints GET */
  RateLimiter::check('sync_lectura', $request, 60, HOUR_IN_SECONDS);
  /* 60 requests/hora para lectura sync por usuario */
  ```
  Nota: RateLimiter ya existe en el proyecto (usado en otros controllers). Solo falta aplicarlo aqui.
- **Esfuerzo:** Trivial (~15 min)

### SEC-M3. Descarga sin verificacion de integridad post-descarga

- **Archivo:** `syncCollectionService.ts` (download loop)
- **Problema:** Despues de descargar un sample, solo se verifica tamano, no hash. Un MITM o CDN comprometido puede servir un archivo corrupto/malicioso del mismo tamano.
- **Impacto:** Archivos corrompidos silenciosamente o reemplazados por payloads maliciosos.
- **Severidad:** MEDIO (el token HMAC de descarga autentica la request, pero no el contenido)
- **Solucion:**
  - **Fase 1:** Backend incluye `content_hash` (SHA-256 de los primeros 64KB) en la respuesta de sync colecciones.
  - **Fase 2:** Desktop calcula hash parcial post-descarga y compara.
  - **Fase 3:** Si hash no coincide, eliminar archivo y marcar para re-descarga.
- **Esfuerzo:** Medio (~2h). Requiere nuevo campo en response de sync.
- **Nota:** Heredado de v2 (TM4).

### SEC-M4. shell:allow-open en Tauri sin restriccion de URL

- **Archivo:** `principal.json` L55
- **Problema:** `shell:allow-open` permite abrir URLs arbitrarias en el navegador del SO. Si hay un bug XSS en el contenido React del desktop, un atacante puede ejecutar `open('file:///etc/passwd')` o custom protocol handlers.
- **Impacto:** Ejecucion de protocol handlers del SO, apertura de archivos locales.
- **Severidad:** MEDIO
- **Solucion:** Restringir a URLs `https://` del dominio propio:
  ```json
  {
    "identifier": "shell:allow-open",
    "allow": [{ "url": "https://kamples.com/**" }, { "url": "https://*.kamples.com/**" }]
  }
  ```
- **Esfuerzo:** Trivial (~10 min)

---

## SECCION D — Hallazgos Bajos

### SEC-L1. explorarPublicas expone metadata de samples publicos

- **Archivo:** `ColeccionesRepository.php` (explorarPublicas)
- **Problema:** Las colecciones publicas exponen tags, BPM, key de samples — informacion que productores podrian considerar estrategica (que generos trabajan, velocidades favoritas).
- **Impacto:** Bajo — solo afecta colecciones voluntariamente publicas.
- **Severidad:** BAJO
- **Solucion futura:** Controles granulares de privacidad por coleccion (mostrar nombre pero no samples, etc).

### SEC-L2. Logs exponen IDs de usuario en texto plano

- **Archivo:** Multiples archivos con KamplesLogger
- **Problema:** Los logs incluyen `userId`, `sampleId`, emails, etc. Si los logs son accesibles (error de configuracion), exponen datos de usuario.
- **Impacto:** Information disclosure si logs no estan protegidos.
- **Severidad:** BAJO (logs deberian estar protegidos por config del servidor)
- **Solucion futura:** Anonimizar IDs en logs no-criticos o usar hashes.

### SEC-L3. checkpointVersion sin encriptacion en Tauri Store

- **Archivo:** `syncTrackingService.ts`
- **Problema:** Tauri Store escribe datos de sync (indices de archivos, metadatos de colecciones, historial) en JSON plano en AppData. Un malware local puede leer esta informacion.
- **Impacto:** Exposicion de estructura de archivos del usuario a malware local.
- **Severidad:** BAJO (si hay malware local, ya hay compromiso total del sistema)
- **Solucion futura:** Encriptar Store con clave derivada del token de usuario.

---

## SECCION E — Plan de Ejecucion por Prioridad

### Sprint Seguridad 1 — Criticos + Quick Wins (~2h)

| Item | Tipo | Esfuerzo |
|------|------|----------|
| SEC-C1 — INTERVAL parametrizado | PHP SQL fix | 5 min |
| SEC-C2 — Eliminar fallback secret | PHP security | 10 min |
| SEC-A3 — Whitelist extension cliente | TS upload fix | 15 min |
| SEC-M2 — Rate limit sync lectura | PHP rate limit | 15 min |
| SEC-M4 — Restringir shell:allow-open | Tauri config | 10 min |

### Sprint Seguridad 2 — Acceso y autenticacion (~3h)

| Item | Tipo | Esfuerzo |
|------|------|----------|
| SEC-A1 — Restringir fs:scope Tauri | Tauri config | 30 min + testing |
| SEC-A2 Fase 1 — Reducir JWT exp a 7d + refresh | PHP + TS | 1h |
| SEC-A4 — Sanitizar error responses | PHP controllers | 1.5h |

### Sprint Seguridad 3 — Integridad y hardening (~3h)

| Item | Tipo | Esfuerzo |
|------|------|----------|
| SEC-A3 magic bytes — Validar header archivo cliente | TS | 30 min |
| SEC-M1 — Cursor opaco con HMAC | PHP | 1h |
| SEC-M3 — Hash verificacion post-descarga | PHP + TS | 2h |

### Sprint Seguridad 4 — JWT robusto (futuro)

| Item | Tipo | Esfuerzo |
|------|------|----------|
| SEC-A2 Fase 2 — Access + Refresh tokens | PHP + TS | 4h |
| SEC-A2 Fase 3 — OS keyring | Tauri plugin + TS | 6h |

---

## SECCION F — Diferidos heredados de v2

| Item v2 | Estado | Accion |
|---------|--------|--------|
| A3+A4 Service layer PHP | Pendiente | TO-DO en ColeccionesCrudController.php. Implementar cuando se toque el controller de nuevo |
| TM3 Migracion v1 completa | Pendiente | ~30 refs a indiceArchivos. Completar cuando se desactive v1 definitivamente |
| TM4 Hash post-descarga | **Absorbido SEC-M3** | Incluido en Sprint Seguridad 3 |
| TB1 TypedStore wrapper | Pendiente | Low priority |
| TB3 DIP syncWatcherSetup | Pendiente | Long-term |

---

## SECCION G — Verificacion y Metricas

### Que NO esta mal (seguridad confirmada)

| Area | Estado | Evidencia |
|------|--------|-----------|
| Auth middleware JWT | SEGURO | firebase/php-jwt, multi-header fallback (L46-90 AuthMiddleware) |
| User isolation queries | SEGURO | usuario_id = :id en TODAS las queries sync (SyncRepo, SyncChangelog, Colecciones) |
| Token de descarga | SEGURO | HMAC-SHA256 + hash_equals() (timing-safe) + expiracion temporal |
| Upload MIME validation | SEGURO | Server-side magic bytes + finfo + whitelist de formatos audio (SamplesUploadController L30-82) |
| Advisory locks descargas | SEGURO | try/finally con pg_advisory_lock/unlock (corregido en C280) |
| SQL injection general | SEGURO | Prepared statements en todas las queries (BaseRepository::consultar/ejecutar) |
| Colecciones publicas | SEGURO | WHERE publica = true OR usuario_id = :id — sin filtros bypass |
| CORS | SEGURO | WordPress REST maneja CORS, Tauri usa X-Kamples-Auth header |
| XSS en respuestas | SEGURO | API retorna JSON, React escapa por defecto |

### Metricas objetivo

| Metrica | Estado Actual | Objetivo Post-v3 |
|---------|---------------|-------------------|
| SQL interpolations | 1 (purgar INTERVAL) | 0 |
| Secrets hardcodeados | 1 (fallback descarga) | 0 |
| Endpoints sin rate limit | ~4 sync GET | 0 |
| FS scope excesivo | 1 (home recursive) | Solo folders necesarios |
| Validacion cliente archivos | 0 | Extension + magic bytes |
| JWT expiracion | 30 dias | 7 dias + refresh |

---

## Aprendizajes previos relevantes (de v1/v2)

- [Advisory locks]: pg_advisory_xact_lock no sirve con PDO autocommit. Usar session-level + finally.
- [MIME validation]: `$_FILES['type']` es untrusted. Solo confiar en `mime_content_type()` + finfo.
- [Cross-window]: Tauri MPA comparte Store pero no estado en memoria. Serializar con version gate.
- [Auth nginx]: Headers custom (X-Kamples-Auth) siempre se pasan en nginx/PHP-FPM. Doble via = auth robusta.
- [Schema constants]: El generador usa el nombre de columna (singular) para el prefijo. Ej: `estado` -> `TODOS_ESTADO`.
