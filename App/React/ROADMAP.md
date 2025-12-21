# Dashboard de Productividad Personal - Roadmap

Sistema de seguimiento de hábitos, tareas y notas rápidas con diseño estilo terminal minimalista.

---

## Estado Actual

**Fecha de inicio:** 2025-12-19  
**Version:** v1.0.0-beta  
**Ultima actualizacion:** 2025-12-21
**Estado:** Fase SaaS - Integracion de Pagos Stripe Completada

---

## Resumen de Funcionalidades Completadas

<details>
<summary><strong>📦 Arquitectura y Base (Click para expandir)</strong></summary>

### Infraestructura
- Arquitectura de componentes (SOLID)
- Sistema de estilos centralizados (sin hardcodeo)
- CSS modular y escalable - Refactorizado a estructura por responsabilidad
- Tipos TypeScript para Habito, Tarea, Frecuencia, Prioridad
- Compilacion SSG exitosa
- Pagina registrada en `/dashboard/`

### Hooks y Utilidades
- Hook `useDashboard` para logica de estado principal
- Hook `useTareas` para CRUD de tareas
- Hook `useDeshacer` para sistema de undo
- Hook `useOrdenarHabitos` para ordenamiento
- Hook `useLocalStorage` para persistencia local
- Hook `useDebounce` para guardado optimizado
- Utilidades de fecha, validadores, migracion de habitos
- Utilidades de jerarquia de tareas (subtareas, drag & drop)
- Hook `useSincronizacion` para sync frontend-backend
- Hook `useDashboardApi` para comunicación con API REST

### Persistencia
- LocalStorage para habitos, tareas y notas
- Sincronizacion al cargar pagina
- Exportar/Importar datos a JSON
- Sincronización automática con servidor WordPress (usuarios logueados)
- Indicador visual de estado de sincronización

</details>

<details>
<summary><strong>✅ Hábitos - Funcionalidades Completadas</strong></summary>

### CRUD Completo
- Modal/formulario para crear/editar habito
- Campos: nombre, importancia, frecuencia
- Registrar completado con toggle (marcar/desmarcar)
- Eliminar habito con confirmacion
- Sistema de deshacer para todas las acciones

### Frecuencia de Habitos
- Tipos: Diario, Cada X dias, Semanal, Dias especificos, Mensual
- Selector visual de frecuencia en formulario
- Indicador compacto en titulo (icono reloj + numero)
- Calculo de "toca hoy" segun frecuencia
- Umbral de inactividad dinamico segun frecuencia

### Logica de Rachas
- Calculo automatico de dias de inactividad
- Reseteo de racha si inactividad > umbral (basado en frecuencia)
- Historial de fechas completadas

### UI/UX
- Tabla simplificada (checkbox en lugar de ID, sin columna ACCION)
- Barra de progreso de urgencia proporcional a frecuencia
- Badge e indicador visual "Toca Hoy"
- Menu contextual (click derecho) con opciones rapidas
- 5 modos de ordenamiento: importancia, urgentes, racha, nombre, inteligente

</details>

<details>
<summary><strong>📋 Tareas - Funcionalidades Completadas</strong></summary>

### CRUD Completo
- Input siempre visible para crear tareas
- Edicion inline con un solo click
- Guardado automatico (Enter, blur)
- Escape para cancelar
- Eliminar con deshacer

### Subtareas
- Tab convierte en subtarea
- Shift+Tab promueve a tarea principal
- Subtareas colapsables (boton chevron)
- Contador de subtareas completadas (X/Y)
- Eliminar padre promueve subtareas

### Drag & Drop Avanzado
- Reordenar tareas con drag & drop
- Mover tarea padre mueve sus subtareas
- Gestos horizontales: arrastrar a derecha = convertir en subtarea
- Indicador visual de zona de drop
- Orden persistido en localStorage

### Prioridad
- Prioridad Alta/Media/Baja via menu contextual
- Badges de texto (visual unificada con habitos)
- Opcion para quitar prioridad

### Creacion Rapida
- Enter al editar crea nueva tarea debajo
- Nueva subtarea hereda parentId del padre

</details>

<details>
<summary><strong>📝 Scratchpad</strong></summary>

- Notas rapidas persistidas
- Guardado automatico con debounce 500ms
- Indicador visual "Guardando..." / "Guardado"

</details>

