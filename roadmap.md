# Roadmap — Migración App1 → Glory React

> Fecha inicio: 13 de febrero de 2026
> Rama glorytemplate: `glory-react-logic` | Rama Glory: `glory-react`
> Proyecto: Cosmo Revenue — Consultoría Revenue Management Hotelero

---

## 0. Visión General

**App1** es un sitio completo (Cosmo Revenue) construido con el Glory legacy (PHP templates + atributos GBN). Contiene 12 páginas, 5 CPTs, ~5,753 líneas de CSS, formularios, animaciones orbitales, flip cards, timelines y más.

**Objetivo:** Migrar todo a la arquitectura Glory React (TypeScript + Islands), manteniendo los estilos lo más similares posibles y aprovechando para:

1. Crear **componentes nativos reutilizables de Glory** (actualmente no hay ninguno)
2. Mejorar el **constructor/page builder** con bloques reales
3. Dejar el proyecto **modificable vía constructor** a nivel básico
4. Mejorar el núcleo de Glory donde haya oportunidad

---

## 1. Análisis del Proyecto Actual (App1)

### 1.1 Páginas (12)

| Slug | Template | Isla React destino | Complejidad |
|------|----------|--------------------|-------------|
| `home` | landing.php (296 l.) | `LandingIsland` | Alta — 6 secciones, orbital, flip cards |
| `servicios` | services.php (220 l.) | `ServiciosIsland` | Media — grid de cards |
| `servicio-comet` | service-detail.php | `ServicioDetalleIsland` | Baja — template genérico |
| `servicio-nebula` | service-detail.php | `ServicioDetalleIsland` | Baja — reutiliza template |
| `servicio-quasar` | service-detail.php | `ServicioDetalleIsland` | Baja — reutiliza template |
| `servicio-orbit` | service-detail.php | `ServicioDetalleIsland` | Baja — reutiliza template |
| `servicio-galaxy` | service-detail.php | `ServicioDetalleIsland` | Baja — reutiliza template |
| `servicio-universe` | service-detail.php | `ServicioDetalleIsland` | Baja — reutiliza template |
| `casos` | casos.php (100 l.) | `CasosIsland` | Media — posts dinámicos |
| `about` | about.php (175 l.) | `AboutIsland` | Media — timeline COSMO |
| `contacto` | contact.php (110 l.) | `ContactoIsland` | Baja |
| `contructor` | contructor.php (506 l.) | `ConstructorIsland` | Baja — prueba page builder |

### 1.2 Custom Post Types (relevantes)

| CPT | Uso | Migrar |
|-----|-----|--------|
| `casos` | Casos de éxito con meta fields (tipo, ubicación, valor, descripción, etc.) | Sí |
| `services` | Servicios (no se usa directamente, datos están hardcodeados) | No prioritario |
| `libro` | Ejemplo demo | Mantener como ejemplo |
| `tarea` | Feature desactivada | No |
| `portfolio` | No usado en este proyecto | No |

### 1.3 CSS (13 archivos, ~5,753 líneas)

| Archivo | Líneas | Decisión |
|---------|--------|----------|
| init.css | 1,184 | Migrar como base global |
| landing.css | 1,183 | Migrar a estilos de isla/componentes |
| servicios.css | 469 | Migrar |
| about.css | 444 | Migrar |
| single-casos.css | 436 | Migrar (futuro: single post) |
| service-detail.css | 303 | Migrar |
| casos.css | 233 | Migrar |
| home.css | 206 | Fusionar con landing.css |
| contact.css | 189 | Migrar |
| header.css | 175 | Migrar |
| marquee.css | 100 | Migrar como componente Glory |
| cosmoPageLoader.css | 39 | Evaluar si necesario |
| task.css | 792 | No migrar (feature desactivada) |

### 1.4 JS (6 archivos, ~344 líneas)

| Archivo | Decisión |
|---------|----------|
| about-align.js | Convertir a hook React o CSS puro |
| cosmoPageLoader.js | Convertir a componente React |
| grained.js | Convertir a hook React |
| header-scroll.js | Convertir a hook React |
| landing-noise.js | Integrar con grained |
| lucide.min.js | Eliminar — usar `lucide-react` |

---

## 2. Arquitectura de la Migración

### 2.1 Qué va en Glory (reutilizable) vs App (específico)

**Componentes nativos de Glory** (`Glory/assets/react/src/components/`):
Componentes genéricos que cualquier proyecto Glory puede usar.

