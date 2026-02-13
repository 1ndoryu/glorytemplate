# Glory Framework — Plan Maestro de Refactorización v2.0

> Fecha: Febrero 2026
> Rama glorytemplate: `glory-react-logic` | Rama Glory: `glory-react`
> Objetivo: Glory = Framework TypeScript-first para WordPress como CMS

---

## 0. Visión y Filosofía

**Glory NO es un framework PHP que soporta React.**
**Glory ES un framework TypeScript/React que usa WordPress solo como CMS.**

PHP existe exclusivamente como puente mínimo entre WordPress y React. Nada de lógica de negocio en PHP, nada de templates PHP, nada de renderizado PHP. Si el backend manda algo, el frontend debe poder validarlo en tiempo real en el código — tipado fuerte end-to-end.

**Decisión definitiva:** No existe modo híbrido. No hay `reactMode`. React es el ÚNICO modo. Todo el código PHP que renderizaba frontend se ELIMINA, no se depreca. Ningún sitio usa modo híbrido, ningún sitio lo usará.

**Repositorios:**
- `1ndoryu/glorytemplate` — Tema WP, punto de entrada, configuración del proyecto
- `1ndoryu/Glory` (subcarpeta `/Glory`) — Framework core reutilizable

**Stack definitivo:**
| Capa | Tecnología | Rol |
|------|-----------|-----|
| CMS | WordPress + PHP 8+ | Solo datos, admin, REST API |
| PHP Bridge | Glory/src/ | Puente mínimo: registrar páginas, servir datos, SEO server-side |
| Frontend | React 18 + TypeScript 5.6 | TODO el UI, sin excepciones |
| Build | Vite 6 + HMR | Dev server + producción |
| Estilos | Tailwind CSS 4 (opcional, off por defecto) | Opt-in via feature flag |
| Componentes UI | shadcn/ui (opcional, off por defecto) | Opt-in via feature flag |
| Estado | Zustand | Estado global React |
| Linting | ESLint 9 + Prettier | Siempre activo |
| Tipado | TypeScript strict | No negociable |

---

## 1. Diagnóstico del Estado Actual

### 1.1 Problemas Críticos

#### PHP Legacy (TODO esto debe morir)
- [x] **`reactMode` como concepto:** No debería ser un toggle. React ES Glory, punto. `GloryFeatures::isReactMode()`, `$reactExcludedFeatures` (30+ features), `applyReactMode()` — todo esto es infraestructura para un modo híbrido que no existe
- [x] **30+ features PHP-frontend inútiles:** modales, submenus, pestanas, headerAdaptativo, themeToggle, alertas, paginacion, calendario, badgeList, highlight, gsap, navegacionAjax, gloryAjax, gloryForm, gloryBusqueda, cssCritico, logoRenderer, contentRender, termRender... NADA de esto se usa
- [x] **TemplateGlory.php (template híbrido):** Renderiza páginas con PHP. Muerto
- [x] **App/Templates/pages/:** Templates PHP (home.php, editor.php). Muertos
- [x] **GestorCssCritico.php (639 líneas):** Critical CSS para PHP frontend. Muerto
- [x] **AjaxNav.php, TemplateManager.php, TemplateRegistry.php:** Frontend PHP navigation/rendering. Muerto
- [x] **Critical CSS tools:** `Glory/tools/critical-css/`, `LocalCriticalCss.php`, `CriticalCssCommand.php` — Vite lo maneja

#### Código Muerto (nunca se usó)
- [x] **AnalyticsEngine.php:** Array math genérico sin uso
- [x] **ServidorChat.php:** WebSocket server — no es un framework de temas
- [x] **FormHandlerInterface.php:** Namespace incorrecto, sin implementaciones
- [x] **250+ imágenes hash-named en Glory/assets/images/colors/:** Basura
- [x] **Deps composer para chat:** `cboden/ratchet`, `react/http`, `evenement/*`
- [x] **CSS legacy App/Assets/css/:** task.css (935), header.css (416), home.css (242) — 1593 líneas inútiles

#### Archivos Gigantes (violan SRP, >300 líneas)
- [x] PageManager.php: 802 lineas
- [x] MenuManager.php: 796 lineas
- [x] AssetsUtility.php: 674 lineas
- [x] GestorCssCritico.php: 639 líneas (eliminado)
- [x] SeoFrontendRenderer.php: 599 líneas (dividido en MetaTagRenderer, OpenGraphRenderer, JsonLdRenderer + fachada)
- [x] MediaIntegrityService.php: 531 lineas
- [x] ManejadorGit.php: 433 lineas
- [x] AssetManager.php: 430 lineas

