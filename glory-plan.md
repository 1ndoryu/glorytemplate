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

## 1. Resumen de Fases Completadas (1-9)

<details>
<summary>Fase 1: Purga Total — COMPLETADA</summary>

Eliminados 15+ archivos PHP de frontend híbrido (`GestorCssCritico`, `ServidorChat`, `AnalyticsEngine`, `TemplateManager`, `AjaxNav`, etc.), 30+ features PHP-frontend de `GloryFeatures`, toda la infraestructura `reactMode`, 1593 líneas de CSS legacy, 250+ imágenes basura, y dependencias composer de WebSocket (`cboden/ratchet`, `react/http`). Simplificados `Setup.php`, `GloryFeatures.php`, `control.php`, `load.php`.
</details>

<details>
<summary>Fase 2: Tooling TypeScript — COMPLETADA</summary>

ESLint 9 flat config + Prettier + Tailwind CSS 4 (opt-in via feature flag) + shadcn/ui (opt-in). Scripts `lint`/`format`/`type-check` en package.json.
</details>

<details>
<summary>Fase 3: Sistema de Tipos WP→TS — COMPLETADA (3.5 diferido)</summary>

Tipos base: `wordpress.ts`, `glory.ts`, `api.ts`, `pageBuilder.ts`. Hooks tipados: `useGloryContent<T>()`, `useWordPressApi<T>()`. `window.__GLORY_CONTENT__` con interface estricta. Registry de islas tipado. **Pendiente 3.5:** generador automático de tipos (`GET /glory/v1/schema` → `.d.ts`).
</details>

<details>
<summary>Fase 4: Dividir PHP — COMPLETADA</summary>

7 archivos divididos → 22 resultantes, todos <300 líneas:
- `PageManager` (802→95 fachada) → `PageDefinition`, `PageTemplateInterceptor`, `PageSeoDefaults`, `PageProcessor`, `PageReconciler`
- `MenuManager` (796→145) → `MenuDefinition`, `MenuSync`, `MenuNormalizer`
- `AssetsUtility` (674→85) → `AssetResolver`, `AssetImporter`, `AssetLister`
- `SeoFrontendRenderer` (599→55) → `MetaTagRenderer`, `OpenGraphRenderer`, `JsonLdRenderer`
- `MediaIntegrityService` (531→33) → `FeaturedImageRepair`, `GalleryRepair`, `ContentSanitizer`
- `AssetManager` (430→279) → extraído `FolderScanner`
- `ManejadorGit` (433→249) → movido a `Tools/`, extraído `GitCommandRunner`
</details>

<details>
<summary>Fase 5: Arquitectura React — COMPLETADA</summary>

`core/` (IslandRegistry, GloryProvider, hydration, ErrorBoundary), hooks del framework (useGloryContent, useGloryOptions, useWordPressApi, useGloryMedia, useIslandProps), lazy loading por isla con Suspense, error boundaries individuales, DevOverlay de debug.
</details>

<details>
<summary>Fase 6: CLI Scaffolding — COMPLETADA</summary>

`npx glory create island|page|component|hook <Nombre>` — genera .tsx + .css + registro automático con tipos.
</details>

<details>
<summary>Fase 7: Instalador — COMPLETADA</summary>

`glory new <proyecto>` cross-platform (Windows/Linux) con flags `--minimal`, `--tailwind`, `--shadcn`, `--with-stripe`. Valida prerequisitos, instala deps, configura flags.
</details>

<details>
<summary>Fase 8: Documentación — COMPLETADA</summary>

README reescritos (Glory + glorytemplate), guías de arquitectura, API reference, VitePress docs site.
</details>

<details>
<summary>Fase 9: Revisión Técnica — COMPLETADA</summary>

`lint`, `type-check`, `build` en verde. Corregido: tsconfig deprecation, hooks condicionales, refs en render, prerender event-loop blocking.
</details>

### Pendientes de fases anteriores
- [ ] **3.5** Generador automático de tipos: `GET /glory/v1/schema` → `npm run types:generate`

---

## 2. Arquitectura Objetivo

### 2.1 Principio Fundamental