| Componente | Por qué es nativo | Origen |
|------------|-------------------|--------|
| `PageHero` | Todas las webs necesitan heroes de página | PageHero.php |
| `Marquee` | Componente de animación genérico | Marquee.php |
| `ContactForm` | Formularios de contacto son universales | ContactForm.php |
| `FlipCard` | Componente de UI genérico | landing.php |
| `FeatureCard` | Cards de features/servicios son universales | services.php |
| `Timeline` | Componente de visualización genérico | about.php |
| `InfoCard` | Cards informativas con icono | contact.php |
| `SectionHeader` | Título + subtítulo de sección | Patrón repetido |
| `QuoteBlock` | Bloque de cita | casos.php |

**Componentes del proyecto App** (`App/React/components/`):
Componentes específicos de Cosmo Revenue.

| Componente | Por qué es de App | Origen |
|------------|-------------------|--------|
| `GraficoOrbital` | Animación COSMO específica de la marca | landing.php |
| `TarjetaCaso` | Card con meta fields específicos del CPT `casos` | landing.php + casos.php |
| `DatosPlanesServicio` | Datos/config de los 6 planes | service-detail.php |

### 2.2 Bloques del Constructor (Page Builder)

Para que las páginas sean modificables vía constructor, cada sección principal se registra como bloque:

| Bloque | Campos editables | Prioridad |
|--------|-----------------|-----------|
| `HeroPrincipal` | titulo, subtitulo, textoBoton, urlBoton | Alta |
| `HeroPagina` | textoScript, textoPrincipal, subtitulo | Alta |
| `SeccionMarquee` | texto, esquema (light/dark) | Alta |
| `FormularioContacto` | formId, titulo, mostrarHabitaciones, servicioPreseleccionado | Alta |
| `TarjetasFlip` | tarjetas[] (titulo, descripcionFrente, descripcionReverso, imagenUrl) | Media |
| `GridServicios` | tarjetas[] (icono, titulo, subtitulo, descripcion, features[], ctaTexto, ctaUrl) | Media |
| `LineaTiempo` | pasos[] (letra, titulo, subtitulo, descripcion) | Media |
| `SeccionCita` | icono, cita, autor | Media |
| `TarjetasInfo` | tarjetas[] (icono, titulo, texto) | Media |
| `SeccionCTA` | titulo, texto, textoBoton, urlBoton | Media |
| `DetalleServicio` | planKey (select de los 6 planes) | Baja |
| `CasosDeExito` | cantidad, mostrarStats | Baja |

### 2.3 Estructura de Directorio Objetivo

```
App/
├── Config/
│   ├── assets.php          ← Registrar CSS App1 migrado
│   ├── config.php           ← Actualizar versión
│   ├── control.php          ← Feature flags para proyecto
│   ├── environment.php      ← Sin cambios
│   ├── opcionesTema.php     ← Opciones Cosmo Revenue
│   └── pages.php            ← 12 páginas React
├── Content/
│   ├── defaultContent.php   ← Casos de éxito + servicios seed
│   ├── menu.php             ← Menú Cosmo Revenue
│   └── postType.php         ← CPT casos
├── Helpers/
│   └── log.php              ← Sin cambios
├── React/
│   ├── appIslands.tsx       ← Registry de 7+ islas
│   ├── package.json
│   ├── tsconfig.json
│   ├── blocks/
│   │   ├── index.ts         ← Registro de bloques
│   │   ├── heroPrincipal.tsx
│   │   ├── heroPagina.tsx
│   │   ├── tarjetasFlip.tsx
│   │   ├── gridServicios.tsx
│   │   ├── lineaTiempo.tsx
│   │   ├── seccionCita.tsx
│   │   ├── tarjetasInfo.tsx
│   │   └── seccionCTA.tsx
│   ├── components/
│   │   ├── GraficoOrbital/
│   │   │   ├── GraficoOrbital.tsx
│   │   │   └── graficoOrbital.css
│   │   ├── TarjetaCaso/
│   │   │   ├── TarjetaCaso.tsx
│   │   │   └── tarjetaCaso.css
│   │   └── DatosPlanesServicio.ts
│   ├── hooks/
│   │   ├── useCasos.ts
│   │   └── useScrollHeader.ts
│   ├── islands/
│   │   ├── LandingIsland.tsx
│   │   ├── ServiciosIsland.tsx
│   │   ├── ServicioDetalleIsland.tsx
│   │   ├── CasosIsland.tsx
│   │   ├── AboutIsland.tsx
│   │   ├── ContactoIsland.tsx
│   │   └── ConstructorIsland.tsx
│   ├── styles/
│   │   ├── variables.css    ← Variables adaptadas de init.css
│   │   ├── global.css       ← Reset + base de init.css
│   │   ├── landing.css      ← Estilos landing
│   │   ├── servicios.css
│   │   ├── servicio-detalle.css
│   │   ├── casos.css
│   │   ├── about.css
│   │   ├── contacto.css
│   │   └── header.css
│   └── types/
│       ├── styles.d.ts
│       ├── editorjs.d.ts
│       ├── cosmo.ts          ← Tipos del proyecto (caso, servicio, plan)
│       └── bloques.ts        ← Tipos de bloques del constructor

Glory/assets/react/src/components/
├── index.ts                 ← Barrel export
├── PageHero/
│   ├── PageHero.tsx
│   └── pageHero.css
├── Marquee/
│   ├── Marquee.tsx
│   └── marquee.css
├── ContactForm/
│   ├── ContactForm.tsx
│   └── contactForm.css
├── FlipCard/
│   ├── FlipCard.tsx
│   └── flipCard.css
├── FeatureCard/
│   ├── FeatureCard.tsx
│   └── featureCard.css
├── Timeline/
│   ├── Timeline.tsx
│   └── timeline.css
├── InfoCard/
│   ├── InfoCard.tsx
│   └── infoCard.css
├── SectionHeader/
│   ├── SectionHeader.tsx
│   └── sectionHeader.css
└── QuoteBlock/
    ├── QuoteBlock.tsx
    └── quoteBlock.css
```

