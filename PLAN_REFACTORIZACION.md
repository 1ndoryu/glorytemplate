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
├── appIslands.tsx          <- Registro de 9 islands
├── types/
│   ├── index.ts            <- Barrel export
│   ├── servicios.ts        <- Interface Servicio (con skills)
│   ├── contenido.ts        <- Testimonio, PostBlog, Proyecto, Skill, Miembro, Marca
│   └── navegacion.ts       <- EnlaceNavegacion, FiltroCategoria, SubEnlace
├── data/
│   ├── index.ts            <- Barrel export
│   ├── servicios.ts        <- Window.GLORY_CONTEXT -> Fallback
│   ├── testimonios.ts      <- PHP context -> Fallback
│   ├── blog.ts             <- PHP context -> Fallback
│   ├── showcase.ts         <- Proyectos (PHP -> Fallback), CATEGORIAS_SHOWCASE
│   ├── navegacion.ts       <- Links, categorias filtro, CATEGORIAS_PROYECTOS
│   ├── skills.ts           <- Skills por defecto (con descripcion)
│   ├── miembros.ts         <- Equipo (PHP -> Fallback)
│   └── marcas.ts           <- Clientes (PHP -> Fallback)
├── hooks/
│   ├── useImagenes.ts      <- UNICO punto de import.meta.glob (DRY)
│   ├── useServicios.ts     <- Logica filtrado/busqueda
│   └── useCarruselInfinito.ts <- Logica carrusel drag + autoplay
├── styles/
│   ├── init.css             <- Reset y fuentes
│   ├── variables.css        <- Variables CSS (padding, transiciones, colores)
│   ├── header.css           <- Header con submenu dropdown
│   └── bienvenida.css
├── islands/
│   ├── BienvenidaIsland.tsx          <- Home
│   ├── ServiciosIsland.tsx           <- Listado servicios
│   ├── ServicioIndividualIsland.tsx   <- Single servicio
│   ├── ProyectosIsland.tsx           <- Listado proyectos (filtrable)
│   ├── ProyectoIndividualIsland.tsx   <- Single proyecto
│   ├── NosotrosIsland.tsx            <- About (equipo, mision, marcas)
│   ├── BlogIsland.tsx                <- Listado blog
│   ├── SolucionesIsland.tsx          <- Landing soluciones
│   └── SolucionPlaceholderIsland.tsx  <- Placeholder sub-soluciones
├── components/
│   ├── layout/
│   │   ├── LayoutPagina.tsx <- Wrapper Header+main+Footer (DRY)
│   │   ├── Header.tsx       <- Submenu dropdown, boton Contacto
│   │   └── Footer.tsx
│   ├── ui/
│   │   ├── Button.tsx, Badge.tsx, SeccionHeader.tsx
│   │   ├── SeccionCta.tsx   <- CTA generico por props
│   │   └── ServiceCard.tsx
│   ├── home/
│   │   ├── SeccionHero, SeccionClientes, SeccionShowcase
│   │   ├── CarruselShowcase, SeccionTestimonios, SeccionServicios
│   │   ├── SeccionContacto, SeccionBlog, RandomImage
│   └── servicios/
│       ├── BarraFiltros, GridServicios, SeccionHeroServicio
│       ├── SeccionGaleriaServicio, SeccionSkillsServicio (click-to-expand)
│       └── SeccionServiciosRelacionados
App/Content/
    ├── defaultContent.php   <- Fuente de verdad (servicios, proyectos, testimonios, marcas, miembros)
    └── postType.php         <- PostTypes: servicio, proyecto, testimonio, marca, miembro
App/Config/
    ├── reactContext.php     <- Puente PHP -> React (5 tipos de datos)
    └── pages.php            <- 8 paginas + 3 sub-soluciones
Templates PHP/
    ├── single-servicio.php  <- Single de servicio (React island)
    └── single-proyecto.php  <- Single de proyecto (React island)
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

## 6. ROADMAP DE TAREAS (Priorizado)

Estado: PENDIENTE | EN PROGRESO | COMPLETADO

---

### FASE 1: BUGS CRÍTICOS Y BASE TÉCNICA

