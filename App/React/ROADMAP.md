# Dashboard de Productividad Personal - Roadmap

Sistema de seguimiento de hábitos, tareas y notas rápidas con diseño estilo terminal minimalista.

---

## Estado Actual

**Fecha de inicio:** 2025-12-19  
**Version:** v1.1.4-beta  
**Ultima actualizacion:** 2025-12-24
**Estado:** Fase 7 - COMPLETADA (Modal Chat + Historial)

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

| Bug                                    | Descripción                                                                                                                                                       | Estado                                                                                                                                |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| ~~**Urgencia no se guarda al crear**~~ | Al crear tarea desde badge +, la urgencia no se registra. Solo funciona al editar directamente.                                                                   | ✅ Arreglado v1.0.9 - Añadido parámetro `urgencia` en `useAccionesDashboard.manejarCrearNuevaTareaGlobal`                              |
| ~~**Columna created_at no existe**~~   | Error SQL `Unknown column 't.created_at'` en `CompartidosService.obtenerTareasAsignadasAMi`. La tabla `wp_glory_tareas` no tiene esa columna.                     | ✅ Arreglado v1.0.9 - Query de diagnóstico ahora usa solo `updated_at` que sí existe en la tabla                                       |
| ~~**Scratchpad Pierde Datos**~~        | Al escribir en Scratchpad, dice \"Guardado\" pero al recargar se pierde el contenido.                                                                             | ✅ Arreglado v1.0.8 - `useRef` para evitar race condition al sincronizar datos del servidor mientras usuario edita                     |
| ~~**Sincronización Multi-Ventana**~~   | Las tareas no se sincronizaban entre diferentes ventanas/dispositivos. Cuando la carga del servidor fallaba, se sobrescribían los datos reales con datos locales. | ✅ Arreglado v1.0.7 - Eliminado auto-guardado en servidor cuando carga falla, añadida ventana de gracia para evitar parpadeo del badge |
| ~~**BD Compartidos**~~                 | Error `Unknown column 'c.fecha_compartido'` y `c.propietario_id`                                                                                                  | ✅ Arreglado v1.0.6 - Añadida función `repairTables()` en Schema.php                                                                   |
| ~~**401 en Adjuntos Cifrados**~~       | Error 401 Unauthorized al cargar imágenes `.enc` después de un tiempo                                                                                             | ✅ Arreglado - Añadido header `X-WP-Nonce` en SeccionAdjuntos.tsx                                                                      |

### Menores

| Bug                            | Descripción                                                                     | Estado                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Thumbnails Warning en Prod** | Warning: "No se pudo generar thumbnail" en producción. Servidor sin GD/Imagick. | ⏳ Pendiente - Migrar servidor de PHP 8.4 a PHP 8.3 (el paquete php8.4-gd no existe en repositorio) |
| ~~**Tooltips desbordados**~~   | Los tooltips se salen de la pantalla a veces                                    | ✅ Arreglado - Detección de bordes en TooltipSystem.tsx                                             |
| ~~**Adjuntos eliminados**~~    | Al eliminar adjunto, no se quita instantáneamente del UI                        | ✅ Arreglado - Optimistic update en SeccionAdjuntos.tsx                                             |
| **Adjuntos múltiples**         | Al eliminar múltiples adjuntos, reaparecen algunos                              | Pendiente - Investigar estado React                                                                |

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

## Fase 5: Sistema de Urgencia [COMPLETADO]

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
- [x] Integrar en `FormularioProyecto.tsx`
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

## Fase 6: Mejoras UX Rápidas [COMPLETADA]

**Objetivo:** Pequeñas mejoras de experiencia de usuario identificadas.

### 6.1 Notificaciones - Lectura Automática ✅

- [x] Las notificaciones se marcan como leídas automáticamente al abrir el panel
- [x] Eliminar botón "Marcar todas como leídas" (ya no es necesario)
- [x] Las notificaciones existentes cargan instantáneamente (cache local con `cargandoPrimeraVez`)
- [x] Solo mostrar "Cargando..." para la primera carga sin datos en cache

