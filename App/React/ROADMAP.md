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

## Próximas Funcionalidades (Pendientes)

### 🔄 Fase Reordenamiento - Pulido Mobile

**Etapa 5: Pulido y Mobile**
- [ ] Touch events para dispositivos táctiles
- [ ] Fallback a controles del modal para accesibilidad
- [ ] Animación de "snap" al soltar
- [ ] Cursor personalizado durante arrastre

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

### Sistema de Compañeros (v1.0.2)

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

### Feed de Red Social (v1.0.2)

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

