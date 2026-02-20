# PLAN DE ELIMINACIÓN DE HARDCODE Y HARDENING — CAP

> **Fecha:** 2026-02-19  
> **Objetivo:** Eliminar TODO string hardcodeado de BD, integrar Schema System de Glory, hardening de error handling  
> **Estado:** Fases 1-8 completadas (22/22 items).

---

## RESUMEN EJECUTIVO

| Categoría | Hallazgos iniciales | Estado actual |
| --- | --- | --- |
| Strings hardcodeados de columnas | ~53 en 19 PHP + 12 TSX | ✅ 0 |
| Strings hardcodeados de enums | ~20 en 14 PHP + 3 TSX | ✅ 0 |
| Nombres de tabla hardcodeados | 38 instancias | ✅ 0 |
| Asignaturas duplicadas | 8 definiciones en 7 PHP + 1 TS | ✅ 1 fuente única |
| Queries sin `$wpdb->prepare()` | 9 instancias | ✅ 0 |
| Operaciones BD sin verificar resultado | 35 HIGH | ✅ 0 |
| Schema System Glory | NO integrado | ✅ 7 Cols + 3 Enums + 7 DTOs + schema.ts |
| Transacciones BD | 0 | ✅ 11 operaciones protegidas |
| Try-catch en modelos | 0 | ✅ Cobertura completa |
| BaseRepository | Inexistente (7 repos muertos) | ✅ Funcional con CRUD, transacciones |
| useEffects sin cleanup | 8 | ✅ 0 (AbortController) |
| Endpoints con BD directa | 7 de 12 | ✅ 0 — migrados a repos |

---

## COMPLETADO — Fases 1-7: Schema System + Hardcode + Hardening

### F1: Schemas Glory (7 tablas + constantes asignaturas)
- 7 `TableSchema` en `App/Config/Schema/` → generación de `*Cols`, `*Enums`, `*DTO`, `schema.ts`
- `CapAsignaturasConstants.php`: fuente única para 8 asignaturas + alias + horas requeridas
- Autoload PSR-4 configurado

### F2: Modelos migrados (3 archivos)
- `Alumno.php`, `Clase.php`, `Configuracion.php` → 0 strings BD
- `ASIGNATURAS_CANONICAS`/`ASIGNATURA_ALIAS` extraídos a `CapAsignaturasConstants`
- Días usan `CapDisponibilidadEnums::DIA_*`

### F3: Servicios migrados (10 de 11 con cambios)
- 11 servicios migrados → 0 strings BD
- `CalendarEngine::ASIGNATURAS` delega a `CapAsignaturasConstants`

### F4: API + Seeder migrados (8 de 11 con cambios)
- 7 API endpoints + CapSeeder → 0 strings BD
- CapSeeder: eliminada `$prefix` y array hardcodeado de asignaturas

### F5: Frontend migrado (7 archivos TS/TSX)
- Tipos `EstadoAlumno`, `DiaSemana`, `EstadoSuscripcion` derivan de `schema.ts`
- Discrepancia `trial`/`grace` resuelta (no existen en BD). `pago_fallido` agregado
- `CODIGO_A_ID` duplicado eliminado de ModalProgresoAlumno

### F6: Hardening error handling (10 archivos PHP)
- 5 webhook handlers: `void→bool` + verificación `$wpdb`
- 3 modelos: `void→bool` en métodos de recálculo
- 5 `DELETE IN()` → `$wpdb->prepare()` con placeholders
- `json_decode`/`json_encode` checks, try-catch en CapBootstrap, wp_mail verificado

### F7: Validación final
- PHP lint 0 errores en todo `App/`
- Grep: 0 hardcode residual en queries, 0 `DELETE IN()` sin prepare
- Regla permanente: toda referencia BD usa Schema System

---

## COMPLETADO — Fase 8: Auditoría Profunda (22/22 sub-items)