<details>
<summary><strong>⚙️ Panel Configuración Tareas (Completado)</strong></summary>

### Configuracion Avanzada
- Panel modal dedicado para cada tarea
- Integracion con menu contextual y click en iconos

### Campos Implementados
- **Fecha maxima (deadline)**: Selector, indicadores de urgencia, alertas de vencimiento
- **Descripcion**: Notas detalladas expandibles
- **Repeticion**: Sistema "Tras Completar" con selector unificado
- **Prioridad**: Selector visual (compartido con habitos)

### Adjuntos (Media)
- Subida de imagenes (con preview y zoom)
- Subida de audios (con reproductor minimalista integrado)
- Subida de documentos (PDF, TXT, etc.)
- Descarga de archivos
- Validacion de tamaño (Max 5MB)
- Almacenamiento local (simulado en navegador)

</details>

<details>
<summary><strong>🔧 Refactorización Estructural (Completado)</strong></summary>

### Componentes Compartidos (Shared)
- `AccionesFormulario`: Botones estandarizados (Guardar/Cancelar)
- `SelectorNivel`: Selector generico Importancia/Prioridad
- `SeccionPanel`: Wrapper de secciones con encabeziado
- `Modal`: Sistema de ventanas modales reutilizable
- `ToggleSwitch`: Interruptor UI
- `SelectorDias`: Logica de seleccion semanal

### Estandarización CSS
- Directorio `styles/dashboard/shared/` creado
- Estilos desacoplados de componentes especificos
- Unificacion visual entre formularios de Habitos y Tareas

</details>

---

## Estructura de Archivos Actual

```
App/React/
  types/
    dashboard.ts              # Tipos centralizados (+ TareaConfiguracion, RepeticionTarea, Adjunto)
  utils/
    index.ts                  # Exportaciones
    fecha.ts                  # Utilidades de fecha (+ urgencia, formateo fecha limite)
    validadores.ts            # Validadores de datos
    migracionHabitos.ts       # Logica de migracion
    frecuenciaHabitos.ts      # Calculo de frecuencia
    jerarquiaTareas.ts        # Jerarquia + drag & drop
  data/
    datosIniciales.ts         # Datos demo
  hooks/
    useDashboard.ts           # Hook principal
    useTareas.ts              # CRUD tareas (+ manejo de configuracion)
    useDeshacer.ts            # Sistema undo
    useOrdenarHabitos.ts      # Ordenamiento
    useLocalStorage.ts        # Persistencia
    useDebounce.ts            # Debounce
  components/shared/
    MenuContextual.tsx        # Menu contextual reutilizable
    Modal.tsx                 # Modal con overlay
    AccionesFormulario.tsx    # Botones de accion
    SelectorNivel.tsx         # Selector importancia/prioridad
    SeccionPanel.tsx          # Wrapper de seccion
    ToggleSwitch.tsx          # Interruptor
    SelectorDias.tsx          # Selector dias semana
    BadgeInfo.tsx             # Badges de informacion
    AccionesItem.tsx          # Acciones inline (hover)
    CampoTexto.tsx            # Campo texto/textarea reutilizable
    CampoPrioridad.tsx        # Selector prioridad/importancia
    CampoFechaLimite.tsx      # Campo fecha con indicadores
    IndicadorSincronizacion.tsx # Estado visual de sync
    IndicadorPlan.tsx         # Badge de plan FREE/PREMIUM/TRIAL
    ModalUpgrade.tsx          # Modal comparativa de planes
    index.ts
  components/dashboard/
    SelectorFrecuencia.tsx    # Selector frecuencia habitos
    FormularioHabito.tsx      # Formulario habitos
    TablaHabitos.tsx          # Tabla principal
    ListaTareas.tsx           # Lista de tareas (+ integracion PanelConfiguracion)
    TareaItem.tsx             # Item individual (+ indicador fecha, opcion configurar)
    PanelConfiguracionTarea.tsx # Panel configuracion avanzada
    PanelSeguridad.tsx        # Panel de configuracion de seguridad/cifrado
    ...
```