#### 1.1 COMPLETADO - Fix Internal Server Error en pagina de Servicios
- Diagnosticado: conflicto entre PostType `servicio` (has_archive => true, rewrite => servicios) y PageManager::reactPage('servicios')
- Solucion: `has_archive => false` en postType.php

#### 1.2 COMPLETADO - Centralizar padding de secciones (CSS)
- Variables `--seccion-padding-x`, `--seccion-padding-y`, `--transicion-rapida`, `--transicion-media` en variables.css

#### 1.3 COMPLETADO - Navegacion real del Header
- Enlaces reales con submenu dropdown para Soluciones
- Fix hover del submenu (eliminado margin-top por padding-top)
- Boton "Contacto" en cabecera

---

### FASE 2: NAVEGACIÓN SPA (SIN RECARGA)

#### 2.1 EN PROGRESO - Sistema de navegacion SPA
- AjaxNav de Glory configurado en config.php con contentSelector('#main') y mainScrollSelector('#main')
- TO-DO: Verificar compatibilidad AjaxNav con islands React. Si no funciona, evaluar React Router.

#### 2.2 EN PROGRESO - Navegacion central
- Islands registradas como paginas independientes en PageManager
- Compatibilidad con single-servicio.php y single-proyecto.php para URLs directas (SEO)
- TO-DO: Prefetch de datos al hover

---

### FASE 3: BACKEND - TODOS LOS DATOS DESDE PHP

#### 3.1 COMPLETADO - PostTypes completos en WordPress
- [x] `servicio` - Corregido has_archive
- [x] `proyecto` - Publico, rewrite /proyectos/
- [x] `testimonio` - Privado, sin single
- [x] `marca` - Privado, sin single
- [x] `miembro` - Privado, sin single
- [x] `blog` - Post nativo de WP

#### 3.2 COMPLETADO - DefaultContent para todos los PostTypes
- [x] 9 Servicios con skills (titulo + descripcion)
- [x] 6 Proyectos con skills, cliente, categorias, link
- [x] 4 Testimonios, 4 Marcas, 4 Miembros del equipo

#### 3.3 COMPLETADO - Contexto React ampliado (reactContext.php)
- [x] Reescritura completa, inyecta 5 tipos en window.GLORY_CONTEXT

