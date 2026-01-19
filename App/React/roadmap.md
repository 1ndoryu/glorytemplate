# ROADMAP: Plataforma Gestor CAP (WordPress + React Islands)

> **Última actualización:** 2026-01-18  
> **Estado:** ✅ Fase 8 completada - Inicio Fase 9 (Stripe)  
> **Arquitectura:** WordPress Backend + Glory React Islands

---

## 1. Visión General del Proyecto

### 1.1 Objetivo
Plataforma web que permite a las autoescuelas automatizar la creación de calendarios para el curso CAP (Certificado de Aptitud Profesional) de 35 horas.

### 1.2 Modelo de Negocio
- Suscripción mensual para administradores de autoescuelas
- Fase 1: Plan único estándar
- Futuro: Niveles Básico/Premium

### 1.3 Arquitectura Elegida

| Capa              | Tecnología               | Ventaja               |
| ----------------- | ------------------------ | --------------------- |
| **Frontend**      | React Islands (Glory)    | HMR, TypeScript, SSG  |
| **Estilos**       | CSS Vanilla + Variables  | Control total         |
| **Backend**       | WordPress REST API       | Ya configurado        |
| **Base de datos** | MySQL (tablas custom WP) | Sin config extra      |
| **Autenticación** | Sistema nativo WordPress | Login, roles, cookies |
| **Pagos**         | Stripe + WP              | Webhooks via REST     |
| **Emails**        | wp_mail()                | SMTP ya configurado   |

---

## 2. Stack Técnico Detallado

### 2.1 Frontend (React Islands)
```
App/React/
├── islands/
│   ├── cap/                    # Módulo principal
│   │   ├── CapAppIsland.tsx    # Isla principal (SPA-like)
│   │   ├── components/         # Componentes del módulo
│   │   ├── hooks/              # Lógica de estado
│   │   └── types/              # TypeScript interfaces
│   └── appIslands.tsx          # Registro de islas
```

### 2.2 Backend (WordPress)
```
App/
├── Services/
│   ├── CapService.php          # Lógica de negocio
│   ├── CalendarEngine.php      # Algoritmo de generación
│   └── StripeService.php       # Pagos
├── Models/
│   ├── Alumno.php              # CRUD alumnos
│   ├── Clase.php               # CRUD clases
│   └── Configuracion.php       # Settings del centro
├── Api/
│   └── CapEndpoints.php        # REST API endpoints
└── Database/
    └── CapSchema.php           # Creación de tablas
```

### 2.3 Tablas de Base de Datos (MySQL)

| Tabla                   | Descripción                  |
| ----------------------- | ---------------------------- |
| `wp_cap_centros`        | Datos del centro/autoescuela |
| `wp_cap_alumnos`        | Alumnos registrados          |
| `wp_cap_disponibilidad` | Matriz horaria por alumno    |
| `wp_cap_clases`         | Slots del calendario         |
| `wp_cap_asistencia`     | Relación alumno-clase        |
| `wp_cap_configuracion`  | Settings por centro          |
| `wp_cap_suscripciones`  | Estado de pago Stripe        |

> **Nota:** Usamos prefijo `wp_cap_` y campo `user_id` para vincular con `wp_users`.

---

## 3. Fases de Desarrollo (Revisadas)

### Correcciones Pendientes (Hotfixes)

> **Bugs y mejoras menores detectadas durante el desarrollo.**

- [x] **H.1** Corregir Input: icono superpuesto al placeholder
  - [x] H.1.1 El icono izquierdo se superpone al texto del placeholder
  - [x] H.1.2 Causa: `login.css` sobrescribe el padding del input base
  - [x] H.1.3 Solución: Eliminar sobrescritura en `login.css`

- [x] **H.2** Página de inicio sin contenido
  - [x] H.2.1 La URL raíz `/` no muestra nada relacionado al módulo CAP
  - [x] H.2.2 Implementar redirección inteligente:
    - Si logueado con rol `cap_admin` → `/cap-dashboard/`
    - Si no logueado → `/cap-login/`

