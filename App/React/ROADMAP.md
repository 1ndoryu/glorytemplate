# Dashboard de Productividad Personal - Roadmap

Sistema de seguimiento de hábitos, tareas y notas rápidas con diseño estilo terminal minimalista.

---

## Estado Actual

**Fecha de inicio:** 2025-12-19  
**Version:** v1.0.1-beta  
**Ultima actualizacion:** 2025-12-22
**Estado:** Funcionalidades Core Completadas - Mejoras Menores Pendientes

---

## Funcionalidades Completadas (Compactado)

<details>
<summary><strong>🏗️ Infraestructura Base</strong></summary>

- Arquitectura SOLID con componentes modulares
- Sistema de estilos CSS centralizado (sin hardcodeo)
- Tipos TypeScript completos (Habito, Tarea, Proyecto, Frecuencia, Prioridad)
- Hooks: `useDashboard`, `useTareas`, `useProyectos`, `useDeshacer`, `useOrdenarHabitos`, `useLocalStorage`, `useDebounce`, `useSincronizacion`, `useDashboardApi`, `useCifrado`, `useSuscripcion`, `useStripe`
- Persistencia dual: LocalStorage + Servidor WordPress
- Sincronización automática con indicador visual
- Cifrado E2E opcional (AES-256-GCM)

</details>

<details>
<summary><strong>✅ Hábitos (Completo)</strong></summary>

- CRUD completo con modal de edición
- Frecuencias: Diario, Cada X días, Semanal, Días específicos, Mensual
- Sistema de rachas con cálculo automático y reseteo inteligente
- Badges: prioridad, frecuencia, "Toca Hoy"
- 5 modos de ordenamiento: importancia, urgentes, racha, nombre, inteligente
- Menú contextual con opciones rápidas

</details>

<details>
<summary><strong>📋 Tareas (Completo)</strong></summary>

- CRUD inline con guardado automático
- Subtareas con Tab/Shift+Tab, colapsables, contador X/Y
- Drag & Drop avanzado con gestos horizontales
- Prioridad Alta/Media/Baja con badges visuales
- Panel de configuración: fecha límite, descripción, repetición, adjuntos
- Adjuntos: imágenes (zoom), audios (reproductor), documentos (descarga)

</details>

<details>
<summary><strong>📁 Proyectos (Completo)</strong></summary>

- Jerarquía 3 niveles: Proyecto > Tarea > Subtarea
- CRUD con formulario modal
- Lista de proyectos con resumen y progreso
- Vista integrada expandible con tareas
- Menú contextual (Editar, Eliminar, Estado)

</details>

<details>
<summary><strong>💳 Sistema Freemium y Pagos (Completo)</strong></summary>

- Modelo: FREE (limitado) / PREMIUM (ilimitado)
- Trial 14 días activable
- Integración Stripe completa (checkout, webhooks, portal)
- Planes: Mensual $4.99 / Anual $39.99
- Indicador de plan en header + Modal de upgrade

</details>

<details>
<summary><strong>🔐 Backend y Seguridad (Completo)</strong></summary>

- API REST WordPress completa con autenticación y nonce CSRF
- Base de datos: tablas personalizadas (`wp_glory_*`)
- Cifrado AES-256-GCM con derivación HKDF-SHA256
- Sync incremental con debounce y reintentos

</details>

<details>
<summary><strong>👑 Panel Administración (Completo)</strong></summary>

- Badge "ADMINISTRACIÓN" en header (solo admins)
- Modal con gestión de usuarios
- Filtros por plan, estado premium
- Acciones: cancelar/activar premium, ver detalles
- Estadísticas de resumen

</details>

<details>
<summary><strong>🎨 UI/UX Estandarizada (Completo)</strong></summary>

- Componentes compartidos: Modal, MenuContextual, BadgeInfo, AccionesItem
- Campos reutilizables: CampoTexto, CampoPrioridad, CampoFechaLimite
- Sistema de badges unificado con variantes
- CSS modular por responsabilidad

