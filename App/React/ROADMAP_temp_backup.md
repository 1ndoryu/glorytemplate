# Dashboard de Productividad Personal - Roadmap

Sistema de seguimiento de hábitos, tareas y notas rápidas con diseño estilo terminal minimalista.

---

## Tareas del Proyecto SaaS Task (API)

> **Última sincronización:** 2026-01-11 00:13

---

## Fase 10: Versión Móvil (WebView → APK) 📱 **PRIORITARIA**

**Objetivo:** Preparar la webapp para ser embebida en un WebView de Android y generar un APK.  
**Enfoque:** Optimizar la experiencia web móvil primero, luego empaquetar con WebView nativo.  
**Prioridad:** Alta | **Urgencia:** Normal  
**Estado:** 🚧 EN PROGRESO

### 10.1 Fundamentos CSS Móvil ✅
> Breakpoints definidos, `movil.css` creado, documentación en `docs/PATRONES_MOVIL.md`

### 10.2 Componentes Adaptativos ✅
> Una columna en móvil, búsqueda modal fullscreen, modales fullscreen con botón "← Volver", `BottomSheet` con animación y overlay, `MenuContextualAdaptivo` integrado

### 10.3 Header Móvil ✅
> Layout grid 3 columnas (hamburguesa | título | búsqueda), `DrawerMovil` con swipe y overlay, header fijo con `position: fixed`, iconos unificados (20px)

---

### 10.4 Optimización WebView ✅

**Objetivo:** Asegurar compatibilidad y rendimiento en WebView Android.

- [x] **Viewport y meta tags:**
  - [x] `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">`
  - [x] `<meta name="mobile-web-app-capable" content="yes">`
  - [x] `<meta name="theme-color" content="#090909">` para barra de estado
  - [x] `format-detection` para desactivar auto-links
- [x] **Safe Areas:**
  - [x] Variables CSS `--dashboard-safeArea*` con `env()` y fallbacks
  - [x] Clase `.contenedorConSafeArea` utilitaria
  - [x] Safe areas automáticos en header, drawer, modal, bottomsheet, navegación
- [x] **Rendimiento WebView:**
  - [x] Animaciones con `transform` y `opacity` únicamente
  - [x] `will-change` y `backface-visibility` en elementos animados
  - [x] `touch-action: manipulation` para eliminar delay 300ms
  - [x] `-webkit-tap-highlight-color: transparent`
- [ ] **Comunicación JS ↔ Android (Futuro):**
  - [ ] Definir interfaz `window.Android` para callbacks nativos
  - [ ] Notificaciones push vía Firebase (opcional)
  - [ ] Acceso a cámara/galería nativo (opcional)

### 10.5 UX Mobile-First ✅

**Objetivo:** Experiencia táctil fluida y natural.

- [x] **Tamaños táctiles:**
  - [x] Variable `--dashboard-tamanoTactilMinimo: 44px`
  - [x] Variable `--dashboard-espacioTactil: 8px`
- [x] **Feedback táctil:**
  - [x] Estados `:active` con `opacity` y `scale` en botones
  - [x] Transiciones suaves de 0.1s en elementos interactivos
- [x] **Scroll optimizado:**
  - [x] `-webkit-overflow-scrolling: touch` en contenedores
  - [x] `overflow-x: hidden` para evitar scroll horizontal
  - [x] `overscroll-behavior: none` para evitar rebote
- [x] **Modales fullscreen faltantes:**
  - [x] Aplicar a: ConfiguraciónTarea, ConfiguraciónProyecto, ModalHabito (ya usan Modal base con fullscreen)

### 10.6 Navegación Móvil ✅

**Objetivo:** Navegación nativa estilo app.

```
┌─────────────────────────────────────┐
│  🏠  │  📋  │  ➕  │  🔔  │  👤  │
└─────────────────────────────────────┘
```

- [x] **Componente `NavegacionInferior`:**
  - [x] Fijo en la parte inferior (position: fixed)
  - [x] 5 iconos minimalistas sin etiquetas
  - [x] Indicador visual de sección activa
  - [x] Altura: ~52px + safe-area-inset-bottom
- [x] **Botón FAB central (+):**
  - [x] Círculo con borde sutil (monocromático)
  - [x] Al tocar: abre menú con opciones (Tarea, Proyecto, Hábito)
