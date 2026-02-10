# ROADMAP: Plataforma Gestor CAP (WordPress + React Islands)

> **Última actualización:** 2026-02-10  
> **Estado:** ✅ Fase 12.1 - Correcciones Críticas de Progreso  
> **Arquitectura:** WordPress Backend + Glory React Islands

**Notas de mantenimiento**

- 2026-02-10: **FIX CRÍTICO: Motor de generación respeta límite 35h por alumno** - `CalendarEngine::distribuirAsignaturas()` ahora verifica las horas completadas de cada alumno ANTES de asignarle clases. Nuevos métodos `cargarHorasCompletadasAlumnos()`, `alumnoNecesitaMasHoras()` y `registrarMinutosAsignados()` para trackear el progreso durante la generación.
- 2026-02-10: Alumnos con ≥35 horas completadas ya no reciben más clases en nuevas generaciones.
- 2026-02-10: Nuevo método `Alumno::filtrarAlumnosNoCompletados()` para filtrar alumnos que ya terminaron el curso.
- 2026-02-10: Modal de advertencia para generar en semana pasada - ahora muestra claramente que se asumirá asistencia retroactiva.
- 2026-02-10: Recálculo automático de progreso antes de filtrar alumnos en generación para datos actualizados.
- 2026-02-10: CSS fix para que el calendario desplegable del SelectorFechaSemana no se corte en las tarjetas de reportes.
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

### ✅ Fase 12: Progreso, Reportes y UX Final (COMPLETADA)

> **Fuente:** Feedback cliente 10/02/2026 + Evaluación interna
> **Completada:** 2026-02-11

---

#### Épica 1: Sistema de Progreso de Alumnos ✅

**Problema resuelto:** Progreso siempre en 0% — `horas_completadas` nunca se recalculaba y `asistio` siempre era 0.

**Solución implementada: El calendario como fuente de verdad.**

> **Regla:** Si una clase existe en el calendario y su fecha es **<= hoy**, el alumno asistió. El calendario ES la fuente de verdad.

##### 12.1.1 Backend: Recalcular progreso en tiempo real ✅

- [x] `Alumno::obtenerProgreso()` corregido — Usa `fecha <= CURDATE()` en vez de `asistio = 1`.
- [x] `Alumno::recalcularHorasCompletadas()` — Suma duración de clases pasadas, actualiza cache en BD.
- [x] `Alumno::recalcularProgresoCentro()` y `recalcularProgresoAlumnos()` — Recálculo masivo.
- [x] Endpoint GET `/cap/v1/alumnos/{id}/progreso` con desglose por asignatura.
- [x] Hooks de recálculo en 5 endpoints: generarCalendario, generarConExclusiones, eliminarClase, eliminarTodasLasClases, eliminarClasesSemana.

##### 12.1.2 Frontend: Mostrar progreso real ✅

- [x] `ModalProgresoAlumno` reescrito — Eliminado mock, fetch real al endpoint `/alumnos/{id}/progreso`.
- [x] `TablaAlumnos` refleja `horas_completadas` actualizado por los hooks de recálculo.
- [x] `SeccionAlumnos` dispara fetch al endpoint real al abrir modal de progreso.

##### 12.1.3 Generación inteligente por fecha actual ✅

- [x] Backend: `CalendarEngine::generar()` acepta `$fechaDesde` opcional, `filtrarSlotsDesdeFecha()` elimina slots anteriores.
- [x] Frontend: `ModalGeneracionParcial` con dos opciones (generar desde hoy / semana completa).
- [x] `SeccionCalendario` detecta día de la semana e intercepta generación si no es lunes.
- [x] `useCalendario.generarCalendario(fechaDesde?)` pasa parámetro opcional al backend.

##### 12.1.4 Recálculo retroactivo al regenerar ✅

- [x] Todos los endpoints que modifican clases tienen hooks de recálculo automático.
- [x] Regenerar semana pasada recalcula horas_completadas de todos los alumnos afectados.
- [x] Eliminar clases individuales también recalcula progreso del alumno.