- [x] **H.3** Centralizar iconos SVG
  - [x] H.3.1 Iconos duplicados en `CapLoginIsland`, `CapRegistroIsland`, `CapDashboardIsland`
  - [x] H.3.2 Crear `components/icons/index.tsx` con todos los iconos exportados
  - [x] H.3.3 Refactorizar los 3 componentes para usar iconos centralizados

- [~] **H.4** Errores en API de configuración *(parcialmente resuelto)*
  - [x] H.4.1 Al cargar aparece brevemente "Error al cargar configuración"
  - [x] H.4.2 Al guardar aparece "Error al guardar datos del centro"
  - [x] H.4.3 Causa inicial: faltaba nonce en headers
  - [x] H.4.4 Fix aplicado: inyectar nonce en window.wpApiSettings desde CapDashboardIsland
  - [x] H.4.5 Fix: errores solucionados en sistema centralizado de errores

- [x] **H.5** Espaciado en botones con icono
  - [x] H.5.1 El icono y texto están pegados (sin gap)
  - [x] H.5.2 Añadido gap y estilos para SVGs inline en `.capBoton__texto`
  - [x] H.5.3 Afecta a todos los botones que usan children con iconos inline

- [x] **H.6** Estado de carga compartido entre paneles
  - [x] H.6.1 Al guardar un panel, todos los botones muestran spinner
  - [x] H.6.2 Causa: `guardando` era un solo estado en `useConfiguracion`
  - [x] H.6.3 Solución: estados independientes (`guardandoCentro`, `guardandoHorarios`)

- [x] **H.7** API REST endpoints devuelven 404
  - [x] H.7.1 Endpoints `/wp-json/cap/v1/config` y `/wp-json/cap/v1/alumnos` devuelven 404 (en realidad 401)
  - [x] H.7.2 Se creó `App/init-cap-api.php` para registrar endpoints en `rest_api_init`
  - [x] H.7.3 **Primera causa:** Namespace `Glory\App\` no estaba en Composer autoload
    - Fix: Agregado `"Glory\\App\\": "App/"` al PSR-4 en `composer.json`
  - [x] H.7.4 **Segunda causa:** Nonce inyectado en useEffect (asíncrono) causaba race condition
    - Fix: Inyección síncrona del nonce en `CapDashboardIsland.tsx`
  - [x] H.7.5 **Tercera causa (raíz):** Usuario administrator sin centro asociado en `wp_cap_centros`
    - El usuario nunca pasó por `/cap-registro/` que crea el centro
    - Fix: `CapService::getCentroIdActual()` ahora crea centro automáticamente para usuarios con rol válido

- [x] **H.8** Clases demo muestran "Sin asignar" en asignatura
  - [x] H.8.1 El seeder crea clases con códigos como `'racionalizacion'`, `'seguridad_vial'`
  - [x] H.8.2 El componente `TarjetaClase.tsx` no reconoce estos códigos
  - [x] H.8.3 Causa: El mapeo de código → nombre de asignatura difiere entre seeder y constantes
  - [x] H.8.4 Solución: Añadido `CODIGOS_ALIAS` en `cap-constants.ts` para mapear códigos snake_case
  - [x] H.8.5 `TarjetaClase.tsx` ahora usa `getAsignaturaPorCodigo()` cuando recibe un string

- [x] **H.9** Mensajes de error explicativos para el usuario
  - [x] H.9.1 Actualmente los errores muestran mensajes genéricos (resuelto)
  - [x] H.9.2 Implementar mensajes descriptivos que expliquen la causa del problema
  - [x] H.9.3 Ejemplos implementados:
    - "No se puede mover: la clase está bloqueada. Desbloquéala primero"
    - "Error de conexión: verifica tu internet"
    - "Centro no encontrado: contacta con soporte"
  - [x] H.9.4 Creado sistema centralizado en `cap-errores.ts`
  - [x] H.9.5 Preparado para internacionalización futura (estructura modular)

- [x] **H.10** Modal de editar alumno no funciona
  - [x] H.10.1 Al hacer click en "Editar" no pasa nada
  - [x] H.10.2 Revisar handler `onEditar` en `SeccionAlumnos.tsx`
  - [x] H.10.3 Fix: `FormularioAlumno` pasaba props `visible/ancho` a `Modal` que esperaba `abierto/tamano`

- [x] **H.11** Modal de nuevo alumno no funciona
  - [x] H.11.1 El formulario de crear alumno no se abre o no funciona
  - [x] H.11.2 Fix: Idéntico a H.10, corrección de props en `FormularioAlumno.tsx`

- [x] **H.12** Endpoint de disponibilidad devuelve HTML en vez de JSON
  - [x] H.12.1 Error: `Unexpected token '<', "<div id="e"... is not valid JSON`
  - [x] H.12.2 Causa: Esquema de BD incorrecto (rangos vs slots) causaba error SQL
  - [x] H.12.3 Fix: Actualizado `CapSchema.php` con estructura correcta y bump versión DB
  - [x] H.12.4 Tablas se actualizan automáticamente al recargar (v1.0.1)