```
WordPress (CMS)  ──solo datos──>  PHP Bridge (mínimo)  ──tipado──>  React (todo el UI)
     |                                  |                                |
  Admin panel                    REST API + SEO               Islas + Componentes
  Contenido                      Registrar páginas            Hooks tipados
  Media Library                  Servir datos JSON            Validación runtime
  Users/Auth                     Meta tags server-side        Zustand state
```

**Regla de oro:** Si puedes hacerlo en TypeScript, hazlo en TypeScript. PHP solo para lo que WordPress OBLIGA que sea PHP (registrar post types, servir HTML inicial, SEO meta tags, REST endpoints).

### 2.2 Flujo de Ejecución

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

### 2.3 Estructura de Directorios

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

### 2.4 Feature Flags

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

## 3. Decisiones Técnicas

### 3.1 ¿Por qué React Islands y no SPA completa?
- WordPress controla el routing para SEO server-side (meta tags, JSON-LD)
- SSG prerendering funciona por isla individual
- Cada página puede tener su propia isla con props tipados
- No necesitamos React Router — WordPress ya hace routing

### 3.2 ¿Por qué Tailwind off por defecto?
- Muchos proyectos prefieren CSS puro o CSS variables
- Tailwind agrega overhead de build
- shadcn/ui depende de Tailwind — activar shadcn activa Tailwind automáticamente
- Es un feature flag, no una decisión permanente

### 3.3 ¿Por qué eliminar todo el PHP legacy en vez de deprecar?
- **Ningún sitio usa modo híbrido** — no hay migración que proteger
- **No habrá sitios híbridos** — la decisión es definitiva
- El código deprecado genera ruido, confusión, y hace que `GloryFeatures` sea innecesariamente complejo
- 30+ features PHP-frontend en `$reactExcludedFeatures` son peso muerto que ensucia cada `isActive()` call
- Eliminar es más seguro que deprecar: código eliminado no puede causar bugs
- Si algún día se necesita (no va a pasar), está en el historial de Git

### 3.4 TypeScript como lengua franca
- `window.__GLORY_CONTENT__` tiene interface estricta, no `any`
- Props de islas son interfaces exportadas — error de compilación si no coinciden
- `useWordPressApi<T>()` tipado end-to-end
- Generador automático: CPTs de WordPress → interfaces TypeScript
- **Objetivo DX:** Si PHP manda un campo nuevo, TypeScript grita hasta que tipas el campo en el frontend. Si el frontend espera un campo, TypeScript grita hasta que PHP lo envía. Validación bidireccional en tiempo de compilación.

### 3.5 Filosofía de PHP en Glory
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

## 4. Extras (futuro, no bloquean)

- **Vitest:** Tests unitarios para hooks y componentes
- **Storybook:** Catálogo visual de componentes
- **CI/CD:** GitHub Actions: lint + type-check + build en cada PR
- **Turborepo:** Si Glory crece a múltiples paquetes
- **i18n:** react-intl o similar

---

## 5. Hardening, Desacoplamiento y Limpieza Final (13-02-2026)

> Auditoría post-fases: seguridad, SOLID, rendimiento, agnosticismo del framework, basura residual.

### 5.1 Basura Residual (CSS + Config)

| Archivo | Estado | Acción |
|---------|--------|--------|
| `Glory/assets/css/admin-elementor.css` | 0 refs | [x] Eliminado |
| `Glory/assets/css/alert.css` | 0 refs | [x] Eliminado |
| `Glory/assets/css/dateRange.css` | 0 refs | [x] Eliminado |
| `Glory/Config/exampleOptions.php` | 100% comentado, 0 refs | [x] Movido a `Glory/docs/examples/` |
| `Glory/Config/scriptSetup.php` | Stub vacío, cargado por load.php | [x] Eliminado; load.php actualizado |

### 5.2 Seguridad P0 (CORREGIR INMEDIATAMENTE)

| Archivo | Problema | Fix |
|---------|----------|-----|
| `OpcionPanelSaver.php` L1 | `<?` en vez de `<?php` | [x] Cambiado a `<?php` |
| `PanelDataProvider.php` L1 | Mismo problema | [x] Cambiado a `<?php` |
| `SyncManager.php` L85-110 | **CSRF**: links de admin bar sin nonce | [x] Agregado `wp_nonce_url()` y `wp_verify_nonce()` |
| `TaxonomyMetaManager.php` L65 | `saveCategoryMeta()` sin verificar nonce | [x] Agregado `wp_nonce_field()` y `wp_verify_nonce()` |