#### 3.4 COMPLETADO - Data layer React consume contexto PHP
- [x] Todos los data/*.ts usan window.GLORY_CONTEXT con fallback
- [x] Nuevos: data/miembros.ts, data/marcas.ts
- [x] Tipos expandidos: Miembro, Marca, SubEnlace, Proyecto, Skill
- [x] Showcase del home: proyectos son links clickeables

---

### FASE 4: PÁGINAS NUEVAS

#### 4.1 COMPLETADO - Pagina de Proyectos (/proyectos/)
- ProyectosIsland.tsx + .css: Grid filtrable con BarraFiltros

#### 4.2 COMPLETADO - Single Proyecto (/proyectos/slug/)
- ProyectoIndividualIsland.tsx + .css + single-proyecto.php
- Hero, Imagen, Skills click-to-expand, CTA, Relacionados

#### 4.3 COMPLETADO - Pagina Nosotros (/nosotros/)
- NosotrosIsland.tsx + .css: Hero, Mision/Valores, Equipo, Marcas, Testimonios, Contacto

#### 4.4 COMPLETADO - Pagina Blog (/blog/)
- BlogIsland.tsx + .css: Filtros por categoria, post destacado, grid
- TO-DO: Conectar con WP REST API para paginacion real

#### 4.5 COMPLETADO - Pagina Soluciones (/soluciones/)
- SolucionesIsland.tsx + .css: Landing con 3 cards (Hosting, VPS, Agentes de IA)

#### 4.6 COMPLETADO - Subpaginas Soluciones (placeholder)
- SolucionPlaceholderIsland.tsx + .css reutilizable
- /soluciones/hosting/, /soluciones/vps/, /soluciones/agentes-ia/ en pages.php

#### 4.7 COMPLETADO - Registro de islands y paginas
- appIslands.tsx: 9 islands registradas
- pages.php: 8 paginas + 3 sub-soluciones

---

### FASE 5: SKILLS - REDISEÑO UX

#### 5.1 COMPLETADO - Quitar skillImagenWrapper de las skills
- Eliminada imagen, al click muestra descripcion con animacion toggle
- Accesibilidad: role="button", tabIndex, onKeyDown

---

### FASE 6: INTERNACIONALIZACIÓN (i18n)

#### 6.1 PENDIENTE - Sistema de idiomas espanol/ingles
- Crear sistema de traducciones (context + hook `useIdioma`)
- Archivo de traducciones: `i18n/es.ts`, `i18n/en.ts`
- Selector de idioma en el Header
- URLs con prefijo para SEO (/en/servicios/, /es/servicios/)

#### 6.2 PENDIENTE - SEO bilingue
- Meta tags `hreflang`, `<link rel="alternate">`
- Sitemap XML y Schema.org bilingue

---

### FASE 7: SEO AVANZADO

#### 7.1 PENDIENTE - SEO tecnico
- Meta tags dinamicos, Schema.org JSON-LD, OG, Twitter Cards
- Canonical URLs, Sitemap XML, robots.txt

#### 7.2 PENDIENTE - Rendimiento y Core Web Vitals
- Lazy loading, WebP/AVIF, preload fuentes, critical CSS

---

### FASE 8: SERVICIOS - PLANES Y PAGOS

#### 8.1 PENDIENTE - Planes por servicio
- Plan Basico, Avanzado, Personalizado por servicio
- UI: `PlanesServicio.tsx`, datos como meta en PHP

#### 8.2 PENDIENTE - Integracion Stripe (futuro)
- API keys desde .env, checkout directo
- NOTA: Implementar cuando el usuario configure las keys

---

### FASE 9: CONTACTO Y CHATBOT

#### 9.1 PENDIENTE - Formulario de contacto mejorado
- Campos: nombre, correo, descripcion, presupuesto
- Al enviar -> abre chat en tiempo real

#### 9.2 PENDIENTE - Chatbot inteligente
- WebSocket (Ratchet) o API polling
- Flujo: detalles -> presupuesto -> pago
- NOTA: Implementar cuando el usuario provea APIs

---

### FASE 10: AUDITORÍA SOLID Y LIMPIEZA

#### 10.1 PENDIENTE - Revision profunda SOLID
- [ ] SRP: max 3 useState por componente
- [ ] Limites de archivo: 300 componentes, 120 hooks, 150 utils
- [ ] ISP, DIP, OCP verificados

#### 10.2 PENDIENTE - Accesibilidad (a11y)
- aria-labels, navegacion teclado, skip links, contraste WCAG AA

#### 10.3 PENDIENTE - Tests
- Tests unitarios hooks, tests integracion navegacion SPA

---

## 7. Dudas para el usuario (responder aqui mismo)

1. **AjaxNav vs React Router**: Glory usa AjaxNav en config.php. Se prueba primero, si no es compatible con islands se implementa React Router. RESUELTO.

2. **URLs i18n**: Prefijo URL para SEO (/en/services/). RESUELTO.

3. **Blog**: Posts nativos de WP. RESUELTO.

4. **Nombre del sitio**: Nakomi. RESUELTO.

5. **Hosting/VPS/Agentes IA**: Seran paginas independientes (PageManager). RESUELTO y creadas como placeholders.

---

## Comentarios del usuario (area de comunicacion)

0. [RESUELTO] Eliminados emojis del roadmap, todo con texto.
1. [RESUELTO] Submenu hover se cerraba al mover cursor. Fix: eliminado margin-top, reemplazado con padding-top transparente para mantener continuidad del hover.
2. [EN PROGRESO] Pagina de servicio error + navegacion no es fluida. El error 500 se arreglo (has_archive conflict), pero la navegacion SPA depende de AjaxNav de Glory. TO-DO: verificar que AjaxNav rehidrate islands correctamente despues de navegacion AJAX.
3. [EN REVISION] Imagenes de Selected Work: usan import.meta.glob de Glory/assets/images/showcase/. Las imagenes existen. Posible problema: Vite en dev mode no resuelve los paths correctamente o falta rebuild. Verificar en navegador.