</details>

<details>
<summary><strong>🎯 Filtros Inteligentes (Completo)</strong></summary>

- Componente `SelectorBadge` reemplaza selects nativos
- Filtros de tareas: sueltas, por proyecto, todas
- Mover tareas entre proyectos desde menú contextual
- Ordenamiento: inteligente, por fecha, por importancia
- Sistema de tooltips personalizados
- Controles compactos y estética coherente

</details>

<details>
<summary><strong>🎨 Estandarización UX (Completo)</strong></summary>

- Botones "Nuevo" estilo badge en todos los paneles
- Iconos unificados (10px - 12px)
- Tooltips en todos los botones
- Alineación vertical correcta en encabezados

</details>

<details>
<summary><strong>📝 Scratchpad Seguro (Completo)</strong></summary>

- Cifrado E2E cuando está activo
- Límite 20,000 caracteres con contador
- Advertencia al 90% de capacidad
- Debounce optimizado (1.5s)
- Indicador de estado de guardado

</details>

<details>
<summary><strong>🔲 Layout Personalizable (Completo)</strong></summary>

- Resize handle entre columnas
- Modos: 1, 2 y 3 columnas
- Toggle visibilidad de paneles
- Paneles ocultos en barra lateral
- CSS Grid/Flexbox adaptativo

</details>

<details>
<summary><strong>🔄 Reordenamiento de Paneles (Completo)</strong></summary>

- Sistema Drag & Drop personalizado (sin dependencias)
- Hook `useArrastrePaneles` con mouse events
- Handle de arrastre en cada panel
- Feedback visual durante arrastre
- Controles en modal de configuración
- Animaciones suaves

</details>

<details>
<summary><strong>📜 Historial de Versiones (Completo)</strong></summary>

- Modal al hacer click en badge de versión
- Lista ordenada de releases
- Formato semver (MAJOR.MINOR.PATCH)
- Etiquetas: alpha, beta, stable

</details>

<details>
<summary><strong>👤 Perfil de Usuario (Completo)</strong></summary>

- Modal de perfil desde nombre de usuario
- Foto de perfil con subida base64
- Nombre y descripción editables
- Cambio de contraseña
- Recuperación de contraseña desde login
- Avatar visible en header
- Integración con WordPress (AvatarIntegration)

</details>

<details>
<summary><strong>⚙️ Configuración por Panel (Completo)</strong></summary>

- **Hábitos:** Ocultar completados, columnas visibles, modo compacto
- **Tareas:** Ocultar completadas, badge proyecto, limpieza automática
- **Proyectos:** Ocultar completados, orden, progreso
- **Scratchpad:** Tamaño fuente, altura, intervalo guardado

</details>

---

### 📌 Mejoras Menores (Baja Prioridad)

<details>
<summary>Expandir lista completa</summary>

**Adjuntos:**
- [ ] Bug: Al eliminar adjunto, no se quita instantáneamente del UI
- [ ] Bug: Al eliminar múltiples adjuntos, reaparecen algunos (problema de estado React)

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

**Scratchpad:**
- [ ] Preview markdown
- [ ] Múltiples notas (tabs)

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

**Pulido y Mobile Fase Reordenamiento - Pulido Mobile**
- [ ] Touch events para dispositivos táctiles
- [ ] Fallback a controles del modal para accesibilidad
- [ ] Animación de "snap" al soltar
- [ ] Cursor personalizado durante arrastre


</details>

---

## 🔮 Próximas Funcionalidades (v1.1.0 - Sistema Social)

> **Nota:** Las fases están ordenadas por dependencias. Completar en orden.

---

### Fase 0: Preparación de Infraestructura ✅

**Objetivo:** Crear bases necesarias antes de funcionalidades sociales.