- [x] **Rutas de navegación:**
  - [x] Home → Dashboard
  - [x] Tasks → Lista de tareas
  - [x] Notificaciones → Modal notificaciones
  - [x] Perfil → Modal perfil

### 10.7 Preparación APK (Futuro)

**Objetivo:** Documentar y preparar el empaquetado Android.

- [ ] **Documentación técnica:**
  - [ ] Crear `docs/WEBVIEW_ANDROID.md` con instrucciones
  - [ ] Requisitos mínimos de Android (API level)
  - [ ] Configuración de WebView recomendada
- [ ] **Assets para APK:**
  - [ ] Icono de app (múltiples resoluciones)
  - [ ] Splash screen
  - [ ] Nombre de app y package name
- [ ] **Configuración WebView:**
  - [ ] JavaScript habilitado
  - [ ] DOM Storage habilitado
  - [ ] Cache configurado
  - [ ] Manejo de permisos (cámara, archivos)

---

### 10.8 Reestructuración UX Móvil ✅ COMPLETADA

**Objetivo:** Transformar la experiencia móvil para que cada panel sea una página independiente con navegación nativa.  
**Prioridad:** Alta | **Urgencia:** Alta  
**Estado:** ✅ Completado (v1.0.12-beta)

> **Para ver cambios aplicados en móvil:**
> ```powershell
> # Desde .agent\coolify-manager
> .\manager.ps1 deploy -SiteName nakomi -Update
> ```

<details>
<summary>✅ Tareas Completadas (10.8.1 - 10.8.15)</summary>

| Tarea   | Descripción                                              |
| ------- | -------------------------------------------------------- |
| 10.8.1  | Sistema de Navegación por Páginas (5 botones inferiores) |
| 10.8.2  | Paneles Fullscreen Sin Bordes                            |
| 10.8.3  | Menú de Opciones Unificado (3 puntos → BottomSheet)      |
| 10.8.4  | Eliminar Capacidad de Minimizar en Móvil                 |
| 10.8.5  | Mejoras Visuales del Menú Opciones (iconos, compacto)    |
| 10.8.6  | Modales con Header Compacto (40px, grid 3 columnas)      |
| 10.8.7  | Menús Contextuales Bottom Sheet (drag-to-close)          |
| 10.8.8  | Bugs y Refinamientos del Menú Opciones                   |
| 10.8.9  | Limpieza del Header (sin logo, sin tooltips, búsqueda)   |
| 10.8.10 | Formulario Compacto Móvil (pills, padding reducido)      |
| 10.8.11 | Modal con Chat Integrado Inline                          |
| 10.8.12 | Layout Listas Compactas (proyectos 2 filas, hábitos)     |
| 10.8.13 | Configuración de Columnas Hábitos por Dispositivo        |
| 10.8.14 | Limpieza Visual de Listas (sin fondos color, padding)    |
| 10.8.15 | Estandarización de Botones "Añadir" (ocultos en móvil)   |

**Componentes creados/modificados:**
- `usePaginaMovil`, `useOpcionesPanelMovil`, `useConfiguracionHabitos` (detección móvil)
- `NavegacionInferior` con FAB central
- `MenuContextualAdaptivo`, `BottomSheet` con drag-to-close
- CSS: `movil.css`, `bottomSheet.css`, `modal.css`, `encabezado.css`

</details>

---

#### 10.8.16 Header Móvil Ajustado (Pendiente)

**Objetivo:** Adaptar el header móvil fijo para la nueva arquitectura.

- [ ] **Contenido dinámico:**
  - [ ] Mostrar nombre del panel/página actual
  - [ ] Hamburguesa a la izquierda (Drawer)
  - [ ] Búsqueda y Opciones a la derecha
- [ ] **Sincronización con navegación:**
  - [ ] Título cambia según página activa
  - [ ] Posiblemente quitar icono de búsqueda del nav inferior

---

### Orden de Implementación Fase 10

| Paso | Subfase | Descripción               | Estado       |
| ---- | ------- | ------------------------- | ------------ |
| 1    | 10.1    | Fundamentos CSS           | ✅ Completado |
| 2    | 10.2    | Componentes Adaptativos   | ✅ Completado |
| 3    | 10.3    | Header Móvil + Drawer     | ✅ Completado |
| 4    | 10.4    | Optimización WebView      | ✅ Completado |
| 5    | 10.5    | UX Mobile-First           | ✅ Completado |
| 6    | 10.6    | Navegación Inferior       | ✅ Completado |
| 7    | 10.7    | Preparación APK           | ⏳ Pendiente  |
| 8    | 10.8    | Reestructuración UX Móvil | ✅ Completado |