- [x] **H.13** Warning de key prop en MatrizDisponibilidad
  - [x] H.13.1 Warning: `Each child in a list should have a unique "key" prop`
  - [x] H.13.2 Fix: Reemplazado Fragment corto `<>` por `<Fragment key={...}>` en loop
  - [x] H.13.3 Agregado `Fragment` a imports

- [x] **H.14** Estilos rotos en SeccionReportes
  - [x] H.14.1 Los select y botones no se ven correctamente
  - [x] H.14.2 La nota "Los reportes se generan en formato PDF" no tiene fondo visible
  - [x] H.14.3 Causa: Variables CSS (`--cap-fondo-secundario`, etc.) faltaban en `variables.css`
  - [x] H.14.4 Fix: Agregados aliases de compatibilidad en `variables.css`

---

### Fase 0: Infraestructura Base
- [x] **0.1** Estructura del proyecto
  - [x] 0.1.1 Crear estructura de carpetas en `App/React/islands/cap/`
  - [x] 0.1.2 Crear estructura PHP en `App/Services/`, `App/Models/`, `App/Api/`

- [x] **0.2** Sistema de diseño base
  - [x] 0.2.1 Crear `cap-variables.css` (colores, espaciados, tipografía)
  - [x] 0.2.2 Crear `cap-base.css` (estilos base del módulo)
  - [x] 0.2.3 Definir paleta de colores (azul profesional)
  - [x] 0.2.4 Configurar tipografía (Inter/Outfit via Google Fonts)

- [x] **0.3** Componentes UI base
  - [x] 0.3.1 `Boton.tsx` (primario, secundario, peligro, ghost)
  - [x] 0.3.2 `Input.tsx` (texto, email, password, number)
  - [x] 0.3.3 `Tarjeta.tsx` (contenedor con sombra)
  - [x] 0.3.4 `Modal.tsx` (overlay + contenido)
  - [x] 0.3.5 `Alerta.tsx` (info, éxito, advertencia, error)
  - [x] 0.3.6 `Spinner.tsx` (indicador de carga)
  - [x] 0.3.7 `Badge.tsx` (etiquetas de estado)

- [x] **0.4** Base de datos
  - [x] 0.4.1 Crear `CapSchema.php` con todas las tablas
  - [x] 0.4.2 Hook de activación para crear tablas (`CapBootstrap.php`)
  - [x] 0.4.3 Sistema de versionado para migraciones (`CapBootstrap::verificarActualizacion`)

---

### Fase 1: Acceso y Autenticación (Simplificada)

> **Aprovechamos WordPress:** No creamos login propio, usamos el nativo.

- [x] **1.1** Página de acceso
  - [x] 1.1.1 Isla `CapLoginIsland.tsx` (formulario estilizado)
  - [x] 1.1.2 Formulario que hace POST a `wp-login.php`
  - [x] 1.1.3 Opcionalmente: login via REST API + nonce
  - [x] 1.1.4 Redirección post-login a `/cap-dashboard/`

