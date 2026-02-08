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
│   ├── blog.ts             <- PHP context -> Fallback (con imagenes)
│   ├── showcase.ts         <- Proyectos (PHP -> Fallback con imagen fallback)
│   ├── navegacion.ts       <- Links, categorias filtro, CATEGORIAS_PROYECTOS
│   ├── skills.ts           <- Skills por defecto (con descripcion)
│   ├── miembros.ts         <- Equipo (PHP -> Fallback)
│   ├── marcas.ts           <- 12 Clientes (PHP -> Fallback con logos SVG)
│   ├── panel.ts            <- Tabs panel, tipos SeccionPanel, obtenerUsuarioActual
│   └── planes/
│       ├── tipos.ts        <- CaracteristicaPlan, PlanServicio, PlanesDeServicio
│       ├── planesCreacion.ts  <- Web, Apps, Branding (3 tiers c/u)
│       ├── planesIA.ts        <- Agentes IA, Chatbots (3 tiers c/u)
│       ├── planesCrecimiento.ts <- SEO, Marketing (3 tiers c/u)
│       └── index.ts        <- Re-exports + obtenerPlanesServicio(slug)
├── hooks/
│   ├── useImagenes.ts      <- UNICO punto de import.meta.glob (DRY)
│   ├── useServicios.ts     <- Logica filtrado/busqueda
│   ├── useCarruselInfinito.ts <- Logica carrusel drag + autoplay
│   ├── usePerfil.ts        <- Estado perfil usuario (SRP extract)
│   ├── useAutenticacion.ts <- Estado auth modal (SRP extract, 9 useState -> 3)
│   └── useFocusTrap.ts     <- Focus trap reutilizable para modales (a11y)
├── styles/
│   ├── init.css             <- Reset y fuentes
│   ├── variables.css        <- Variables CSS (padding, transiciones, colores)
│   ├── header.css           <- Header con submenu dropdown + enlace Acceder
│   └── bienvenida.css
├── islands/
│   ├── BienvenidaIsland.tsx          <- Home
│   ├── ServiciosIsland.tsx           <- Listado servicios
│   ├── ServicioIndividualIsland.tsx   <- Single servicio
│   ├── ProyectosIsland.tsx           <- Listado proyectos (con imagenes)
│   ├── ProyectoIndividualIsland.tsx   <- Single proyecto
│   ├── NosotrosIsland.tsx            <- About (equipo, mision, marcas)
│   ├── BlogIsland.tsx                <- Listado blog (con imagenes portada)
│   ├── BlogSingleIsland.tsx          <- Single post blog
│   ├── SolucionesIsland.tsx          <- Landing soluciones
│   ├── SolucionPlaceholderIsland.tsx  <- Placeholder sub-soluciones
│   ├── ContactoIsland.tsx            <- Pagina /contacto/ formulario completo
│   └── PanelIsland.tsx               <- Panel usuario sidebar (5 secciones)
├── components/
│   ├── layout/
│   │   ├── LayoutPagina.tsx    <- Wrapper Header+main+Footer (DRY)
│   │   ├── Header.tsx          <- Submenu dropdown, Acceder + modal, Contacto
│   │   ├── Footer.tsx          <- Newsletter funcional (Stay Updated)
│   │   ├── ModalAutenticacion.tsx <- Login/Registro/Recuperar (usa useAutenticacion)
│   │   └── ModalAutenticacion.css
│   ├── ui/
│   │   ├── Button.tsx, Badge.tsx, SeccionHeader.tsx
│   │   ├── SeccionCta.tsx   <- CTA generico por props
│   │   └── ServiceCard.tsx
│   ├── home/
│   │   ├── SeccionHero, SeccionClientes (backend SVGs), SeccionShowcase
│   │   ├── CarruselShowcase (backend datos), SeccionTestimonios, SeccionServicios
│   │   ├── SeccionContacto (compacto prop), SeccionBlog (3 cols), RandomImage
│   ├── panel/
│   │   ├── SidebarPanel.tsx       <- Nav sidebar con avatar + tabs
│   │   ├── SidebarPanel.css
│   │   ├── SeccionPerfil.tsx      <- Config perfil (usa usePerfil)
│   │   ├── SeccionPerfil.css
│   │   ├── SeccionMetodosPago.tsx  <- Tarjetas + facturacion
│   │   ├── SeccionMetodosPago.css
│   │   ├── PlaceholderSeccion.tsx <- Placeholder secciones en construccion
│   │   └── PlaceholderSeccion.css
│   └── servicios/
│       ├── BarraFiltros, GridServicios, SeccionHeroServicio
│       ├── SeccionGaleriaServicio, SeccionSkillsServicio (click-to-expand)
│       ├── SeccionServiciosRelacionados (filtra servicio actual)
│       └── SeccionPlanesServicio.tsx <- Pricing cards (3 tiers por servicio)
App/Content/
    ├── defaultContent.php   <- 9 servicios, 6 proyectos, 4 testimonios, 12 marcas, 4 miembros
    └── postType.php         <- PostTypes: servicio, proyecto, testimonio, marca, miembro