### 6.2 Exportar/Importar - Mover al Menú de Perfil ✅

- [x] Quitar panel de Exportar/Importar del grid de columnas
- [x] Agregar opciones "Exportar datos" e "Importar datos" al menú contextual del perfil (header)

### 6.3 Auto-Guardado en Modales de Configuración ✅

> **Implementado para:** Modal de configuración de Tareas (PanelConfiguracionTarea)

- [x] Los cambios se guardan automáticamente al cerrar el modal (overlay, ESC, X)
- [x] El botón "Cancelar" descarta los cambios y cierra el modal
- [x] El botón "Guardar" se mantiene (guarda y cierra inmediatamente)

> **Nota:** Hábitos y Proyectos usan arquitectura diferente (formulario dentro de Modal externo). Ver Fase 6.5 para refactorización.

**Complejidad:** Baja | **Dependencias:** Ninguna

---

## Fase 6.5: Refactorización Formularios Hábitos/Proyectos [COMPLETADA]

**Objetivo:** Unificar arquitectura de formularios para permitir auto-guardado completo.

> **Problema resuelto:** `FormularioHabito` y `FormularioProyecto` ahora manejan su propio `<Modal>` interno, permitiendo auto-guardado con detección de cambios.

### 6.5.1 Refactorizar FormularioHabito ✅

- [x] Convertir `FormularioHabito` a `ModalHabito` (similar a `PanelConfiguracionTarea`)
- [x] El componente maneja su propio `<Modal>` interno
- [x] Implementar auto-guardado al cerrar (overlay, ESC, X) **solo si hay cambios**
- [x] Mantener botón "Cancelar" para descartar cambios
- [x] Actualizar `DashboardModales.tsx` para usar el nuevo componente

### 6.5.2 Refactorizar FormularioProyecto ✅

- [x] Convertir `FormularioProyecto` a `ModalProyecto` (similar a `PanelConfiguracionTarea`)
- [x] El componente maneja su propio `<Modal>` interno
- [x] Implementar auto-guardado al cerrar **solo si hay cambios**
- [x] Mantener botón "Cancelar" para descartar cambios
- [x] Actualizar `DashboardModales.tsx` para usar el nuevo componente

### 6.5.3 Detección de Cambios ✅

- [x] `PanelConfiguracionTarea`: Detecta cambios antes de guardar
- [x] `ModalHabito`: Detecta cambios antes de guardar
- [x] `ModalProyecto`: Detecta cambios antes de guardar
- [x] Solo se muestra "deshacer" cuando hay cambios reales

**Complejidad:** Media | **Dependencias:** Fase 6

---

## Fase 6.6: Hábitos en Ejecución [COMPLETADA]

**Objetivo:** Mostrar hábitos que "tocan hoy" como tareas virtuales en el panel de Ejecución, permitiendo un flujo unificado de trabajo.

> **Concepto:** Los hábitos son como tareas recurrentes. Cuando está habilitada la opción, aparecen en Ejecución con su urgencia calculada automáticamente basada en días de inactividad.

### 6.6.1 Modelo TareaHabito ✅

- [x] Tipo `TareaHabito` que extiende `Tarea` con campos específicos
- [x] IDs negativos para evitar colisión con tareas reales (`-habitoId - 10000`)
- [x] Type guard `esTareaHabito()` para detectar tareas virtuales
- [x] Campos: `esHabito`, `habitoId`, `habitoNombre`, `habitoRacha`, `habitoImportancia`

### 6.6.2 Urgencia Automática ✅

**Fórmula de urgencia basada en días de inactividad:**

| Días Inactivo | Urgencia     | Descripción                        |
| ------------- | ------------ | ---------------------------------- |
| 0-1 + racha   | `chill`      | Todo bien, mantiene la racha       |
| 1-2           | `normal`     | Debería hacerse pronto             |
| 3-4           | `urgente`    | Atención, la racha está en peligro |
| 5+            | `bloqueante` | Crítico, la racha se perderá       |

### 6.6.3 Integración Frontend ✅