- [x] **1.2** Registro de usuarios
  - [x] 1.2.1 Formulario de registro (usa `wp_create_user()`)
  - [x] 1.2.2 Rol custom `cap_admin` para administradores de autoescuelas
  - [x] 1.2.3 Email de verificación (opcional, usa `wp_mail()`)

- [x] **1.3** Protección de rutas
  - [x] 1.3.1 En `pages.php`: restringir acceso por rol
  ```php
  PageManager::reactPage('cap-dashboard', 'CapDashboardIsland', [], ['cap_admin']);
  ```
  - [x] 1.3.2 Redirección a login si no autenticado
  - [x] 1.3.3 Verificación de suscripción activa

- [x] **1.4** Contexto de usuario en React
  - [x] 1.4.1 Pasar datos del usuario via props desde PHP
  ```php
  PageManager::reactPage('cap-dashboard', 'CapDashboardIsland', function($pageId) {
      return [
          'user' => [
              'id' => get_current_user_id(),
              'name' => wp_get_current_user()->display_name,
              'email' => wp_get_current_user()->user_email,
          ],
          'restNonce' => wp_create_nonce('wp_rest'),
      ];
  });
  ```


---

### Fase 2: Layout Principal (Dashboard)

- [x] **2.1** Estructura del Layout
  - [x] 2.1.1 `CapLayout.tsx` - Wrapper con sidebar + área principal
  - [x] 2.1.2 Sidebar con navegación (referencia: `ejemplo.jsx` líneas 264-300)
  - [x] 2.1.3 Versión mobile (sidebar colapsable)
  - [x] 2.1.4 Transiciones suaves entre secciones

- [x] **2.2** Navegación interna (sin cambio de página)
  - [x] 2.2.1 Estado `activeSection` con Zustand (`stores/useDashboardStore.ts`)
  - [x] 2.2.2 Tab "Calendario" (icono + label)
  - [x] 2.2.3 Tab "Alumnos" (icono + label)
  - [x] 2.2.4 Tab "Configuración" (icono + label)
  - [x] 2.2.5 Botón "Cerrar Sesión" (enlace a `wp-login.php?action=logout`)

- [x] **2.3** Header contextual
  - [x] 2.3.1 Título de sección actual
  - [x] 2.3.2 Badge de suscripción (activa/expirada)
  - [ ] 2.3.3 Acciones rápidas contextuales (pendiente: se implementará por sección)

---

### Fase 3: Módulo de Configuración

- [x] **3.1** Panel de configuración general
  - [x] 3.1.1 Nombre del centro/autoescuela
  - [x] 3.1.2 Datos de contacto (dirección, teléfono, email)
  - [ ] 3.1.3 Logo (upload via WP Media) - Pendiente integración con WP Media Library

- [x] **3.2** Configuración de horarios
  - [x] 3.2.1 Horario de mañana (hora inicio/fin)
  - [x] 3.2.2 Horario de tarde (hora inicio/fin)
  - [x] 3.2.3 Horario especial viernes (toggle + hora fin)
  - [x] 3.2.4 Duración de descansos

- [x] **3.3** Reglas de capacidad
  - [x] 3.3.1 Input para alumnos máximos por clase
  - [x] 3.3.2 Texto informativo sobre alertas de exceso
  - [x] 3.3.3 Duración de clase configurable

- [x] **3.4** Panel de suscripción
  - [x] 3.4.1 Mostrar plan activo
  - [x] 3.4.2 Fecha de próxima facturación
  - [x] 3.4.3 Botón "Gestionar Pagos" (deshabilitado hasta integrar Stripe)
  - [x] 3.4.4 Estado de suscripción desde `wp_cap_suscripciones`
  - [x] 3.4.5 Barra de progreso para período de prueba

