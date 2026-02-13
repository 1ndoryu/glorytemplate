# Glory Framework — Plan Maestro de Refactorización v1.0

> Fecha: Febrero 2026
> Rama glorytemplate: `glory-react-logic` | Rama Glory: `glory-react`
> Objetivo: Convertir Glory en un framework WordPress + React de alto nivel

---

## 0. Visión y Contexto

**Antes:** Glory era una biblioteca full PHP para WordPress (templates, assets, SEO, contenido por defecto, etc.).

**Ahora:** Glory será un framework enfocado en conectar WordPress (CMS) con React de la forma más limpia y tipada posible. WordPress se usa exclusivamente como CMS/backend; toda la UI la maneja React con TypeScript estricto.

**Repositorios:**
- `1ndoryu/glorytemplate` — Tema WP, punto de entrada, configuración del proyecto
- `1ndoryu/Glory` (subcarpeta `/Glory`) — Framework core reutilizable

**Stack objetivo:**
| Capa | Tecnología | Estado |
|------|-----------|--------|
| CMS/Backend | WordPress + PHP 8+ | Existente, simplificar |
| Frontend | React 18 + TypeScript 5.6 | Existente, expandir |
| Build | Vite 6 + HMR | Existente |
| Estilos | Tailwind CSS 4 (opcional, off por defecto) | Existente en deps |
| Componentes UI | shadcn/ui (opcional, off por defecto) | Por agregar |
| Estado | Zustand | Existente |
| Linting | ESLint + Prettier (on por defecto) | Por configurar |
| Tipado | TypeScript strict | Existente, reforzar |

---

## 1. Diagnóstico del Estado Actual

### 1.1 Problemas Detectados

#### Arquitectura
- [ ] **Archivos gigantes:** 7 archivos superan 300 líneas (MenuManager 796, PageManager 802, SeoFrontendRenderer 599, AssetsUtility 674, GestorCssCritico 639, AssetManager 430, ManejadorGit 433, MediaIntegrityService 531)
- [ ] **Acoplamiento por clases estáticas:** Todo el framework usa métodos estáticos sin DI container
- [ ] **Código muerto:** AnalyticsEngine, ServidorChat, FormHandlerInterface sin uso real
- [ ] **Funcionalidad PHP legacy:** Critical CSS, AjaxNav, TemplateManager/TemplateRegistry innecesarios en modo React
- [ ] **Namespace inconsistente:** FormHandlerInterface tiene namespace incorrecto
- [ ] **CSS legacy en App/Assets/css/:** 1593 líneas (header.css 416, task.css 935, home.css 242) sin uso en React
- [ ] **Imágenes basura:** ~250+ imágenes hash-named en Glory/assets/images/colors/ (deuda técnica)
- [ ] **WebSockets innecesario:** Ratchet/ReactPHP en composer.json para ServidorChat que se va a eliminar
- [ ] **App1 era carpeta de prueba:** Ya eliminada

#### TypeScript/React
- [ ] **Sin ESLint configurado:** No hay .eslintrc ni reglas de calidad
- [ ] **Sin Prettier configurado:** Formato inconsistente
- [ ] **Tailwind instalado pero no configurado formalmente:** Solo en deps
- [ ] **shadcn/ui no existe:** Solo idea
- [ ] **Solo 1 isla activa:** BienvenidaIsland (hello world) — todo lo demás está comentado
- [ ] **Page Builder incompleto:** Existe en Glory/assets/react/src/pageBuilder/ pero inactivo
- [ ] **Tipos incompletos:** Solo editorjs.d.ts y styles.d.ts

#### DX (Developer Experience)
- [ ] **Sin scripts de scaffolding:** Crear isla/página/componente es manual
- [ ] **Sin documentación de API types:** WordPress REST → TypeScript types no automatizado
- [ ] **Sin hot reload confiable:** Vite HMR configurado pero sin testing

### 1.2 Lo Que Funciona Bien (no tocar)
- **React Islands** (ReactIslands.php + main.tsx): Patrón sólido de hidratación
- **ReactContentProvider.php**: Puente datos WP→React maduro
- **GloryFeatures.php**: Feature flags + React Mode toggle
- **PageManager.reactPage()**: Registro declarativo de páginas React
- **Sistema de opciones** (OpcionRegistry → OpcionRepository → OpcionManager): Bien estratificado
- **DefaultContent system**: Sincronización de contenido robusta
- **Vite config**: HMR, aliases, dedup bien resueltos
- **SEO backend** (SeoMetabox + SeoFrontendRenderer): Funciona con ambos frontends

