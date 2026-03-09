# Kamples — Pendientes por Fase

> Tareas pendientes. Fases 0-7 completas (ver `completado.md`). Docs específicos en `App/docs/`.

---

## TO-DOs de fases anteriores

- [ ] **5.3** WebSocket local (canales chat/notif, typing, online, read receipts)
- [ ] **5.4** Optimización chat (virtualización, lazy load, caché local)
- htaccess deny direct access, servir via PHP con validación permisos
- Pipeline → wp_schedule_single_event() cuando volumen crezca
- WebP conversion, lazy loading, srcset para colors/
- Google OAuth cuando keys estén listas (1.4)
- Click tag → filtrar por categoría BPM (2.5)
- Edición nombre sample antes de publicar (2.6)
- Lookup dual slug/id_corto (2.7)
- Filtros toggle → backend (4.3)
- Metadata IA (instrumentos, sentimiento, artistas) en SampleDetalle (6.2)

---

## FASE 8 — Tiempo Real (WebSocket producción) — Prioridad BAJA

- [ ] **8.1** Servidor Bun WebSocket VPS
- [ ] **8.2** Auth JWT en WebSocket
- [ ] **8.3** Notificaciones push tiempo real
- [ ] **8.4** Sync reproductor entre tabs

---

## FASE 9 — Desktop (Tauri 2.0)

