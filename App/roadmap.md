# Roadmap — Cresta Campers (crestacampers.com)

## Resumen del proyecto

Sitio web para empresa de alquiler de furgonetas camper.
Dominio: **crestacampers.com**

### Requerimientos del cliente

- Sistema de reservas con calendario de disponibilidad en tiempo real.
- Selección de fechas directamente desde la web.
- Confirmación automática tras reservar.
- Pago con tarjeta mediante pasarela segura (Stripe).
- Todo el flujo (consulta → reserva → pago) 100% online sin gestión manual.
- Fácil de gestionar desde el panel de administración de WordPress.
- Inicialmente 1 furgoneta, escalable a más en el futuro.
- Precios por noche variables según temporada y vehículo.
- Referencia de UX: roadsurfer.com, yescapa.es (formulario de fechas prominente en home).

### Stack técnico

- WordPress + Glory Framework (PHP bridge + React Islands)
- React + TypeScript (islas interactivas)
- CSS propio (arquitectura modular: 13 archivos via init.css)
- Stripe Checkout (pagos)
- Sin tablas custom — todo vía CPTs + `wp_postmeta` + `wp_options`

---

## Auditoría de Glory para este proyecto

### ✅ Preparado — se usa directamente

| Componente | Uso en Cresta Campers |
|---|---|
| `PageManager::reactPage()` | Páginas: home, flota, detalle vehículo, reservar, confirmación, contacto, legal |
| `PostTypeManager::define()` | CPT `vehiculo` y CPT `reserva` |
| `PostTypeSchema` (contrato) | Schema tipado de metas para cada CPT |
| `OpcionManager::register()` | Precios temporada, políticas, datos empresa, horarios |
| `ScheduleManager` | Horarios de apertura del negocio |
| `ReactIslands` + `ReactContentProvider` | Islas React con datos de WP inyectados |
| `StripeCheckoutService` | Crear sesiones de pago para reservas |
| `StripeWebhookVerifier` | Confirmar pagos vía webhook |
| `FormController` | Formulario de contacto |
| `EmailUtility` | Notificaciones al admin de reservas nuevas |
| `EventBus` | Invalidar disponibilidad al crear/cancelar reserva |
| `GloryFeatures` | Activar Stripe, Tailwind, formularios |
| `SeoFrontendRenderer` | SEO automático por página |
| `AssetImporter` + `ImageUtility` | Fotos de vehículos optimizadas |
| Navegación SPA (`GloryLink`) | Transiciones fluidas entre páginas |

### ⚠️ Requiere activar (feature flags en `control.php`)

```php
GloryFeatures::enable('stripe');
GloryFeatures::disable('tailwind'); /* CSS propio via init.css */
GloryFeatures::enable('gloryForm');
GloryFeatures::enable('menu');
```

### 🛠️ Requiere implementar (código nuevo del proyecto)

- Schemas de CPT: `VehiculoSchema`, `ReservaSchema`
- Lógica de disponibilidad (consulta de reservas por rango de fechas)
- Motor de precios por temporada
- Endpoint REST para consultar disponibilidad
- Endpoint REST para crear reserva + sesión Stripe
- Webhook handler para confirmar pago y cambiar estado a `confirmada`
- Islas React: calendario, selector de fechas, checkout, galería, ficha vehículo
- Emails transaccionales (confirmación de reserva al cliente)

---

## Modelo de datos (100% WordPress nativo)

### CPT `vehiculo` — metas vía `wp_postmeta`