#### TypeScript/DX
- [ ] **Sin ESLint:** No hay config de calidad
- [ ] **Sin Prettier:** Formato inconsistente
- [ ] **Tipos inexistentes:** Solo editorjs.d.ts y styles.d.ts — WordPress devuelve datos sin tipar
- [ ] **Sin scaffolding:** Crear isla/componente es manual y propenso a errores
- [ ] **PHP manda datos que TS no puede validar:** `window.__GLORY_CONTENT__` es `any`

### 1.2 Lo Que Funciona Bien (conservar y potenciar)
- **ReactIslands.php + main.tsx:** Motor de islas sólido (hidratación/CSR)
- **ReactContentProvider.php:** Puente datos WP→React
- **PageManager.reactPage():** Registro declarativo de páginas
- **Sistema de opciones** (Registry → Repository → Manager): Bien estratificado
- **DefaultContent system:** Sincronización de contenido robusta
- **Vite config:** HMR, aliases, dedup
- **SEO backend** (SeoMetabox + SeoFrontendRenderer): SEO server-side funcional
- **REST API Controllers:** Images, PageBlocks, MCP, Newsletter — bien separados
- **GloryFeatures como sistema de flags:** El mecanismo es bueno, solo hay que limpiar el bagaje de reactMode

---

## 2. Inventario de Archivos — Decisiones

### 2.1 ELIMINAR (código muerto, frontend PHP, infraestructura híbrida)

| Archivo | Razón |
|---------|-------|
| **Frontend PHP (muerto)** | |
| `Glory/src/Services/GestorCssCritico.php` | 639 líneas de Critical CSS para PHP frontend |
| `Glory/src/Services/LocalCriticalCss.php` | Ejecuta Node para CSS crítico PHP |
| `Glory/src/Console/CriticalCssCommand.php` | WP-CLI para critical CSS |
| `Glory/src/Helpers/AjaxNav.php` | Navegación AJAX PHP — React maneja routing |
| `Glory/src/Manager/TemplateManager.php` | Escanea/resuelve templates PHP |
| `Glory/src/Utility/TemplateRegistry.php` | Registry de templates PHP |
| `Glory/tools/critical-css/` (directorio) | Penthouse/Puppeteer para CSS crítico |
| `TemplateGlory.php` | Template híbrido PHP — solo queda TemplateReact.php |
| `App/Templates/pages/home.php` | Template PHP de home |
| `App/Templates/pages/editor.php` | Template PHP de editor |
| **Código muerto** | |
| `Glory/src/Contracts/FormHandlerInterface.php` | Namespace incorrecto, 0 implementaciones |
| `Glory/src/Services/AnalyticsEngine.php` | Math genérico sin uso |
| `Glory/src/Services/ServidorChat.php` | WebSocket chat — fuera de scope |
| `Glory/assets/images/colors/` (~250 imgs) | Imágenes hash sin propósito |
| `App/Assets/css/task.css` | 935 líneas CSS de sistema inactivo |
| `App/Assets/css/header.css` | 416 líneas CSS de header PHP |
| `App/Assets/css/home.css` | 242 líneas CSS de home PHP |
| **Deps innecesarias** | |
| composer: `cboden/ratchet` | Solo para ServidorChat |
| composer: `react/http` | Solo para ServidorChat |
| composer: `evenement/*` | Dependencia de ratchet |
| **Infraestructura reactMode** | |
| `GloryFeatures::$reactExcludedFeatures` (array 30+) | No hay modo alternativo, sobra |
| `GloryFeatures::isReactMode()` | React no es un "modo", es el único camino |
| `GloryFeatures::applyReactMode()` | Desactivaba features PHP — ya no existen |
| `GloryFeatures::getReactExcludedFeatures()` | Panel hybrid — ya no existe |
| Toda la lógica `reactMode` en `isActive()` | Simplificar: si la feature no existe, no carga |
| `ExcepcionComandoFallido.php` | Solo para ManejadorGit si se elimina |

### 2.2 MANTENER Y REFACTORIZAR

| Archivo | Líneas | Acción |
|---------|--------|--------|
| `GloryFeatures.php` | 284 | **Simplificar radicalmente:** eliminar reactMode, $reactExcludedFeatures, isReactMode(), applyReactMode(). Solo queda enable/disable/isActive para features reales (tailwind, shadcn, stripe, etc.) |
| `PageManager.php` | 802 | Dividir en: `PageDefinition.php`, `PageTemplateInterceptor.php`, `PageSeoDefaults.php`. Eliminar todo lo de modo `code` PHP |
| `MenuManager.php` | 796 | Dividir en: `MenuDefinition.php`, `MenuSync.php`, `MenuNormalizer.php` |
| `AssetsUtility.php` | 674 | Dividir en: `AssetResolver.php`, `AssetImporter.php`, `AssetLister.php` |
| `SeoFrontendRenderer.php` | 599 | Dividir en: `MetaTagRenderer.php`, `OpenGraphRenderer.php`, `JsonLdRenderer.php` |
| `MediaIntegrityService.php` | 531 | Dividir en: `FeaturedImageRepair.php`, `GalleryRepair.php`, `ContentSanitizer.php` |
| `AssetManager.php` | 430 | Extraer `FolderScanner.php`. Eliminar integración con GestorCssCritico |
| `ManejadorGit.php` | 433 | Mover a `Glory/src/Tools/` |
| `Setup.php` | 170 | Simplificar: eliminar todas las referencias a reactMode y features PHP-frontend |

