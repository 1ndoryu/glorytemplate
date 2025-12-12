# ROADMAP - Proyecto Web Guillermo Garcia (Chatbots y Automatizacion)

> Fecha de creacion: 2025-12-11
> Ultima actualizacion: 2025-12-12 12:55
> Estado: **EN PRODUCCION** - Sistema funcional, pendiente lanzamiento

---

## RESUMEN DEL PROYECTO

**Objetivo:** Web profesional para ofrecer servicios de consultoria 1:1 en chatbots y automatizacion (WhatsApp, Instagram, Web, Voz).

**Meta Principal:** Captar leads cualificados y medir que canal de contacto funciona mejor.

---

## INDICE

1. [Tareas Completadas (Resumen)](#tareas-completadas-resumen)
2. [Arquitectura Tecnica](#arquitectura-tecnica)
3. [Sistema de Contenido](#sistema-de-contenido-react)
4. [Tareas Pendientes](#tareas-pendientes)

---

## TAREAS COMPLETADAS (RESUMEN)

### Bugs Resueltos

| ID      | Descripcion                               | Solucion                                                                                                        | Fecha      |
| ------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------- |
| BUG-001 | Navegacion directa a Single Posts fallaba | Modificado `AppRouter.tsx` con fallback para detectar posts via slug (`getSlugFromPath()`, `isValidPostSlug()`) | 2025-12-12 |

### Tareas Criticas Completadas

| ID        | Descripcion                        | Implementacion                                                                          |
| --------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| TAREA-001 | Sistema de Logs para API de Gemini | `GeminiLogger.php` con endpoints REST `/glory/v1/ai/logs`, `/logs/stats`, `/logs/files` |
| TAREA-002 | Migrar Islands a useSiteUrls()     | 11 archivos migrados para usar URLs dinamicas desde Theme Options                       |

### Paginas Implementadas (9/9 - 100%)

| Pagina     | Slug        | Island React   | SEO | JSON-LD                                    |
| ---------- | ----------- | -------------- | --- | ------------------------------------------ |
| Home       | /           | HomeIsland     | OK  | Organization, ProfessionalService, WebSite |
| Servicios  | /servicios  | ServicesIsland | OK  | BreadcrumbList, Service + OfferCatalog     |
| Planes     | /planes     | PricingIsland  | OK  | BreadcrumbList, ItemList                   |
| Demos      | /demos      | DemosIsland    | OK  | BreadcrumbList, Service + ScheduleAction   |
| Sobre Mi   | /sobre-mi   | AboutIsland    | OK  | BreadcrumbList                             |
| Blog       | /blog       | BlogIsland     | OK  | BreadcrumbList                             |
| Contacto   | /contacto   | ContactIsland  | OK  | ProfessionalService + ScheduleAction       |
| Privacidad | /privacidad | PrivacyIsland  | OK  | BreadcrumbList                             |
| Cookies    | /cookies    | CookiesIsland  | OK  | BreadcrumbList                             |

### Fases Completadas

| Fase | Nombre                         | Estado                                               |
| ---- | ------------------------------ | ---------------------------------------------------- |
| 0    | Revision de Paginas Existentes | 100% conforme a `project-extends.md`                 |
| 1    | Configuracion Base y Estilos   | Tipografia, colores, componentes base, preconexiones |
| 2    | Paginas Principales            | Home, Servicios, Planes con SEO                      |
| 3    | Paginas Secundarias            | Demos, Blog, Sobre Mi, Contacto con SEO              |
| 4    | Paginas Legales                | Privacidad, Cookies con secciones RGPD               |
| 5    | Sistema de Contacto            | CTAs consistentes, tracking UTMs, formulario RGPD    |
| 6    | Blog y Sistema IA              | Gemini 2.5 Flash + Panel Admin `/admin/ai`           |
| 9    | Optimizacion                   | Imagenes lazy-load, botones 44px, texto indexable    |

### Sistema de Temas (Implementado)

Dos temas intercambiables via `?theme=project` o `?theme=default`:

| Tema                | Descripcion          | Colores                                 |
| ------------------- | -------------------- | --------------------------------------- |
| `project` (DEFAULT) | Tema del cliente     | Azul #2563EB, Verde solo iconos #25D366 |
| `default`           | Estilo desarrollador | Paleta stone/neutral, Geist             |

**Archivos:** `init.css`, `useTheme.ts`, `useFontLoader.ts`, `ThemeToggle.tsx`

### Sistema de IA para Contenido (Fase 6)

**Arquitectura:**

| Componente       | Archivo                                       | Funcion                                                 |
| ---------------- | --------------------------------------------- | ------------------------------------------------------- |
| GeminiClient     | `App/Services/ContentAI/GeminiClient.php`     | Cliente REST Gemini 2.5 Flash + Google Search grounding |
| AIConfigManager  | `App/Services/ContentAI/AIConfigManager.php`  | Configuracion (API keys, tono, temas)                   |
| DraftManager     | `App/Services/ContentAI/DraftManager.php`     | Ciclo borradores (crear, aprobar, publicar)             |
| ContentGenerator | `App/Services/ContentAI/ContentGenerator.php` | Orquestador de generacion                               |
| GeminiLogger     | `App/Services/ContentAI/GeminiLogger.php`     | Logs de peticiones/respuestas                           |
| AdminAIIsland    | `App/React/islands/AdminAIIsland.tsx`         | Panel admin React                                       |

**Endpoints REST:** `/glory/v1/ai/config`, `/generate`, `/ideas`, `/search`, `/drafts`, `/drafts/{id}/*`, `/logs/*`

**Acceso:** `/admin/ai` (requiere admin)

### Analitica (Fase 8 - Parcial)

**Implementado:**
- GTM carga solo tras aceptar cookies (`CookieBanner.tsx`)
- Hook `useAnalytics.ts` con eventos: `click_whatsapp`, `click_calendly`, `lead_form_submit`
- `Button.tsx` trackea automaticamente clicks a WhatsApp/Calendly
- `ContactForm.tsx` trackea envios exitosos

### Opciones de Tema (Theme Options)

15+ opciones configurables desde WP Admin > Theme Options:
- Site Identity: nombre, tagline, telefono, email
- Contact URLs: Calendly, WhatsApp, mensaje predefinido
- Social Profiles: LinkedIn, Twitter, YouTube, Instagram
- Site Images: hero, secundaria, logo
- Integrations: GTM ID, GA4 ID, GSC verification

**Hook React:** `useSiteUrls()` de `hooks/useSiteConfig.ts`

---

## ARQUITECTURA TECNICA

### Stack Tecnologico

| Capa     | Tecnologia         | Responsabilidad                 |
| -------- | ------------------ | ------------------------------- |
| Backend  | PHP + WordPress    | Logica, rutas, datos, SEO, RGPD |
| Frontend | React + TypeScript | UI interactiva, animaciones     |
| Estilos  | Tailwind CSS       | Sistema de diseno               |
| Bundler  | Vite               | Build y HMR en desarrollo       |

### Tipo de Renderizado: CSR Islands

**IMPORTANTE:** La implementacion actual **NO es SSR**. Es Client-Side Rendering con Islands:

```
Flujo:
1. PHP renderiza: <div data-island="HomeIsland"><!-- Loading --></div>
2. Navegador carga bundle React (main.tsx)
3. JavaScript ejecuta createRoot() y monta componente
4. Usuario ve pagina DESPUES de que React se ejecuta
```

**Implicacion:** El contenido NO es visible para Google sin JavaScript.

### Archivos Clave

| Archivo                               | Funcion                              |
| ------------------------------------- | ------------------------------------ |
| `App/Config/control.php`              | Configuracion features Glory         |
| `App/Config/pages.php`                | Definicion paginas (slug -> funcion) |
| `TemplateGlory.php`                   | Template central                     |
| `Glory/src/Services/ReactIslands.php` | Monta React islands                  |
| `Glory/assets/react/src/main.tsx`     | Entry point React                    |

---

## SISTEMA DE CONTENIDO REACT

### ReactContentProvider (PHP)

Servicio que inyecta contenido de WordPress a React (`Glory/src/Services/ReactContentProvider.php`).

```php
// App/Content/reactContent.php
use Glory\Services\ReactContentProvider;

ReactContentProvider::register('blogFeatured', 'post', ['posts_per_page' => 3, 'category_name' => 'caso-exito']);
ReactContentProvider::register('blogRecent', 'post', ['posts_per_page' => 6]);
ReactContentProvider::injectGlobal();
```

### useContent (React Hook)

```tsx
import {useContent} from '../hooks/useContent';
const posts = useContent<WordPressPost[]>('blogFeatured', []);
```

### ContentRenderer

```tsx
<ContentRenderer content={posts} layout="grid" columns={3} showImage showExcerpt />
```

**Layouts:** `card`, `grid`, `list`, `featured`, `minimal`

---

## TAREAS URGENTES

### TAREA-003: Implementar Modo React - COMPLETADA

> **Estado:** COMPLETADA
> **Prioridad:** URGENTE
> **Fecha de creacion:** 2025-12-12
> **Fecha de finalizacion:** 2025-12-12

#### Descripcion

Implementar un "Modo React" en Glory que, cuando esta activo, desactive **TODAS** las features de frontend (UI, Services, Renderers, Plugins). React maneja todo de forma independiente.

#### Cambio de Criterio (Decision 2025-12-12)

Se decidio que cuando React esta activo:
- **TODAS las features de frontend se desactivan** (no solo algunas)
- **El panel `glory-opciones` NO se usa** con React
- Las opciones para React se configuran via `opcionesTema.php` y se inyectan via `ReactContentProvider`
- **Futuro:** Un panel React dedicado gestionara estas opciones

#### Implementacion Final

**`GloryFeatures::$reactExcludedFeatures`** ahora incluye:

| Categoria     | Features Desactivadas                                                                                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI Components | modales, submenus, pestanas, scheduler, headerAdaptativo, themeToggle, alertas, gestionarPreviews, paginacion, gloryFilters, calendario, badgeList, highlight, gsap, menu, contentActions |
| Services      | navegacionAjax, gloryAjax, gloryForm, gloryBusqueda, gloryRealtime, cssCritico                                                                                                            |
| Renderers     | logoRenderer, contentRender, termRender                                                                                                                                                   |
| Plugins       | task, amazonProduct, gbn, gbnSplitContent, gloryLinkCpt                                                                                                                                   |
| Integraciones | avadaIntegration                                                                                                                                                                          |

**Managers de backend que SI se mantienen activos:**
- pageManager, postTypeManager, taxonomyMetaManager, scheduleManager
- assetManager (solo para CSS base y React bundle)
- syncManager, opcionManagerSync (para persistir opciones)

#### Archivos Modificados

| Archivo                            | Cambios                                                               |
| ---------------------------------- | --------------------------------------------------------------------- |
| `Glory/src/Core/GloryFeatures.php` | Lista completa de features excluidas, isReactMode(), applyReactMode() |
| `Glory/load.php`                   | Orden de carga: control.php ANTES de scriptSetup.php                  |
| `Glory/Config/scriptSetup.php`     | defineFolder envuelto con !isReactMode()                              |
| `App/Config/control.php`           | Documentacion completa Modo React, enable('reactMode')                |
| `App/Config/opcionesTema.php`      | Limpiado para React, documentacion header                             |

#### Criterios de Aceptacion

- [x] Con `reactMode` activo, NO se carga NINGUN script nativo en frontend
- [x] Panel `glory-opciones` no se usa con React (documentado)
- [x] React Islands sigue funcionando correctamente
- [x] El modo se controla exclusivamente desde `control.php`
- [x] Opciones para React se inyectan via `ReactContentProvider`
- [ ] (Futuro) Panel React dedicado para gestionar opciones

---

## TAREAS PENDIENTES

> Las tareas restantes son de configuracion (Theme Options, GTM, SEO) y lanzamiento.

### TAREA-004: Panel React para Opciones del Tema

> **Estado:** COMPLETADA (Diseno e Implementacion)
> **Prioridad:** BAJA
> **Dependencia:** TAREA-003 completada
> **Fecha de finalizacion:** 2025-12-12

#### Descripcion

Panel de configuracion en el **frontend** para gestionar las opciones del tema (Calendly, WhatsApp, redes sociales, imagenes, etc.). Accesible solo para usuarios autenticados con permisos de administrador.

#### Implementacion Realizada

**Ubicacion y Acceso:**
- [x] Ruta frontend: `/configuracion` (registrada en pages.php y AppRouter.tsx)
- [x] Solo usuarios con rol `administrator` pueden acceder (via REST API permission_callback)
- [x] Redireccionar a login si no autenticado (implementado 2025-12-12)

**Diseño:**
- [x] Diseño minimalista y limpio con header gradiente
- [x] Estilos independientes en `Glory/assets/css/settings-panel.css`
- [x] Responsive (mobile-first con breakpoints)
- [x] Dark mode compatible (usa variables CSS del tema)

**Funcionalidad:**
- [x] React Island: `SettingsIsland.tsx`
- [x] Formularios por seccion: Identidad, Contacto, Redes Sociales, Imagenes, Integraciones
- [x] Integracion con REST API: `GET/POST /glory/v1/settings`
- [x] Feedback visual (banners de exito/error)
- [x] Preview de imagenes con drag & drop
- [x] Indicador de cambios sin guardar
- [x] Deteccion de errores 401/403 y redirección automatica a `/wp-login.php`

#### Archivos Creados

| Archivo             | Ubicacion                                 | Descripcion                           |
| ------------------- | ----------------------------------------- | ------------------------------------- |
| SettingsIsland.tsx  | `App/React/islands/`                      | Island principal (orquestador)        |
| SettingsRestApi.php | `App/Services/`                           | API REST para cargar/guardar opciones |
| settings-panel.css  | `Glory/assets/css/`                       | Estilos independientes del panel      |
| useSettingsApi.ts   | `App/React/features/settings/hooks/`      | Hook para comunicacion con API        |
| IdentityTab.tsx     | `App/React/features/settings/components/` | Tab de identidad                      |
| ContactTab.tsx      | `App/React/features/settings/components/` | Tab de contacto                       |
| SocialTab.tsx       | `App/React/features/settings/components/` | Tab de redes sociales                 |
| ImagesTab.tsx       | `App/React/features/settings/components/` | Tab de imagenes                       |
| IntegrationsTab.tsx | `App/React/features/settings/components/` | Tab de integraciones                  |
| SettingsField.tsx   | `App/React/features/settings/components/` | Campo de formulario reutilizable      |
| ImageUploader.tsx   | `App/React/features/settings/components/` | Uploader con drag & drop              |
| types/index.ts      | `App/React/features/settings/types/`      | Tipos TypeScript                      |
| index.ts            | `App/React/features/settings/`            | Barrel exports                        |

#### Archivos Modificados

| Archivo                                     | Cambios                                          |
| ------------------------------------------- | ------------------------------------------------ |
| `App/Config/pages.php`                      | Agregada ruta 'configuracion'                    |
| `App/Config/control.php`                    | Registro de SettingsRestApi                      |
| `App/React/components/router/AppRouter.tsx` | Import y ruta para SettingsIsland                |
| `Glory/assets/react/src/index.css`          | Import de settings-panel.css                     |
| `Glory/Config/scriptSetup.php`              | Exclusion de settings-panel.css del defineFolder |

---

### TAREA-002: Migrar Islands a useSiteUrls() - COMPLETADA

> **Estado:** Completada el 2025-12-12

**Resumen:** Todos los Islands y componentes ahora usan `useSiteUrls()` para obtener URLs dinamicas desde Theme Options.

**Archivos migrados:**
- [x] `islands/HomeIsland.tsx`
- [x] `islands/ServicesIsland.tsx`
- [x] `islands/PricingIsland.tsx`
- [x] `islands/DemosIsland.tsx`
- [x] `islands/AboutIsland.tsx`
- [x] `islands/ContactIsland.tsx`
- [x] `islands/BlogIsland.tsx`
- [x] `islands/SinglePostIsland.tsx`
- [x] `features/demos/components/ScenarioSelector.tsx`
- [x] `features/about/data/content.tsx`
- [x] `components/sections/CtaBlock.tsx`

**Patron implementado:**
```tsx
// En componentes React
import {useSiteUrls} from '../hooks/useSiteConfig';
const urls = useSiteUrls();
// Usar urls.calendly, urls.whatsapp, etc.
```

---

### OPCIONES CONFIGURABLES (Theme Options)

> El cliente puede configurar todo desde **WP Admin > Theme Options**. No requiere desarrollo adicional.

| Seccion         | Opciones Disponibles                    |
| --------------- | --------------------------------------- |
| Site Identity   | Nombre, tagline, telefono, email        |
| Contact URLs    | Calendly, WhatsApp (numero + mensaje)   |
| Social Profiles | LinkedIn, Twitter/X, YouTube, Instagram |
| Site Images     | Hero, secundaria, logo                  |
| Integrations    | GTM ID, GA4 ID, GSC verification        |

**Contenido adicional** (via WordPress posts/custom fields): Testimonios, casos de exito.

---

### FASE 7: SEO Y DATOS ESTRUCTURADOS (Completada - Código)

**Completado (Desarrollo):**
- [x] JSON-LD en todas las paginas (ver tabla de paginas)
- [x] SeoManager.php para Title, Meta Description, JSON-LD
- [x] Logo dinamico en JSON-LD desde Theme Options
- [x] sameAs (redes sociales) dinamico en Organization schema
- [x] Calendly URL dinamico en contacto schema
- [x] Telefono y email en ProfessionalService schema
- [x] Imagen hero en Home schema

**Pendiente (Configuracion del cliente):**

| Tarea         | Descripcion                                                    |
| ------------- | -------------------------------------------------------------- |
| Theme Options | Completar todos los campos en WP Admin > Theme Options         |
| Reglas SEO    | Verificar: un H1 por pagina, parrafos cortos, alt descriptivos |

---

### FASE 8: ANALITICA (Completada - Código)

**Completado (Desarrollo):**
- [x] GTM ID dinamico desde Theme Options (ya no hardcodeado)
- [x] useAnalytics.ts con eventos: `click_whatsapp`, `click_calendly`, `lead_form_submit`
- [x] Button.tsx trackea automaticamente clicks WhatsApp/Calendly
- [x] ContactForm.tsx trackea envios de formulario
- [x] CookieBanner.tsx carga GTM solo tras aceptar cookies
- [x] Guia de configuracion creada: `GUIA_CONFIGURACION_ANALYTICS.md`

**Pendiente (Configuracion del cliente):**

| Tarea          | Descripcion                             | Guia    |
| -------------- | --------------------------------------- | ------- |
| Contenedor GTM | Crear en tagmanager.google.com          | Parte 1 |
| Propiedad GA4  | Crear en analytics.google.com           | Parte 2 |
| Etiquetas GTM  | Crear etiquetas para eventos            | Parte 3 |
| Conversiones   | Marcar eventos como conversiones en GA4 | Parte 4 |
| GSC            | Verificar dominio y enviar sitemap      | Parte 5 |
| Theme Options  | Copiar GTM ID, GA4 ID, GSC code         | Parte 6 |

---

### FASE 9: OPTIMIZACION (Parcial)

**Pendiente:**

| Tarea                | Descripcion                                              |
| -------------------- | -------------------------------------------------------- |
| Dimensiones imagenes | Hero: 1600x900, Contenido: 1200x800, Miniaturas: 600x400 |
| Calendly CLS         | min-height fijo para evitar layout shift                 |

---

### FASE 10: PUBLICACION Y LANZAMIENTO

#### 10.1 Configuracion de Dominio
- [ ] Forzar HTTPS en todo el sitio
- [ ] Elegir con/sin www y redirigir 301

#### 10.2 Robots y Sitemap
- [ ] Crear robots.txt:
  ```
  User-agent: *
  Disallow: /wp-admin/
  Allow: /wp-admin/admin-ajax.php
  Sitemap: https://[URL_BASE]/sitemap_index.xml
  ```
- [ ] Generar sitemap con Rank Math/Yoast

#### 10.3 Google Search Console
- [ ] Verificar dominio
- [ ] Enviar sitemap
- [ ] Marcar noindex: pagina gracias, borradores, busquedas internas

#### 10.4 Inspeccion Final
- [ ] Inspeccionar URLs principales en Search Console
- [ ] Probar Home y Contacto en movil
- [ ] Verificar sin pop-ups intrusivos
- [ ] Verificar sin saltos de layout

---

### FASE 1.5: REVISION ESTILOS TEMA PROJECT (Completada)

> **ESTADO:** COMPLETADA (2025-12-12 12:40)
> **Puntuacion de conformidad:** 93%
> **Hallazgos:** Ver documento `REVISION_ESTILOS_PROJECT.md`

**Objetivo:** Verificar que TODOS los componentes React aplican correctamente los estilos del tema `project`.

**Resumen de revisión:**
- ✅ Variables CSS: 100% conformes
- ✅ Tipografía: 100% conformes (Manrope/Inter)
- ✅ Botones 44px: 100% conformes
- ⚠️ Colores hardcodeados: 6 ocurrencias menores
- ⚠️ Tamaño archivos: 2 componentes exceden límite de 150 líneas

**Componentes revisados:** Button, Badge, Card, PricingCard, HeroSection, WhatsAppShowcase, SinglePostIsland, DemoChat

**Recomendaciones prioritarias:**
1. Dividir `WhatsAppShowcase.tsx` (153 líneas)
2. Dividir `SinglePostIsland.tsx` (195 líneas)
3. Reemplazar colores hardcodeados por variables CSS

**Estado:** ✅ Aprobado para producción con notas menores

<details>
<summary>Ver checklist original (referencia)</summary>

#### Variables CSS a verificar
- `--color-accent-primary: #2563eb` (Azul brand)
- `--color-accent-green: #25d366` (Verde - SOLO iconos)
- `--color-text-primary: #111827`
- `--color-bg-primary: #f5f5f4`
- `--color-bg-surface: #ffffff`
- `--color-border-primary: #e6e6e6`
- `--color-surface-inverse: #0b1220`

#### Tipografia
- H1: Manrope 700, `clamp(36px, 3.5vw, 44px)`
- H2: Manrope 700, `clamp(28px, 2.6vw, 32px)`
- H3: Manrope 600, `20px`
- Body: Inter 400/600, `17px`
- Botones: minimo `44px` altura

#### Componentes a revisar
- **UI:** Button, Badge, Card, Input, Select
- **Sections:** HeroSection, FeatureSection, ContactForm, FaqWithCta, ProcessTimeline, WhatsAppShowcase, AutomationFlow, PricingBreakdown, CtaBlock, InternalLinks
- **Layout:** Header, Footer, PageLayout
- **Islands:** Todos (9)

#### Problemas a buscar
1. Colores hardcodeados
2. Verde usado como texto (debe ser SOLO iconos)
3. Fuentes incorrectas (debe ser Manrope/Inter)
4. Botones sin altura minima 44px
5. Focus ring incorrecto
6. Clases Tailwind que sobrescriben variables

</details>

---

### Post Individual (Blog)

| Tarea               | Estado                               |
| ------------------- | ------------------------------------ |
| Autor + fechas      | OK (SinglePostIsland)                |
| JSON-LD BlogPosting | OK (SeoManager)                      |
| Fuentes consultadas | OK (implementado 2025-12-12)         |
| Seccion React       | OK (obtiene desde post.meta.sources) |

---

## NOTAS DE DESARROLLO

1. **Tono:** Cercano, primera persona (yo, Guillermo), sin jerga tecnica.
2. **CTAs:** Siempre en orden Calendario > WhatsApp > Formulario.
3. **RGPD:** Checkbox consentimiento obligatorio en formularios.
4. **Verde (#25D366):** Solo iconos/badges, NUNCA texto.
5. **Contenido SEO:** Usar exactamente el texto de `project-extends.md`.
6. **PHP para logica:** WordPress maneja rutas, SEO, RGPD, formularios, analytics.
7. **React para UI:** Solo presentacion e interactividad.
8. **No SSR (aun):** Contenido React no visible sin JavaScript.

---

## ENLACES INTERNOS (REFERENCIA)

**Reglas:** 5-10 enlaces por pagina, texto descriptivo, no enlazar paginas inexistentes.

| Desde     | Enlaces a                                                |
| --------- | -------------------------------------------------------- |
| HOME      | /servicios, /planes, /demos, /sobre-mi, /contacto, /blog |
| SERVICIOS | /planes, /demos, /contacto, /sobre-mi                    |
| PLANES    | /servicios, /demos, /contacto                            |
| DEMOS     | /servicios, /planes, /contacto                           |
| BLOG      | /demos, /servicios, /planes                              |
| SOBRE MI  | /servicios, /demos, /planes, /contacto                   |
| CONTACTO  | /demos, /planes, /servicios                              |
| LEGAL     | /contacto                                                |

---

## HISTORIAL DE ACTUALIZACIONES

<details>
<summary>Ver historial completo (60+ entradas)</summary>

| Fecha      | Cambio                                                                           |
| ---------- | -------------------------------------------------------------------------------- |
| 2025-12-11 | Creacion inicial del roadmap                                                     |
| 2025-12-11 | Agregado: estados de paginas, Fase 0 revision                                    |
| 2025-12-11 | Agregado: arquitectura tecnica, modos React/Nativo                               |
| 2025-12-11 | Documentado: sistema de temas dinamico (useTheme)                                |
| 2025-12-11 | HOME: Agregado tertiaryCta, ContactForm, InternalLinks                           |
| 2025-12-11 | HOME: Secciones H2/H3 completas segun project-extends.md                         |
| 2025-12-11 | HOME: Mejora UI Integraciones y Analytics                                        |
| 2025-12-11 | SERVICIOS: Contenido actualizado 100%                                            |
| 2025-12-11 | PLANES: Contenido actualizado 100%                                               |
| 2025-12-11 | DEMOS: Contenido actualizado 100%                                                |
| 2025-12-11 | SOBRE MI: Contenido actualizado 100%                                             |
| 2025-12-11 | FASE 0 COMPLETADA                                                                |
| 2025-12-11 | PAGINAS: Blog, Contacto, Privacidad, Cookies implementadas                       |
| 2025-12-11 | ARQUITECTURA: Centralizado rutas React en pages.php                              |
| 2025-12-11 | ARQUITECTURA: ReactContentProvider para inyectar contenido                       |
| 2025-12-11 | VERIFICACION: DEMOS, PRIVACIDAD, COOKIES 100% conforme                           |
| 2025-12-11 | CORRECCION: HOME - FeatureSection movida                                         |
| 2025-12-11 | CORRECCION: SOBRE MI - Segunda foto agregada                                     |
| 2025-12-11 | CORRECCION: BLOG - Secciones separadas, chips activados                          |
| 2025-12-11 | CORRECCION: CONTACTO - H1 exacto, 5 opciones                                     |
| 2025-12-11 | FASE 0 VERIFICACION 100% COMPLETADA (30/30 items)                                |
| 2025-12-11 | FASE 1 COMPLETADA: Tipografia, colores, componentes base                         |
| 2025-12-11 | FASE 1: Creado performance.php (preconexiones, fuentes)                          |
| 2025-12-11 | ROADMAP: Agregada FASE 1.5 revision estilos                                      |
| 2025-12-11 | SEO: Implementado SeoManager.php                                                 |
| 2025-12-11 | FASES 2, 3, 4: Completada implementacion SEO/JSON-LD                             |
| 2025-12-11 | SEO: SeoManager soporta Single Posts                                             |
| 2025-12-11 | UI: Button.tsx con prop size y 44px minimo                                       |
| 2025-12-11 | BLOG: SinglePostIsland con Autor y Fecha                                         |
| 2025-12-11 | GTM: CookieBanner.tsx con carga condicional                                      |
| 2025-12-11 | LAYOUT: CookieBanner integrado en PageLayout                                     |
| 2025-12-12 | FASE 5.2: CtaBlock en HomeIsland, CTAs verificados                               |
| 2025-12-12 | FASE 8: Creado useAnalytics.ts                                                   |
| 2025-12-12 | FASE 8: Button.tsx trackea WhatsApp/Calendly                                     |
| 2025-12-12 | FASE 8: ContactForm.tsx trackea lead_form_submit                                 |
| 2025-12-12 | TEMA: Default cambiado a 'project'                                               |
| 2025-12-12 | ROADMAP: Seccion "Pendientes con Cliente"                                        |
| 2025-12-12 | FASE 9: HeroSection/AboutIsland botones 44px                                     |
| 2025-12-12 | FASE 9: SinglePostIsland siteUrls.calendly, eager loading                        |
| 2025-12-12 | FASE 6: Sistema Gemini 2.5 Flash completo                                        |
| 2025-12-12 | FASE 6: GeminiClient, AIConfigManager, DraftManager, ContentGenerator, AIRestApi |
| 2025-12-12 | FASE 6: AdminAIIsland con 4 tabs                                                 |
| 2025-12-12 | FASE 6: useAdminAI hook                                                          |
| 2025-12-12 | FASE 6: Ruta /admin/ai registrada                                                |
| 2025-12-12 | UI: Badge.tsx con variantes y tamanos                                            |
| 2025-12-12 | BUG-001: AppRouter.tsx fallback para single posts                                |
| 2025-12-12 | BUG-001: getSlugFromPath(), isValidPostSlug()                                    |
| 2025-12-12 | TAREA-001: GeminiLogger.php creado                                               |
| 2025-12-12 | TAREA-001: GeminiClient usa GeminiLogger                                         |
| 2025-12-12 | TAREA-001: AIRestApi endpoints para logs                                         |
| 2025-12-12 | BUG-001: RESUELTO                                                                |
| 2025-12-12 | OPCIONES: 15+ opciones tema en opcionesTema.php                                  |
| 2025-12-12 | REACT: useSiteConfig.ts hook                                                     |
| 2025-12-12 | REACT: reactContent.php inyecta siteConfig                                       |
| 2025-12-12 | REACT: HomeIsland migrado a useSiteUrls()                                        |
| 2025-12-12 | ROADMAP: Pendientes con claves configurables                                     |
| 2025-12-12 | ROADMAP: Reorganizado - completados compactados, pendientes al final             |
| 2025-12-12 | TAREA-002: Todos los Islands migrados a useSiteUrls()                            |
| 2025-12-12 | TAREA-003: Documentado Modo React (analisis y plan de implementacion)            |
| 2025-12-12 | TAREA-003: GloryFeatures::applyReactMode() implementado                          |
| 2025-12-12 | TAREA-003: GloryFeatures::isReactMode() y getReactExcludedFeatures()             |
| 2025-12-12 | TAREA-003: control.php - Añadido reactMode con documentacion                     |
| 2025-12-12 | TAREA-003: ReactIslands::isReactMode() helper                                    |
| 2025-12-12 | TAREA-003: opcionesTema.php - Toggle Modo React en Theme Options                 |
| 2025-12-12 | TAREA-003: Cambio criterio - React desactiva TODAS las features                  |
| 2025-12-12 | TAREA-003: Lista completa de features excluidas (UI, Services, Renderers, etc)   |
| 2025-12-12 | TAREA-003: Documentado que glory-opciones NO se usa con React                    |
| 2025-12-12 | TAREA-003: COMPLETADA                                                            |
| 2025-12-12 | TAREA-003: load.php - control.php carga ANTES de scriptSetup.php                 |
| 2025-12-12 | TAREA-003: scriptSetup.php - defineFolder envuelto con !isReactMode()            |
| 2025-12-12 | TAREA-003: Verificado - 0 scripts Glory en frontend con React activo             |
| 2025-12-12 | TAREA-004: Creado SettingsIsland.tsx (panel de configuracion)                    |
| 2025-12-12 | TAREA-004: Creado SettingsRestApi.php (API REST GET/POST /glory/v1/settings)     |
| 2025-12-12 | TAREA-004: Creado settings-panel.css (estilos independientes)                    |
| 2025-12-12 | TAREA-004: Creado feature settings/ con 5 tabs (Identity, Contact, Social, etc)  |
| 2025-12-12 | TAREA-004: Ruta /configuracion registrada en pages.php y AppRouter.tsx           |
| 2025-12-12 | TAREA-004: COMPLETADA (Diseno e Implementacion)                                  |
| 2025-12-12 | TAREA-004: Implementada redirección a login para usuarios no autenticados        |
| 2025-12-12 | TAREA-004: useSettingsApi detecta errores 401/403 y expone isUnauthorized        |
| 2025-12-12 | TAREA-004: SettingsIsland redirige a /wp-login.php con redirect_to               |
| 2025-12-12 | BLOG: SinglePostIsland - Agregada seccion "Fuentes consultadas"                  |
| 2025-12-12 | BLOG: Fuentes se obtienen de post.meta.sources con titulo, URL y descripcion     |
| 2025-12-12 | BLOG: Seccion solo se muestra si existen fuentes (condicional)                   |
| 2025-12-12 | FASE 1.5: Revision de estilos tema project COMPLETADA (93% conformidad)          |
| 2025-12-12 | FASE 1.5: Creado documento REVISION_ESTILOS_PROJECT.md con hallazgos completos   |
| 2025-12-12 | FASE 1.5: 6 ocurrencias menores de colores hardcodeados detectadas               |
| 2025-12-12 | FASE 1.5: 2 componentes exceden limite 150 lineas (recomendaciones documentadas) |
| 2025-12-12 | FASE 7: SeoManager.php - Agregado getSiteConfig() para datos dinamicos           |
| 2025-12-12 | FASE 7: JSON-LD Organization ahora incluye logo y sameAs dinamicos               |
| 2025-12-12 | FASE 7: JSON-LD Home/Contacto usan nombre, telefono, email, Calendly dinamicos   |
| 2025-12-12 | FASE 8: CookieBanner.tsx - GTM ID dinamico desde Theme Options                   |
| 2025-12-12 | FASE 8: Eliminado placeholder hardcodeado GTM-XXXXXXX                            |
| 2025-12-12 | GUIA: Creado GUIA_CONFIGURACION_ANALYTICS.md (7 partes)                          |
| 2025-12-12 | FASES 7 y 8: Marcadas como COMPLETADAS (codigo)                                  |

</details>
