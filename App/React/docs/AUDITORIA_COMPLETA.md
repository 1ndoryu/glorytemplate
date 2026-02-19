# AUDITORÍA COMPLETA — Plataforma CAP

> **Fecha:** 2026-02-19  
> **Agente:** AG-AUD  
> **Scope:** Todo el código en `App/` (PHP backend + React frontend)  
> **Archivos analizados:** 19 PHP + 65+ TSX/TS

---

## RESUMEN EJECUTIVO

| Categoría | Críticos | Altos | Medios | Bajos |
|---|---|---|---|---|
| Seguridad | 3 | 4 | 3 | 2 |
| Rendimiento | 1 | 3 | 2 | 0 |
| SOLID / Arquitectura | 2 | 6 | 4 | 3 |
| Calidad de Código | 1 | 3 | 5 | 4 |
| **Total** | **7** | **16** | **14** | **9** |

## ESTADO DE EJECUCIÓN (2026-02-19)

- ✅ S-C1: Callbacks REST envueltos con try-catch global (`callbackSeguro`) en `CapEndpoints`.
- ✅ S-C3: Validación de pertenencia de centro en `actualizarAlumno` y `eliminarAlumno`.
- ✅ S-A1: Validación de centro en `toggleBloqueoClase`.
- ✅ S-A3: Eliminado fallback inseguro de encriptación en `StripeService`.
- ✅ S-A4: `generarReporteControlHoras` migrado a respuesta REST en base64 (sin `echo/exit`).
- ✅ S-C2/S-M3: Rate limit básico + validación de contraseña reforzada en `registrarUsuario`.
- ✅ S-M2 (parcial): Endpoints demo ahora verifican `CapSeeder::estaPermitido()` antes de ejecutar.
- ✅ R-C1: Migración runtime removida del constructor de `Configuracion` y movida a `CapBootstrap` versionado.
- ✅ R-A2: Eliminado N+1 en `Clase::obtenerSemana` con consulta batch de alumnos por clase.
- ✅ R-M1: Recálculo de progreso de alumnos en lote en `Alumno`.
- ✅ R-M2: Eliminada instancia redundante de `Alumno` en generación de calendario.
- ✅ C-C1/C-M2: `PanelStripe` corregido (`useEffect` + cleanup + try-catch clipboard).
- ✅ C-M1: `Input` migrado de `Math.random()` a `useId()`.
- ✅ C-A2/C-A3: `35` hardcodeado reemplazado por `CAP_REGLAS`; util compartida `formateoHoras` creada y aplicada.
- ✅ A-M1/A-M4: Unificación de normalización de asignaturas en `Alumno` como fuente única (CapEndpoints/CalendarEngine/ReporteService).
- ✅ A-B3: Método muerto `registrar()` eliminado de `CapEndpoints`.
- ✅ A-C1: Split estructural de `CapEndpoints` completado por dominio con extracción de `CapConfigEndpoints`, `CapRegistroEndpoints`, `CapAlumnosEndpoints`, `CapAlumnosProgresoEndpoints`, `CapDisponibilidadEndpoints`, `CapCalendarioGeneracionEndpoints`, `CapClasesGestionEndpoints`, `CapClasesLimpiezaEndpoints`, además de `CapDemoEndpoints`, `CapStripeEndpoints` y `CapReportesEndpoints`.
- ✅ A-A1: Split estructural de `ReporteService` completado con extracción de `ReportePdfStyles`, `ReportePlanAlumnoHtmlBuilder` y `ReporteControlHorasHtmlBuilder`.
- ✅ A-C2 (avance): extraída validación legal de calendario a `CalendarReglasValidator` y delegada desde `CalendarEngine`.
- ⏳ Pendiente mayor: split estructural de archivos monolíticos (`CalendarEngine`, hooks/componentes grandes).

---

## 1. SEGURIDAD

### 1.1 CRÍTICOS

