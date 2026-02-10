# ROADMAP: Plataforma Gestor CAP (WordPress + React Islands)

> **Última actualización:** 2026-02-10  
> **Estado:** 🔧 Fase 12 - Progreso, Reportes y UX Final  
> **Arquitectura:** WordPress Backend + Glory React Islands

**Notas de mantenimiento**

- 2026-01-29: **FIX CRÍTICO: Sistema de colisiones con clases bloqueadas** - Corregido manejo de desplazamientos cuando hay clases bloqueadas en el camino. Las clases bloqueadas ahora actúan como obstáculos fijos que no se mueven. Si el desplazamiento es imposible, el sistema busca automáticamente el horario más cercano disponible.
- 2026-01-29: **AUDITORÍA COMPLETA DE FECHAS/ZONA HORARIA** - Implementado sistema de timezone configurable por centro. Ver `AUDITORIA_FECHAS_TIMEZONE.md` para detalles completos.
- 2026-01-29: Nuevo componente PanelTimezone en configuración con selector de zonas horarias comunes.
- 2026-01-29: Backend (CalendarEngine y ReporteService) ahora aplica timezone del centro automáticamente.
- 2026-01-29: Migración automática de BD para agregar columna `timezone` en tabla `cap_configuracion`.
- 2026-01-29: Estándar único definido: fechas `YYYY-MM-DD` sin TZ, horas `HH:MM` sin segundos.
- 2026-01-29: Fix crítico en modal de aforo - parsear IDs de alumnos a número para matching correcto.
- 2026-01-29: Logs de depuración en modal de aforo para diagnosticar problema con lista de alumnos vacía.
- 2026-01-29: Ajuste de colisiones DnD y toasts de movimiento inválido.
- 2026-01-29: Validación de conflicto al editar hora en modal y normalización de formato HH:MM.
- 2026-01-29: Fix de colisiones al editar hora y parseo local de fecha en clasesPorDia.
- 2026-01-29: Modal de conflicto en edición con detalle de clase y opción de horario cercano.
- 2026-01-29: Ocultar sábado/domingo en horarios flexibles y permitir colapsar el panel lateral.
- 2026-01-29: Modal de aforo ahora carga alumnos por IDs para mostrar la lista de exclusión.
- 2026-01-29: Normalización defensiva de alumnos y fecha en conflictos de aforo.
- 2026-01-29: UX modal de aforo con scroll único y acordeón por slot; limpieza de logs y endpoint dedicado de alumnos por IDs.
- 2026-01-29: Corrección de fecha local en modal de aforo y acción rápida para resolver aleatorio.

**Plan de revisión profunda de fechas y zona horaria**
✅ **COMPLETADO** - Ver documento completo en `AUDITORIA_FECHAS_TIMEZONE.md`

1. ✅ Auditoría de parsing de fechas/horas en frontend (React): 21 usos identificados y clasificados.
2. ✅ Auditoría de fechas/horas en backend (PHP): 20+ usos normalizados con timezone.
3. ✅ Inventario de endpoints y payloads: mapa completo documentado.
4. ✅ Estándar único definido: fechas `YYYY-MM-DD` sin TZ, horas `HH:MM` sin segundos; TZ fija por centro configurable.
5. ✅ Normalización aplicada: CalendarEngine y ReporteService usan timezone del centro.
6. ✅ Documentación completa: Riesgos, puntos críticos y casos de prueba en `AUDITORIA_FECHAS_TIMEZONE.md`.

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

### � Fase 12: Progreso, Reportes y UX Final (EN PROGRESO)

> **Fuente:** Feedback cliente 10/02/2026 + Evaluación interna

---

#### Épica 1: Sistema de Progreso de Alumnos (CRÍTICO - Bug principal)

**Diagnóstico del problema:**
El progreso de todos los alumnos se muestra en 0%. Después de investigar el código, se identifican **dos causas raíz:**

1. **`horas_completadas` en `wp_cap_alumnos` es un campo estático** que nunca se actualiza automáticamente. El frontend (`TablaAlumnos`, `ModalProgresoAlumno`) lee `alumno.horas_completadas` que siempre es `0` porque ningún proceso lo recalcula.
2. **`asistio` siempre es `0`** en `wp_cap_asistencia`. Al generar clases en `CalendarEngine::crearClases()`, cada registro de asistencia se inserta con `'asistio' => 0`. No existe ningún mecanismo automático que marque la asistencia como completada.

**Diseño propuesto: El calendario como fuente de verdad**

La lógica actual espera que alguien marque asistencia manualmente (`asistio = 1`), pero eso no tiene sentido en este contexto (el alumno fue asignado por el sistema a esa clase). El enfoque correcto es:

> **Regla:** Si una clase existe en el calendario y su fecha es **<= hoy**, el alumno asistió. El calendario ES la fuente de verdad.

Esto simplifica enormemente el sistema y elimina el estado fantasma de `asistio`.

##### 12.1.1 Backend: Recalcular progreso en tiempo real 🔴