---

## 2. Inventario de Archivos — Decisiones

### 2.1 ELIMINAR (código muerto o fuera de scope)

| Archivo | Razón |
|---------|-------|
| `Glory/src/Contracts/FormHandlerInterface.php` | Namespace incorrecto, sin implementaciones |
| `Glory/src/Services/AnalyticsEngine.php` | Genérico sin uso, PHP nativo lo cubre |
| `Glory/src/Services/ServidorChat.php` | No pertenece a un framework de temas |
| `App1/` (todo) | Carpeta de prueba ya eliminada |
| `Glory/assets/images/colors/` (~250 imgs) | Deuda técnica, imágenes hash sin propósito claro |
| Deps composer: `cboden/ratchet`, `react/http`, `evenement/*` | Solo para ServidorChat eliminado |
| `App/Assets/css/task.css` (935 líneas) | CSS legacy de sistema de tareas inactivo |

### 2.2 DEPRECAR (marcar @deprecated, no eliminar todavía)

| Archivo | Razón | Reemplazo |
|---------|-------|-----------|
| `Glory/src/Console/CriticalCssCommand.php` | reactExcludedFeature | Vite maneja CSS |
| `Glory/src/Services/GestorCssCritico.php` | 639 líneas, no aplica en React | Vite CSS |
| `Glory/src/Services/LocalCriticalCss.php` | Depende de GestorCssCritico | Vite CSS |
| `Glory/src/Helpers/AjaxNav.php` | React Router reemplaza | React Router |
| `Glory/src/Manager/TemplateManager.php` | PHP templates en modo React | Componentes React |
| `Glory/src/Utility/TemplateRegistry.php` | PHP render en modo React | Componentes React |
| `Glory/tools/critical-css/` | Penthouse/Puppeteer innecesario | Vite |
| `App/Assets/css/header.css` (416 líneas) | Header PHP, React usa componentes | React Header |
| `App/Assets/css/home.css` (242 líneas) | Estilos PHP legacy | React + CSS Modules/Tailwind |

### 2.3 MANTENER Y REFACTORIZAR (dividir archivos grandes)

| Archivo | Líneas | Dividir en |
|---------|--------|-----------|
| `MenuManager.php` | 796 | `MenuDefinition.php`, `MenuSync.php`, `MenuNormalizer.php` |
| `PageManager.php` | 802 | `PageDefinition.php`, `PageTemplateInterceptor.php`, `PageSeoDefaults.php`, `ReactPageHandler.php` |
| `SeoFrontendRenderer.php` | 599 | `MetaTagRenderer.php`, `OpenGraphRenderer.php`, `JsonLdRenderer.php` |
| `AssetsUtility.php` | 674 | `AssetResolver.php`, `AssetImporter.php`, `AssetLister.php` |
| `MediaIntegrityService.php` | 531 | `FeaturedImageRepair.php`, `GalleryRepair.php`, `ContentSanitizer.php` |
| `AssetManager.php` | 430 | `AssetEnqueuer.php`, `FolderScanner.php` |
| `ManejadorGit.php` | 433 | Mover a `Glory/src/Tools/` namespace |

### 2.4 MANTENER COMO ESTÁ (core React)

| Archivo | Rol |
|---------|-----|
| `ReactIslands.php` | Motor de islas React |
| `ReactContentProvider.php` | Puente datos WP→React |
| `GloryFeatures.php` | Feature flags + React Mode |
| `PageBlocksController.php` | API para page builder React |
| `ImagesController.php` | API de imágenes para React |
| `MCPController.php` | Flujo desarrollo con IA |
| `Setup.php` | Bootstrap principal |
| `OpcionManager/Registry/Repository` | Sistema de opciones |
| `DefaultContent*` | Sistema de sincronización de contenido |
| `main.tsx` | Entry point React Islands |
| `vite.config.ts` | Build config |

---

## 3. Plan de Ejecución — Fases

### FASE 1: Limpieza y Preparación (Sprint 1)
> Objetivo: Eliminar basura, deprecar legacy, dejar el terreno limpio