#### 0.1 Sistema de Alertas Personalizadas ✅
> Reemplaza `alert()` y `confirm()` del navegador con modales propios.

- [x] Componente `AlertaPersonalizada` (éxito, error, advertencia, confirmación)
- [x] Hook `useAlertas` para gestionar cola de alertas
- [x] Animaciones de entrada/salida
- [x] Estilos coherentes con el proyecto
- [x] Soporte para acciones (botones Aceptar/Cancelar)

**Archivos creados:**
- `hooks/useAlertas.ts` - Hook para gestionar alertas
- `components/shared/AlertaToast.tsx` - Toast individual
- `components/shared/AlertaConfirmacion.tsx` - Modal de confirmación
- `components/shared/ContenedorAlertas.tsx` - Contenedor de toasts
- `context/AlertasContext.tsx` - Contexto global
- `styles/dashboard/shared/alertas.css` - Estilos

#### 0.2 Compactar Header a Iconos ✅
> Reducir espacio visual del header para dar cabida a nuevos elementos.

**Antes:** Badges con texto (Versión, Conectado, Logout, Premium)
**Después:** Solo iconos con tooltips + menú contextual

- [x] Convertir badge "Versión" a icono (ClipboardList)
- [x] Unificar indicador Conexión + Sincronización (Wifi/WifiOff/RefreshCw/AlertTriangle)
- [x] Badge "Admin" convertido a solo icono
- [x] Logout movido a menú contextual del usuario
- [x] Menú contextual en badge de usuario (Perfil, Cerrar Sesión)
- [x] Tooltips en todos los iconos
- [x] Estados visuales: conectado (verde), desconectado (gris), error (rojo), sincronizando (azul)
- [x] Animación de giro para icono de sincronización
- [x] Nuevo estilo unificado `.botonIconoEncabezado`

**Complejidad:** Baja | **Archivos:** encabezado.css, DashboardEncabezado.tsx

---

### Fase 1: Sistema de Almacenamiento ✅

**Objetivo:** Control de uso de espacio por usuario.

#### 1.1 Límites de Almacenamiento
| Plan    | Límite |
| ------- | ------ |
| Free    | 50 MB  |
| Premium | 10 GB  |

- [x] Calcular tamaño total de adjuntos por usuario (backend)
- [x] Endpoint API: `GET /glory/v1/almacenamiento` (usado, límite, porcentaje)
- [x] Hook `useAlmacenamiento` para consultar estado
- [x] Bloquear subida si se excede límite (endpoint POST verificación)
- [x] Indicador de uso en Modal de Perfil (barra de progreso)
- [x] Alerta al 90% de capacidad

**Archivos creados:**
- `App/Services/AlmacenamientoService.php` - Servicio backend
- `App/React/hooks/useAlmacenamiento.ts` - Hook frontend
- `App/React/components/shared/IndicadorAlmacenamiento.tsx` - Componente visual
- `App/React/styles/dashboard/shared/indicadorAlmacenamiento.css` - Estilos
- `App/React/types/dashboard.ts` - Tipo InfoAlmacenamiento


**Complejidad:** Media | **Dependencias:** Ninguna

---

### Fase 1.5: Archivos Físicos y Optimización de Cifrado

**Objetivo:** Migrar de Base64 a archivos físicos, optimizar cifrado para rendimiento.

#### Problema Actual
| Aspecto  | Estado Actual           | Problema                     |
| -------- | ----------------------- | ---------------------------- |
| Adjuntos | Base64 en JSON          | +33% tamaño, infla BD        |
| Cifrado  | Servidor (PHP)          | CPU servidor, no es E2E real |
| Cache    | Sin cache               | Descifra en cada petición    |
| Clave    | En servidor (user_meta) | Servidor tiene acceso        |

#### Diferenciación por Plan

