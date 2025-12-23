# Dashboard de Productividad Personal - Roadmap

Sistema de seguimiento de hábitos, tareas y notas rápidas con diseño estilo terminal minimalista.

---

## Estado Actual

**Fecha de inicio:** 2025-12-19  
**Version:** v1.0.2-beta  
**Ultima actualizacion:** 2025-12-23
**Estado:** Sistema Social Completado - Refactorización Pendiente

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

### Fase 5: Refactorización de Archivos Grandes [BLOQUEANTE]

**Objetivo:** Reducir archivos que exceden los límites de líneas establecidos para mantener SOLID.

> **Límites recordatorio:**
> - Componente/Servicio: 300 líneas máximo
> - Hook: 120 líneas máximo
> - CSS: 300 líneas máximo

#### 5.1 Archivos Críticos (>400 líneas) - Prioridad Alta

| Archivo                              | Líneas | Acción Propuesta                            |
| ------------------------------------ | ------ | ------------------------------------------- |
| `Repository/DashboardRepository.php` | 864    | Dividir en repositorios por dominio         |
| `Api/DashboardApiController.php`     | 682    | Separar endpoints por entidad               |
| `islands/DashboardIsland.tsx`        | 668    | Extraer lógica a hooks, dividir secciones   |
| `styles/compartidos.css`             | 631    | Dividir por componente                      |
| `Services/AdjuntosService.php`       | 629    | Separar cifrado de gestión de archivos      |
| `styles/tareas.css`                  | 589    | Dividir por subcomponente                   |
| `Services/CompartidosService.php`    | 560    | Separar queries de lógica                   |
| `types/dashboard.ts`                 | 525    | Dividir por dominio (tareas, equipos, etc.) |
| `Services/NotificacionesService.php` | 483    | Separar tipos de notificación               |
| `styles/tabla.css`                   | 477    | Dividir por sección                         |
| `Services/EquiposService.php`        | 441    | Separar solicitudes de relaciones           |
| `hooks/useDashboard.ts`              | 439    | Extraer a múltiples hooks especializados    |
| `styles/encabezado.css`              | 410    | Dividir iconos/badges de layout             |
| `hooks/useConfiguracionLayout.ts`    | 407    | Simplificar, extraer helpers                |

#### 5.2 Archivos Moderados (300-400 líneas) - Prioridad Media

| Archivo                           | Líneas | Acción Propuesta                |
| --------------------------------- | ------ | ------------------------------- |
| `styles/panelAdministracion.css`  | 408    | Dividir secciones               |
| `styles/suscripcion.css`          | 396    | Dividir modal/indicadores       |
| `components/SeccionAdjuntos.tsx`  | 389    | Extraer subcomponentes          |
| `styles/equipos.css`              | 383    | Dividir por componente          |
| `Api/AdjuntosApiController.php`   | 354    | Separar upload/download         |
| `components/ListaTareas.tsx`      | 350    | Extraer lógica a hook           |
| `Services/AdminService.php`       | 347    | Separar estadísticas de gestión |
| `styles/detalleUsuario.css`       | 332    | Dividir secciones               |
| `Api/AdminApiController.php`      | 310    | Separar por responsabilidad     |
| `Services/SuscripcionService.php` | 306    | Separar Stripe de lógica local  |
| `styles/adjuntos.css`             | 302    | Dividir lista/preview           |

#### 5.3 Estrategia de Refactorización

1. **No romper funcionalidad:** Cada refactor debe ser atómico y verificable
2. **Orden de prioridad:** Empezar por PHP backend (más estable), luego TSX, finalmente CSS
3. **Testing manual:** Después de cada división, verificar que todo funciona
4. **Commits pequeños:** Un archivo por commit para facilitar rollback

**Estado:** Pendiente - Bloqueante para nuevas funcionalidades

---

### Fase 6: Compartir Hábitos [POSPUESTA]

**Objetivo:** Motivación social al compartir hábitos con compañeros.