---

## 3. Fases de Ejecución

### Fase 1: Fundación (CSS + Config PHP)
> Preparar la base sin romper nada.

- [ ] **1.1** Extraer variables CSS de `init.css` de App1 → `App/React/styles/variables.css`
- [ ] **1.2** Migrar reset y base global de `init.css` → `App/React/styles/global.css`
- [ ] **1.3** Copiar y adaptar CSS por página (landing, servicios, etc.) → `App/React/styles/`
- [ ] **1.4** Actualizar `App/Config/pages.php` — registrar 12 páginas con `PageManager::reactPage()`
- [ ] **1.5** Actualizar `App/Config/control.php` — activar features necesarias (menu, etc.)
- [ ] **1.6** Actualizar `App/Content/postType.php` — agregar CPT `casos`
- [ ] **1.7** Actualizar `App/Content/defaultContent.php` — datos seed de casos de éxito
- [ ] **1.8** Actualizar `App/Content/menu.php` — menú Cosmo Revenue
- [ ] **1.9** Actualizar `App/Config/opcionesTema.php` — opciones del tema
- [ ] **1.10** Copiar imágenes necesarias de App1/Assets/images → App/Assets/images
- [ ] **1.11** Copiar fuentes de App1/Assets/fonts si faltan
- [ ] **1.12** Crear tipos TypeScript del proyecto (`App/React/types/cosmo.ts`)

### Fase 2: Componentes Nativos de Glory
> Crear componentes reutilizables en el core de Glory. Esto mejora permanentemente el framework. Nota del usuario, tienen que ser totalmente agnosticos en cuanto a logica, diseño y en cualquier aspecto reutilizables. /Glory obligatoriamente tiene que ser agnostico. Esto componentes en el futuro deberían poder instalarse externamente y no venir incluidos, planificar este este detalle.

- [ ] **2.1** `PageHero` — Hero para páginas internas (props: textoScript, textoPrincipal, subtitulo, icono?)
- [ ] **2.2** `SectionHeader` — Encabezado de sección (props: titulo, subtitulo, tema?)
- [ ] **2.3** `Marquee` — Texto animado en loop (props: texto, esquema, className?)
- [ ] **2.4** `ContactForm` — Formulario de contacto con validación React (props: formId, titulo, campos, servicioPreseleccionado?, onSubmit?)
- [ ] **2.5** `FlipCard` — Tarjeta con volteo 3D (props: frente, reverso, className?)
- [ ] **2.6** `FeatureCard` — Tarjeta de feature/servicio (props: icono, titulo, subtitulo, descripcion, features[], ctaTexto, ctaUrl?)
- [ ] **2.7** `InfoCard` — Tarjeta informativa (props: icono, titulo, texto)
- [ ] **2.8** `Timeline` — Visualización de pasos (props: pasos[], orientacion?)
- [ ] **2.9** `QuoteBlock` — Bloque de cita (props: icono, cita, autor)
- [ ] **2.10** Barrel export `Glory/assets/react/src/components/index.ts`
- [ ] **2.11** Documentar componentes en `Glory/docs/`

