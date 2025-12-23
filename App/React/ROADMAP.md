# Dashboard de Productividad Personal - Roadmap

Sistema de seguimiento de hábitos, tareas y notas rápidas con diseño estilo terminal minimalista.

---

## Estado Actual

**Fecha de inicio:** 2025-12-19  
**Version:** v1.0.3-beta  
**Ultima actualizacion:** 2025-12-23
**Estado:** Sistema de Urgencia completado - Siguiente: Mejoras UX Rápidas (Fase 6)

---

## Funcionalidades Completadas

| Módulo              | Descripción                                                                   |
| ------------------- | ----------------------------------------------------------------------------- |
| **Infraestructura** | Arquitectura SOLID, CSS centralizado, TypeScript, Sincronización, Cifrado E2E |
| **Hábitos**         | CRUD, frecuencias, rachas, badges, ordenamiento, menú contextual              |
| **Tareas**          | CRUD inline, subtareas, Drag & Drop, prioridades, adjuntos                    |
| **Proyectos**       | Jerarquía 3 niveles, progreso, vista expandible                               |
| **Freemium**        | Free/Premium, Trial 14 días, Stripe (checkout, webhooks, portal)              |
| **Seguridad**       | API REST WordPress, nonce CSRF, AES-256-GCM, HKDF-SHA256                      |
| **Admin**           | Gestión usuarios, filtros, estadísticas                                       |
| **UI/UX**           | Componentes compartidos, badges, tooltips, layout personalizable              |
| **Scratchpad**      | Cifrado E2E, límite caracteres, debounce                                      |
| **Layout**          | Columnas, paneles ocultos, Drag & Drop reordenamiento                         |
| **Perfil**          | Avatar, contraseña, integración WordPress                                     |
| **Configuración**   | Opciones por panel (hábitos, tareas, proyectos, scratchpad)                   |

---

## 🐛 Bugs Conocidos (Investigar)

### Críticos

| Bug                          | Descripción                                                           | Posible Causa                                                                                           |
| ---------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **BD Compartidos**           | Error `Unknown column 'c.fecha_compartido'` y `c.propietario_id`      | Tabla `wp_glory_compartidos` no se creó o no se actualizó. Verificar que `glory_db_version` sea `1.0.4` |
| **401 en Adjuntos Cifrados** | Error 401 Unauthorized al cargar imágenes `.enc` después de un tiempo | Token expirado o sesión perdida. Investigar si fue por refactorización o timeout                        |

### Menores

| Bug                      | Descripción                                                         | Estado                     |
| ------------------------ | ------------------------------------------------------------------- | -------------------------- |
| **Altura del editor**    | La opción "Altura del editor" en configuración no se está aplicando | Investigar                 |
| **Tooltips desbordados** | Los tooltips se salen de la pantalla a veces                        | Investigar posicionamiento |
| **Adjuntos eliminados**  | Al eliminar adjunto, no se quita instantáneamente del UI            | Pendiente                  |
| **Adjuntos múltiples**   | Al eliminar múltiples adjuntos, reaparecen algunos                  | Estado React               |

---

## 📌 Mejoras Menores (Baja Prioridad)

<details>
<summary>Expandir lista completa</summary>

**Hábitos:**
- [ ] Animación de entrada/salida
- [ ] Animación visual de logro al completar
- [ ] Umbral de reseteo editable
- [ ] Adaptar racha a frecuencia

**Tareas:**
- [ ] Animación de arrastre más fluida
- [ ] Estadísticas de tareas completadas hoy
- [ ] Soporte markdown en descripción
- [ ] Historial de repeticiones

**Ordenamiento:**
- [ ] Drag & drop manual para hábitos
- [ ] Guardar preferencia de orden
- [ ] Buscar hábitos por nombre

**Responsive/PWA:**
- [ ] Layout móvil adaptativo
- [ ] Touch gestures
- [ ] Service Worker offline
- [ ] Instalable en móvil

**Notificaciones por Correo:**
- [ ] Tareas por vencer
- [ ] Resumen diario/semanal
- [ ] Alerta de racha en peligro
- [ ] Configuración de preferencias

**Pulido Mobile:**
- [ ] Touch events para dispositivos táctiles
- [ ] Fallback a controles del modal para accesibilidad
- [ ] Animación de "snap" al soltar
- [ ] Cursor personalizado durante arrastre

