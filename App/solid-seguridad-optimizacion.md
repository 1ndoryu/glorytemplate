# Agente de Supervisión SOLID / Seguridad / Optimización

> **Rol:** Agente autónomo de inspección continua del codebase Kamples.  
> **Misión:** Detectar y corregir vulnerabilidades de seguridad, violaciones SOLID, fallos silenciosos y oportunidades de optimización.  
> **Última ejecución:** 17/02/2026

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

## Hallazgos y Correcciones

### P0 — CRÍTICOS (Seguridad)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| S01 | ServicioAntiSpam.php L74 | **Bug SQL:** `INTERVAL ':ventana seconds'` — PDO no interpola dentro de string literals. La detección de duplicados **nunca funciona**. | CORREGIDO |
| S02 | ColeccionesController.php L263 | **IDOR:** `obtener()` es público y no verifica si la colección es privada. Cualquier ID expone colecciones privadas. | CORREGIDO |
| S03 | PublicacionesController.php L299 | **Posts rechazados accesibles:** GET `/publicaciones/{id}` no filtra por `moderacion_estado`. Posts rechazados accesibles con URL directa. | CORREGIDO |

### P1 — ALTOS (Seguridad)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| S04 | StripeService.php L210 | **Replay attack:** Webhook valida firma HMAC pero no timestamp. Un atacante puede reenviar webhooks capturados. | CORREGIDO |
| S05 | NormalizadorSample.php L149-152 | **SQL injection:** `$userId` interpolado directamente en SQL string. Aunque es `?int`, viola principio de prepared statements. | CORREGIDO |
| S06 | ServicioBan.php L39-42 | **Race condition:** INCREMENT + SELECT no atómico. Dos requests concurrentes leen mismo valor de violaciones. | CORREGIDO |
| S07 | SamplesController.php L893 + ColeccionesController | **SQL injection:** `$idsExcluirStr` interpolado en SQL sin parametrizar en `calcularSugerencias()`. | CORREGIDO |
| S08 | SamplesController.php + ColeccionesController | **Tags PG array escaping:** Tags con comas/llaves/comillas rompen el formato `'{tag1,tag2}'`. | CORREGIDO |
| S09 | MensajesController.php | **Sin ban check:** Usuarios baneados pueden seguir enviando mensajes. | CORREGIDO |
| S10 | SocialController.php L99/L144 | **IDOR:** Follow/Like sin verificar que el target (usuario/sample/publicación) existe. | CORREGIDO |

### P2 — MEDIO (SOLID / Arquitectura)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| A01 | MotorRecomendacion.php | 759 líneas — excede límite 300. Necesita split en ConstructorSenales + PerfilUsuario + Orquestador. | PENDIENTE (planificado) |
| A02 | PublicacionesController.php | 573 líneas — excede límite 300. Extraer ModeracionHandler + lógica duplicada. | PENDIENTE (planificado) |
| A03 | ColeccionesController.php | 549 líneas — excede límite 300. Extraer ColeccionRecomendacion service. | PENDIENTE (planificado) |
| A04 | SamplesController.php | 930 líneas — excede límite 300. Demasiadas responsabilidades (CRUD + feed + upload + sugerencias). | PENDIENTE (planificado) |
| A05 | PublicacionesController L509 | `pgArrayAPhp` duplicada de `NormalizadorSample::pgArrayToPhp`. Viola DRY. | CORREGIDO |

### P3 — BAJO (Optimización / Calidad)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| O01 | StripeService.php L68-97/L225-255 | Duplicación `request()` vs `requestConCuenta()` (~90% idénticos). | CORREGIDO |
| O02 | StripeService.php L86-96 | `curl_exec()` sin verificar `false` (error de red). Retorna silenciosamente. | CORREGIDO |
| O03 | ConnectController.php L238 | Balance con error retorna 200 con zeros — usuario ve "0 balance" en vez de error. | CORREGIDO |
| O04 | UsuarioHelper.php L28 | `obtenerIdPg()` ejecuta query innecesaria si wpUserId es 0. | CORREGIDO |
| O05 | ServicioBan.php | Sin logging de violaciones ni bans aplicados. Grave para auditoría. | CORREGIDO |
| O06 | ServicioAntiSpam.php | Sin logging de spam detectado. | CORREGIDO |

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
- [ ] KamplesController.php
- [ ] KamplesInit.php
- [ ] KamplesLogger.php
- [ ] PipelineAudio.php
- [ ] ServicioIA.php
- [ ] ServicioImagenIA.php
- [ ] ServicioModeracionIA.php
- [ ] GeneradorIdCorto.php
- [ ] GeneradorEmbeddings.php
- [ ] DeduplicadorAudio.php
- [ ] PlanificadorAlgoritmo.php
- [ ] AnalizadorAudio.php
- [ ] DiagnosticoController.php
- [ ] EmbeddingsController.php
- [ ] ExperimentosController.php
- [ ] ColoresController.php
- [ ] DashboardController.php
- [ ] NotificacionesController.php
- [ ] ReproduccionesController.php
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
