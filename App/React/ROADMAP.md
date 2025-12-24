# Dashboard de Productividad Personal - Roadmap

Sistema de seguimiento de hábitos, tareas y notas rápidas con diseño estilo terminal minimalista.

---

## Estado Actual

**Fecha de inicio:** 2025-12-19  
**Version:** v1.0.3-beta  
**Ultima actualizacion:** 2025-12-24
**Estado:** Fase 7.5 - EN PROGRESO (Pendiente: Scratchpad guardado)

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

## Fases 5-7: Completadas (v1.0.3-beta)

> **Detalle completo:** Ver historial de commits o changelog.

| Fase | Nombre                  | Descripción Resumida                                                            |
| ---- | ----------------------- | ------------------------------------------------------------------------------- |
| 5    | Sistema de Urgencia     | Niveles bloqueante/urgente/normal/chill, ordenamiento inteligente mejorado      |
| 6    | Mejoras UX Rápidas      | Lectura automática notificaciones, exportar/importar al menú perfil             |
| 6.3  | Auto-Guardado Modales   | Guardado al cerrar modal (overlay/ESC/X), detección de cambios                  |
| 6.5  | Refact. Formularios     | ModalHabito y ModalProyecto con auto-guardado                                   |
| 6.6  | Hábitos en Ejecución    | Hábitos como tareas virtuales, urgencia automática por días inactivos           |
| 7    | Modal Chat + Historial  | Timeline unificado, mensajes + eventos sistema, notificaciones, mensajes leídos |
| 7.1  | Diseño Modal Expandido  | 2 columnas: formulario + chat/historial, responsive                             |
| 7.2  | Sistema Mensajes        | Tabla BD, endpoints API, hook useMensajes, registro eventos                     |
| 7.3  | Mensajes No Leídos      | Badge en tareas, marcar como leído automático                                   |
| 7.4  | UI Timeline             | Burbujas usuario, líneas sistema, fechas separadoras                            |
| 7.5  | Participantes           | Lista participantes con avatar, nombre, rol                                     |
| 7.6  | Proyectos y Hábitos     | Chat/historial reutilizable en todos los modales                                |
| 7.7  | Notificaciones Mensajes | Notificar a participantes al recibir mensaje                                    |

---

## Fase 7.5: Correcciones UX y Redimensionamiento [EN PROGRESO]

**Objetivo:** Pulir la experiencia de usuario con correcciones específicas y añadir funcionalidades de redimensionamiento.

### 7.5.1 Modal de Tarea - Ocultar Chat en Creación ✅

> **Problema:** Al crear tarea desde el badge "+", aparece el panel de chat/historial aunque no tiene sentido (tarea nueva, sin historial).

**Implementado:**
- [x] Detectar si la tarea es nueva (sin `id` o `esModoCreacion`)
- [x] Ocultar columna derecha (chat/historial) cuando es modo creación
- [x] Mostrar solo formulario de creación centrado (modal sin clase --expandido)
- [x] Ocultar pestañas móvil y botón toggle chat en modo creación
- [x] Al guardar y reabrir, ya mostrar chat/historial normalmente

**Bug corregido: Doble padding en modo creación**

> **Problema resuelto:** `.panelConfiguracionColumnaScroll` y `modalContenido` tenían padding simultáneo.

**Solución aplicada:**
- En `modal.css`: Añadida regla `.panelConfiguracionContenedor:not(.modalContenedor--expandido) .modalContenido { padding: 0; overflow: visible; }`
- Esto hace que en modo creación, `.modalContenido` no tenga padding ni scroll
- El padding y scroll los maneja `.panelConfiguracionColumnaScroll` 
- Los botones quedan fijos gracias a la estructura flexbox existente


### 7.5.2 Filtro "Mis Asignadas" - Excluir Hábitos ✅

> **Problema:** Cuando se filtra por "Mis Asignadas" se muestran hábitos aunque "Mostrar hábitos en Ejecución" esté activo.

- [x] El filtro "Mis Asignadas" muestra SOLO tareas asignadas por otros usuarios
- [x] Cuando el filtro es "asignadas", no se incluyen hábitos-como-tareas
- [x] Modificado `useDashboardCompleto.ts` para excluir hábitos del combinar

### 7.5.3 Columnas Visibles por Defecto en Hábitos ✅

> **Problema:** Por defecto se muestran columnas poco útiles en la tabla de hábitos.

**Columnas visibles por defecto:**
- [x] Frecuencia ✅
- [x] Importancia (Prioridad) ✅
- [x] TocaHoy (Días) ✅

**Columnas ocultas por defecto:**
- [x] Racha ❌
- [x] Urgencia ❌
- [x] Inactividad ❌

- [x] Actualizado `COLUMNAS_POR_DEFECTO` en `useConfiguracionHabitos.ts`
- [x] Usuarios existentes no se ven afectados (solo nuevos usuarios)

### 7.5.4 Orden de Paneles por Defecto ✅

> **Problema:** El orden inicial de los paneles no es óptimo.