</details>

---

## 🔮 Sistema Social (v1.0.2-beta) - COMPLETADO

> **Detalle completo:** Ver [fases-completadas.md](./fases-completadas.md)

### Fases Completadas (Resumen)

| Fase | Nombre           | Descripción                                          |
| ---- | ---------------- | ---------------------------------------------------- |
| 0    | Preparación      | Alertas personalizadas, Header compactado a iconos   |
| 1    | Almacenamiento   | Límites (50MB Free / 10GB Premium), indicador de uso |
| 1.5  | Archivos Físicos | Subida multipart, cifrado stream, cache, thumbnails  |
| 2    | Equipos          | Solicitudes, compañeros, estados pendientes          |
| 3    | Notificaciones   | Polling, tipos, marcar leídas, badges                |
| 4    | Compartir        | Proyectos, tareas, asignación, roles                 |

### Tareas Pendientes de Fase 4 (Cifrado Avanzado)

> Estas tareas se posponen para una fase futura de optimización de seguridad:

- [ ] Campo `cifrado_compartido: false` en elementos compartidos
- [ ] Tareas NO compartidas permanecen cifradas normalmente
- [ ] Separar datos cifrados de no cifrados en sincronización

---

## Fase 5: Refactorización de Archivos Grandes [EN PROGRESO]

**Objetivo:** Reducir archivos que exceden los límites de líneas establecidos para mantener SOLID.

> **Límites recordatorio:**
> - Componente/Servicio: 300 líneas máximo
> - Hook: 120 líneas máximo
> - CSS: 300 líneas máximo

### 5.1 Backend PHP - ✅ COMPLETADO

**Repositorios refactorizados:**

| Archivo Original          | Líneas Antes | Archivos Resultantes          | Líneas D |
| ------------------------- | ------------ | ----------------------------- | -------- |
| `DashboardRepository.php` | 1023         | `DashboardRepository.php`     | 186      |
|                           |              | `HabitosRepository.php`       | 138      |
|                           |              | `TareasRepository.php`        | 142      |
|                           |              | `ProyectosRepository.php`     | 136      |
|                           |              | `ConfiguracionRepository.php` | 189      |
|                           |              | `CompartidosRepository.php`   | 98       |
|                           |              | `CifradoTrait.php`            | 85       |

**Controladores API refactorizados:**

| Archivo Original             | Líneas Antes | Archivos Resultantes              | Líneas D |
| ---------------------------- | ------------ | --------------------------------- | -------- |
| `DashboardApiController.php` | 760          | `DashboardApiController.php`      | 302      |
|                              |              | `SuscripcionApiController.php`    | 82       |
|                              |              | `AlmacenamientoApiController.php` | 99       |
|                              |              | `CifradoApiController.php`        | 114      |
|                              |              | `StripeApiController.php`         | 187      |

### 5.2 Frontend TSX - ✅ COMPLETADO

**Refactorizados:**

| Archivo Original              | Líneas Antes | Archivos Resultantes                          | Líneas D |
| ----------------------------- | ------------ | --------------------------------------------- | -------- |
| `islands/DashboardIsland.tsx` | 461          | `islands/DashboardIsland.tsx`                 | 260      |
|                               |              | `hooks/useModalesDashboard.ts`                | 234      |
|                               |              | `hooks/useCompartirDashboard.ts`              | 236      |
|                               |              | `hooks/useOpcionesDashboard.tsx`              | 96       |
|                               |              | `hooks/useAccionesDashboard.ts`               | 160      |
|                               |              | `components/paneles/PanelFocoPrioritario.tsx` | 76       |
|                               |              | `components/paneles/PanelProyectos.tsx`       | 61       |
|                               |              | `components/paneles/PanelEjecucion.tsx`       | 117      |
|                               |              | `components/paneles/PanelScratchpad.tsx`      | 65       |

**Pendientes:**

| Archivo                          | Líneas | Acción Propuesta       |
| -------------------------------- | ------ | ---------------------- |
| `components/SeccionAdjuntos.tsx` | 448    | Extraer subcomponentes |
| `components/ListaTareas.tsx`     | 403    | Extraer lógica a hook  |

### 5.3 CSS - Pendiente

