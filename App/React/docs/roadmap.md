# ROADMAP: Plataforma Gestor CAP (WordPress + React Islands)

> **Última actualización:** 2026-02-05  
> **Estado:** ⏳ Fase 11 + Feedback (Mejoras de UX/Visualización pendientes)  
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

### ✅ Fase 2-3: Layout + Configuración
CapLayout sidebar/mobile, navegación Zustand, header contextual, config centro/horarios/capacidad, panel suscripción, API REST config.
- [ ] 2.3.3 Acciones rápidas contextuales (pendiente por sección)
- [ ] 3.1.3 Logo upload via WP Media

### ✅ Fase 4-5: Alumnos + Calendario
TablaAlumnos CRUD completo, MatrizDisponibilidad, progreso visual, CalendarioSemanal, TarjetaClase, reglas CAP, 8 asignaturas, sistema bloqueo.

### ✅ Fase 6-7: Generación + Edición
CalendarEngine PHP, conflictos aforo, Drag&Drop dnd-kit, historial undo, edición inline modal.

### ✅ Fase 8-9: Reportes + Stripe
PDF dompdf, SeccionReportes, StripeService encriptado, checkout/webhook/portal, flujo post-registro.
- [ ] 9.1.4 Productos Stripe Dashboard (acción manual cliente)

### ✅ Fase 10: Testing/Demo
CapSeeder, PanelDemo, endpoints demo, seguridad WP_DEBUG.

### Fase 11: Despliegue (EN PROGRESO)
- [x] **11.1** Crear stack WordPress en Coolify (cap.wandori.us)
- [x] **11.2** Desplegar tema Glory con branch `glory-react-calendarioesc`
- [x] **11.3** Configurar URLs de WordPress
- [x] **11.4** Activar tema Glory
- [x] **11.5** Migrar base de datos local (si aplica)
- [x] **11.6** Configurar Stripe en modo producción
- [x] **11.7** Crear usuario admin de producción
- [x] **11.8** Verificar todas las funcionalidades


### 🚨 Errores Críticos y Solicitudes (Prioridad Alta)

#### 1. Errores Críticos de Lógica y Persistencia
- [x] **Configuración de Horarios:** La configuración no se aplica en nuevas semanas y se revierte al recargar. *(Fuente: Video 1 y Texto)*
- [x] **Persistencia 'Alumnos Máximos':** Visualmente se guarda pero el motor de calendario la ignora. *(Fuente: Texto y Video 3)*

#### 2. Problemas Visuales y de Interacción (Calendario)
- [x] **Desalineación Vertical:** Bloques de clases no coinciden visualmente con su hora real. *(Fuente: Texto y Video 2)*
- [x] **Edición Manual:** Cambiar hora manualmente no actualiza la posición vertical del bloque. *(Fuente: Texto y Video 2)*
- [x] **Drag & Drop Roto:** No se pueden arrastrar clases hacia abajo ni retornarlas. *(Fuente: Video 2)*
- [x] **Card Alumnos:** Siempre muestra "1 alumno" ignorando la capacidad real. *(Fuente: Texto y Video 3)*
- [x] **Flechas de Navegación:** "Bailan" al cambiar de semana causando clics erróneos. *(Fuente: Audio)*
- [x] **Alertas por movimiento inválido:** Notificación en esquina inferior cuando no se puede mover una clase. *(Fuente: Texto)*
- [x] **Preview sutil de drop:** Asistencia visual para ver la posición destino antes de soltar. *(Fuente: Texto)*

#### 3. Nuevas Funcionalidades (Cambio de Lógica)
- [x] **Flexibilidad Horaria Total:** Eliminar restricción Mañana/Tarde. Permitir horas libres por día. *(Fuente: Texto)*
- [x] **Botón 'Borrar Semana':** Limpiar calendario completo de una semana (además de Deshacer). *(Fuente: Texto)*

### 📋 Feedback Cliente 02/02/2026 (Nuevo)

#### 1. Clarificaciones del Algoritmo de Generación
- [x] **Aviso de Horas No Cubiertas:** Cuando no hay suficientes alumnos para llenar todas las horas del día, mostrar un aviso explicativo. El algoritmo funciona correctamente (llena hasta el máximo legal de 9h o disponibilidad), pero el cliente no entendía por qué solo veía una clase (era porque solo había 3 alumnos). *(Implementado 2026-02-03)*
    - Backend: `CalendarEngine::calcularAvisosHorasNoCubiertas()` calcula slots sin cobertura por día.
    - Frontend: `ModalAvisoGeneracion` muestra detalles por día con rangos horarios exactos sin cubrir.
    - Explicación clara: razón de los huecos + sugerencias de acción.