- [ ] **1.1** Eliminar archivos muertos (AnalyticsEngine, ServidorChat, FormHandlerInterface)
- [ ] **1.2** Marcar archivos como @deprecated (GestorCssCritico, LocalCriticalCss, AjaxNav, TemplateManager, TemplateRegistry, CriticalCssCommand)
- [ ] **1.3** Limpiar composer.json: remover `cboden/ratchet`, `react/http`, `evenement/*`
- [ ] **1.4** Evaluar y limpiar `Glory/assets/images/colors/` (mover a backup o eliminar)
- [ ] **1.5** Mover CSS legacy de App/Assets/css/ a carpeta `_deprecated/` 
- [ ] **1.6** Limpiar `Glory/tools/critical-css/` — marcar como deprecated
- [ ] **1.7** Commit: `refactor: limpieza fase 1 — eliminar código muerto y deprecar legacy`

### FASE 2: Configuración de Tooling TypeScript (Sprint 1)
> Objetivo: ESLint, Prettier, Tailwind formal, shadcn/ui preparado

- [ ] **2.1** Configurar ESLint en Glory/assets/react/:
  - `eslint.config.js` (flat config ESLint 9+)
  - Plugins: `@typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`
  - Reglas strict: no-any, no-unused-vars, consistent-return, react-hooks/exhaustive-deps
- [ ] **2.2** Configurar Prettier:
  - `.prettierrc` con singleQuote, trailingComma, semi, printWidth: 100
  - Integrar con ESLint via `eslint-config-prettier`
- [ ] **2.3** Configurar Tailwind CSS 4 formal:
  - Feature flag en GloryFeatures: `tailwind` (off por defecto)
  - `tailwind.config.ts` con content paths correctos
  - CSS variables del tema como tokens de Tailwind
- [ ] **2.4** Preparar shadcn/ui:
  - Feature flag en GloryFeatures: `shadcnUI` (off por defecto)
  - `components.json` para shadcn CLI
  - Directorio `Glory/assets/react/src/components/ui/` para componentes shadcn
  - Script `npx shadcn@latest add` integrado en workflow
- [ ] **2.5** Agregar scripts npm:
  - `lint`, `lint:fix`, `format`, `type-check` en package.json
- [ ] **2.6** Commit: `feat: configurar ESLint + Prettier + Tailwind + shadcn/ui support`

### FASE 3: Sistema de Tipos WP→TS (Sprint 2)
> Objetivo: Tipado fuerte entre WordPress y TypeScript

