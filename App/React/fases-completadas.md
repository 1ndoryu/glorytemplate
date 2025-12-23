# Fases Completadas - Dashboard de Productividad

> Este archivo contiene el detalle completo de las fases ya implementadas.
> Movido desde ROADMAP.md para reducir el tamaño del archivo principal.

---

## Fase 0: Preparación de Infraestructura ✅

**Objetivo:** Crear bases necesarias antes de funcionalidades sociales.

### 0.1 Sistema de Alertas Personalizadas ✅
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

### 0.2 Compactar Header a Iconos ✅
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

## Fase 1: Sistema de Almacenamiento ✅

**Objetivo:** Control de uso de espacio por usuario.

### 1.1 Límites de Almacenamiento
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

## Fase 1.5: Archivos Físicos y Optimización de Cifrado ✅

**Objetivo:** Migrar de Base64 a archivos físicos, optimizar cifrado para rendimiento.

### Problema Resuelto
| Aspecto  | Antes          | Después                  |
| -------- | -------------- | ------------------------ |
| Adjuntos | Base64 en JSON | Archivos físicos         |
| Cifrado  | Servidor (PHP) | Stream cipher optimizado |
| Cache    | Sin cache      | Cache 5 min TTL          |

### Diferenciación por Plan

| Característica                                | Free       | Premium                   |
| --------------------------------------------- | ---------- | ------------------------- |
| Cifrado de datos (tareas, hábitos, proyectos) | Si         | Si                        |
| Cifrado de archivos adjuntos                  | No         | Si                        |
| Thumbnails de imágenes                        | Sin cifrar | Sin cifrar (optimización) |
| Límite almacenamiento                         | 50 MB      | 10 GB                     |

### 1.5.1 Sistema de Archivos Físicos ✅
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

- [x] Crear `AdjuntosService.php` con métodos completos
- [x] Endpoints REST: POST, GET, DELETE `/glory/v1/adjuntos`
- [x] Hook `useAdjuntos.ts` para gestión frontend
- [x] Actualizar `SeccionAdjuntos.tsx` para subida multipart
- [x] Actualizar `AlmacenamientoService.php` para contar archivos físicos + legacy
- [ ] Migración Base64 → archivos (no aplica, sin usuarios legacy)

### 1.5.2 Optimización de Cifrado de Archivos (Solo Premium) ✅

**Técnicas implementadas:**

1. **Stream Cipher (archivos grandes > 1MB):**
   - [x] `cifrarEnStream()` en `AdjuntosService`
   - [x] `descifrarStream()` en `AdjuntosService`
   - [x] Detección automática memoria vs stream (umbral: 1MB)

2. **Cache de archivos descifrados:**
   - [x] Directorio de cache por usuario
   - [x] `obtenerDeCache()`, `guardarEnCache()`
   - [x] `limpiarCache()` para archivos expirados (TTL 5 min)

3. **Thumbnails sin cifrar:**
   - [x] Generar thumbnail al subir imagen
   - [x] Mostrar thumbnail en lista, cifrado en modal/descarga
   - [x] Añadir `thumbnailUrl` al tipo `Adjunto`

4. **Lazy Decryption:**
   - [x] Placeholder con icono de candado
   - [x] Thumbnail con indicador de cifrado superpuesto
   - [x] Descifrar on-demand al hacer clic
   - [x] Estados visuales: candado, cargando, contenido
   - [x] Estilos CSS `.adjuntoIndicadorCifrado`

**Archivos creados/modificados:**
- `App/Services/AdjuntosService.php` - Servicio de archivos físicos
- `App/Api/AdjuntosApiController.php` - Endpoints REST
- `App/React/hooks/useAdjuntos.ts` - Hook frontend
- `App/React/components/dashboard/SeccionAdjuntos.tsx` - Subida multipart
- `App/React/styles/dashboard/componentes/adjuntos.css` - Estilos

---

## Fase 2: Sistema de Equipos ✅

**Objetivo:** Permitir conexión entre usuarios para colaboración.

### 2.1 Infraestructura de Equipos
- [x] Tabla BD: `wp_glory_equipos` (id, usuario_id, compañero_id, estado, fecha)
- [x] Estados: `pendiente`, `aceptada`, `rechazada`, `pendiente_registro`
- [x] Endpoints API completos para solicitudes y gestión

