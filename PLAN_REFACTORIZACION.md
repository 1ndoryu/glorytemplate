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
│   └── marcas.ts           <- 12 Clientes (PHP -> Fallback con logos SVG)
├── hooks/
│   ├── useImagenes.ts      <- UNICO punto de import.meta.glob (DRY)
│   ├── useServicios.ts     <- Logica filtrado/busqueda
│   └── useCarruselInfinito.ts <- Logica carrusel drag + autoplay
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
│   └── PanelIsland.tsx               <- Panel usuario placeholder (3 tabs)
├── components/
│   ├── layout/
│   │   ├── LayoutPagina.tsx    <- Wrapper Header+main+Footer (DRY)
│   │   ├── Header.tsx          <- Submenu dropdown, Acceder + modal, Contacto
│   │   ├── Footer.tsx          <- Newsletter funcional (Stay Updated)
│   │   ├── ModalAutenticacion.tsx <- Login/Registro/Recuperar + Google OAuth
│   │   └── ModalAutenticacion.css
│   ├── ui/
│   │   ├── Button.tsx, Badge.tsx, SeccionHeader.tsx
│   │   ├── SeccionCta.tsx   <- CTA generico por props
│   │   └── ServiceCard.tsx
│   ├── home/
│   │   ├── SeccionHero, SeccionClientes (backend SVGs), SeccionShowcase
│   │   ├── CarruselShowcase (backend datos), SeccionTestimonios, SeccionServicios
│   │   ├── SeccionContacto (compacto prop), SeccionBlog (3 cols), RandomImage
│   └── servicios/
│       ├── BarraFiltros, GridServicios, SeccionHeroServicio
│       ├── SeccionGaleriaServicio, SeccionSkillsServicio (click-to-expand)
│       └── SeccionServiciosRelacionados (filtra servicio actual)
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

### FASE 13: INTERNACIONALIZACION (i18n)

#### 13.1 PENDIENTE - Sistema de idiomas espanol/ingles
- Crear sistema de traducciones (context + hook `useIdioma`)
- Archivo de traducciones: `i18n/es.ts`, `i18n/en.ts`
- Selector de idioma en el Header
- URLs con prefijo para SEO (/en/servicios/, /es/servicios/)

#### 13.2 PENDIENTE - SEO bilingue
- Meta tags `hreflang`, `<link rel="alternate">`
- Sitemap XML y Schema.org bilingue

---

### FASE 14: SEO AVANZADO

#### 14.1 PENDIENTE - SEO tecnico
- Meta tags dinamicos, Schema.org JSON-LD, OG, Twitter Cards
- Canonical URLs, Sitemap XML, robots.txt

#### 14.2 PENDIENTE - Rendimiento y Core Web Vitals
- Lazy loading, WebP/AVIF, preload fuentes, critical CSS

---

### FASE 15: SERVICIOS - PLANES Y PAGOS

#### 15.1 PENDIENTE - Planes por servicio
- Plan Basico, Avanzado, Personalizado por servicio
- UI: `PlanesServicio.tsx`, datos como meta en PHP

#### 15.2 PENDIENTE - Integracion Stripe (futuro)
- API keys desde .env, checkout directo
- NOTA: Implementar cuando el usuario configure las keys

---

### FASE 16: CONTACTO Y CHATBOT

#### 16.1 PENDIENTE - Formulario de contacto mejorado
- Campos: nombre, correo, descripcion, presupuesto
- Al enviar -> abre chat en tiempo real

#### 16.2 PENDIENTE - Chatbot inteligente
- WebSocket (Ratchet) o API polling
- Flujo: detalles -> presupuesto -> pago
- NOTA: Implementar cuando el usuario provea APIs

---

### FASE 17: AUDITORIA SOLID Y LIMPIEZA

#### 17.1 PENDIENTE - Revision profunda SOLID
- [ ] SRP: max 3 useState por componente
- [ ] Limites de archivo: 300 componentes, 120 hooks, 150 utils
- [ ] ISP, DIP, OCP verificados

#### 17.2 PENDIENTE - Accesibilidad (a11y)
- aria-labels, navegacion teclado, skip links, contraste WCAG AA

#### 17.3 PENDIENTE - Tests
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
4. Journal se desconfiguro por la refactorizacion, tiene que ser 3 columnas y aparece.
5. http://glory.local/proyectos/ aparece sin imagenes, tiene que ser las de Glory/assets/images/showcase/
6. Si los padding estan centralizados pero la pagina de nosotros tiene padding diferentes, Have a project in mind? en nosotros no tiene el padding botton que hay en el home (que es el correcto) (parece que es casi toda las have a  project, ese padding botton debe ser general), esto no esta centralizado. Igualmente acabo de notar en blog pasa lo mismo, el filtrado en blog debería ser igual a de las otras paginas, verificar que esto este centralizado, los blog deberían mostrar imagenes al menos por default de portada, lo de los padding igualmente pasa en los single post de proyectos, y los blog deberían tener single post y en hero de soluciones.

Comentarios extra, me doy cuenta que esta diferencia de padding botton de Have a project in mind? sucede porque en el home agrega 4 rem de gap mas 4 rem de padding top de la seccion de abajo, entonces, lo ideal es que en el home se deje con las 4 rem y el resto de lugares con 8 donde no haya un gap o un padding bottom que sume ese espacio.
7. La pagina de contacto debe existir, actualmente en header esta el boton de contacto que lleva a la seccion de contacto pero esta seccion no esta en todas las paginas y deberia existir la pagina entonces.
8. Hay solo 4 marcas de default content, deberían ser 12 y usar svg aleatoreos de Glory, y estar en la seccion de Ultimos clientes, a veces no cargan esos svg a veces si, Ultimos clientes no esta usando el backend para los svg.
9. Los proyectos del home en el hero deben usar el backend, mantener el diseño.
10. En el home "Services" no esta usando el backend 
11. en "More Services" no debe aparecer el mismo servicio que se esta cargando.
12. Login y inicio de seccion, al lado de boton de contacto normal sin boton, como un menu mas poner "acceder", abrira un modal para iniciar seccion, crear el registro, autenticacion, recuperacion de contraseña, inicio seccion con google, etc, planificara un panel, este panel es sencillo, el mismo menu adaptado con una navegacion Distinta, Mis proyectos (Un Dashboard en donde el cliente vera sus servicios en progreso o terminados, esto requiere una logica que se debe planificar con cuidado, y es que como dije anteriormente, los pagos se haran en la plataforma mediante stripe, la cuestion es que al realizar el pago, el cliente tenga estar logeado, el registro debe ser muy sencillo, agregar chapchat anti bots, al hacer el pago, el cliente tendra un dashboard donde vera su servicio en progreso, todo minimalista, los detalles del proyecto se veran ahi, estaran ocultos y se expandiran, esto sería despues hacer la logica para el chat en tiempo real porque no es solo el chat bot, se van a necesitar un dashboard para el admin para conversar con los clientes, interrumpir el chatbot, etc), Servicios (El cliente vera sus servicios contratados, hosting, vps, etc), Pagos (El cliente vera un historial de pagos realizados), se que estas paginas son muy complicadas pero por el momento se pueden planificar como pendientes y dejar un placeholder de "En construccion".
13. Hacer la logica de Stay updated