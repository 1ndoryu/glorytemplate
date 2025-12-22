# Dashboard de Productividad Personal - Roadmap

Sistema de seguimiento de hábitos, tareas y notas rápidas con diseño estilo terminal minimalista.

---

## Estado Actual

**Fecha de inicio:** 2025-12-19  
**Version:** v1.0.0-beta  
**Ultima actualizacion:** 2025-12-22
**Estado:** Etapa 5 - Pulido y Soporte Mobile (Etapas 1-4 completadas)

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

---

## Próximas Funcionalidades (Pendientes)

### 🎯 Fase Filtros Inteligentes en Ejecución

**Objetivo:** Mejorar la visualización y filtrado de tareas en el panel de Ejecución con controles elegantes.

**Rediseño del Select (Badge Personalizado):**
- [x] Crear componente `SelectorBadge` que reemplace el select nativo
- [x] Al hacer click abre menú estilo contextual con opciones
- [x] Diseño visual consistente con badges existentes
- [x] Aplicar también al filtro de importancia de hábitos

**Filtros de Tareas en Panel Ejecución:**
- [x] **Tareas sueltas** (por defecto): Comportamiento actual, solo tareas sin proyecto
- [x] **Por proyecto**: Selector para ver tareas de un proyecto específico en Ejecución
- [x] **Todas las tareas**: Combinar tareas sueltas + tareas de todos los proyectos
- [x] Badge/indicador visual que muestre el filtro activo
- [x] Recordar preferencia del usuario (localStorage) 

**Gestión de Tareas:**
- [x] **Mover de proyecto**: Opción en menú contextual para cambiar una tarea de proyecto
- [x] Modal selector de proyecto al mover tarea

**Ordenamiento Inteligente:**
- [x] **Inteligente**: Combinar importancia + fecha límite
- [x] **Solo fecha**: Ordenar por fecha límite
- [x] **Por importancia**: Priorizar tareas (Alta > Media > Baja)

**Mejora de UX / Tooltips:**
- [x] **Sistema de Tooltips**: Crear componente `Tooltip` personalizado con diseño del dashboard (oscuro, minimalista)
- [x] **Interceptar nativos**: Reemplazar atributos `title` del navegador por el tooltip personalizado automáticamente
- [x] **Aplicación prioritaria**: Mostrar nombre completo del proyecto al hacer hover en el badge (especialmente en modo solo icono)

**Consideraciones Visuales:**
- [x] Cuidar la estética con múltiples filtros visibles
- [x] Agrupar controles de forma compacta
- [x] Mantener coherencia con el estilo terminal

---

### 🎨 Fase Estandarización de UX - Controles de Panel

**Objetivo:** Unificar la experiencia de usuario en todos los paneles, asegurando que cada uno tenga controles consistentes para crear elementos y configurar el panel.

**Botones de Creación Unificados:**
- [x] Implementar botón "Nuevo" estilo badge (como en Proyectos/Filtros) en todos los paneles:
  - [x] **Hábitos:** Botón "Nuevo Hábito" en el encabezado
  - [x] **Tareas (Ejecución):** Botón "Nueva Tarea" en el encabezado (además del input inline)
  - [x] **Scratchpad:** Botón "Limpiar" o "Nueva Nota" (si se implementan tabs)
- [x] Asegurar que todos usen el componente/estilo `selectorBadgeBoton`

**Consistencia Visual:**
- [x] Revisar tamaños de iconos (10px - 12px) en todos los badges
- [x] Unificar tooltips en estos botones
- [x] Asegurar alineación vertical correcta en todos los encabezados

---

### 📝 Fase Scratchpad Seguro

**Objetivo:** Asegurar que el Scratchpad sea seguro, eficiente y no abuse de recursos.

**Seguridad:**
- [x] Verificar que el Scratchpad esté cifrado cuando E2E está activo
- [x] Cifrar contenido con la misma lógica de AES-256-GCM

