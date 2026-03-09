# Kamples — Plan SEO Integral

> **Version:** 1.0 | **Fecha:** 08/03/2026 | **Estado:** En implementacion
> **Competencia directa:** Looperman, Splice, SampleFocus, Landr, Noiiz

---

## Diagnostico del Estado Actual

### Lo que funciona (Glory SEO Framework)
- MetaTagRenderer: title, canonical, meta description server-side en `wp_head()`
- OpenGraphRenderer: og:title, og:description, og:url, og:image, og:type, og:locale
- TwitterCards: summary_large_image con imagen, summary sin imagen
- JsonLdRenderer: Organization, WebSite, BreadcrumbList, FAQPage, BlogPosting
- SeoMetabox: editor de title/desc/og:image/robots por pagina en admin WP
- PageSeoDefaults: SEO por defecto configurable por slug de pagina
- title-tag support, canonical propio (remueve el de WP core)

### Problema critico: SEO de paginas dinamicas
Las rutas `/sample/{slug}`, `/perfil/{username}`, `/coleccion/{id}` se resuelven a la misma pagina WP padre. Esto causa:
1. **Mismo title/description** para TODOS los samples (generico de la pagina "sample")
2. **Mismo og:image** para todos (logo del sitio, no waveform del sample)
3. **Mismo canonical** que apunta a `/sample/` en lugar de `/sample/{slug}/`
4. **Sin JSON-LD especifico** (no hay MusicRecording, Person, etc.)
5. **Sin sitemap de contenido dinamico** (WP sitemap solo lista las ~20 paginas estaticas)

### Impacto: ~95% del contenido indexable de Kamples NO tiene SEO propio

---

## Arquitectura Tecnica de la Solucion

### Flujo actual (problema)
```
Request /sample/trap-beat-dark/ 
  -> parse_request: resolverRutaDinamica() -> pagename='sample'
  -> wp hook: forzarResolucionDinamica()
  -> template_include: interceptarPlantilla() -> TemplateReact.php
  -> wp_head(): SEO hooks leen post_meta de pagina "sample" (GENERICO)
  -> renderReactIsland(): callable extrae slug, lo pasa a React
  -> React monta y llama API /samples/{slug} (CSR, invisible para crawlers no-JS)
```

### Flujo corregido (solucion)
```
Request /sample/trap-beat-dark/
  -> parse_request: resolverRutaDinamica() -> pagename='sample'
  -> wp hook (prioridad 2): DynamicSeoResolver::resolver()
     -> Detecta ruta /sample/{slug}
     -> Llama SamplesRepository::obtenerPorSlugOIdCorto('trap-beat-dark')
     -> Almacena datos SEO en RuntimeSeoData (estatico, solo para esta request)
  -> wp_head(): SEO hooks consultan RuntimeSeoData PRIMERO, luego fallback normal
     -> Title: "Trap Beat Dark - Loop 140BPM Cm by ProducerX | Kamples"
     -> Description: metadata IA + descripcion del sample
     -> Canonical: https://kamples.com/sample/trap-beat-dark/
     -> og:image: waveform del sample
     -> og:audio: preview del sample
     -> JSON-LD: MusicRecording con schema completo
  -> renderReactIsland(): funciona igual (React hidrata encima)
```

### Componentes nuevos
| Componente | Ubicacion | Responsabilidad |
|---|---|---|
| `DynamicSeoResolver` | `Glory/src/Seo/` | Hook `wp` que detecta ruta dinamica y precarga datos |
| `RuntimeSeoData` | `Glory/src/Seo/` | Almacen estatico de SEO para la request actual |
| `SeoSitemapProvider` | `Glory/src/Seo/` | Proveedor de sitemap para WP con samples/perfiles/colecciones |

### Componentes modificados
| Componente | Cambio |
|---|---|
| `MetaTagRenderer` | Consultar RuntimeSeoData antes de post_meta |
| `OpenGraphRenderer` | Soporte og:audio, og:image dinamica, og:type=music.song |
| `JsonLdRenderer` | Schemas: MusicRecording, Person/MusicGroup, ItemList |
| `SeoFrontendRenderer` | Registrar DynamicSeoResolver en hook `wp` |

---

## Fase 1 — SEO Dinamico por Pagina (CRITICO — Mayor Impacto)