#### S-C1. CapEndpoints.php — Sin try-catch global en métodos públicos REST
- **Archivo:** `App/Api/CapEndpoints.php`
- **Líneas:** Todos los métodos públicos (obtenerConfig, guardarConfig, listarAlumnos, crearAlumno, actualizarAlumno, eliminarAlumno, obtenerClases, generarCalendario, etc.)
- **Problema:** La mayoría de métodos del controller NO tienen try-catch global. Si una excepción inesperada ocurre (BD caída, tipo incorrecto, etc.), WordPress expone el stack trace completo al cliente, revelando rutas internas del servidor, nombres de tablas y estructura del código.
- **Métodos SIN protección:** `obtenerConfig`, `guardarConfig`, `listarAlumnos`, `crearAlumno`, `actualizarAlumno`, `eliminarAlumno`, `obtenerClases`, `generarCalendario`, `previewCalendario`, `generarConExclusiones`, `toggleBloqueoClase`, `actualizarClase`, `eliminarClase`, `eliminarTodasLasClases`, `eliminarClasesSemana`, `obtenerDashboard`, `obtenerDisponibilidad`, `guardarDisponibilidad`, `obtenerEstadoDemo`, `seedDatosDemo`, `limpiarDatosDemo`, `obtenerConfigStripe`, `guardarConfigStripe`, `crearStripeCheckout`, `obtenerStripePortal`, `debugProgresoAlumno`, `listarAlumnosPorIds`
- **Métodos CON protección (parcial):** `generarReportePlanAlumno` (tiene try-catch), `generarReporteControlHoras` (tiene try-catch), `procesarStripeWebhook` (delegado a StripeService que tiene try-catch), `registrarUsuario` (NO tiene try-catch)
- **Fix:** Envolver cada método público en `try { ... } catch (\Throwable $e)` con logging + respuesta 500 genérica.
- **Estado:** [ ] Pendiente

#### S-C2. CapEndpoints.php — `registrarUsuario` no verifica propiedad de centro al registrar
- **Archivo:** `App/Api/CapEndpoints.php`, líneas ~830-960
- **Problema:** El endpoint `/registro` es público (`'permission_callback' => '__return_true'`). Esto es correcto para registro. PERO no hay rate limiting ni protección anti-bot (CAPTCHA, honeypot). Un atacante puede crear cientos de usuarios y centros con un script, llenando la BD y generando suscripciones trial falsas.
- **Fix:** Agregar al menos un rate limit básico (`wp_throttle_comment`-style) o validación de nonce temporal para el formulario de registro.
- **Estado:** [ ] Pendiente

#### S-C3. CapEndpoints — Falta validación de propiedad en `actualizarAlumno` y `eliminarAlumno`
- **Archivo:** `App/Api/CapEndpoints.php`
- **Problema:** `actualizarAlumno` y `eliminarAlumno` reciben un `id` por path y operan directamente sin verificar que el alumno pertenezca al centro del usuario logueado. Un `cap_admin` del Centro A podría actualizar/eliminar alumnos del Centro B cambiando el ID en la URL.
- **Fix:** Agregar verificación `$alumno['centro_id'] === $centroId` antes de operar.
- **Estado:** [ ] Pendiente

### 1.2 ALTOS

#### S-A1. CapEndpoints — `toggleBloqueoClase` sin verificación de centro
- **Archivo:** `App/Api/CapEndpoints.php`, `toggleBloqueoClase()`
- **Problema:** Solo recibe el `id` de la clase y opera directamente sin verificar que la clase pertenezca al centro del usuario.
- **Fix:** Verificar `$clase['centro_id'] === $centroId`.
- **Estado:** [ ] Pendiente

#### S-A2. Configuracion.php — `asegurarColumnaFlexibilidad()` ejecuta ALTER TABLE en cada request
- **Archivo:** `App/Models/Configuracion.php`, constructor
- **Problema:** Se ejecuta en el constructor, que se instancia en cada request REST. La query a `INFORMATION_SCHEMA.COLUMNS` se ejecuta cada vez. No es una vulnerabilidad directa pero es un patrón peligroso: DDL en runtime puede causar locks de tabla en alta concurrencia.
- **Fix:** Mover la migración al bootstrap (`CapBootstrap::verificarActualizacion()`) y cachear con `get_option()`.
- **Estado:** [ ] Pendiente