**Límites de Texto:**
- [x] Implementar límite mínimo de 20,000 caracteres
- [x] Mostrar contador de caracteres usado/total
- [x] Advertencia visual cuando se acerca al límite (90%)
- [x] Truncar texto si excede (con maxLength en textarea)

**Optimización de Guardado:**
- [x] Revisar si cada letra genera petición AJAX (actualmente hay debounce 500ms)
- [x] Considerar aumentar debounce a 1-2 segundos (aumentado a 1.5s)
- [x] Indicador "pendiente de guardar" vs "guardado"

---

### 🔲 Fase Layout Personalizable (Columnas)

**Objetivo:** Permitir al usuario personalizar el layout del dashboard según sus preferencias.

**Columnas Redimensionables:**
- [x] Implementar resize handle entre columnas (arrastrar para cambiar ancho)
- [x] Guardar preferencias de ancho en configuración de usuario
- [x] Ancho mínimo y máximo por columna

**Configuración de Layout:**
- [x] Opción 1 columna (todo vertical)
- [x] Opción 2 columnas (actual)
- [x] Opción 3 columnas (para pantallas grandes)
- [x] Selector en configuración o drag & drop

**Ocultar/Mostrar Paneles:**
- [x] Toggle para ocultar: Proyectos, Foco Prioritario, Ejecución, Scratchpad
- [x] Paneles ocultos aparecen en barra lateral mínima (iconos)
- [x] Persistir configuración de visibilidad

**Refactorización Necesaria:**
- [x] Verificar que todos los componentes soporten ancho dinámico
- [x] CSS Grid/Flexbox adaptativo
- [x] Componente `LayoutManager` para orquestar

---

### � Fase Reordenamiento de Paneles (Drag & Drop)

**Objetivo:** Permitir al usuario reorganizar la posición de los paneles del dashboard arrastrándolos vertical u horizontalmente entre columnas.

**Estructura de Datos:**
```typescript
interface OrdenPanel {
    id: PanelId;           // 'focoPrioritario' | 'proyectos' | 'ejecucion' | 'scratchpad'
    columna: 1 | 2 | 3;    // A qué columna pertenece
    posicion: number;      // Orden dentro de la columna (0, 1, 2...)
}

// Agregar a ConfiguracionLayout existente:
ordenPaneles: OrdenPanel[];
```

**Etapa 1: Modelo de Datos y Hook (Fundamentos)**
- [x] Extender `useConfiguracionLayout` con `ordenPaneles`
- [x] Definir orden por defecto según modo de columnas
- [x] Implementar `reordenarPanel(panelId, columna, posicion)`
- [x] Implementar `moverPanelArriba(panelId)` / `moverPanelAbajo(panelId)`
- [x] Función `obtenerPanelesColumna(columna)` que retorna paneles ordenados
- [x] Migración automática: si no existe `ordenPaneles`, generarlo desde el layout actual

**Etapa 2: Renderizado Dinámico en Dashboard**
- [x] Crear función `renderizarPanel(panelId)` que retorna el JSX del panel
- [x] Modificar `DashboardIsland` para iterar `ordenPaneles` agrupados por columna
- [x] Los paneles se renderizan según su `posicion` dentro de cada columna
- [x] Respetar `visibilidad`: panel oculto no se renderiza pero mantiene su orden

**Etapa 3: Controles en Modal de Configuración (Accesibilidad)**
- [x] Crear componente `ListaOrdenPaneles.tsx`
  - Lista de paneles con iconos y nombres
  - Botones ↑↓ para mover dentro de columna
  - Selector de columna destino (dropdown o badges)
  - Vista previa compacta del layout
- [x] Agregar sección "Orden de Paneles" en `ModalConfiguracionLayout`
- [x] Botón "Restaurar orden por defecto"

**Etapa 4: Sistema de Arrastre Personalizado (Completado)**

> **Nota:** El API nativo de HTML5 Drag & Drop fue descartado por ser poco confiable 
> (comportamiento inconsistente, falta de feedback visual adecuado). Se implementará 
> un sistema personalizado basado en eventos de mouse.