| Meta key | Tipo | Descripción |
|---|---|---|
| `_vehiculo_nombre` | string | Nombre comercial (ej. "Cresta One") |
| `_vehiculo_descripcion_corta` | text | Descripción corta para tarjetas |
| `_vehiculo_capacidad` | int | Plazas para dormir |
| `_vehiculo_plazas_viaje` | int | Plazas homologadas para viajar |
| `_vehiculo_combustible` | string | Tipo (diésel, gasolina, etc.) |
| `_vehiculo_transmision` | string | Manual / Automática |
| `_vehiculo_equipamiento` | json | Array de equipamiento (nevera, ducha, cocina, calefacción, etc.) |
| `_vehiculo_galeria` | json | Array de IDs de adjuntos (media library) |
| `_vehiculo_precio_base` | float | Precio por noche base (temporada baja) |
| `_vehiculo_activo` | bool | ¿Disponible para reservas? |
| `_vehiculo_ubicacion` | string | Ciudad/punto de recogida |
| `_vehiculo_politica_cancelacion` | string | Slug de la política aplicable |
| `_vehiculo_fianza` | float | Importe de fianza |
| `_vehiculo_km_incluidos` | int | Kilómetros diarios incluidos (0 = ilimitados) |
| `_vehiculo_edad_minima` | int | Edad mínima del conductor |

### CPT `reserva` — metas vía `wp_postmeta`

| Meta key | Tipo | Descripción |
|---|---|---|
| `_reserva_vehiculo_id` | int | ID del post del vehículo |
| `_reserva_fecha_inicio` | string | Fecha de recogida (Y-m-d) |
| `_reserva_fecha_fin` | string | Fecha de devolución (Y-m-d) |
| `_reserva_noches` | int | Número de noches calculado |
| `_reserva_precio_noche` | float | Precio por noche aplicado |
| `_reserva_precio_total` | float | Total cobrado |
| `_reserva_estado` | string | pendiente / confirmada / cancelada / completada |
| `_reserva_nombre_cliente` | string | Nombre completo |
| `_reserva_email_cliente` | string | Email del cliente |
| `_reserva_telefono_cliente` | string | Teléfono |
| `_reserva_stripe_session_id` | string | ID de sesión de Stripe Checkout |
| `_reserva_stripe_payment_intent` | string | ID del Payment Intent |
| `_reserva_notas` | text | Notas del cliente |
| `_reserva_temporada` | string | Temporada aplicada (baja/media/alta/especial) |

### Opciones del tema (`wp_options` vía `OpcionManager`)

| Opción | Tipo | Descripción |
|---|---|---|
| `cresta_empresa_nombre` | text | Nombre de la empresa |
| `cresta_empresa_email` | text | Email de contacto |
| `cresta_empresa_telefono` | text | Teléfono |
| `cresta_empresa_direccion` | textarea | Dirección física |
| `cresta_empresa_cif` | text | CIF/NIF |
| `cresta_temporada_baja_inicio` | text | Fecha inicio temp. baja (MM-DD) |
| `cresta_temporada_baja_fin` | text | Fecha fin temp. baja (MM-DD) |
| `cresta_temporada_media_inicio` | text | Fecha inicio temp. media |
| `cresta_temporada_media_fin` | text | Fecha fin temp. media |
| `cresta_temporada_alta_inicio` | text | Fecha inicio temp. alta |
| `cresta_temporada_alta_fin` | text | Fecha fin temp. alta |
| `cresta_multiplicador_media` | text | Multiplicador precio temp. media (ej: 1.3) |
| `cresta_multiplicador_alta` | text | Multiplicador precio temp. alta (ej: 1.6) |
| `cresta_multiplicador_especial` | text | Multiplicador temp. especial (ej: 2.0) |
| `cresta_fechas_especiales` | textarea | Fechas con precio especial (JSON) |
| `cresta_noches_minimas` | text | Mínimo de noches por reserva |
| `cresta_dias_anticipacion` | text | Días mínimos de antelación |
| `cresta_politica_cancelacion` | textarea | Texto de política de cancelación |
| `cresta_condiciones_alquiler` | textarea | Condiciones generales |
| `cresta_horario_recogida` | text | Hora de recogida (ej: "16:00") |
| `cresta_horario_devolucion` | text | Hora de devolución (ej: "10:00") |
| `cresta_stripe_mode` | text | live / test |
| `cresta_moneda` | text | EUR |