| Archivo                          | Líneas | Acción Propuesta          |
| -------------------------------- | ------ | ------------------------- |
| `styles/compartidos.css`         | 631    | Dividir por componente    |
| `styles/tareas.css`              | 589    | Dividir por subcomponente |
| `styles/tabla.css`               | 477    | Dividir por sección       |
| `styles/encabezado.css`          | 410    | Dividir iconos/badges     |
| `styles/panelAdministracion.css` | 408    | Dividir secciones         |
| `styles/suscripcion.css`         | 396    | Dividir modal/indicadores |
| `styles/equipos.css`             | 383    | Dividir por componente    |
| `styles/detalleUsuario.css`      | 332    | Dividir secciones         |
| `styles/adjuntos.css`            | 302    | Dividir lista/preview     |

### 5.4 Hooks y Types - Pendiente

| Archivo                        | Líneas | Acción Propuesta               |
| ------------------------------ | ------ | ------------------------------ |
| `types/dashboard.ts`           | 525    | Dividir por dominio            |
| `hooks/useDashboard.ts`        | 439    | Extraer a hooks especializados |
| `hooks/useConfiguracionLayout` | 407    | Simplificar, extraer helpers   |

### 5.5 Servicios PHP - Pendiente

| Archivo                           | Líneas | Acción Propuesta                  |
| --------------------------------- | ------ | --------------------------------- |
| `Services/AdjuntosService.php`    | 629    | Separar cifrado de gestión        |
| `Services/CompartidosService.php` | 560    | Separar queries de lógica         |
| `Services/NotificacionesService`  | 483    | Separar tipos de notificación     |
| `Services/EquiposService.php`     | 441    | Separar solicitudes de relaciones |
| `Api/AdjuntosApiController.php`   | 354    | Separar upload/download           |
| `Services/AdminService.php`       | 347    | Separar estadísticas de gestión   |
| `Api/AdminApiController.php`      | 310    | Separar por responsabilidad       |
| `Services/SuscripcionService`     | 306    | Separar Stripe de lógica local    |

**Estado:** En progreso - Backend completado, DashboardIsland.tsx refactorizado

---

## Fase 5.5: Sistema de Urgencia [COMPLETADO]

**Objetivo:** Diferenciar entre importancia (prioridad) y temporalidad (urgencia) para mejorar el ordenamiento inteligente de tareas.

> **Concepto clave:** Una tarea puede ser importante (alta prioridad) pero no urgente (puede hacerse en el futuro), o puede ser urgente (debe hacerse ya) aunque no sea tan importante.

### 5.5.1 Modelo de Urgencia

**Valores de urgencia:**

| Valor | Nombre       | Descripción                                                           | Badge                                     |
| ----- | ------------ | --------------------------------------------------------------------- | ----------------------------------------- |
| 4     | `bloqueante` | 200% urgente. No se puede evitar, debe hacerse SÍ o SÍ                | Rojo (mismo color que prioridad alta)     |
| 3     | `urgente`    | Debe hacerse pronto, no puede esperar mucho                           | Naranja (mismo color que prioridad media) |
| 2     | `normal`     | **Default oculto**. No se muestra badge, se asume si no se elige otro | Sin badge                                 |
| 1     | `chill`      | Puede hacerse en cualquier momento sin presión temporal               | Verde/Gris suave                          |

> **Nota:** Los colores son los mismos de prioridad para mantener coherencia visual. La diferenciación es por icono (Zap/rayo).

### 5.5.2 Implementación Backend ✅

- [x] Agregar campo `urgencia` a tabla `wp_glory_tareas` (enum: bloqueante, urgente, normal, chill)
- [x] Agregar campo `urgencia` a tabla `wp_glory_proyectos`
- [x] Migración para tareas/proyectos existentes → `normal` por defecto (Schema v1.0.5)
- [x] Actualizar `TareasRepository.php` para guardar/leer urgencia
- [x] Actualizar `ProyectosRepository.php` para guardar/leer urgencia

### 5.5.3 Implementación Frontend ✅