#### S-A3. StripeService — Clave de encriptación fallback insegura
- **Archivo:** `App/Services/StripeService.php`, `obtenerClaveEncriptacion()`
- **Problema:** `$key = defined('AUTH_KEY') ? AUTH_KEY : 'cap-fallback-key-insegura';` — Si `AUTH_KEY` no está definida (muy raro pero posible en instalaciones rotas), se usa una constante hardcodeada predecible.
- **Fix:** Lanzar excepción si AUTH_KEY no está definida, en vez de usar fallback inseguro.
- **Estado:** [ ] Pendiente

#### S-A4. CapEndpoints — `generarReporteControlHoras` escribe directamente a output con `echo` + `exit`
- **Archivo:** `App/Api/CapEndpoints.php`, `generarReporteControlHoras()`
- **Problema:** Usa `echo $pdf; exit;` para enviar el PDF, bypaseando el sistema REST de WordPress. Esto rompe la consistencia y puede causar problemas con middleware, CORS headers, etc.
- **Fix:** Usar `WP_REST_Response` con base64 como en `generarReportePlanAlumno`, o al menos usar `wp_die()` en lugar de `exit`.
- **Estado:** [ ] Pendiente

### 1.3 MEDIOS

#### S-M1. pages.php — Props estáticos con datos de usuario en tiempo de registro de página
- **Archivo:** `App/Config/pages.php`
- **Problema:** `$dashboardUser = wp_get_current_user()` y `wp_create_nonce('wp_rest')` se ejecutan al cargar el archivo (durante `init`). En requests no autenticados (bot, cron), `get_current_user_id()` devuelve 0 y el nonce será para usuario anónimo. Aunque el `template_redirect` guard protege el acceso físico, los datos se inyectan en `__GLORY_ROUTES__` para todos los visitantes.
- **Fix:** Convertir a callable para que los datos de usuario solo se resuelvan cuando se renderice la página. Si el SPA no soporta callables, evaluar el hook correcto para inyectar los datos.
- **Estado:** [ ] Pendiente — requiere coordinación con Glory framework

#### S-M2. CapSeeder — `estaPermitido()` permite seeding en producción si `WP_DEBUG` está activo
- **Archivo:** `App/Database/CapSeeder.php`, `estaPermitido()`
- **Problema:** Muchos entornos de staging/producción tienen `WP_DEBUG` habilitado temporalmente para diagnosticar problemas. Esto abre el seeder a cualquier admin.
- **Fix:** Usar una constante dedicada `CAP_ALLOW_DEMO_MODE` exclusivamente, no depender de `WP_DEBUG`.
- **Estado:** [ ] Pendiente

#### S-M3. CapEndpoints — `registrarUsuario` no valida fortaleza de contraseña
- **Archivo:** `App/Api/CapEndpoints.php`, `registrarUsuario()`
- **Problema:** Solo verifica `strlen($password) < 8`. No verifica complejidad (mayúsculas, números, símbolos).
- **Fix:** Agregar validación de complejidad mínima.
- **Estado:** [ ] Pendiente (bajo impacto, mejora progresiva)

### 1.4 BAJOS

#### S-B1. Control.php — Feature `amazonProduct` habilitada sin uso aparente
- **Archivo:** `App/Config/control.php`, línea 18
- **Problema:** `GloryFeatures::enable('amazonProduct')` está habilitada pero no se usa en ningún componente visible del proyecto CAP.
- **Fix:** Deshabilitar para reducir superficie de ataque.
- **Estado:** [ ] Pendiente

#### S-B2. StripeService — SSL no verificado explícitamente
- **Archivo:** `App/Services/StripeService.php`
- **Problema:** Se usa el SDK de Stripe directamente (`\Stripe\Stripe::setApiKey()`), que gestiona SSL internamente. Sin embargo, no hay verificación explícita de que el entorno PHP tenga los certificados CA actualizados.
- **Fix:** Documentar requisito en README. Bajo riesgo real ya que Stripe SDK maneja esto.
- **Estado:** [ ] Info — no requiere acción directa

---

## 2. RENDIMIENTO

### 2.1 CRÍTICOS

