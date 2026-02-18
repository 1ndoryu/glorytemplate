# Agente de Supervisión SOLID / Seguridad / Optimización

> **Rol:** Agente autónomo de inspección continua del codebase Kamples.  
> **Misión:** Detectar y corregir vulnerabilidades de seguridad, violaciones SOLID, fallos silenciosos y oportunidades de optimización.  
> **Última ejecución:** 18/02/2026 (Iteración 4)

---

## Reglas del Agente

1. **Bucle continuo:** Revisar archivos por grupos funcionales. Al terminar todos, recorrer commits recientes y roadmap para inspeccionar cambios nuevos. Nunca salir del bucle.
2. **Prioridad de corrección:** P0 (crítico/seguridad) → P1 (alto/seguridad) → P2 (SOLID/arquitectura) → P3 (optimización/calidad).
3. **No romper:** Cada fix debe validarse con `get_errors` post-edición. Si introduce errores, revertir.
4. **Logging obligatorio:** Fallos silenciosos detectados deben loguearse con `KamplesLogger`.
5. **Documentar hallazgos:** Cada hallazgo y corrección se registra aquí con fecha, archivo, línea y estado.
6. **SOLID estricto:** Archivos > 300 líneas se marcan para refactorización planificada (no se rompen en caliente si hay riesgo).
7. **SQL parametrizado:** Toda interpolación directa de variables en SQL es una violación de seguridad. Usar prepared statements siempre.
8. **Sanitización double-check:** Validar longitud ANTES de sanitizar. Nunca confiar solo en frontend.

---

## Completado — Sprint 1 (resumen compacto)

- S01: ServicioAntiSpam INTERVAL PDO fix
- S02: ColeccionesController IDOR colecciones privadas
- S03: PublicacionesController posts rechazados accesibles
- S04: StripeService webhook replay attack protection
- S05: NormalizadorSample SQL userId cast
- S06: ServicioBan race condition UPDATE RETURNING
- S07: SamplesController + ColeccionesController SQL injection en sugerencias (parametrizado)
- S08: SamplesController + NormalizadorSample phpArrayToPg para tags PG array
- S09: MensajesController ban check antes de enviar
- S10: SocialController verificar existencia de target follow/like
- O01: StripeService dedup request/requestConCuenta
- O02: StripeService curl error handling
- O03: ConnectController balance error → 502 con logging (no 200 silencioso)
- O04: UsuarioHelper short-circuit wpUserId=0
- O05: ServicioBan logging violaciones/bans
- O06: ServicioAntiSpam logging spam detectado
- A05: PublicacionesController pgArrayAPhp → NormalizadorSample::pgArrayToPhp (DRY)

## Completado — Sprint 2 (detalles)

### P0 — CRÍTICOS (Seguridad)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| S11 | DescargasController descargarZipColeccion | **IDOR:** cualquier usuario autenticado descarga ZIP de cualquier colección sin check de propiedad/visibilidad. | CORREGIDO |
| S12 | DescargasController L305 | **SQL injection:** `$paramStr` interpola IDs en IN clause sin parameterizar. | CORREGIDO |
| S13 | DiagnosticoController /debug/pgvector | **Info disclosure:** endpoint público expone tablas, extensiones e índices de BD. | CORREGIDO (auth + admin check) |
| S14 | MotorRecomendacion config SQL | **SQL injection:** `$umbralRepro`, `$factorPen`, `$boostVerificado`, `$diasBoost`, `$maxPorCreador` interpolados sin cast. Config corrompida = SQL injection. | CORREGIDO (cast int/float) |
| S15 | MotorRecomendacion ventanas tendencias | **SQL injection:** `$ventanaCorta`/`$ventanaMedia` INTERVAL interpolado directamente. | CORREGIDO (whitelist) |
| S16 | MotorRecomendacion sqlTagsEnriquecidos | **SQL injection:** `$alias` interpolado en SQL sin validación. | CORREGIDO (regex validation) |