- [x] **3.5** API REST para configuración
  - [x] 3.5.1 `GET /wp-json/cap/v1/config` - Obtener config + centro + suscripción
  - [x] 3.5.2 `POST /wp-json/cap/v1/config` - Guardar config
  - [x] 3.5.3 Validación de permisos (cap_admin o administrator)

- [x] **3.6** Hook de estado `useConfiguracion`
  - [x] 3.6.1 Gestión de estado local con useState
  - [x] 3.6.2 Llamadas a API con fetch
  - [x] 3.6.3 Feedback de éxito/error con auto-dismiss

---

### Fase 4: Gestión de Alumnos


- [x] **4.1** Lista de alumnos
  - [x] 4.1.1 Componente `TablaAlumnos.tsx`
  - [x] 4.1.2 Columnas: Nombre, Progreso, Estado
  - [x] 4.1.3 Ordenación por columnas
  - [x] 4.1.4 Búsqueda/filtrado
  - [x] 4.1.5 Paginación

- [x] **4.2** CRUD de alumnos
  - [x] 4.2.1 Modal `FormularioAlumno.tsx`
  - [x] 4.2.2 Campos: nombre, email, teléfono, DNI
  - [x] 4.2.3 Validación frontend
  - [x] 4.2.4 Endpoints REST: (ya existían en backend)
    - `GET /wp-json/cap/v1/alumnos`
    - `POST /wp-json/cap/v1/alumnos`
    - `PUT /wp-json/cap/v1/alumnos/{id}`
    - `DELETE /wp-json/cap/v1/alumnos/{id}`

- [x] **4.3** Matriz de disponibilidad
  - [x] 4.3.1 Componente `MatrizDisponibilidad.tsx`
  - [x] 4.3.2 Grid de días × horas
  - [x] 4.3.3 Selección flexible (click individual, fila, columna)
  - [x] 4.3.4 Guardado manual con feedback (botón guardar)

- [x] **4.4** Progreso del alumno
  - [x] 4.4.1 Barra de progreso visual (X/35h)
  - [x] 4.4.2 Desglose por asignatura (modal detalle con barras por cada asignatura)
  - [x] 4.4.3 Estados: `ok`, `warning`, `completed`

---

### Fase 5: Motor de Calendario (Core)

- [x] **5.1** Vista del calendario semanal
  - [x] 5.1.1 Componente `CalendarioSemanal.tsx`
  - [x] 5.1.2 Grid de 5 columnas (Lunes-Viernes)
  - [x] 5.1.3 Navegación entre semanas
  - [x] 5.1.4 Indicador de semana actual

- [x] **5.2** Tarjeta de clase
  - [x] 5.2.1 Componente `TarjetaClase.tsx`
  - [x] 5.2.2 Mostrar: asignatura, hora, alumnos
  - [x] 5.2.3 Indicador de bloqueo (candado)
  - [x] 5.2.4 Estados visuales: bloqueada vs libre

- [x] **5.3** Reglas legales del CAP (inmutables)
  - [x] 5.3.1 Constantes en `cap-constants.ts`
  - [x] 5.3.2 Validar: 35 horas totales
  - [x] 5.3.3 Validar: mínimo 4 días
  - [x] 5.3.4 Validar: máximo 9h/día/alumno
  - [x] 5.3.5 Descansos obligatorios (6h→30min, 9h→45min)

- [x] **5.4** Asignaturas del CAP
  - [x] 5.4.1 Definir las 8 asignaturas
  - [x] 5.4.2 Duración de cada una
  - [x] 5.4.3 Colores por asignatura

- [x] **5.5** Sistema de bloqueo de clases
  - [x] 5.5.1 Toggle de bloqueo por clase
  - [x] 5.5.2 Clases bloqueadas no se regeneran
  - [x] 5.5.3 Estilo visual diferenciado (fondo rojo)

- [x] **5.6** Barra de acciones
  - [x] 5.6.1 Botón "Deshacer"
  - [x] 5.6.2 Botón "Reportes"
  - [x] 5.6.3 Botón "Generar"

