# Agente de Supervisión SOLID / Seguridad / Optimización

> **Rol:** Agente autónomo de inspección continua del codebase Kamples.  
> **Misión:** Detectar y corregir vulnerabilidades de seguridad, violaciones SOLID, fallos silenciosos y oportunidades de optimización.  
> **Última ejecución:** 19/02/2026 (Iteración 5)

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
9. **CERO SQL interpolado:** No usar y arreglar toda operación SQL que interpole variables. Prepared statements obligatorios sin excepciones.
10. **Optimización obligatoria:** No omitir oportunidades de optimización — ni en la base de datos (CTEs, índices, queries combinables) ni en el algoritmo. Si se detecta, se corrige o se documenta.
11. **Jerarquía de carpetas:** No omitir oportunidades para organizar archivos en subcarpetas. Carpeta con >8 archivos sueltos = reorganizar obligatoriamente por dominio.
12. **Cero fallos silenciosos:** Nada puede fallar silenciosamente. Todo catch debe loguear o propagar. Todo retorno de error debe verificarse.
13. **Try-catch obligatorio:** No omitir donde hagan falta try-catch. Todo controller, toda operación I/O, toda llamada externa DEBE tener protección de excepciones.

---

## Completado — Sprints 1-4 (resumen compacto)

### Seguridad (S01-S43) — 43 hallazgos, 40 corregidos

- **SQL injection:** ServicioAntiSpam INTERVAL, ColeccionesController/SamplesController sugerencias, DescargasController IN clause, MotorRecomendacion config/ventanas/alias, AdminController INTERVAL, PipelineAudio columnas dinámicas — todos parametrizados.
- **IDOR:** ColeccionesController privadas, DescargasController ZIP colección, ComentariosController parentId — todos con check propiedad.
- **Info disclosure:** DiagnosticoController auth+admin, SamplesController error genérico, AdminController columnas explícitas, PostgresService SQL oculto en prod.
- **Auth/permisos:** PublicacionesController posts rechazados, MensajesController ban check, SocialController existencia target, ComentariosController ban-first, AdminController self-modification guard.
- **Credenciales:** PostgresService fallbacks eliminados (excepción si faltan).
- **Race conditions:** ServicioBan UPDATE RETURNING, ReproduccionesController FOR UPDATE, DescargasController advisory lock.
- **Upload:** MIME bypass (finfo magic bytes), precio rango 0-9999, UPLOAD_ERR_OK.
- **Shell:** PipelineAudio escapeshellarg en buscarBinario+generarPreview.
- **Stripe:** Webhook replay protection, rows affected check, plan sync.
- **Otros:** NormalizadorSample phpArrayToPg, uniqid→random_bytes, autonotificación filtrada, longitud razón reporte, existencia check likes.
- **Aceptados (3):** S19 (auth timing bajo riesgo), S20 (whitelist frágil bajo riesgo), S32 (role escalation requiere WP admin).

### SOLID / Arquitectura (A01-A12) — 12 splits completados