---

## Fase 11: Sistema de Notas Mejorado

**Objetivo:** Mejorar la experiencia de escritura y gestión de notas.  
**Prioridad:** Media | **Urgencia:** Chill

#### 11.1 Editor de Notas con Markdown
- [ ] Implementar parser de Markdown en el panel de escritura
- [ ] Soporte para sintaxis básica: **negrita**, *cursiva*, listas, código
- [ ] Preview en tiempo real o toggle vista previa
- [ ] Atajos de teclado (Ctrl+B, Ctrl+I, etc.)

#### 11.2 Vista Expandida de Notas
- [ ] Botón "Expandir" en sección Notas Guardadas
- [ ] Layout de dos columnas: lista de notas | editor
- [ ] Navegación entre notas sin recargar página
- [ ] Reutilizar componente existente (centralizar lógica)

#### 11.3 Búsqueda de Notas
- [ ] Integrar notas en el sistema de búsqueda global
- [ ] Indexar título y contenido de notas
- [ ] Mostrar resultados de notas en dropdown de búsqueda

---

## Fase 12: Gestión de Tiempo (Time Tracking)

**Objetivo:** Agregar seguimiento de tiempo a hábitos y tareas.  
**Prioridad:** Baja | **Urgencia:** Chill  
**Nota:** Requiere planificación adicional y adaptación de la API.

#### 12.1 Diseño y Planificación
- [ ] Definir modelo de datos para registros de tiempo
- [ ] Diseñar UI del cronómetro/timer
- [ ] Definir integración con hábitos (opción "activar tracking")
- [ ] Evaluar si aplicarlo también a tareas

#### 12.2 Implementación Base
- [ ] Componente `Cronometro` (play, pause, stop)
- [ ] Hook `useTimeTracking` para gestionar estado
- [ ] Almacenamiento de sesiones de tiempo
- [ ] Integración con hábitos: botón play al lado del checkbox

#### 12.3 Reportes de Tiempo
- [ ] Vista de tiempo invertido por hábito/tarea
- [ ] Gráficos de distribución de tiempo
- [ ] Exportar datos de tiempo

---

## Fase 13: Pausar Hábitos

**Objetivo:** Permitir al usuario pausar temporalmente un hábito sin eliminarlo ni afectar las estadísticas.  
**Prioridad:** Media | **Urgencia:** Normal  
**Estado:** ✅ Completado

### 13.1 Modelo de Datos
- [x] Agregar campo `pausado: boolean` al modelo de hábito
- [x] Agregar campo `fechaPausa: Date | null` para registrar cuándo se pausó
- [ ] Agregar campo `motivoPausa: string | null` (opcional, para contexto) - *Pendiente para siguiente iteración*
- [ ] Actualizar API REST para soportar el nuevo estado - *Se sincroniza automáticamente via store*

### 13.2 UI - Menú Contextual
- [x] Agregar opción "Pausar hábito" / "Reanudar hábito" en el menú contextual del hábito
- [x] Icono: ⏸️ para pausar, ▶️ para reanudar
- [x] Feedback visual al usuario (toast/notificación)

### 13.3 UI - Configuración del Hábito
- [x] Agregar sección "Pausar" en el modal de configuración del hábito
- [x] Botón para activar/desactivar pausa
- [x] Mostrar fecha desde que está pausado si aplica

### 13.4 Comportamiento de Hábitos Pausados
- [x] Los hábitos pausados NO aparecen en la lista principal de pendientes
- [x] Los hábitos pausados se muestran en una sección separada "Pausados"
- [ ] Filtro en la lista de hábitos: "Mostrar pausados" / "Ocultar pausados" - *Pendiente*

### 13.5 Indicadores Visuales
- [x] Clase CSS `.tablaFilaPausada` con opacidad reducida
- [x] Sección separada con contador de hábitos pausados
- [x] Diferenciación clara entre hábitos activos y pausados en la tabla

### 13.6 Integración Móvil
- [x] Opción de pausar/reanudar en el menú contextual (BottomSheet adaptativo)
- [x] Misma funcionalidad accesible desde configuración en móvil