```
App/React/styles/dashboard/
  index.css                   # Imports principales
  variables.css               # Tokens de diseno
  animaciones.css             # Keyframes
  base.css                    # Contenedor y grid
  shared/                     # Estilos reutilizables
    accionesFormulario.css, selectorNivel.css, seccionPanel.css,
    toggleSwitch.css, dashboardPanel.css, badgeInfo.css,
    accionesItem.css, campoFechaLimite.css, indicadorSincronizacion.css,
    suscripcion.css,          # Estilos freemium (IndicadorPlan, ModalUpgrade)
    panelSeguridad.css        # Estilos panel de seguridad
  componentes/
    encabezado.css, tabla.css, tareas.css, scratchpad.css,
    formulario.css, toast.css, ordenamiento.css,
    menuContextual.css, frecuencia.css, panelConfiguracion.css
  utilidades/
    estados.css, acciones.css
```

```
App/React/hooks/
  useDashboard.ts             # Hook principal (integrado con sync)
  useTareas.ts                # CRUD tareas
  useProyectos.ts             # CRUD proyectos
  useDashboardApi.ts          # Comunicacion con API REST WordPress
  useSincronizacion.ts        # Orquestacion sync offline-first
  useSuscripcion.ts           # Estado y limites de plan freemium
  useCifrado.ts               # Gestion de cifrado E2E
  useStripe.ts                # Checkout y portal de facturacion Stripe
  useDeshacer.ts              # Sistema undo
  useOrdenarHabitos.ts        # Ordenamiento
  useLocalStorage.ts          # Persistencia local
  useDebounce.ts              # Debounce
  index.ts
```

## Fase Completada: Gestión de Proyectos ✓

**Objetivo:** Implementar la entidad "Proyecto" como un contenedor de alto nivel para agrupar y aislar tareas complejas. Esto introduce una jerarquía de 3 niveles: **Proyecto > Tarea > Subtarea**.

### Concepto y Flujo
- **Jerarquía**: 
  1. **Proyecto**: Objetivo macro (ej: "Lanzar Web Personal").
  2. **Tarea**: Entidad accionable dentro del proyecto.
  3. **Subtarea**: Paso indivisible de una tarea.
- **Aislamiento**: Las tareas de un proyecto pertenecen *exclusivamente* a ese contexto y no deben mezclarse visualmente con tareas sueltas u otros proyectos en la vista principal, permitiendo foco total.

### Refactorización Arquitectónica
- [x] **Componente `DashboardPanel`**: Crear `components/shared/DashboardPanel.tsx` para estandarizar los contenedores (Hábitos, Lista de Proyectos, Paneles de Proyecto).

### Nueva Entidad: Proyectos
- [x] **Estructura de Datos**:
  - `Proyecto`: id, nombre, descripción, prioridad, fecha límite.
  - Relación: Tareas tendrán un campo `proyectoId`.
- [x] **Visualización**:
  - **Lista de Proyectos**: Ubicada en columna izquierda (bajo Hábitos). Muestra resumen y progreso.
  - [x] **Vista Integrada**: Al seleccionar un proyecto, se expande mostrando su lista de tareas directamente debajo (mismo componente ListaTareas).

### Funcionalidad
- [x] **Gestión de Proyectos**: Hooks y lógica base creados (CRUD completo).
- [x] **Formularios**: Modal para crear/editar proyectos (FormularioProyecto.tsx).
- [x] **Lógica de Tareas de Proyecto**: 
  - Las tareas creadas dentro de un proyecto heredan el `proyectoId`.
  - Reutilización del componente `ListaTareas` filtrado por `proyectoId`.
  - Panel de Ejecución muestra solo tareas sin proyecto.

---

## Fase Completada: Estandarización UI/UX ✓

**Objetivo:** Unificar la experiencia visual y de interacción entre Hábitos, Tareas y Proyectos. Centralizar componentes comunes y agregar indicadores visuales faltantes.

### Menú Contextual Unificado
- [x] **Proyectos**: Implementar menú contextual (click derecho) con opciones: Editar, Eliminar, Cambiar estado.
- [x] **Centralizar MenuContextual**: Asegurar que el componente `MenuContextual` sea reutilizable para Hábitos, Tareas y Proyectos.

### Indicadores Visuales en Items
- [x] **Fecha Límite en Proyectos**: Mostrar fecha límite visible (igual que tareas) con indicador de urgencia.
- [x] **Badges de Información en Tareas**:
  - [x] Badge de Adjunto (icono clip) - cuando tiene archivos adjuntos.
  - [x] Badge de Descripción (icono nota) - cuando tiene descripción.
  - [x] Badge de Repetición (icono repetir) - cuando tiene repetición configurada.
  - [x] Badge de Prioridad (alta/media/baja) - unificado con hábitos.
