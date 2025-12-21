# Dashboard de Productividad Personal - Roadmap

Sistema de seguimiento de hábitos, tareas y notas rápidas con diseño estilo terminal minimalista.

---

## Estado Actual

**Fecha de inicio:** 2025-12-19  
**Version:** v1.0.0-beta  
**Ultima actualizacion:** 2025-12-20
**Estado:** Fase de Estandarización UI/UX (En Progreso).

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

### Persistencia
- LocalStorage para habitos, tareas y notas
- Sincronizacion al cargar pagina
- Exportar/Importar datos a JSON

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
    index.ts
  components/dashboard/
    SelectorFrecuencia.tsx    # Selector frecuencia habitos
    FormularioHabito.tsx      # Formulario habitos
    TablaHabitos.tsx          # Tabla principal
    ListaTareas.tsx           # Lista de tareas (+ integracion PanelConfiguracion)
    TareaItem.tsx             # Item individual (+ indicador fecha, opcion configurar)
    PanelConfiguracionTarea.tsx # Panel configuracion avanzada
    ...
```

```
App/React/styles/dashboard/
  index.css                   # Imports principales
  variables.css               # Tokens de diseno
  animaciones.css             # Keyframes
  base.css                    # Contenedor y grid
  shared/                     # Estilos reutilizables (NUEVO)
    accionesFormulario.css, selectorNivel.css, 
    seccionPanel.css, toggleSwitch.css, modal.css
  componentes/
    encabezado.css, tabla.css, tareas.css, scratchpad.css,
    formulario.css, toast.css, ordenamiento.css,
    menuContextual.css, frecuencia.css, panelConfiguracion.css
  utilidades/
    estados.css, acciones.css
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

## Fase Actual: Estandarización UI/UX

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
- [ ] **PanelConfiguracion base**: Extraer lógica común de `PanelConfiguracionTarea` a un componente genérico y usar las opciones comunes en los demas paneles.
- [x] **BadgeInfo**: Componente para mostrar badges de información (adjuntos, descripción, repetición, fecha, prioridad, frecuencia, racha).
- [x] **AccionesItem**: Componente para los botones de acción inline (configurar, eliminar).

---

## Pendientes de Fases Anteriores

### Habitos
- [ ] Animacion de entrada al crear habito
- [ ] Animacion visual de logro al completar
- [ ] Umbral de reseteo editable por usuario
- [ ] Adaptar racha a la frecuencia (racha semanal vs diaria)
- [ ] Historial considerando frecuencia para estadisticas
- [ ] Animacion de salida al eliminar

### Tareas (Configuracion y UX)
- [ ] Animacion de preview mas fluida durante arrastre
- [ ] Estadisticas de tareas completadas hoy
- [ ] Soporte markdown basico en descripcion (opcional)
- [ ] Historial de repeticiones (log)
- [ ] Almacenamiento real de adjuntos (WP Media Library - Requiere Backend)

### Scratchpad
- [ ] Toggle entre edicion y preview markdown
- [ ] Multiples notas (tabs)

### Ordenamiento y Filtros
- [ ] Drag & drop para orden manual de habitos
- [ ] Guardar preferencia de orden en configuracion
- [ ] Filtrar habitos por tag, importancia, urgentes
- [ ] Buscar habitos por nombre
- [ ] Vistas de tareas (todas, pendientes, completadas hoy, con deadline)

---

## Fases Futuras

### Fase: API REST WordPress
- Endpoint `POST /wp-json/glory/v1/dashboard/save`
- Endpoint `GET /wp-json/glory/v1/dashboard/load`
- Guardar en `user_meta` de WordPress
- Hook `useDashboardApi`
- Estados de carga y error

### Fase: Responsive y PWA
- Layout adaptativo movil
- Touch gestures (swipe para completar)
- Service Worker para offline
- Instalable en movil

---

## Vision SaaS - Planificacion a Largo Plazo

**Objetivo:** Convertir el dashboard en un producto SaaS escalable con modelo freemium

### Arquitectura Backend WordPress

**Sistema de Login y Usuarios:**
- [ ] Registro e inicio de sesion integrado con WordPress
- [ ] Cada usuario tiene sus propios datos aislados
- [ ] Soporte multi-dispositivo (sincronizacion)

**Optimizacion de Datos:**
- [ ] API REST eficiente con paginacion
- [ ] Caching inteligente (Redis o transients de WP)
- [ ] Compresion de datos para transferencia rapida
- [ ] Sync incremental (solo cambios, no datos completos)

**Base de Datos:**
- [ ] Tablas personalizadas para rendimiento (no solo user_meta)
- [ ] Indices optimizados para consultas frecuentes
- [ ] Migraciones versionadas

### Seguridad y Cifrado

**Cifrado de Datos de Usuario:**
- [ ] Cifrado en reposo (datos almacenados)
- [ ] Cifrado en transito (HTTPS obligatorio)
- [ ] Cifrado end-to-end opcional (clave del usuario)
- [ ] Datos sensibles nunca en texto plano

**Seguridad General:**
- [ ] Autenticacion JWT para API
- [ ] Rate limiting para prevenir abuso
- [ ] Validacion estricta de inputs
- [ ] Logs de auditoria

### Sistema de Notificaciones por Correo

**Notificaciones Automaticas:**
- [ ] Tarea por vencer (configurable: 1 dia, 3 dias, 1 semana antes)
- [ ] Tareas vencidas sin completar
- [ ] Resumen diario de habitos que "tocan hoy"
- [ ] Resumen semanal de progreso
- [ ] Alerta de racha en peligro

**Configuracion de Usuario:**
- [ ] Activar/desactivar tipos de notificacion
- [ ] Frecuencia de resumen (diario, semanal, nunca)
- [ ] Hora preferida para recibir emails
- [ ] Unsubscribe facil

**Implementacion Tecnica:**
- [ ] Cola de emails (wp_cron o queue externa)
- [ ] Templates HTML responsive
- [ ] Tracking de apertura (opcional)
- [ ] Integracion con servicios de email (SendGrid, Mailgun, etc.)

### Modelo Freemium

**Funcionalidades FREE:**
- Hasta 10 habitos
- Hasta 50 tareas activas
- Scratchpad basico
- Persistencia localStorage (sin sync)
- Estadisticas basicas (ultimos 7 dias)

**Funcionalidades PREMIUM:**
- Habitos y tareas ilimitados
- Sincronizacion multi-dispositivo
- Adjuntos en tareas (imagenes, archivos)
- Notificaciones por correo
- Estadisticas avanzadas y graficos historicos
- Exportacion en multiples formatos
- Temas personalizados
- Cifrado end-to-end
- Prioridad en soporte

**Sistema de Suscripcion:**
- [ ] Planes: Mensual, Anual (descuento)
- [ ] Integracion con Stripe o WooCommerce
- [ ] Trial gratuito de 14 dias para Premium
- [ ] Downgrade graceful (mantiene datos, limita funciones)

### Escalabilidad

**Infraestructura:**
- [ ] CDN para assets estaticos
- [ ] Database replication para lecturas
- [ ] Microservicios para notificaciones (opcional)
- [ ] Monitoreo y alertas (uptime, errores)

**Codigo:**
- [ ] Tests automatizados (unit, integration)
- [ ] CI/CD pipeline
- [ ] Feature flags para rollouts graduales
- [ ] Documentacion de API publica

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