---

## Fase 14: Mejoras de Configuración y UX (Enero 2026) 🌟 **NUEVA**

**Objetivo:** Implementar personalización avanzada y refinar la experiencia de usuario basada en feedback reciente.  
**Prioridad:** Alta | **Urgencia:** Alta

### 14.1 Configuración de Jornada (Fin del Día) ✅ **COMPLETADA**
- [x] **Configuración de "Nuevo Día":**
  - [x] Agregar opción global (persistente) para definir la hora de corte del día (ej. 06:00 AM).
  - [x] Importante para usuarios nocturnos: las acciones realizadas a las 2 AM cuentan para el día anterior.
  - [x] Ajustar lógica de cálculo de hábitos y tareas para respetar `HORA_FIN_DIA`.
  - [x] **Revisión (v1.0.13):** Centralizar lógica en `obtenerFechaEfectiva()` para que TODOS los componentes respeten la configuración.
- [x] **Nueva Sección de Configuración:**
  - [x] Agregar botón "Configuración" en el menú contextual del usuario (avatar).
  - [x] Crear modal centralizado de preferencias de usuario.
- [x] **Inicialización Inmediata:**
  - [x] Leer configuración de localStorage antes de que el store se rehidrate para evitar race conditions.

### 14.2 Refinamiento Visual de Hábitos
- [ ] **Modo Compacto Mejorado:**
  - [ ] Estandarizar tamaño de fuente (igual que vista normal, no más pequeño).
  - [ ] Reducir padding lateral en celdas para aprovechar el espacio.
  - [ ] Asegurar alineación vertical perfecta en fila compacta.

### 14.3 Ordenamiento Inteligente 2.0 ✅ **COMPLETADA**
- [x] **Algoritmo de Prioridad Ponderada:**
  - [x] Se mejoró la lógica existente: Tareas vencidas con más días de retraso ahora pesan más.
  - [x] Fórmula v6.0: `PesoTotal = Urgencia + Prioridad + Fecha + (DiasRetraso * 50)`.
  - [x] Ejemplo: Una tarea media (prio 100) con 3 días de retraso = 100 + 150 = 250 vs tarea media con 1 día de retraso = 100 + 50 = 150.
  - [x] Factor configurable: `FACTOR_PONDERACION_RETRASO = 50` puntos por día.
  - [x] Función `calcularDiasRetraso()` añadida para calcular diferencia entre fecha máxima y hoy.


### 14.4 Mejoras de Interfaz (UI/UX) 🚧 **PARCIALMENTE COMPLETADA**

#### 14.4.1 Bloqueo de Panel Expandido ✅
- [x] Agregado botón "Candado" 🔒/🔓 en header de paneles expandidos (`OverlayEnfoque.tsx`).
- [x] Si está activo, impide que el panel se cierre al hacer click fuera.
- [x] Escape siempre cierra (incluso bloqueado).
- [x] Estilos visuales en `overlayEnfoque.css`.

#### 14.4.2 Ocultar Días Libres en Columna Actividad ✅ **COMPLETADA**

**Objetivo:** En la tabla de hábitos, la columna "Actividad" (5 días) oculta los días donde el hábito NO tocaba hacerse según su frecuencia.

**Implementación realizada (v1.0.14):**

1. **Nueva función `esFechaRelevanteConHistorial()`** en `frecuenciaHabitos.ts`:
   - Busca el día completado más cercano anterior en el historial
   - Calcula si han pasado suficientes días según el intervalo de frecuencia
   - Funciona para `cadaXDias`, `semanal`, `mensual` y `diasEspecificos`

2. **Modificada función `generarResumenDeHistorial()`** en `HistorialHabito.tsx`:
   - Busca hacia atrás en el tiempo hasta encontrar exactamente 5 días relevantes
   - Omite días libres sin marcar automáticamente
   - **Incluye** días libres que SÍ fueron marcados (completado/pospuesto/omitido)
   - Siempre retorna exactamente 5 días, buscando en hasta 60 días de historial

3. **Comportamiento final:**
   - Los días libres sin marcar **no aparecen** en la columna Actividad
   - Si un día libre fue marcado manualmente, **sí aparece**
   - Siempre se muestran exactamente 5 días de actividad