- [x] Agregar tipo `NivelUrgencia` al `dashboard.ts` 
- [x] Agregar campo `urgencia` a interfaces `Tarea` y `Proyecto`
- [x] Crear componente `CampoUrgencia` (similar a `CampoPrioridad`)
- [x] Integrar en `PanelConfiguracionTarea.tsx`
- [ ] Integrar en `FormularioProyecto.tsx` (pendiente)
- [x] Mostrar badge de urgencia en `TareaItem.tsx` (si no es `normal`)
- [x] La urgencia también aplica a subtareas

### 5.5.4 Filtro Inteligente Mejorado ✅

**Fórmula actual:** `fecha_limite + prioridad`

**Nueva fórmula:** `urgencia_peso + prioridad_peso + fecha_peso`

```
Peso Urgencia:
  - bloqueante: 1000 (siempre primero)
  - urgente: 500
  - normal: 0
  - chill: -200

Peso Prioridad:
  - alta: 300
  - media: 100 (default si no se especifica)
  - baja: 0

Peso Fecha:
  - Vencida: +400
  - Hoy: +300
  - Mañana: +200
  - Esta semana: +100
  - Sin fecha: 0
```

- [x] Actualizar lógica de ordenamiento en `useOrdenarTareas.ts`
- [ ] Considerar urgencia en el conteo de "Tareas importantes para hoy" (pendiente)

### 5.5.5 UI/UX ✅

- [x] Badge de urgencia junto a prioridad (icono Zap/rayo)
- [x] Tooltip explicativo de la diferencia prioridad vs urgencia
- [x] Valor default `normal` nunca muestra badge

**Complejidad:** Media | **Dependencias:** Ninguna (independiente)
**Aplica a:** Tareas, Subtareas, Proyectos (NO hábitos - los hábitos ya tienen periodicidad fija)

---

## Fase 6: Mejoras UX Rápidas [DESPUÉS DE 5.5]

**Objetivo:** Pequeñas mejoras de experiencia de usuario identificadas.

### 6.1 Notificaciones - Lectura Automática

- [ ] Las notificaciones se marcan como leídas automáticamente al abrir el panel
- [ ] Eliminar botón "Marcar todas como leídas" (ya no es necesario)
- [ ] Las notificaciones existentes deben cargar instantáneamente (cache local)
- [ ] Solo mostrar "Cargando..." para notificaciones nuevas, no para las ya cargadas

### 6.2 Exportar/Importar - Mover al Menú de Perfil

- [ ] Quitar panel de Exportar/Importar de la página actual
- [ ] Agregar opciones "Exportar datos" e "Importar datos" al menú contextual del perfil (header)

**Complejidad:** Baja | **Dependencias:** Ninguna

---

## Fase 7: Scratchpad con Guardado + File Manager [PLANIFICADA]

**Objetivo:** Permitir guardar notas del Scratchpad y crear un gestor de archivos tipo Google Drive.

### 7.1 Scratchpad - Sistema de Guardado

- [ ] Agregar botón badge "Guardar nota" al Scratchpad
- [ ] Al guardar: la nota se almacena con título (primeras palabras o input) y fecha
- [ ] Agregar botón badge "Archivo" para ver notas guardadas
- [ ] Las notas guardadas se pueden reabrir en el Scratchpad
- [ ] Preview markdown en notas guardadas

### 7.2 File Manager (Drive Glory)

> **Estructura:** Crear carpeta `components/fileManager/` para mantener organizado

**Diseño visual:**
- Estilo similar a explorador de archivos de Windows
- Panel lateral con carpetas
- Vista principal con archivos en grid/lista
- Mantener línea visual minimalista del dashboard

**Estructura de carpetas:**

```
📁 Mis Archivos
  📁 Notas (notas guardadas del Scratchpad)
  📁 Imágenes (adjuntos de tipo imagen)
  📁 Documentos (otros adjuntos)
  📁 Por Proyecto
    📁 [Nombre Proyecto 1]
    📁 [Nombre Proyecto 2]
  📁 Por Tarea
    📁 [Nombre Tarea 1]
    📁 [Nombre Tarea 2]
```

### 7.3 Funcionalidades del File Manager

**Básicas:**
- [ ] Ver todos los archivos del usuario
- [ ] Navegación por carpetas
- [ ] Agrupación automática por proyecto/tarea
- [ ] Agrupación configurable (por tipo, por fecha, por proyecto)
- [ ] Preview de archivos (imágenes, notas)
- [ ] Descargar archivos (drag & drop hacia escritorio)