### P1 — ALTOS

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| S17 | ComentariosController L267 | **Silent failure:** Moderación async traga Throwable sin logging. Fallos recurrentes invisibles. | CORREGIDO (KamplesLogger::warning) |
| S18 | KamplesInit cronAlgoritmo | **Bug:** `wp_schedule_event` con intervalo `kamples_5min` se ejecuta ANTES de registrar el intervalo. | CORREGIDO (reordenado) |
| S19 | ExperimentosController | **Auth timing:** `permission_callback` usa `requerirAuth`, admin check dentro del callback. Timing leak menor. | ACEPTADO (check admin real está dentro, bajo riesgo) |
| S20 | DashboardController INTERVAL ingresos | **SQL injection:** `$intervalo` en INTERVAL viene de `match()` con whitelist. Seguro, pero el patrón es frágil. | ACEPTADO (whitelist ya está en match, riesgo bajo) |

### P2 — MEDIO (SOLID / Arquitectura)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| A01 | MotorRecomendacion.php (772→292) | Split en ConstructorSenales (294) + PerfilUsuario (125) + Orquestador. | CORREGIDO |
| A02 | PublicacionesController.php (598→252) | Split en PublicacionesEscrituraController (253). | CORREGIDO |
| A03 | ColeccionesController.php (404→207) | Split en ColeccionesCrudController (132). | CORREGIDO |
| A04 | SamplesController.php (1149→258) | Split en Upload (210) + Modificacion (235) + Biblioteca (220) + Sugerencias (145). | CORREGIDO |
| A06 | ServicioIA.php (730→272) | Extraído JsonRepairer (233). | CORREGIDO |
| A07 | ServicioModeracionIA.php (512→164) | Extraído AnalizadoresModeracion (256). | CORREGIDO |
| A08 | AnalizadorAudio.php (429→55) | Extraído DetectorBpm (127) + DetectorTonalidad (191). | CORREGIDO |
| A09 | DescargasController.php (638→266) | Split en DescargasStreamController (79) + DescargasZipController (209). | CORREGIDO |
| A10 | ServicioIA + ServicioImagenIA + ServicioModeracionIA | Extraído GroqHttpClient (157) compartido. | CORREGIDO |

