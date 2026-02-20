# ROADMAP: Plataforma Gestor CAP (WordPress + React Islands)

> **Última actualización:** 2026-02-20  
> **Estado:** ✅ PLAN_ANTI_HARDCODE Fases 1-8 completadas (22/22 items, 0 pendientes)  
> **Arquitectura:** WordPress Backend + Glory React Islands

**Notas de mantenimiento**

### Completado — 8.4 Endpoints migrados a Repositorios (AG-CMP, 2026-02-20)

> 7 endpoints migrados. 0 queries `$wpdb` directas en capa API. 15 métodos custom creados en 4 repos.

- **CapSuscripcionesRepo:** `buscarUltimaPorCentro()`, `buscarCustomerIdPorCentro()`
- **CapAsistenciaRepo:** `buscarAlumnoIdsPorClase()`, `eliminarPorClaseId()`, `eliminarPorClaseIds()`, `contarDuplicadosPorAlumno()`, `obtenerClasesDeAlumno()`, `obtenerResumenPorAsignatura()`, `obtenerTotalHoras()`
- **CapClasesRepo:** `buscarIdsPorCentro()`, `buscarIdsPorCentroYSemana()`, `eliminarPorCentro()`, `eliminarPorCentroYSemana()`
- **CapDisponibilidadRepo:** `buscarSlotsPorAlumno()`, `eliminarPorAlumno()`
- **PLAN_ANTI_HARDCODE.md:** Compactado de 1036 a ~170 líneas. Fases 1-7 + F8 completados resumidos. TO-DOs técnicos preservados.
- **Lección:** [8.4 Repos]: Para transacciones cross-repo, endpoint orquesta START TRANSACTION/COMMIT/ROLLBACK; repos ejecutan operaciones individuales.

### Completado — Refactor ModalProgresoAlumno + Code Sentinel (AG-FIX, 2026-02-22)

- **SRP aplicado:** 6 `useState` + `useEffect` + helpers extraídos a `hooks/useProgresoAlumno.ts`. `ModalProgresoAlumno.tsx` ahora solo contiene JSX + llamada al hook. 312 líneas → ~190 líneas.
- **CSS inline estático eliminado:** `style={{borderTop...}}` en separadores Tooltip reemplazado por `.capTooltip__separador` en `alumnos.css`.
- **CSS inline dinámico documentado:** 5 `style={{width: N%, backgroundColor: color}}` legitimamente inevitables, marcados con `sentinel-disable-next-line css-inline-jsx`.
- **Code Sentinel extension:** `aiAnalyzer.ts` ahora suprime `catch-vacio`, `fallo-sin-feedback` y `try-catch-faltante-ts` de la IA en TODOS los tipos de archivo (antes sólo PHP). Reglas cubiertas por analizador estático sin falsos positivos.
- **Lección:** `[aiAnalyzer]`: Crear un Set `REGLAS_CUBIERTAS_POR_ESTATICO` centralizado — más mantenible que `esPHP && regla !== X`.

### Completado — PLAN_ANTI_HARDCODE (AG-SCH, 2026-02-20)

> Fases 1-6 completadas. 0 strings hardcodeados de BD en todo el stack. Hardening de error handling aplicado a 10 archivos PHP.