#### R-C1. Configuracion — ALTER TABLE en cada request (migración on-the-fly)
- **Archivo:** `App/Models/Configuracion.php`, `asegurarColumnaFlexibilidad()`
- **Problema:** Cada instanciación de `Configuracion` ejecuta 2 queries a `INFORMATION_SCHEMA` + potencialmente 2 `ALTER TABLE`. Esto se ejecuta en CADA request REST que toque configuración (obtenerConfig, guardarConfig, generarCalendario, etc.).
- **Impacto:** Latencia innecesaria de 10-50ms por request. En alta concurrencia puede causar table locks.
- **Fix:** Mover a `CapBootstrap` con control de versión. Cachear resultado con option transient.
- **Estado:** [ ] Pendiente

### 2.2 ALTOS

#### R-A1. Alumno::obtenerPorCentro — Subqueries N+1 correlacionadas
- **Archivo:** `App/Models/Alumno.php`, `obtenerPorCentro()` y `obtenerPorIds()`
- **Problema:** Cada fila de alumno ejecuta 2 subqueries correlacionadas para calcular `horas_asignadas` y `horas_completadas_calculadas`. Con 100 alumnos, son 200 subqueries adicionales.
- **Fix:** Usar JOIN + GROUP BY en una sola query, o al menos una CTE si MySQL 8+.
- **Estado:** [ ] Pendiente

#### R-A2. Clase::obtenerSemana — N+1 para alumnos de cada clase
- **Archivo:** `App/Models/Clase.php`, `obtenerSemana()`
- **Problema:** Después de obtener las clases, hace un loop con `obtenerAlumnosClase($clase['id'])` por cada clase. Con 30 clases en una semana, son 30 queries adicionales.
- **Fix:** Batch query: obtener todos los alumnos de todas las clases de la semana en una sola query con `WHERE clase_id IN (...)`.
- **Estado:** [ ] Pendiente

#### R-A3. CalendarEngine — `date_default_timezone_set()` es global y no thread-safe
- **Archivo:** `App/Services/CalendarEngine.php` y `App/Services/ReporteService.php`
- **Problema:** `date_default_timezone_set()` cambia la timezone para TODO el proceso PHP, no solo para la instancia. Si dos requests concurrentes de centros con diferentes timezones se procesan en el mismo worker, pueden interferir.
- **Fix:** Usar `DateTimeZone` explícito en cada operación de fecha en vez de cambiar la timezone global.
- **Estado:** [ ] Pendiente (medio-bajo riesgo en la práctica con WordPress)

### 2.3 MEDIOS

#### R-M1. Alumno::recalcularProgresoCentro — Loop secuencial sin batch
- **Archivo:** `App/Models/Alumno.php`, `recalcularProgresoCentro()`
- **Problema:** Ejecuta `recalcularHorasCompletadas($alumnoId)` en un loop por cada alumno. Cada iteración hace 1 SELECT + 1 UPDATE. Con 50 alumnos = 100 queries.
- **Fix:** Usar una sola query UPDATE con subquery/JOIN.
- **Estado:** [ ] Pendiente

#### R-M2. CapEndpoints — Instancias repetidas de Alumno en la misma request
- **Archivo:** `App/Api/CapEndpoints.php`, `generarCalendario()`
- **Problema:** `$alumnoModel = $alumnoModel ?? new Alumno();` se usa después de ya haber creado `$alumnoModel = new Alumno()`. El `?? new` es redundante y confuso.
- **Fix:** Limpiar código, usar una sola instancia.
- **Estado:** [ ] Pendiente

---

## 3. SOLID Y ARQUITECTURA

### 3.1 CRÍTICOS

#### A-C1. CapEndpoints.php — Archivo de 1600 líneas (límite: 300)
- **Archivo:** `App/Api/CapEndpoints.php`
- **Problema:** Un solo archivo con 1600 líneas que contiene TODOS los endpoints REST. Viola masivamente SRP y el límite de 300 líneas del protocolo.
- **Fix:** Dividir en controladores por dominio:
  - `AlumnoEndpoints.php` — CRUD alumnos, progreso, disponibilidad
  - `CalendarioEndpoints.php` — clases, generar, preview, exclusiones
  - `ConfigEndpoints.php` — config centro, dashboard
  - `ReporteEndpoints.php` — PDFs
  - `StripeEndpoints.php` — checkout, portal, webhook, config stripe
  - `DemoEndpoints.php` — seeder, status, clean
  - `RegistroEndpoints.php` — registro público