| ID | Descripción | Commit |
|----|-------------|--------|
| 8.0 | `BaseRepository` con CRUD, named params, `conTransaccion()`. 7 repos funcionales | 1b4fd7c |
| 8.1 | 11 operaciones multi-tabla protegidas con transacciones | 1b4fd7c |
| 8.2 | Try-catch en todos los modelos (write operations) | f70ec00 |
| 8.3 | Split `useCalendario.ts`: 792→~120 líneas + 7 sub-hooks en `hooks/calendario/` | — |
| 8.4 | Endpoints migrados a repositorios: 7 endpoints sin `$wpdb` directo | AG-CMP |
| 8.5 | Stripe hardening: idempotency keys, webhook replay, IV bug, timeouts, estados constantes | f70ec00 |
| 8.6 | Open redirect fix: `wp_validate_redirect()` en 3 URLs de Stripe | f70ec00 |
| 8.7 | Input validation en 5 endpoints: sanitize_text_field, absint, regex fecha, is_array guards | ba23fff |
| 8.8 | Trait `ConCallbackSeguro` reemplaza 11 implementaciones duplicadas | f70ec00 |
| 8.9 | `EstadoSuscripcion` unificado → `InfoSuscripcion`. Tipo usa schema | b24a355 |
| 8.10 | AbortController en 8 useEffects. setTimeout→useEffect con cleanup | b24a355 |
| 8.11 | Error masking eliminado: response.ok checks, fallback con alerta, JSON.parse protegido | 3889d29 |
| 8.12 | Verificado: rollback optimista ya correcto en toggle/actualizar/mover | — |
| 8.13 | Selectores Zustand individuales en CapLayout (7 selectores) | b24a355 |
| 8.14 | API_BASE centralizado. useHistorial eliminado (código muerto) | eae10b0 |
| 8.15 | Inmutable updates en PanelHorarios (map/filter/spread) | b24a355 |
| 8.16 | Error detail leaks: `$e->getMessage()` reemplazado en CapReportesEndpoints | ba23fff |
| 8.17 | Race condition registro: mensajes WP error code + HTTP 409 + try-catch global | e9174e4 |
| 8.18 | FK constraints documentadas en CapSchema.php (8 dependencias) | e9174e4 |
| 8.19 | N+1 eliminado en Seeder: batch INSERT lotes de 50 | e9174e4 |
| 8.20 | Logout con nonce: `wp_logout_url()` como prop | 3889d29 |
| 8.21 | Botón "Gestionar Pagos" funcional con endpoint `/stripe/portal` | 3889d29 |
| 8.22 | Typo `borrarSemanacompleta` → `borrarSemanaCompleta` | b24a355 |

### Detalle 8.4: Migración de endpoints a repositorios

**Métodos custom creados en repositorios:**

| Repositorio | Métodos |
|---|---|
| `CapSuscripcionesRepository` | `buscarUltimaPorCentro()`, `buscarCustomerIdPorCentro()` |
| `CapAsistenciaRepository` | `buscarAlumnoIdsPorClase()`, `eliminarPorClaseId()`, `eliminarPorClaseIds()`, `contarDuplicadosPorAlumno()`, `obtenerClasesDeAlumno()`, `obtenerResumenPorAsignatura()`, `obtenerTotalHoras()` |
| `CapClasesRepository` | `buscarIdsPorCentro()`, `buscarIdsPorCentroYSemana()`, `eliminarPorCentro()`, `eliminarPorCentroYSemana()` |
| `CapDisponibilidadRepository` | `buscarSlotsPorAlumno()`, `eliminarPorAlumno()` |

**Endpoints migrados:**

| Endpoint | Antes (ops directas) | Después (via repos) |
|---|---|---|
| `CapRegistroEndpoints` | 3 `$wpdb->insert` | `CentrosRepo/ConfigRepo/SuscripcionesRepo::insertar()` |
| `CapConfigEndpoints` | SELECT suscripción | `SuscripcionesRepo::buscarUltimaPorCentro()` |
| `CapStripeEndpoints` | SELECT customer_id | `SuscripcionesRepo::buscarCustomerIdPorCentro()` |
| `CapClasesGestionEndpoints` | SELECT+DELETE asist/clase | `AsistenciaRepo::buscarAlumnoIdsPorClase/eliminarPorClaseId()` + `ClasesRepo::eliminar()` |
| `CapClasesLimpiezaEndpoints` | SELECT IDs + DELETEs masivos | `ClasesRepo::buscarIdsPor*/eliminarPor*()` + `AsistenciaRepo::eliminarPorClaseIds()` |
| `CapDisponibilidadEndpoints` | SELECT/DELETE/INSERT | `DisponibilidadRepo::buscarSlotsPorAlumno/eliminarPorAlumno/insertar()` |
| `CapAlumnosProgresoEndpoints` | 6+ queries debug JOINs | `AlumnosRepo::buscarPorId()` + `AsistenciaRepo::obtenerClases*/obtenerResumen*/obtenerTotal*()` |