---

### Fase 6: Algoritmo de Generación

- [x] **6.1** Motor de generación (PHP)
  - [x] 6.1.1 Clase `CalendarEngine.php`
  - [x] 6.1.2 Cruzar: disponibilidad + reglas CAP + capacidad
  - [x] 6.1.3 Respetar clases bloqueadas
  - [x] 6.1.4 Distribución óptima de asignaturas
  - [x] 6.1.5 Endpoint: `POST /wp-json/cap/v1/generar`

- [x] **6.2** Detección de conflictos de aforo
  - [x] 6.2.1 Comparar demanda vs capacidad
  - [x] 6.2.2 Identificar slots conflictivos
  - [x] 6.2.3 Retornar lista de conflictos

- [x] **6.3** Modal de exceso de aforo
  - [x] 6.3.1 Componente `ModalConflictoAforo.tsx`
  - [x] 6.3.2 Info del conflicto (día, hora, demanda, capacidad)
  - [x] 6.3.3 Checkboxes para seleccionar alumnos
  - [x] 6.3.4 Confirmar y continuar generación

- [x] **6.4** Estado de generación
  - [x] 6.4.1 Indicador "Calculando..." (via `generando` state)
  - [x] 6.4.2 Feedback de éxito/error

---

### Fase 7: Edición Interactiva del Calendario

- [x] **7.1** Drag & Drop de clases
  - [x] 7.1.1 Librería: `@dnd-kit/core`
  - [x] 7.1.2 Validación en tiempo real
  - [x] 7.1.3 Feedback visual durante arrastre

- [x] **7.2** Historial de cambios (Undo)
  - [x] 7.2.1 Hook `useHistorial.ts`
  - [x] 7.2.2 Guardar snapshot antes de cada cambio
  - [x] 7.2.3 Límite de snapshots en memoria (máx 20)

- [x] **7.3** Edición inline
  - [x] 7.3.1 Click en clase para abrir modal de edición
  - [x] 7.3.2 Cambiar hora/asignatura (con validación de bloqueo)
  - [x] 7.3.3 Ver alumnos asignados con progreso
  - [x] 7.3.4 Endpoint `PUT /clases/{id}` para actualizar

---

### Fase 8: Módulo de Reportes

- [x] **8.1** Generación de PDF
  - [x] 8.1.1 Librería PHP: `dompdf` instalada
  - [x] 8.1.2 Endpoint: `GET /wp-json/cap/v1/reportes/{tipo}`
  - [x] 8.1.3 Tipos: `plan-alumno`, `control-horas`
  - [x] 8.1.4 Servicio `ReporteService.php` con estilos profesionales

- [x] **8.2** Interfaz de descarga
  - [x] 8.2.1 Selector de tipo de reporte (tarjetas)
  - [x] 8.2.2 Selector de semana/alumno
  - [x] 8.2.3 Botón de descarga con feedback de carga
  - [x] 8.2.4 Componente `SeccionReportes.tsx`
  - [x] 8.2.5 Hook `useReportes.ts`
  - [x] 8.2.6 Navegación desde sidebar

---

### Fase 9: Pasarela de Pago (Stripe)

- [ ] **9.1** Configuración de Stripe
  - [ ] 9.1.1 Clase `StripeService.php`
  - [ ] 9.1.2 Keys en `wp-config.php` o opciones
  - [ ] 9.1.3 Productos y precios en Stripe Dashboard

- [ ] **9.2** Flujo de suscripción
  - [ ] 9.2.1 Checkout de Stripe al registrarse
  - [ ] 9.2.2 Webhook: `POST /wp-json/cap/v1/stripe-webhook`
  - [ ] 9.2.3 Activación de cuenta tras pago

- [ ] **9.3** Gestión de suscripción
  - [ ] 9.3.1 Enlace a Stripe Customer Portal
  - [ ] 9.3.2 Actualizar estado en `wp_cap_suscripciones`