### 1.1 RuntimeSeoData
Almacen estatico request-scoped. Campos:
```php
[
    'title'       => string,     // Titulo de pagina
    'description' => string,     // Meta description
    'canonical'   => string,     // URL canonica
    'ogImage'     => string,     // URL imagen OG
    'ogAudio'     => string,     // URL audio preview (solo samples)
    'ogType'      => string,     // og:type (music.song, profile, etc.)
    'robots'      => string,     // index,follow | noindex,nofollow
    'breadcrumb'  => array,      // [{name, url}, ...]
    'jsonLd'      => array|null, // Schema completo override
    'extra'       => array,      // Datos adicionales libres
]
```

### 1.2 DynamicSeoResolver
Resoluciones por tipo de ruta:

**Sample (`/sample/{slug}/`):**
- Title: `"{titulo} - {tipo} {bpm}BPM {key} | Kamples"`
- Description: `"Descarga {titulo} de {creador}. {tipo} {genero} a {bpm}BPM en {key}. {descripcion_truncada}"`
- Canonical: `"{site_url}/sample/{slug}/"`
- og:image: waveform o imagen_url del sample
- og:audio: ruta_preview
- og:type: `music.song`
- JSON-LD: MusicRecording (ver seccion 2)
- Breadcrumb: Inicio > Samples > {titulo}
- robots: `index,follow` (solo si estado=activo)

**Perfil (`/perfil/{username}/`):**
- Title: `"{nombre_visible} (@{username}) - Productor | Kamples"`
- Description: `"{bio_truncada}. {total_samples} samples, {total_seguidores} seguidores en Kamples."`
- Canonical: `"{site_url}/perfil/{username}/"`
- og:image: avatar_url
- og:type: `profile`
- JSON-LD: Person/MusicGroup
- Breadcrumb: Inicio > Productores > {username}
- robots: `index,follow`

**Coleccion (`/coleccion/{slug}/`):**
- Title: `"{nombre} - Coleccion por {creador} | Kamples"`
- Description: `"{descripcion_truncada}. {total_samples} samples."`
- Canonical: `"{site_url}/coleccion/{slug}/"`
- og:image: imagen_url de coleccion
- og:type: `music.playlist`
- JSON-LD: MusicPlaylist
- Breadcrumb: Inicio > Colecciones > {nombre}
- robots: `index,follow` (solo si publica=true)

**Publicacion (`/publicacion/{id}/`):**
- Title: `"{contenido_truncado} - Post de {autor} | Kamples"`
- Description: contenido_truncado 160 chars
- og:type: `article`
- robots: `index,follow` (si moderacion aprobada)

### 1.3 Paginas estaticas — SEO defaults mejorados
Configurar en pages.php via `PageSeoDefaults::setDefaultSeoMap()`:

