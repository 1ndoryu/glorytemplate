# Agente de Supervisión SOLID / Seguridad / Optimización

> **Rol:** Agente autónomo de inspección continua del codebase Kamples.  
> **Misión:** Detectar y corregir vulnerabilidades de seguridad, violaciones SOLID, fallos silenciosos y oportunidades de optimización.  
> **Última ejecución:** 17/02/2026 (Iteración 2)

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
| A01 | MotorRecomendacion.php (770 líneas) | Necesita split en ConstructorSenales + PerfilUsuario + Orquestador. | PENDIENTE (planificado) |
| A02 | PublicacionesController.php (576 líneas) | Extraer ModeracionHandler + lógica duplicada. | PENDIENTE (planificado) |
| A03 | ColeccionesController.php (561 líneas) | Extraer ColeccionRecomendacion service. | PENDIENTE (planificado) |
| A04 | SamplesController.php (940 líneas) | Demasiadas responsabilidades (CRUD + feed + upload + sugerencias). | PENDIENTE (planificado) |
| A06 | ServicioIA.php (728 líneas) | Extraer GroqHttpClient, JsonRepairer, PromptBuilder, MetadataValidator. | PENDIENTE (planificado) |
| A07 | ServicioModeracionIA.php (524 líneas) | Extraer ModerarTexto, ModerarImagen, ModerarContexto. | PENDIENTE (planificado) |
| A08 | AnalizadorAudio.php (429 líneas) | Extraer DetectorBpm y DetectorTonalidad. | PENDIENTE (planificado) |
| A09 | DescargasController.php (510+ líneas) | Extraer GeneradorZip + DescargasCreditosService. | PENDIENTE (planificado) |
| A10 | ServicioIA + ServicioImagenIA + ServicioModeracionIA | Duplicación HTTP curl + obtenerApiKey + validarMetadata. Extraer GroqHttpClient compartido. | PENDIENTE (planificado) |

### P3 — BAJO (Calidad)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| O07 | PagosController L218 | procesarCheckoutCompletado no verifica rows affected. Suscripción "activa" a usuario inexistente. | PENDIENTE |
| O08 | PagosController L245 | procesarSuscripcionActualizada no actualiza plan en BD al cambiar plan. | PENDIENTE |
| O09 | NotificacionesController L55 | JOIN depende de JSON `(datos::jsonb->>'seguidor_id')` — frágil si estructura cambia. | PENDIENTE |
| O10 | ServicioModeracionIA L65 | Fail-open sin API key: todo contenido aprueba si Groq key expira. | PENDIENTE |
| O11 | ExperimentosController L26 | TEST_PASS hardcoded 'GloryTest2026!' | PENDIENTE (low risk, admin-only) |
| O12 | PerfilController L300 | subirAvatar no verifica UPLOAD_ERR_OK antes de procesar. | PENDIENTE |
| O13 | ReproduccionesController L70 | Race condition debounce: requests paralelos crean duplicados. | PENDIENTE |
| O14 | DescargasController L108 | Race condition límite diario TOCTOU. | PENDIENTE |
| O15 | Namespace `\` prefix | 9+ archivos con funciones globales sin `\` prefix — performance + seguridad. | PENDIENTE (masivo) |
| O16 | DashboardController L45 | stats() hace 7 queries secuenciales. Combinar con CTE. | PENDIENTE |

---

## Lecciones Aprendidas

- [PDO]: `INTERVAL ':param'` nunca funciona. PDO no interpola dentro de string literals SQL. Usar `INTERVAL '${constante}'` con valor validado.
- [PG Arrays]: `'{tag1,tag2}'` se rompe con comas/comillas en valores. Usar `phpArrayToPg()` con escaping explícito.
- [Stripe]: Validar timestamp de webhook además de firma HMAC. Tolerancia 300s.
- [Race conditions]: UPDATE + SELECT separados = race. Usar `UPDATE ... RETURNING` atómico.
- [Config SQL]: Cualquier valor de config interpolado en SQL debe tener cast explícito (int/float) o whitelist. Config files son vectores de ataque si se comprometen.
- [IDOR]: Verificar propiedad = double check: (1) existe (2) es del usuario o público.
- [Auth endpoints]: `permission_callback` de WP solo decide si acepta la request. Checks de rol deben ir además dentro del callback.
- [Cron WP]: Registrar intervalos custom con `cron_schedules` ANTES de `wp_schedule_event`.
- [DRY]: `pgArrayToPhp` estaba duplicada en PublicacionesController y NormalizadorSample.

---

## Archivos Revisados (tracking)

- [x] AuthMiddleware.php
- [x] RateLimiter.php
- [x] Validador.php
- [x] PostgresService.php
- [x] AuthController.php
- [x] SamplesController.php
- [x] PagosController.php
- [x] ComentariosController.php
- [x] DescargasController.php
- [x] MensajesController.php
- [x] PerfilController.php
- [x] StripeService.php
- [x] MotorRecomendacion.php
- [x] ServicioAntiSpam.php
- [x] ServicioBan.php
- [x] UsuarioHelper.php
- [x] NormalizadorSample.php
- [x] SocialController.php
- [x] PublicacionesController.php
- [x] ConnectController.php
- [x] ColeccionesController.php
- [x] KamplesInit.php
- [x] KamplesLogger.php
- [x] DiagnosticoController.php
- [x] EmbeddingsController.php
- [x] ExperimentosController.php
- [x] ColoresController.php
- [x] DashboardController.php
- [x] NotificacionesController.php
- [x] ReproduccionesController.php
- [x] LogAlgoritmo.php
- [x] LogIA.php
- [x] ServicioIA.php
- [x] ServicioImagenIA.php
- [x] ServicioModeracionIA.php
- [x] GeneradorEmbeddings.php
- [x] DeduplicadorAudio.php
- [x] PlanificadorAlgoritmo.php
- [x] AnalizadorAudio.php
- [ ] React: apiCliente.ts, authStore.ts, stores
- [ ] React: hooks, services, components
- [ ] Config: assets.php, config.php, control.php, environment.php

---

## Lecciones Aprendidas

- [SQL]: PDO placeholders NO funcionan dentro de string literals de PostgreSQL (ej: `INTERVAL ':param seconds'`). Concatenar o usar expresiones aritméticas.
- [SQL]: Siempre parametrizar IDs en cláusulas IN(). Generar placeholders dinámicos, nunca interpolar directamente.
- [SQL]: Para arrays PG, usar `pg_escape_literal` o quote individual de cada elemento. Nunca concatenar tags crudos.
- [Stripe]: Validar timestamp de webhooks (máx 300s antigüedad) para prevenir replay attacks.
- [Auth]: Verificar existencia del target en operaciones CRUD (follow, like, comentar) antes del INSERT.
- [SOLID]: Controladores > 300 líneas indican múltiples responsabilidades. Planificar split pero no ejecutar en caliente si hay riesgo de regresión.
- [Ban]: Verificar ban en TODAS las operaciones de escritura, no solo en comentarios.
- [Race]: Usar `UPDATE ... RETURNING` para operaciones atómicas de increment + read.