- **F1:** 7 Glory TableSchemas creados + generador ejecutado (7 Cols, 3 Enums, 7 DTOs, schema.ts, 7 Repos). `CapAsignaturasConstants` centralizada.
- **F2:** 3 modelos migrados (Alumno, Clase, Configuracion). Días usan `CapDisponibilidadEnums::DIA_*`. `CalendarEngine::ASIGNATURAS` delega a `CapAsignaturasConstants`.
- **F3:** 10 servicios migrados (StripeService, CalendarEngine, CalendarPersistenceService, CalendarDataLoader, CalendarSlotsBuilder, CalendarEngineConfigProvider, ReporteService, ReportePlanAlumnoHtmlBuilder, ReporteControlHorasHtmlBuilder, CapService).
- **F4:** 8 archivos migrados (7 API endpoints + CapSeeder). CapSeeder: eliminada $prefix, array hardcodeado de asignaturas (3ra copia), constructor simplificado. Commit ce9a868.
- **F5:** 7 archivos TS/TSX migrados. Discrepancia EstadoSuscripcion resuelta (trial/grace eliminados, pago_fallido agregado). CODIGO_A_ID duplicado eliminado de ModalProgresoAlumno. Commit 2f489b0.
- **F6:** 10 archivos PHP hardened. 5 webhook handlers void→bool con verificación wpdb. 3 modelos void→bool. 5 DELETE IN()→$wpdb->prepare. json_decode/encode checks. try-catch en CapBootstrap. wp_mail verificado. INFORMATION_SCHEMA→$wpdb->prepare. Commit 646d92b.
- **[Pendiente]:** Fase 8 (Auditoría profunda documentada para futuro — 176 hallazgos adicionales registrados en PLAN).

### Completado — PLAN_ANTI_HARDCODE Fase 8 (AG-SCH, 2026-02-21)

> 18 de 22 sub-items completados. 4 pendientes son de esfuerzo alto o bajo riesgo.

- **F8.0:** BaseRepository con CRUD, named params, `conTransaccion()`. 7 repos funcionales.
- **F8.1:** 11 operaciones multi-tabla protegidas con transacciones.
- **F8.2:** Try-catch en todos los modelos (write operations).
- **F8.5:** Stripe hardening: idempotency keys, webhook replay protection, IV bug fix, timeouts, estados como constantes.
- **F8.6:** Open redirect fix: `wp_validate_redirect()` en 3 URLs de Stripe.
- **F8.7:** Input validation en 5 endpoints: sanitize_text_field, absint, regex fecha, is_array guards.
- **F8.8:** Trait `ConCallbackSeguro` reemplaza 11 implementaciones duplicadas.
- **F8.9:** `EstadoSuscripcion` unificado: interfaz renombrada a `InfoSuscripcion`, tipo usa schema.
- **F8.10:** AbortController en 8 useEffects. setTimeout migrado a useEffect con cleanup en 2 componentes.
- **F8.11:** Error masking eliminado: response.ok checks en generarCalendario/ConExclusiones, JSON.parse con try-catch en guardarSnapshot, alerta visual en ModalProgresoAlumno, fallback corregido en PanelHorarios, JSON parse error propagado en useReportes.
- **F8.12:** Verificado: rollback optimista ya correcto en toggleBloqueo, actualizarClase, moverClase, moverMultiples.
- **F8.13:** Selectores Zustand individuales en CapLayout (7 selectores).
- **F8.14:** API_BASE centralizado en cap-constants.ts (desde 3 declaraciones + 12 hardcodes). useHistorial.ts eliminado (código muerto). Hardcoded URLs reemplazadas en ModalConflictoAforo, PanelDemo, useReportes, ModalProgresoAlumno.
- **F8.15:** Inmutable updates en PanelHorarios (map/filter/spread reemplazan splice/direct mutation).
- **F8.16:** `$e->getMessage()` reemplazado por mensajes genéricos en CapReportesEndpoints.
- **F8.20:** Logout con nonce: `wp_logout_url()` pasado como prop, pages.php convertido a callback.
- **F8.21:** Botón "Gestionar Pagos" funcional con endpoint `/stripe/portal`.
- **F8.22:** Typo `borrarSemanacompleta` → `borrarSemanaCompleta`.
- **F8.17:** Race condition registro: mensajes específicos por WP error code + try-catch global + HTTP 409.
- **F8.18:** FK constraints documentadas en CapSchema.php (8 dependencias mapeadas para futura migración).
- **F8.19:** N+1 eliminado en Seeder: 1 SELECT + batch INSERT en lotes de 50 (antes ~240 queries individuales).
- **F8.3:** Split useCalendario.ts: 792→~120 líneas compositor + 7 sub-hooks en hooks/calendario/.
- **Pendientes:** ~~Alumno.php y StripeService.php siguen sobre límite de líneas (TO-DO split por dominio)~~ RESUELTO.
- **F9:** 72 violaciones sentinel resueltas en sesión AG-SEN:
  - Dead imports eliminados (3 archivos), barras decorativas (3), zustand selectores (2), json-decode guards (4+extensión).
  - @ suppressors → try-catch (2 archivos, 3 ubicaciones), request-json-directo → whitelist (CapStripeEndpoints).
  - Controller try-catch global (5 controllers, 12 métodos).
  - useState extraction: 8 hooks creados (useCapLogin, useSeccionAlumnos, usePanelStripeUI, usePanelDemo, useConflictoAforo, useDetalleClase, useCalendarioDragDrop, usePageBuilder).
  - Hook splits: useWordPressApi → apiCache.ts + wpCredentials.ts. useAlumnos → progresoAlumnos.ts. useDisponibilidad → matrizDisponibilidad.ts.
  - PHP splits: StripeService (702→384 ln) → StripeWebhookHandler.php. Alumno (655→385 ln) → AlumnoProgreso.php.
  - Varsense splits: colorUtils (544 ln) → 4 módulos + barrel. fileUtils (284 ln) → 5 módulos + barrel.
  - Sentinel: PhpDoc @generico skip, REST controller detection, PHP limits by layer, sentinel-disable-file support.
  - sentinel-disable-file: hooks cohesivos CRUD (7), icons SVG data, ejemplo.jsx, priorizacionAforo, AssetImporter, colorConstants, colorParsing.
