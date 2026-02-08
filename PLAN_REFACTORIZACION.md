# Plan de Refactorización y Mejora de Arquitectura

Este documento detalla el estado actual de la refactorización bajo principios SOLID, DRY y Clean Code.

## 1. Problemas Identificados (Resueltos)

### A. Repetición de Código (DRY) - RESUELTO
- **Datos duplicados**: Servicios, testimonios, blog, showcase, skills, navegación ahora centralizados en `data/`.
- **`import.meta.glob` duplicado**: 4 llamadas diferentes en componentes ahora centralizadas en `hooks/useImagenes.ts`.
- **Tipos redundantes**: Todas las interfaces movidas a `types/`.

### B. Violación de SOLID - RESUELTO
- **SRP**: `ServiciosIsland` ya no define datos ni categorías. Componentes solo renderizan.
- **OCP**: Nuevos servicios/datos se agregan en `data/` sin tocar componentes.
- **DIP**: Componentes dependen de abstracciones (`types/`) no de datos concretos.

### C. Estilos y Malas Prácticas - RESUELTO
- **Estilos inline eliminados**: `Footer.tsx`, `ServicioIndividualIsland.tsx`, `SeccionShowcase.tsx`.
- **Variable faltante**: `--text-tertiary` agregada a `variables.css`.
- **Valores hardcoded en CSS**: rgba del Footer reemplazados por variables (`--white-5`, `--white-10`, `--white-40`).

---

## 2. Acciones Completadas

### Paso 1: Centralización de Tipos
- [x] `types/servicios.ts` - Interface `Servicio`
- [x] `types/contenido.ts` - `Testimonio`, `PostBlog`, `Proyecto`, `CategoriaShowcase`, `Skill`
- [x] `types/navegacion.ts` - `EnlaceNavegacion`, `EnlaceFooter`, `FiltroCategoria`
- [x] `types/index.ts` - Barrel export

### Paso 2: Centralización de Datos
- [x] `data/servicios.ts` - Fuente dinámica (Window -> Fallback)
- [x] `data/testimonios.ts` - Datos de testimonios
- [x] `data/blog.ts` - Datos de posts blog
- [x] `data/showcase.ts` - Datos de proyectos showcase
- [x] `data/navegacion.ts` - Links de header, footer, categorías de filtrado
- [x] `data/skills.ts` - Skills por defecto para servicios
- [x] `data/index.ts` - Barrel export

### Paso 3: Centralización de Imágenes (hooks/useImagenes.ts)
- [x] `IMAGENES_COLORS` - Catálogo colors (antes duplicado en SeccionBlog, useImagenes)
- [x] `IMAGENES_SHOWCASE` - Catálogo showcase (antes duplicado en CarruselShowcase, SeccionShowcase)
- [x] `LOGOS_CLIENTES` - Catálogo logos (antes en SeccionClientes)
- [x] Helpers: `obtenerImagen()`, `obtenerImagenShowcase()`, `obtenerImagenBlog()`

### Paso 4: Eliminación de Duplicados
- [x] `TarjetaServicio.tsx` + `.css` eliminados (reemplazados por `ServiceCard.tsx`)
- [x] `SeccionCtaServicio.tsx` + `.css` eliminados (reemplazados por `SeccionCta.tsx`)

### Paso 5: Layout Wrapper
- [x] `LayoutPagina.tsx` creado: wrapper con Header/Footer reutilizable
- [x] 3 Islands refactorizadas para usar `LayoutPagina` en vez de importar Header/Footer

### Paso 6: Arreglo de CSS
- [x] `--text-tertiary` agregada a variables.css
- [x] `--white-40` agregada a variables.css
- [x] Footer.css: rgba hardcoded reemplazados por variables CSS
- [x] ServicioIndividualIsland.css: width/overflow movidos de inline a clase
- [x] SeccionShowcase.css: clase `.proyectoCliente` para reemplazar inline style
- [x] SeccionTestimonios.css: slide-unit via CSS vars (no JS hardcoded)
- [x] Footer.tsx: clase `.botonFooter` en vez de style inline

---

## 3. Estructura de Carpetas Final