**Nuevo orden por defecto:**
| Fila | Columna 1 | Columna 2  | Columna 3 |
| ---- | --------- | ---------- | --------- |
| 1    | Ejecución | Proyectos  | ...       |
| 2    | Hábitos   | Scratchpad | ...       |

- [x] Ejecución ahora está en la primera fila
- [x] Hábitos en la segunda fila
- [x] Actualizado `ORDEN_PANELES_DEFECTO` en `useConfiguracionLayout.ts`

### 7.5.5 Botón Minimizar en Paneles ✅

> **Problema:** No hay forma rápida de ocultar un panel sin ir a configuración.

- [x] Creado componente `BotonMinimizarPanel.tsx`
- [x] Icono: `Minus` de Lucide
- [x] Al hacer clic: oculta panel usando `layout.ocultarPanel()`
- [x] Agregado a todos los paneles (FocoPrioritario, Proyectos, Ejecucion, Scratchpad)
- [x] Para restaurar: usar la barra de paneles ocultos existente

### 7.5.6 Redimensionar Ancho de Columnas ✅

> **Problema resuelto:** Las columnas no se podían redimensionar manualmente.

**Implementación:**
- [x] Componente `ResizeHandleColumn` para handles internos y externos
- [x] Handles internos entre columnas (1 para 2 col, 2 para 3 col)
- [x] Handle externo para controlar ancho total del grid (60-100%)
- [x] Estilo minimalista: línea delgada, visible al hover, cursor resize
- [x] Anchos persistidos en localStorage
- [x] CSS grid con unidades `fr` para distribución proporcional

**Asistencia automática de balance:**
- [x] Doble clic en handle interno: iguala anchos de todas las columnas
- [x] Doble clic en handle externo: resetea a 100%

### 7.5.7 Redimensionar Altura de Paneles ✅

> **Problema resuelto:** Otros paneles no tenían resize de altura como Scratchpad.

**Implementación inteligente:**
- [x] Componente reutilizable `ResizeHandlePanel` con lógica de anclaje automático
- [x] Modo "auto": el panel crece con su contenido (comportamiento por defecto)
- [x] Si se arrastra hacia abajo y supera el contenido: se ancla automáticamente a "auto"
- [x] Si se arrastra hacia arriba: altura fija con scroll interno
- [x] Indicador visual: línea verde = modo auto (anclado), línea gris = altura fija
- [x] Doble clic en handle: alterna entre modo auto y modo fijo
- [x] Alturas persistidas en localStorage por panel
- [x] Mínimo 120px para evitar paneles demasiado pequeños

### 7.5.8 Scroll Unificado y Bug de Parpadeo ✅

> **Problema resuelto:** El scroll parpadeaba al editar tareas debido al uso de `overflow-y: auto`.

**Scroll unificado:**
- [x] Estilos de scrollbar globales ya estaban en `base.css`
- [x] Todas las variables CSS de scrollbar centralizadas en `variables.css`
- [x] Eliminado código redundante de scrollbar en `panelConfiguracion.css`

**Bug de parpadeo:**
- [x] Causa identificada: `overflow-y: auto` causa recálculo del layout al aparecer/desaparecer scrollbar
- [x] Solución aplicada: usar `overflow-y: scroll` fijo en `.panelConfiguracionColumnaScroll`

### 7.5.9 Scratchpad - Sistema de Guardado

> **Requisito:** Antes de File Manager, Scratchpad debe tener su función de guardar implementada.

**Funcionalidad:**
- [ ] Botón badge "Guardar nota" (icono: `Save` o `Download`)
- [ ] Al guardar: almacenar nota con título automático (primeras palabras) y fecha
- [ ] Botón badge "Carpeta" (icono: `Folder`) junto al de guardar
- [ ] Al hacer clic en Carpeta: abrir lista de notas guardadas
- [ ] Las notas guardadas se pueden reabrir en el Scratchpad
- [ ] Las notas se pueden buscar por título/contenido

**Backend:**
- [ ] Tabla BD: `wp_glory_notas` (id, user_id, titulo, contenido, fecha_creacion)
- [ ] Endpoint: `POST /notas` - Guardar nota
- [ ] Endpoint: `GET /notas` - Listar notas del usuario
- [ ] Endpoint: `DELETE /notas/{id}` - Eliminar nota

**UI:**
- [ ] Modal o dropdown con lista de notas guardadas
- [ ] Preview del contenido en hover o expansión
- [ ] Opción de eliminar nota

### 7.5.10 Bug Fuente Pequeña en Scratchpad ✅

> **Problema resuelto:** La fuente "pequeña" era igual a "normal" (ambas 12px).

- [x] Identificado que `--dashboard-tamanoBase` = 12px y `0.75rem` = 12px (iguales)
- [x] Corregidos tamaños a valores fijos con diferencia visible:
  - Pequeña: 11px
  - Normal: 13px 
  - Grande: 16px
- [x] Añadido `line-height` apropiado para cada tamaño

---

### Resumen de Fase 7.5