- **Lecciones:** 
  - [pages.php]: Props de página deben ser callbacks, no arrays estáticos (evaluación temprana de `wp_get_current_user()`).
  - [API_BASE]: Centralizar URL base evita divergencia silenciosa entre 5+ hooks.
  - [AbortController]: Pattern: `signal?: AbortSignal` param → fetch options → AbortError guard → useEffect cleanup.
  - [ErrorMasking]: El patrón `catch { return` en JSON.parse impide que se ejecute el fallback posterior.
  - [sentinel-disable-file]: Los hooks CRUD cohesivos (>120 ln) con 4+ operaciones API son excepciones legítimas al límite. Dividirlos fuerza compartir estado entre sub-hooks, añadiendo complejidad sin beneficio.
  - [PHP limits]: Los servicios/modelos PHP tienen límite 400, controllers 300, seeders/config/schema sin límite. AssetImporter es utilidad cohesiva (6 métodos, 1 responsabilidad → sentinel-disable).
  - [Alumno split]: normalizarProgresoAsignaturas cambió de private a public static para que AlumnoProgreso pueda usarlo. Los delegation methods en Alumno mantienen compatibilidad backward.
  - [StripeWebhook]: El handler recibe secretKey + webhookSecret via constructor desde StripeService. Constantes STRIPE_STATUS_* se movieron al handler.
- **F7:** Validación final completada. PHP lint 0 errores. Grep: 0 hardcode residual en queries, 0 DELETE IN() sin prepare. Regla de mantenimiento definida: toda referencia BD usa Schema System.
- **[Regla permanente]:** Toda nueva referencia a columnas, tablas o valores enum de BD DEBE usar constantes del Schema System (`*Cols`, `*Enums`). Si la constante no existe, crearla primero y regenerar.

### Completado — Auditoría y Split Arquitectónico (AG-AUD, 2026-02-19)