---

#### Épica 2: Mejoras en Reportes ✅

##### 12.2.1 Buscador de alumnos en Plan de Formación ✅

- [x] Componente `InputAutocompletado` reutilizable con filtro en tiempo real, navegación teclado, botón limpiar.
- [x] Reemplazado `<select>` por autocompletado en `SeccionReportes`.
- [x] Muestra nombre + horas completadas + DNI en cada opción.

##### 12.2.2 Botón de descarga individual en panel de alumnos ✅

- [x] `IconoDescargar` añadido al sistema de iconos.
- [x] Botón de descarga en cada fila de `TablaAlumnos` con estado de carga individual.
- [x] Reutiliza `useReportes::descargarPlanAlumno()` desde `SeccionAlumnos`.

##### 12.2.3 Calendario en Control de Horas ✅

- [x] Componente `SelectorFechaSemana` con mini-calendario mensual desplegable.
- [x] Click en rango de fechas abre calendario visual. Seleccionar cualquier día elige su semana.
- [x] Mantiene flechas de navegación rápida.
- [x] Día actual con indicador visual, semana seleccionada resaltada.

---

### ✅ Fase 12.1: Correcciones Críticas de Progreso (2026-02-10)

> **Problema identificado:** Alumnos superaban las 35 horas del curso (algunos con 54h+ de 35h máximas).
> **Causa raíz:** El motor de calendario no verificaba las horas completadas de cada alumno antes de asignarle más clases.

#### 12.1.1 Motor de generación respeta límite 35h por alumno ✅

- [x] `CalendarEngine::cargarHorasCompletadasAlumnos()` — Cuenta TODAS las clases (pasadas + futuras) excluyendo la semana que se regenera.
- [x] `CalendarEngine::alumnoNecesitaMasHoras()` — Verifica si un alumno puede recibir más horas (completadas + asignadas < 35h).
- [x] `CalendarEngine::registrarMinutosAsignados()` — Trackea minutos asignados durante la generación.
- [x] `CalendarEngine::distribuirAsignaturas()` — Ahora filtra alumnos elegibles en CADA slot según su progreso acumulado.
- [x] `Alumno::filtrarAlumnosNoCompletados()` — Filtro inicial en endpoints como primera línea de defensa.
- [x] Endpoints `generarCalendario` y `generarConExclusiones` ahora recalculan progreso antes de filtrar.
- [x] Si todos los alumnos ya completaron las 35h, se retorna mensaje informativo en lugar de generar vacío.
- [x] **FIX:** Consulta SQL ahora cuenta clases de TODAS las semanas (no solo `fecha <= hoy`), excluyendo la semana actual que se regenera.
- [x] **FIX:** El filtro de alumnos ahora usa horas totales asignadas (pasadas + futuras), excluyendo la semana regenerada.

#### 12.1.2 Modal de advertencia para semana pasada ✅

- [x] Detección de `esSemanaAnterior` en `SeccionCalendario` — compara si el viernes de la semana ya pasó.
- [x] Modal de advertencia explícita al generar en semana anterior con confirmación obligatoria.
- [x] Texto claro: "Se asumirá que todos los alumnos asignados asistieron a dichas clases".

#### 12.1.3 CSS SelectorFechaSemana ✅

- [x] `overflow: visible` en `.capReportesGrid` y `.capReporteTarjeta` para evitar que el calendario desplegable se corte.

#### 12.1.4 Desincronizacion de progreso UI vs backend (en investigacion)

 - [x] Progreso en frontend aparece en 0h mientras backend acumula horas.
 - [x] Se detecta borrado de clases con horas persistiendo en backend.
 - [x] Revisar fuentes de verdad: cache `horas_completadas` vs calculo en tiempo real.
 - [x] Auditar endpoints de progreso y queries de conteo por alumno.
 - [x] Endpoint de progreso ahora expone horas asignadas y completadas.
 - [x] Modal muestra horas asignadas (plan) y completadas (real).
 - [x] Tabla de alumnos usa `horas_asignadas` para evitar progreso vacío.