| Tarea                            | Complejidad | Prioridad | Estado |
| -------------------------------- | ----------- | --------- | ------ |
| Ocultar chat en creación         | Baja        | Alta      | ✅      |
| Filtro mis asignadas sin hábitos | Baja        | Alta      | ✅      |
| Columnas visibles hábitos        | Baja        | Media     | ✅      |
| Orden paneles por defecto        | Baja        | Media     | ✅      |
| Botón minimizar paneles          | Baja        | Alta      | ✅      |
| Redimensionar ancho columnas     | Media-Alta  | Media     | ✅      |
| Redimensionar altura paneles     | Media       | Media     | ✅      |
| Scroll unificado + bug parpadeo  | Media       | Alta      | ✅      |
| Scratchpad guardado              | Media-Alta  | Alta      | ⏳      |
| Bug fuente pequeña Scratchpad    | Baja        | Baja      | ✅      |

**Complejidad Total:** Media | **Dependencias:** Fase 7 (modales completados)

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

## Fase 9: Scratchpad con Guardado + File Manager [BAJA PRIORIDAD]

**Objetivo:** Permitir guardar notas del Scratchpad y crear un gestor de archivos tipo Google Drive.

> **Nota:** Esta fase tiene baja prioridad. Se implementará después de las funcionalidades principales.

### 9.1 Scratchpad - Sistema de Guardado

- [ ] Agregar botón badge "Guardar nota" al Scratchpad
- [ ] Al guardar: la nota se almacena con título (primeras palabras o input) y fecha
- [ ] Agregar botón badge "Archivo" para ver notas guardadas
- [ ] Las notas guardadas se pueden reabrir en el Scratchpad
- [ ] Preview markdown en notas guardadas

### 9.2 File Manager (Drive Glory)

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

### 9.3 Funcionalidades del File Manager

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

### 9.4 Estructura de Componentes

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

### 9.5 Backend

- [ ] Tabla BD: `wp_glory_notas` (id, user_id, titulo, contenido, fecha_creacion, fecha_modificacion)
- [ ] Tabla BD: `wp_glory_carpetas` (id, user_id, nombre, padre_id, tipo)
- [ ] Endpoints API para notas (CRUD)
- [ ] Endpoint para listar archivos agrupados

**Complejidad:** Alta | **Dependencias:** Fase 1.5 (archivos físicos)

---

## Fase 10: Compartir Hábitos [BAJA PRIORIDAD]

**Objetivo:** Motivación social al compartir hábitos con compañeros.

> **Nota:** Esta fase tiene baja prioridad. No es crítica para el MVP.

### 10.1 Modelo de Hábitos Compartidos
> Cada persona tiene su propia instancia. Racha y cumplimiento son individuales.
> Solo comparten "el mismo hábito" para verse mutuamente.

- [ ] Tabla BD: `wp_glory_habitos_compartidos` (habito_id, usuario_origen, usuario_destino)
- [ ] Al compartir: se crea copia del hábito en cuenta del compañero
- [ ] Campo `habito_origen_id` para vincular ambas instancias
- [ ] Cada usuario cumple su hábito independientemente

### 10.2 UI de Hábitos Compartidos
- [ ] Opción en menú contextual: "Compartir hábito"
- [ ] Indicador visual: "Compartido con [Nombre]"
- [ ] Ver cuándo el compañero cumplió (badge o indicador)
- [ ] Notificación: "[Nombre] cumplió [Hábito] hoy"

### 10.3 Sincronización de Estado
- [ ] Endpoint para consultar estado de hábito del compañero
- [ ] Cache local para no sobrecargar
- [ ] Actualización periódica o al abrir panel

**Complejidad:** Media | **Dependencias:** Fase 2 (equipos), Fase 3 (notificaciones)

---

## Fase 11: Futuro (Post v1.1.0)

---

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

| Fase | Nombre                         | Complejidad | Estado         |
| ---- | ------------------------------ | ----------- | -------------- |
| 0    | Preparación (Alertas + Header) | Baja-Media  | ✅ Completada   |
| 1    | Almacenamiento                 | Media       | ✅ Completada   |
| 1.5  | Archivos Físicos + Cifrado     | Alta        | ✅ Completada   |
| 2    | Sistema de Equipos             | Alta        | ✅ Completada   |
| 3    | Notificaciones                 | Alta        | ✅ Completada   |
| 4    | Compartir Tareas/Proyectos     | Muy Alta    | ✅ Completada   |
| 5    | Sistema de Urgencia            | Media       | ✅ Completada   |
| 6    | Mejoras UX Rápidas             | Baja        | ✅ Completada   |
| 6.5  | Refact. Formularios            | Media       | ✅ Completada   |
| 6.6  | Hábitos en Ejecución           | Media       | ✅ Completada   |
| 7    | **Modal Chat + Historial**     | Muy Alta    | ✅ Completada   |
| 7.5  | **Correcciones UX + Resize**   | Media       | ⏳ En Progreso  |
| 8    | Mapa de Calor                  | Media-Alta  | Planificada    |
| 9    | Scratchpad + File Manager      | Alta        | Baja Prioridad |
| 10   | Compartir Hábitos              | Media       | Baja Prioridad |
| 11   | Futuro                         | Variable    | Pendiente      |

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
