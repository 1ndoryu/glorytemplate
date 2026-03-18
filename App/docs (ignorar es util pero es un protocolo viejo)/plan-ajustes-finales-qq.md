# Plan Ajustes Finales — QQ1 a QQ13

> **Agente:** AG-QQF | **Fecha:** 2026-03-12 | **Branch:** main-kamples

---

## \u2705 QQ9 — [AG-QQF] Pipeline: Mover verificacion duplicados ANTES de IA
**Archivo:** `App/Kamples/Api/PipelineAudio.php`
**Problema:** El pipeline ejecuta analisis IA (consume tokens Groq) y LUEGO verifica duplicados. Si es duplicado, se desperdician recursos.
**Solucion:** Reordenar pasos: hash SHA-256 + verificacion duplicados INMEDIATAMENTE despues del analisis tecnico (BPM/key), ANTES de IA. Ademas, cuando se detecta duplicado, NO eliminar el sample nuevo — marcarlo como pendiente de revision en admin/duplicados y conservar los archivos de audio para poder reproducirlos.
**Impacto:** Ahorro de tokens IA, audios disponibles en admin/duplicados para revision.

---

## \u2705 QQ5 — [AG-QQF] Middle-click abre en nueva pestana (solucion general)
**Archivos:** `TarjetaSample.tsx`, `GloryLink.tsx`, `EnlaceNavegacion.tsx`, otros componentes con click handlers
**Problema:** Botones/elementos clickables usan `onClick` con `navegar()` en vez de `<a href>`. El middle-click no abre nueva pestana.
**Solucion arquitectonica:** Donde el destino sea una ruta conocida, usar `<a href="/ruta">` con intercepcion de click izquierdo para SPA navigation, dejando que el browser maneje middle-click/ctrl+click nativamente. Componentes afectados: TarjetaSample titulo, panelDetalleDiscoveryTarjetas, "Ver completo" botones, tarjetaCancionFeed, tablaRelacionesFila. Centralizar en `EnlaceNavegacion` o `GloryLink` el patron.

---

## \u2705 QQ4 — [AG-QQF] 404 en acceso directo a /admin/panel
**Archivo:** `App/Config/pages.php`, posiblemente `Glory/Config/*` o rewrite rules de WP
**Problema:** Las rutas SPA funcionan al navegar internamente pero dan 404 al acceso directo porque WordPress no tiene rewrite rules para esas URLs.
**Solucion:** Verificar que `PageManager::reactPage()` registra correctamente rewrite rules en WordPress para TODAS las rutas. Si falta, agregar `add_rewrite_rule` o flush rewrite en activacion/guardado de permalinks.

---

## \u2705 QQ3 — [AG-QQF] Persistir tab activa y filtros en URL
**Archivos:** `InicioIsland.tsx`, `useFeedSamples.ts`, `navigationStore.ts`, stores de filtros
**Problema:** Al recargar pagina se pierde la tab abierta, el orden y los filtros del feed.
**Solucion:** Sincronizar estado de tab activa, ordenamiento (`inicioOrdenWrapper`) y filtros a query params de la URL (`?tab=samples&orden=recientes&bpm=120`). Al cargar, leer query params y restaurar estado. Usar `URLSearchParams` + `history.replaceState` para actualizar sin recargar.

---

## \u2705 QQ2 — [AG-QQF] Contador inicioTagsContador muestra total por pagina, no total global
**Archivo:** `App/React/hooks/useFeedSamples.ts`, `InicioIsland.tsx`
**Problema:** `onConteoChange(samplesFiltrados.length)` reporta solo los samples de la pagina actual (12), no el total de todas las paginas.
**Solucion:** El backend debe retornar `total` en la respuesta de la API. Usar ese total en vez de `samplesFiltrados.length`. Cuando se aplica busqueda/filtro en backend, el total se actualiza con la cifra real.

---

## \u2705 QQ6 — [AG-QQF] Contador favoritos siempre 0
**Archivos:** `FavoritosIsland.tsx`, `useFavoritosPagina.ts`, API endpoint de favoritos
**Problema:** El contador en /favoritos/ siempre muestra 0.
**Solucion:** Investigar si la API retorna total correcto o si el hook no lo asigna. Comparar con /descargas/ que funciona bien.

---

## \u2705 QQ7 — [AG-QQF] Perfil: primera tab = publicaciones
**Archivo:** `App/React/hooks/usePerfilIsland.ts`
**Problema:** La tab por defecto es "samples" pero deberia ser "publicaciones".
**Solucion:** Cambiar orden de tabs en la definicion del hook. Tab activa por defecto = 'publicaciones'.

---

## \u2705 QQ8 — [AG-QQF] Tooltip global + layout modal publicacion
**Archivos:** Nuevo componente `Tooltip.tsx`, modal de publicacion (crearCondiciones), CSS
**Problema:** (a) Botones en crearCondiciones tienen texto visible, dejar sin texto con tooltip hover. (b) Cuando se activa precio, el contenedor debe ir debajo del textarea.
**Solucion:** (a) Crear componente `Tooltip` global reutilizable (minimalista, aparece al hover). Aplicar en botones de condiciones. (b) Reordenar DOM en el modal: crearPrecioContenedor despues de contenedorCampoTexto.