- [x] **Badges de Información en Hábitos**:
  - [x] Badge de Prioridad/Importancia (alta/media/baja) - unificado con tareas.
  - [x] Badge de Frecuencia (cada X días) - indicador sutil junto al nombre.
  - [x] Badge "Hoy" (destacado) - indica que toca realizar el hábito hoy.
- [x] **Centralizar Badges**: Sistema de badges reutilizable con variantes: normal, urgente, exito, advertencia, prioridadAlta/Media/Baja, destacado, frecuencia, racha.
- [x] **Ordenamiento de Badges**: Orden visual consistente (fecha > adjuntos > descripción > repetición > prioridad).

### Refactorización de Componentes Compartidos
- [x] **Campos de formulario reutilizables**: Extraer campos comunes a componentes genericos:
  - `CampoTexto`: Input/textarea con manejo de errores y SeccionPanel integrado.
  - `CampoPrioridad`: Selector de prioridad/importancia con soporte para valor nulo.
  - `CampoFechaLimite`: Input de fecha con indicadores de urgencia visuales.
- [x] **BadgeInfo**: Componente para mostrar badges de información (adjuntos, descripción, repetición, fecha, prioridad, frecuencia, racha).
- [x] **AccionesItem**: Componente para los botones de acción inline (configurar, eliminar).

---

<details>
<summary><strong>📌 Mejoras Menores (Baja Prioridad)</strong></summary>

*Estas mejoras son opcionales y se implementarán cuando el MVP SaaS esté estable.*

### Hábitos
- [ ] Animación de entrada al crear hábito
- [ ] Animación visual de logro al completar
- [ ] Umbral de reseteo editable por usuario
- [ ] Adaptar racha a la frecuencia (racha semanal vs diaria)
- [ ] Historial considerando frecuencia para estadísticas
- [ ] Animación de salida al eliminar

### Tareas (Configuración y UX)
- [ ] Animación de preview más fluida durante arrastre
- [ ] Estadísticas de tareas completadas hoy
- [ ] Soporte markdown básico en descripción (opcional)
- [ ] Historial de repeticiones (log)

### Scratchpad
- [ ] Toggle entre edición y preview markdown
- [ ] Múltiples notas (tabs)

### Ordenamiento y Filtros
- [ ] Drag & drop para orden manual de hábitos
- [ ] Guardar preferencia de orden en configuración
- [ ] Filtrar hábitos por tag, importancia, urgentes
- [ ] Buscar hábitos por nombre
- [ ] Vistas de tareas (todas, pendientes, completadas hoy, con deadline)

### Responsive y PWA (Post-SaaS)
- [ ] Layout adaptativo móvil
- [ ] Touch gestures (swipe para completar)
- [ ] Service Worker para offline
- [ ] Instalable en móvil

### Sistema de Notificaciones por Correo

**Notificaciones Automáticas:**
- [ ] Tarea por vencer (configurable: 1 día, 3 días, 1 semana antes)
- [ ] Tareas vencidas sin completar
- [ ] Resumen diario de hábitos que "tocan hoy"
- [ ] Resumen semanal de progreso
- [ ] Alerta de racha en peligro

**Configuración de Usuario:**
- [ ] Activar/desactivar tipos de notificación
- [ ] Frecuencia de resumen (diario, semanal, nunca)
- [ ] Hora preferida para recibir emails
- [ ] Unsubscribe fácil

**Implementación Técnica:**
- [ ] Cola de emails (wp_cron o queue externa)
- [ ] Templates HTML responsive
- [ ] Tracking de apertura (opcional)
- [ ] Integración con servicios de email (SendGrid, Mailgun, etc.)

</details>

---

## Fase Actual: Vision SaaS

**Objetivo:** Convertir el dashboard en un producto SaaS escalable con modelo freemium

### Arquitectura Backend WordPress

**Sistema de Login y Usuarios:**
- [x] Cada usuario tiene sus propios datos aislados (user_meta por usuario)
- [x] Registro e inicio de sesion integrado con WordPress
- [x] Soporte multi-dispositivo (sincronizacion)