- **Estado:** [x] Completado — `CapEndpoints` quedó como orquestador y el dominio se dividió en controladores especializados

#### A-C2. CalendarEngine.php — Archivo de 1279 líneas (límite: 300)
- **Archivo:** `App/Services/CalendarEngine.php`
- **Problema:** Motor monolítico con responsabilidades mezcladas: generación de slots, cálculo de demanda, detección de conflictos, distribución de asignaturas, creación en BD, validación de reglas, preview.
- **Fix:** Dividir en:
  - `CalendarEngine.php` — Orquestador (~150 líneas)
  - `SlotGenerator.php` — Generación de slots disponibles
  - `DemandCalculator.php` — Cálculo de demanda por slot
  - `SubjectDistributor.php` — Distribución de asignaturas
  - `CalendarRepository.php` — Persistencia en BD
- **Estado:** [~] En progreso — extraída validación de reglas a `CalendarReglasValidator`; pendiente extraer slots/demanda/distribución/persistencia.

### 3.2 ALTOS

#### A-A1. ReporteService.php — 738 líneas con HTML/CSS embebido
- **Archivo:** `App/Services/ReporteService.php`
- **Problema:** Excede el límite de 300 líneas. Mezcla lógica de generación de datos con templates HTML/CSS. Los estilos CSS están hardcodeados como string en el PHP.
- **Fix:** Extraer templates HTML a archivos Blade/PHP separados en `App/Templates/reportes/`. Separar `getEstilosPdf()` a un archivo CSS cargado con `file_get_contents()`.
- **Estado:** [x] Completado (parcial de alto impacto) — `ReporteService` quedó como orquestador (184 líneas) y se extrajeron builders por dominio + proveedor de estilos.

#### A-A2. CapSeeder.php — 515 líneas
- **Archivo:** `App/Database/CapSeeder.php`
- **Problema:** Excede el límite de 300 líneas.
- **Fix:** Separar data fixtures de la lógica de seeding.
- **Estado:** [ ] Pendiente — TO-DO split

#### A-A3. useCalendario.ts — 772 líneas (límite hooks: 120)
- **Archivo:** `App/React/islands/cap/hooks/useCalendario.ts`
- **Problema:** Hook monolítico 6x mayor que el límite permitido. Mezcla: state management, DnD logic, API calls, undo/redo, conflict resolution, generación.
- **Fix:** Dividir en:
  - `useCalendarioState.ts` — Estado base y navegación de semanas
  - `useCalendarioDnd.ts` — Drag & drop
  - `useCalendarioApi.ts` — Llamadas API
  - `useCalendarioGeneracion.ts` — Lógica de generación y conflictos
- **Estado:** [ ] Pendiente — TO-DO split obligatorio

#### A-A4. Hooks grandes fuera de límite (120 líneas)
- **Archivos:**
  - `useAlumnos.ts` — ~270 líneas
  - `useDisponibilidad.ts` — ~270 líneas
  - `useConfiguracion.ts` — ~220 líneas
  - `useReportes.ts` — ~175 líneas
  - `useStripe.ts` — ~180 líneas
- **Fix:** Marcar TO-DO de división para cada uno.
- **Estado:** [ ] Pendiente

#### A-A5. Componentes grandes fuera de límite (300 líneas)
- **Archivos:**
  - `ModalDetalleClase.tsx` — ~500 líneas (lógica + vista mezcladas)
  - `CalendarioSemanal.tsx` — ~452 líneas
  - `ModalProgresoAlumno.tsx` — ~336 líneas
  - `ModalConflictoAforo.tsx` — ~343 líneas
- **Fix:** Extraer lógica a hooks dedicados, dividir vista en subcomponentes.
- **Estado:** [ ] Pendiente