### 2.2 UI de Equipos
- [x] Icono "Social" (Users) en header
- [x] Badge con contador de solicitudes pendientes
- [x] Modal de Equipos con pestañas (recibidas, enviadas, compañeros)
- [x] Formulario para enviar solicitud por correo
- [x] Estado "Pendiente de registro" si usuario no existe
- [x] Hook `useEquipos` para gestionar estado

### 2.3 Lógica de Solicitudes Pendientes
- [x] Si correo no existe, guardar como `pendiente_registro`
- [x] Al registrarse nuevo usuario, activar solicitudes pendientes (hook `user_register`)
- [ ] (Futuro) Enviar correo de invitación si no está registrado

**Archivos creados:**
- `App/Database/Schema.php` - v1.0.2, tabla `wp_glory_equipos`
- `App/Services/EquiposService.php` - Lógica de equipos
- `App/Api/EquiposApiController.php` - Endpoints REST
- `App/React/hooks/useEquipos.ts` - Hook de gestión
- `App/React/components/equipos/` - Componentes UI
- `App/React/styles/dashboard/componentes/equipos.css` - Estilos

**Complejidad:** Alta | **Dependencias:** Fase 0 (alertas)

---

## Fase 3: Sistema de Notificaciones ✅

**Objetivo:** Notificar eventos importantes dentro de la aplicación.

### 3.1 Infraestructura de Notificaciones
- [x] Tabla BD: `wp_glory_notificaciones` (id, usuario_id, tipo, contenido, leida, fecha)
- [x] Tipos implementados: `solicitud_equipo`, `tarea_vence_hoy`
- [x] Tipos preparados: `tarea_asignada`, `tarea_removida`, `adjunto_agregado`, `mensaje_chat`, `habito_companero`
- [x] Endpoints API completos para CRUD y lectura

### 3.2 UI de Notificaciones
- [x] Icono campana (Bell) en header con badge contador
- [x] Dropdown/Modal con lista de notificaciones
- [x] Acciones: Marcar como leída (individual/todas), Eliminar
- [x] Polling automático cada 30 segundos
- [x] Acción rápida según tipo (ir a tarea, abrir solicitud)

### 3.3 Generación Automática
- [x] Notificación al recibir solicitud de equipo
- [x] Método helper para cron de tareas vencidas

**Archivos creados:**
- `App/Database/Schema.php` - v1.0.3, tabla `wp_glory_notificaciones`
- `App/Services/NotificacionesService.php` - Lógica
- `App/Api/NotificacionesApiController.php` - Endpoints REST
- `App/React/hooks/useNotificaciones.ts` - Hook de gestión
- `App/React/components/notificaciones/` - Componentes UI
- `App/React/styles/dashboard/componentes/notificaciones.css` - Estilos

**Complejidad:** Alta | **Dependencias:** Fase 2 (Equipos)

---

## Fase 4: Compartir Tareas y Proyectos ✅

**Objetivo:** Colaboración en tareas/proyectos con miembros del equipo.

### 4.1 Infraestructura de Compartir ✅
- [x] Tabla BD: `wp_glory_compartidos` (id, tipo, elemento_id, propietario_id, usuario_id, rol, fecha)
- [x] Tipos: `tarea`, `proyecto`, `habito`
- [x] Roles: `propietario` (implícito), `colaborador`, `observador`
- [x] `CompartidosService.php` con métodos CRUD y verificación de permisos
- [x] `CompartidosApiController.php` con endpoints REST
- [x] Hook `useCompartidos.ts` para gestión frontend
- [x] Tipos TypeScript en `dashboard.ts`
- [x] Notificación automática al compartir (`elemento_compartido`)
- [x] Componentes UI: `ModalCompartir`, `SelectorCompaneros`, `ListaParticipantes`
- [x] Estilos CSS: `compartidos.css`

**Endpoints disponibles:**
- `POST /glory/v1/compartidos` - Compartir elemento
- `GET /glory/v1/compartidos` - Elementos compartidos conmigo
- `GET /glory/v1/compartidos/mis` - Lo que yo he compartido
- `GET /glory/v1/compartidos/participantes/{tipo}/{id}` - Participantes
- `PUT /glory/v1/compartidos/{id}/rol` - Actualizar rol
- `DELETE /glory/v1/compartidos/{id}` - Dejar de compartir
- `GET /glory/v1/compartidos/contadores` - Contadores para badges
- `GET /glory/v1/compartidos/acceso/{tipo}/{id}/{propietarioId}` - Verificar acceso