**Patrón transacciones cross-repo:** endpoint orquesta `START TRANSACTION`/`COMMIT`/`ROLLBACK`, repos ejecutan operaciones individuales.

---

## REGLA DE MANTENIMIENTO FUTURO

> Toda nueva referencia a columnas, tablas o valores enum de BD DEBE usar constantes del Schema System (`*Cols`, `*Enums`).  
> PROHIBIDO agregar nuevos strings hardcodeados. Si la constante no existe, crearla primero y regenerar con `node Glory/cli/glory.mjs schema:generate`.  
> Toda operación de datos DEBE canalizarse por repositorios o modelos. PROHIBIDO queries `$wpdb` directas en endpoints.

---

## APÉNDICE A: COLUMNAS POR TABLA (Referencia)

| Tabla | Columnas |
|-------|----------|
| `cap_centros` | id, user_id, nombre, direccion, telefono, email, logo_url, created_at, updated_at |
| `cap_alumnos` | id, centro_id, nombre, email, telefono, dni, horas_completadas, estado, created_at, updated_at |
| `cap_disponibilidad` | id, alumno_id, dia, hora, disponible, created_at, updated_at |
| `cap_clases` | id, centro_id, fecha, hora_inicio, hora_fin, asignatura, duracion_minutos, bloqueada, created_at |
| `cap_asistencia` | id, clase_id, alumno_id, asistio, created_at |
| `cap_configuracion` | id, centro_id, timezone, hora_inicio_manana, hora_fin_manana, hora_inicio_tarde, hora_fin_tarde, viernes_especial, hora_fin_viernes, alumnos_max_clase, duracion_clase, duracion_descanso, horarios_semanales, created_at, updated_at |
| `cap_suscripciones` | id, centro_id, stripe_customer_id, stripe_subscription_id, estado, fecha_inicio, fecha_fin, created_at, updated_at |

---

## LECCIONES APRENDIDAS

- [pages.php]: Props de página deben ser callbacks, no arrays estáticos (evaluación temprana de `wp_get_current_user()`).
- [API_BASE]: Centralizar URL base evita divergencia silenciosa entre 5+ hooks.
- [AbortController]: Pattern: `signal?: AbortSignal` param → fetch options → AbortError guard → useEffect cleanup.
- [ErrorMasking]: El patrón `catch { return` en JSON.parse impide que se ejecute el fallback posterior.
- [Schema]: Variables CSS están en `init.css`, no en `variables.css`. Cols generados están en `App/Config/Schema/_generated/`.
- [Transacciones]: `$wpdb->insert()` no lanza excepciones por sí solo, retorna `false`. Verificar siempre.
- [aiAnalyzer]: Crear un Set `REGLAS_CUBIERTAS_POR_ESTATICO` centralizado para suprimir reglas IA cubiertas por análisis estático.
- [useCalendario]: Hooks >120 ln aceptables si el dominio es indivisible (Generacion ~165, Movimiento ~150).
- [8.4 Repos]: Para transacciones cross-repo, el endpoint orquesta `START TRANSACTION`/`COMMIT`/`ROLLBACK`; repos ejecutan operaciones individuales. BaseRepository::conTransaccion() solo para operaciones single-repo.

---

## TO-DOs TÉCNICOS PENDIENTES (baja prioridad)

- [ ] Split `Alumno.php` (~578 ln) por dominio (CRUD, progreso, normalización)
- [ ] Split `StripeService.php` (~600 ln) por dominio (checkout, webhooks, config, encriptación)
- [ ] StripeService: Aplicar timezone en cálculos de fechas de suscripción
- [ ] Documentar impacto de cambiar timezone con clases existentes
- [ ] Evaluar ON DELETE CASCADE en FK constraints
- [ ] Extender generador para DDL MySQL, helpers de mapeo, validadores REST