- [ ] **9.10** Optimización extrema — ventanas múltiples, plugins, code splitting, lazy islands
- **TO-DOs:** CORS servidor para desktop (Origin: tauri://localhost), login desktop UI cross-origin, code splitting (chunk 649KB → manualChunks Vite)

---

## FASE 10 — Móvil (Capacitor)

- [ ] UI móvil, push notifications, background playback, offline cache

---

## FASE 11 — Algoritmo v2

> Estado actual: 6 señales, embeddings 128d, perfil con decay temporal y cache transient, sub-factores bounded [0,1], dislike como señal negativa, penalización progresiva y pasiva, diversidad, serendipia, tendencias sin sesgo. Auditorías S1-S4 completadas — ver `completado.md` y `App/docs/algoritmo.md`.

### Tareas pendientes

- [ ] **11.1** Contexto DAW — datos mezclador en señales (afinidad cruzada)
- [ ] **11.2** Embeddings mejorados — espectrograma mel (Essentia/librosa) reemplazando tags hasheados (106 slots CRC32)
- [ ] **11.4** Collaborative filtering — "usuarios similares descargaron X" (requiere ~100+ usuarios)
- [ ] **11.5** A/B testing framework — cohortes, métricas (CTR, descarga/impresión), dashboard

> Completados: 11.3 (decay temporal ✅, vector separado cubierto por 11.2), 11.6 (diversidad feed ✅), 11.7 (dislike S3 ✅, botón UI "no me interesa" pendiente de UX).
> Deps: 11.2 requiere pipeline Python/WASM. 11.4 requiere volumen mínimo. 11.5 independiente.

---

## FASE 12 — SEO/Performance/Hardening

> Glory tiene MetaTagRenderer+OpenGraphRenderer+JsonLdRenderer+SeoMetabox. RateLimiter en 5 endpoints. Sin CSP, sin tests, sin code splitting.
> **SEO dinámico completado:** RuntimeSeoData, DynamicSeoResolver, SeoKamples (sample/perfil/coleccion), OpenGraph + Twitter Cards + JSON-LD (MusicRecording/Person/MusicPlaylist), Sitemap XML custom (3 providers), SEO defaults para todas las páginas estáticas, canonical dinamico, meta robots noindex para páginas privadas. Ver `App/docs/plan-seo.md`.

- [x] **12.1** SEO dinámico islands — meta tags samples/perfiles/colecciones, OG images ✅ [AG-SEO]
- [x] **12.2** JSON-LD — MusicRecording, Person, MusicPlaylist, BreadcrumbList, FAQPage ✅ [AG-SEO]
- [ ] **12.3** Code splitting — React.lazy+Suspense para Mezclador/PianoRoll
- [ ] **12.4** Compresión — Brotli/Gzip, cache headers agresivos
- [ ] **12.5** CSP — nonces, restrict script/style/connect/media/frame-src
- [ ] **12.6** Security hardening — HSTS, X-Frame-Options, Referrer-Policy
- [ ] **12.7** Tests unitarios — PHPUnit repos/servicios, Vitest hooks React
- [ ] **12.8** Tests E2E — Playwright flujos críticos
- [ ] **12.9** Performance monitoring — Core Web Vitals, Lighthouse CI, budget <200KB
- [ ] **12.10** Sitemap XML dinámico — registrado ✅ [AG-SEO], validar en producción con Google Search Console
- [ ] **12.11** Páginas programáticas SEO — /explorar/genero/{genre}/, /explorar/bpm/{range}/ (ver plan-seo.md Fase 4)
- [ ] **12.12** robots.txt + crawl budget — optimizar para indexación eficiente
- [ ] **12.13** SSR/content injection para crawlers — renderizar contenido SEO para bots (plan-seo.md Fase 5)

---

## FASE 13 — Panel Admin (parcial)

320. Tab Reportes: ReportesController::listar()/resolver(), tabla `reportes`
321. Tab Monetización: ingresos Stripe por período, top creadores, desglose por plan

> ✅ C523 [AG-MOD]: Fix nonce SPA post-login — `useAuth.ts` fuerza `window.location.href='/'` en web (no desktop) para regenerar `GLORY_CONTEXT.nonce` autenticado.  
> ✅ C524 [AG-MOD]: Rediseño panel moderación historial IA — grid 3 cols auto-fill, acordeón JSON `<details>`, `MenuContextual` sistema UI (coords getBoundingClientRect), Modal ban con `SelectorBase`+`Input`, notificaciones rechazo, endpoint ban+rechazar-todas, `autor_id` en historial query.

---

## Sprint — Revisión + UI pendiente

344. tarjetaMeta clickable + filtro vista actual: Metas de TarjetaSample (BPM, key, tipo, género) clickables para filtrar la vista actual (no global).

346. Fix librería recarga constante: LibreriaIsland se recarga cada vez. Debería usar keep-alive (verificar useIslaActiva/useValorCongelado, guards `activa`). Patrón ref: useSampleDetalle con freeze.

347. Botones volver consistentes: Unificar estilo botón volver en todas las páginas. Crear clase compartida `botonVolver` que no dependa de contexto CSS.

348. Subcarpetas alinear derecha: `justify-content: flex-end` en contenedor subcarpetas.
    - Archivos: `explorador.css`

349. **[CRÍTICA] Rediseño explorador tipo file manager:** Funcionar como Google Drive/Windows Explorer.
    - Archivos: `ExploradorIsland.tsx`, `useExploradorIsland.ts`, `useExploradorPagina.ts`, `ArbolCarpetas.tsx`, `explorador.css` + nuevos
    - **Concepto:** Raíz muestra carpetas + samples sueltos. Click carpeta → entra. Subcarpetas arriba + samples abajo. Navegación por click (no sidebar). ArbolCarpetas colapsable/oculto. Eliminar "carpeta Todas". Breadcrumbs funcionales.
    - **Componentes:** `TarjetaCarpeta.tsx`, `VistaExplorador.tsx`, `BarraHerramientasExplorador.tsx`, `useNavegacionCarpetas.ts`
    - **Estado:** carpetaActual (null=raíz), historial[], vista (grid/lista). Filtrado client-side useMemo.

350. Rediseño gráfica admin "Actividad últimos 14 días": Barras CSS-only o canvas. Tooltips hover, eje X fechas cortas, responsive.
    - Archivos: `TabResumenAdmin.tsx`, `useAdminPanel.ts`, CSS admin

351. [EN CURSO — AG-GRQ] Moderación: (a) Log sin razón — verificar campo `razon` en servicio. (b) Posts con audio quedan en revisión — manejar audio adjunto. (c) Imágenes no salen en panel moderación. **Estado:** subpunto (a) corregido con fallback de razón y envío Groq de imágenes locales vía data URL; pendientes audio y panel.
    - Archivos: `ServicioModeracionIA.php`, `AnalizadoresModeracion.php`, `LogModeracion.php`, `TabResumenAdmin.tsx`

352. Créditos sin límite visible: Mostrar solo "Créditos: 5" (no "5/5"). Al límite: "Créditos: 0".
    - Archivos: `useTopBar.ts`

---

## Sprint D — UI/UX + Sync + Branding

D1. **Sync server→local bidireccional:** Samples publicados desde web se sincronizan localmente automáticamente si sync activo (o al abrir). En laptop nueva, descargar samples existentes.
    - Archivos: `syncService.ts`, `syncTrackingService.ts`, `SyncController.php`, desktop services
    - Requiere: endpoint delta/diff, descarga batch, reconciliación estado

> D2-D9 completados [AG-SPD]: Logo, admin tabs nav, sistema estilos refactor, filtros toggles, ModalAcciones centralizado, image edit modal, skeleton loading system, audit sentinel. Ver `completado.md`.

---

## Sprint E — Fixes + Landing

> Completado — AG-SPE / AG-LND. Landing page, log fixes, logo sidebar, editarImagenPortada, selectorMenu z-index, feedTagsLista IA tags, skeleton bordeSutil, sync comunidad, sentinel TS, branding Junicode/Bricolage, hover card filaColecciones. Ver `completado.md`.

---

## Glory Sentinel v3 — Nuevas detecciones

> Completado — AG-SEN. Eliminación IA completa, 8 reglas PHP nuevas, 5 reglas TS + 3 enhancements, 221 tests passing, undefined-class-constant con phpConstantIndexer, fix falsos positivos 43→~10, VSIX 450KB. Ver `completado.md` y `.agent/code-sentinel/PLAN_V3_DETECCIONES_Y_DEPRECACION_IA.md`.

---

## Pendientes sueltos

359. Componente centralizado estados vacios/carga (coherencia visual).
360. Al eliminar sample propio, restar crédito.

---

## Sprint F — Fixes UX + Sync + UI

> Completado — AG-FIX. Duplicados cross-carpeta (hashARutas 1:N), ocultar ruta subida, modal editar imagen clickeable, sync thumbnail, menú contextual fix getBoundingClientRect, explorador limpieza, rename carpeta→colección, botón comentar fix evento, similares WP transient 15min, skeleton auth layout, coleccionados creador owner-aware, borrado optimista publicaciones, iconos desktop, config CampoTexto desnudo. Ver `completado.md`.

---

## Auditoría sistema subidas — Plan (C367)

- [ ] **367a** Cancelación por mala conexión: Verificar reintentos (MAX_REINTENTOS=3, backoff exponencial) + timeout AbortController 120s.
- [ ] **367b** Integridad al mover archivos: Verificar hash pre/post `moverArchivoASinColeccion`. Si hash difiere, revertir.
- [ ] **367c** Pipeline IA resilience: Auditar `ProcesadorColaIA` — qué pasa si Groq caído 24h, sample borrado entre encolado y procesamiento, respuesta IA malformada.
- [ ] **367d** Upload queue edge cases: Archivos >100MB (timeout?), 0 bytes, corruptos (header WAV inválido), nombres con unicode especial.
- [ ] **367f** Constraint UNIQUE: Agregar `UNIQUE (usuario_id, LOWER(nombre))` a tabla colecciones para dedup atómico.

> 367e completado [AG-DDP]: server-side dedup endpoint `POST /samples/check-duplicate` + pre-check en uploadQueueService.

---

## Sprint G — Testing Batch Bugfixes

> Completado — AG-FIX. Excluir carpeta duplicados de watcher, detección colecciones huérfanas, auto-posts tipo+moderacion, selector X absoluto, audio cleanup, stats Cola IA TS alineado, cuota Groq headers, CSS Cola IA, rechazo masivo moderación, auth modal cierra, feed diversidad ROW_NUMBER, ComentariosEnums MODERACION_ESTADO_, Groq vision instruct suffix, BadgeModeracion autor. Ver `completado.md`.

---

## Bugfixes C270-C289

> Todos completados. Ver `completado.md` para detalle completo.

- **C270-C273:** Parser ComentariosRepository, rechazarTodosPendientes PDO fix, enum constants moderacion, scroll infinito comunidad IntersectionObserver.
- **C274-C276:** FK cascade colecciones manual, auth sync 403 multi-capa (4 capas: PHP 4 sources + custom header + sync headers explícitos + diagnósticos).
- **C277-C280:** Plan sync WAL+delta+integridad+errores+atómico+observabilidad, hardening 20 archivos (+1237/-847).
- **C281-C285:** Fix 500 SamplesEnums TODOS_ESTADO + Tauri journal permissions, PHP runtime enums schema regen, sprint seguridad SEC-C1/C2/A3/M2/M4, CLI `npx glory php:check`, file lock OS error 32 backoff.
- **C286-C289:** Tracking scoped por userId (contaminación cross-usuario), 3 bugs TC1-merge+carpeta-repetida+subcarpeta-Windows rename, TC1 journal recovery + reconciliación periódica carpetas, 5 bugs sync (fantasmas+paths rename+server-local+caché+rate limit).

### Lecciones clave C270-C289
- [Auth nginx]: nginx+PHP-FPM puede no pasar `HTTP_AUTHORIZATION`. Headers custom (`X-Kamples-Auth`) siempre se pasan. Doble vía = auth robusta.
- [Tracking Scoping]: El tracking sync DEBE estar scoped por userId. Sin esto, cambiar cuenta contamina con colecciones ajenas → 403 cascada.
- [TC1 Merge]: Limpiar datos in-memory NO es suficiente si el Store persiste datos viejos. Escribir al Store inmediatamente + actualizar `versionLocalConocida`.
- [Watcher+OneDrive]: notify-rs NO emite rename events fiables en Windows+OneDrive. Usar reconciliación periódica (escanear disco cada 15s) — no confiar en eventos para renames.
- [Journal recovery]: Tras recovery, leer Store para sincronizar `versionLocalConocida`. Sin esto, TC1 merge siempre se dispara.
- [file lock]: Windows mantiene lock durante copy/write. Esperar con backoff corto (300ms-5s) antes de leer.
- [Schema]: `writeFile` vs `writeTextFile` son permisos separados en Tauri 2.0.
- [INTERVAL SQL]: Usar whitelist en repositorio para valores de intervalo, nunca interpolar directo. Ver regla SEC-C1.

---