### 2.3 MANTENER COMO ESTÁ (core del framework)

| Archivo | Rol |
|---------|-----|
| `ReactIslands.php` | Motor de islas React |
| `ReactContentProvider.php` | Puente datos WP→React |
| `PageBlocksController.php` | API para page builder React |
| `ImagesController.php` | API de imágenes para React |
| `MCPController.php` | Flujo desarrollo con IA |
| `OpcionManager/Registry/Repository` | Sistema de opciones |
| `DefaultContent*` | Sincronización de contenido |
| `main.tsx` | Entry point React Islands |
| `vite.config.ts` | Build config |
| `TemplateReact.php` | Único template — 100% React |
| `SeoMetabox.php` | SEO admin — funcional |
| `SyncManager.php` | Sync admin bar (dividir si >300) |
| `BusquedaService.php` | Backend de búsqueda para React |
| `EventBus.php` | Bus de eventos para invalidación |
| `PostActionManager.php` | CRUD wrapper para posts |
| `TokenManager.php` | Seguridad API |
| `PerformanceProfiler.php` | Debug dev |
| `QueryProfiler.php` | Debug dev |
| `Services/Stripe/*` | Módulo opcional completo |
| `Services/Sync/*` | Sistema de sincronización |
| `Plugins/AmazonProduct/*` | Plugin independiente |

---

## 3. Plan de Ejecución — Fases

### FASE 1: Purga Total (Sprint 1)
> Objetivo: Eliminar todo el PHP-frontend, código muerto, y la infraestructura de reactMode. Sin piedad.

- [x] **1.1** Eliminar archivos muertos:
  - `AnalyticsEngine.php`, `ServidorChat.php`, `FormHandlerInterface.php`
  - `GestorCssCritico.php`, `LocalCriticalCss.php`, `CriticalCssCommand.php`
  - `AjaxNav.php`, `TemplateManager.php`, `TemplateRegistry.php`
  - `TemplateGlory.php`
  - `App/Templates/pages/home.php`, `App/Templates/pages/editor.php`
  - `Glory/tools/critical-css/` (directorio completo)
- [x] **1.2** Eliminar CSS legacy:
  - `App/Assets/css/task.css`, `App/Assets/css/header.css`, `App/Assets/css/home.css`
- [x] **1.3** Eliminar imágenes basura:
  - `Glory/assets/images/colors/` (directorio completo) 
- [x] **1.4** Limpiar composer.json:
  - Remover `cboden/ratchet`, `react/http` y dependencias asociadas
  - Ejecutar `composer update` para limpiar vendor/
- [x] **1.5** Purgar GloryFeatures.php:
  - Eliminar `$reactExcludedFeatures` (array completo de 30+ features)
  - Eliminar `isReactMode()` 
  - Eliminar `applyReactMode()`
  - Eliminar `getReactExcludedFeatures()`
  - Eliminar el bloque de `isActive()` que chequea reactMode
  - Eliminar `ExcepcionComandoFallido.php` si ManejadorGit se mueve
- [x] **1.6** Simplificar Setup.php:
  - Eliminar todas las condicionales de reactMode
  - Eliminar carga de features PHP-frontend
- [x] **1.7** Simplificar control.php:
  - Eliminar `GloryFeatures::enable('reactMode')` — ya no es un toggle
  - Solo features reales: pageManager, assetManager, logger, etc.
- [x] **1.8** Simplificar load.php:
  - Eliminar carga condicional innecesaria
- [x] **1.9** Commit: `refactor: purga total — eliminar modo híbrido, PHP frontend, y código muerto`
- [x] **1.10** Documentación viva (fase 1):
  - Actualizar `Glory/readme.md` y `README.md` con lo eliminado en esta fase
  - Agregar changelog de migración: "qué se eliminó" y "por qué"
  - Registrar breaking changes en una sección "Migración"

### FASE 2: Tooling TypeScript Completo (Sprint 1)
> Objetivo: ESLint, Prettier, Tailwind formal, shadcn/ui — DX profesional desde el día 1

