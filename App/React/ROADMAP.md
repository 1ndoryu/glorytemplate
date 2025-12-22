# Dashboard de Productividad Personal - Roadmap

Sistema de seguimiento de hábitos, tareas y notas rápidas con diseño estilo terminal minimalista.

---

## Estado Actual

**Fecha de inicio:** 2025-12-19  
**Version:** v1.0.0-beta  
**Ultima actualizacion:** 2025-12-21
**Estado:** Planificación de nuevas funcionalidades

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
- [ ] **Mover de proyecto**: Opción en menú contextual para cambiar una tarea de proyecto
- [ ] Modal selector de proyecto al mover tarea

**Ordenamiento Inteligente:**
- [x] **Inteligente**: Combinar importancia + fecha límite
- [x] **Solo fecha**: Ordenar por fecha límite
- [x] **Por importancia**: Priorizar tareas (Alta > Media > Baja)

**Mejora de UX / Tooltips:**
- [ ] **Sistema de Tooltips**: Crear componente `Tooltip` personalizado con diseño del dashboard (oscuro, minimalista)
- [ ] **Interceptar nativos**: Reemplazar atributos `title` del navegador por el tooltip personalizado automáticamente
- [ ] **Aplicación prioritaria**: Mostrar nombre completo del proyecto al hacer hover en el badge (especialmente en modo solo icono)

**Consideraciones Visuales:**
- [ ] Cuidar la estética con múltiples filtros visibles
- [ ] Agrupar controles de forma compacta
- [ ] Mantener coherencia con el estilo terminal

---

### 📝 Fase Scratchpad Seguro

**Objetivo:** Asegurar que el Scratchpad sea seguro, eficiente y no abuse de recursos.

**Seguridad:**
- [ ] Verificar que el Scratchpad esté cifrado cuando E2E está activo
- [ ] Cifrar contenido con la misma lógica de AES-256-GCM

**Límites de Texto:**
- [ ] Implementar límite mínimo de 20,000 caracteres
- [ ] Mostrar contador de caracteres usado/total
- [ ] Advertencia visual cuando se acerca al límite
- [ ] Truncar texto si excede (con confirmación)

**Optimización de Guardado:**
- [ ] Revisar si cada letra genera petición AJAX (actualmente hay debounce 500ms)
- [ ] Considerar aumentar debounce a 1-2 segundos
- [ ] Evaluar guardado por "bloques" o "commit" manual
- [ ] Indicador "pendiente de guardar" vs "guardado"

---

### 🔲 Fase Layout Personalizable (Columnas)

**Objetivo:** Permitir al usuario personalizar el layout del dashboard según sus preferencias.

**Columnas Redimensionables:**
- [ ] Implementar resize handle entre columnas (arrastrar para cambiar ancho)
- [ ] Guardar preferencias de ancho en configuración de usuario
- [ ] Ancho mínimo y máximo por columna

**Configuración de Layout:**
- [ ] Opción 1 columna (todo vertical)
- [ ] Opción 2 columnas (actual)
- [ ] Opción 3 columnas (para pantallas grandes)
- [ ] Selector en configuración o drag & drop

**Ocultar/Mostrar Paneles:**
- [ ] Toggle para ocultar: Proyectos, Foco Prioritario, Ejecución, Scratchpad
- [ ] Paneles ocultos aparecen en barra lateral mínima (iconos)
- [ ] Persistir configuración de visibilidad

**Refactorización Necesaria:**
- [ ] Verificar que todos los componentes soporten ancho dinámico
- [ ] CSS Grid/Flexbox adaptativo
- [ ] Componente `LayoutManager` para orquestar

---

### 📜 Fase Historial de Versiones

**Objetivo:** Mostrar changelog de versiones al hacer click en el badge de versión.

**Modal de Historial:**
- [ ] Al hacer click en "v1.0.0-beta" se abre modal
- [ ] Lista de versiones ordenada (más reciente primero)
- [ ] Cada versión muestra:
  - Número de versión
  - Fecha de lanzamiento
  - Lista de cambios (agregados, mejorados, corregidos)

**Implementación:**
- [ ] Archivo `CHANGELOG.md` o JSON con versiones
- [ ] Componente `ModalVersiones.tsx`
- [ ] Estilos consistentes con otros modales

**Sistema de Versiones:**
- [ ] Con cada release significativo, incrementar versión
- [ ] Formato: MAJOR.MINOR.PATCH (semver)
- [ ] Etiquetas: alpha, beta, stable

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