| Característica                                | Free       | Premium                   |
| --------------------------------------------- | ---------- | ------------------------- |
| Cifrado de datos (tareas, hábitos, proyectos) | Si         | Si                        |
| Cifrado de archivos adjuntos                  | No         | Si                        |
| Thumbnails de imágenes                        | Sin cifrar | Sin cifrar (optimización) |
| Límite almacenamiento                         | 50 MB      | 10 GB                     |

**Justificación:** Cifrar archivos es costoso computacionalmente. Los usuarios Free tienen límite bajo (50MB), el impacto de archivos sin cifrar es menor. Premium obtiene seguridad completa como beneficio.

#### 1.5.1 Sistema de Archivos Físicos ✅
**Ubicación:** `/wp-content/uploads/glory-adjuntos/{user_id}/`

**Estructura de archivos:**
```
glory-adjuntos/
  {user_id}/
    {hash_archivo}.enc    ← Archivo cifrado (Premium)
    {hash_archivo}.raw    ← Archivo sin cifrar (Free)
    thumbs/
      {hash_archivo}.jpg  ← Thumbnail sin cifrar (todos)
```

- [x] Crear `AdjuntosService.php` con métodos:
  - `subirArchivo($archivo)` → retorna datos del adjunto
  - `obtenerArchivo($nombreArchivo)` → descifra si es .enc
  - `eliminarArchivo($nombreArchivo)` → elimina archivo + thumbnail
  - `generarThumbnail($imagePath)` → versión 200x200 sin cifrar
  - `calcularEspacioUsado()` → espacio total en disco
- [x] Endpoint `POST /glory/v1/adjuntos` para subida directa multipart
- [x] Endpoint `GET /glory/v1/adjuntos/{id}` para descarga (descifra on-the-fly)
- [x] Endpoint `DELETE /glory/v1/adjuntos/{id}` para eliminación
- [x] Hook `useAdjuntos.ts` para gestión frontend
- [x] Actualizar `SeccionAdjuntos.tsx` para subida multipart (no Base64)
- [x] Actualizar `AlmacenamientoService.php` para contar archivos físicos + legacy
- [ ] Migración: script para convertir Base64 existentes → archivos (no aplica, sin usuarios)

**Archivos creados/modificados:**
- `App/Services/AdjuntosService.php` - Servicio de archivos físicos (nuevo)
- `App/Api/AdjuntosApiController.php` - Endpoints REST (nuevo)
- `App/React/hooks/useAdjuntos.ts` - Hook frontend (nuevo)
- `App/React/components/dashboard/SeccionAdjuntos.tsx` - Actualizado para subida multipart
- `App/React/styles/dashboard/componentes/adjuntos.css` - Estilos de loading y errores
- `App/Services/AlmacenamientoService.php` - Actualizado para contar físicos + legacy

**Nota:** Los archivos PHP se cargan automáticamente desde `functions.php`.

#### 1.5.2 Optimización de Cifrado de Archivos (Solo Premium) ✅

**Técnicas de rendimiento:**

1. **Stream Cipher (archivos grandes > 1MB):**
   ```php
   // Procesar en chunks de 8KB para no saturar RAM
   // Archivos pequeños (<1MB): cifrado en memoria (más eficiente)
   // Archivos grandes (>1MB): stream cipher en chunks
   // Formato: [tipo:2bytes][num_chunks:4bytes][chunk1_len:4bytes][chunk1_data]...
   ```
   - [x] Implementar `cifrarEnStream()` en `AdjuntosService`
   - [x] Implementar `descifrarStream()` en `AdjuntosService`
   - [x] Detectar automáticamente si usar memoria o stream (umbral: 1MB)

2. **Cache de archivos descifrados:**
   ```
   glory-adjuntos/{user_id}/cache/{hash_archivo}  ← TTL 5 minutos
   ```
   - [x] Crear directorio de cache por usuario
   - [x] Verificar cache antes de descifrar (`obtenerDeCache()`)
   - [x] Guardar en cache tras descifrar (`guardarEnCache()`)
   - [x] Método `limpiarCache()` para eliminar archivos expirados