**Modelo de Colaboración:**

> **Proyectos compartidos:** Cuando compartes un proyecto, los participantes ven TODAS las tareas del proyecto. Las tareas NO están asignadas por defecto (cualquiera puede completarlas). Opcionalmente, se puede asignar una tarea a un participante específico.

> **Tareas sueltas:** Se **asignan** directamente a un compañero. La tarea aparece automáticamente en su dashboard.

> **Hábitos:** Funcionan diferente - ver Fase 6 (Pospuesta). Es un "compromiso mutuo" donde cada persona tiene su propia instancia independiente.

### 4.2 Compartir Proyectos ✅
- [x] Al compartir proyecto → invitado ve TODAS las tareas
- [x] Selector de compañeros en modal de proyecto
- [x] Badge visual de "Compartido" en proyecto
- [x] Lista de participantes visible (en ModalCompartir)
- [x] Integrar `ModalCompartir` en menú contextual de proyectos
- [x] Badge de propietario cuando el proyecto es de otro usuario

### 4.3 Compartir Tareas Individuales ✅
- [x] Opción en menú contextual: "Compartir tarea"
- [x] Selector de compañeros (solo de tu equipo) - reutiliza ModalCompartir
- [x] Badge visual de "Compartida" en tarea
- [x] Notificación al compartir/quitar (backend)
- [x] Badge de propietario cuando la tarea es de otro usuario

### 4.4 Cifrado y Privacidad (Parcial)
> Las tareas/proyectos compartidos pierden cifrado E2E individual.

- [x] Advertencia antes de compartir: *"Al compartir, el cifrado E2E se desactivará para este elemento"* (UI en ModalCompartir)

### 4.5 Asignar Tareas ✅
- [x] Campo `asignadoA` en tareas (tipos: `Tarea`, `DatosEdicionTarea`)
- [x] Componente `SelectorAsignado` para seleccionar participante
- [x] Badge visual de asignado en `TareaItem`
- [x] Filtro por "Mis tareas asignadas" en `useFiltroTareas`
- [x] Notificación al asignar/desasignar (`NotificacionesService`)
- [x] Tareas asignadas a mí aparecen en mi dashboard automáticamente
- [x] Integrar `SelectorAsignado` en `PanelConfiguracionTarea`
- [x] Pasar participantes al `PanelConfiguracionTarea` desde `DashboardIsland`

**Archivos creados/modificados:**
- `App/Database/Schema.php` - v1.0.4, tabla `wp_glory_compartidos`
- `App/Services/CompartidosService.php` - Lógica de negocio
- `App/Api/CompartidosApiController.php` - Endpoints REST
- `App/React/hooks/useCompartidos.ts` - Hook de React
- `App/React/types/dashboard.ts` - Tipos actualizados
- `App/React/components/compartidos/` - Componentes UI
- `App/React/components/dashboard/TareaItem.tsx` - Badge de propietario
- `App/React/components/dashboard/proyectos/ListaProyectos.tsx` - Badge de propietario
- `App/React/components/dashboard/PanelConfiguracionTarea.tsx` - `SelectorAsignado`
- `App/React/components/dashboard/ListaTareas.tsx` - Prop `obtenerParticipantes`
- `App/React/islands/DashboardIsland.tsx` - Cache de participantes
- `App/React/styles/dashboard/componentes/compartidos.css` - Estilos

**Complejidad:** Muy Alta | **Dependencias:** Fase 2 (equipos), Fase 3 (notificaciones)

---

## Bugs Corregidos (2025-12-22)

### Sistema de Notificaciones y Equipos
- [x] Al enviar solicitud de equipo, no se creaba notificación para el destinatario
- [x] Al aceptar solicitud, no se notificaba al solicitante original
- [x] Badge de solicitudes pendientes no se actualizaba en tiempo real
- [x] Ajuste visual - contador de solicitudes en círculo rojo absoluto
- [x] Falta indicador numérico para notificaciones pendientes