#### A-A6. Utils grandes fuera de límite (150 líneas)
- **Archivos:**
  - `priorizacionAforo.ts` — ~265 líneas
  - `collisionUtils.ts` — ~260 líneas
- **Fix:** Dividir en archivos más pequeños por responsabilidad.
- **Estado:** [ ] Pendiente

### 3.3 MEDIOS

#### A-M1. Mapa de alias de asignaturas duplicado en 3 lugares
- **Archivos:** `Alumno.php::ASIGNATURA_ALIAS`, `CalendarEngine.php::normalizarCodigoAsignatura()`, `ReporteService.php::CODIGOS_ALIAS`
- **Problema:** Tres fuentes de verdad para la misma normalización de asignaturas. Si se agrega un alias, hay que modificar 3 archivos.
- **Fix:** Crear constante única en `Alumno::ASIGNATURA_ALIAS` y reutilizar en todos los servicios.
- **Estado:** [ ] Pendiente

#### A-M2. Lógica inline en componentes React (>5 líneas)
- **Archivos:** `CapLoginIsland.tsx`, `CapRegistroIsland.tsx`, `SeccionCalendario.tsx`, `SeccionAlumnos.tsx`, `PanelDemo.tsx`, `ModalDetalleClase.tsx`
- **Problema:** Componentes con lógica de fetch, cálculos y efectos directamente en el cuerpo.
- **Fix:** Extraer a hooks dedicados.
- **Estado:** [ ] Pendiente

#### A-M3. PanelDemo.tsx — Fetch inline sin hook
- **Archivo:** `App/React/islands/cap/components/configuracion/PanelDemo.tsx`
- **Problema:** Hace fetches directos sin hook dedicado, violando el patrón de separación lógica-vista.
- **Fix:** Crear `usePanelDemo.ts`.
- **Estado:** [ ] Pendiente

#### A-M4. CapEndpoints — ASIGNATURAS_ID_A_CODIGO duplicado con Alumno::ASIGNATURA_ALIAS
- **Archivo:** `App/Api/CapEndpoints.php`, constante `ASIGNATURAS_ID_A_CODIGO`
- **Problema:** Duplica información que ya existe en `Alumno::ASIGNATURA_ALIAS`.
- **Fix:** Eliminar la constante del endpoint y usar `Alumno::normalizarCodigoAsignatura()` directamente.
- **Estado:** [ ] Pendiente

### 3.4 BAJOS

#### A-B1. Control.php — Feature flag sin uso
- **Archivo:** `App/Config/control.php`
- `GloryFeatures::disable('menu')` + `GloryFeatures::enable('amazonProduct')` — features sin relación con CAP.
- **Estado:** [ ] Info

#### A-B2. Alumno.php — 580 líneas (límite: 300)
- **Fix:** TO-DO split — separar consultas de progreso a un `ProgresoAlumno.php` o similar.
- **Estado:** [ ] Pendiente

#### A-B3. CapEndpoints — Método `registrar()` sobrante
- **Archivo:** `App/Api/CapEndpoints.php`
- `registrar()` agrega action `rest_api_init` → `registrarRutas()`, pero `init-cap-api.php` ya llama `registrarRutas()` directamente.
- **Fix:** Eliminar método `registrar()` muerto.
- **Estado:** [ ] Pendiente

---

## 4. CALIDAD DE CÓDIGO (FRONTEND)

### 4.1 CRÍTICOS

#### C-C1. setTimeout fuera de useEffect en PanelStripe.tsx
- **Archivo:** `App/React/islands/cap/components/configuracion/PanelStripe.tsx`
- **Problema:** `setTimeout(limpiarMensajes, 4000)` ejecutado en el cuerpo del componente, sin cleanup. Se acumula en cada render.
- **Fix:** Mover a `useEffect` con cleanup.
- **Estado:** [ ] Pendiente

### 4.2 ALTOS

#### C-A1. useEffect sin AbortController en fetches async
- **Archivos:** `ModalProgresoAlumno.tsx`, `PanelDemo.tsx`
- **Problema:** Fetches async en useEffect sin cleanup → riesgo de state updates en componentes desmontados.
- **Fix:** Agregar AbortController + cleanup.
- **Estado:** [ ] Pendiente