3. **Thumbnails sin cifrar:** (ya implementado en 1.5.1)
   - Preview rápido sin costo de descifrado
   - Archivo original cifrado para descarga
   - [x] Generar thumbnail al subir imagen
   - [x] Mostrar thumbnail en lista, cifrado en modal/descarga
   - [x] Añadir `thumbnailUrl` al tipo `Adjunto`

4. **Lazy Decryption:**
   - No descifrar hasta que usuario haga clic
   - [x] Mostrar placeholder con icono de candado (si no hay thumbnail)
   - [x] Mostrar thumbnail con indicador de cifrado superpuesto
   - [x] Descifrar on-demand al hacer clic
   - [x] Estados visuales: candado, cargando, contenido
   - [x] Estilos CSS para archivos cifrados (`.adjuntoIndicadorCifrado`)

**Archivos modificados:**
- `App/Services/AdjuntosService.php` - Stream cipher, cache, descifrado
- `App/React/types/dashboard.ts` - Añadido `thumbnailUrl` a `Adjunto`
- `App/React/hooks/useAdjuntos.ts` - Incluir `thumbnailUrl` del servidor
- `App/React/components/dashboard/SeccionAdjuntos.tsx` - Lazy loading UI
- `App/React/styles/dashboard/componentes/adjuntos.css` - Estilos cifrado

---

### Fase 2: Sistema de Equipos ✅

**Objetivo:** Permitir conexión entre usuarios para colaboración.

#### 2.1 Infraestructura de Equipos
- [x] Tabla BD: `wp_glory_equipos` (id, usuario_id, compañero_id, estado, fecha)
- [x] Estados: `pendiente`, `aceptada`, `rechazada`, `pendiente_registro`
- [x] Endpoint API: `POST /glory/v1/equipos/solicitud` (enviar por correo)
- [x] Endpoint API: `GET /glory/v1/equipos` (listar compañeros)
- [x] Endpoint API: `GET /glory/v1/equipos/pendientes` (contador para badge)
- [x] Endpoint API: `PUT /glory/v1/equipos/{id}/responder` (aceptar/rechazar)
- [x] Endpoint API: `DELETE /glory/v1/equipos/{id}` (eliminar/cancelar)

#### 2.2 UI de Equipos
- [x] Icono "Social" (Users) en header, al lado del configurar layout
- [x] Badge con contador de solicitudes pendientes
- [x] Modal de Equipos con pestañas:
  - Solicitudes recibidas (con Aceptar/Rechazar)
  - Solicitudes enviadas (con opción Cancelar)
  - Lista de compañeros activos
- [x] Formulario para enviar solicitud (input de correo con validación)
- [x] Estado "Pendiente de registro" si usuario no existe
- [x] Hook `useEquipos` para gestionar estado

#### 2.3 Lógica de Solicitudes Pendientes
- [x] Si el correo no existe en BD, guardar solicitud como `pendiente_registro`
- [x] Al registrarse nuevo usuario, buscar solicitudes pendientes y activarlas (hook en `user_register`)
- [ ] (Futuro) Enviar correo de invitación si no está registrado

**Archivos creados:**
- `App/Database/Schema.php` - Actualizado v1.0.2, añadida tabla `wp_glory_equipos`
- `App/Services/EquiposService.php` - Lógica de equipos
- `App/Api/EquiposApiController.php` - Endpoints REST
- `App/React/hooks/useEquipos.ts` - Hook de gestión de equipos
- `App/React/components/equipos/ModalEquipos.tsx` - Modal principal
- `App/React/components/equipos/FormularioSolicitud.tsx` - Formulario de invitación
- `App/React/components/equipos/ListaSolicitudes.tsx` - Lista de solicitudes
- `App/React/components/equipos/ListaCompaneros.tsx` - Lista de compañeros
- `App/React/components/equipos/index.ts` - Exportaciones
- `App/React/styles/dashboard/componentes/equipos.css` - Estilos