- [x] Hook `useHabitosComoTareas` convierte hábitos a tareas virtuales
- [x] Hook `useConfiguracionTareas` con toggle `mostrarHabitosEnEjecucion`
- [x] `useDashboardCompleto` combina tareas + tareas-hábito
- [x] `useOrdenarTareas` ordena la combinación con el algoritmo inteligente
- [x] `DashboardGrid` intercepta toggle de tareas-hábito

### 6.6.4 UI/UX ✅

- [x] Badge de hábito con icono `Repeat2` y racha actual
- [x] Variante CSS `.badgeInfo--habito`
- [x] Toggle en `ModalConfiguracionTareas` (desactivado por defecto)
- [x] Sin menú contextual para tareas-hábito (valores dependen del hábito)
- [x] Sin acciones inline (configurar/eliminar) para tareas-hábito
- [x] Sin edición inline del texto

### 6.6.5 Drag & Drop ✅

- [x] Tareas-hábito excluidas del `Reorder.Group` (no arrastrables)
- [x] En modo manual: tareas-hábito aparecen después de tareas reales
- [x] En modo inteligente/fecha/prioridad: tareas mezcladas según algoritmo

### 6.6.6 Comportamiento de Toggle ✅

- [x] Al marcar completada una tarea-hábito, se completa el hábito original
- [x] La tarea-hábito desaparece de Ejecución (ya no "toca hoy")
- [x] La racha del hábito aumenta normalmente

**Complejidad:** Media | **Dependencias:** Fase 5, 6

---

## Fase 7: Modal Expandido con Chat e Historial [EN PROGRESO]

**Objetivo:** Comunicación y trazabilidad en tareas/proyectos/hábitos compartidos.

### 7.1 Nuevo Diseño del Modal de Tarea ✅

> El modal actual se expande al doble de ancho con 2 columnas.

**Columna Izquierda (existente):**
- [x] Información de la tarea (nombre, descripción, prioridad, etc.)
- [x] Adjuntos
- [x] Configuración (repetición, asignación)

**Columna Derecha (nueva):**
- [x] Panel con pestañas Chat/Historial/Participantes
- [x] Estructura visual placeholder
- [x] Responsive: pestañas en móvil

**Archivos creados:**
- `components/dashboard/PanelChatHistorial.tsx`
- `styles/dashboard/componentes/chatHistorial.css`

**Archivos modificados:**
- `components/dashboard/PanelConfiguracionTarea.tsx` - Layout 2 columnas
- `styles/dashboard/componentes/modal.css` - Variante `.modalContenedor--expandido`
- `styles/dashboard/componentes/panelConfiguracion.css` - Grid 2 columnas + responsive

### 7.1.1 Correcciones ✅

- [x] **Botones Cancelar/Guardar**: Centrados en el contenedor fijo con estilos específicos
- [x] **Unificar Chat + Historial**: Timeline único sin pestañas separadas, participantes como toggle en header

### 7.2 Sistema Unificado de Chat + Historial

> **Concepto clave:** Chat e Historial son UN SOLO timeline. Los mensajes del sistema SON el historial.

**Tipos de mensaje en el timeline:**

| Tipo       | Descripción                     | Estilo Visual                           |
| ---------- | ------------------------------- | --------------------------------------- |
| `enviado`  | Mensaje del usuario actual      | Alineado a la derecha, fondo destacado  |
| `recibido` | Mensaje de otro participante    | Alineado a la izquierda, fondo normal   |
| `sistema`  | Acción de historial (inmutable) | Centrado, estilo sutil, icono de acción |

**Backend:** ✅
- [x] Tabla BD: `wp_glory_mensajes` (id, tipo_elemento, elemento_id, usuario_id, contenido, tipo_mensaje, fecha)
  - `tipo_elemento`: 'tarea' | 'proyecto' | 'habito'
  - `tipo_mensaje`: 'usuario' | 'sistema'
- [x] Endpoint: `POST /mensajes` - Enviar mensaje
- [x] Endpoint: `GET /mensajes/{tipo}/{id}` - Obtener timeline
- [x] `MensajesRepository.php` - Persistencia de mensajes
- [x] `MensajesService.php` - Registro de eventos del sistema
- [x] `Schema::ensureTableExists()` - Migración automática de tablas
- [x] Endpoint: `POST /mensajes/evento` - Registrar eventos desde frontend
- [x] Integrar `registrarEventoSistema()` en `useTareas`