### 14.5 Planificación de Estructura (Sidebar)
- [ ] **Análisis de Navegación Lateral:**
  - [ ] Evaluar implementación de sidebar fijo a la izquierda para escritorio.
  - [ ] Objetivo: Soportar múltiples vistas futuras más allá del Dashboard (ej. Calendario completo, Wiki, Archivos).
  - [ ] *Nota: Verificar consistencia con diseño actual tipo Dashboard único.*

### 14.6 Deuda Técnica Visual
- [ ] **Refactor CSS Perfil/Configuración:**
  - [ ] Auditar `VistaPerfil` y modales de configuración.
  - [ ] Eliminar estilos hardcodeados y aplicar variables `var(--...)` del sistema.

---

### Tareas Completadas Recientes ✅

<details>
<summary>Fase 10.8: Reestructuración UX Móvil (Enero 2026)</summary>

| Tarea   | Descripción                                              |
| ------- | -------------------------------------------------------- |
| 10.8.1  | Sistema de Navegación por Páginas (5 botones inferiores) |
| 10.8.2  | Paneles Fullscreen Sin Bordes                            |
| 10.8.3  | Menú de Opciones Unificado (3 puntos → BottomSheet)      |
| 10.8.4  | Eliminar Capacidad de Minimizar en Móvil                 |
| 10.8.5  | Mejoras Visuales del Menú Opciones (iconos, compacto)    |
| 10.8.6  | Modales con Header Compacto (40px, grid 3 columnas)      |
| 10.8.7  | Menús Contextuales Bottom Sheet (drag-to-close)          |
| 10.8.8  | Bugs: badge filtros, scroll innecesario                  |
| 10.8.9  | Limpieza del Header (sin logo, tooltips, búsqueda)       |
| 10.8.10 | Formulario Compacto Móvil (pills y padding reducido)     |
| 10.8.11 | Modal con Chat Integrado Inline                          |
| 10.8.12 | Layout Listas Compactas (proyectos 2 filas, hábitos)     |
| 10.8.13 | Configuración de Columnas Hábitos por Dispositivo        |
| 10.8.14 | Limpieza Visual de Listas                                |
| 10.8.15 | Estandarización de Botones "Añadir"                      |

</details>

<details>
<summary>Fase 10: Móvil/PWA (Enero 2026)</summary>

| Tarea                                                        | Subfase |
| ------------------------------------------------------------ | ------- |
| Breakpoints CSS definidos, `movil.css` creado, documentación | 10.1    |
| Modales fullscreen con botón "Volver", layout una columna    | 10.2    |
| BottomSheet, MenuContextualAdaptivo integrado                | 10.2    |
| Header móvil grid 3 columnas, iconos 20px unificados         | 10.3    |
| DrawerMovil con swipe, overlay y animación                   | 10.3    |
| Búsqueda modal fullscreen en móvil                           | 10.2    |
| Meta tags WebView, safe areas CSS, touch optimizations       | 10.4    |
| Tamaños táctiles, feedback :active, scroll optimizado        | 10.5    |
| NavegacionInferior con FAB monocromático, menú creación      | 10.6    |

</details>

<details>
<summary>Fase 9: Refactorización Visual Linear (Dic 2025)</summary>

| Componente/Feature                                                          | Estado |
| --------------------------------------------------------------------------- | ------ |
| SelectorIconoProyecto, CampoTituloLimpio, CampoSubtituloLimpio              | ✅      |
| PropiedadesCompactas, BotonOpcionCompacta, SeccionResponsables              | ✅      |
| ListaTareasCompacta, SeccionAdjuntos, GridAdjuntos                          | ✅      |
| FormularioTareaModerno + selectores pill (Estado, Proyecto, Repetición)     | ✅      |
| FormularioHabitoModerno + selectores pill (Importancia, Estado, Frecuencia) | ✅      |
| FormularioProyectoModerno + SelectorEstadoProyectoPill                      | ✅      |
| Sistema de Tags con autocompletado                                          | ✅      |
| Responsables vs Compartir diferenciados                                     | ✅      |
| Panel de Comentarios rediseñado (input fijo inferior)                       | ✅      |
| Estandarización de FilaPropiedades (Tareas, Hábitos, Proyectos)             | ✅      |
| Hooks: useAutoguardado, usePanelChat, PestanasModal                         | ✅      |

</details>

---


## Estado Actual