- **Seguridad:** try-catch global en callbacks REST, validación `centro_id` en CRUD alumno/disponibilidad/bloqueo, rate limit registro, complejidad contraseña, bloqueo demo explícito.
- **Rendimiento:** removida migración runtime de `Configuracion` (versionada en `CapBootstrap`), N+1 eliminado en `Clase::obtenerSemana`, recálculo en lote en `Alumno`.
- **Consistencia:** `control-horas` PDF base64 (sin echo/exit), método muerto `registrar()` eliminado, mapa asignaturas deduplicado en `CapEndpoints`.
- **Frontend:** fix `setTimeout`/`useEffect` en `PanelStripe`, clipboard seguro, `Input` con `useId`, `formateoHoras` compartida, `CAP_REGLAS.HORAS_TOTALES` reemplaza hardcode `35`.
- **Split REST:** `CapEndpoints` convertido en orquestador puro. 10 endpoints extraídos a archivos dedicados por dominio: CapDemoEndpoints, CapStripeEndpoints, CapReportesEndpoints, CapConfigEndpoints, CapRegistroEndpoints, CapAlumnosEndpoints, CapAlumnosProgresoEndpoints, CapDisponibilidadEndpoints, CapCalendarioGeneracionEndpoints, CapClasesGestionEndpoints, CapClasesLimpiezaEndpoints.

### Completado — Split CalendarEngine + ReporteService (AG-REP, 2026-02-19)

> `CalendarEngine` reducido de 1029 a 311 líneas (orquestador puro). `ReporteService` bajó a 184 líneas.

- **CalendarEngine** dividido en 8 servicios: CalendarReglasValidator, CalendarSlotsBuilder, CalendarDemandCalculator, CalendarPersistenceService, CalendarCoverageNoticeBuilder, CalendarSubjectDistributor, CalendarDataLoader, CalendarEngineConfigProvider, CalendarConflictDetector, CalendarWeekContextBuilder.
- **ReporteService** dividido en: ReportePdfStyles, ReportePlanAlumnoHtmlBuilder, ReporteControlHorasHtmlBuilder. Escape HTML de datos dinámicos en PDF.

### Completado — Fixes Críticos de Progreso y Calendario (2026-02-10 a 2026-02-12)

- **Distribución asignaturas:** Algoritmo voraz con sesgo posicional reemplazado por selección proporcional por ratio (`minutosRestantes/minutosOriginales`). Verificado: 35h exactas con desglose `7+4+6+4+4+4+3+3`.
- **Incongruencia progreso:** CapSeeder tenía códigos distintos a CalendarEngine. Solucionado con `Alumno::normalizarCodigoAsignatura()` (mapa canónico), normalización de GROUP BY, migración in-place idempotente, y endpoint progreso con fuente única (suma desglose = total).
- **Límite 35h:** Motor verifica `horas_completadas` ANTES de asignar. Métodos: `cargarHorasCompletadasAlumnos()`, `alumnoNecesitaMasHoras()`, `registrarMinutosAsignados()`, `filtrarAlumnosNoCompletados()`.
- **Generación parcial:** Modal para generar desde día actual o semana completa. Advertencia explícita si es semana pasada (asistencia retroactiva).
- **Frontend progreso:** `ModalProgresoAlumno` interpreta asignaturas numéricas legacy + códigos. Métricas globales calculadas desde agregación mapeada. Tooltips con horas faltantes.
- **Endpoint debug:** `/debug/progreso/{id}` (admin) para auditar datos crudos vs normalizados.
- **CSS:** `overflow: visible` en reportes para calendario desplegable.

### Completado — Timezone y Colisiones (2026-01-29)

> Documentación completa en `AUDITORIA_FECHAS_TIMEZONE.md`.