- [ ] **3.1** Crear directorio `Glory/assets/react/src/types/` con tipos base:
  - `wordpress.ts` — WPPost, WPPage, WPMenu, WPMedia, WPUser, WPTaxonomy
  - `glory.ts` — GloryContent, GloryIslandProps, GloryFeatureFlags, GloryOption
  - `api.ts` — Tipos de respuesta de la REST API (/glory/v1/*)
  - `pageBuilder.ts` — Tipos de bloques del page builder
- [ ] **3.2** Crear sistema de generación automática de tipos:
  - Endpoint PHP: `/glory/v1/schema` que expone la estructura de datos
  - Script TS: `scripts/generateTypes.ts` que consume el endpoint y genera .d.ts
  - Incluir: CPTs registrados, campos meta, opciones del tema, menús
- [ ] **3.3** Tipar ReactContentProvider:
  - `window.__GLORY_CONTENT__` con interface estricta
  - Hook: `useGloryContent<T>()` con genéricos
- [ ] **3.4** Tipar ReactIslands:
  - Props de islas validados via Zod schemas (opcional) o TypeScript strict
  - Registry tipado: `Record<string, React.ComponentType<any>>` → tipos específicos
- [ ] **3.5** Commit: `feat: sistema de tipos WP→TypeScript con generación automática`

### FASE 4: Refactorización de Archivos Grandes (Sprint 2-3)
> Objetivo: Cumplir límite de 300 líneas, SRP

- [ ] **4.1** Dividir `PageManager.php` (802 líneas):
  - `PageDefinition.php` — define(), reactPage(), registerReactFullPages()
  - `PageTemplateInterceptor.php` — intercepción de templates WP
  - `PageSeoDefaults.php` — SEO defaults por página
  - `ReactPageHandler.php` — lógica específica de páginas React
- [ ] **4.2** Dividir `MenuManager.php` (796 líneas):
  - `MenuDefinition.php` — definición de menús por código
  - `MenuSync.php` — sincronización con DB
  - `MenuNormalizer.php` — normalización de placeholders y URLs
- [ ] **4.3** Dividir `AssetsUtility.php` (674 líneas):
  - `AssetResolver.php` — resolución flexible de paths
  - `AssetImporter.php` — importación a Media Library
  - `AssetLister.php` — listado y selección de assets
- [ ] **4.4** Dividir `SeoFrontendRenderer.php` (599 líneas):
  - `MetaTagRenderer.php` — title, description, canonical
  - `OpenGraphRenderer.php` — OG + Twitter Cards
  - `JsonLdRenderer.php` — JSON-LD schemas
- [ ] **4.5** Dividir `MediaIntegrityService.php` (531 líneas):
  - `FeaturedImageRepair.php`
  - `GalleryRepair.php`
  - `ContentSanitizer.php`
- [ ] **4.6** Dividir `AssetManager.php` (430 líneas):
  - Extraer `FolderScanner.php` como helper
- [ ] **4.7** Mover `ManejadorGit.php` (433 líneas) a `Glory/src/Tools/`
- [ ] **4.8** Commit: `refactor: dividir archivos grandes — cumplir SRP y límite 300 líneas`

### FASE 5: Mejora de la Arquitectura React (Sprint 3)
> Objetivo: Islands system robusto, hooks, providers

- [ ] **5.1** Crear estructura de directorios React definitiva:
  ```
  Glory/assets/react/src/
  ├── core/              # Sistema de islas, providers, bootstrap
  │   ├── IslandRegistry.ts
  │   ├── GloryProvider.tsx
  │   └── hydration.ts
  ├── hooks/             # Hooks reutilizables del framework
  │   ├── useGloryContent.ts
  │   ├── useGloryOptions.ts
  │   ├── useWordPressApi.ts
  │   └── useIsland.ts
  ├── components/        
  │   └── ui/            # shadcn/ui components (auto-generados)
  ├── types/             # Tipos compartidos
  ├── utils/             # Utilidades TS
  ├── islands/           # Islas del framework (ejemplos)
  ├── pageBuilder/       # Page Builder system
  └── styles/            # Estilos base del framework
  ```
- [ ] **5.2** Crear hooks core:
  - `useGloryContent<T>()` — acceso tipado a window.__GLORY_CONTENT__
  - `useGloryOptions()` — opciones del tema
  - `useWordPressApi()` — fetch wrapper con auth y tipos
  - `useGloryMedia(alias)` — acceso a imágenes vía /glory/v1/images
- [ ] **5.3** Crear GloryProvider:
  - Context con datos globales (content, options, user, features)
  - Wrapper automático de todas las islas
- [ ] **5.4** Mejorar IslandRegistry:
  - Lazy loading de islas con React.lazy + Suspense
  - Error boundaries por isla
  - DevTools: overlay de debug con nombre de isla y props
- [ ] **5.5** Commit: `feat: arquitectura React mejorada — hooks, providers, lazy loading`

### FASE 6: Scaffolding y CLI (Sprint 4)
> Objetivo: DX de primera clase — crear islas/páginas/componentes con un comando

- [ ] **6.1** Script CLI Node.js: `glory create`
  - `glory create island <NombreIsla>` — genera .tsx + .css + registro en appIslands
  - `glory create page <nombre>` — genera isla + registro en pages.php (PHP)
  - `glory create component <nombre>` — genera componente React en App/React/components/
  - `glory create hook <nombre>` — genera hook en App/React/hooks/
- [ ] **6.2** Templates de scaffolding:
  - Isla con props tipadas y CSS module
  - Página React con SEO y layout
  - Componente atómico con props interface
- [ ] **6.3** Commit: `feat: CLI de scaffolding — glory create island/page/component`

### FASE 7: Documentación y README (Sprint 4)
> Objetivo: README profesional, docs actualizadas

- [ ] **7.1** Reescribir `Glory/readme.md`:
  - Quick start (5 minutos)
  - Arquitectura: diagrama WP ← PHP Bridge → React Islands
  - Guía: Crear tu primera isla React
  - Guía: Registrar una página
  - API Reference: hooks, providers, tipos
  - Configuración: ESLint, Tailwind, shadcn/ui
  - Feature flags disponibles
- [ ] **7.2** Reescribir `glorytemplate/README.md`:
  - Setup del tema
  - Estructura de directorios App/ vs Glory/
  - Guía de desarrollo
- [ ] **7.3** Actualizar `Glory/src/ANALISIS_FRAMEWORK.md` con estado post-refactorización
- [ ] **7.4** Commit: `docs: README reescrito y documentación actualizada`

---

## 4. Arquitectura Objetivo

### 4.1 Flujo de Ejecución Simplificado

```
WordPress (CMS)
    │
    ├── functions.php → Composer Autoload → Glory/load.php
    │
    ├── Glory/Core/Setup.php (Bootstrap condicional)
    │   ├── GloryFeatures (qué cargar)
    │   ├── PageManager (páginas React)
    │   ├── OpcionManager (configuración)
    │   ├── REST API Controllers
    │   └── SEO Renderer
    │
    ├── TemplateReact.php (100% React)
    │   └── Renderiza <div data-island="..." data-props="...">
    │
    └── Vite Dev Server / Build
        │
        ├── main.tsx (entry point)
        │   ├── Busca [data-island] en DOM
        │   ├── Importa isla del registry
        │   ├── Hidrata (SSG) o Monta (CSR)
        │   └── Envuelve en GloryProvider
        │
        └── React Islands
            ├── Framework: ExampleIsland, PageBuilder
            └── App: BienvenidaIsland, [tus islas]
```

### 4.2 Estructura de Directorios Objetivo

```
glorytemplate/
├── App/                          # Código específico del proyecto
│   ├── Config/                   # Configuración (pages, control, assets, env)
│   ├── Content/                  # Contenido por defecto (CPTs, menús)
│   ├── Helpers/                  # Helpers PHP del proyecto
│   ├── React/                    # Código React del proyecto
│   │   ├── islands/              # Islas React del proyecto
│   │   ├── components/           # Componentes React del proyecto
│   │   ├── hooks/                # Hooks del proyecto
│   │   ├── styles/               # CSS del proyecto
│   │   ├── types/                # Tipos del proyecto
│   │   └── appIslands.tsx        # Registry de islas
│   ├── Assets/                   # Assets estáticos (fuentes, imágenes)
│   └── Templates/                # Templates PHP (legacy, para modo híbrido)
│
├── Glory/                        # Framework (submodule/repositorio)
│   ├── src/                      # Core PHP
│   │   ├── Admin/                # Panel de admin WP
│   │   ├── Api/                  # REST API controllers
│   │   ├── Core/                 # Bootstrap, features, opciones, logger
│   │   ├── Manager/              # Managers (assets, pages, menus, content)
│   │   ├── Repository/           # Repositorios de datos
│   │   ├── Seo/                  # SEO rendering
│   │   ├── Services/             # Servicios (sync, search, git, stripe)
│   │   ├── Tools/                # Herramientas DevOps
│   │   ├── Utility/              # Utilidades (assets, images, email, user)
│   │   └── _deprecated/          # Código deprecado (no borrado)
│   ├── assets/
│   │   ├── react/                # Sistema React del framework
│   │   │   ├── src/
│   │   │   │   ├── core/         # Islands engine, providers
│   │   │   │   ├── hooks/        # Hooks del framework
│   │   │   │   ├── components/ui/# shadcn/ui (opcional)
│   │   │   │   ├── types/        # Tipos WP + Glory
│   │   │   │   ├── utils/        # Utilidades TS
│   │   │   │   ├── islands/      # Islas de ejemplo
│   │   │   │   └── pageBuilder/  # Page Builder
│   │   │   ├── vite.config.ts
│   │   │   ├── tsconfig.json
│   │   │   ├── eslint.config.js
│   │   │   └── .prettierrc
│   │   ├── css/                  # CSS del framework (admin, profiler)
│   │   ├── js/                   # JS del framework (profiler)
│   │   └── images/               # Imágenes del framework
│   ├── Config/                   # Config del framework
│   └── cache/                    # Cache temporal
│
├── functions.php                 # Bootstrap WP
├── TemplateReact.php             # Template React (principal)
├── TemplateGlory.php             # Template híbrido
├── header.php / footer.php       # HTML shell
├── style.css                     # Metadata WP
├── package.json                  # Scripts raíz
├── composer.json                 # Deps PHP
└── glory-plan.md                 # Este archivo
```

### 4.3 Feature Flags Sistema

```php
/* En App/Config/control.php */

/* Activadas por defecto */
GloryFeatures::enable('reactMode');        // Modo React (desactiva 30+ features PHP)
GloryFeatures::enable('eslint');           // ESLint activo
GloryFeatures::enable('pageManager');
GloryFeatures::enable('assetManager');
GloryFeatures::enable('gloryLogger');
GloryFeatures::enable('defaultContentManager');

/* Desactivadas por defecto (opt-in) */
GloryFeatures::disable('tailwind');        // Tailwind CSS
GloryFeatures::disable('shadcnUI');        // shadcn/ui components
GloryFeatures::disable('pageBuilder');     // Page Builder visual
GloryFeatures::disable('stripe');          // Stripe integration
GloryFeatures::disable('amazonProduct');   // Plugin Amazon
```

---

## 5. Decisiones Técnicas

### 5.1 ¿Por qué React Islands y no SPA completa?
- WordPress necesita controlar el routing para SEO server-side
- Las islas permiten adopción gradual (páginas PHP + React coexisten)
- SSG prerendering funciona por isla individual
- Menor complejidad que un SPA con client-side routing

### 5.2 ¿Por qué Tailwind off por defecto?
- Muchos proyectos prefieren CSS puro o CSS Modules
- Tailwind agrega overhead de build y aprendizaje
- Los proyectos que lo necesiten lo activan con un feature flag
- Los componentes shadcn/ui dependen de Tailwind, así que al activar shadcn se activa Tailwind automáticamente

### 5.3 ¿Por qué no eliminar todo el PHP legacy?
- Algunos sitios pueden necesitar modo híbrido (PHP + React)
- La deprecación gradual permite migración sin downtime
- Los archivos @deprecated se pueden limpiar en una v2.0

### 5.4 TypeScript como lingua franca
- Todos los datos de WordPress se consumen tipados
- Los props de islas son interfaces TypeScript explícitas
- useWordPressApi() retorna tipos genéricos
- El generador de tipos automatiza la sincronización WP→TS

---

## 6. Orden de Prioridad de Ejecución

| Prioridad | Fase | Impacto | Esfuerzo |
|-----------|------|---------|----------|
| 1 | Fase 1: Limpieza | Alto (reduce ruido) | Bajo |
| 2 | Fase 2: ESLint + Tooling | Alto (DX inmediato) | Medio |
| 3 | Fase 3: Tipos WP→TS | Muy alto (productividad) | Alto |
| 4 | Fase 4: Dividir archivos | Alto (mantenibilidad) | Alto |
| 5 | Fase 5: Arquitectura React | Muy alto (framework value) | Alto |
| 6 | Fase 6: CLI Scaffolding | Medio (DX) | Medio |
| 7 | Fase 7: Documentación | Alto (adopción) | Medio |

---

## 7. Métricas de Éxito

- [ ] 0 archivos PHP > 300 líneas (excepto justificados)
- [ ] 0 warnings de ESLint en código React
- [ ] 100% de props de islas tipados
- [ ] `glory create island MiIsla` funciona end-to-end
- [ ] README permite setup en < 5 minutos
- [ ] Feature flags controlan Tailwind, shadcn, y todas las features opcionales
- [ ] `npm run type-check` pasa sin errores
- [ ] `npm run lint` pasa sin errores
- [ ] Build de producción funciona (`npm run build`)

---

## 8. Notas y Recomendaciones Adicionales

### Cosas que podrían agregarse pero no son prioridad ahora:
- **Testing:** Vitest para pruebas unitarias de hooks/componentes
- **Storybook:** Catálogo visual de componentes
- **CI/CD:** GitHub Actions para lint + type-check + build en cada PR
- **Monorepo tooling:** Turborepo si Glory crece a múltiples paquetes
- **React Server Components:** Cuando WordPress soporte SSR nativo
- **i18n:** Sistema de internacionalización con react-intl o next-intl

### Riesgos:
- La división de archivos PHP puede introducir bugs si no se testean las dependencias
- shadcn/ui asume Tailwind — activar uno activa el otro
- El generador de tipos requiere que la REST API esté accesible en dev

---

## ESTADO DEL PLAN

| Fase | Estado | Notas |
|------|--------|-------|
| Fase 1: Limpieza | Pendiente | — |
| Fase 2: Tooling TS | Pendiente | — |
| Fase 3: Tipos WP→TS | Pendiente | — |
| Fase 4: Refactorización | Pendiente | — |
| Fase 5: Arquitectura React | Pendiente | — |
| Fase 6: CLI Scaffolding | Pendiente | — |
| Fase 7: Documentación | Pendiente | — |