- [x] Crear hook `useArrastrePaneles` con lógica de mouse events
  - Estado: `panelArrastrando`, `posicionMouse`, `panelDestino`
  - Eventos: mousedown en handle, mousemove global, mouseup global
  - Cálculo de zona de drop basado en posición Y del mouse
- [x] Crear componente `HandleArrastre.tsx` (botón en encabezado)
  - Estilo badge consistente con el dashboard
  - Icono grip de 6 puntos
  - onMouseDown inicia el arrastre
- [x] Implementar feedback visual durante arrastre
  - Panel origen: opacidad reducida
  - Indicador flotante siguiendo el cursor (preview del panel)
  - Zona destino: borde brillante arriba/abajo del panel
- [x] Integrar con `DashboardIsland`
  - Agregar HandleArrastre en cada SeccionEncabezado
  - Listeners globales de mouse en el componente principal
- [x] Animación suave al soltar (CSS transitions)

**Etapa 5: Pulido y Mobile**
- [ ] Touch events para dispositivos táctiles
- [ ] Fallback a controles del modal para accesibilidad
- [ ] Animación de "snap" al soltar
- [ ] Cursor personalizado durante arrastre

**Consideraciones Técnicas:**

| Aspecto        | Decisión                                        |
| -------------- | ----------------------------------------------- |
| Dependencias   | Ninguna - sistema propio con mouse/touch events |
| Persistencia   | localStorage via `useConfiguracionLayout`       |
| Sincronización | Incluir en datos sincronizados al servidor      |
| Mobile         | Touch events + fallback a controles del modal   |
| Accesibilidad  | Modal con botones siempre disponible            |

**Archivos a Crear:**
```
components/shared/PanelArrastrable.tsx
components/shared/ZonaDeposito.tsx  
components/dashboard/ListaOrdenPaneles.tsx
styles/dashboard/shared/panelArrastrable.css
```

**Archivos a Modificar:**
```
hooks/useConfiguracionLayout.ts
components/dashboard/ModalConfiguracionLayout.tsx
islands/DashboardIsland.tsx
styles/dashboard/shared/layoutManager.css
```

**Orden de Paneles por Defecto:**

| Panel            | Columna (2col) | Posición |
| ---------------- | -------------- | -------- |
| Foco Prioritario | 1              | 0        |
| Proyectos        | 1              | 1        |
| Ejecución        | 2              | 0        |
| Scratchpad       | 2              | 1        |

**Nota:** "Acciones de Datos" (exportar/importar) siempre aparece al final de la última columna y no es reordenable.

---

### �📜 Fase Historial de Versiones

**Objetivo:** Mostrar changelog de versiones al hacer click en el badge de versión.

**Modal de Historial:**
- [x] Al hacer click en "v1.0.0-beta" se abre modal
- [x] Lista de versiones ordenada (más reciente primero)
- [x] Cada versión muestra:
  - Número de versión
  - Fecha de lanzamiento
  - Lista de cambios (agregados, mejorados, corregidos)

**Implementación:**
- [x] Archivo `CHANGELOG.md` o JSON con versiones
- [x] Componente `ModalVersiones.tsx`
- [x] Estilos consistentes con otros modales

**Sistema de Versiones:**
- [x] Con cada release significativo, incrementar versión
- [x] Formato: MAJOR.MINOR.PATCH (semver)
- [x] Etiquetas: alpha, beta, stable

---

### 👤 Fase Perfil de Usuario

**Objetivo:** Permitir al usuario configurar su perfil desde el dashboard.

**Modal de Perfil (click en nombre de usuario):**
- [ ] Nombre de usuario (editable)
- [ ] Foto de perfil (subir imagen, crop, preview)
- [ ] Descripción/Bio breve
- [ ] Cambiar contraseña (actual, nueva, confirmar)
- [ ] Botón guardar con validaciones