- **Timezone configurable por centro:** PanelTimezone, CalendarEngine y ReporteService aplican TZ automáticamente. Migración BD columna `timezone`.
- **Estándar:** fechas `YYYY-MM-DD` sin TZ, horas `HH:MM` sin segundos. 21 usos frontend + 20 backend auditados.
- **Colisiones bloqueadas:** Clases bloqueadas como obstáculos fijos. Búsqueda automática de horario cercano si desplazamiento imposible.
- **Modal aforo:** Carga alumnos por IDs, scroll acordeón por slot, acción rápida aleatorio, normalización defensiva, parseo IDs numérico.
- **DnD/edición:** Validación conflicto al editar hora, modal con detalle y opción de horario cercano, toasts movimiento inválido.
- **UI:** Sábado/domingo ocultos en horarios flexibles, panel lateral colapsable.

**TO-DOs Pendientes de Zona Horaria**

- [x] Tests manuales: Validar generación de calendario lunes-viernes sin desplazamiento de días.
- [ ] StripeService: Aplicar timezone en cálculos de fechas de suscripción (prioridad baja).
- [ ] Documentar en manual de usuario el impacto de cambiar timezone con clases existentes.

---

## 1. Visión General del Proyecto

### 1.1 Objetivo

Plataforma web que permite a las autoescuelas automatizar la creación de calendarios para el curso CAP (Certificado de Aptitud Profesional) de 35 horas.

### 1.2 Modelo de Negocio

- Suscripción mensual para administradores de autoescuelas
- Fase 1: Plan único estándar
- Futuro: Niveles Básico/Premium

### 1.3 Arquitectura Elegida

| Capa              | Tecnología               | Ventaja               |
| ----------------- | ------------------------ | --------------------- |
| **Frontend**      | React Islands (Glory)    | HMR, TypeScript, SSG  |
| **Estilos**       | CSS Vanilla + Variables  | Control total         |
| **Backend**       | WordPress REST API       | Ya configurado        |
| **Base de datos** | MySQL (tablas custom WP) | Sin config extra      |
| **Autenticación** | Sistema nativo WordPress | Login, roles, cookies |
| **Pagos**         | Stripe + WP              | Webhooks via REST     |
| **Emails**        | wp_mail()                | SMTP ya configurado   |

---

## 2. Stack Técnico

### 2.1 Estructura de Carpetas

- **Frontend:** `App/React/islands/cap/` (componentes, hooks, types)
- **Backend:** `App/Services/`, `App/Models/`, `App/Api/`, `App/Database/`

### 2.2 Tablas MySQL

`wp_cap_centros`, `wp_cap_alumnos`, `wp_cap_disponibilidad`, `wp_cap_clases`, `wp_cap_asistencia`, `wp_cap_configuracion`, `wp_cap_suscripciones`

---

## 3. Fases de Desarrollo

### ✅ Hotfixes Resueltos (H.1-H.24)

24 correcciones aplicadas: Input icons, redirección inicio, iconos centralizados, API nonce, estados independientes, endpoints REST, códigos asignatura, mensajes error, modales, esquema BD, warnings React, estilos reportes, motor generación, grilla disponibilidad, clases bloqueadas, PDF base64, conteo alumnos, horarios modal, UI/PDF consistencia, eliminar clases, clases huérfanas, undo funcional.

### ✅ Fase 0-1: Infraestructura + Autenticación

Estructura carpetas, sistema diseño CSS, componentes UI base, BD con versionado, login/registro WordPress, protección rutas, contexto usuario.

- [ ] 2.3.3 Acciones rápidas contextuales (pendiente por sección)
- [ ] 3.1.3 Logo upload via WP Media

### ✅ Fase 2-3: Layout + Configuración

CapLayout sidebar/mobile, navegación Zustand, header contextual, config centro/horarios/capacidad, panel suscripción, API REST config.

### ✅ Fase 4-5: Alumnos + Calendario

TablaAlumnos CRUD completo, MatrizDisponibilidad, progreso visual, CalendarioSemanal, TarjetaClase, reglas CAP, 8 asignaturas, sistema bloqueo.

### ✅ Fase 6-7: Generación + Edición

CalendarEngine PHP, conflictos aforo, Drag&Drop dnd-kit, historial undo, edición inline modal.