- [ ] **9.4** Manejo de estados
  - [ ] 9.4.1 Activa → acceso completo
  - [ ] 9.4.2 Expirada → acceso limitado + banner
  - [ ] 9.4.3 Pago fallido → gracia de 3 días

---

### Fase 10: Testing y QA

- [ ] **10.1** Tests manuales
  - [ ] 10.1.1 Flujo completo de usuario
  - [ ] 10.1.2 Edge cases del algoritmo
  - [ ] 10.1.3 Responsividad mobile

- [ ] **10.2** Tests automatizados (opcional)
  - [ ] 10.2.1 Tests unitarios del algoritmo PHP
  - [ ] 10.2.2 Tests de componentes React

- [x] **10.3** Datos de ejemplo (Seeding/Demo)
  > **Propósito:** Facilitar testing y demos comerciales con datos realistas.
  
  - [x] 10.3.1 Clase `CapSeeder.php` en `App/Database/`
    - [x] Método `seedAll()` para poblar todo
    - [x] Método `cleanAll()` para limpiar datos demo
    - [x] Identificación por email @ejemplo.com en vez de flag separado
  
  - [x] 10.3.2 Usuarios de ejemplo
    - [x] 12 alumnos de ejemplo con nombres realistas españoles
    - [x] Disponibilidades variadas (mañana, tarde, mixto, completo)
    - [x] Diferentes estados de progreso (0h, 8h, 15h, 25h, 35h completado)
  
  - [x] 10.3.3 Clases de ejemplo
    - [x] Semana actual con clases distribuidas (mañana y tarde)
    - [x] Algunas clases bloqueadas vs libres
    - [x] Variedad de asignaturas CAP (8 asignaturas rotativas)
    - [x] Asistencias asignadas según disponibilidad
  
  - [x] 10.3.4 Panel de control demo (UI)
    - [x] Componente `PanelDemo.tsx` en configuración
    - [x] Botón "Poblar datos de ejemplo"
    - [x] Botón "Limpiar datos de ejemplo" (con confirmación)
    - [x] Indicador visual cuando hay datos demo activos (Badge)
    - [x] Estadísticas de alumnos y clases demo
  
  - [x] 10.3.5 API endpoints para seeding
    - [x] `POST /wp-json/cap/v1/demo/seed` - Poblar datos
    - [x] `DELETE /wp-json/cap/v1/demo/clean` - Limpiar datos
    - [x] `GET /wp-json/cap/v1/demo/status` - Estado actual (activo/inactivo)
    - [x] Permiso requerido: `administrator` únicamente
  
  - [x] 10.3.6 Seguridad del modo demo
    - [x] Solo accesible en entornos de desarrollo (`WP_DEBUG`)
    - [x] O con constante explícita `CAP_ALLOW_DEMO_MODE`
    - [x] Logging de acciones de seeding (error_log)
    - [x] No disponible en producción por defecto


---

### Fase 11: Despliegue

- [ ] **11.1** Build de producción
  - [ ] 11.1.1 `npm run build`
  - [ ] 11.1.2 Verificar archivos generados

- [ ] **11.2** Deploy a hosting WordPress
  - [ ] 11.2.1 Subir tema actualizado
  - [ ] 11.2.2 Ejecutar migraciones de BD
  - [ ] 11.2.3 Configurar Stripe en producción

---

## 4. Prioridad de Desarrollo (MVP)

| Prioridad | Fase | Descripción             | Días Est. |
| --------- | ---- | ----------------------- | --------- |
| 🔴 Alta    | 0    | Infraestructura base    | 2-3       |
| 🔴 Alta    | 1    | Acceso (simplificado)   | 1-2       |
| 🔴 Alta    | 2    | Layout principal        | 2-3       |
| 🔴 Alta    | 4    | Gestión de alumnos      | 4-5       |
| 🔴 Alta    | 5    | Vista del calendario    | 3-4       |
| 🔴 Alta    | 6    | Algoritmo de generación | 5-7       |
| 🟡 Media   | 10.3 | Datos de ejemplo (Demo) | 2-3       |
| 🟡 Media   | 3    | Configuración           | 2-3       |
| 🟡 Media   | 7    | Edición interactiva     | 3-4       |
| 🟡 Media   | 9    | Stripe                  | 3-4       |
| 🟢 Baja    | 8    | Reportes PDF            | 2-3       |