**Recuperación de Contraseña:**
- [ ] Enlace "¿Olvidaste tu contraseña?" en formulario de login
- [ ] Flujo: email → código/link → nueva contraseña
- [ ] Usar sistema de WordPress (wp_lostpassword_url) o custom

**Implementación:**
- [ ] Componente `ModalPerfil.tsx`
- [ ] Endpoint API `POST /wp-json/glory/v1/perfil`
- [ ] Endpoint API `POST /wp-json/glory/v1/auth/recuperar`
- [ ] Integración con WordPress para contraseñas

---

### ⚙️ Fase Configuración por Panel

**Objetivo:** Cada panel del dashboard tendrá su propio botón de configuración (similar al de Tareas) con opciones específicas para ese panel.

**Patrón General:**
- Cada panel tiene un botón ⚙️ en su encabezado (junto al título)
- Abre un modal de configuración específico del panel
- Configuraciones se guardan en localStorage
- Hook `useConfiguracion[NombrePanel]` para cada panel

**Panel: Foco Prioritario (Hábitos)**
- [ ] Crear hook `useConfiguracionHabitos`
- [ ] Crear componente `ModalConfiguracionHabitos.tsx`
- [ ] Agregar botón de configuración al encabezado del panel
- [ ] Configuraciones disponibles:
  - [ ] Ocultar hábitos completados hoy
  - [ ] Columnas visibles de la tabla:
    - Índice (#)
    - Nombre
    - Racha
    - Frecuencia
    - Importancia
    - "Toca Hoy"
    - Acciones
  - [ ] Modo compacto (filas más pequeñas)

**Panel: Proyectos**
- [ ] Crear hook `useConfiguracionProyectos`
- [ ] Crear componente `ModalConfiguracionProyectos.tsx`
- [ ] Configuraciones disponibles:
  - [ ] Ocultar proyectos completados
  - [ ] Ordenamiento por defecto (nombre, fecha, prioridad)
  - [ ] Mostrar/ocultar progreso

**Panel: Scratchpad**
- [ ] Crear hook `useConfiguracionScratchpad`
- [ ] Crear componente `ModalConfiguracionScratchpad.tsx`
- [ ] Configuraciones disponibles:
  - [ ] Tamaño de fuente (pequeño, normal, grande)
  - [ ] Altura del área de texto
  - [ ] Auto-guardado (intervalo configurable)

**Nota:** El panel de Tareas (Ejecución) ya tiene su configuración implementada via `useConfiguracionTareas` y `ModalConfiguracionTareas`.

---

### 📌 Mejoras Menores (Baja Prioridad)

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

</details>

---

## 🔮 Visión a Largo Plazo

### Sistema de Compañeros (v2.x)

**Objetivo:** Permitir que usuarios se conecten y compartan hábitos/tareas.

**Lista de Compañeros:**
- [ ] Enviar/aceptar solicitudes de compañero
- [ ] Lista de compañeros activos
- [ ] Perfiles visibles entre compañeros

**Compartir Elementos:**
- [ ] Compartir un hábito con un compañero
- [ ] Compartir una tarea/proyecto
- [ ] Ambos ven progreso (pero cada uno tiene su propia instancia)
- [ ] Notificaciones cuando el compañero completa algo

**Motivación Social:**
- [ ] "Fulanito completó X hoy"
- [ ] Comparar rachas (amistoso)
- [ ] Retos entre compañeros

---

### Feed de Red Social (v3.x)

**Objetivo:** Crear un espacio social para compartir logros y motivarse.

**Feed Principal:**
- [ ] Posts automáticos: "Completó 30 días de racha en X"
- [ ] Posts manuales: reflexiones, tips, logros
- [ ] Like/reacciones
- [ ] Comentarios

**Privacidad:**
- [ ] Elegir qué compartir (opt-in)
- [ ] Público vs solo compañeros
- [ ] Perfil público opcional

**Gamificación:**
- [ ] Badges de logros
- [ ] Niveles/experiencia
- [ ] Leaderboards semanales

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