**API REST (Completado):**
- [x] `GET /wp-json/glory/v1/dashboard` - Cargar datos del usuario
- [x] `POST /wp-json/glory/v1/dashboard` - Guardar datos del usuario
- [x] `GET /wp-json/glory/v1/dashboard/sync` - Estado de sincronización
- [x] `POST /wp-json/glory/v1/auth/register` - Registro de nuevos usuarios
- [x] `GET/POST /wp-json/glory/v1/dashboard/changes` - Sync incremental
- [x] `GET /wp-json/glory/v1/suscripcion` - Info del plan actual
- [x] `POST /wp-json/glory/v1/suscripcion/trial` - Activar trial
- [x] `GET /wp-json/glory/v1/seguridad/cifrado` - Estado de cifrado
- [x] `POST /wp-json/glory/v1/seguridad/cifrado` - Activar/desactivar cifrado
- [x] Validación de datos (habitos, tareas, proyectos)
- [x] Autenticación requerida (is_user_logged_in)
- [x] Nonce para seguridad CSRF

**Archivos Creados:**
- `App/Api/DashboardApiController.php` - Endpoints REST
- `App/Repository/DashboardRepository.php` - Capa de acceso a datos (+ cifrado integrado)
- `App/Config/dashboardScripts.php` - Nonce y datos para frontend
- `App/Services/CifradoService.php` - Cifrado AES-256-GCM por usuario
- `App/Services/SuscripcionService.php` - Gestión de planes freemium
- `App/React/hooks/useDashboardApi.ts` - Hook React para API
- `App/React/hooks/useSincronizacion.ts` - Orquestador Sync
- `App/React/hooks/useCifrado.ts` - Gestión de cifrado E2E
- `App/Database/Schema.php` - Esquema de Base de Datos

**Optimización de Datos:**
- [x] Sync incremental (solo cambios, no datos completos)
- [x] Sincronización con debounce (2 segundos)
- [x] Reintentos automáticos (máximo 3)
- [x] Reconexión automática cuando vuelve online
- [ ] API REST eficiente con paginación
- [ ] Caching inteligente (Redis o transients de WP)
- [ ] Compresión de datos para transferencia rápida

**Integración Frontend (Completado):**
- [x] Hook `useSincronizacion` para orquestar sync
- [x] Integración con `useDashboard` (transparente para componentes)
- [x] Componente `IndicadorSincronizacion` en encabezado
- [x] Estados visuales: sincronizado, pendiente, error, offline
- [x] Fallback a localStorage cuando no hay conexión

**Base de Datos:**
- [x] Almacenamiento en user_meta (Migrado)
- [x] Tablas personalizadas para rendimiento (`wp_glory_habitos`, `wp_glory_tareas`, `wp_glory_proyectos`)
- [x] Migración automática de meta a SQL
- [ ] Índices optimizados para consultas frecuentes
- [ ] Migraciones versionadas (Implementado parcialmente)

### Seguridad y Cifrado

**Cifrado de Datos de Usuario (Completado):**
- [x] Cifrado en reposo (datos almacenados) - AES-256-GCM
- [x] Cifrado end-to-end opcional (clave derivada por usuario)
- [x] Datos sensibles cifrados en base de datos
- [x] Servicio `CifradoService.php` con algoritmo AES-256-GCM
- [x] Derivación de clave HKDF-SHA256 única por usuario
- [x] Endpoint API `/seguridad/cifrado` para gestionar cifrado
- [x] Hook `useCifrado` para frontend
- [x] Componente `PanelSeguridad` con toggle de cifrado
- [ ] Cifrado en tránsito (HTTPS obligatorio) - Pendiente configuración servidor

**Seguridad General:**
- [ ] Autenticacion JWT para API
- [ ] Rate limiting para prevenir abuso
- [ ] Validacion estricta de inputs
- [ ] Logs de auditoria

### Modelo Freemium (Completado)

**Sistema de Límites (Backend - Completado):**
- [x] Servicio `SuscripcionService.php` con lógica de planes
- [x] Planes: FREE / PREMIUM
- [x] Estados: activa / trial / expirada
- [x] Límites configurables:
  - FREE: 10 hábitos, 50 tareas activas, 3 proyectos, sin adjuntos
  - PREMIUM: Ilimitado + sync + adjuntos + estadísticas avanzadas