### 5.3 Seguridad P1 (PRIORITARIO)

| Archivo | Problema | Fix |
|---------|----------|-----|
| `ReactIslands.php` L263 | **XSS**: `json_encode($context)` en `<script>` | [x] `wp_json_encode()` con `JSON_HEX_TAG` flags |
| `ReactContentProvider.php` L275 | Mismo XSS | [x] Flags `JSON_HEX_TAG \| JSON_HEX_AMP` agregados |
| `FolderScanner.php` L46 | `include $cacheFile` ejecuta PHP desde caché | [x] Cambiado a `json_decode(file_get_contents())` |
| `QueryProfiler.php` | Queries SQL sin capability check | [x] `current_user_can('manage_options')` agregado |
| `MCPController.php` L82 | `canManageToken()` requería `edit_posts` | [x] Cambiado a `manage_options` |
| `PageBlocksController.php` L86 | `canReadBlocks()` retornaba `true` siempre | [x] Verifica `post_status === 'publish'` |
| `NewsletterController.php` L58 | `SHOW TABLES` en cada page load | [x] `get_option` check agregado |
| `NewsletterController.php` L97 | `$_SERVER['REMOTE_ADDR']` sin sanitizar | [x] `sanitize_text_field()` aplicado |
| `ImagesController.php` | Endpoints sin autenticación | [ ] Diferido: requiere decisión de producto |
| `PostActionManager.php` | CRUD sin capabilities | [x] `current_user_can()` en crear/update/delete + fix short tag |

### 5.4 Desacoplamiento Glory↔App (42 violaciones → framework agnóstico)

> **Principio:** Glory NO debe saber que `App/` existe. Todas las rutas deben ser configurables o resolverse por convención configurable.

#### 5.4.1 Solución arquitectónica: `glory.config.php`

Crear un archivo de convención en la raíz del tema que defina las rutas del proyecto:

```php
/* glory.config.php — raíz del tema */
return [
    'config_dir'    => 'App/Config',
    'content_dir'   => 'App/Content',
    'assets_dir'    => 'App/Assets',
    'react_dir'     => 'App/React',
    'templates_dir' => 'App/Templates',
];
```

Glory lee este archivo UNA vez al boot y expone las rutas via `GloryConfig::get('react_dir')`. Si el archivo no existe, usa defaults convencionales (que coinciden con `App/`).

#### 5.4.2 Violaciones PHP core (CRÍTICO)

| # | Archivo | Referencia hardcodeada | Fix |
|---|---------|------------------------|-----|
| 1 | `Setup.php` L198 | `\App\Handlers\StripeController::class` | [x] Ya usa `class_exists()` — OK como extension point |
| 2 | `MenuDefinition.php` L13 | `RUTA_MENU_CODIGO = '/App/Content/menu.php'` | [x] Usa `GloryConfig::path('content_dir')` |
| 3 | `AssetResolver.php` L27-28 | `'App/Assets/equipo'`, `'App/Assets/images'` | [x] Hook `glory/register_asset_paths` desde `App/Config/control.php` |
| 4 | `FeaturedImageRepair.php` L227 | `'tema' => 'App/Assets/images'` | [x] Usa `AssetResolver::getAssetPaths()` |
| 5 | `PostSyncHandler.php` L226 | Mismo aliasMap hardcodeado | [x] Idem |
| 6 | `load.php` L33,39 | `'/App/Config/control.php'` | [x] Usa `GloryConfig::path('config_dir')` |
| 7 | `PostActionManager.php` L2 | Comentario ruta legacy | [x] Actualizado |

#### 5.4.3 Violaciones en build tooling (ALTO — diferir a iteración futura)