**Frontend:** ✅
- [x] Hook `useMensajes.ts` - Comunicación con API
- [x] Componente `PanelChatHistorial` conectado a la API real
- [x] Input de mensaje con Enter para enviar
- [x] Scroll automático al último mensaje
- [x] Función `registrarEventoSistema()` para registrar cambios
- [x] Toggle para ocultar/mostrar panel de chat (persistente en localStorage)
- [x] Indicador de mensajes sin leer en botón de toggle
- [ ] Indicador de "escribiendo..." (futuro)

**Acciones que generan mensaje sistema:** ✅
- [x] Infraestructura lista (endpoint + función)
- [x] Integrado en `useTareas.toggleTarea()` - Completado/Reabierto
- [x] Integrado en `useTareas.editarTarea()` con detección de cambios:
  - Cambio de nombre
  - Cambio de descripción  
  - Cambio de prioridad
  - Cambio de urgencia
  - Cambio de fecha límite
  - Cambio de asignación (asignado/desasignado)

### 7.3 Sistema de Mensajes No Leídos ✅

> **Tu sugerencia:** Badge de notificación cuando hay mensajes/cambios sin leer.

**Backend:**
- [x] Tabla BD: `wp_glory_mensajes_leidos` (usuario_id, tipo_elemento, elemento_id, ultimo_mensaje_leido)
- [x] Endpoint: `POST /mensajes/marcar-leido` - Marcar como leído
- [x] Endpoint: `GET /mensajes/no-leidos/{tipo}/{id}` - Contar no leídos de un elemento
- [x] Endpoint: `POST /mensajes/no-leidos-masivo` - Contar no leídos de múltiples elementos
- [x] `MensajesRepository::marcarComoLeido()` - Actualiza último visto
- [x] `MensajesRepository::contarNoLeidos()` - Cuenta mensajes nuevos
- [x] `MensajesRepository::contarNoLeidosMasivo()` - Optimizado para listas
- [x] Auto-marcar como leído al ver el timeline

**Frontend:**
- [x] Hook `useMensajesNoLeidos` - Obtiene conteo para badges
- [x] Prop `mensajesNoLeidos` en `TareaItem`
- [x] Función `renderBadgeMensajesNoLeidos()` con icono MessageCircle
- [x] Variante CSS `badgeInfo--mensajeNoLeido` con color azul y animación
- [x] Integrar hook en `ListaTareas` para pasar conteo

### 7.4 UI del Timeline ✅

- [x] Timeline unificado (scroll único)
- [x] Mensajes usuario: burbuja con avatar
- [x] Mensajes sistema: línea con icono y texto pequeño
- [x] Fecha separadora por día
- [x] Badge de mensajes no leídos (infraestructura lista)

### 7.5 Pestaña Participantes ✅

- [x] Lista de participantes del elemento compartido
- [x] Avatar + nombre + rol (propietario/colaborador)
- [x] Solo visible si el elemento está compartido

### 7.6 Aplicar a Proyectos y Hábitos ✅

- [x] Modal de proyecto con timeline (siempre visible en modo edición)
- [x] Modal de hábito con timeline (siempre visible en modo edición)
- [x] Componente `PanelChatHistorial` reutilizable
- [x] Sin botón eliminar en modales (consistente con tareas)
- [x] Toggle chat/historial persistente en localStorage

### 7.7 Notificaciones de Mensajes ✅

- [x] `NotificacionesService::notificarMensajeChat()` - Crea notificación
- [x] `MensajesApiController::notificarParticipantes()` - Obtiene participantes
- [x] Al enviar mensaje, se notifica a todos los participantes excepto al remitente
- [x] Notificación incluye: nombre del remitente, tipo elemento, preview del mensaje

**Complejidad:** Muy Alta | **Dependencias:** Fase 2, 3, 4 (requiere sistema social completo)

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