**Archivos modificados:**
- `App/React/components/dashboard/DashboardEncabezado.tsx` - Botón de equipos
- `App/React/islands/DashboardIsland.tsx` - Integración del modal
- `App/React/styles/dashboard/componentes/encabezado.css` - Estilos del botón
- `App/React/styles/dashboard/index.css` - Import de estilos
- `App/React/utils/fecha.ts` - Añadida `formatearFechaRelativa`
- `App/React/types/dashboard.ts` - Tipos de equipos

**Complejidad:** Alta | **Dependencias:** Fase 0 (alertas para confirmaciones)

---

### Fase 3: Sistema de Notificaciones [COMPLETADA]

**Objetivo:** Notificar eventos importantes dentro de la aplicación.

#### 3.1 Infraestructura de Notificaciones
- [x] Tabla BD: `wp_glory_notificaciones` (id, usuario_id, tipo, contenido, leida, fecha)
- [x] Tipos de notificación implementados:
  - `solicitud_equipo` - Nueva solicitud de compañero
  - `tarea_vence_hoy` - Tarea con fecha límite hoy
  - Tipos preparados (estructura lista): `tarea_asignada`, `tarea_removida`, `adjunto_agregado`, `mensaje_chat`, `habito_companero`

#### 3.2 UI de Notificaciones
- [x] Icono de campana (Bell) en header con badge de contador (solo si hay no leídas)
- [x] Dropdown/Modal con lista de notificaciones recientes
- [x] Acciones: Marcar como leída (individual/todas), Eliminar
- [x] Polling automático cada 30 segundos para nuevas notificaciones

#### 3.3 Integración Inicial
- [x] Disparar notificación al recibir solicitud de equipo (integrado en `NotificacionesService`)
- [x] Método helper para cron de tareas vencidas (`NotificacionesService::notificarTareasVencenHoy`)

**Archivos creados:**
- `App/Database/Schema.php` - Actualizado v1.0.3, añadida tabla `wp_glory_notificaciones`
- `App/Services/NotificacionesService.php` - Lógica de notificaciones
- `App/Api/NotificacionesApiController.php` - Endpoints REST
- `App/React/hooks/useNotificaciones.ts` - Hook de gestión
- `App/React/components/notificaciones/ModalNotificaciones.tsx` - Componente lista
- `App/React/components/notificaciones/ItemNotificacion.tsx` - Componente item individual
- `App/React/components/notificaciones/index.ts` - Exports
- `App/React/styles/dashboard/componentes/notificaciones.css` - Estilos

**Archivos modificados:**
- `App/React/types/dashboard.ts` - Tipos de notificación
- `App/React/components/dashboard/DashboardEncabezado.tsx` - Botón de campana
- `App/React/islands/DashboardIsland.tsx` - Integración global
- `App/React/styles/dashboard/index.css` - Import de estilos

**Complejidad:** Media | **Dependencias:** Fase 2 (Equipos)
  - `mensaje_chat` - Nuevo mensaje en tarea/proyecto/hábito
  - `habito_companero` - Compañero cumplió hábito compartido
- [x] Endpoint API: `GET /glory/v1/notificaciones` (listar, con paginación)
- [x] Endpoint API: `PUT /glory/v1/notificaciones/{id}/leer`
- [x] Endpoint API: `PUT /glory/v1/notificaciones/leer-todas`
- [x] Endpoint API: `DELETE /glory/v1/notificaciones/{id}`

#### 3.2 UI de Notificaciones
- [x] Icono campana (🔔) en header
- [x] Contador de no leídas (badge numérico)
- [x] Dropdown/Modal con lista de notificaciones
- [x] Marcar como leída al hacer clic
- [x] Botón "Marcar todas como leídas"
- [x] Acción rápida según tipo (ir a tarea, abrir solicitud, etc.)
- [x] Hook `useNotificaciones` con polling o WebSocket