---

## \u2705 QQ12 — [AG-QQF] Boton reportar errores en sidebar
**Archivos:** `Sidebar.tsx` (footer), nuevo `ModalReporte.tsx`, nuevo endpoint reportes
**Problema:** No existe forma de reportar errores.
**Solucion:** Agregar boton "Reportar" arriba del boton config en sidebarFooter. Modal similar al de publicacion con textarea + adjuntar audio/imagen. Reportes visibles en /admin/panel/ moderacion. Tabla `reportes` en BD si no existe.

---

## ✅ QQ13 — [AG-QQF] URLs colecciones con slug SEO
**Archivos:** `App/Config/pages.php`, `ColeccionesRepository.php`, `ColeccionesCrudController.php`
**Problema:** URL de coleccion usa ID numerico (`/coleccion/91/`) en vez de slug legible.
**Solucion:** Verificar si las colecciones ya tienen campo slug. Si no, agregar columna `slug` generado de `sanitize_title(nombre) + id_corto`. Actualizar ruta a `/coleccion/{slug}/` y resolver por slug en la API.

---

## \u2705 QQ10 — [AG-QQF] Revision spam/seguridad
**Archivos:** `ServicioAntiSpam.php`, controladores de mensajes/publicaciones/comentarios/posts
**Problema:** Verificar que hay mecanismos anti-spam en TODOS los endpoints de creacion de contenido (no solo publicaciones). Sync NO debe verse afectado.
**Solucion:** Auditar endpoints: mensajes, publicaciones, comentarios. Verificar que sync tiene bypass o rate limits propios. Documentar estado.

---

## ✅ QQ11 — [AG-QQF] Sistema samples pro con precio + Stripe
**Archivos:** Modal publicacion, `SamplesController`, nuevo servicio Stripe, `/descargas/` island
**Problema:** Samples pro no se pueden comprar. Precio existe pero no hay flujo de compra.
**Solucion:** (a) Backend: endpoint POST /pagos/checkout-sample crea sesion Stripe (mode: payment), webhook procesa compra_sample con revenue share y email. GET /descargas/comprados lista samples comprados. NormalizadorSample enriquece yaComprado flag. (b) Frontend: boton $ reemplaza + en TarjetaSample para samples con precio. Click redirige a Stripe Checkout. Tab "Comprados" en DescargasIsland.

---

## ✅ QQ1 — [AG-QQF] Revision despliegue VPS
**Archivos:** `.env.example`, `GitCommandRunner.php`, `ComentariosInteraccionController.php`, `DeduplicadorAudio.php`
**Problema:** Proyecto testeado en Windows, necesita funcionar en Linux VPS con Coolify (Rust).
**Resultado auditoría:**
- **3 issues críticos encontrados, todos resueltos:**
  1. `.env` tiene rutas Windows — `.env.example` y stack YAML ya tienen rutas Linux correctas. No requiere cambio en código.
  2. `GitCommandRunner.php`: usaba constante `WP_SYSTEM` inexistente para detectar OS. Migrado a `PHP_OS_FAMILY` + `file_exists()` condicional.
  3. `DevController.php`: rutas Windows hardcodeadas pero protegidas por `$esWindows` guard. No romperán en Linux.
- **Mejoras cross-platform aplicadas:**
  - `ComentariosInteraccionController.php` y `DeduplicadorAudio.php`: Eliminada detección FFmpeg duplicada, delegada a `FFmpegDetector` centralizado.
  - `.env.example`: Agregadas variables faltantes (`KAMPLES_PYTHON_PATH`, `KAMPLES_CRON_SECRET`, `KAMPLES_SISTEMA_USUARIO_ID`).
- **Docker faltantes documentados (no críticos para primer deploy):**
  - Python no instalado en Dockerfile (scraper no funcionará desde WP)
  - No hay cron daemon en container (usar WP Cron o Coolify scheduled tasks)
  - kamples-scraper/ necesita volume mount o COPY adicional
- **Estado general:** El proyecto es cross-platform. La mayoría de archivos ya usan `PHP_OS_FAMILY` correctamente. Temp dirs usan `sys_get_temp_dir()`. Cron usa `wp_schedule_event`.

---

## Orden de ejecucion

1. QQ9 (mas dificil — pipeline reorder + conservar audio duplicados)
2. QQ5 (arquitectonico — solucion general navegacion)
3. QQ4 (routing 404)
4. QQ3 (persistencia URL)
5. QQ2 (contador total)
6. QQ6 (contador favoritos)
7. QQ7 (tab perfil)
8. QQ8 (tooltip + layout)
9. QQ12 (reportar errores)
10. QQ13 (URLs colecciones)
11. QQ10 (auditoria spam)
12. QQ11 (samples pro/precio — feature grande)
13. QQ1 (VPS — al final)
