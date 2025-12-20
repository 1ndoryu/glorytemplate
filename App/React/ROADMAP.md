# Dashboard de Productividad Personal - Roadmap

Sistema de seguimiento de hábitos, tareas y notas rápidas con diseño estilo terminal minimalista.

---

## Estado Actual

**Fecha de inicio:** 2025-12-19  
**Version:** v1.0.0-beta  
**Ultima actualizacion:** 2025-12-20
**Estado:** Fase D completada, iniciando Panel de Configuración de Tareas

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

---

## Estructura de Archivos Actual

```
App/React/
  types/
    dashboard.ts              # Tipos centralizados (+ TareaConfiguracion, RepeticionTarea, Adjunto)
  utils/
    index.ts                  # Exportaciones
    fecha.ts                  # Utilidades de fecha
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
  components/dashboard/
    SelectorFrecuencia.tsx    # Selector frecuencia habitos
    FormularioHabito.tsx      # Formulario habitos
    TablaHabitos.tsx          # Tabla principal
    ListaTareas.tsx           # Lista de tareas (+ integracion PanelConfiguracion)
    TareaItem.tsx             # Item individual (+ indicador fecha, opcion configurar)
    PanelConfiguracionTarea.tsx # Panel configuracion avanzada (NUEVO)
    ...
```

```
App/React/styles/dashboard/
  index.css                   # Imports principales
  variables.css               # Tokens de diseno
  animaciones.css             # Keyframes
  base.css                    # Contenedor y grid
  componentes/
    encabezado.css, tabla.css, tareas.css, scratchpad.css,
    modal.css, formulario.css, toast.css, ordenamiento.css,
    menuContextual.css, frecuencia.css, panelConfiguracion.css
  utilidades/
    estados.css, acciones.css
```

---

## Fase Actual: Panel de Configuración de Tareas

**Objetivo:** Cada tarea puede tener configuracion avanzada similar a los habitos
**Estado:** Panel base implementado, tipos expandidos, integracion con ListaTareas

### Campos del Panel de Configuración

- [x] **Fecha maxima (deadline)**
  - [x] Selector de fecha
  - [x] Indicador visual de proximidad (urgente, proximo, normal)
  - [x] Tareas vencidas resaltadas en rojo
  - [x] Indicador compacto en la fila de tarea (icono calendario + fecha)
  
- [x] **Descripcion**
  - [x] Campo expandible para notas detalladas
  - [ ] Soporte markdown basico (opcional)

- [x] **Sistema de Repeticion Inteligente** (UI implementada)
  - [x] **Tipo 1: Repetir despues de completar**
    - Ej: "Repetir 3 dias despues de completar"
    - La tarea reaparece X dias despues de marcarla completada
  - [x] **Tipo 2: Repetir en intervalo fijo**
    - Ej: "Repetir cada lunes" o "Repetir cada 7 dias"
    - La tarea reaparece en fechas fijas sin importar cuando se completo
  - [x] Selector de dias de la semana para intervalo fijo
  - [ ] Logica de generacion automatica de repeticiones
  - [ ] Evitar duplicados (si ya existe una instancia pendiente)
  - [ ] Historial de repeticiones

- [ ] **Adjuntos** (pendiente)
  - [ ] Subir imagenes a la tarea
  - [ ] Subir archivos (PDF, documentos)
  - [ ] Preview de imagenes integrado
  - [ ] Almacenamiento en WordPress media library

### Implementacion Tecnica (COMPLETADO)

**Tipos expandidos en dashboard.ts:**
- [x] TipoRepeticion ('despuesCompletar' | 'intervaloFijo')
- [x] RepeticionTarea (tipo, intervalo, diasSemana, ultimaRepeticion)
- [x] Adjunto (id, tipo, url, nombre, tamano, fechaSubida)
- [x] TareaConfiguracion (fechaMaxima, descripcion, repeticion, adjuntos)
- [x] Tarea.configuracion?: TareaConfiguracion

**Componentes creados:**
- [x] PanelConfiguracionTarea.tsx - Panel modal completo
- [x] Estilos en panelConfiguracion.css (consistentes con formulario habitos)

**Integraciones:**
- [x] Opcion "Configurar tarea" en menu contextual de TareaItem
- [x] Indicador de fecha limite en fila de tarea
- [x] Selector de prioridad en panel (reutiliza estilos de importancia)
- [x] Estilos botones Cancelar/Guardar unificados con formulario habitos

---

## Refactorizacion: Componentes Comunes (PLANIFICACION)

**Objetivo:** Centralizar componentes y estilos duplicados para mantener coherencia visual y reducir mantenimiento

### Problema Actual

Los paneles de configuración de hábitos y tareas tienen estructura similar pero implementaciones separadas:
- Botones de acción (Cancelar/Guardar) con estilos duplicados
- Selectores de importancia/prioridad (mismo concepto, diferente implementación)
- Estructura de secciones con encabezado (icono + titulo)
- Toggle switches
- Modales/Paneles con overlay

### Componentes Candidatos a Centralizar