- MotorRecomendacion (772→292) + ConstructorSenales + PerfilUsuario
- PublicacionesController (598→252) + EscrituraController
- ColeccionesController (404→207) + CrudController
- SamplesController (1149→258) + Upload + Modificacion + Biblioteca + Sugerencias
- ServicioIA (730→272) + JsonRepairer | ServicioModeracionIA (512→164) + AnalizadoresModeracion
- AnalizadorAudio (429→55) + DetectorBpm + DetectorTonalidad
- DescargasController (638→266) + StreamController + ZipController
- ComentariosController (867→262) + EscrituraController + InteraccionController
- PipelineAudio (700→330) + FFmpegDetector + ProcesadorFFmpeg
- GroqHttpClient (157) compartido entre 3 servicios IA
- Namespace `\` prefix: 424 llamadas corregidas en 21 archivos

### Optimización (O01-O18) — 12 corregidos, 6 pendientes

- StripeService dedup, curl error handling, ConnectController balance 502
- UsuarioHelper short-circuit, ServicioBan/AntiSpam logging
- ServicioModeracionIA fail-open logging prominente
- **PENDIENTES:** O09 (NotificacionesController JSON join), O11 (hardcoded test pass), O16 (DashboardController 7→CTE), O19 (reportes sin paginación), O21 (parser .env comillas)

### Mezclador TS (MA1-MT4, ML1-ML10) — 17 corregidos

- AudioContext close, GainNode disconnect, splice→filter, null assertions
- Stale closures getState(), dead code, race condition agregarSample
- División por cero guards, JSON.parse type guard, setSilenciarPista volumen real
- **Pendiente:** ML6 (solapamiento bloques, feature)
- **Aceptado:** MS1 (URL fetch, input confiable), ML10 (Set Zustand, funciona con new Set)

---

## Sprint 5 — Auditoría Completa (19/02/2026)

**Contexto:** Re-auditoría profunda del codebase completo. 129 archivos PHP, 55+ archivos React TS, 50+ archivos Mezclador TS. Nuevas reglas: cero SQL interpolado, optimización obligatoria, jerarquía carpetas, cero fallos silenciosos, try-catch obligatorio.

### P0 — CRÍTICOS (Seguridad / Command Injection)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| S44 | DeduplicadorAudio.php exec() L138/152/169 | **Command injection:** 3 llamadas `exec()` con rutas de archivo sin `escapeshellarg()`. Otros archivos FFmpeg (ProcesadorFFmpeg, DetectorBpm, DetectorTonalidad) sí lo usan. | ✅ RESUELTO — escapeshellarg + try/finally + exit codes |
| S45 | TransaccionesRepository INTERVAL | **SQL interpolación:** INTERVAL interpolado sin whitelist. Callers usan valores fijos hoy, pero abierto a futuros callers. | ✅ RESUELTO — intervaloDias() whitelist + INTERVAL '1 day' * :dias |
| S46 | ReproduccionesRepository INTERVAL | **SQL interpolación:** Mismo patrón que S45. | ✅ RESUELTO — intervaloSegundos() whitelist + parametrizado |
| S47 | ComentariosRepository INTERVAL | **SQL interpolación:** int cast sin defense-in-depth. | ✅ RESUELTO — defense-in-depth int cast + parametrizado |

### P1 — ALTOS (Fallos silenciosos / Missing try-catch)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| TC01 | **26 Controllers con try-catch** | Todos los controllers públicos ahora tienen try-catch global. 26/26 envueltos con `catch (\Throwable $e)` + KamplesLogger + respuesta 500 genérica. | ✅ RESUELTO |
| TC02 | PostgresService patrón absorber | **Root cause:** consultar()→[], consultarUno()→null, ejecutar()→-1, insertar()→null al fallar. Todos los repos y controllers confían ciegamente en estos retornos. | PENDIENTE (documentar, fix gradual) |
| TC03 | PagosController (Stripe) | try-catch en 3 métodos (webhook retorna 200 incluso en error para Stripe). | ✅ RESUELTO |
| TC04 | ConnectController (Stripe Connect) | try-catch en 4 métodos. | ✅ RESUELTO |
| TC05 | DescargasController | try-catch en 3 métodos. | ✅ RESUELTO |
| TC06 | DescargasStreamController | try-catch envuelve antes del exit(). | ✅ RESUELTO |
| TC07 | DescargasZipController | try-catch en 1 método. | ✅ RESUELTO |
| TC08 | MensajesController | try-catch en 5 métodos. | ✅ RESUELTO |
| TC09 | PerfilController | try-catch en 4 métodos. | ✅ RESUELTO |
| TC10 | SamplesModificacionController | try-catch en 2 métodos. | ✅ RESUELTO |
| TC11 | ColoresController | try-catch en 1 método. | ✅ RESUELTO |
| TC12 | ComentariosInteraccionController | try-catch en 3 métodos (procesarMedia retorna union type). | ✅ RESUELTO |
| TC13 | AuthController | try-catch en 2 métodos. | ✅ RESUELTO |
| TC14 | DeduplicadorAudio | escapeshellarg + exit codes + try/finally temp cleanup. | ✅ RESUELTO (con S44) |
| TC15 | ExperimentosController hardcoded password | try-catch en 1 método. Password sigue hardcoded (admin-only, bajo riesgo). | ✅ PARCIAL |
| TC16 | ServicioNotificaciones N+1 | Cache estatico en `obtenerNombreActor()`. Evita queries repetidas para el mismo actor. | ✅ RESUELTO |

### P2 — MEDIO (Optimización DB / Algoritmo)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| OPT01 | DashboardController stats() | **6→3 queries**: 4 metricas mensuales combinadas en 1 SELECT con subqueries escalares. Ingresos ya combinados (OPT02). | ✅ RESUELTO |
| OPT02 | TransaccionesRepository ingresos | **3 queries** combinadas en 1 con `SUM() FILTER()`. DashboardController usa `ingresosDashboard()`. | ✅ RESUELTO |
| OPT03 | PostgresService insertar() | Prioriza RETURNING sobre lastInsertId(). Fallback a lastInsertId() si SQL no tiene RETURNING. | ✅ RESUELTO |
| OPT04 | NotificacionesController JSON join | JOIN depende de `(datos::jsonb->>'seguidor_id')` — frágil si estructura cambia. | PLANIFICADO (requiere migracion BD) |
| OPT05 | AdminController reportes | Paginacion con OFFSET + LIMIT + contarPendientes(). Enum ESTADO_PENDIENTE. | ✅ RESUELTO |
| OPT06 | PostgresService .env parser | Maneja comillas simples/dobles y comentarios inline. putenv() sigue activo (necesario para getenv). | ✅ RESUELTO |
| OPT07 | StripeService SSL | SSL explícito (CURLOPT_SSL_VERIFYPEER=true, CURLOPT_SSL_VERIFYHOST=2). Ya estaba configurado R69. | HECHO |
| OPT08 | StripeService retry | Retry con backoff exponencial (1s/2s/4s, max 3 intentos). Solo en curl error + HTTP 5xx. NO en 4xx. | HECHO |
| OPT09 | SamplesRepository 873 líneas | Excede límite 300 líneas. Candidato a split por dominio. | PLANIFICADO (alto riesgo, muchos callers) |
| OPT10 | UsuariosExtRepository 603 líneas | Excede límite 300 líneas. Candidato a split por dominio. | PLANIFICADO (alto riesgo, muchos callers) |

### P2 — Reorganización de Carpetas (Jerarquía)

| # | Directorio | Archivos | Problema | Sugerencia |
|---|-----------|----------|----------|------------|
| DIR01 | `React/styles/componentes/` | **68** | Carpeta plana masiva. | Subdividir: auth/, layout/, social/, contenido/, modales/, ui/, media/, navegacion/, paginas/, dropdown/, notificaciones/, publicaciones/ |
| DIR02 | `Kamples/Api/Controladores/` | **29** | Carpeta plana. | Subdividir: Auth/, Samples/, Social/, Comercio/, Comunicacion/, Contenido/, Admin/, Media/ |
| DIR03 | `React/components/ui/` | **29** | Carpeta plana (ya tiene subir/). | Subdividir: inputs/, feedback/, overlay/, botones/, cards/, media/, dropdown/, navigation/ |
| DIR04 | `React/hooks/` | **23** | Carpeta plana sin organización. | Subdividir: auth/, samples/, navegacion/, contenido/, media/, admin/, comunicacion/ |
| DIR05 | `React/services/` | **22** | Carpeta plana. | Subdividir: api/, utils/, realtime/ |
| DIR06 | `React/components/social/` | **20** | Carpeta plana. | Subdividir: interacciones/, publicaciones/, colecciones/, chat/, comentarios/ |
| DIR07 | `React/stores/` | **20** | Carpeta plana. | Subdividir: auth/, modales/, ui/, media/, comunicacion/ |
| DIR08 | `Kamples/Database/Repositories/` | **20** | Carpeta plana. | Subdividir: Social/, Contenido/, Comunicacion/, Comercio/, Usuario/ |
| DIR09 | `Mezclador/components/` (raíz) | **18** | Sueltos fuera de subcarpetas. | Subdividir: Timeline/, Controles/, Paneles/, Config/ |
| DIR10 | `Glory/src/Manager/` | **16** | Carpeta plana. | Subdividir: Pages/, Menu/, Assets/, Content/ |
| DIR11 | `Kamples/Api/` (raíz) | **13** | Sueltos. | Subdividir: Analizadores/, Audio/, IA/ |
| DIR12 | `Mezclador/stores/` | **13** | Carpeta plana. | Extraer acciones/ ya que 6 archivos son módulos de acciones. |
| DIR13 | `Mezclador/styles/` | **12** | Carpeta plana. | Subdividir: mixer/, channelRack/, pianoRoll/, paneles/ |
| DIR14 | `Kamples/Services/` | **10** | En el límite. | Subdividir si crece: Algoritmo/, Moderacion/, Usuario/ |

> **Estado DIR01-14:** PLANIFICADO — Requiere sesion dedicada. Mover 200+ archivos afecta imports en el codebase completo. Riesgo alto de conflictos. Hacer por dominio (ej: solo DIR01 en una sesion, solo DIR02 en otra).

### P2 — React Frontend

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| FE01 | 9 funciones en 3 services (apiMensajes, apiNotificaciones, apiPagos) | **Error masking:** `ok: true` en catch → `ok: false` + `error: 'Error de red'`. 9 fixes. | ✅ RESUELTO |
| FE02 | useExploradorPagina/DescargasPagina/FavoritosPagina | **Likes rollback:** Snapshot previo + verificar `resp.ok` + revertir + toast.error. 9 call sites. | ✅ RESUELTO |
| FE03 | useSamples.cargarFeed | Else branch añadido: set error + clear cargando cuando `resp.ok === false`. | ✅ RESUELTO |
| FE04 | usePublicar + useCrearContenido | Toast.error visible al usuario cuando upload falla. | ✅ RESUELTO |
| FE05 | useReproductor stale closures | Zustand create((set,get)) = refs estables. No hay stale closures. | ✅ NO APLICA |
| FE06 | useHistorialIds + useFiltroIds | Flag `cancelado` en cleanup. 4 useEffects protegidos contra state updates post-unmount. | ✅ RESUELTO |
| FE07 | useReproductor performance | Selectores individuales Zustand en vez de store completo. getState() para acciones. setProgreso ya no causa re-renders en consumers. | ✅ RESUELTO |
| FE08 | sugerenciasLikeStore.mostrar | Contador de version para descartar respuestas de requests anteriores (race condition). | ✅ RESUELTO |

### P3 — BAJO (Calidad)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| Q01 | AdminRepository L45-53 | Ya usa constantes Enum del Schema System. No hay strings hardcodeados. | ✅ YA CORRECTO |
| Q02 | Kamples/Log*.php (3 archivos) | LogAlgoritmo, LogIA, LogModeracion sueltos en raíz. | PLANIFICADO (16 imports a actualizar) |
| Q03 | ~24 funciones API TS | Try-catch defensivos con defaults tipados (data:[] vs null). Fix obtenerSimilares ok:true→false. | ✅ EVALUADO + FIX |
| Q04 | SchemaRegistry L37-56 | `require_once` dinámico desde glob. | ACEPTADO (dir fijo, no input usuario) |

---

## Lecciones Aprendidas

### SQL / PDO / PostgreSQL
- `INTERVAL ':param'` nunca funciona — PDO no interpola dentro de string literals. Usar `INTERVAL '1 day' * :dias`.
- PG TEXT[] requiere `'{val1,val2}'` con escaping → `phpArrayToPg()`. PDO devuelve string `"{}"` — parsear.
- Config SQL interpolada debe tener cast explícito (int/float) o whitelist. Columnas dinámicas requieren whitelist.
- `lastInsertId()` funciona con SERIAL pero puede fallar con IDENTITY → preferir RETURNING.
- PDO `ATTR_EMULATE_PREPARES=false`: excepción si params tiene keys sin placeholder. Prohibe reusar placeholder.
- Columnas PG: verificar nombres exactos (baneado_hasta, autor_id, tabla samples usa `creador_id` NO `usuario_id`).
- Repository `contarConFiltros`/`listarConFiltros` con WHERE dinámico + params — pragmático para filtros complejos.

### Seguridad / Auth
- [IDOR]: Verificar propiedad = double check: (1) existe (2) es del usuario o público.
- [Upload PHP]: `$_FILES['type']` es falsificable — usar `finfo(FILEINFO_MIME_TYPE)`.
- [Admin]: `rowCount()` en UPDATEs para detectar IDs inexistentes. Guard self-modification.
- [Shell]: `escapeshellarg()` en TODOS los argumentos, incluso numéricos.
- [Error messages]: NUNCA exponer `$e->getMessage()` al cliente. Loguear internamente, retornar genérico.
- [Stripe]: Validar timestamp webhook + firma HMAC. Tolerancia 300s.
- [Race conditions]: UPDATE + SELECT separados = race → `UPDATE ... RETURNING` o advisory lock.

### PHP / WordPress
- `wp_handle_upload()` solo en wp-admin — require `includes/file.php` en REST API.
- Cron WP: Registrar intervalos con `cron_schedules` ANTES de `wp_schedule_event`.
- PG credenciales: PostgresService EXIGE vars .env (sin defaults). `\` prefix en namespaces PHP.
- `(int) $request->get_param('page')` devuelve 0 si ausente → siempre `max(1, ...)`.
- Params incrementales: NUNCA reinicializar `$params` → merge o asignar campos individuales.

### SOLID / Splits
- Patrón coordinator: `registrarRutas()` delega a sub-controllers. WP REST API merge handlers.
- PipelineAudio 330 lín aceptada — orquestador de 10 pasos no se puede dividir sin romper cohesión.
- GroqHttpClient unifica HTTP para 3 servicios IA. JsonRepairer, AnalizadoresModeracion, DetectorBpm/Tonalidad como splits naturales.

### React / TypeScript / Mezclador
- apiCliente `apiPeticion<T>()` nunca lanza — resuelve `RespuestaApi<T>` (`ok: true|false`). Callers verifican `resp.ok`.
- Stale closures: useCallback con rAF → `getState()`. Race condition async → re-leer post-await.
- Zustand: Set() requiere `new Set()` cada mutación. Store completo en render = re-renders.
- Zustand selectores: `useStore(s => s.campo)` evita re-renders por campos no usados. Acciones via `getState()` son refs estables.
- Zustand race condition en stores async: contador de version fuera del store (`let version = 0; ++version` antes del await, comparar despues).
- try-catch en api services: aunque apiCliente no lanza, los catch proveen defaults tipados (data: [] vs data: null). Removerlos cambia el contrato para callers. Mantener por seguridad.
- Web Audio: AudioContext.close() OBLIGATORIO. GainNode.disconnect() en onended. `detune + playbackRate → computedRate`.
- SoundTouchJS 0.3.0 para pitch-independent. Cache `${bloqueId}:${semitonos}:${playbackRate}`.
- Canal Rack: velocity+pan+pitch por paso. Swing en pasos impares. 17 inserts mixer.
- Piano Roll: PPQ=96, 1 beat=60px*zoomX, Canvas grid+DOM notas. GhostNotas viewport culling.

### Sprint 5 — Decisiones y Aprendizajes
- [OPT01]: PDO ATTR_EMULATE_PREPARES=false prohibe reusar placeholders → usar uid1, uid2, uid3, uid4 con mismo valor en subqueries escalares.
- [OPT03]: insertar() ahora prioriza RETURNING sobre lastInsertId(). Fallback transparente para SQL sin RETURNING.
- [OPT05]: ReportesRepository 'pendiente' hardcoded → ReportesEnums::ESTADO_PENDIENTE. FQN eliminados con use statements.
- [OPT06]: .env parser basico funciona bien como fallback, pero necesita manejar comillas y comentarios inline.
- [TC16]: Cache estatico con `private static array $cache = []` es suficiente para N+1 dentro de una request PHP.
- [Q03]: Remover try-catch en api services cambia data de `[]` a `null` en error — callers que no verifican `resp.ok` se rompen.
- [DIR]: Reorganizacion de carpetas requiere sesion dedicada por dominio. Mover archivos PHP cambia namespaces + autoloading.

---

## Archivos Revisados (tracking)

### PHP Backend (47 archivos Kamples + 82 Glory/src = 129 total) ✅
- [x] AuthMiddleware / RateLimiter / Validador
- [x] PostgresService / SchemaRegistry / BaseRepository
- [x] 29 Controllers (todos auditados Sprint 5)
- [x] 20 Repositories (todos auditados Sprint 5)
- [x] ServicioIA / ServicioImagenIA / ServicioModeracionIA / GroqHttpClient / JsonRepairer
- [x] PipelineAudio / AnalizadorAudio / DetectorBpm / DetectorTonalidad / FFmpegDetector / ProcesadorFFmpeg
- [x] StripeService / ServicioBan / ServicioAntiSpam / ServicioNotificaciones
- [x] MotorRecomendacion / ConstructorSenales / PerfilUsuario / PlanificadorAlgoritmo
- [x] GeneradorEmbeddings / DeduplicadorAudio / NormalizadorSample / UsuarioHelper
- [x] KamplesInit / KamplesLogger / Log*.php

### TypeScript Mezclador (50+ archivos) ✅
- [x] motorAudioService / pitchShiftService / pianoRollAudioService
- [x] todos los hooks, stores, utils, componentes

### TypeScript React App (55+ archivos) ✅ (Sprint 5)
- [x] apiCliente.ts (centralizado, robusto)
- [x] 14 servicios api* (9 con error masking detectado)
- [x] 23 hooks (6 con issues detectados)
- [x] 20 stores (auditados)
- [x] componentes (auditados por estructura)