```text
App/React/
├── appIslands.tsx          <- Registro de islands
├── types/
│   ├── index.ts            <- Barrel export
│   ├── servicios.ts        <- Interface Servicio
│   ├── contenido.ts        <- Testimonio, PostBlog, Proyecto, Skill, etc.
│   └── navegacion.ts       <- EnlaceNavegacion, FiltroCategoria, etc.
├── data/
│   ├── index.ts            <- Barrel export
│   ├── servicios.ts        <- Fuente dinámica (Window -> Fallback)
│   ├── testimonios.ts      <- Datos testimonios
│   ├── blog.ts             <- Datos blog posts
│   ├── showcase.ts         <- Datos showcase/portfolio
│   ├── navegacion.ts       <- Links header/footer, categorías filtro
│   └── skills.ts           <- Skills por defecto
├── hooks/
│   ├── useImagenes.ts      <- ÚNICO punto de import.meta.glob (DRY)
│   ├── useServicios.ts     <- Lógica filtrado/búsqueda
│   └── useCarruselInfinito.ts <- Lógica carrusel drag + autoplay
├── styles/
│   ├── init.css             <- Reset y fuentes
│   ├── variables.css        <- Variables CSS globales
│   ├── header.css
│   └── bienvenida.css
├── islands/
│   ├── BienvenidaIsland.tsx <- Usa LayoutPagina
│   ├── ServiciosIsland.tsx  <- Usa LayoutPagina
│   └── ServicioIndividualIsland.tsx <- Usa LayoutPagina
├── components/
│   ├── layout/
│   │   ├── LayoutPagina.tsx <- Wrapper Header+main+Footer (DRY)
│   │   ├── Header.tsx       <- Usa ENLACES_HEADER de data/
│   │   └── Footer.tsx       <- Usa ENLACES_FOOTER de data/
│   ├── ui/
│   │   ├── Button.tsx       <- Botón genérico (variantes + tamaños)
│   │   ├── Badge.tsx        <- Etiqueta/tag
│   │   ├── SeccionHeader.tsx <- Header de sección reutilizable
│   │   ├── SeccionCta.tsx   <- CTA genérico configurable por props
│   │   └── ServiceCard.tsx  <- Tarjeta servicio (simple + detailed)
│   ├── home/
│   │   ├── SeccionHero.tsx
│   │   ├── SeccionClientes.tsx  <- Usa LOGOS_CLIENTES de useImagenes
│   │   ├── SeccionShowcase.tsx  <- Usa CATEGORIAS_SHOWCASE de data/
│   │   ├── CarruselShowcase.tsx <- Usa IMAGENES_SHOWCASE de useImagenes
│   │   ├── SeccionTestimonios.tsx <- Usa TESTIMONIOS de data/
│   │   ├── SeccionServicios.tsx <- Usa SERVICIOS_PRINCIPALES de data/
│   │   ├── SeccionContacto.tsx
│   │   ├── SeccionBlog.tsx      <- Usa POSTS_BLOG + obtenerImagenBlog
│   │   └── RandomImage.tsx
│   └── servicios/
│       ├── BarraFiltros.tsx      <- Usa FiltroCategoria de types/
│       ├── GridServicios.tsx     <- Usa ServiceCard
│       ├── SeccionHeroServicio.tsx
│       ├── SeccionGaleriaServicio.tsx <- Usa useImagenes + useCarrusel
│       ├── SeccionSkillsServicio.tsx  <- Usa Skill de types/
│       └── SeccionServiciosRelacionados.tsx <- Usa ServiceCard + data/
App/Content/
    └── defaultContent.php   <- Fuente de verdad ÚNICA (PHP)
App/Config/
    └── reactContext.php     <- Puente PHP -> React
```

## 4. Principios SOLID Aplicados

| Principio | Implementación |
|-----------|---------------|
| **SRP** | Cada componente solo renderiza. Datos en `data/`, lógica en `hooks/`, tipos en `types/` |
| **OCP** | Agregar servicio/testimonio/blog = editar un archivo en `data/`, sin tocar componentes |
| **LSP** | `ServiceCard` con variantes sustituibles. `LayoutPagina` wrappea cualquier contenido |
| **ISP** | Props mínimas y específicas en cada componente. `SeccionCta` acepta solo lo que necesita |
| **DIP** | Componentes dependen de interfaces (`types/`), no de implementaciones concretas |

## 5. Verificación Final

- [x] Cero `style={{...}}` prohibidos (solo dinámicos de carrusel/transform)
- [x] Cero `import.meta.glob` duplicados (solo en `useImagenes.ts`)
- [x] Cero tipos definidos dentro de componentes
- [x] Cero datos hardcoded dentro de componentes
- [x] Todas las variables CSS usadas (cero hardcoding de colores)
- [x] Archivos duplicados eliminados (`TarjetaServicio`, `SeccionCtaServicio`)

## 6. TO-DOs Futuros

- [ ] **WP REST API**: Conectar `SeccionBlog` con posts reales de WordPress
- [ ] **Backend Skills**: Migrar skills por servicio al backend (PHP -> React context)
- [ ] **Backend Testimonios**: Migrar testimonios al backend
- [ ] **Backend Showcase**: Migrar proyectos portfolio al backend
- [ ] **Menú dinámico**: Inyectar enlaces de navegación desde WordPress menus
- [ ] **tsconfig.json**: Resolver deprecación de `baseUrl` para TypeScript 7.0
- [ ] **Accesibilidad**: Revisar aria-labels y navegación por teclado
- [ ] **Tests**: Agregar tests unitarios para hooks (`useServicios`, `useCarruselInfinito`)