**Avanzadas:**
- [ ] Subir archivos directamente al Drive (sin asociar a tarea)
- [ ] Crear carpetas personalizadas
- [ ] Mover archivos entre carpetas
- [ ] Arrastrar y soltar archivos
- [ ] Búsqueda por nombre

### 7.4 Estructura de Componentes

```
components/fileManager/
  FileManager.tsx           (componente principal)
  BarraLateral.tsx          (panel de carpetas)
  VistaArchivos.tsx         (grid/lista de archivos)
  ItemArchivo.tsx           (archivo individual)
  ItemCarpeta.tsx           (carpeta individual)
  BarraHerramientas.tsx     (acciones: subir, crear carpeta, etc)
  ModalPreview.tsx          (preview de archivos)
  hooks/
    useFileManager.ts       (estado y lógica)
  types/
    fileManager.ts          (tipos)
styles/
  fileManager.css           (estilos)
```

### 7.5 Backend

- [ ] Tabla BD: `wp_glory_notas` (id, user_id, titulo, contenido, fecha_creacion, fecha_modificacion)
- [ ] Tabla BD: `wp_glory_carpetas` (id, user_id, nombre, padre_id, tipo)
- [ ] Endpoints API para notas (CRUD)
- [ ] Endpoint para listar archivos agrupados

**Complejidad:** Alta | **Dependencias:** Fase 1.5 (archivos físicos)

---

## Fase 8: Mapa de Calor de Actividad [PLANIFICADA]

**Objetivo:** Visualizar la actividad del usuario en un mapa de calor tipo GitHub.

### 8.1 Rastreo de Actividad

> **Investigar:** ¿Ya existe registro de `fecha_completado` en tareas/hábitos?

**Datos a rastrear:**
- [ ] Tabla BD: `wp_glory_actividad` (id, user_id, tipo, elemento_id, fecha, detalles)
- [ ] Tipos: `tarea_completada`, `habito_cumplido`, `nota_creada`, `adjunto_subido`
- [ ] Al completar tarea → registrar en actividad
- [ ] Al cumplir hábito → registrar en actividad

### 8.2 Componente Mapa de Calor

```
components/shared/
  MapaCalor.tsx             (componente reutilizable)
  hooks/
    useActividad.ts         (hook para obtener datos)
```

**Configuraciones:**
- [ ] Período: última semana, mes, 3 meses, año
- [ ] Filtrar por tipo: solo tareas, solo hábitos, todo
- [ ] Filtrar por proyecto específico
- [ ] Filtrar por hábito específico
- [ ] Nivel de detalle: días, semanas

### 8.3 Integración

**Panel nuevo en Dashboard:**
- [ ] Nuevo bloque "Actividad" con mapa de calor general
- [ ] Configurable desde modal de configuración

**En modal de Hábito:**
- [ ] Mostrar mapa de calor específico del hábito
- [ ] Historial de cumplimiento visual

**En modal de Proyecto:**
- [ ] Mostrar mapa de calor de tareas completadas del proyecto

### 8.4 Múltiples Heatmaps

- [ ] Poder agregar múltiples widgets de mapa de calor al dashboard
- [ ] Cada uno con configuración independiente
- [ ] Nombrar cada widget (ej: "Mi actividad general", "Hábito: Ejercicio")

**Complejidad:** Media-Alta | **Dependencias:** Historial de actividad

---

## Fase 9: Compartir Hábitos [POSPUESTA]

**Objetivo:** Motivación social al compartir hábitos con compañeros.

> **Razón de posponer:** Esta funcionalidad no es crítica para el MVP. Se implementará después de la refactorización y estabilización del sistema actual.

### 9.1 Modelo de Hábitos Compartidos
> Cada persona tiene su propia instancia. Racha y cumplimiento son individuales.
> Solo comparten "el mismo hábito" para verse mutuamente.

- [ ] Tabla BD: `wp_glory_habitos_compartidos` (habito_id, usuario_origen, usuario_destino)
- [ ] Al compartir: se crea copia del hábito en cuenta del compañero
- [ ] Campo `habito_origen_id` para vincular ambas instancias
- [ ] Cada usuario cumple su hábito independientemente