**Total estimado MVP:** 30-40 días (vs 60-80 sin WordPress)

---

## 5. Dependencias Entre Fases

```
Fase 0 (Infraestructura)
    ↓
Fase 1 (Acceso) ────────→ Fase 9 (Stripe)
    ↓
Fase 2 (Layout)
    ↓
┌───┴───┐
↓       ↓
Fase 3  Fase 4 (Alumnos)
(Config)    ↓
    ↓   Fase 5 (Calendario)
    ↓       ↓
    └───────┴───→ Fase 6 (Algoritmo)
                      ↓
                  Fase 7 (Edición)
                      ↓
                  Fase 8 (Reportes)
```

---

## 6. URLs del Sistema

| Página              | Slug              | Isla React           |
| ------------------- | ----------------- | -------------------- |
| Login estilizado    | `/cap-login/`     | `CapLoginIsland`     |
| Dashboard principal | `/cap-dashboard/` | `CapDashboardIsland` |
| Registro            | `/cap-registro/`  | `CapRegistroIsland`  |

> Todas se registran en `App/Config/pages.php`

---

## 7. Endpoints REST API

| Método | Endpoint                                    | Descripción              |
| ------ | ------------------------------------------- | ------------------------ |
| GET    | `/wp-json/cap/v1/config`                    | Configuración del centro |
| POST   | `/wp-json/cap/v1/config`                    | Guardar configuración    |
| GET    | `/wp-json/cap/v1/alumnos`                   | Lista de alumnos         |
| POST   | `/wp-json/cap/v1/alumnos`                   | Crear alumno             |
| PUT    | `/wp-json/cap/v1/alumnos/{id}`              | Editar alumno            |
| DELETE | `/wp-json/cap/v1/alumnos/{id}`              | Eliminar alumno          |
| GET    | `/wp-json/cap/v1/disponibilidad/{alumnoId}` | Disponibilidad de alumno |
| POST   | `/wp-json/cap/v1/disponibilidad/{alumnoId}` | Guardar disponibilidad   |
| GET    | `/wp-json/cap/v1/clases`                    | Clases de la semana      |
| POST   | `/wp-json/cap/v1/generar`                   | Ejecutar algoritmo       |
| GET    | `/wp-json/cap/v1/reportes/{tipo}`           | Generar PDF              |
| POST   | `/wp-json/cap/v1/stripe-webhook`            | Webhook de Stripe        |
| POST   | `/wp-json/cap/v1/demo/seed`                 | Poblar datos de ejemplo  |
| DELETE | `/wp-json/cap/v1/demo/clean`                | Limpiar datos de ejemplo |
| GET    | `/wp-json/cap/v1/demo/status`               | Estado del modo demo     |

---

## 8. Referencias Visuales

El archivo `ejemplo.jsx` contiene el prototipo funcional:
- Pantalla de login (líneas 72-101)
- Layout con sidebar (líneas 264-300)
- Vista del calendario (líneas 170-224)
- Tarjeta de clase con bloqueo (líneas 142-168)
- Modal de exceso de aforo (líneas 106-140)
- Panel de configuración (líneas 226-256)
- Tabla de alumnos (líneas 306-330)

---

## 9. Ventajas de usar WordPress

| Aspecto          | Ahorro       |
| ---------------- | ------------ |
| Login/Registro   | ~5 días      |
| Sistema de roles | ~2 días      |
| API REST         | ~7 días      |
| Emails           | ~1 día       |
| Hosting/Deploy   | ~3 días      |
| **Total ahorro** | **~18 días** |

---

> **Siguiente paso:** Iniciar con la **Fase 0.1** creando la estructura de carpetas.