| Componente Propuesto | Uso Actual                                 | Archivos Afectados                                  |
| -------------------- | ------------------------------------------ | --------------------------------------------------- |
| `AccionesFormulario` | Botones Cancelar/Guardar/Eliminar          | FormularioHabito.tsx, PanelConfiguracionTarea.tsx   |
| `SelectorNivel`      | Importancia (habitos) y Prioridad (tareas) | FormularioHabito.tsx, PanelConfiguracionTarea.tsx   |
| `SeccionPanel`       | Wrapper con icono + titulo                 | PanelConfiguracionTarea.tsx, FormularioHabito.tsx   |
| `ToggleSwitch`       | Switch on/off para opciones                | PanelConfiguracionTarea.tsx                         |
| `PanelModal`         | Contenedor modal con overlay               | ModalHabito.tsx, PanelConfiguracionTarea.tsx        |
| `SelectorDias`       | Dias de la semana                          | SelectorFrecuencia.tsx, PanelConfiguracionTarea.tsx |

### CSS a Unificar

| Estilos                                                   | Ubicacion Actual       | Propuesta                           |
| --------------------------------------------------------- | ---------------------- | ----------------------------------- |
| `.formularioAcciones`, `.formularioBotonCancelar`, etc    | formulario.css         | Mover a `shared/acciones.css`       |
| `.formularioGrupoBotones`, `.formularioBotonImportancia*` | formulario.css         | Mover a `shared/selector-nivel.css` |
| `.modalOverlay`, `.modalContenedor`, etc                  | modal.css              | Ya centralizado, reutilizar         |
| `.panelConfiguracion*` que duplica modal                  | panelConfiguracion.css | Eliminar duplicados, usar modal.css |

### Fases de Refactorizacion

**Fase R1: Audit y Documentacion** (2-3 horas)
- [ ] Listar TODOS los componentes con UI similar
- [ ] Capturar screenshots de diferencias visuales actuales
- [ ] Definir diseño "canonico" de cada componente comun
- [ ] Crear documento de patron de uso

**Fase R2: CSS Compartido** (1-2 horas)
- [ ] Crear `styles/dashboard/shared/` para estilos reutilizables
- [ ] Extraer estilos de botones de accion
- [ ] Extraer estilos de selector nivel (importancia/prioridad)
- [ ] Actualizar imports en index.css

**Fase R3: Componentes Compartidos** (3-4 horas)
- [ ] Crear `components/shared/AccionesFormulario.tsx`
- [ ] Crear `components/shared/SelectorNivel.tsx`
- [ ] Crear `components/shared/SeccionPanel.tsx`
- [ ] Crear `components/shared/ToggleSwitch.tsx`
- [ ] Actualizar exportaciones en index.ts

**Fase R4: Integracion y Testing** (2-3 horas)
- [ ] Refactorizar FormularioHabito.tsx para usar componentes shared
- [ ] Refactorizar PanelConfiguracionTarea.tsx para usar componentes shared
- [ ] Verificar consistencia visual en ambos paneles
- [ ] Probar todos los flujos de usuario

### Checklist de Revision por Archivo

**FormularioHabito.tsx**
- [ ] Usa AccionesFormulario?
- [ ] Usa SelectorNivel para importancia?
- [ ] Estilos vienen de shared/?

**PanelConfiguracionTarea.tsx**
- [ ] Usa AccionesFormulario?
- [ ] Usa SelectorNivel para prioridad?
- [ ] Usa SeccionPanel para secciones?
- [ ] Usa ToggleSwitch para repeticion?
- [ ] Estilos vienen de shared/?

**SelectorFrecuencia.tsx**
- [ ] Usa SelectorDias para dias de semana?

### Archivos Nuevos a Crear

```
components/shared/
  AccionesFormulario.tsx      # Botones Cancelar/Guardar/Eliminar
  SelectorNivel.tsx           # Selector Alta/Media/Baja generico
  SeccionPanel.tsx            # Wrapper seccion con icono+titulo
  ToggleSwitch.tsx            # Componente toggle reutilizable
  index.ts                    # Actualizar exportaciones

styles/dashboard/shared/
  accionesFormulario.css      # Estilos centralizados de acciones
  selectorNivel.css           # Estilos selector importancia/prioridad
  seccionPanel.css            # Estilos seccion con encabezado
  toggleSwitch.css            # Estilos toggle
```

### Notas de Implementacion

- Mantener retrocompatibilidad: los componentes deben poder usarse sin romper lo existente
- Usar props genéricas (ej: `niveles` en lugar de `importancias` o `prioridades`)
- Documentar cada componente con ejemplos de uso
- Considerar accesibilidad (aria-labels, focus states)

---

## Pendientes de Fases Anteriores

### Habitos
- [ ] Animacion de entrada al crear habito
- [ ] Animacion visual de logro al completar
- [ ] Umbral de reseteo editable por usuario
- [ ] Adaptar racha a la frecuencia (racha semanal vs diaria)
- [ ] Historial considerando frecuencia para estadisticas
- [ ] Animacion de salida al eliminar

### Tareas
- [ ] Animacion de preview mas fluida durante arrastre
- [ ] Estadisticas de tareas completadas hoy

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

### Fase: Estadisticas y Graficos
- Panel de estadisticas (habitos/semana, rachas, tareas completadas)
- Grafico de consistencia estilo GitHub (heatmap)
- Calendario con dias completados
- Exportar datos

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