### Fase 3: Componentes de App + Hooks
> Componentes específicos de Cosmo Revenue.

- [ ] **3.1** `GraficoOrbital` — Animación CSS de órbitas con planetas COSMO interactivos
- [ ] **3.2** `TarjetaCaso` — Card para CPT casos con meta fields
- [ ] **3.3** `DatosPlanesServicio.ts` — Datos estáticos de los 6 planes (comet, nebula, quasar, orbit, galaxy, universe)
- [ ] **3.4** Hook `useCasos` — Obtener casos de éxito vía `useGloryContent` o `useWordPressApi`
- [ ] **3.5** Hook `useScrollHeader` — Cambiar estilo del header al hacer scroll

### Fase 4: Islands (Páginas React)
> Crear las islas para cada página. Cada isla compone componentes.

- [ ] **4.1** `LandingIsland` — 6 secciones: Hero, Servicios (FlipCards), Casos, Metodología (GraficoOrbital), About, Contacto
- [ ] **4.2** `ServiciosIsland` — Hero + Marketing (3 FeatureCards) + Consultoría (Orbit card) + Revenue (2 FeatureCards) + CTA
- [ ] **4.3** `ServicioDetalleIsland` — Template genérico que recibe `planKey` vía props, renderiza datos del plan + formulario
- [ ] **4.4** `CasosIsland` — Hero + Grid de TarjetaCaso (contenido dinámico) + Quote + CTA
- [ ] **4.5** `AboutIsland` — Hero + Timeline COSMO + Bio (oculta por ahora) + ContactForm
- [ ] **4.6** `ContactoIsland` — Hero + InfoCards (email, teléfono, ubicación) + ContactForm + Marquee
- [ ] **4.7** `ConstructorIsland` — Isla del page builder (para pruebas del constructor)
- [ ] **4.8** Registrar todas las islas en `App/React/appIslands.tsx`

### Fase 5: Bloques del Constructor
> Registrar secciones como bloques editables en el page builder.

- [ ] **5.1** Definir interfaces TypeScript para cada bloque (`App/React/types/bloques.ts`)
- [ ] **5.2** Bloque `HeroPrincipal` — Hero de landing con título, subtítulo, CTA
- [ ] **5.3** Bloque `HeroPagina` — Hero genérico para páginas internas
- [ ] **5.4** Bloque `SeccionMarquee` — Marquee configurable
- [ ] **5.5** Bloque `FormularioContacto` — Formulario con opciones
- [ ] **5.6** Bloque `TarjetasFlip` — Grid de flip cards configurables
- [ ] **5.7** Bloque `GridServicios` — Grid de FeatureCards configurables
- [ ] **5.8** Bloque `LineaTiempo` — Timeline configurable
- [ ] **5.9** Bloque `SeccionCita` — Cita configurable
- [ ] **5.10** Bloque `TarjetasInfo` — Grid de InfoCards
- [ ] **5.11** Bloque `SeccionCTA` — Call to action
- [ ] **5.12** Registrar bloques en `App/React/blocks/index.tsx`
- [ ] **5.13** Probar constructor con la ConstructorIsland

### Fase 6: Mejoras al Núcleo de Glory
> Oportunidades detectadas para mejorar el framework.

- [ ] **6.1** Endpoint REST para formularios de contacto (`POST /glory/v1/contact`) — actualmente depende de `gloryForm` PHP
- [ ] **6.2** Hook `useGloryForm` — Hook para formularios con validación + submit a REST
- [ ] **6.3** Mejorar `BlockEditorModal` — soporte para campos de tipo icono con preview (usa lucide-react)
- [ ] **6.4** Crear `useNavigation` hook — navegación entre páginas Glory (reemplazo de `gloryAjaxNav`)
- [ ] **6.5** Componente `GloryLink` — Link inteligente que decide entre `<a>` y navegación interna
- [ ] **6.6** Evaluar si el page builder necesita drag & drop real (actualmente solo ↑↓)

### Fase 7: Pulido y Documentación
> Ajustes finales, responsividad, accesibilidad.