#### 3.3 Generación Automática de Notificaciones
- [x] Cron job o trigger para `tarea_vence_hoy`
- [x] Hooks en acciones (asignar tarea, agregar adjunto, etc.)

**Complejidad:** Alta | **Dependencias:** Fase 0 (alertas), Fase 2 (equipos para algunas notificaciones)

---

### Fase 4: Compartir Tareas y Proyectos

**Objetivo:** Colaboración en tareas/proyectos con miembros del equipo.

#### 4.1 Infraestructura de Compartir
- [ ] Tabla BD: `wp_glory_compartidos` (id, tipo, elemento_id, usuario_id, rol, fecha)
- [ ] Tipos: `tarea`, `proyecto`, `habito`
- [ ] Roles: `propietario`, `colaborador`, `observador`

#### 4.2 Compartir Proyectos
- [ ] Al compartir proyecto → invitado ve TODAS las tareas del proyecto
- [ ] Selector de compañeros en modal de proyecto
- [ ] Badge visual de "Compartido" en proyecto
- [ ] Lista de participantes visible

#### 4.3 Compartir Tareas Individuales
- [ ] Opción en menú contextual: "Compartir tarea"
- [ ] Selector de compañeros (solo de tu equipo)
- [ ] Subtareas incluidas automáticamente
- [ ] Badge visual de "Compartida" en tarea
- [ ] Notificación al compartir/quitar

#### 4.4 Cifrado y Privacidad
> Las tareas/proyectos compartidos pierden cifrado E2E individual.

- [ ] Advertencia antes de compartir: *"Al compartir, el cifrado E2E se desactivará para este elemento"*
- [ ] Usar sistema de alertas personalizadas (Fase 0)
- [ ] Campo `cifrado_compartido: false` en elementos compartidos
- [ ] Tareas NO compartidas permanecen cifradas normalmente
- [ ] Separar datos cifrados de no cifrados en sincronización

#### 4.5 Asignar Tareas
- [ ] Campo `asignado_a` en tareas
- [ ] Selector de asignado (solo participantes del proyecto/tarea)
- [ ] Badge visual de asignado
- [ ] Filtro por "Mis tareas asignadas"
- [ ] Notificación al asignar/desasignar

**Complejidad:** Muy Alta | **Dependencias:** Fase 2 (equipos), Fase 3 (notificaciones)

---

### Fase 5: Compartir Hábitos

**Objetivo:** Motivación social al compartir hábitos con compañeros.

#### 5.1 Modelo de Hábitos Compartidos
> Cada persona tiene su propia instancia. Racha y cumplimiento son individuales.
> Solo comparten "el mismo hábito" para verse mutuamente.

- [ ] Tabla BD: `wp_glory_habitos_compartidos` (habito_id, usuario_origen, usuario_destino)
- [ ] Al compartir: se crea copia del hábito en cuenta del compañero
- [ ] Campo `habito_origen_id` para vincular ambas instancias
- [ ] Cada usuario cumple su hábito independientemente

#### 5.2 UI de Hábitos Compartidos
- [ ] Opción en menú contextual: "Compartir hábito"
- [ ] Indicador visual: "Compartido con [Nombre]"
- [ ] Ver cuándo el compañero cumplió (badge o indicador)
- [ ] Notificación: "[Nombre] cumplió [Hábito] hoy"

#### 5.3 Sincronización de Estado
- [ ] Endpoint para consultar estado de hábito del compañero
- [ ] Cache local para no sobrecargar
- [ ] Actualización periódica o al abrir panel

**Complejidad:** Media | **Dependencias:** Fase 2 (equipos), Fase 3 (notificaciones)

---

### Fase 6: Modal Expandido con Chat e Historial