- [x] **2.1** Configurar ESLint 9 (flat config) en `Glory/assets/react/`:
  - `eslint.config.js`
  - Plugins: `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
  - Reglas: `no-explicit-any` (warn), `consistent-type-imports`, `no-console`
  - Integrar `eslint-config-prettier` para no conflictar con Prettier
- [x] **2.2** Configurar Prettier:
  - `.prettierrc`: singleQuote, trailingComma: 'all', semi: true, printWidth: 100
- [x] **2.3** Configurar Tailwind CSS 4:
  - Feature flag: `GloryFeatures::enable/disable('tailwind')` (off por defecto)
  - Tailwind v4 integrado como plugin Vite (`@tailwindcss/vite`)
  - Entry CSS condicional: solo importa Tailwind si el flag está activo
- [x] **2.4** Preparar shadcn/ui:
  - Feature flag: `GloryFeatures::enable/disable('shadcnUI')` (off por defecto)
  - Directorio `Glory/assets/react/src/components/ui/` creado
- [x] **2.5** Scripts npm en package.json (raíz + Glory/assets/react/):
  - `lint` / `lint:fix` / `format` / `format:check` / `type-check`
- [x] **2.6** Commit: `feat: ESLint 9 + Prettier + Tailwind (opt-in) + shadcn/ui (opt-in)`
- [x] **2.7** Documentación viva (fase 2):
  - Documentar instalación y uso de lint/format/type-check
  - Documentar activación de Tailwind y shadcn via flags

### FASE 3: Sistema de Tipos WP→TypeScript (Sprint 2)
> Objetivo: Que el frontend pueda validar en tiempo real todo lo que viene del backend. Cero `any`.

- [x] **3.1** Tipos base en `Glory/assets/react/src/types/`:
  - `wordpress.ts` — WPPost, WPPage, WPMenu, WPMenuItem, WPMedia, WPUser, WPTaxonomy, WPTerm
  - `glory.ts` — GloryContent, GloryIslandProps, GloryPageConfig, GloryOption
  - `api.ts` — Tipos de respuesta para cada endpoint /glory/v1/*
  - `pageBuilder.ts` — BlockDefinition, BlockInstance, PageLayout
- [x] **3.2** Tipar `window.__GLORY_CONTENT__`:
  - Interface `GloryContentMap` estricta
  - Declaración global en `glory.ts`
  - Hacer que ReactContentProvider.php sirva datos conformes al tipo
- [x] **3.3** Hook tipado `useGloryContent<T>()`:
  - Acceso tipado con genéricos
  - Error claro si los datos no coinciden con el tipo esperado
- [x] **3.4** Hook `useWordPressApi<TResponse>()`:
  - Fetch wrapper con autenticación (nonce)
  - Tipos genéricos para request/response
  - Manejo de errores tipado
  - Cache con stale-while-revalidate
- [ ] **3.5** Generador automático de tipos:
  - Endpoint PHP: `GET /glory/v1/schema` — expone estructura de CPTs, meta fields, opciones
  - Script: `scripts/generateTypes.ts` — consume endpoint y genera `.d.ts`
  - Comando: `npm run types:generate`
- [x] **3.6** Tipar registry de islas:
  - `IslandRegistry` como tipo en glory.ts
  - Cada isla exporta su interface de props
- [x] **3.7** Commit: `feat: sistema de tipos WP→TS — cero any, validación en tiempo real`
- [x] **3.8** Documentación viva (fase 3):
  - Guía de tipado WP→TS
  - Guía de uso de `useGloryContent<T>()` y `useWordPressApi<T>()`

### FASE 4: Refactorización PHP — Archivos Grandes (Sprint 2-3)
> Objetivo: Todos los archivos PHP bajo 300 líneas, SRP estricto

- [x] **4.1** Dividir `PageManager.php` (802 → 95 líneas, fachada):
  - `PageDefinition.php` (246 l) — define(), reactPage(), registerReactFullPages()
  - `PageTemplateInterceptor.php` (80 l) — intercepción de templates WP
  - `PageSeoDefaults.php` (60 l) — SEO defaults por página
  - `PageProcessor.php` (215 l) — CRUD, creación/actualización de páginas
  - `PageReconciler.php` (115 l) — reconciliación de páginas obsoletas
- [x] **4.2** Dividir `MenuManager.php` (796 → 145 líneas, fachada):
  - `MenuDefinition.php` (161 l) — definición de menús por código
  - `MenuSync.php` (268 l) — sincronización con DB
  - `MenuNormalizer.php` (199 l) — normalización de placeholders y URLs
- [x] **4.3** Dividir `AssetsUtility.php` (674 → 85 líneas, fachada):
  - `AssetResolver.php` (169 l) — resolución flexible de paths
  - `AssetImporter.php` (289 l) — importación a Media Library
  - `AssetLister.php` (205 l) — listado y selección de assets
- [x] **4.4** Dividir `SeoFrontendRenderer.php` (599 líneas):
  - `MetaTagRenderer.php` — title, description, canonical, helpers compartidos (~175 líneas)
  - `OpenGraphRenderer.php` — OG + Twitter Cards (~95 líneas)
  - `JsonLdRenderer.php` — JSON-LD schemas FAQ, Breadcrumb, Organization, Article (~250 líneas)
  - `SeoFrontendRenderer.php` — fachada delegadora (~55 líneas)
- [x] **4.5** Dividir `MediaIntegrityService.php` (531 → 33 líneas, orquestador):
  - `FeaturedImageRepair.php` (287 l)
  - `GalleryRepair.php` (131 l)
  - `ContentSanitizer.php` (99 l)
- [x] **4.6** Dividir `AssetManager.php` (389 → 279 líneas):
  - Extraer `FolderScanner.php` (63 l) como helper
  - Integración con GestorCssCritico ya eliminada en Phase 1
- [x] **4.7** Mover `ManejadorGit.php` (432 → 249 líneas) a `Glory/src/Tools/`
  - Extraer `GitCommandRunner.php` (76 l) para ejecución de comandos CLI
- [x] **4.8** Commit: `refactor: dividir archivos PHP — SRP estricto, max 300 líneas`
- [x] **4.9** Documentación viva (fase 4):
  - Mapa de clases nuevas por responsabilidad
  - Tabla "antes/después" para facilitar mantenimiento

### FASE 5: Arquitectura React Definitiva (Sprint 3)
> Objetivo: Hooks, providers, lazy loading, error boundaries — framework React de verdad

- [x] **5.1** Estructura de directorios React:
  ```
  Glory/assets/react/src/
  ├── core/                    # Engine del framework
  │   ├── IslandRegistry.ts    # Registry tipado de islas
  │   ├── GloryProvider.tsx    # Context global (content, options, user)
  │   ├── hydration.ts         # Lógica de mount/hydrate
  │   └── ErrorBoundary.tsx    # Error boundary por isla
  ├── hooks/                   # Hooks del framework
  │   ├── useGloryContent.ts   # Acceso tipado a content WP
  │   ├── useGloryOptions.ts   # Opciones del tema
  │   ├── useWordPressApi.ts   # Fetch wrapper tipado
  │   ├── useGloryMedia.ts     # Acceso a imágenes vía API
  │   └── useIslandProps.ts    # Props de la isla actual
  ├── components/
  │   └── ui/                  # shadcn/ui (auto-generados, opt-in)
  ├── types/                   # Tipos compartidos WP + Glory
  ├── utils/                   # Utilidades TS
  ├── islands/                 # Islas de ejemplo del framework
  ├── pageBuilder/             # Page Builder system
  └── styles/                  # Estilos base
  ```
- [x] **5.2** Crear hooks core del framework:
  - `useGloryContent<T>()` — genéricos, validación runtime
  - `useGloryOptions()` — opciones del tema reactivas
  - `useWordPressApi<T>()` — fetch con auth, tipos, cache
  - `useGloryMedia(alias)` — imágenes vía /glory/v1/images
  - `useIslandProps<T>()` — props tipados de la isla actual
- [x] **5.3** GloryProvider:
  - Context con datos globales inyectados desde PHP
  - Wrapper automático de cada isla en main.tsx
  - DevTools: overlay de debug (nombre isla, props, renders)
- [x] **5.4** Mejorar sistema de islas:
  - Lazy loading: `React.lazy()` + `Suspense` por isla
  - Error boundaries individuales con UI de fallback
  - Registro tipado: error de compilación si props no coinciden
- [x] **5.5** Commit: `feat: arquitectura React — hooks, providers, lazy loading, error boundaries`
- [x] **5.6** Documentación viva (fase 5):
  - Guía de arquitectura de islas
  - Guía de providers y hooks core
  - Ejemplos de error boundaries y lazy loading

### FASE 6: CLI de Scaffolding (Sprint 4)
> Objetivo: `glory create island MiIsla` genera todo automáticamente

- [ ] **6.1** Script CLI en Node.js: `npx glory create`
  - `glory create island <Nombre>` — .tsx + .css + registro en appIslands.tsx
  - `glory create page <nombre>` — isla + registro en pages.php
  - `glory create component <Nombre>` — componente en App/React/components/
  - `glory create hook <nombre>` — hook en App/React/hooks/
- [ ] **6.2** Templates de scaffolding con tipos:
  - Isla: interface de props + componente + CSS + export
  - Página: isla + registro PHP con SEO defaults
  - Componente: interface de props + componente atómico
  - Hook: función con tipos de retorno
- [ ] **6.3** Commit: `feat: CLI scaffolding — glory create island/page/component/hook`
- [ ] **6.4** Documentación viva (fase 6):
  - Manual del CLI con ejemplos reales
  - Tabla de comandos y parámetros

### FASE 7: Instalador Tipo Laravel (Sprint 4)
> Objetivo: Instalación guiada del proyecto con una sola experiencia, soporte nativo Windows y Linux.

- [ ] **7.1** Diseñar comando de instalación único:
  - `glory new <nombre-proyecto>` (inspirado en Laravel)
  - Genera estructura base lista para WordPress + React + TypeScript
- [ ] **7.2** Implementar instalador cross-platform:
  - Script Node.js principal (`bin/glory.js`)
  - Soporte Windows (PowerShell/CMD)
  - Soporte Linux (bash/sh)
- [ ] **7.3** Flujo del instalador:
  - Validar prerequisitos (Node, npm, PHP, Composer, WP local)
  - Clonar/copiar plantilla oficial
  - Instalar dependencias (`composer install`, `npm install`)
  - Configurar `.env` inicial
  - Configurar flags iniciales (`tailwind`, `shadcnUI`)
- [ ] **7.4** Modos del instalador:
  - `--minimal` (solo React + TS + ESLint)
  - `--tailwind`
  - `--shadcn` (implica tailwind)
  - `--with-stripe` (opcional)
- [ ] **7.5** Post-instalación automática:
  - Crear primera isla de ejemplo
  - Validar `type-check` y `lint`
  - Mostrar checklist final de arranque
- [ ] **7.6** Commit: `feat: instalador glory new cross-platform (windows/linux)`
- [ ] **7.7** Documentación viva (fase 7):
  - Guía rápida de instalación para Windows
  - Guía rápida de instalación para Linux
  - Troubleshooting por plataforma

### FASE 8: Documentación (Sprint 4)
> Objetivo: README profesional, docs que explican la filosofía

- [ ] **8.1** Reescribir `Glory/readme.md`:
  - Filosofía: WordPress como CMS, TypeScript como lenguaje, React como UI
  - Quick start (5 minutos): instalar, crear isla, ver en browser
  - Arquitectura: diagrama WP ← PHP Bridge → React Islands
  - Guía: Crear tu primera isla
  - Guía: Registrar una página React
  - API Reference: hooks, tipos, providers
  - Feature flags: Tailwind, shadcn, Stripe, etc.
- [ ] **8.2** Reescribir `glorytemplate/README.md`:
  - Setup del tema
  - Estructura App/ vs Glory/
  - Workflow de desarrollo
- [ ] **8.3** Consolidar documentación incremental de todas las fases en versión final
- [ ] **8.4** Commit: `docs: README reescrito — filosofía TS-first, guías, API reference`

---

## 4. Arquitectura Objetivo

### 4.1 Principio Fundamental

```
WordPress (CMS)  ──solo datos──>  PHP Bridge (mínimo)  ──tipado──>  React (todo el UI)
     |                                  |                                |
  Admin panel                    REST API + SEO               Islas + Componentes
  Contenido                      Registrar páginas            Hooks tipados
  Media Library                  Servir datos JSON            Validación runtime
  Users/Auth                     Meta tags server-side        Zustand state