---

#### Épica 3: Cancelado

##### ~~Modal de Configuración del Calendario~~

- ~~Botón de configuración con engranaje~~
- ~~Opción "Ocultar horas cerradas"~~
- ~~Control de Zoom Vertical~~
    > **Cancelado** por decisión de producto (10/02/2026). No se implementará.

---

### Ultimos comentarios

## Mi evaluación

1. Sobre el progreso de los alumnos, esto me genera conflicto, porque, claro, no esta dejando claro como debe resolverse este problema, pero surgen 2 cuestiones.

1.2 El botón de generar genera la semana entera sin importar que los dias hayan pasado, asi que esto genera un conflicto, si hoy es jueves, entonces se genera la clase y se asume que los dias anteriores de la semana esos alumnos asistieron. ¿Como es posible si se genero el jueves? Es dificil dar por hecho de que siempre se va a generar el lunes, y tambien de que no se va a regenerar despues, y de que no se van agregar mas alumnos a mitad de semana, el sistema esta dando por hecho de que siempre va ser un lunes, y no se va a regenerar despues el horario. A que lleva esto, simplificación, al generar el horario, si es lunes obviamente lo generará normal, si es un dia de semana, preguntar si generar apartir de solo ese día o el horario completo, si se elige el horario completo pasa al siguiente modal avisa que asumirá que todos los alumnos de los dias posteriores a la semana actual asistieron a clase y su progreso se actualizará. 
1.3 No se si el mecanismo realmente esta funcionando pero ciertamente la semana anterior tenia alumnos y paso la semana y no se actualizo el progreso, doy por hecho de que no funciona, entonces, la cuestión es revisar profundamente esta cuestión, esta muy relacionado con 1.2, porque incluye que si se genera un calendario la semana anterior tambien se asume todos esos alumnos asistieron, y sistema debe actualizar el progreso real basandose en la fecha actual y las clases existente para calcular el progreso, no esperar que la semana termine, tiene que ser si hoy es 10 de febrero y clases de 1 a 10 de febrero, todo eso presenta un progreso, y debe actualizarse con cada cambio, si se elimina una clase entonces se elimina el progreso que representaba esas clases, el calendario ahora la fuente de la verdad para representar el progreso de cada alumno.

Sobre el punto 1 si hay otra logica mejor que esta, por favor plantearla 

2. Esta bien lo que dice agregar un buscador, lo mejor sería agregar un boton adicional en el panel de alumnos para que descargar el reporte de ese alumno.
3. Creo que dando click a la fecha podría abrirse un calendario para cambiar de fecha.

## Comentario de cliente

Hola Wan! He revisado todos las correcciones que has hecho y está fantástico. Todo bien! He visto lo siguiente:
- El progreso de los alumnos no avanza, se queda siempre en 0%. Hay alumnos que completaron clases la semana pasada pero la barra de porcentaje no avanza a pesar de que ya han completado algunas clases. 
En cuanto a la pestaña de Reportes:
- En Plan de Formación todo está bien, no hay que hacer nada, pero estaría bien añadir un buscador de alumno para que la autoescuela, cuando tenga cientos de alumnos, pueda buscar por nombre y no volver loco buscando en el desplegable.
- En Control de Horas todo está bien pero añadiría un calendario para que, en caso de que la autoescuela quiera descargar un reporte de hace mucho tiempo, pueda ir atrás en el tiempo de forma más rápida.

Por mi parte esto sería todo, luego hay que presentarlo a las autoescuelas y puede que tengamos que retocar algo, pero eso lo veremos en el futuro. También me gustaría saber cómo se suscriben ellos a la web, es decir, cómo es el proceso para que se registren y se suscriban a la suscripción mensual.


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