#### 2. Bugs de Edición Manual en Modal
- [x] **Bug Duración al Editar Hora:** Al cambiar la hora de inicio manualmente, la duración de la clase se altera incorrectamente. La hora fin debe recalcularse automáticamente: `Hora Fin = Nueva Hora Inicio + Duración Asignatura Original`. *(Corregido 2026-02-03)*
- [x] **Granularidad del Selector de Hora:** Los selectores de tiempo deben permitir intervalos de **15 minutos** (09:00, 09:15, 09:30, 09:45...) para mayor precisión. *(Corregido 2026-02-03)*

#### 3. Visualización de Tarjetas Cortas (UI)
- [x] **Tarjetas Adaptativas para Clases Cortas:** Cuando una clase dura menos de 45 minutos, el texto se corta. Implementar simplificación progresiva: *(Corregido 2026-02-03)*
    - **Duración < 45 min:** Ocultar la línea de horario (ya está implícita en la posición).
    - **Duración < 30 min:** Todo el contenido en una sola fila compacta (código + nombre asignatura abreviado).
    - **Duración < 20 min:** Solo mostrar código de asignatura con tooltip para detalles.
- [x] **Vista Mínima Mejorada:** Candado alineado a la derecha, texto de 11px para mayor legibilidad. *(Corregido 2026-02-03)*

#### 4. Correcciones de CSS
- [x] **Variables CSS inválidas:** Corregidas 6+ referencias a variables inexistentes en ModalConflictoDrag.css y calendario.css. *(Corregido 2026-02-03)*
- [x] **Nueva variable `--cap-texto-xxs`:** Añadida en variables.css (0.6875rem / 11px) para textos extra pequeños.

#### 5. Puntos Aprobados (No tocar)
- ✅ Nueva creación de Horarios de Clase (Flexible).
- ✅ Opción de Borrar Semana.

### 📋 Feedback Cliente 04/02/2026

#### 1. Bug Crítico: Huecos entre Clases con Duración < 60min
- [x] **Clases de 30min dejan huecos de 30min:** Cuando la duración de clase es 30 minutos, el sistema genera clases en 10:00, 11:00, 12:00 (saltando media hora). *(Corregido 2026-02-04)*
    - **Causa raíz:** La grilla de disponibilidad guarda slots de 1 hora (09:00, 10:00...), pero el CalendarEngine calculaba la disponibilidad usando `duracionClase` en lugar de 1 hora fija.
    - **Solución:** Interpolación de disponibilidad. Si un alumno está disponible de 09:00-10:00, ahora cubre clases de 09:00-09:30 Y 09:30-10:00.
    - **Archivos modificados:** `CalendarEngine.php` - métodos `cargarDisponibilidad()` y `alumnoDisponibleEnSlot()`
    
#### 2. Investigación: Descansos entre Clases *(Investigado 2026-02-04)*
- [x] **¿Se usa "Duración de descanso (min)" en la generación?** 
    - **Hallazgo:** El campo existe en UI y BD pero **NO se usa en absoluto** en CalendarEngine.
    - Las constantes `DESCANSO_6_HORAS = 30` y `DESCANSO_9_HORAS = 45` están definidas pero nunca se invocan.
    - El label actual "Tiempo entre clases" es **incorrecto** según requerimientos.
    
- **Requerimiento legal real:**
    - Si alumno hace 6h consecutivas → 30 min de descanso obligatorio
    - Si alumno hace 9h consecutivas → 45 min de descanso obligatorio
    - El sistema debería insertar estos descansos automáticamente en la generación
    
- **Estado: NO IMPLEMENTADO** - Decisión pendiente:
    - [ ] **Opción A:** Implementar descansos automáticos legales (insertar huecos después de 6h/9h)
    - [ ] **Opción B:** Eliminar el campo de UI si no se va a usar
    - [ ] **Opción C:** Usar el campo como "gap" entre clases (diseño original aparente)


## 📋 Feedback Cliente 05/02/2026 (Nuevo)