```

**Regla de oro:** Si puedes hacerlo en TypeScript, hazlo en TypeScript. PHP solo para lo que WordPress OBLIGA que sea PHP (registrar post types, servir HTML inicial, SEO meta tags, REST endpoints).

### 4.2 Flujo de Ejecución

```
WordPress
    │
    ├── functions.php → Composer Autoload → Glory/load.php
    │
    ├── Glory/Core/Setup.php (Bootstrap)
    │   ├── GloryFeatures (flags: tailwind, shadcn, stripe...)
    │   ├── PageManager (registrar páginas React)
    │   ├── OpcionManager (configuración del tema)
    │   ├── REST API Controllers (datos para React)
    │   ├── SEO Renderer (meta tags server-side)
    │   └── DefaultContent (sincronizar contenido)
    │
    ├── TemplateReact.php (ÚNICO template)
    │   └── <div data-island="..." data-props="{...tipado...}">
    │
    └── Vite
        ├── main.tsx
        │   ├── Busca [data-island] en DOM
        │   ├── Importa isla del registry tipado
        │   ├── Valida props contra interface
        │   ├── Envuelve en GloryProvider
        │   └── Monta con createRoot o hydrateRoot
        │
        └── React Islands (TypeScript strict, 0 any)
```

### 4.3 Estructura de Directorios

```
glorytemplate/
├── App/                          # Proyecto específico
│   ├── Config/                   # pages.php, control.php, assets.php, env
│   ├── Content/                  # defaultContent.php, postType.php
│   ├── Helpers/                  # Helpers PHP mínimos
│   ├── React/                    # Código React del proyecto
│   │   ├── islands/              # Islas del proyecto
│   │   ├── components/           # Componentes del proyecto
│   │   ├── hooks/                # Hooks del proyecto
│   │   ├── styles/               # CSS del proyecto
│   │   ├── types/                # Tipos del proyecto
│   │   └── appIslands.tsx        # Registry de islas
│   └── Assets/                   # Fuentes, imágenes estáticas
│
├── Glory/                        # Framework core
│   ├── src/                      # PHP Bridge mínimo
│   │   ├── Admin/                # Panel de admin WP
│   │   ├── Api/                  # REST API controllers
│   │   ├── Core/                 # Setup, GloryFeatures, Options, Logger
│   │   ├── Manager/              # PageManager, MenuManager, AssetManager, etc.
│   │   ├── Repository/           # Repositorios de datos
│   │   ├── Seo/                  # SEO server-side (meta, OG, JSON-LD)
│   │   ├── Services/             # Sync, Search, Stripe, Git
│   │   ├── Tools/                # ManejadorGit, DevOps
│   │   └── Utility/              # Assets, Images, Email, User
│   ├── assets/
│   │   ├── react/                # Motor React del framework
│   │   │   ├── src/
│   │   │   │   ├── core/         # Islands engine, providers, hydration
│   │   │   │   ├── hooks/        # useGloryContent, useWordPressApi, etc.
│   │   │   │   ├── components/ui/# shadcn/ui (opt-in)
│   │   │   │   ├── types/        # Tipos WP + Glory (generados + manuales)
│   │   │   │   ├── utils/        # Utilidades TS
│   │   │   │   ├── islands/      # Islas de ejemplo
│   │   │   │   └── pageBuilder/  # Page Builder
│   │   │   ├── vite.config.ts
│   │   │   ├── tsconfig.json
│   │   │   ├── eslint.config.js
│   │   │   └── .prettierrc
│   │   ├── css/                  # CSS admin (panel, profiler)
│   │   └── images/               # Imágenes framework
│   └── Config/
│
├── functions.php                 # Bootstrap WP
├── TemplateReact.php             # ÚNICO template
├── header.php / footer.php       # HTML shell mínimo
├── style.css                     # Metadata WP
├── package.json                  # Scripts raíz
├── composer.json                 # Deps PHP (mínimas)
└── glory-plan.md                 # Este archivo
```

### 4.4 Feature Flags (simplificado)

```php
/* En App/Config/control.php */