- [x] Validación de límites en API antes de guardar (403 si excede)
- [x] Trial de 14 días activable por usuario
- [x] Info de suscripción inyectada al frontend via `window.gloryDashboard`

**Endpoints API (Completado):**
- [x] `GET /wp-json/glory/v1/suscripcion` - Info del plan actual
- [x] `POST /wp-json/glory/v1/suscripcion/trial` - Activar trial
- [x] Respuesta 403 con errores detallados cuando se exceden límites

**Frontend (Completado):**
- [x] Tipos TypeScript: `InfoSuscripcion`, `LimitesPlan`, `ErrorLimite`
- [x] Hook `useSuscripcion` para verificar limites y estado
- [x] Componente `IndicadorPlan` (badge FREE/PREMIUM/TRIAL en header)
- [x] Componente `ModalUpgrade` (comparativa de planes + activar trial)
- [x] Integracion en `DashboardIsland` y `DashboardEncabezado`
- [x] CSS premium estilo terminal (gradientes, animaciones, hover states)

**Integracion de Pagos (Completado):**
- [x] Servicios Stripe reutilizables en `Glory/src/Services/Stripe/`:
  - `StripeConfig.php` - Configuracion centralizada de claves
  - `StripeApiClient.php` - Cliente HTTP para API de Stripe
  - `StripeWebhookVerifier.php` - Verificacion de firma sin libreria
  - `StripeWebhookException.php` - Excepciones tipadas
  - `AbstractStripeWebhookHandler.php` - Handler base extensible
  - `StripeCheckoutService.php` - Crear sesiones de checkout
- [x] Implementacion especifica en `App/Api/`:
  - `StripeWebhookHandler.php` - Handler concreto para el Dashboard
  - Endpoints en `DashboardApiController.php`:
    - `POST /stripe/checkout` - Crear sesion de pago
    - `POST /stripe/webhook` - Webhook de Stripe
    - `POST /stripe/portal` - Portal de facturacion
- [x] Hook `useStripe` para frontend (checkout + portal)
- [x] Planes: Mensual ($4.99), Anual ($39.99 - 33% descuento)
- [x] Selector de plan en ModalUpgrade
- [x] Webhooks de Stripe para actualizar estado automaticamente
- [x] Downgrade graceful (mantiene datos, limita funciones)

**Configuracion Necesaria (wp-config.php o opciones WP):**
```php
define('GLORY_STRIPE_SECRET_KEY', 'sk_live_...');
define('GLORY_STRIPE_PUBLISHABLE_KEY', 'pk_live_...');
define('GLORY_STRIPE_WEBHOOK_SECRET', 'whsec_...');
define('GLORY_STRIPE_PRICE_MONTHLY', 'price_...');
define('GLORY_STRIPE_PRICE_YEARLY', 'price_...');
```



---

## Notas Tecnicas

### Dependencias Sugeridas
```json
{
  "date-fns": "^3.x",
  "react-hot-toast": "^2.x",
  "framer-motion": "^11.x",
  "recharts": "^2.x"
}
```

### Estructura de Datos para API (Actualizada)

```typescript
interface DashboardUserData {
  version: string;
  ultimaActualizacion: string;
  habitos: Habito[];
  tareas: Tarea[];
  notas: Nota[];
  configuracion: UserConfig;
  historial: RegistroHistorial[];
  suscripcion?: {
    plan: 'free' | 'premium';
    fechaExpiracion?: string;
    estado: 'activa' | 'trial' | 'expirada';
  };
}

interface RegistroHistorial {
  habitoId: number;
  fecha: string;
  completado: boolean;
}

interface Nota {
  id: number;
  titulo: string;
  contenido: string;
  ultimaEdicion: string;
}

interface UserConfig {
  notificaciones: {
    email: boolean;
    frecuenciaResumen: 'diario' | 'semanal' | 'nunca';
    horaPreferida: string;
    tareasPorVencer: boolean;
    rachaEnPeligro: boolean;
  };
  cifradoE2E: boolean;
  tema: 'terminal' | 'claro' | 'oscuro';
}
```

---

## Contacto y Colaboracion

Cualquier duda sobre la implementacion, revisar:
- `Glory/assets/react/Docs/react-glory.md` - Documentacion del sistema
- `App/React/components/dashboard/` - Componentes existentes
- `App/React/styles/dashboard/` - Sistema de diseno modular (ver index.css)