**Fecha de inicio:** 2025-12-19  
**Version:** v1.0.12-beta  
**Ultima actualizacion:** 2026-01-16  
**Estado:** Fase 10.8 COMPLETA - Queda pendiente 10.7 (APK) y 10.8.16 (Header dinámico)

## Funcionalidades Completadas

| Módulo              | Descripción                                                                   |
| ------------------- | ----------------------------------------------------------------------------- |
| **Infraestructura** | Arquitectura SOLID, CSS centralizado, TypeScript, Sincronización, Cifrado E2E |
| **Hábitos**         | CRUD, frecuencias, rachas, historial, mapa calor, posponer                    |
| **Tareas**          | CRUD inline, subtareas, Drag & Drop, prioridades, adjuntos, chat              |
| **Proyectos**       | Jerarquía 3 niveles, progreso, mapa calor, vista expandible                   |
| **Actividad**       | Mapa de calor, historial visual, cache, actualizaciones optimistas            |
| **Social**          | Equipos, compartir, notificaciones, mensajes                                  |
| **Freemium**        | Free/Premium, Trial 14 días, Stripe integrado                                 |
| **Seguridad**       | API REST WordPress, nonce CSRF, AES-256-GCM, HKDF-SHA256                      |
| **Admin**           | Gestión usuarios, filtros, estadísticas                                       |

---

## Reglas de Desarrollo **IMPORTANTE**

- **Zustand primero**: Al modificar o crear nuevas funcionalidades, aprovechar para refactorizar usando Zustand como fuente única de verdad del estado.
- **CSS centralizado**: Todos los estilos en archivos CSS, nunca inline, usar variables de variables.css.
- **SOLID**: Mantener componentes pequeños con responsabilidad única.
- **Refactorización progresiva**: Aprovechar cada cambio o mejora para refactorizar poco a poco el código donde sea necesario. Aplicar mejoras de mantenibilidad de forma incremental. Hacer TODO pequeños progresivamente.
- **Comentarios TODO**: Siempre dejar comentarios `// TODO:` de cosas que se pueden mejorar. Los TODO deben ser pequeños y progresivos, pueden ser simples o complejos, pero no deben romper el flujo actual. Sirven como recordatorio para futuras mejoras.

---

### Alta Prioridad

<details>
<summary>Fase 9: Refactorización Visual de Configuración (Estilo Linear) ✅ COMPLETADA</summary>