#### C-A2. Magic number 35 hardcodeado
- **Archivo:** `TablaAlumnos.tsx`
- **Problema:** `const maxHoras = 35;` en vez de usar `CAP_REGLAS.HORAS_TOTALES`.
- **Fix:** Importar y usar la constante.
- **Estado:** [ ] Pendiente

#### C-A3. Funciones duplicadas normalizarNumero/formatearHoras
- **Archivos:** `TablaAlumnos.tsx`, `ModalProgresoAlumno.tsx`
- **Problema:** Funciones idénticas duplicadas en 2 archivos.
- **Fix:** Extraer a `utils/formateo.ts`.
- **Estado:** [ ] Pendiente

### 4.3 MEDIOS

#### C-M1. Input.tsx — ID aleatorio en cada render
- **Archivo:** `App/React/islands/cap/components/ui/Input/Input.tsx`
- **Problema:** `Math.random().toString(36).substr(2, 9)` genera nuevo ID en cada render → reconciliación innecesaria.
- **Fix:** Usar `useId()` de React 18 o `useMemo`.
- **Estado:** [ ] Pendiente

#### C-M2. navigator.clipboard sin try-catch
- **Archivo:** `PanelStripe.tsx`
- **Problema:** `navigator.clipboard.writeText()` puede fallar en HTTP.
- **Fix:** Envolver en try-catch con fallback.
- **Estado:** [ ] Pendiente

#### C-M3. CSS inline en componentes
- **Archivos:** `TablaAlumnos.tsx`, `ModalProgresoAlumno.tsx`
- **Problema:** `style={{borderTop: '1px solid currentColor'}}` — debería ser clase CSS.
- **Fix:** Mover a archivo CSS.
- **Estado:** [ ] Pendiente

#### C-M4. catch vacío/sin contexto
- **Archivos:** `ModalProgresoAlumno.tsx`, `PanelDemo.tsx`
- **Problema:** Catches sin logging o con logging genérico.
- **Fix:** Agregar contexto descriptivo.
- **Estado:** [ ] Pendiente

#### C-M5. Modal — id="modal-titulo" estático
- **Archivo:** `Modal.tsx`
- **Problema:** Si hay 2 modales simultáneos, conflicto de IDs para aria-labelledby.
- **Fix:** Usar `useId()`.
- **Estado:** [ ] Pendiente

### 4.4 BAJOS

#### C-B1. window.confirm()/prompt() nativos
- **Archivos:** `PanelDemo.tsx`, `PanelHorarios.tsx`
- **Problema:** No usa el sistema de Modal propio.
- **Fix:** Reemplazar con Modal de confirmación.
- **Estado:** [ ] Pendiente

#### C-B2. Tooltip naming inconsistente
- **Archivo:** `Tooltip.tsx`, `tooltip.css`
- **Problema:** Usa guiones (`capTooltip-wrapper`) en vez de camelCase (`capTooltipWrapper`).
- **Fix:** Renombrar clases CSS.
- **Estado:** [ ] Pendiente

#### C-B3. cap-login y cap-registro usan callable props (SPA limitation)
- **Archivo:** `App/Config/pages.php`
- **Problema:** `cap-login` y `cap-registro` usan callable `function ($pageId)` para props. En SPA mode (`__GLORY_ROUTES__`), estas props no se serializan — igual que el bug de cap-dashboard que ya se corrigió.
- **Fix:** Convertir a array estático como se hizo con cap-dashboard, o aceptar que estas páginas no participan en SPA navigation.
- **Estado:** [ ] Evaluar — login/registro rara vez se navegan via SPA

#### C-B4. `ejemplo.jsx` — Archivo muerto de 339 líneas
- **Archivo:** `App/React/ejemplo.jsx`
- **Problema:** Prototipo/mockup no conectado al sistema. Código muerto.
- **Fix:** Mover a `docs/` o eliminar.
- **Estado:** [ ] Pendiente

---

## 5. ASPECTOS POSITIVOS (NO NECESITAN ACCIÓN)