- [ ] **Nuevo método `Alumno::calcularProgresoReal(int $alumnoId): array`**
    - Consulta: `SELECT asignatura, SUM(duracion_minutos)/60 as horas FROM cap_clases c JOIN cap_asistencia a ON c.id = a.clase_id WHERE a.alumno_id = ? AND c.fecha <= CURDATE() GROUP BY c.asignatura`
    - No depende de `asistio`. Toda clase con fecha pasada cuenta como completada.
    - Devuelve progreso real desglosado por asignatura.
- [ ] **Nuevo método `Alumno::recalcularHorasCompletadas(int $alumnoId): float`**
    - Calcula `SUM(duracion_minutos)/60` de todas las clases con `fecha <= CURDATE()` del alumno.
    - Actualiza el campo `horas_completadas` en `wp_cap_alumnos` como cache.
- [ ] **Endpoint GET `/cap/v1/alumnos/{id}/progreso`** para obtener progreso detallado por asignatura.
- [ ] **Hook en `CalendarEngine::crearClases()`** para recalcular `horas_completadas` de cada alumno afectado después de generar.
- [ ] **Hook en eliminación de clases** para recalcular progreso cuando se borran clases.

##### 12.1.2 Frontend: Mostrar progreso real 🔴

- [ ] **`ModalProgresoAlumno`**: Eliminar `generarProgresoMock()`. Llamar al nuevo endpoint `/alumnos/{id}/progreso` para obtener datos reales.
- [ ] **`TablaAlumnos`**: La barra de progreso debe reflejar el valor actualizado de `horas_completadas` (que ahora sí se recalcula).
- [ ] **`SeccionAlumnos`**: Al abrir el modal de progreso, disparar fetch al endpoint real.

##### 12.1.3 Generación inteligente por fecha actual 🟡

- [ ] **Detección de día actual en generación:** Cuando se pulsa "Generar", el sistema detecta si hoy NO es lunes.
    - **Si es lunes:** Genera la semana completa (lunes a viernes) normalmente.
    - **Si es otro día (ej. jueves):**
        1. Mostrar modal con dos opciones:
            - **"Generar desde hoy":** Solo genera clases de jueves a viernes.
            - **"Generar semana completa":** Genera lunes a viernes, pero muestra un segundo modal de advertencia.
        2. El segundo modal (si se elige semana completa) avisa:
            > "Se asumirá que todos los alumnos asignados a clases de lunes a miércoles asistieron. Su progreso se actualizará automáticamente. ¿Continuar?"
- [ ] **Frontend:** Nuevo `ModalGeneracionParcial` con las dos opciones.
- [ ] **Backend:** `CalendarEngine::generar()` recibe parámetro opcional `$fechaDesde` para generar solo desde esa fecha.

##### 12.1.4 Recálculo retroactivo al regenerar 🟡

- [ ] Si se regenera una semana que ya pasó (o parcialmente pasada), el sistema debe:
    1. Eliminar clases no bloqueadas de esa semana (ya lo hace).
    2. Crear las nuevas clases.
    3. Recalcular `horas_completadas` de TODOS los alumnos afectados.
- [ ] Si se eliminan clases individuales, también recalcular el progreso del alumno afectado.

---

#### Épica 2: Mejoras en Reportes 🟢

##### 12.2.1 Buscador de alumnos en Plan de Formación

- [ ] **Reemplazar `<select>` por input con autocompletado** en la tarjeta "Plan de Formación" de `SeccionReportes`.
    - Input de texto con filtro en tiempo real sobre la lista de alumnos.
    - Dropdown con resultados filtrados.
    - Selección por click o teclado (Enter/flechas).
    - Mostrar nombre + horas completadas en cada opción.
    - Componente reutilizable: `BuscadorAlumnos` o `InputAutocompletado`.

##### 12.2.2 Botón de descarga individual en panel de alumnos

- [ ] **Agregar botón "Descargar Reporte" en cada fila de `TablaAlumnos`**.
    - Icono de descarga junto a las acciones existentes (editar, eliminar, disponibilidad, progreso).
    - Al hacer click, descarga directamente el PDF de Plan de Formación del alumno.
    - Reutilizar `useReportes::descargarPlanAlumno()`.

##### 12.2.3 Calendario en Control de Horas

- [ ] **Reemplazar las flechas de navegación por un selector de fecha con calendario** en la tarjeta "Control de Horas" de `SeccionReportes`.
    - Al hacer click en la fecha actual se abre un date picker (calendario visual).
    - Permite saltar a cualquier semana directamente sin navegar flecha por flecha.
    - Mantener las flechas como navegación rápida adicional.
    - El calendario muestra semanas (seleccionar cualquier día selecciona su semana).

---

#### Épica 3: Cancelado

##### ~~Modal de Configuración del Calendario~~

- ~~Botón de configuración con engranaje~~
- ~~Opción "Ocultar horas cerradas"~~
- ~~Control de Zoom Vertical~~
    > **Cancelado** por decisión de producto (10/02/2026). No se implementará.

---

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
| 12   | Progreso, Reportes y UX Final | 🔧 En curso |

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

> **Siguiente paso:** Iniciar **Épica 1** (12.1.1) - Recálculo de progreso en backend.