- [ ] **7.1** Verificar responsive en todas las páginas
- [ ] **7.2** Accesibilidad: `aria-labels`, `roles`, `tabindex` en componentes Glory
- [ ] **7.3** Actualizar `README.md` del template con info de Cosmo Revenue
- [ ] **7.4** Documentar componentes nativos de Glory en `Glory/docs/`
- [ ] **7.5** Limpiar archivos obsoletos (`App/React/islands/BienvenidaIsland.tsx`, `bienvenida.css`)
- [ ] **7.6** Commit final + tag de versión

---

## 4. Decisiones Técnicas

### 4.1 Estilos: ¿CSS Modules, CSS plano, o Tailwind?

**Decisión: CSS plano con archivos separados por componente/página.**
- Los estilos de App1 ya existen y funcionan bien como CSS plano
- No activamos Tailwind (feature flag off por defecto)
- Los componentes nativos de Glory usan CSS plano con clases descriptivas en español
- Se mantienen las variables CSS centralizadas
- Los selectores se adaptan a los nombres de componentes React (camelCase en español)

### 4.2 Datos de servicios: ¿hardcodeados o dinámicos?

**Decisión: Hardcodeados en TypeScript.**
- Los 6 planes de servicio son datos estáticos que rara vez cambian
- Se almacenan en `DatosPlanesServicio.ts` como constantes tipadas
- Si en el futuro se quieren editar desde WP, se migran a opciones del tema o CPT
- Ventaja: 0 llamadas a API, tipado perfecto, rendimiento óptimo

### 4.3 Casos de éxito: ¿hardcodeados o dinámicos?

**Decisión: Dinámicos vía ReactContentProvider.**
- Los casos son contenido que se gestiona desde WordPress (CPT `casos`)
- Se registran con `ReactContentProvider::register('casos', 'casos', [...])`
- React los consume con `useGloryContent<CasoExito>('casos')`
- Las meta fields se exponen vía `get_post_meta()` en el formato de `ReactContentProvider`

### 4.4 Formularios: ¿AJAX legacy o REST API?

**Decisión: REST API nuevo.**
- Crear endpoint `POST /glory/v1/contact` en Glory PHP
- React envía JSON con `useWordPressApi` o fetch directo
- Validación client-side con TypeScript (no Zod por ahora, validación manual simple)
- Feedback inline en React (estados: idle, sending, success, error)

### 4.5 Navegación entre páginas

**Decisión: Links estándar `<a href>` por ahora.**
- WordPress controla el routing para SEO
- No implementamos SPA navigation en esta iteración
- TO-DO futuro: `GloryLink` con prefetch + transiciones suaves

### 4.6 Componentes nativos de Glory: ¿con o sin estilos por defecto?

**Decisión: Con estilos base mínimos + personnalizable vía className/props.**
- Cada componente Glory incluye un `.css` con estilos base funcionales
- El proyecto (App) puede sobrescribir mediante `className` o CSS más específico
- Los componentes usan CSS variables para colores/espaciado → el proyecto define esas variables
- No se importan estilos automáticamente — el proyecto decide incluirlos o no

---

## 5. Orden de Ejecución Sugerido

1. **Fase 1** (Fundación) — Sin ella nada funciona
2. **Fase 2** (Componentes Glory) — Se necesitan para las islas
3. **Fase 3** (Componentes App) — Se necesitan para las islas
4. **Fase 4** (Islands) — Las páginas reales
5. **Fase 5** (Bloques Constructor) — Modularidad y editabilidad
6. **Fase 6** (Mejoras Glory) — Segundo nivel, post-funcional
7. **Fase 7** (Pulido) — Calidad final

**Estimación:** Las fases 1-4 son el MVP funcional. Las fases 5-7 son valor añadido.

---

## 6. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| CSS no se ve igual al migrar | Alto | Copiar selectores exactos, no reinventar. Comparar visual |
| Contenido dinámico de casos no llega a React | Alto | Probar `ReactContentProvider` + `useGloryContent` temprano |
| Formularios no funcionan sin `gloryForm` | Medio | Crear endpoint REST + hook `useGloryForm` en Fase 6 |
| Page builder no soporta los bloques bien | Medio | Empezar con bloques simples (hero, marquee, texto) |
| Demasiados componentes Glory → sobreingeniería | Bajo | Solo crear lo que Cosmo Revenue necesita + sea genérico |

---

## ESTADO