### 9.2 UI de Hábitos Compartidos
- [ ] Opción en menú contextual: "Compartir hábito"
- [ ] Indicador visual: "Compartido con [Nombre]"
- [ ] Ver cuándo el compañero cumplió (badge o indicador)
- [ ] Notificación: "[Nombre] cumplió [Hábito] hoy"

### 9.3 Sincronización de Estado
- [ ] Endpoint para consultar estado de hábito del compañero
- [ ] Cache local para no sobrecargar
- [ ] Actualización periódica o al abrir panel

**Complejidad:** Media | **Dependencias:** Fase 2 (equipos), Fase 3 (notificaciones)

---

## Fase 10: Modal Expandido con Chat e Historial

**Objetivo:** Comunicación y trazabilidad en tareas/proyectos/hábitos compartidos.

### 10.1 Nuevo Diseño del Modal de Tarea
> El modal actual se expande al doble de ancho con 2 columnas.

**Columna Izquierda (existente):**
- Información de la tarea (nombre, descripción, prioridad, etc.)
- Subtareas
- Adjuntos
- Configuración

**Columna Derecha (nueva):**
- Chat/Comentarios en tiempo real
- Historial de cambios (inmutable)
- Lista de participantes

### 10.2 Sistema de Chat por Elemento
- [ ] Tabla BD: `wp_glory_mensajes` (id, tipo, elemento_id, usuario_id, contenido, fecha)
- [ ] Tipos: `tarea`, `proyecto`, `habito`
- [ ] Cada tarea/proyecto/hábito tiene su propia conversación
- [ ] Input de mensaje con soporte para adjuntos
- [ ] Mensajes ordenados cronológicamente
- [ ] Scroll automático al nuevo mensaje
- [ ] Notificación a participantes al enviar mensaje

### 10.3 Historial de Cambios (Audit Log)
> Inmutable. Nadie puede editar ni eliminar el historial.

- [ ] Tabla BD: `wp_glory_historial` (id, tipo, elemento_id, usuario_id, accion, detalles, fecha)
- [ ] Acciones registradas:
  - Cambio de nombre
  - Cambio de descripción
  - Cambio de prioridad
  - Cambio de fecha límite
  - Adjunto agregado/eliminado
  - Tarea completada/reabierta
  - Participante agregado/removido
  - Asignación cambiada
- [ ] Formato: "[Usuario] [acción] [detalles] - [fecha]"
- [ ] Visualización tipo timeline

### 10.4 UI del Modal Expandido
- [ ] Componente `ModalTareaExpandido` con 2 columnas
- [ ] Toggle para expandir/colapsar columna derecha
- [ ] Por defecto: modal expandido (2 columnas)
- [ ] Scroll independiente por columna
- [ ] Responsive: en móvil, pestañas en lugar de columnas

### 10.5 Aplicar a Proyectos y Hábitos
- [ ] Modal de proyecto con chat + historial
- [ ] Modal de hábito (solo si está compartido)
- [ ] Componente `PanelChatHistorial` reutilizable

**Complejidad:** Muy Alta | **Dependencias:** Fase 2, 3, 4 (requiere sistema social completo)

---

## Fase 11: Futuro (Post v1.1.0)

### 11.1 Correo de Invitación
- [ ] Enviar email cuando se invita a usuario no registrado
- [ ] Template de correo personalizado
- [ ] Link de registro con solicitud pre-aceptada

### 11.2 Notificaciones por Correo
- [ ] Preferencias de notificación por email
- [ ] Resumen diario/semanal
- [ ] Alertas de tareas por vencer
- [ ] Alerta de racha en peligro

### 11.3 Feed de Red Social
- [ ] Posts automáticos de logros
- [ ] Posts manuales
- [ ] Likes y comentarios
- [ ] Privacidad configurable

### 11.4 Gamificación
- [ ] Badges de logros
- [ ] Sistema de niveles/experiencia
- [ ] Leaderboards semanales

---

## 📋 Resumen de Fases