**Inspiración:** [Linear App Plan](https://linear.app/plan)  
**Enfoque:** Gestión moderna de proyectos, orientado al usuario individual con capacidad de trabajo en equipo.

#### Resumen de Logros

**Componentes Creados:**
- `SelectorIconoProyecto`, `CampoTituloLimpio`, `CampoSubtituloLimpio`
- `PropiedadesCompactas`, `BotonOpcionCompacta`, `SeccionResponsables`
- `ListaTareasCompacta`, `SeccionAdjuntos`, `GridAdjuntos`
- `FormularioTareaModerno`, `FormularioHabitoModerno`, `FormularioProyectoModerno`
- Selectores Pill: Estado, Proyecto, Repetición, Importancia, Frecuencia

**Hooks Creados:**
- `useAutoguardado`, `usePanelChat`, `PestanasModal`

**Mejoras Visuales:**
- Layout estilo Linear con propiedades inline compactas
- Modal de 600px responsive
- Sistema de Tags con autocompletado
- Responsables vs Compartir diferenciados
- Panel de Comentarios rediseñado

**Estilos CSS** en `configuracionModerna.css`:
- `.campoTituloLimpio`, `.pillOpcion`, `.botonOpcionCompacta`
- `.propiedadesCompactas`, `.seccionResponsables--inline`
- `.selectorIconoProyecto`, `.selectorColores`

#### Tareas Pendientes (Fase 9)

- [ ] **9.4** Adaptar `PanelConfiguracionTarea` con misma estructura completa
- [ ] **9.5** Adaptar `ModalHabito` con misma estructura completa
- [ ] **9.6** Sistema de Pestañas (Overview / Issues) para proyectos
- [ ] **9.7.9** Sistema de Temas Visuales (Original, Dark Mode, Light Mode)

</details>

---

<details>
<summary>Fase 9.7: Refinamientos Post-Fase 9 ✅ COMPLETADA</summary>

**Logros:**
- Ajustes visuales: botón eliminar, modal responsables, padding chat
- Bugs lógica: deshacer acción, subtareas heredan proyecto, modal cierre
- Organización propiedades en 3 filas con etiquetas
- Sistema de Tags con autocompletado
- Responsables vs Compartir diferenciados
- Panel de Comentarios rediseñado
- Mejoras visuales en Hábitos (separador, meses, descripción, icono)
- Estandarización de propiedades (Tareas, Hábitos, Proyectos)
- Fix: input comentarios fijo no cubre contenido

</details>

### 9.7.9 Sistema de Temas Visuales (Pendiente)

**Objetivo:** Permitir al usuario cambiar el tema visual del dashboard.

| Tema           | Descripción                                         |
| -------------- | --------------------------------------------------- |
| **Original**   | Tema actual (dark mode estilo terminal/minimalista) |
| **Dark Mode**  | Dark mode genérico más estándar                     |
| **Light Mode** | Tema claro para preferencias de día                 |

**Tareas:**
- [ ] Crear `ModalTemas.tsx` con selector visual
- [ ] Modificar `variables.css` para soportar múltiples temas
- [ ] Agregar opción al menú contextual del usuario
- [ ] Hook `useTema` para gestionar el estado

---

### Baja Prioridad

<details>
<summary>Mejoras menores</summary>

**Chat/Mensajes:**
- [x] Compactar mensajes (menos padding)
- [x] Verificar historial de cambios en chat de proyectos

**Hábitos:**
- [x] Animación de entrada/salida
- [x] Umbral de reseteo editable
- [x] Adaptar racha a frecuencia

**Tareas:**
- [x] Animación de arrastre más fluida
- [x] Soporte markdown en descripción

**Ordenamiento:**
- [x] Drag & drop manual para hábitos
- [x] Buscar hábitos por nombre

**Responsive/PWA:**
- [ ] Layout móvil adaptativo
- [ ] Service Worker offline
- [ ] Instalable en móvil

</details>

### Fases Futuras

<details>
<summary>Fase 10: Scratchpad + File Manager</summary>

**Scratchpad - Sistema de Guardado:**
- [ ] Botón "Guardar nota" en Scratchpad
- [ ] Notas guardadas con título y fecha
- [ ] Archivo de notas guardadas

**File Manager:**
- [ ] Vista tipo explorador de archivos
- [ ] Agrupación por proyecto/tarea/tipo
- [ ] Preview de archivos
- [ ] Subir archivos sin asociar a tarea

</details>

<details>
<summary>Fase 11: Compartir Hábitos</summary>

- [ ] Tabla `wp_glory_habitos_compartidos`
- [ ] Opción "Compartir hábito" en menú contextual
- [ ] Ver estado de cumplimiento del compañero
- [ ] Notificaciones de logros

</details>

<details>
<summary>Fase 12: Futuro</summary>

- [ ] Correo de invitación a usuarios no registrados
- [ ] Notificaciones por correo (resumen, alertas)
- [ ] Feed de red social (posts, likes, comentarios)
- [ ] Gamificación (badges, niveles, leaderboards)

</details>

### Pendientes de Cifrado Avanzado (Fase 4)

- [ ] Campo `cifrado_compartido: false` en elementos compartidos
- [ ] Separar datos cifrados de no cifrados en sincronización

---

## Resumen de Fases

| Fase  | Nombre                                   | Estado          |
| ----- | ---------------------------------------- | --------------- |
| 0-4   | Sistema Social                           | ✅ Completada    |
| 5-7   | Urgencia, Chat, UX                       | ✅ Completada    |
| 8     | Mapa de Calor + Historial + UX Dashboard | ✅ Completada    |
| 9     | Refactorización Visual (Estilo Linear)   | ✅ Completada    |
| 10    | Versión Móvil (PWA)                      | 🚧 EN PROGRESO   |
| 11    | Sistema de Notas Mejorado                | Media Prioridad |
| 12    | Gestión de Tiempo (Time Tracking)        | Baja Prioridad  |
| 13    | Pausar Hábitos                           | ✅ Completada    |
| 14    | Mejoras Configuración y UX               | 🌟 NUEVA         |
| Extra | Scratchpad + File Manager                | Baja Prioridad  |
| Extra | Compartir Hábitos                        | Baja Prioridad  |