| Pagina | Title | Description |
|---|---|---|
| home | `Kamples - Samples y Loops Gratuitos para Produccion Musical` | `Descubre miles de samples, loops y one-shots gratuitos. Descarga WAV de alta calidad para tu produccion musical. Algoritmo de descubrimiento personalizado.` |
| descubrir | `Descubrir Samples - Algoritmo IA \| Kamples` | `Encuentra samples perfectos para tu proyecto. Nuestro algoritmo de IA analiza tu estilo y te recomienda loops, one-shots y efectos.` |
| comunidad | `Comunidad de Productores \| Kamples` | `Conecta con productores musicales. Comparte tu trabajo, descubre nuevos artistas y colabora en la comunidad Kamples.` |
| libreria | `Mi Libreria de Samples \| Kamples` | noindex (requiere auth) |
| planes | `Planes y Precios - Free, Pro y Premium \| Kamples` | `Descarga samples gratis o hazte Pro. Desde 0 hasta $19.99/mes. WAV de alta calidad, monetizacion para creadores.` |
| favoritos | `Mis Favoritos \| Kamples` | noindex |
| descargas | `Mis Descargas \| Kamples` | noindex |
| mensajes | `Mensajes \| Kamples` | noindex |
| auth/login | `Iniciar Sesion \| Kamples` | noindex |
| auth/registro | `Crear Cuenta Gratis \| Kamples` | `Crea tu cuenta gratuita en Kamples. Descarga samples WAV, sube tu musica y monetiza tu trabajo como productor.` |
| admin/* | `Panel Admin \| Kamples` | noindex |

---

## Fase 2 — JSON-LD Structured Data (Rich Snippets)

### 2.1 MusicRecording (por sample)
```json
{
  "@context": "https://schema.org",
  "@type": "MusicRecording",
  "name": "Trap Beat Dark",
  "description": "Loop de trap oscuro a 140BPM...",
  "url": "https://kamples.com/sample/trap-beat-dark/",
  "duration": "PT4.5S",
  "genre": ["Trap", "Hip Hop"],
  "musicalKey": "Cm",
  "byArtist": {
    "@type": "Person",
    "name": "ProducerX",
    "url": "https://kamples.com/perfil/producerx/"
  },
  "audio": {
    "@type": "AudioObject",
    "contentUrl": "https://kamples.com/wp-content/uploads/preview.mp3",
    "encodingFormat": "audio/mpeg",
    "duration": "PT4.5S"
  },
  "image": "https://kamples.com/wp-content/uploads/waveform.png",
  "datePublished": "2026-03-01",
  "interactionStatistic": [
    {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/ListenAction",
      "userInteractionCount": 1500
    },
    {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/DownloadAction",
      "userInteractionCount": 320
    },
    {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/LikeAction",
      "userInteractionCount": 85
    }
  ],
  "keywords": ["trap", "dark", "heavy", "drums"],
  "isAccessibleForFree": true,
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
```

### 2.2 Person/MusicGroup (por perfil)
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "ProducerX",
  "alternateName": "@producerx",
  "url": "https://kamples.com/perfil/producerx/",
  "image": "https://kamples.com/uploads/avatar.jpg",
  "description": "Bio del productor...",
  "interactionStatistic": {
    "@type": "InteractionCounter",
    "interactionType": "https://schema.org/FollowAction",
    "userInteractionCount": 450
  },
  "sameAs": [],
  "makesOffer": {
    "@type": "Offer",
    "itemOffered": {
      "@type": "CreativeWork",
      "name": "Samples de ProducerX",
      "description": "150 samples publicados"
    }
  }
}
```

### 2.3 MusicPlaylist (por coleccion publica)
```json
{
  "@context": "https://schema.org",
  "@type": "MusicPlaylist",
  "name": "Dark Trap Essentials",
  "description": "Coleccion de samples de trap oscuro",
  "url": "https://kamples.com/coleccion/dark-trap-essentials/",
  "numTracks": 25,
  "creator": {
    "@type": "Person",
    "name": "ProducerX"
  }
}
```

### 2.4 WebSite con SearchAction (mejorado)
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Kamples",
  "url": "https://kamples.com/",
  "description": "Plataforma de samples y loops gratuitos para produccion musical",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://kamples.com/?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

---

## Fase 3 — XML Sitemap Dinamico

### 3.1 Proveedores custom para wp_sitemaps
WordPress 5.5+ tiene sitemaps nativos. Registrar proveedores custom:

| Proveedor | URL | Contenido |
|---|---|---|
| `kamples-samples` | `/wp-sitemap-kamples-samples-{n}.xml` | Todos los samples activos (paginado 2000/pagina) |
| `kamples-perfiles` | `/wp-sitemap-kamples-perfiles-{n}.xml` | Todos los perfiles publicos |
| `kamples-colecciones` | `/wp-sitemap-kamples-colecciones-{n}.xml` | Colecciones publicas |

Cada entrada incluye:
- `<loc>` URL canonica
- `<lastmod>` updated_at
- `<changefreq>` weekly (samples), monthly (perfiles)
- `<priority>` 0.8 (samples), 0.6 (perfiles), 0.5 (colecciones)

### 3.2 Sitemap index
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://kamples.com/wp-sitemap.xml</loc></sitemap>
  <sitemap><loc>https://kamples.com/wp-sitemap-kamples-samples-1.xml</loc></sitemap>
  <sitemap><loc>https://kamples.com/wp-sitemap-kamples-perfiles-1.xml</loc></sitemap>
  <sitemap><loc>https://kamples.com/wp-sitemap-kamples-colecciones-1.xml</loc></sitemap>
</sitemapindex>
```

---

## Fase 4 — Paginas de Categoria (SEO Programatico — ALTO IMPACTO LONG TAIL)

### Concepto
Crear rutas indexables por genero, tipo, instrumento que capturen busquedas como:
- "free trap loops" → `/explorar/genero/trap/`
- "free drum one shots" → `/explorar/tipo/oneshot/instrumento/drums/`
- "120 bpm hip hop loops" → `/explorar/genero/hip-hop/bpm/120/`

### Implementacion (Fase futura - requiere nuevas paginas WP)
- Ruta: `/explorar/{filtro}/{valor}/` (ej: `/explorar/genero/trap/`)
- DynamicSeoResolver genera title/desc basados en filtros activos
- Contenido: grid de samples filtrados server-side (minimo SSR para crawlers)
- JSON-LD: ItemList con los primeros 10-20 resultados
- Internal linking: cada sample enlaza a su genero, cada genero enlaza a samples

> **NOTA:** Esta fase es la que mas impacto long-tail genera pero requiere un sistema de rutas nuevo. Se planifica despues de la Fase 1-3 que son prerequisito.

### Estrategia de keywords por pagina de categoria
| Ruta | Keyword target | Volumen estimado |
|---|---|---|
| `/explorar/genero/trap/` | free trap loops, trap samples | Alto |
| `/explorar/genero/hip-hop/` | free hip hop loops, hip hop samples | Alto |
| `/explorar/genero/lo-fi/` | lo-fi samples, lofi beats | Alto |
| `/explorar/tipo/loop/` | free loops download | Medio |
| `/explorar/tipo/oneshot/` | free one shots, drum one shots | Medio |
| `/explorar/instrumento/drums/` | free drum samples | Alto |
| `/explorar/instrumento/piano/` | free piano samples | Medio |
| `/explorar/instrumento/bass/` | free bass samples | Medio |

---

## Fase 5 — SEO Tecnico

### 5.1 robots.txt
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /mensajes/
Disallow: /favoritos/
Disallow: /descargas/
Disallow: /libreria/
Disallow: /perfil/editar/
Disallow: /auth/
Disallow: /wp-admin/
Disallow: /wp-json/
Disallow: /componentes/
Disallow: /dev/

Sitemap: https://kamples.com/wp-sitemap.xml
```

### 5.2 Meta robots por pagina
Paginas autenticadas: `<meta name="robots" content="noindex,nofollow">`
- /libreria/, /favoritos/, /descargas/, /mensajes/, /admin/*, /auth/*, /perfil/editar/

### 5.3 Canonical URLs
- Normalizar trailing slash en todas las URLs
- Evitar duplicados entre `/sample/{slug}` y `/sample/{slug}/`
- Parametros de filtro NO deben generar canonicals distintos (canonical apunta siempre a la URL limpia)

### 5.4 Performance (Core Web Vitals)
- Preload de fuentes criticas (Junicode, Bricolage Grotesque)
- Lazy loading imagenes debajo del fold
- CSS critico inline en `<head>` para above-the-fold
- Code splitting React islands (React.lazy + Suspense)
- Cache headers agresivos: samples estaticos (waveforms, images) → `max-age=31536000`
- Compresion Brotli/Gzip en servidor

### 5.5 International SEO (futuro)
- hreflang tags si se expande a ingles
- Contenido bilinguee (tags IA ya generan tags_es + tags en ingles)

### 5.6 Seguridad como senal SEO
- HTTPS obligatorio (Coolify + Let's Encrypt)
- HSTS header
- CSP header (Content Security Policy)

---

## Fase 6 — Contenido y Link Building

### 6.1 Landing page publica (ya existe: LandingPublica)
Optimizar para keywords principales:
- Title: "Kamples - Samples y Loops Gratuitos para Produccion Musical"
- H1: "Descubre Miles de Samples Gratuitos"
- H2s descriptivos por seccion
- Trending samples visibles sin auth
- CTA hacia registro

### 6.2 Blog/Tutoriales (futuro)
Crear contenido tipo:
- "Los mejores samples de trap gratuitos en 2026"
- "Como usar loops en tu produccion musical"
- "Tutorial: crear beats con samples gratuitos"
- Backlinks naturales desde la comunidad de produccion

### 6.3 Internal linking
- Cada sample enlaza a: genero, tipo, perfil del creador, samples similares
- Cada perfil enlaza a: samples publicados, colecciones
- Breadcrumbs funcionales en todas las paginas
- Footer con links a paginas principales

### 6.4 Schema FAQ (paginas informativas)
- /planes/: FAQ sobre precios, limites, monetizacion
- Landing: FAQ sobre que es Kamples, como descargar, licencias

---

## Priorizacion de Implementacion

| Prioridad | Item | Impacto | Esfuerzo |
|---|---|---|---|
| P0 | DynamicSeoResolver + RuntimeSeoData | Critico | Medio |
| P0 | Modificar renderers (Meta/OG/JsonLd) para overrides | Critico | Bajo |
| P0 | SEO defaults para paginas estaticas | Alto | Bajo |
| P0 | JSON-LD MusicRecording para samples | Alto | Medio |
| P1 | XML Sitemap dinamico (samples/perfiles) | Alto | Medio |
| P1 | robots.txt y meta robots | Alto | Bajo |
| P1 | JSON-LD Person para perfiles | Medio | Bajo |
| P2 | Paginas de categoria programaticas | Muy alto (long-tail) | Alto |
| P2 | Server-side content para crawlers | Alto | Alto |
| P3 | FAQ schema en landing/planes | Medio | Bajo |
| P3 | Blog/content marketing | Alto | Continuo |
| P3 | Performance (CWV) optimizations | Medio | Alto |

---

## Analisis Competitivo SEO

### Looperman
- **Fortaleza:** Miles de paginas indexadas por loop individual, categorias por genero/bpm/key, antiguedad del dominio
- **Debilidad:** UX anticuada, no JSON-LD, sin IA, formatos limitados
- **Keyword approach:** "free {genero} loops" (domina por volumen de contenido)

### Splice
- **Fortaleza:** Marca establecida, contenido premium, blog SEO fuerte, backlinks
- **Debilidad:** Paywall (meno contenido gratuito indexable), no tanto long-tail
- **Keyword approach:** Branded + "royalty free samples"

### SampleFocus
- **Fortaleza:** UX limpia, paginas de sample con buen SEO, categorias bien estructuradas
- **Debilidad:** Menos contenido que Looperman, growth estancado
- **Keyword approach:** "free {tipo} samples download"

### Nuestra ventaja competitiva SEO
1. **Metadata IA** — Genera tags, generos, instrumentos automaticamente = SEO escalable sin esfuerzo del usuario
2. **JSON-LD rico** — MusicRecording con AudioObject = rich snippets en Google
3. **Contenido bilinguee** — tags_es captura mercado hispanohablante (poco competido)
4. **Algoritmo de descubrimiento** — Engagement alto = mejores metricas de usuario = mejor ranking

---

## Metricas de Exito SEO

| Metrica | Objetivo 3 meses | Objetivo 6 meses |
|---|---|---|
| Paginas indexadas | 100% samples + perfiles | + categorias |
| Organic traffic | Primeras impresiones | 1000+ visitas/mes |
| Keywords ranking top 50 | 50+ keywords | 200+ keywords |
| Rich snippets activos | Samples con MusicRecording | + Person + FAQ |
| Core Web Vitals | LCP <2.5s, FID <100ms, CLS <0.1 | Mantener |
| Sitemap coverage | 100% contenido publico | + categorias dinamicas |

---

## Lecciones y Gotchas

- [SEO Timing]: `wp_head()` se ejecuta ANTES de `renderReactIsland()`. SEO dinamico DEBE resolverse en hook `wp` (prioridad >1 para ir despues de forzarResolucionDinamica).
- [CSR vs SSR]: React Islands son CSR puro. Googlebot renderiza JS, pero otros crawlers (WhatsApp, Slack, Pinterest) NO. OG tags server-side son criticos para social sharing.
- [Canonical dinamico]: En rutas `/sample/{slug}`, `get_permalink()` retorna la URL de la pagina padre `/sample/`. El canonical DEBE construirse desde `$_SERVER['REQUEST_URI']` normalizado.
- [post_meta compartido]: Todas las rutas `/sample/*` comparten el post_meta de la pagina "sample". NO usar update_post_meta para SEO dinamico (sobreescribiria para todas las rutas). Usar RuntimeSeoData estatico.
- [og:audio]: Schema.org y OG soportan audio. Preview MP3 de samples es ideal para `og:audio` tag — permite reproduccion en algunos clientes sociales.
- [image priorities]: og:image para samples deberia ser: 1) imagen_url, 2) waveform_url, 3) avatar creador, 4) logo sitio.