Las referencias a `App/` en `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `main.tsx`, `index.css`, `package.json`, CLI scripts son numerosas (~20) y requieren un sistema de configuración JS/TS (`glory.config.ts`). **Diferir** a una iteración dedicada al build — el impacto en DX de romper esto ahora es mayor que el beneficio.

> **Decisión:** Fijar las violaciones PHP (core y load.php) en esta iteración. Las violaciones de build/CLI se documentan como TO-DO para la siguiente iteración.

### 5.5 Rendimiento

| Archivo | Problema | Fix |
|---------|----------|-----|
| `MenuNormalizer.php` L125-160 | `wp_get_nav_menu_items` 3 veces en loop | [x] Una sola llamada fuera del foreach |
| `ReactIslands.php` L82 | HTTP check a localhost:5173 en cada request | [x] Transient `glory_vite_dev_mode` (30s) |
| `SyncManager.php` L44-50 | `runFullSync()` en cada admin load | [x] Throttle con transient (60s cooldown) |
| `NewsletterController.php` L58 | `SHOW TABLES` en cada page load | [x] `get_option` check |
| `EventBus.php` L18-38 | `get/update_option` x2-3 por emisión | [x] Batch en memoria + flush en `shutdown` |
| `GloryLogger.php` L167 | `serialize + md5()` en cada log | [x] `crc32($mensaje)` sin serializar |
| `GloryLogger.php` L218 | `debug_backtrace()` en cada log | [x] Solo si nivel >= advertencia |

### 5.6 SOLID — Archivos que volvieron a exceder 300 líneas

| Archivo | Líneas | Acción |
|---------|--------|--------|
| `SyncManager.php` | 399 | [x] Extraído `CachePurger.php`. SyncManager ahora ~310 l |
| `ReactIslands.php` | 376 | [~] Diferido a Fase 11 (6.4) |
| `PerformanceProfiler.php` | 350 | [~] Diferido a Fase 11 (6.4) |
| `AssetManager.php` | 335 | [~] Diferido a Fase 11 (6.1.8) |
| `FeaturedImageRepair.php` | 326 | [~] Diferido a Fase 11 (6.4) |
| `GloryLogger.php` | 311 | [~] Diferido a Fase 11 (6.4) |
| `WebScraperProvider.php` | 801 | [ ] Dividir en `ScraperHttpClient`, `SearchResultParser`, `ProductPageParser` (AmazonProduct plugin — baja prioridad) |
| `StripeWebhookHandler.php` | 535 | [ ] Dividir por tipo de evento en clases Strategy (AmazonProduct plugin — baja prioridad) |
| `ApiEndpoints.php` (Amazon) | 380 | [ ] Extraer `DiagnosticEndpoints.php` (AmazonProduct plugin — baja prioridad) |

### 5.7 Dead Code y Cleanup menor

| Archivo | Problema | Fix |
|---------|----------|-----|
| `QueryProfiler.php` L22-25 | `debugLog()` siempre retorna `return;` | [x] Método y 6 llamadas eliminados |
| `PerformanceProfiler.php` L328 | `injectarDatosDebug()` vacío, obsoleto | [x] Método eliminado |
| `ScheduleManager.php` L153 | Usa `goto` (anti-patrón) | [x] Refactorizado con `break 2` |
| `PostActionManager.php` L2 | Comentario ruta legacy | [x] Actualizado |
| Alias map duplicado en 3 archivos | `FeaturedImageRepair`, `PostSyncHandler`, `AssetResolver` | [x] Centralizado en `AssetResolver::getAssetPaths()` |

### 5.8 Orden de ejecución

> De mayor impacto/riesgo a menor. Seguridad primero, luego integridad, luego mejoras.

1. **P0 Seguridad** (5.2) — short tags, CSRF SyncManager, CSRF TaxonomyMeta
2. **P1 Seguridad** (5.3) — XSS ReactIslands/ContentProvider, FolderScanner include, QueryProfiler disclosure, API caps
3. **Basura residual** (5.1) — exampleOptions, scriptSetup, load.php cleanup
4. **Desacoplamiento PHP** (5.4.2) — GloryConfig, rutas configurables
5. **Rendimiento** (5.5) — MenuNormalizer queries, dev server check, sync throttle, logger optimize
6. **SOLID splits** (5.6) — SyncManager→CachePurger, ReactIslands→ReactAssetLoader, etc.
7. **Dead code** (5.7) — debugLog muerto, goto, alias duplicado
8. **Compactación del plan** — Comprimir secciones 1-9 completadas para reducir tamaño del doc

### 5.9 Exclusiones conscientes (diferidas)

| Item | Razón de diferir |
|------|------------------|
| Desacoplamiento build tooling (`vite.config.ts`, `tsconfig.json`, CLI scripts) | ~20 cambios que requieren `glory.config.ts` — iteración dedicada |
| Split de `WebScraperProvider.php` (801 l) | Plugin AmazonProduct, baja prioridad para el framework core |
| Split de `StripeWebhookHandler.php` (535 l) | Plugin AmazonProduct, baja prioridad |
| `ImagesController.php` permisos | Requiere decisión de producto (¿público o autenticado?) |
| Docs: generalizar referencias a `App/` en markdown | Cosmético, no afecta runtime |

---

## 6. Pulido Framework — Fase 11 (13-02-2026)

> Auditoría de segundo nivel: SOLID pendientes, rendimiento crítico, seguridad residual, agnosticismo, contracts, documentación.

### 6.1 Quick Wins — Limpieza de código

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| 1 | `EventBus.php` L5 | Import muerto `use GloryLogger` — nunca se usa | [x] |
| 2 | `OpcionPanelSaver.php` L28 | `$opcionesOmitidas` declarado, nunca recibe items, `count()` siempre 0 | [x] |
| 3 | `GloryLogger.php` L280 | Switch de niveles → array constante | [x] |
| 4 | `PostActionManager.php` | Nomenclatura mixta español/inglés (`crearPost` vs `updatePost`) | [x] |
| 5 | `ScheduleManager.php` | Mensajes de log en inglés, framework usa español | [~] Pausado |
| 6 | `ReactIslands.php` L88-96 | `$_SERVER` sin `sanitize_text_field()` en `isLocalEnvironment()` | [x] |
| 7 | `todo.md` | Archivo vacío — eliminar | [x] |
| 8 | `AssetManager.php` L127+L194 | `resolveFeature()` duplicado → método DRY `esFeatureActiva()` | [x] |
| 9 | `PerformanceProfiler.php` L139 | `error_log()` en cada medición → buffer en memoria + flush en shutdown | [x] |

### 6.2 Seguridad Residual

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| 1 | `ImagesController.php` L164 | Path traversal: `../` en param `archivo` no validado | [x] |
| 2 | `ImagesController.php` | Endpoints públicos exponen filesystem — agregar rate limit header | [~] Pausado |
| 3 | `NewsletterController.php` | Sin rate limiting — spam de suscripciones | [x] |
| 4 | `PageBlocksController.php` L127 | `saveBlocks()` sin límite de tamaño del payload JSON | [x] |
| 5 | `SyncManager.php` L225 | `showSyncNotice()` usa `echo` sin escaping | [x] |

### 6.3 Rendimiento Crítico

| # | Archivo | Problema | Impacto | Estado |
|---|---------|----------|---------|--------|
| 1 | `ReactContentProvider.php` L131-175 | **N+1 queries**: `formatPost()` hace 6+ queries por post | Alto | [x] |
| 2 | `ReactContentProvider.php` L105 | `getAllContent()` ejecuta N WP_Queries secuenciales | Medio | [~] Pausado |
| 3 | `AssetResolver.php` L95-128 | `glob()` x6 por llamada sin cache en memoria | Bajo | [x] |
| 4 | `CachePurger.php` L25-33 | 4 queries `DELETE ... LIKE` (full table scan) | Bajo | [~] Pausado |

### 6.4 SOLID — Splits pendientes (archivos >300 líneas)

| Archivo | Líneas | Extracción | Estado |
|---------|--------|------------|--------|
| `ReactIslands.php` | ~384→~300 | Extraído `ReactAssetLoader.php` | [x] |
| `PerformanceProfiler.php` | ~341→~295 | Extraído `HttpProfiler.php` | [x] |
| `AssetManager.php` | ~335→~310 | Extraído `esFeatureActiva()` DRY (6.1.8) | [x] |
| `FeaturedImageRepair.php` | ~322 | Dividir `repairFeaturedImage()` en sub-métodos privados | [~] Pausado |
| `GloryLogger.php` | ~312→~270 | Extraído `LogFormatter.php` — delega `crearEntradaLog()` | [x] |
| `ImagesController.php` | ~371 | Extraer validaciones repetidas a trait o helper privado | [~] Pausado |

### 6.5 Agnosticismo del Framework

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| 1 | `MenuDefinition.php` L89-97 | Lógica hardcoded `'Marcas'`/`'Productos'` — específica de proyecto | [~] Pausado |
| 2 | `MenuDefinition.php` L26-32 | `obtenerSeedPorDefecto()` con items `'example'` hardcoded | [~] Pausado |

### 6.6 Framework Madurez — Contracts e Infraestructura

| # | Mejora | Estado |
|---|--------|--------|
| 1 | Crear `Glory/src/Contracts/` con interfaces: `PostServiceInterface`, `EventBusInterface`, `ContentProviderInterface` | [~] Pausado |
| 2 | Health check endpoint: `GET /glory/v1/health` con versión, features activas, estado cache | [~] Pausado |
| 3 | `ErrorResponse` trait para unificar respuestas de error REST | [~] Pausado |
| 4 | Validación de config en `GloryConfig::load()` — schema con keys requeridas/opcionales | [~] Pausado |

### 6.7 Documentación

| # | Área | Problema | Estado |
|---|------|----------|--------|
| 1 | `Glory/readme.md` | No documenta servicios PHP (EventBus, PostActionManager, ReactContentProvider) | [~] Pausado |
| 2 | `Glory/docs/php/arquitectura-php.md` | Falta `CachePurger`, `GloryConfig` en tablas | [~] Pausado |
| 3 | `Glory/docs/php/rest-api.md` | No documenta permisos ni rate limiting por endpoint | [~] Pausado |
| 4 | `Glory/todo.md` | Vacío — a eliminar | [x] Eliminado |
| 5 | `glory-plan.md` sección 5.6 | Checkboxes pendientes aunque Fase 10 dice "Completada" — corregir | [x] Corregidos en sesión anterior |

### 6.8 Orden de ejecución

1. Quick wins y limpieza (6.1) — máximo impacto/mínimo riesgo
2. Seguridad residual (6.2)
3. Rendimiento crítico (6.3) — N+1 en ReactContentProvider
4. SOLID splits (6.4)
5. Agnosticismo (6.5)
6. Contracts + Health endpoint (6.6)
7. Documentación (6.7)

---

## ESTADO DEL PLAN

| Fase | Estado | Notas |
|------|--------|-------|
| Fase 1: Purga Total | Completada | Eliminado modo hibrido, PHP frontend, codigo muerto |
| Fase 2: Tooling TS | Completada | ESLint + Prettier + Tailwind/shadcn opt-in |
| Fase 3: Tipos WP->TS | Completada | Tipos base, hooks tipados (3.5 diferido) |
| Fase 4: Dividir PHP | Completada | 7 archivos divididos, 22 archivos resultantes, todos <300 lineas |
| Fase 5: Arquitectura React | Completada | core/, hooks, GloryProvider, lazy loading, error boundaries |
| Fase 6: CLI Scaffolding | Completada | npx glory create island/page/component/hook |
| Fase 7: Instalador | Completada | glory new/setup con --tailwind/--shadcn/--with-stripe |
| Fase 8: Documentacion | Completada | README reescrito, guias, API reference, consolidacion |
| Fase 9: Revision Tecnica | Completada | lint, type-check, build en verde |
| Fase 10: Hardening | Completada | Seguridad, desacoplamiento, rendimiento, SOLID, dead code. SOLID splits menores diferidos. |
| Fase 11: Pulido Framework | Pausada (parcial) | SOLID splits, N+1 fixes, seguridad — completados parcialmente. Items restantes pausados para evaluar migración a TypeScript. |
| Fase 12: Auditoría Integral | Completada | Auditoría PHP + React/TS. 38 hallazgos React + ~39 PHP. Fixes críticos aplicados. |

---

## 7. Auditoría Integral — Fase 12 (13-02-2026)

> Auditoría profunda de seguridad, rendimiento, SOLID, tipado, accesibilidad y agnosticismo del codebase completo.

### 7.1 P0 Críticos — CORREGIDOS

| # | Archivo | Problema | Fix |
|---|---------|----------|-----|
| 1 | `useWordPressApi.ts` | `options` en dependency array de `useCallback` causa bucle infinito de re-fetches (potencial DDoS) | [x] Serializar options via JSON.stringify para estabilizar deps. Documentar que consumidor debe memoizar. |
| 2 | `installer.mjs` L73 | Command injection: `execSync` con interpolación de `nombre` sin validar | [x] Validar con `validateName()` antes de usar. Cambiar a `execFileSync` que evita shell. |
| 3 | `useWordPressApi.ts` | `apiCache` sin límite de entries — posible memory leak | [x] LRU con MAX_CACHE_ENTRIES=100. Limpieza automática de entries expiradas. |

### 7.2 P1 Altos — CORREGIDOS

| # | Archivo | Problema | Fix |
|---|---------|----------|-----|
| 1 | `BlockRegistry.ts` L42 | `registerAll` usaba `BlockDefinition<any>[]` — pierde tipado | [x] Cambiado a `BlockDefinition<Record<string, unknown>>[]` |
| 2 | `PageBuilder.tsx` | `alert()` y `confirm()` bloquean hilo principal, no testeables | [x] Eliminados. Solo se usan callbacks `onSaveSuccess`/`onSaveError`. |
| 3 | `PageBuilder.tsx` | `console.warn` en producción (guardado exitoso) | [x] Envuelto en `import.meta.env.DEV` |
| 4 | `BlockEditorModal.tsx` | Modal sin `role="dialog"` ni `aria-modal="true"` | [x] Agregados atributos ARIA completos |
| 5 | `ExampleIsland.tsx` | Botones +/- sin `aria-label` | [x] Agregados `aria-label="Incrementar/Decrementar contador"` |
| 6 | `BlockRenderer.tsx` | Botones ↑/↓/eliminar sin `aria-label`, emoji en código | [x] Agregados aria-labels. Reemplazado emoji por "X". |
| 7 | `main.tsx` | `ExampleIsland` se importa y registra en producción — aumenta bundle | [x] Envuelto en `import.meta.env.DEV` con import dinámico |
| 8 | `PageBlocksController.php` | `canReadBlocks()` retornaba `true` para pageId=0 | [x] Validar pageId > 0, verificar post existe |
| 9 | `PageBlocksController.php` | `current_time('mysql')` deprecado | [x] Cambiado a `gmdate('Y-m-d H:i:s')` |
| 10 | `ReactContentProvider.php` | `posts_per_page => -1` sin cota | [x] Limitado a count(slugs) o 100 máximo |

### 7.3 P2 Medios — CORREGIDOS

| # | Archivo | Problema | Fix |
|---|---------|----------|-----|
| 1 | `glory.ts` | `GloryContext` propiedades opcionales innecesariamente | [x] Propiedades core obligatorias. `Partial<GloryContext>` solo en `window.GLORY_CONTEXT`. Eliminado index signature `[key: string]: unknown` → `extra?` |
| 2 | `PageLayout.tsx` | `key={i}` en listas de links/socialLinks | [x] Cambiado a `key={link.href \|\| i}` |
| 3 | `BienvenidaIsland.tsx` | Import innecesario de `React` + tipo `React.JSX.Element` | [x] Eliminado import, cambiado a `JSX.Element` |
| 4 | `App/React/blocks/index.tsx` | `console.log` en producción sin bloquear | [x] Eliminado — función vacía con comentario |
| 5 | `pageBuilder/types.ts` | `PageBuilderContextType` exportado pero nunca usado | [x] Documentado con TO-DO para future context pattern |
| 6 | `useWordPressApi.ts` | `getNonce()`/`getRestUrl()` leían `window` en cada llamada | [x] Singleton cacheado con `resetApiCredentials()` para invalidar |

### 7.4 Pendientes de Fase 12 (diferidos)

| Item | Razón de diferir |
|------|------------------|
| Inline styles masivos en PageBuilder/BlockRenderer/BlockEditorModal | Requiere creación de archivos CSS dedicados — iteración de estilos |
| `FieldRenderer`/`ArrayFieldRenderer` sin `React.memo` | Optimización menor, solo relevante con muchos campos |
| `renderBlock` es función, no componente (pierde memoización) | Requiere refactor mayor del BlockRenderer |
| Migrar CLI `.mjs` a `.mts` con tipos | Cosmético, no afecta runtime |
| `PageBuilderContextType` implementar context pattern | Feature futura, no hay caso de uso actual |
| Duplicación `configurarFlags` entre setup.mjs e installer.mjs | Baja prioridad |
| `editorjs.d.ts` tipos vagos `unknown` | Requiere investigar @types disponibles |