### 1. Resolución Inteligente de Conflictos de Aforo
- [ ] **Opción "Priorizar por Proximidad":** Nueva opción en el modal de Conflicto de Aforo (además de Manual y Aleatorio).
    - **Criterio 1:** Priorizar alumnos que estén más cerca de terminar cada asignatura (menos horas restantes).
    - **Criterio 2:** Evitar fragmentación de clases. Si un alumno tiene que volver más tarde, es peor que otro alumno que haría sus clases seguidas.
    - **Ejemplo:** Entre 2 alumnos, si uno le queda 1h para terminar la asignatura y al otro le quedan 5h, priorizar al primero.
    - **Continuidad:** Asegurar que el alumno priorizado no tenga que volver más tarde en el día (clases seguidas).
    
### 2. Mejoras de Visualización del Calendario

#### 2.1 Modal de Configuración del Calendario
- [ ] **Botón de configuración:** Agregar icono de engranaje en la barra del calendario que abre un modal.
- [ ] **Opción "Ocultar horas cerradas":** Toggle para ocultar el rango de horas en que la autoescuela está cerrada.
    - Calcula automáticamente la hora más temprana y más tarde según la configuración de horarios de toda la semana.
    - Ejemplo: Si la hora mínima de apertura es 10:00 y máxima 22:00, ocultar 08:00-09:00 y 23:00+.
    - La lógica es por semana, no por día (si el lunes abren a las 10 y el viernes a las 12, la hora mínima sigue siendo 10).
- [ ] **Control de Zoom Vertical:** Slider o selector para ajustar la escala vertical del calendario.
    - Opción de "30 min = 1 fila" en lugar de "60 min = 1 fila" (duplicar el espacio).
    - Control granular (ej. 1x, 1.3x, 1.5x, 2x).

#### 2.2 Mejoras en la Vista por Defecto de las Tarjetas ✅
- [x] **Zoom vertical por defecto +30%:** Umbral de visualización aumentado de 40 a 52 minutos. *(Implementado 2026-02-05)*
- [x] **Texto sin cortar:** Nombres usan `word-break` y `line-clamp` para saltos de línea.
- [x] **Simplificar con Badges:** Vista compacta ahora tiene:
    - Línea 1: Nombre completo de la asignatura.
    - Línea 2: 3 badges → [Código] [N alumnos] [HH:MM-HH:MM]
- [x] **Redefinir niveles de visualización:**
    - **Compacto (<52 min):** Nombre + badges (reemplaza la vista mínima y sin horario).
    - **Completo (>=52 min):** Se mantiene con todas las secciones.

### 3. Disponibilidad de Alumnos - Adaptar al Horario de Autoescuela ✅
- [x] **Horas dinámicas:** La grilla de disponibilidad de alumnos ahora muestra las horas configuradas en "Configuración → Horarios de Clase (Flexible)". *(Implementado 2026-02-05)*
    - Creado `utils/horariosUtils.ts` con `calcularRangoHoras()` que analiza `horarios_semanales`.
    - `useDisponibilidad` ahora acepta `horasDisponibles` como opción.
    - `MatrizDisponibilidad` recibe las horas dinámicas desde `SeccionAlumnos`.
- [x] **Leer configuración:** El hook obtiene el rango desde la configuración del centro automáticamente.

---

## Historial de Feedback (Resuelto)

### Actualización 04/02/2026
- [x] **Clases de 30min dejan huecos de 30min** - Corregido con interpolación de disponibilidad.
- [x] **Investigación de Descansos** - Documentado estado actual.

### Actualización 02/02/2026
- [x] Aviso de Horas No Cubiertas
- [x] Bug Duración al Editar Hora
- [x] Granularidad del Selector de Hora (15 min)
- [x] Tarjetas Adaptativas para Clases Cortas
- [x] Vista Mínima Mejorada
- [x] Variables CSS inválidas corregidas

---

## 4. Estado del Proyecto

| Fase | Descripción           | Estado      |
| ---- | --------------------- | ----------- |
| 0-10 | Desarrollo completo   | ✅ Completa  |
| 11   | Despliegue producción | ⏳ Pendiente |

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
**Alumnos:** GET/POST/PUT/DELETE `/cap/v1/alumnos`  
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

> **Siguiente paso:** Iniciar **Fase 11** de despliegue a producción.