---

## Páginas del sitio

| Slug | Isla React | Descripción |
|---|---|---|
| `home` | `HomeIsland` | Landing con buscador de fechas prominente, hero, galería destacada, CTA |
| `flota` | `FlotaIsland` | Listado de vehículos disponibles con filtros |
| `flota/{slug}` | `VehiculoDetalleIsland` | Ficha completa del vehículo (galería, equipamiento, calendario, CTA reservar) |
| `reservar` | `ReservarIsland` | Flujo de reserva: selección fechas → resumen → datos cliente → pago Stripe |
| `confirmacion` | `ConfirmacionIsland` | Página de éxito post-pago con resumen de reserva |
| `contacto` | `ContactoIsland` | Formulario de contacto (usa `FormController`) |
| `sobre-nosotros` | `SobreNosotrosIsland` | Información de la empresa, valores, equipo |
| `condiciones` | `CondicionesIsland` | Condiciones generales de alquiler |
| `privacidad` | `PrivacidadIsland` | Política de privacidad (RGPD) |
| `aviso-legal` | `AvisoLegalIsland` | Aviso legal |
| `cookies` | `CookiesIsland` | Política de cookies |

---

## Endpoints REST API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/glory/v1/vehiculos` | Lista vehículos activos con metas públicas |
| `GET` | `/glory/v1/vehiculos/{id}` | Detalle de un vehículo |
| `GET` | `/glory/v1/disponibilidad` | Query: `vehiculo_id`, `fecha_inicio`, `fecha_fin` → devuelve disponibilidad + precio calculado |
| `GET` | `/glory/v1/disponibilidad/calendario` | Query: `vehiculo_id`, `mes`, `anio` → mapa de días disponibles del mes |
| `POST` | `/glory/v1/reservas` | Crea reserva (estado `pendiente`) + sesión Stripe → devuelve URL de checkout |
| `GET` | `/glory/v1/reservas/{id}` | Detalle de reserva (nonce requerido, valida email) |
| `POST` | `/glory/v1/stripe/webhook` | Webhook de Stripe → confirma pago, actualiza estado a `confirmada`, envía emails |
| `GET` | `/glory/v1/precios` | Tabla de precios por temporada para un vehículo |
| `POST` | `/glory/v1/form` | Formulario de contacto (ya existente en Glory) |

---

## Islas React

### `HomeIsland` — Landing principal
- Hero con imagen/video de furgoneta en paisaje
- **Buscador de fechas**: selector de fecha recogida/devolución + lugar (estilo roadsurfer)
- Sección "Nuestras furgonetas" (cards con foto, nombre, capacidad, precio desde)
- Sección "Cómo funciona" (3 pasos: elige fechas → reserva online → recoge tu furgo)
- Sección testimonios / galería de experiencias
- CTA final

### `FlotaIsland` — Catálogo
- Grid de vehículos con tarjetas (foto, nombre, capacidad, precio desde)
- Filtros: capacidad, precio, disponibilidad por fechas
- Ordenación: precio, popularidad

### `VehiculoDetalleIsland` — Ficha de vehículo
- Galería de imágenes (lightbox)
- Especificaciones técnicas (capacidad, combustible, transmisión)
- Lista de equipamiento con iconos
- Calendario de disponibilidad interactivo (días ocupados en gris, disponibles en verde)
- Tabla de precios por temporada
- Botón "Reservar" que lleva al flujo de reserva con fechas preseleccionadas
- Política de cancelación
- Ubicación de recogida

### `ReservarIsland` — Flujo de reserva (multi-step)
- **Paso 1**: Confirmar/seleccionar fechas + vehículo
- **Paso 2**: Resumen de precio (desglose: x noches × precio/noche = total, temporada aplicada, fianza info)
- **Paso 3**: Datos del cliente (nombre, email, teléfono, notas)
- **Paso 4**: Redirige a Stripe Checkout para pago seguro
- Validación en tiempo real de disponibilidad en cada paso

