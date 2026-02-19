# ROADMAP: Plataforma Gestor CAP (WordPress + React Islands)

> **Última actualización:** 2026-02-20  
> **Estado:** ✅ PLAN_ANTI_HARDCODE Fases 1-7 completadas (plan cerrado)  
> **Arquitectura:** WordPress Backend + Glory React Islands

**Notas de mantenimiento**

### Completado — PLAN_ANTI_HARDCODE (AG-SCH, 2026-02-20)

> Fases 1-6 completadas. 0 strings hardcodeados de BD en todo el stack. Hardening de error handling aplicado a 10 archivos PHP.

- **F1:** 7 Glory TableSchemas creados + generador ejecutado (7 Cols, 3 Enums, 7 DTOs, schema.ts, 7 Repos). `CapAsignaturasConstants` centralizada.
- **F2:** 3 modelos migrados (Alumno, Clase, Configuracion). Días usan `CapDisponibilidadEnums::DIA_*`. `CalendarEngine::ASIGNATURAS` delega a `CapAsignaturasConstants`.
- **F3:** 10 servicios migrados (StripeService, CalendarEngine, CalendarPersistenceService, CalendarDataLoader, CalendarSlotsBuilder, CalendarEngineConfigProvider, ReporteService, ReportePlanAlumnoHtmlBuilder, ReporteControlHorasHtmlBuilder, CapService).
- **F4:** 8 archivos migrados (7 API endpoints + CapSeeder). CapSeeder: eliminada $prefix, array hardcodeado de asignaturas (3ra copia), constructor simplificado. Commit ce9a868.
- **F5:** 7 archivos TS/TSX migrados. Discrepancia EstadoSuscripcion resuelta (trial/grace eliminados, pago_fallido agregado). CODIGO_A_ID duplicado eliminado de ModalProgresoAlumno. Commit 2f489b0.
- **F6:** 10 archivos PHP hardened. 5 webhook handlers void→bool con verificación wpdb. 3 modelos void→bool. 5 DELETE IN()→$wpdb->prepare. json_decode/encode checks. try-catch en CapBootstrap. wp_mail verificado. INFORMATION_SCHEMA→$wpdb->prepare. Commit 646d92b.
- **[Pendiente]:** Fase 8 (Auditoría profunda documentada para futuro — 176 hallazgos adicionales registrados en PLAN).
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