/* Core managers — siempre activos */
GloryFeatures::enable('pageManager');
GloryFeatures::enable('assetManager');
GloryFeatures::enable('gloryLogger');
GloryFeatures::enable('defaultContentManager');
GloryFeatures::enable('postTypeManager');
GloryFeatures::enable('postThumbnails');

/* Opt-in features */
GloryFeatures::disable('tailwind');        // Tailwind CSS
GloryFeatures::disable('shadcnUI');        // shadcn/ui (activa Tailwind automáticamente)
GloryFeatures::disable('pageBuilder');     // Page Builder visual
GloryFeatures::disable('stripe');          // Stripe integration
GloryFeatures::disable('amazonProduct');   // Plugin Amazon
GloryFeatures::disable('menu');            // MenuManager
GloryFeatures::disable('queryProfiler');   // Debug SQL
```

No hay `reactMode`. No hay lista de `reactExcludedFeatures`. No hay 30+ features PHP-frontend que desactivar. Solo existen las features que realmente sirven.

---

## 5. Decisiones Técnicas

### 5.1 ¿Por qué React Islands y no SPA completa?
- WordPress controla el routing para SEO server-side (meta tags, JSON-LD)
- SSG prerendering funciona por isla individual
- Cada página puede tener su propia isla con props tipados
- No necesitamos React Router — WordPress ya hace routing

### 5.2 ¿Por qué Tailwind off por defecto?
- Muchos proyectos prefieren CSS puro o CSS variables
- Tailwind agrega overhead de build
- shadcn/ui depende de Tailwind — activar shadcn activa Tailwind automáticamente
- Es un feature flag, no una decisión permanente

### 5.3 ¿Por qué eliminar todo el PHP legacy en vez de deprecar?
- **Ningún sitio usa modo híbrido** — no hay migración que proteger
- **No habrá sitios híbridos** — la decisión es definitiva
- El código deprecado genera ruido, confusión, y hace que `GloryFeatures` sea innecesariamente complejo
- 30+ features PHP-frontend en `$reactExcludedFeatures` son peso muerto que ensucia cada `isActive()` call
- Eliminar es más seguro que deprecar: código eliminado no puede causar bugs
- Si algún día se necesita (no va a pasar), está en el historial de Git

### 5.4 TypeScript como lengua franca
- `window.__GLORY_CONTENT__` tiene interface estricta, no `any`
- Props de islas son interfaces exportadas — error de compilación si no coinciden
- `useWordPressApi<T>()` tipado end-to-end
- Generador automático: CPTs de WordPress → interfaces TypeScript
- **Objetivo DX:** Si PHP manda un campo nuevo, TypeScript grita hasta que tipas el campo en el frontend. Si el frontend espera un campo, TypeScript grita hasta que PHP lo envía. Validación bidireccional en tiempo de compilación.

### 5.5 Filosofía de PHP en Glory
PHP en Glory tiene UN solo propósito: ser el traductor entre lo que WordPress necesita nativamente (hooks, filters, templates) y lo que React consume (JSON tipado). Cualquier lógica que pueda vivir en TypeScript, DEBE vivir en TypeScript:
- Validación de formularios → TypeScript (Zod)
- Estado de la aplicación → TypeScript (Zustand)
- Renderizado → TypeScript (React)
- Routing UI → TypeScript (props de isla)
- Animaciones → TypeScript (Framer Motion / CSS)
- Fetch de datos → TypeScript (useWordPressApi)

PHP solo hace:
- `register_post_type()`, `add_theme_support()` — WordPress obliga
- REST API endpoints — servir JSON
- SEO meta tags — deben estar en el HTML inicial para crawlers
- Registrar páginas con `PageManager::reactPage()` — mapear URL → isla React

---

## 6. Orden de Prioridad

| # | Fase | Impacto | Esfuerzo | Por qué primero |
|---|------|---------|----------|-----------------|
| 1 | Fase 1: Purga | Muy alto | Bajo | Elimina ruido, simplifica todo lo demás |
| 2 | Fase 2: Tooling TS | Alto | Medio | DX inmediato, calidad desde el día 1 |
| 3 | Fase 3: Tipos WP→TS | Muy alto | Alto | Core de la propuesta: validación en tiempo real |
| 4 | Fase 4: Dividir PHP | Alto | Alto | Mantenibilidad del bridge |
| 5 | Fase 5: Arquitectura React | Muy alto | Alto | Valor del framework como producto |
| 6 | Fase 6: CLI | Medio | Medio | DX avanzado |
| 7 | Fase 7: Instalador | Muy alto | Medio | Onboarding inmediato (Windows/Linux) |
| 8 | Fase 8: Docs | Alto | Medio | Adopción + consolidación final |

---

## 7. Métricas de Éxito

- [ ] 0 archivos PHP > 300 líneas
- [ ] 0 referencias a `reactMode` en todo el codebase
- [ ] 0 features PHP-frontend en GloryFeatures
- [ ] 0 `any` en código TypeScript (ESLint `no-explicit-any: error`)
- [ ] 100% de props de islas tipados con interfaces
- [ ] `window.__GLORY_CONTENT__` tipado, no `any`
- [ ] `npm run type-check` pasa sin errores
- [ ] `npm run lint` pasa sin errores
- [ ] `npm run build` genera bundles de producción
- [ ] `glory create island MiIsla` funciona end-to-end
- [ ] `glory new mi-proyecto` funciona en Windows y Linux
- [ ] README permite setup funcional en < 5 minutos
- [ ] La documentación se actualiza al cierre de cada fase (no solo al final)

---

## 8. Extras (futuro, no bloquean)

- **Vitest:** Tests unitarios para hooks y componentes
- **Storybook:** Catálogo visual de componentes
- **CI/CD:** GitHub Actions: lint + type-check + build en cada PR
- **Turborepo:** Si Glory crece a múltiples paquetes
- **i18n:** react-intl o similar

---

## ESTADO DEL PLAN

| Fase | Estado | Notas |
|------|--------|-------|
| Fase 1: Purga Total | Completada | Eliminado modo hibrido, PHP frontend, codigo muerto |
| Fase 2: Tooling TS | Completada | ESLint + Prettier + Tailwind/shadcn opt-in |
| Fase 3: Tipos WP->TS | Completada | Tipos base, hooks tipados (3.5 diferido) |
| Fase 4: Dividir PHP | Completada | 7 archivos divididos, 22 archivos resultantes, todos <300 lineas |
| Fase 5: Arquitectura React | Completada | core/, hooks, GloryProvider, lazy loading, error boundaries |
| Fase 6: CLI Scaffolding | Pendiente | DX avanzado |
| Fase 7: Instalador | Pendiente | Comando `glory new` (Windows/Linux) |
| Fase 8: Documentacion | Pendiente | README + guias + consolidacion incremental |