> **Razón de posponer:** Esta funcionalidad no es crítica para el MVP. Se implementará después de la refactorización y estabilización del sistema actual.

#### 6.1 Modelo de Hábitos Compartidos
> Cada persona tiene su propia instancia. Racha y cumplimiento son individuales.
> Solo comparten "el mismo hábito" para verse mutuamente.

- [ ] Tabla BD: `wp_glory_habitos_compartidos` (habito_id, usuario_origen, usuario_destino)
- [ ] Al compartir: se crea copia del hábito en cuenta del compañero
- [ ] Campo `habito_origen_id` para vincular ambas instancias
- [ ] Cada usuario cumple su hábito independientemente

#### 6.2 UI de Hábitos Compartidos
- [ ] Opción en menú contextual: "Compartir hábito"
- [ ] Indicador visual: "Compartido con [Nombre]"
- [ ] Ver cuándo el compañero cumplió (badge o indicador)
- [ ] Notificación: "[Nombre] cumplió [Hábito] hoy"

#### 6.3 Sincronización de Estado
- [ ] Endpoint para consultar estado de hábito del compañero
- [ ] Cache local para no sobrecargar
- [ ] Actualización periódica o al abrir panel

**Complejidad:** Media | **Dependencias:** Fase 2 (equipos), Fase 3 (notificaciones)

---

### Fase 7: Modal Expandido con Chat e Historial

**Objetivo:** Comunicación y trazabilidad en tareas/proyectos/hábitos compartidos.

#### 7.1 Nuevo Diseño del Modal de Tarea
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

#### 7.2 Sistema de Chat por Elemento
- [ ] Tabla BD: `wp_glory_mensajes` (id, tipo, elemento_id, usuario_id, contenido, fecha)
- [ ] Tipos: `tarea`, `proyecto`, `habito`
- [ ] Cada tarea/proyecto/hábito tiene su propia conversación
- [ ] Input de mensaje con soporte para adjuntos
- [ ] Mensajes ordenados cronológicamente
- [ ] Scroll automático al nuevo mensaje
- [ ] Notificación a participantes al enviar mensaje

#### 7.3 Historial de Cambios (Audit Log)
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

#### 7.4 UI del Modal Expandido
- [ ] Componente `ModalTareaExpandido` con 2 columnas
- [ ] Toggle para expandir/colapsar columna derecha
- [ ] Por defecto: modal expandido (2 columnas)
- [ ] Scroll independiente por columna
- [ ] Responsive: en móvil, pestañas en lugar de columnas

#### 7.5 Aplicar a Proyectos y Hábitos
- [ ] Modal de proyecto con chat + historial
- [ ] Modal de hábito (solo si está compartido)
- [ ] Componente `PanelChatHistorial` reutilizable

**Complejidad:** Muy Alta | **Dependencias:** Fase 2, 3, 4 (requiere sistema social completo)

---

### Fase 8: Futuro (Post v1.1.0)

#### 8.1 Correo de Invitación
- [ ] Enviar email cuando se invita a usuario no registrado
- [ ] Template de correo personalizado
- [ ] Link de registro con solicitud pre-aceptada

#### 8.2 Notificaciones por Correo
- [ ] Preferencias de notificación por email
- [ ] Resumen diario/semanal
- [ ] Alertas de tareas por vencer
- [ ] Alerta de racha en peligro

#### 8.3 Feed de Red Social
- [ ] Posts automáticos de logros
- [ ] Posts manuales
- [ ] Likes y comentarios
- [ ] Privacidad configurable

#### 8.4 Gamificación
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
| 4    | Compartir Tareas/Proyectos     | Muy Alta    | ✅ Completada |
| 5    | Refactorización                | Alta        | ⏳ Bloqueante |
| 6    | Compartir Hábitos              | Media       | Pospuesta    |
| 7    | Modal Chat + Historial         | Muy Alta    | Pendiente    |
| 8    | Futuro                         | Variable    | Pendiente    |

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