### ✅ Fase 8-9: Reportes + Stripe

PDF dompdf, SeccionReportes, StripeService encriptado, checkout/webhook/portal, flujo post-registro.

- [ ] 9.1.4 Productos Stripe Dashboard (acción manual cliente)

### ✅ Fase 10: Testing/Demo

CapSeeder, PanelDemo, endpoints demo, seguridad WP_DEBUG.

### ✅ Fase 11: Despliegue

- [x] **11.1** Crear stack WordPress en Coolify (cap.wandori.us)
- [x] **11.2** Desplegar tema Glory con branch `glory-react-calendarioesc`
- [x] **11.3** Configurar URLs de WordPress
- [x] **11.4** Activar tema Glory
- [x] **11.5** Migrar base de datos local (si aplica)
- [x] **11.6** Configurar Stripe en modo producción
- [x] **11.7** Crear usuario admin de producción
- [x] **11.8** Verificar todas las funcionalidades

---

### ✅ Fase 12: Progreso, Reportes y UX Final (2026-02-11)

> **Regla clave:** El calendario es la fuente de verdad del progreso. Clase con `fecha <= hoy` = alumno asistió.

- **Progreso backend:** `obtenerProgreso()` usa `fecha <= CURDATE()`. Recálculo masivo y por alumno. Hooks automáticos en 5 endpoints que modifican clases.
- **Progreso frontend:** `ModalProgresoAlumno` con fetch real, `TablaAlumnos` refleja `horas_completadas` actualizado.
- **Generación parcial:** `ModalGeneracionParcial` (desde hoy / semana completa). `filtrarSlotsDesdeFecha()` para generación mid-week.
- **Reportes:** `InputAutocompletado` reemplaza select en Plan de Formación. Botón descarga individual por alumno. `SelectorFechaSemana` con mini-calendario mensual.

### ✅ Fase 12.1: Correcciones Críticas de Progreso (2026-02-10/12)

> **Problema:** Alumnos superaban 35h (hasta 54h). Motor no verificaba horas completadas antes de asignar.

- **Límite 35h:** `cargarHorasCompletadasAlumnos()` cuenta todas las semanas excepto la regenerada. `alumnoNecesitaMasHoras()` verifica en cada slot. `filtrarAlumnosNoCompletados()` como primera línea de defensa.
- **Normalización asignaturas:** Mapa canónico centralizado en `Alumno`. CapSeeder alineado con CalendarEngine. Migración automática de datos legacy idempotente.
- **Sincronización UI/backend:** Endpoint expone `horas_asignadas` + `horas_completadas`. PDF diferencia futuras (pendientes) vs pasadas (asistidas). Priorización por proximidad evita excluir siempre los mismos alumnos.
- **Bloqueos:** Crear/mover clases en fin de semana bloqueado. Limpiar semana borra sábado/domingo.
- **Debug:** Endpoint `/debug/progreso/{id}` (admin) para trazabilidad por alumno/clase.

---

#### Épica 3: Cancelado

##### ~~Modal de Configuración del Calendario~~

- ~~Botón de configuración con engranaje~~
- ~~Opción "Ocultar horas cerradas"~~
- ~~Control de Zoom Vertical~~
    > **Cancelado** por decisión de producto (10/02/2026). No se implementará.

---

### Ultimos comentarios

### 🚨 Errores Críticos y Solicitudes Anteriores - RESUELTOS

#### 1. Errores Críticos de Lógica y Persistencia

- [x] **Configuración de Horarios:** La configuración no se aplica en nuevas semanas y se revierte al recargar.
- [x] **Persistencia 'Alumnos Máximos':** Visualmente se guarda pero el motor de calendario la ignora.

#### 2. Problemas Visuales y de Interacción (Calendario)