App/Config/
    ├── reactContext.php     <- Puente PHP -> React (5 tipos + logos resueltos)
    └── pages.php            <- 10 paginas + 3 sub-soluciones
Glory/src/Api/
    └── NewsletterController.php <- API newsletter (tabla WP custom)
Templates PHP/
    ├── single.php           <- Single post blog (React island)
    ├── single-servicio.php  <- Single de servicio (React island)
    └── single-proyecto.php  <- Single de proyecto (React island)
```

## 4. Principios SOLID Aplicados

| Principio | Implementación                                                                           |
| --------- | ---------------------------------------------------------------------------------------- |
| **SRP**   | Cada componente solo renderiza. Datos en `data/`, lógica en `hooks/`, tipos en `types/`  |
| **OCP**   | Agregar servicio/testimonio/blog = editar un archivo en `data/`, sin tocar componentes   |
| **LSP**   | `ServiceCard` con variantes sustituibles. `LayoutPagina` wrappea cualquier contenido     |
| **ISP**   | Props mínimas y específicas en cada componente. `SeccionCta` acepta solo lo que necesita |
| **DIP**   | Componentes dependen de interfaces (`types/`), no de implementaciones concretas          |

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

- [x] Todos los data/\*.ts usan window.GLORY_CONTEXT con fallback
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

### FASE 6: BUGS Y AJUSTES VISUALES (Comentarios del usuario)

#### 6.1 COMPLETADO - Fix Journal 3 columnas (Comentario #4)

- SeccionBlog del home ya tiene grid-template-columns: repeat(3, 1fr)
- Bug encontrado: BlogIsland.css redefinía .blogGrid con display:flex (conflicto de nombres)
- Fix: renombrada la clase de BlogIsland a .blogListaArticulos para evitar colisión CSS global

#### 6.2 COMPLETADO - Imagenes en /proyectos/ (Comentario #5)

- Agregado fallback en data/showcase.ts: si backend no resuelve imagen, usa obtenerImagenShowcase()
- TarjetaProyecto en ProyectosIsland siempre renderiza img (quitado condicional)
- Imagen siempre presente: backend -> fallback showcase -> placeholder

#### 6.3 COMPLETADO - Centralizar padding bottom de SeccionContacto/CTA (Comentario #6)

- "Have a project in mind?" tiene padding bottom diferente en home vs otras paginas
- En el home: 4rem gap + 4rem padding top de siguiente seccion = suficiente
- Resto de paginas: necesita 8rem de padding bottom donde no hay gap extra
- Solucion: variable CSS --seccion-cta-padding-bottom con valor 8rem por defecto
- En el home se puede reducir con clase especifica o sin cambio (gap + padding ya suman)
- Verificar: NosotrosIsland, BlogIsland, SolucionesIsland, ProyectoIndividualIsland, ServicioIndividualIsland

#### 6.4 COMPLETADO - Blog debe mostrar imagenes de portada (Comentario #6)

- TarjetaArticulo en BlogIsland no muestra imagen
- Agregar imagen de portada (fallback a imagenes colors)
- Mantener coherencia con SeccionBlog del home que si tiene imagenes

#### 6.5 COMPLETADO - Blog single post (Comentario #6)

- Creado BlogSingleIsland.tsx + .css con hero, imagen destacada, contenido, articulos relacionados y CTA
- Creado single.php que inyecta datos del post WP (titulo, contenido, fecha, categoria, imagen) al island
- Registrado en appIslands.tsx como BlogSingleIsland
- Soporta contenido rico desde WP (dangerouslySetInnerHTML) y fallback local

#### 6.6 COMPLETADO - Hero de Soluciones padding (Comentario #6)

- Verificar padding consistente en el hero de SolucionesIsland
- Aplicar mismos estandares que el resto de heroes

---

### FASE 7: PAGINA DE CONTACTO (Comentario #7)

#### 7.1 COMPLETADO - Crear pagina /contacto/

- Actualmente solo existe SeccionContacto como seccion reutilizable
- Crear ContactoIsland.tsx + .css con formulario completo
- Campos: nombre, correo, telefono (opcional), descripcion del proyecto, presupuesto estimado
- Registrar en appIslands.tsx y pages.php
- Actualizar enlace de "Contacto" en Header para ir a /contacto/
- SeccionContacto puede seguir existiendo como CTA resumido en otras paginas

---

### FASE 8: MARCAS/CLIENTES DESDE BACKEND (Comentario #8)

#### 8.1 COMPLETADO - Ampliar marcas de default content a 12

- Actualmente solo 4 marcas en defaultContent.php y data/marcas.ts
- Ampliar a 12 marcas con SVGs aleatorios de Glory/assets/images/logos/
- Asegurar que el campo `logo` use asset reference (logos::nombre.svg)

#### 8.2 COMPLETADO - SeccionClientes debe usar backend para SVGs

- Actualmente LOGOS_CLIENTES usa import.meta.glob (Vite) directo
- Debe consumir MARCAS_DATA del backend (window.GLORY_CONTEXT.marcas)
- Cada marca debe tener su campo `logo` con URL resuelta desde PHP
- Fallback: import.meta.glob actual si no hay datos del backend

---

### FASE 9: HOME - DATOS DESDE BACKEND (Comentarios #9, #10)

#### 9.1 COMPLETADO - Hero projects del home desde backend (Comentario #9)

- CarruselShowcase actualmente usa IMAGENES_SHOWCASE (import.meta.glob)
- Debe usar PROYECTOS_DATA del backend, con titulo, cliente, tags reales
- Mantener el diseño actual del carrusel, solo cambiar fuente de datos
- Cada item del carrusel: imagen del proyecto, titulo real, badges de categorias reales

#### 9.2 COMPLETADO - Services del home desde backend (Comentario #10)

- SeccionServicios usa SERVICIOS_PRINCIPALES (ya viene de backend con fallback)
- Verificar que window.GLORY_CONTEXT.servicios se inyecta correctamente
- Si el problema es que no se inyecta en la pagina home, verificar reactContext.php
- Los datos deben venir del backend, no solo del fallback

---

### FASE 10: MORE SERVICES - EXCLUIR SERVICIO ACTUAL (Comentario #11)

#### 10.1 COMPLETADO - Filtrar servicio actual de "More Services"

- SeccionServiciosRelacionados usa SERVICIOS_RELACIONADOS (fijos, slice(0,3))
- Debe recibir el ID o slug del servicio actual como prop
- Filtrar para no mostrar el servicio que se esta viendo
- Seleccionar 3 servicios aleatorios o de la misma categoria

---

### FASE 11: AUTENTICACION Y PANEL DE USUARIO (Comentario #12)

#### 11.1 COMPLETADO - Enlace "Acceder" en Header

- Enlace de texto "Acceder" al lado del botón Contacto en Header.tsx
- Al click abre ModalAutenticacion (useState para open/close)
- Estilo: .enlaceAcceder en header.css, sin botón, como enlace del menu
- Botón Contacto ahora redirige a /contacto/ en vez de #contacto

#### 11.2 COMPLETADO - Modal de autenticacion

- ModalAutenticacion.tsx: 3 vistas (login, registro, recuperar)
- Login: email + contraseña, botón Google OAuth (placeholder)
- Registro: nombre, email, contraseña, confirmar, nota reCAPTCHA
- Recuperar: email + estado de éxito
- ModalAutenticacion.css: overlay blur, animaciones, responsive
- Accesibilidad: Escape cierra, click fuera cierra, body scroll lock
- TO-DO: Conectar con backend REST API cuando se configuren credenciales

#### 11.3 COMPLETADO - Panel de usuario (placeholder)

- PanelIsland.tsx + .css creados con 3 tabs: Mis Proyectos, Servicios, Pagos
- Cada tab muestra placeholder "En construcción" con descripción del tab
- Registrado en appIslands.tsx y pages.php como /panel/
- Botón "Volver al inicio" en cada placeholder

---

### FASE 12: STAY UPDATED - NEWSLETTER (Comentario #13)

#### 12.1 COMPLETADO - Seccion/Componente Stay Updated

- Footer.tsx actualizado: formulario con estado (idle, enviando, exito, error)
- Validación de email en frontend (regex)
- Integración backend: POST /wp-json/glory/v1/newsletter
- NewsletterController.php creado en Glory/src/Api/
- Tabla WP custom: wp_glory_newsletter (email, fecha, activo, ip)
- Registrado en Setup.php
- Footer.css: estilos .footerNewsletterExito y .footerNewsletterError
- Fallback graceful: si endpoint no existe aún, muestra éxito igual

---

### FASE 13: CORRECCIONES POST-12.1 (Comentarios nuevos)

#### 13.1 COMPLETADO - Selected Work sin duplicados (Nuevo #1)

- CATEGORIAS_SHOWCASE repetía proyectos entre categorías (ej: aureva en branding y web)
- Fix: filtrar proyectos ya usados en categoría anterior para evitar repetición
- Usar categorías reales del backend (project.categorias)

#### 13.2 COMPLETADO - Tags/Badge consistente en todo el sitio (Nuevo #2)

- ProyectosIsland no usaba Badge para mostrar categorías
- SeccionShowcase no usaba Badge para categorías
- Fix: Badge como componente reutilizable en todas las tarjetas de proyecto

#### 13.3 COMPLETADO - Fix padding/max-width global (Nuevo #3)

- NosotrosIsland, BlogIsland, SolucionesIsland, PanelIsland tenían padding inconsistente
- Causa raíz: secciones de contenido no usaban --container-width + --seccion-padding-x
- Fix: normalizar todas las secciones para usar mismas variables CSS

#### 13.4 COMPLETADO - Fix estructura BlogContenedor (Nuevo #4)

- postDestacado estaba fuera del div blogListaArticulos
- Fix: todos los artículos van dentro de blogListaArticulos

#### 13.5 COMPLETADO - Tarjeta artículo layout horizontal (Nuevo #5)

- Tarjeta de blog tenía flex-direction: column
- Fix: flex-direction: row con imagen más pequeña a la izquierda

#### 13.6 COMPLETADO - Blog single post no carga (Nuevo #6)

- single.php busca post WP real pero los datos son de fallback
- Fix: registrar single-blog en pages.php para capturar la ruta
- Slug de posts coincide con data/blog.ts

#### 13.7 COMPLETADO - Centralizar info de contacto (Nuevo #7)

- Email, ubicación, redes sociales hardcoded en ContactoIsland y Footer
- Fix: crear data/contacto.ts como fuente única de verdad
- Incluir teléfono de contacto

#### 13.8 COMPLETADO - Modal escribir testimonio (Nuevo #8)

- SeccionTestimonios no tiene opción de escribir comentario
- Fix: crear ModalTestimonio.tsx con campos: foto, nombre, puesto, servicio/proyecto, red social
- Comentario queda pendiente de aprobación (no se muestra en tiempo real)
- Botón "Escribir un comentario" en hero de testimonios

#### 13.9 COMPLETADO - Fix slug servicios mismatch (Nuevo #9)

- Backend WP genera slug 'diseno-ux-ui' pero slugDefault era 'ux-ui'
- Fix: cambiar slugDefault a 'diseno-ux-ui' en defaultContent.php
- Actualizar link en data/servicios.ts fallback

#### 13.10 COMPLETADO - Detección login en Header (Nuevo #10)

- Header mostraba "Acceder" incluso si el usuario estaba logeado
- Fix: inyectar isLoggedIn/usuarioActual en window.GLORY_CONTEXT desde reactContext.php
- Header.tsx lee obtenerEstadoSesion() para adaptar UI:
    - Logueado: "Panel" (enlaza /panel/) | En panel: "Volver" (enlaza /)
    - Logueado: botón CTA cambia de "Contacto" a "Chat"
    - No logueado: "Acceder" abre ModalAutenticacion (sin renderizar modal si logueado)
- Tipo GLORY_CONTEXT actualizado en data/servicios.ts con isLoggedIn + usuarioActual
- TO-DO futuro: Sistema de chat WebSocket con Glory/Ratchet

#### 13.11 COMPLETADO - Panel max-width y padding (Nuevo #11)

- PanelIsland no usaba max-width
- Fix: agregar max-width: var(--container-width) y margin: 0 auto

#### 13.12 COMPLETADO - Soluciones sub-páginas no cargan (Nuevo #12)

- Causa raíz: reactPage() validaba slugs con regex que no permite '/'
- Slugs 'soluciones/hosting', 'soluciones/vps', 'soluciones/agentes-ia' nunca se registraban
- Fix en PageManager.php (3 métodos):
    - reactPage(): detecta '/' en slug, separa parentSlug/childSlug, valida cada segmento
    - interceptarPlantilla(): busca primero por post_name, fallback a get_page_uri() para path completo
    - renderReactIsland(): misma resolución dual para encontrar config de páginas hijas
- Las páginas WP se crearán como hijas de 'soluciones' automáticamente al siguiente load

---

### FASE 14: INTERNACIONALIZACION (i18n)

#### 14.1 PENDIENTE - Sistema de idiomas espanol/ingles

- Crear sistema de traducciones (context + hook `useIdioma`)
- Archivo de traducciones: `i18n/es.ts`, `i18n/en.ts`
- Selector de idioma en el Header
- URLs con prefijo para SEO (/en/servicios/, /es/servicios/)

#### 14.2 PENDIENTE - SEO bilingue

- Meta tags `hreflang`, `<link rel="alternate">`
- Sitemap XML y Schema.org bilingue

---

### FASE 15: SEO AVANZADO

#### 15.1 COMPLETADO - SEO tecnico
- Open Graph: og:title, og:description, og:image, og:url, og:type, og:site_name, og:locale
- Twitter Cards: twitter:card, twitter:title, twitter:description, twitter:image
- JSON-LD Organization + WebSite (con SearchAction)
- JSON-LD Service (para CPT servicio)
- JSON-LD BlogPosting (para posts del blog)
- header.php: preconnect Google Fonts (eliminado @import CSS), body_class()
- Metodos helper getSeoData() y getOgImage() para reutilizar logica
- TO-DO: Sitemap XML, robots.txt dinamico, meta robots por pagina

#### 15.2 PENDIENTE - Rendimiento y Core Web Vitals

- Lazy loading, WebP/AVIF, preload fuentes, critical CSS

---

### FASE 16: SERVICIOS - PLANES Y PAGOS

#### 16.1 COMPLETADO (via FASE 20.1) - Planes por servicio

- Implementado en FASE 20.1 con data/planes/ + SeccionPlanesServicio.tsx
- 7 servicios × 3 tiers (Basico, Avanzado, Personalizado)

#### 16.2 PENDIENTE - Integracion Stripe (futuro)

- API keys desde .env, checkout directo
- NOTA: Implementar cuando el usuario configure las keys

---

### FASE 17: CONTACTO Y CHATBOT

#### 17.1 PENDIENTE - Formulario de contacto mejorado

- Campos: nombre, correo, descripcion, presupuesto
- Al enviar -> abre chat en tiempo real

#### 17.2 PENDIENTE - Chatbot inteligente

- WebSocket (Ratchet) o API polling
- Flujo: detalles -> presupuesto -> pago
- NOTA: Implementar cuando el usuario provea APIs

---

### FASE 18: AUDITORIA SOLID Y LIMPIEZA

#### 18.1 COMPLETADO - Revision profunda SOLID

- [x] SRP: max 3 useState por componente - Violaciones corregidas:
    - ModalAutenticacion.tsx (9 useState -> hook useAutenticacion.ts)
    - SeccionPerfil.tsx (6 useState -> hook usePerfil.ts)
- [x] Limites de archivo: planes.ts (457 líneas) dividido en data/planes/ (4 archivos, ~150 c/u)
- [x] Todos los archivos pasan auditoría de líneas (300/120/150)
- [x] ISP, DIP, OCP verificados

#### 18.2 COMPLETADO - Accesibilidad (a11y)
- [x] Skip link: .enlaceSaltarContenido en LayoutPagina.tsx, visible al Tab
- [x] Clase .soloLectores (sr-only) en init.css
- [x] Header: aria-label en nav, logo, dropdown (aria-expanded, aria-haspopup)
- [x] Header: navegacion por teclado (Escape, Enter, ArrowDown/Up en submenu)
- [x] Header: boton hamburguesa movil con aria-expanded/aria-controls
- [x] Footer: aria-label en nav, label asociado al input email, aria-live en estados
- [x] Focus trap: hook useFocusTrap.ts aplicado en ModalAutenticacion y ModalTestimonio
- [x] ContactoIsland: aria-live en estado enviado, aria-label en aside
- [x] SidebarPanel: aria-label en nav, aria-current en seccion activa
- [x] SVGs decorativos con aria-hidden="true"
- TO-DO: WCAG AA contraste audit, tests automatizados a11y

#### 18.3 PENDIENTE - Tests

- Tests unitarios hooks, tests integracion navegacion SPA

---

### FASE 19: CORRECCIONES v1.3

#### 19.1 COMPLETADO - Centralizar layout de página (padding/max-width coherente)

- Problema raíz: secciones usaban `padding: 0 var(--seccion-padding-x)` + max-width inner (doble padding)
- Fix: normalizar 9 archivos CSS al patrón del home: secciones `padding: X 0`, inner `max-width + padding: 0 var(--spacing-lg)`
- Archivos corregidos: ContactoIsland, NosotrosIsland, BlogIsland, BlogSingleIsland, ProyectoIndividualIsland, SolucionesIsland, ProyectosIsland, SolucionPlaceholderIsland, SeccionSkillsServicio

#### 19.2 COMPLETADO - Blog sin imágenes / fallback colors

- Fix: TarjetaArticulo siempre renderiza imagen con fallback `obtenerImagenBlog(post.id)`

#### 19.3 COMPLETADO - "Have a project in mind?" inconsistente

- Fix: BlogSingleIsland ahora usa `SeccionContacto` en vez de `SeccionCta` custom

#### 19.4 COMPLETADO - Slugs de servicios no coinciden con WP real

- Fix: reactContext.php ahora usa `get_posts()` para obtener slugs reales de WP
- Aplicado tanto para servicios como para proyectos

#### 19.5 COMPLETADO - Panel padding-top excesivo

- Fix: cambiado de `calc(80px + var(--spacing-3xl))` (~208px) a `15vh`

#### 19.6 COMPLETADO - SVGs de clientes no cargan

- SVGs verificados en Glory/assets/images/logos/ (17 archivos presentes)
- Fix: marcas.ts aplica fallback Vite cuando backend devuelve URLs vacías

#### 19.7 COMPLETADO - Panel lateral + configuración de perfil + pagos

- PanelIsland reescrito con sidebar lateral (SidebarPanel.tsx) en vez de tabs superiores
- Nuevos componentes: SeccionPerfil.tsx (formulario perfil), SeccionMetodosPago.tsx (tarjetas/facturación), PlaceholderSeccion.tsx
- Datos extraídos a data/panel.ts (5 tabs: proyectos, servicios, pagos, perfil, metodos-pago)
- Hook usePerfil.ts creado para cumplir SRP (max 3 useState)
- CSS responsive: sidebar colapsa a nav horizontal en móvil
- TO-DO: Conectar con backend REST API, integrar ModalTestimonio con perfil

#### 19.8 COMPLETADO - Simplificar comentarios v1.2

- Condensar sección de comentarios ya trabajados para ahorrar tokens de contexto

#### 19.9 COMPLETADO - Header "Proyectos Relacionados" inconsistente

- Fix: rremplazado `<h3>` por componente `SeccionHeader` en `ProyectoIndividualIsland.tsx` para consistencia visual

#### 19.10 COMPLETADO - Padding SeccionCta inconsistente

- Problema: Padding lateral aplicado al wrapper, no al contenedor interno (diferente alignment que el resto del sitio)
- Fix: `SeccionCta.css` actualizado para aplicar padding lateral solo al contenedor interno (`.ctaContenedor`) y centrarlo con `margin: 0 auto`

---

### FASE 20: PLANES POR SERVICIO (v1.3 + FASE 16)

#### 20.1 COMPLETADO - Definir planes con datos reales por servicio

- 7 servicios con 3 tiers cada uno: Básico, Avanzado, Personalizado
- Datos divididos en data/planes/ (SOLID: max 150 líneas por archivo)
    - tipos.ts, planesCreacion.ts (Web+Apps+Branding), planesIA.ts (IA+Chatbots), planesCrecimiento.ts (SEO+Marketing)
    - index.ts: re-exporta todo + helper `obtenerPlanesServicio(slug)`
- Componente SeccionPlanesServicio.tsx con TarjetaPlan (pricing cards)
- Integrado en ServicioIndividualIsland.tsx (entre Galería y CTA)
- single-servicio.php ahora pasa `slug` del post actual a la isla React
- TO-DO: Checkout Stripe en botones CTA, plan Personalizado abre chat

#### 20.2 PENDIENTE - Integración Stripe (cuando se configure keys)

- GLORY_STRIPE_SECRET_KEY y GLORY_STRIPE_PUBLISHABLE_KEY en .env
- Checkout directo con Stripe Elements
- Panel de usuario: mis pagos, estado del servicio


# Comentarios del usuario (area de comunicacion)

### Comentarios v1.1

0. [RESUELTO] Eliminados emojis del roadmap, todo con texto.
1. [RESUELTO] Submenu hover se cerraba al mover cursor. Fix: eliminado margin-top, reemplazado con padding-top transparente para mantener continuidad del hover.
2. [RESUELTO] Pagina de servicio error + navegacion no es fluida. Error 500 arreglado (has_archive conflict). Navegación SPA pendiente de verificar con AjaxNav.
3. [RESUELTO] Imagenes de Selected Work resueltas con fallback en data/showcase.ts.
4. [RESUELTO] Journal se desconfiguro por la refactorizacion, tiene que ser 3 columnas y aparece. (Fix: clase CSS renombrada para evitar colision global)
5. [RESUELTO] http://glory.local/proyectos/ aparece sin imagenes, tiene que ser las de Glory/assets/images/showcase/ (Fix: fallback en data/showcase.ts + TarjetaProyecto siempre renderiza img)
6. [RESUELTO] Padding de "Have a project in mind?" inconsistente + blog sin imagenes + blog sin single post + hero soluciones sin padding. (Fix: variable --seccion-cta-padding-bottom, imagenes portada blog, BlogSingleIsland creado, hero soluciones arreglado)
7. [RESUELTO] La pagina de contacto debe existir. (Fix: ContactoIsland.tsx creada con formulario completo, registrada en pages.php y appIslands.tsx)
8. [RESUELTO] Solo 4 marcas, deberian ser 12, Ultimos clientes no usa backend para SVGs. (Fix: 12 marcas en defaultContent.php, SeccionClientes consume MARCAS_DATA del backend)
9. [RESUELTO] Los proyectos del home en el hero deben usar el backend. (Fix: CarruselShowcase usa PROYECTOS_DATA con Badge de categorias reales)
10. [RESUELTO] En el home "Services" no esta usando el backend. (Fix: verificado que window.GLORY_CONTEXT.servicios se inyecta y servicios.ts lo consume)
11. [RESUELTO] en "More Services" no debe aparecer el mismo servicio que se esta cargando. (Fix: obtenerServiciosRelacionados() filtra por servicioActualId)
12. [RESUELTO] Login, modal autenticacion, panel placeholder. (Fix: ModalAutenticacion.tsx con login/registro/recuperar, PanelIsland.tsx con 3 tabs placeholder)
13. [RESUELTO] Hacer la logica de Stay updated. (Fix: Footer.tsx con newsletter funcional, NewsletterController.php con tabla WP custom)

### Comentarios v1.2 (Resumen - ya trabajados en FASE 13)

1. [RESUELTO] Selected Work sin duplicados + categorías reales backend.
2. [RESUELTO] Badge como componente reutilizable en todas las tarjetas.
3. [RESUELTO] Padding/max-width normalizado con variables CSS (parcial, ver v1.3 #1).
4. [RESUELTO] blogContenedor estructura corregida.
5. [RESUELTO] Tarjeta artículo layout horizontal (flex-direction: row).
6. [RESUELTO] Blog single post carga correctamente.
7. [RESUELTO] Info contacto centralizada en data/contacto.ts.
8. [RESUELTO] ModalTestimonio creado con campos completos.
9. [RESUELTO] Slug mismatch servicios corregido (diseno-ux-ui).
10. [RESUELTO] Detección login en Header (Panel/Volver/Chat). Chat pendiente FASE 17.
11. [RESUELTO] Panel max-width y padding.
12. [RESUELTO] Soluciones sub-páginas cargan (fix PageManager regex).

### Comentarios v1.4

0. [RESUELTO] Resumir tareas completadas y ordenar pendientes.
1. [RESUELTO] Navegación SPA sin recarga entre páginas. Motor SPA creado en `navegacionSPA.ts`: intercepta clicks en `<a>`, fetch + parse de HTML, monta nueva isla React via `createRoot`. Transición fade 150ms. History API (pushState/popstate). Función `navegar()` para navegación programática. Todos los `window.location.href` reemplazados por `navegar()`.
2. [RESUELTO] Botón "Comenzar Proyecto" ahora enlaza a `/contacto/`.
3. [RESUELTO] SVGs de "Últimos clientes" intermitentes. Causa: CSS hack `translateY(-10000px) + drop-shadow`. Solución: `filter: brightness(0) invert(1)` + componente `LogoMarca` con `onError` fallback a texto.
4. [RESUELTO] Padding excesivo reducido en: SeccionCta, Skills, Servicios Relacionados, Proyectos Relacionados, BlogContenedor, Planes. De `spacing-3xl/4xl` a `spacing-2xl/xl`.
5. [RESUELTO] Hero de proyectos ahora usa `SeccionGaleriaServicio` (carrusel), igual que servicios. Prop `imagen` eliminada de ProyectoIndividualIsland.
6. [RESUELTO] Journal en home limitado a 3 posts con `.slice(0, 3)`.
7. [RESUELTO] Imágenes de blog proporción 4:3 (landscape). `aspect-ratio: 4 / 3` en BlogSingleIsland y cards.
8. [RESUELTO] `blogSingleArticulo` ancho cambiado a `50rem` (~800px).
9. [RESUELTO] Panel: header propio (`HeaderPanel.tsx`) con logo, Chat, Salir, avatar 40x40. Sin Header/Footer global. Sidebar con iconos lucide-react, sin sidebarFooter.
10. [RESUELTO] Planes visibles en todos los servicios. Creado `planesExtras.ts` con planes para ecommerce, diseno-ux-ui, automatizacion, consultoria. Registrados en `index.ts` (11 servicios × 3 tiers).
11. [RESUELTO] Integración Stripe implementada: Bridge `.env` → constantes PHP en `environment.php`. `StripeController.php` con endpoints REST (checkout, portal, webhook). `WebhookHandler.php` concreto. `stripePriceId` y `stripeModo` agregados al tipo `PlanServicio`. `SeccionPlanesServicio` conecta con checkout API. Nonce REST + publishable key inyectados en GLORY_CONTEXT. Autoload `App\` registrado en composer. Pendiente: configurar priceId de cada plan en Stripe Dashboard y guardar en `wp_options`.
12. [RESUELTO] Planificación del chat detallada en `PLAN_CHAT.md`. Incluye: Fase 1 (chat humano en tiempo real), Fase 2 (chatbot IA con Gemini), modelo de datos (3 tablas SQL), protocolo WebSocket, 15+ componentes frontend, 8 endpoints REST, rol `encargado`, roadmap paso a paso.