**Objetivo:** Comunicación y trazabilidad en tareas/proyectos/hábitos compartidos.

#### 6.1 Nuevo Diseño del Modal de Tarea
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

#### 6.2 Sistema de Chat por Elemento
- [ ] Tabla BD: `wp_glory_mensajes` (id, tipo, elemento_id, usuario_id, contenido, fecha)
- [ ] Tipos: `tarea`, `proyecto`, `habito`
- [ ] Cada tarea/proyecto/hábito tiene su propia conversación
- [ ] Input de mensaje con soporte para adjuntos
- [ ] Mensajes ordenados cronológicamente
- [ ] Scroll automático al nuevo mensaje
- [ ] Notificación a participantes al enviar mensaje

#### 6.3 Historial de Cambios (Audit Log)
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

#### 6.4 UI del Modal Expandido
- [ ] Componente `ModalTareaExpandido` con 2 columnas
- [ ] Toggle para expandir/colapsar columna derecha
- [ ] Por defecto: modal expandido (2 columnas)
- [ ] Scroll independiente por columna
- [ ] Responsive: en móvil, pestañas en lugar de columnas

#### 6.5 Aplicar a Proyectos y Hábitos
- [ ] Modal de proyecto con chat + historial
- [ ] Modal de hábito (solo si está compartido)
- [ ] Componente `PanelChatHistorial` reutilizable

**Complejidad:** Muy Alta | **Dependencias:** Fase 2, 3, 4 (requiere sistema social completo)

---

### Fase 7: Futuro (Post v1.1.0)

#### 7.1 Correo de Invitación
- [ ] Enviar email cuando se invita a usuario no registrado
- [ ] Template de correo personalizado
- [ ] Link de registro con solicitud pre-aceptada

#### 7.2 Notificaciones por Correo
- [ ] Preferencias de notificación por email
- [ ] Resumen diario/semanal
- [ ] Alertas de tareas por vencer
- [ ] Alerta de racha en peligro

#### 7.3 Feed de Red Social
- [ ] Posts automáticos de logros
- [ ] Posts manuales
- [ ] Likes y comentarios
- [ ] Privacidad configurable

#### 7.4 Gamificación
- [ ] Badges de logros
- [ ] Sistema de niveles/experiencia
- [ ] Leaderboards semanales

---

## 📋 Resumen de Fases

| Fase | Nombre                         | Complejidad | Estado       |
| ---- | ------------------------------ | ----------- | ------------ |
| 0    | Preparación (Alertas + Header) | Baja-Media  | ✅ Completada |
| 1    | Almacenamiento                 | Media       | ✅ Completada |
| 1.5  | Archivos Físicos + Cifrado     | Alta        | ✅ Completada |
| 2    | Sistema de Equipos             | Alta        | ✅ Completada |
| 3    | Notificaciones                 | Alta        | ✅ Completada |
| 4    | Compartir Tareas/Proyectos     | Muy Alta    | Pendiente    |
| 5    | Compartir Hábitos              | Media       | Pendiente    |
| 6    | Modal Chat + Historial         | Muy Alta    | Pendiente    |
| 7    | Futuro                         | Variable    | Pendiente    |

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


## Optimizaciones Futuras & Ideas (Baja Prioridad)

### Optimización de Cifrado de Datos (Cifrado Diferencial)

**Estrategia (solo cambios):**
```
Datos actuales → Hash SHA-256
Datos nuevos → Hash SHA-256
Si hash diferente → Cifrar y guardar
Si hash igual → No hacer nada
```

- [ ] Implementar `hashDatos()` en `CifradoService`
- [ ] Guardar hash del último estado cifrado en metadata
- [ ] Comparar antes de cifrar para evitar trabajo innecesario

**Cache de datos descifrados (opcional):**
- **SessionStorage con clave derivada:** Equibrio entre seguridad y persistencia.
- Evaluar implementación solo si descifrado > 500ms.