- **Queries SQL:** Uso consistente de `$wpdb->prepare()` en todas las queries con parámetros. No se detectó SQL injection.
- **XSS:** No se usa `dangerouslySetInnerHTML`, `innerHTML` ni `eval()`. Los datos se sanitizan con `sanitize_text_field()`, `sanitize_email()`, `absint()`.
- **Stripe:** Keys encriptadas con AES-256-CBC, webhook validado con firma, checkout session segura.
- **CSRF:** WordPress nonce system aplicado via `X-WP-Nonce` header en todos los hooks.
- **Componentes UI:** Bien abstraídos (`Boton`, `Input`, `Modal`, `Tarjeta`), composables, con tipado strong.
- **Patrón hook:** Aplicado consistentemente en la mayoría de componentes (useCalendario, useAlumnos, etc.).
- **Zustand:** Correctamente usado con persist middleware y selector patterns.
- **Error handling frontend:** Centralizado en `cap-errores.ts` con `manejarErrorHttp`.
- **TypeScript strict:** Interfaces bien definidas.
- **Nomenclatura CSS:** Consistente en español y camelCase.
- **Accesibilidad:** Buena en componentes primitivos (ARIA roles, keyboard nav, screen reader text).
- **Normalización de asignaturas:** Sistema robusto con alias map y migración on-the-fly.
- **Auth guard:** Correctamente implementado en `template_redirect` para proteger dashboard.

---

## 6. PLAN DE EJECUCIÓN

### Fase 1 — Seguridad (Ejecutar primero)
1. [S-C1] Try-catch global en CapEndpoints
2. [S-C3] Validación de propiedad en actualizarAlumno/eliminarAlumno
3. [S-A1] Validación de centro en toggleBloqueoClase
4. [S-A3] Eliminar fallback inseguro de encriptación
5. [S-A4] Unificar respuesta PDF de control-horas con base64
6. [S-A2] Mover migración on-the-fly a CapBootstrap

### Fase 2 — Rendimiento
7. [R-A2] Batch query para alumnos de clases (eliminar N+1 en Clase::obtenerSemana)
8. [R-M1] Batch update para recalcularProgresoCentro

### Fase 3 — Calidad de código
9. [C-C1] Fix setTimeout en PanelStripe.tsx
10. [C-A2] Reemplazar magic number 35
11. [C-A3] Extraer funciones duplicadas a util
12. [C-M1] Fix Input.tsx ID aleatorio
13. [A-M1] Unificar mapa de alias de asignaturas
14. [A-B3] Eliminar método registrar() muerto
15. [A-M4] Eliminar ASIGNATURAS_ID_A_CODIGO duplicado

### Fase 4 — SOLID/Arquitectura (TO-DOs para futuras sesiones)
- [A-C1] Split CapEndpoints.php (1600 líneas)
- [A-C2] Split CalendarEngine.php (1279 líneas)
- [x] [A-A1] Split ReporteService.php (738 líneas)
- [A-A3] Split useCalendario.ts (772 líneas)
- [A-A4] Split hooks grandes
- [A-A5] Split componentes grandes

---

## 7. LECCIONES APRENDIDAS

- [Seguridad]: Los endpoints REST sin try-catch global exponen stacktraces en producción — WordPress no los filtra.
- [Seguridad]: La falta de verificación de propiedad (centro_id) en operaciones CRUD es un IDOR potencial.
- [Rendimiento]: Subqueries correlacionadas dentro de SELECT + loop de queries individuales por clase/alumno suman latencia significativa con datos reales.
- [Arquitectura]: El archivo monolítico de endpoints dificulta la revisión de seguridad porque cada método público es un vector de ataque y hay que verificar 30+ métodos en un solo archivo.
- [Arquitectura]: Separar generadores HTML por reporte reduce riesgo de regresión y permite evolucionar templates sin tocar el orquestador PDF.
- [Patrón]: Los maps de alias/normalización deben tener una fuente de verdad única. Tres copias divergen silenciosamente.
- [React]: Los hooks monolíticos dificultan testing y reutilización; sin embargo, la arquitectura de Islands compensa parcialmente al aislar los componentes.