### `ConfirmacionIsland` — Post-pago
- Mensaje de confirmación
- Resumen: vehículo, fechas, precio, datos de recogida
- Número/ID de reserva
- Info de contacto + qué hacer antes de la recogida
- CTA para guardar confirmación / imprimir

### `ContactoIsland` — Formulario
- Campos: nombre, email, teléfono, mensaje
- Integrado con `FormController` existente de Glory
- Mapa (embed de Google Maps con ubicación)
- Datos de contacto de la empresa

### Islas de contenido legal
- `CondicionesIsland`, `PrivacidadIsland`, `AvisoLegalIsland`, `CookiesIsland`
- Contenido editable desde wp-admin (opciones del tema, sección legal)
- Lectura del contenido vía `useGloryOptions` → `options.legal[contentKey]`

---

## Lógica de negocio

### Motor de precios por temporada

```
precio_final = precio_base_vehiculo × multiplicador_temporada
```

- La temporada se determina por la fecha de cada noche de la reserva.
- Si una reserva cruza dos temporadas, cada noche se calcula individualmente.
- Las fechas especiales (Navidad, puentes, etc.) tienen multiplicador propio.
- Reglas configurables desde el panel de opciones de WordPress.

### Cálculo de disponibilidad

1. Consultar todas las reservas del vehículo con estado `confirmada` o `pendiente` (< 30 min antigüedad).
2. Generar mapa de fechas ocupadas.
3. Para una consulta (fecha_inicio, fecha_fin): verificar que ningún día del rango esté ocupado.
4. La disponibilidad se invalida vía `EventBus::emit('disponibilidad')` al crear/cancelar reserva.

### Flujo de reserva completo

```
1. Cliente selecciona fechas y vehículo en la web
2. Frontend consulta GET /disponibilidad → verifica que esté libre + calcula precio
3. Cliente rellena datos personales
4. Frontend envía POST /reservas → se crea reserva (estado: pendiente) + sesión Stripe
5. Cliente es redirigido a Stripe Checkout
6. Cliente paga en Stripe
7. Stripe envía webhook → POST /stripe/webhook
8. Backend verifica webhook, actualiza reserva a "confirmada"
9. Se envía email de confirmación al cliente + notificación al admin
10. Cliente es redirigido a /confirmacion?session_id=xxx
11. Frontend muestra resumen de reserva confirmada
```

### Limpieza de reservas pendientes

- Cron WP (o pseudo-cron): cada 30 minutos, marcar como `cancelada` las reservas en estado `pendiente` con más de 30 minutos de antigüedad.
- Implementable con `wp_schedule_event` simple.

---

## Fases de implementación

### Fase 0 — Preparación del entorno
- [ ] Configurar dominio crestacampers.com + hosting
- [ ] Instalar WordPress + activar tema glorytemplate
- [x] Configurar `.env` (LOCAL, DEV, Stripe keys)
- [x] Activar feature flags: `stripe`, `tailwind`, `gloryForm`, `menu`
- [ ] Limpiar contenido de ejemplo (libros, tareas, padel)

### Fase 1 — Modelo de datos
- [x] Crear `App/Config/Schema/VehiculoSchema.php` (extiende `PostTypeSchema`)
- [x] Crear `App/Config/Schema/ReservaSchema.php` (extiende `PostTypeSchema`)
- [x] Registrar CPT `vehiculo` en `postType.php` con metas por defecto
- [x] Registrar CPT `reserva` en `postType.php` (private, sin archive)
- [x] Registrar opciones del tema en `opcionesTema.php` (empresa, temporadas, precios)
- [x] Crear contenido por defecto de 3 vehículos en `defaultContent.php` (Cresta One / Duo / Pro)