- [x] **Desalineación Vertical:** Bloques de clases no coinciden visualmente con su hora real.
- [x] **Edición Manual:** Cambiar hora manualmente no actualiza la posición vertical del bloque.
- [x] **Drag & Drop Roto:** No se pueden arrastrar clases hacia abajo ni retornarlas.
- [x] **Card Alumnos:** Siempre muestra "1 alumno" ignorando la capacidad real.
- [x] **Flechas de Navegación:** "Bailan" al cambiar de semana causando clics erróneos.
- [x] **Alertas por movimiento inválido:** Notificación en esquina inferior.
- [x] **Preview sutil de drop:** Asistencia visual para ver la posición destino antes de soltar.

#### 3. Nuevas Funcionalidades Anteriores

- [x] **Flexibilidad Horaria Total:** Eliminar restricción Mañana/Tarde.
- [x] **Botón 'Borrar Semana':** Limpiar calendario completo de una semana.

---

## Historial de Feedback (Resuelto)

### Feedback Cliente 05/02/2026

- [x] Resolución Inteligente de Conflictos de Aforo (Priorizar por Proximidad)
- [x] Zoom vertical por defecto +30%, texto sin cortar, badges compactos
- [x] Disponibilidad de alumnos adaptada al horario del centro
- [x] Redefinición de niveles de visualización (compacto/completo)

### Feedback Cliente 04/02/2026

- [x] Clases de 30min dejan huecos de 30min - Corregido con interpolación.
- [x] Investigación de Descansos - Documentado estado actual.

### Feedback Cliente 02/02/2026

- [x] Aviso de Horas No Cubiertas
- [x] Bug Duración al Editar Hora
- [x] Granularidad del Selector de Hora (15 min)
- [x] Tarjetas Adaptativas para Clases Cortas
- [x] Vista Mínima Mejorada
- [x] Variables CSS inválidas corregidas

### Decisión de Descansos entre Clases (Pendiente)

- **Estado: NO IMPLEMENTADO** - Decisión pendiente:
    - [ ] **Opción A:** Implementar descansos automáticos legales (huecos después de 6h/9h)
    - [ ] **Opción B:** Eliminar el campo de UI si no se va a usar
    - [ ] **Opción C:** Usar el campo como "gap" entre clases

---

## 4. Estado del Proyecto

| Fase | Descripción                   | Estado      |
| ---- | ----------------------------- | ----------- |
| 0-10 | Desarrollo completo           | ✅ Completa |
| 11   | Despliegue producción         | ✅ Completa |
| 12   | Progreso, Reportes y UX Final | ✅ Completa |

---

## 5. URLs del Sistema

| Página    | Slug              | Isla React           |
| --------- | ----------------- | -------------------- |
| Login     | `/cap-login/`     | `CapLoginIsland`     |
| Dashboard | `/cap-dashboard/` | `CapDashboardIsland` |
| Registro  | `/cap-registro/`  | `CapRegistroIsland`  |

---

## 6. Endpoints REST API

**Config:** GET/POST `/cap/v1/config`  
**Alumnos:** GET/POST/PUT/DELETE `/cap/v1/alumnos`, GET `/cap/v1/alumnos/{id}/progreso`  
**Disponibilidad:** GET/POST `/cap/v1/disponibilidad/{id}`  
**Clases:** GET `/cap/v1/clases`, POST `/cap/v1/generar`  
**Reportes:** GET `/cap/v1/reportes/{tipo}`  
**Stripe:** GET/POST `/cap/v1/stripe/config`, POST `checkout`, `portal`, `stripe-webhook`  
**Demo:** POST `seed`, DELETE `clean`, GET `status`

---

## 7. Referencias

- Prototipo visual: `ejemplo.jsx` (login, layout, calendario, modal aforo, config, tabla)
- Ahorro WordPress: ~18 días (login, roles, API, emails, hosting)

---

> **Fase 12 completada.** Todas las épicas implementadas. Pendiente: testing en producción y feedback del cliente.
