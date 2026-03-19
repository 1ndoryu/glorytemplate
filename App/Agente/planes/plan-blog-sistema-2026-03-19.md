# Plan: Sistema de Blog — 183A-109 + 183A-110-A

**Fecha inicio:** 2026-03-19
**Estado:** En progreso — Fase 4 completa

## Visión general
Blog completo: publicar artículos con rich text (bold, imágenes), embeber samples/colecciones, descarga pública togglable, moderación vía sistema existente, categorías pre-definidas, SEO optimizado, tarjetas estilo colección.

## Fases

### Fase 1 — Backend Foundation ← ACTUAL
- [x] Crear ArticulosSchema.php
- [x] Crear ArticulosLikesSchema.php
- [x] Migración v068_articulos_tablas.sql
- [x] Generar schema (npx glory schema:generate)
- [x] ArticulosRepository.php
- [x] ArticulosController.php (CRUD + listado público)
- [x] Registrar controller en KamplesController.php

### Fase 2 — Páginas y Islands Frontend ← ACTUAL (COMPLETADA)
- [x] BlogIsland.tsx (listado de artículos por categoría)
- [x] ArticuloDetalleIsland.tsx (lectura de artículo)
- [x] BlogPageIsland.tsx (dispatcher: lista vs detalle por slug)
- [x] TarjetaArticulo.tsx (tarjeta grid estilo colección)
- [x] Registrar en pages.php y appIslands.tsx
- [x] CSS: blog.css, tarjetaArticulo.css, articuloDetalle.css
- [x] Grid 4 columnas con categorías separadas (183A-110-A)
- [x] apiArticulos.ts (servicio API)
- [x] useBlog.ts + useArticuloDetalle.ts (hooks)
- [x] types/articulo.ts (tipos TS)
- [x] Blog en Sidebar (icono BookOpen)

### Fase 3 — Editor de artículos ← COMPLETADA
- [x] articuloEditorStore.ts (Zustand store con estado del editor)
- [x] useEditorArticulo.ts (hook con publicar/validar/formatear/imagen)
- [x] ModalArticulo.tsx (editor rich text con toolbar, categorías, portada, extracto)
- [x] modalArticulo.css (estilos del editor)
- [x] Textarea.tsx (componente UI base — no existía)
- [x] Bold, imágenes, vista HTML/edición (toolbar completa: bold, italic, h2, h3, listas, cita, imagen, enlace, código)
- [x] Toggle descarga pública
- [x] Extender botón "crear" en TopBar con menú contextual (publicación vs artículo)
- [x] ModalArticulo renderizado en LayoutPrincipal.tsx
- [ ] Selector de samples para embeber (pendiente Fase 5)
- [ ] Selector de colecciones con cuadro de samples (pendiente Fase 5)

### Fase 4 — Moderación y SEO ← COMPLETADA
- [x] Integrar con AdminModeracionController (artículos entran como pendientes, admin auto-aprobados)
- [x] DynamicSeoResolver para artículos (title, og, json-ld BlogPosting)
- [x] Sitemap para artículos
- [x] React: TabModeracionAdmin muestra artículos pendientes con aprobar/rechazar/ver
- [x] React: apiAdmin types + moderarContenido acepta 'articulo'
- [x] Ruta /blog en MAPA_RUTAS de LayoutPrincipal
- [x] Notificación al autor en rechazo de artículo

### Fase 5 — Navegación e integración
- [ ] Tab blog en sidebar (público y privado)
- [ ] Like y comentarios en artículos (reusar sistema existente)
- [ ] Menú 3 puntos en tarjeta artículo
- [ ] Landing público: sección blog

## Categorías pre-definidas (español por defecto)
**Tips y tutoriales:** Inspiración, Mastering, Mezcla, Promoción Musical, Teoría Musical, Grabación, Sampling, Diseño Sonoro, Herramientas
**DAWs:** Ableton Live, Bitwig Studio, Cubase, FL Studio, GarageBand, Logic Pro, Pro Tools, Studio One
**Contenido gratis:** Drops Gratis, MIDI Gratis, Plugins Gratis, Presets Gratis, Archivos de Proyecto Gratis, Sonidos Gratis
**Historias:** Entrevistas a Artistas, Destacados, Noticias

## Decisiones arquitectónicas
- Tabla PG propia `articulos` (no WP posts) → consistente con samples/publicaciones
- Tabla `articulos_likes` separada para likes
- Moderación: campo `moderacion_estado` en articulos, reusa AdminModeracionController
- Categorías: campo `categoria` VARCHAR con check constraint (no tabla separada, las categorías son fijas)
- Contenido: HTML sanitizado almacenado como TEXT
- Samples/colecciones embebidos: campo JSON `embeds` con array de {tipo, id}
- Slug auto-generado desde título, UNIQUE