### P3 — BAJO (Calidad)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| O07 | PagosController L218 | procesarCheckoutCompletado no verifica rows affected. Suscripción "activa" a usuario inexistente. | CORREGIDO |
| O08 | PagosController L245 | procesarSuscripcionActualizada no actualiza plan en BD al cambiar plan. | CORREGIDO |
| O09 | NotificacionesController L55 | JOIN depende de JSON `(datos::jsonb->>'seguidor_id')` — frágil si estructura cambia. | PENDIENTE |
| O10 | ServicioModeracionIA L65 | Fail-open sin API key: todo contenido aprueba si Groq key expira. | CORREGIDO (error log prominente) |
| O11 | ExperimentosController L26 | TEST_PASS hardcoded 'GloryTest2026!' | PENDIENTE (low risk, admin-only) |
| O12 | PerfilController L300 | subirAvatar no verifica UPLOAD_ERR_OK antes de procesar. | CORREGIDO |
| O13 | ReproduccionesController L70 | Race condition debounce: requests paralelos crean duplicados. | CORREGIDO (FOR UPDATE) |
| O14 | DescargasController L108 | Race condition límite diario TOCTOU. | CORREGIDO (pg_advisory_xact_lock) |
| O15 | Namespace `\` prefix | 424 llamadas corregidas en 21 archivos con script tokenizador PHP. | CORREGIDO |
| O16 | DashboardController L45 | stats() hace 7 queries secuenciales. Combinar con CTE. | PENDIENTE |

---

## Completado — Sprint 3

### PHP Fixes

| # | Archivo | Fix | Detalles |
|---|---------|-----|----------|
| O07 | PagosController | rows affected check | `procesarCheckoutCompletado` ahora verifica `$affected === 0` y logea critical |
| O08 | PagosController | plan sync webhook | `procesarSuscripcionActualizada` extrae plan de Stripe `lookup_key`, actualiza BD |
| O10 | ServicioModeracionIA | fail-open logging | `moderarPublicacion` y `moderarComentario` logean error prominente sin API key |
| O12 | PerfilController | UPLOAD_ERR_OK | Avatar upload valida error code antes de procesar |
| O13 | ReproduccionesController | FOR UPDATE debounce | Debounce query usa `FOR UPDATE` para serializar requests |
| O14 | DescargasController | advisory lock | `pg_advisory_xact_lock(:lockId)` previene bypass TOCTOU del límite diario |

### Mezclador — Auditoría Completa (19 archivos, 28 hallazgos)

#### P0 — Críticos (Audio Leaks / Correctness)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| MA1 | motorAudioService destruir() | AudioContext nunca se cierra → leak de threads de audio del navegador | CORREGIDO (async destruir + close) |
| MA2 | motorAudioService obtenerContexto() | `resume()` no awaited, estado `closed` no manejado → errores silenciosos | CORREGIDO (void resume, reinicio si closed) |
| MA3 | motorAudioService programarReproduccion() | GainNode zombies: `gainNodo` nunca se desconecta en `onended` | CORREGIDO (disconnect en onended) |
| MA5 | motorAudioService onended | `nodosActivos.splice()` muta array durante iteración potencial | CORREGIDO (filter inmutable) |
| MA6 | motorAudioService obtenerGainPista() | `masterGain!` non-null assertion insegura | CORREGIDO (throw explícito si null) |

#### P1 — Altos (Stale State / Logic)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| ML1 | useMotorAudio actualizarCursor | Stale closure: captura bpm/compás/totalCompases en closure del useCallback, rAF auto-referenciado lee valores viejos | CORREGIDO (getState()) |
| ML2 | useMotorAudio schedulerRef | Ref declarada y limpiada pero nunca asignada — dead code que confunde | CORREGIDO (eliminado) |
| MR1 | useMotorAudio programarBloques | `pistas` como dependencia de useCallback causa recreación cascada en cada cambio de pistas | CORREGIDO (getState()) |
| ML3 | mezcladorStore agregarSample | Race condition: pistaDestino capturada antes del `await cargarBuffer()`, stale después | CORREGIDO (re-read con getState post-await) |

#### P2 — Medio (Robustez)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| MT3 | compasUtils duracionCompas | División por cero si bpm=0 | CORREGIDO (guard bpm<=0) |
| MT4 | compasUtils anchoBloquePorc/posicionBloquePorc | División por cero si totalCompases=0 | CORREGIDO (guard <=0) |
| ML7 | useTimeline alDropExterno | `JSON.parse` sin validar estructura del objeto → crash o datos corruptos | CORREGIDO (type guard) |
| ML10 | mezcladorStore cargandoBuffers | `Set()` en estado Zustand — equality check no detecta cambios (shallow compare) | ACEPTADO (funciona con `new Set()` cada vez, tipar explícitamente) |

#### P3 — Bajo (Calidad) — No corregidos (bajo riesgo)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| ML6 | mezcladorStore moverBloque | No valida solapamiento de bloques al mover | PENDIENTE (feature, no bug) |
| MS1 | motorAudioService cargarBuffer | URL de fetch no se valida (permite fetch a URLs arbitrarias si sample.rutaPreview es manipulado) | ACEPTADO (rutaPreview viene del backend, input confiable) |

---

## Sprint 4 — Auditoría Completa Post-Schema/Mezclador/Admin (18/02/2026)

**Contexto:** Re-auditoría completa del codebase tras agregar Schema System (R54-R58), AdminController (R47), Mezclador ampliado (R48-R52), cache SWR mensajes (R53), pitch-independent stretch (R53). 129 archivos PHP (~25,943 líneas), 14 archivos Mezclador TS.

### P0 — CRÍTICOS

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| S21 | SamplesController calcularSugerencias L984 | **Bug crítico:** `$params` se reinicializa en L984 (`$params = ['limit'=>..., 'offset'=>..., 'avgBpm'=>...]`) borrando los placeholders `:excl0`, `:excl1`... que se añadieron en L960-970. PDO lanza excepción → endpoint crashea para usuarios con descargas/favoritos. | CORREGIDO |
| S22 | SamplesController subir() L490 | **Silent failure:** Si INSERT falla, catch logea pero la ejecución continúa → retorna HTTP 201 con `sample_id: null` + archivo huérfano en disco + pipeline no ejecuta. | CORREGIDO |

### P1 — ALTOS

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| S23 | AdminController actividad() L97 | **SQL interpolación:** `$dias` interpolado en `INTERVAL '{$dias} days'` en 3 queries. Cast `(int)` lo protege hoy, pero patrón frágil. | CORREGIDO (INTERVAL '1 day' * :dias) |
| S24 | AdminController moderar() L272 | **Update ciego:** UPDATE moderación retorna ok=true incluso si el id no existe en BD (0 rows affected). | CORREGIDO (rowCount check) |
| S25 | AdminController actualizarUsuario() L222 | **Update ciego:** Mismo bug — retorna ok=true con id inexistente. | CORREGIDO (rowCount check) |
| S26 | ComentariosController crear() L192 | **Orden incorrecto:** Ban check ocurre DESPUÉS del rate limiter, validación y anti-spam. Usuario baneado ejecuta toda la lógica antes de ser rechazado. | CORREGIDO (ban check first) |
| S27 | ComentariosController crear() L327 | **IDOR parentId:** `parentId` no se valida que pertenezca al mismo tipo+targetId. Permite incrementar `total_respuestas` de comentario ajeno. | CORREGIDO (validación padre) |
| S28 | SamplesController subir() L437 | **Info disclosure:** Error de upload (`$subido['error']`) puede exponer rutas absolutas del servidor al cliente. | CORREGIDO (mensaje genérico) |
| S29 | PostgresService L51-53 | **Credenciales hardcoded:** Fallbacks `'postgres'`/`'root'` si .env falla → conexión con superusuario y password trivial. | CORREGIDO (excepción si faltan) |

### P2 — MEDIO

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| S30 | SamplesController subir() L389 | **MIME bypass:** `$audio['type']` viene del cliente (falsificable). wp_handle_upload solo valida extensión, no contenido real. | CORREGIDO (finfo magic bytes) |
| S31 | SamplesController subir() precio L451 | **Sin rango:** `$precio` castea float pero acepta -99999 o 999999999. | CORREGIDO (0-9999 range) |
| S32 | AdminController L197 | **Role escalation:** Admin puede asignar `rol='admin'` desde el panel. Riesgo bajo (requiere WP admin), pero permite crear admins arbitrarios. | ACEPTADO (bajo riesgo, WP manage_options requerido) |
| S33 | AdminController L186-222 | **Self-modification:** Admin puede banearse o degradar su propio rol. | CORREGIDO (guard self-id) |
| S34 | AdminController L210 | **ban_hasta sin formato:** Acepta cualquier string como fecha sin validación ISO. | CORREGIDO (strtotime validation) |
| S35 | AdminController L248 | **Info disclosure:** `SELECT r.*` en reportes expone todas las columnas. | CORREGIDO (columnas explícitas) |
| S36 | AdminController completo | **Sin try-catch:** Ningún método maneja excepciones → stack traces con WP_DEBUG=true. | CORREGIDO (try-catch global) |
| S37 | PostgresService L109-156 | **SQL en logs:** Catch logea `mb_substr($sql, 0, 200)` que puede contener datos sensibles. | CORREGIDO (oculto en prod) |
| S38 | PipelineAudio buscarBinario() L460 | **Shell sin escape:** `$nombre` interpolado en shell_exec sin escapeshellarg. Seguro hoy (hardcoded), patrón frágil. | CORREGIDO (escapeshellarg) |
| S39 | PipelineAudio generarPreview() L577 | **FFmpeg params sin escape:** `$duracion` y `$fadeStart` sin escapeshellarg en sprintf. | CORREGIDO (escapeshellarg) |
| S40 | PipelineAudio actualizarSample() L660 | **SQL columnas dinámicas:** `$campo` interpolado en SQL sin whitelist. Seguro hoy (caller interno), patrón frágil. | CORREGIDO (whitelist) |
| S41 | ComentariosController reportar() L565 | **Sin límite longitud:** `razon` sanitizada pero sin límite → almacenamiento masivo posible. | CORREGIDO (max 500 chars) |
| S42 | ComentariosController quitarLike() L635 | **Sin existencia check:** Opera sin verificar que el comentario existe. 3 queries desperdiciadas. | CORREGIDO (check existencia) |
| S43 | motorAudioService setSilenciarPista() | **Des-silenciar pone gain=1:** Ignora el volumen real configurado de la pista. | CORREGIDO (leer volumen del store) |

### P2 — SOLID / Arquitectura (COMPLETADO Sprint 5)

| # | Archivo | Resultado | Estado |
|---|---------|-----------|--------|
| A01 | MotorRecomendacion.php (772→292) | + ConstructorSenales (294) + PerfilUsuario (125) | CORREGIDO |
| A02 | PublicacionesController.php (598→252) | + PublicacionesEscrituraController (253) | CORREGIDO |
| A03 | ColeccionesController.php (404→207) | + ColeccionesCrudController (132) | CORREGIDO |
| A04 | SamplesController.php (1149→258) | + Upload (210) + Modificacion (235) + Biblioteca (220) + Sugerencias (145) | CORREGIDO |
| A06 | ServicioIA.php (730→272) | + JsonRepairer (233) | CORREGIDO |
| A07 | ServicioModeracionIA.php (512→164) | + AnalizadoresModeracion (256) | CORREGIDO |
| A08 | AnalizadorAudio.php (429→55) | + DetectorBpm (127) + DetectorTonalidad (191) | CORREGIDO |
| A09 | DescargasController.php (638→266) | + DescargasStreamController (79) + DescargasZipController (209) | CORREGIDO |
| A10 | GroqHttpClient (157) compartido | ServicioIA + ServicioImagenIA + ServicioModeracionIA unificados | CORREGIDO |
| A11 | ComentariosController.php (867→262) | + EscrituraController (263) + InteraccionController (263) | CORREGIDO |
| A12 | PipelineAudio.php (700→330) | + FFmpegDetector (146) + ProcesadorFFmpeg (138) | CORREGIDO |

### P3 — BAJO (Calidad)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| O09 | NotificacionesController L55 | JOIN depende de JSON `(datos::jsonb->>'seguidor_id')`. | PENDIENTE |
| O11 | ExperimentosController L26 | TEST_PASS hardcoded. | PENDIENTE (admin-only) |
| O15 | Namespace `\` prefix | 424 llamadas corregidas en 21 archivos (script tokenizador). | CORREGIDO |
| O16 | DashboardController L45 | stats() 7 queries secuenciales → CTE. | PENDIENTE |
| O17 | ComentariosController autonotificación | No filtra `$userId !== $receptor` → autonotificaciones. | CORREGIDO |
| O18 | ComentariosController L808 | `uniqid()` predecible para temp files. | CORREGIDO (random_bytes) |
| O19 | AdminController reportes | LIMIT 10 fijo sin paginación. | PENDIENTE (funcional) |
| O20 | SchemaRegistry L37-56 | `require_once` dinámico desde glob — si alguien escribe en Schema/ se auto-ejecuta. | ACEPTADO (dir fijo, no input usuario) |
| O21 | PostgresService L233-241 | Parser .env no maneja comillas en valores. | PENDIENTE (bajo impacto) |

---

## Lecciones Aprendidas

- [PDO]: `INTERVAL ':param'` nunca funciona. PDO no interpola dentro de string literals SQL. Usar `INTERVAL '1 day' * :dias` con parametrización.
- [PG Arrays]: `'{tag1,tag2}'` se rompe con comas/comillas en valores. Usar `phpArrayToPg()` con escaping explícito.
- [Stripe]: Validar timestamp de webhook además de firma HMAC. Tolerancia 300s.
- [Race conditions]: UPDATE + SELECT separados = race. Usar `UPDATE ... RETURNING` atómico.
- [Config SQL]: Cualquier valor de config interpolado en SQL debe tener cast explícito (int/float) o whitelist.
- [IDOR]: Verificar propiedad = double check: (1) existe (2) es del usuario o público.
- [Auth endpoints]: `permission_callback` de WP solo decide si acepta la request.
- [Cron WP]: Registrar intervalos custom con `cron_schedules` ANTES de `wp_schedule_event`.
- [Web Audio]: AudioContext.close() OBLIGATORIO en destruir(). GainNode.disconnect() en onended.
- [React closures]: useCallback con rAF auto-referenciado captura valores del primer render → getState().
- [Zustand]: Set() en estado Zustand requiere `new Set()` en cada mutación.
- [Race condition async]: NUNCA capturar objetos del estado antes de await → re-leer con get().
- [Upload PHP]: `$_FILES['type']` viene del cliente, es falsificable. Usar `finfo(FILEINFO_MIME_TYPE)` para validar contenido real.
- [Admin]: Verificar `rowCount()` en UPDATE para detectar IDs inexistentes. Retornar 404 si 0 filas afectadas.
- [Admin]: Prevenir auto-modificación (self-ban, self-degrade) comparando ID del request con ID del admin autenticado.
- [Params reinicializados]: Al construir `$params` incrementalmente (excl0, tag0...), NUNCA reinicializar con `$params = [...]`. Usar merge o asignar campos individuales.
- [Error messages]: NUNCA exponer `$subido['error']` ni `$e->getMessage()` al cliente. Loguear internamente, retornar mensaje genérico.
- [Shell commands]: Escapar TODOS los argumentos con `escapeshellarg()`, incluso los que parecen numéricos. Defensa en profundidad.
- [SQL columnas dinámicas]: Si `$campo` viene de las keys de un array en `actualizarSample`, usar whitelist explícita antes de interpolar en SQL.

### Sprint 5 — SOLID Refactoring

- [SOLID Split]: Patrón coordinator: `registrarRutas()` en archivo principal delega callbacks a sub-controllers. WP REST API merge handlers automáticamente.
- [SOLID Split]: Al mover métodos private → public static en sub-controller, actualizar visibilidad de constantes y métodos helper que usa.
- [Namespace `\`]: Script tokenizador PHP (`token_get_all`) para agregar `\` prefix masivamente sin modificar strings ni comentarios. 424 llamadas corregidas.
- [GroqHttpClient]: Unifica HTTP+apiKey para 3 servicios IA. obtenerApiKey soporta $_ENV → getenv → defined() fallback.
- [JsonRepairer]: 5 estrategias parsing JSON + repararJsonConGroq. Separado de ServicioIA porque solo necesita GroqHttpClient.
- [AnalizadoresModeracion]: Prompts IA largos → archivo separado. Orquestador queda limpio con solo BD + veredicto.
- [DetectorBpm/Tonalidad]: Split natural por dominio algorítmico. AnalizadorAudio queda como fachada de 55 líneas.
- [PipelineAudio 330 lín]: Excepción aceptada — orquestador de 10 pasos secuenciales no se puede dividir sin romper cohesión.

---

## Archivos Revisados (tracking)

### PHP Backend (47 archivos Kamples + 82 Glory/src = 129 total)
- [x] AuthMiddleware.php
- [x] RateLimiter.php / Validador.php
- [x] PostgresService.php / SchemaRegistry.php
- [x] AuthController.php / AdminController.php
- [x] SamplesController.php (1128 lín)
- [x] ComentariosController.php (867 lín)
- [x] DescargasController.php / PublicacionesController.php
- [x] ColeccionesController.php / MensajesController.php
- [x] PerfilController.php / PagosController.php
- [x] ConnectController.php / SocialController.php
- [x] DashboardController.php / NotificacionesController.php
- [x] ReproduccionesController.php / DiagnosticoController.php
- [x] EmbeddingsController.php / ExperimentosController.php / ColoresController.php
- [x] ServicioIA.php / ServicioImagenIA.php / ServicioModeracionIA.php
- [x] PipelineAudio.php / AnalizadorAudio.php
- [x] StripeService.php / ServicioBan.php / ServicioAntiSpam.php
- [x] MotorRecomendacion.php / PlanificadorAlgoritmo.php
- [x] GeneradorEmbeddings.php / DeduplicadorAudio.php
- [x] NormalizadorSample.php / UsuarioHelper.php
- [x] KamplesInit.php / KamplesLogger.php / Log*.php
- [ ] Config: assets.php, config.php, control.php, environment.php (bajo riesgo)

### TypeScript Frontend
- [x] Mezclador: motorAudioService.ts (391 lín) / pitchShiftService.ts (132 lín)
- [x] Mezclador: useMotorAudio.ts / useMezclador.ts / useTimeline.ts / useExportarMezcla.ts
- [x] Mezclador: mezcladorStore.ts + módulos (accionesBloques/Carga/Historial/Seleccion)
- [x] Mezclador: compasUtils.ts / audioBufferUtils.ts / types/mezclador.ts
- [x] Mezclador: componentes (10 archivos)
- [ ] React App: apiCliente.ts, authStore.ts, stores, hooks, services, components (pendiente)