| Fase | Estado | Notas |
|------|--------|-------|
| Fase 1: Fundación | ✅ COMPLETADA | CSS variables, global, 10 archivos CSS, pages.php, control.php, postType, defaultContent, menu, tipos TS |
| Fase 2: Componentes Glory | ✅ COMPLETADA | Nota: componentes creados en App/React/components/ (ui, layout, forms) — no en Glory core para esta iteración. 9 componentes: EncabezadoSeccion, Marquee, TarjetaFlip, TarjetaInfo, BloqueCita, LineaTiempo, TarjetaFeature, CosmoHeader, PaginaHero, FormularioContacto |
| Fase 3: Componentes App | ✅ COMPLETADA | GraficoOrbital, TarjetaCaso, DatosPlanesServicio (6 planes), hooks: useCasos, useScrollHeader, useGloryForm |
| Fase 4: Islands | ✅ COMPLETADA | 7 islas: Landing, Servicios, ServicioDetalle, Casos, About, Contacto, Constructor. Registradas en appIslands.tsx |
| Fase 5: Bloques Constructor | ✅ COMPLETADA | 10 bloques en blocks/index.tsx: hero, encabezado, texto, imagen, marquee, cita, cta, formulario, espaciador, columnas |
| Fase 6: Mejoras Glory | ✅ PARCIAL | FormController.php (REST endpoint /glory/v1/form) + useGloryForm hook. Pendiente: useNavigation, GloryLink, drag&drop |
| Fase 7: Pulido | ✅ COMPLETADA | Revisión de tipos, corrección cosmo.ts (PlanServicio + CasoExito alineados), fix useGloryMedia en islands, fix CSS colisión, CosmoHeader refactorizado con useScrollHeader |

### Ajustes iteración (13 feb 2026) — Home/Landing
- [x] Header: logo restaurado como imagen (antes estaba texto `COSMO`).
- [x] Landing: tarjetas flip con fallback local de imágenes si falla alias REST de media.
- [x] Casos de éxito: CPT `casos` expuesto en REST (`show_in_rest`, `rest_base`) + fallback en `useCasos`.
- [x] Formulario en landing: layout en 2 columnas en desktop (1 columna solo en móvil).

### Ajustes iteración (13 feb 2026) — Solución real carga de casos
- [x] Solución movida al core de Glory: `ReactContentProvider::bootstrap()` se ejecuta automáticamente y registra/injecta contenido en cualquier `reactPage` sin código por proyecto.
- [x] Eliminado cableado específico de `App/Config/control.php`; la inyección ya no depende del proyecto Cosmo.
- [x] `useCasos` prioriza contenido server-side (`useGloryContent('casos')`) y usa REST como respaldo operativo.

### Ajustes iteración (13 feb 2026) — Fix real renderizado de casos
- [x] **Bug crítico**: `ReactContentProvider::formatPost()` enviaba `id` como `(string)` → `useGloryContent` validaba `typeof id === 'number'` → **todos los items descartados silenciosamente**. Fix: `(int) $post->ID`.
- [x] **Bug latente**: `registerFromDefaults()` buscaba key `['posts']` pero `DefaultContentRegistry` usa `['definicionesPost']` → filtro por slugs nunca se aplicaba. Fix: key corregida.
- [x] **Defensivo**: `useGloryContent` ahora normaliza `id` (acepta string numérico y lo castea a number) para ser resiliente a futuros cambios PHP.
- [x] **Meta fields REST**: Registrados 10 meta fields del CPT `casos` con `register_post_meta()` + `show_in_rest => true` para que el fallback REST API también devuelva datos completos.

### TO-DOs pendientes para futuras iteraciones
- [ ] Mover componentes UI a Glory core como paquetes instalables (componentes agnósticos)
- [ ] `useNavigation` hook para navegación SPA entre páginas Glory
- [ ] `GloryLink` componente con prefetch + transiciones
- [ ] Drag & drop real en Page Builder (actualmente solo ↑↓)
- [ ] Generar tipos automáticos: `GET /glory/v1/schema` → `.d.ts` (pendiente 3.5)
- [ ] `single-caso` template para posts individuales de casos de éxito
- [ ] Responsive testing en todos los breakpoints
- [ ] Accesibilidad: `aria-labels`, `roles` en componentes
- [ ] Limpiar `App/React/islands/BienvenidaIsland.tsx` y `bienvenida.css`
- [ ] Build de producción con Vite + verificar bundle size