| Fase | Nombre                         | Complejidad | Estado        |
| ---- | ------------------------------ | ----------- | ------------- |
| 0    | Preparación (Alertas + Header) | Baja-Media  | ✅ Completada  |
| 1    | Almacenamiento                 | Media       | ✅ Completada  |
| 1.5  | Archivos Físicos + Cifrado     | Alta        | ✅ Completada  |
| 2    | Sistema de Equipos             | Alta        | ✅ Completada  |
| 3    | Notificaciones                 | Alta        | ✅ Completada  |
| 4    | Compartir Tareas/Proyectos     | Muy Alta    | ✅ Completada  |
| 5    | Refactorización                | Alta        | ⏳ En Progreso |
| 5.5  | Sistema de Urgencia            | Media       | ✅ Completada  |
| 6    | **Mejoras UX Rápidas**         | Baja        | 🔜 Siguiente   |
| 7    | Scratchpad + File Manager      | Alta        | Planificada   |
| 8    | Mapa de Calor                  | Media-Alta  | Planificada   |
| 9    | Compartir Hábitos              | Media       | Pospuesta     |
| 10   | Modal Chat + Historial         | Muy Alta    | Pendiente     |
| 11   | Futuro                         | Variable    | Pendiente     |

---

## Estructura de Archivos Actual

<details>
<summary>Ver estructura completa</summary>

```
App/React/
  types/dashboard.ts
  utils/
    index.ts, fecha.ts, validadores.ts, migracionHabitos.ts,
    frecuenciaHabitos.ts, jerarquiaTareas.ts
  data/datosIniciales.ts
  hooks/
    useDashboard.ts, useTareas.ts, useProyectos.ts, useDeshacer.ts,
    useOrdenarHabitos.ts, useLocalStorage.ts, useDebounce.ts,
    useDashboardApi.ts, useSincronizacion.ts, useSuscripcion.ts,
    useCifrado.ts, useStripe.ts, useAdministracion.ts
  components/shared/
    MenuContextual.tsx, Modal.tsx, AccionesFormulario.tsx,
    SelectorNivel.tsx, SeccionPanel.tsx, ToggleSwitch.tsx,
    SelectorDias.tsx, BadgeInfo.tsx, AccionesItem.tsx,
    CampoTexto.tsx, CampoPrioridad.tsx, CampoFechaLimite.tsx,
    IndicadorSincronizacion.tsx, IndicadorPlan.tsx, ModalUpgrade.tsx
  components/dashboard/
    SelectorFrecuencia.tsx, FormularioHabito.tsx, TablaHabitos.tsx,
    ListaTareas.tsx, TareaItem.tsx, PanelConfiguracionTarea.tsx,
    PanelSeguridad.tsx, FormularioProyecto.tsx, ListaProyectos.tsx
  components/admin/
    PanelAdministracion.tsx, ListaUsuarios.tsx, FiltrosUsuarios.tsx,
    FilaUsuario.tsx, ResumenAdmin.tsx, DetalleUsuario.tsx
```

```
App/React/styles/dashboard/
  index.css, variables.css, animaciones.css, base.css
  shared/
    accionesFormulario.css, selectorNivel.css, seccionPanel.css,
    toggleSwitch.css, dashboardPanel.css, badgeInfo.css,
    accionesItem.css, campoFechaLimite.css, indicadorSincronizacion.css,
    suscripcion.css, panelSeguridad.css
  componentes/
    encabezado.css, tabla.css, tareas.css, scratchpad.css,
    formulario.css, toast.css, ordenamiento.css,
    menuContextual.css, frecuencia.css, panelConfiguracion.css,
    panelAdministracion.css, detalleUsuario.css
  utilidades/
    estados.css, acciones.css
```

```
App/Api/
  DashboardApiController.php, AdminApiController.php,
  StripeWebhookHandler.php
App/Services/
  CifradoService.php, SuscripcionService.php, AdminService.php
App/Repository/
  DashboardRepository.php
```

</details>

---

## Configuración Requerida

```php
/* wp-config.php */
define('GLORY_STRIPE_SECRET_KEY', 'sk_live_...');
define('GLORY_STRIPE_PUBLISHABLE_KEY', 'pk_live_...');
define('GLORY_STRIPE_WEBHOOK_SECRET', 'whsec_...');
define('GLORY_STRIPE_PRICE_MONTHLY', 'price_...');
define('GLORY_STRIPE_PRICE_YEARLY', 'price_...');
```

---

## Contacto y Documentación

- `Glory/assets/react/Docs/react-glory.md` - Documentación del sistema
- `App/React/components/` - Componentes existentes
- `App/React/styles/dashboard/` - Sistema de diseño modular

---