### Fase 2 — Backend (API REST)
- [x] Crear `App/Api/VehiculoController.php` — endpoints GET de vehículos + lookup por slug
- [x] Crear `App/Api/DisponibilidadController.php` — consulta de disponibilidad + cálculo precios
- [x] Crear `App/Api/ReservaController.php` — crear reserva + sesión Stripe (price_data dinámico)
- [x] Crear `App/Api/StripeWebhookHandler.php` — handler de webhook (extiende `AbstractStripeWebhookHandler`)
- [x] Implementar motor de precios por temporada (`App/Services/PrecioService.php`)
- [x] Implementar servicio de disponibilidad (`App/Services/DisponibilidadService.php`)
- [x] Implementar notificaciones por email (`App/Services/NotificacionService.php`)
- [x] Registrar endpoints en `App/Config/api.php`
- [x] Implementar cron de limpieza de reservas pendientes (`App/Cron/LimpiarReservasPendientes.php`)

### Fase 3 — Frontend (Islas React)
- [x] ~~Tailwind CSS~~ Migrado a CSS propio modular (13 archivos via init.css)
- [x] Diseñar sistema de diseño (colores verde #2d6a4f, tipografía, componentes base)
- [x] Crear `HomeIsland` con hero + buscador de fechas + secciones
- [x] Crear `FlotaIsland` con grid de vehículos + router a detalle
- [x] Crear `VehiculoDetalleIsland` con galería + calendario + specs
- [x] Crear `ReservarIsland` con flujo multi-step (4 pasos)
- [x] Crear `ConfirmacionIsland`
- [x] Crear `ContactoIsland` (integrado con FormController)
- [x] Crear islas legales (condiciones, privacidad, aviso legal, cookies)
- [x] Crear componentes compartidos: `CalendarioDisponibilidad`, `SelectorFechas`, `TarjetaVehiculo`, `ResumenPrecio`, `Galeria`, `Header`, `Footer`, `PaginaLegal`
- [x] Crear hooks: `useDisponibilidad`, `useVehiculos`, `useReserva`, `usePrecios`, `useContacto`, `useReservarFlujo`
- [x] Crear componentes UI atómicos: `Boton`, `CampoTexto`, `CampoTextarea`, `CampoSelect` en `components/ui/`
- [x] Crear tipos TypeScript: `App/React/types/cresta.ts`

### Fase 4 — Páginas y navegación
- [x] Registrar todas las páginas en `pages.php` con `PageManager::reactPage()`
- [x] Registrar ruta dinámica para `flota/{slug}` con `PageManager::registrarRutaDinamica()`
- [x] Configurar menú de navegación en `menu.php`
- [x] Configurar SEO defaults por página con `PageManager::setDefaultSeoMap()`
- [x] Registrar todas las islas en `appIslands.tsx`

### Fase 5 — Integración Stripe
- [x] Configurar claves Stripe en `.env` (puente .env → constantes Glory en environment.php)
- [x] Implementar creación de sesión Checkout con precio dinámico (price_data)
- [ ] Configurar webhook en dashboard de Stripe apuntando a `/wp-json/glory/v1/stripe/webhook`
- [x] Implementar handler: `checkout.session.completed` → confirmar reserva
- [x] Implementar handler: `payment_intent.payment_failed` → notificar fallo
- [ ] Testing completo con tarjetas de prueba de Stripe
- [ ] Migrar a claves de producción

### Fase 6 — Panel de administración
- [x] Opciones del tema editables desde el panel Glory (OpcionManager)
- [x] Crear metabox personalizado para gestión de reservas en wp-admin (`App/Admin/ReservaAdmin.php`)
- [x] Dashboard de reservas: listado con estado, fechas, vehículo, cliente, monto (columnas custom)
- [x] Opción de cambiar estado de reserva manualmente desde admin
- [x] Widget de dashboard con resumen de reservas (`App/Admin/DashboardWidget.php`)
- [x] Metabox de vehículos con formulario de datos completo (`App/Admin/VehiculoAdmin.php`)
- [ ] Export de reservas (opcional, CSV)

### Fase 7 — SEO y contenido
- [x] Configurar meta tags por página (title, description) via `setDefaultSeoMap()`
- [x] Implementar JSON-LD para negocio local (LocalBusiness schema en home)
- [x] Implementar JSON-LD para productos (vehículos como Product con offers)
- [x] BreadcrumbList JSON-LD en todas las páginas
- [x] Inyección de opciones en React via `ReactContext.php` + filtro `glory_react_context`
- [x] Registrar opciones legales: condiciones, privacidad, aviso legal, cookies
- [ ] Redactar contenido de texto para todas las páginas
- [ ] Redactar textos legales (RGPD, cookies, condiciones de alquiler)
- [ ] Optimizar imágenes (WebP, lazy loading)

### Fase 8 — Testing y lanzamiento
- [ ] Testing funcional completo del flujo de reserva
- [ ] Testing de responsive (mobile first)
- [ ] Testing con pagos reales en Stripe
- [ ] Performance audit (Lighthouse)
- [ ] Configurar dominio crestacampers.com en producción
- [ ] Certificado SSL
- [ ] Lanzamiento

---

## Notas técnicas

### Integración 100% WordPress (sin tablas extras)

Toda la información se almacena usando mecanismos nativos de WordPress:
- **Vehículos**: CPT `vehiculo` + `wp_postmeta` para cada atributo
- **Reservas**: CPT `reserva` + `wp_postmeta` para cada campo
- **Configuración**: `wp_options` vía `OpcionManager`
- **Formularios de contacto**: ya usa tabla custom en Glory (`glory_form_entries`) — esto es aceptable porque es funcionalidad del framework, no del proyecto
- **Calendarios/disponibilidad**: calculados en runtime consultando reservas existentes

### PostTypeSchema para validación de metas

Los schemas `VehiculoSchema` y `ReservaSchema` extienden `PostTypeSchema` de Glory, lo que proporciona:
- Definición formal de metas con tipos (`int`, `float`, `string`, `bool`, `json`)
- Validación de claves válidas
- Generación de tipos TypeScript automática
- Getters PHP tipados

### Stripe: pago único, no suscripciones

Para este proyecto se usa `StripeApiClient::post('/checkout/sessions')` con `price_data` dinámico (pago único, sin productos predefinidos en Stripe). Cada reserva es un pago independiente por el total de noches × precio, calculado server-side por `PrecioService`.

### Seguridad de la reserva

- Las reservas pendientes expiran a los 30 minutos (cron).
- El webhook de Stripe se verifica con HMAC-SHA256 (`StripeWebhookVerifier`).
- Los endpoints de creación de reserva validan disponibilidad server-side antes de crear la sesión de pago.
- No se confía en datos del frontend para calcular precios — todo se recalcula en el backend.

---

## Migración Tailwind → CSS propio (completado)

### Arquitectura CSS
- Entry point: `App/Assets/css/init.css` con 13 `@import`
- Cadena: variables → base → header → footer → componentes → home → paginas-base → paginas-vehiculo → paginas-reservar → paginas-contacto → galeria → calendario → resumen-precio
- Registrado en `assets.php` como `AssetManager::define('style', 'cresta-styles', '/App/Assets/css/init.css')`
- Tailwind deshabilitado en `control.php`: `GloryFeatures::disable('tailwind')`
- Todas las variables con prefijo `--cresta-` en `variables.css` (~140 líneas, 105+ tokens semánticos)

### Lecciones aprendidas
- [CSS]: Todas las variables en `variables.css` con prefijo `--cresta-`, nombres español camelCase. Incluye tokens alpha (blancoAlpha90-10, negroAlpha, primarioAlpha), estados (error, aviso), temporadas (tempBaja-Especial)
- [CSS]: `botonPrimario` y `botonSecundario` están en `home.css` pero se usan globalmente — considerar mover a `componentes.css`
- [CSS]: paginas.css (986 líneas) spliteado en 4: paginas-base, paginas-vehiculo, paginas-reservar, paginas-contacto (todos <300)
- [CSS]: galeria-calendario.css (440 líneas) spliteado en 3: galeria, calendario, resumen-precio (todos <200)
- [CSS]: Todos los rgba() hardcodeados reemplazados por variables semánticas en header.css, home.css, base.css
- [Header]: header.css usa clases directas (no parent-scoped). El componente aplica `cabeceraNavEnlaceClaro` etc. según estado
- [TS]: tsconfig tiene `noUnusedLocals` — variables con prefijo `_` tampoco pasan, hay que eliminar directamente
- [React]: Componentes UI atómicos en `App/React/components/ui/` (Boton, CampoTexto, CampoTextarea, CampoSelect, CampoFecha) — todo input/button debe usar estos
- [React]: Hooks de lógica separados: useContacto (form + empresa), useReservarFlujo (8 useState extraídos de ReservarIsland), useCalendarioDisponibilidad (4 useState + callbacks extraídos)
- [Vite]: Plugin @tailwindcss/vite eliminado. Solo plugin react(). Imports CSS con sintaxis `@import './file.css'` (no url())
- [Sentinel]: Todas las barras decorativas eliminadas de pages.php, componentes.css, environment.php, opcionesTema.php
- [Sentinel]: FQN inline eliminados de VehiculoController, StripeWebhookHandler, LimpiarReservasPendientes (usando use statements)
- [Sentinel]: BienvenidaIsland eliminado (código muerto del framework, no usado en Cresta Campers)
- [Sentinel]: ConfirmacionIsland fetch protegido con AbortController + timeout de 15s
- [Seed]: 3 vehículos en defaultContent.php — Cresta One (Madrid, 2p, 89€/noche, manual), Cresta Duo (Barcelona, 4p, 129€, automático), Cresta Pro (Sevilla, 2p premium, 149€, km ilimitados)

### TO-DO pendientes (post-migración)
- [x] Crear componentes UI atómicos: `Boton`, `CampoTexto`, `CampoTextarea`, `CampoSelect` en `components/ui/`
- [x] Splitear `paginas.css` (986→4 archivos <300 líneas)
- [x] Splitear `galeria-calendario.css` (440→3 archivos <200 líneas)
- [x] Reemplazar todos los rgba() hardcodeados con variables CSS semánticas
- [x] Eliminar barras decorativas de opcionesTema.php
- [x] Extraer hooks: useContacto, useReservarFlujo
- [x] Reescribir ContactoIsland, ReservarIsland, VehiculoDetalleIsland, ConfirmacionIsland con componentes atómicos
- [x] Reescribir Galeria (6 buttons), CalendarioDisponibilidad (3 buttons+hook), SelectorFechas (4 inputs), FlotaIsland (2 selects+1 button), HomeIsland (1 button+key fix), Header (1 button) con componentes atómicos
- [x] Limpiar barras decorativas en pages.php, componentes.css, environment.php
- [x] Extraer FQN inline en VehiculoController, StripeWebhookHandler, LimpiarReservasPendientes
- [x] AbortController+timeout en ConfirmacionIsland fetch
- [x] Eliminar BienvenidaIsland (código muerto)
- [x] Corregir VarSense: --cresta-radioMd, font-size hardcoded, gap 2px, border-radius 50%
- [ ] Mover `.botonPrimario`/`.botonSecundario` de `home.css` a `componentes.css`
- [ ] Redactar contenido de texto para todas las páginas
- [ ] Redactar textos legales (RGPD, cookies, condiciones)
- [ ] Testing responsive completo