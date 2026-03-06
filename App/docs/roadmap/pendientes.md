# Kamples — Pendientes por Fase

> Tareas pendientes organizadas por fase. Las fases 0-7 están completadas (ver `completado.md`).

---

## TO-DOs de fases completadas

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

## FASE 9 — Desktop (Tauri 2.0) — MVP completado

- [ ] **9.10** Optimización extrema — ventanas múltiples, plugins, code splitting, lazy islands
- **TO-DOs:** CORS servidor para desktop (Origin: tauri://localhost), login desktop UI cross-origin, code splitting (chunk 649KB → manualChunks Vite)

---

## FASE 10 — Móvil (Capacitor)

- [ ] UI móvil, push notifications, background playback, offline cache

---

## FASE 11 — Algoritmo v2

> Estado: 6 señales con embeddings 128d. Perfil usuario = promedio ponderado con **decay temporal** y **cache transient**. Sub-factores bounded [0,1]. Dislike como señal negativa. Escala musical en contexto. CTE 2 niveles. Batching + GC en cron. **S3:** Penalización progresiva reproducciones, penalización pasiva, saturación popularidad, serendipia, tendencias sin sesgo edad, pesos rebalanceados (contenido > técnico). Sin A/B testing ni collaborative filtering.

### Auditorías completadas (resumen)

> Detalle completo en `completado.md` sección Algoritmo y en `App/docs/algoritmo.md`.

- **AG-ALG S1:** 17 fixes (P0-P4): sub-pesos, bounded, cache, CTE 2 niveles, decay, dislike, escala.
- **AG-ALG S2:** 5 fixes: tag normalization, algoritmoPesos expandido, feed comunidad scoring, búsqueda ranking, PublicacionesEnums.
- **AG-ALG S3:** 8 cambios: pesos rebalanceados, contexto contenido>técnico, penalización progresiva, pasiva, saturación, serendipia, tendencias sin sesgo, samples_similares.
- **AG-ALG S4:** 6 cambios: clasificación calidad reproducciones, SUM(peso), pasiva solo significativas, saturación dinámica, tracking duración real, intervalo_activo verificado.

### Tareas pendientes

- [ ] **11.1** Contexto DAW — datos mezclador en señales (afinidad cruzada)
- [ ] **11.2** Embeddings mejorados — espectrograma mel (Essentia/librosa) reemplazando tags hasheados (106 slots CRC32)
- [x] **11.3** ~~User embeddings dedicados — vector separado, decay temporal~~ **PARCIAL:** Decay temporal implementado (EXP(-dias/30)) en interacciones para perfil. Vector separado pendiente.
- [ ] **11.4** Collaborative filtering — "usuarios similares descargaron X" (requiere ~100+ usuarios)
- [ ] **11.5** A/B testing framework — cohortes, métricas (CTR, descarga/impresión), dashboard
- [x] **11.6** ~~Diversidad mejorada~~ **PARCIAL:** feedNuevoUsuario con diversidad creador + boost verificado + decay exponencial. Feed principal ya tenía diversidad (ROW_NUMBER PARTITION).
- [x] **11.7** ~~Feedback signals — "no me interesa", señal negativa explícita~~ **COMPLETADO S3:** Dislike penaliza en Comportamiento (max -0.15). Penalización pasiva: play sin acción = dislike implícito (0.85). Falta solo botón UI "no me interesa" (diferente de dislike).
- **Deps:** 11.2 requiere pipeline Python/WASM (128d→256d+). 11.4 requiere volumen mínimo. 11.5 independiente.

### Aprendizajes Algoritmo

**S3:**
- [Tendencias]: La normalización por `horas_desde_publicación` creaba sesgo anti-antigüedad. Corregido a normalizadores absolutos.
- [Contexto]: El split 75/25 (contenido/técnico) en sub-pesos es más efectivo que separar en 2 señales — mantiene la señal unificada configurable.
- [Serendipia]: pgvector BETWEEN en distancia coseno funciona nativo. Fallback random con filtro de engagement es suficiente.
- [Penalizaciones]: Multiplicativas (post-score) > aditivas para penalties que modifican el scoring sin romper la suma=1.0.
- [samples_similares]: El path pgvector ya es correcto (tags dominan 106/128 dims). Solo el fallback necesitaba rebalanceo.

**S4:**
- [Tracking]: Backend debounce 30s (buscarRecientePorUsuario) funciona bien para el patrón "registrar al finalizar". No hace falta registro al iniciar play.
- [Clasificación]: Umbrales adaptativos por duración del sample evitan tratar un sample de 5s igual que uno de 2min. CASE en SQL con subconsulta a s.duracion.
- [Saturación]: PERCENTILE_CONT es nativo PostgreSQL, no requiere extensiones. Cache en WP transient evita recalcular en cada query.
- [Frontend]: La utilidad centralizada `trackingReproduccion.ts` simplifica los 4 hooks — una función, un umbral mínimo, best-effort.
- [Actividad]: `intervalo_activo_min` funciona correctamente via `ultima_actividad = NOW()` en incrementarContador(). No requiere cambios.

---

## FASE 12 — SEO/Performance/Hardening

> Glory tiene MetaTagRenderer+OpenGraphRenderer+JsonLdRenderer+SeoMetabox. RateLimiter en 5 endpoints. Sin CSP, sin tests, sin code splitting.

- [ ] **12.1** SEO dinámico islands — meta tags samples/perfiles/colecciones, OG images
- [ ] **12.2** JSON-LD — Product, Person, MusicRecording, BreadcrumbList
- [ ] **12.3** Code splitting — React.lazy+Suspense para Mezclador/PianoRoll
- [ ] **12.4** Compresión — Brotli/Gzip, cache headers agresivos
- [ ] **12.5** CSP — nonces, restrict script/style/connect/media/frame-src
- [ ] **12.6** Security hardening — HSTS, X-Frame-Options, Referrer-Policy
- [ ] **12.7** Tests unitarios — PHPUnit repos/servicios, Vitest hooks React
- [ ] **12.8** Tests E2E — Playwright flujos críticos
- [ ] **12.9** Performance monitoring — Core Web Vitals, Lighthouse CI, budget <200KB

---

## FASE 13 — Panel Admin (parcial)

320. Tab Reportes: ReportesController::listar()/resolver(), tabla `reportes`
321. Tab Monetización: ingresos Stripe por período, top creadores, desglose por plan

---

## Sprint — Tareas pendientes de revisión por el usuario

343. Tags feed no-compress: feedTagsLista scroll horizontal sin comprimir. (COMPROBADO; FUNCIONA ✅)

344. tarjetaMeta clickable + filtro vista actual: Metas de TarjetaSample (BPM, key, tipo, género) clickables para filtrar la vista actual (no global).

345. Rediseño filtroPrecio + borrar filtrosTitulo: Eliminar `<h3 filtrosTitulo>`. filtroPrecioSeccion con borde+padding. filtroPrecioBoton borde visible + efecto activo tipo segmented control. (COMPROBADO; FUNCIONA ✅)

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

351. Moderación: (a) Log sin razón — verificar campo `razon` en servicio. (b) Posts con audio quedan en revisión — manejar audio adjunto. (c) Imágenes no salen en panel moderación.
    - Archivos: `ServicioModeracionIA.php`, `AnalizadoresModeracion.php`, `LogModeracion.php`, `TabResumenAdmin.tsx`

352. Créditos sin límite visible: Mostrar solo "Créditos: 5" (no "5/5"). Al límite: "Créditos: 0".
    - Archivos: `useTopBar.ts`

---

## Sprint D — UI/UX + Sync + Branding

D1. **Sync server→local bidireccional:** Samples publicados desde web se sincronizan localmente automáticamente si sync activo (o al abrir). En laptop nueva, descargar samples existentes.
    - Archivos: `syncService.ts`, `syncTrackingService.ts`, `SyncController.php`, desktop services
    - Requiere: endpoint delta/diff, descarga batch, reconciliación estado

D2. ✅ [AG-SPD] **Sentinel services audit:** Regla funciona (400 líneas efectivas). 2 archivos superan: ConstructorSenales.php (655 raw, TO-DO split agregado) y MotorRecomendacion.php (544 raw, ya tenía TO-DO). Resto <400. Glory services todos <325. No hay sentinel-disable en ninguno.

D3. ✅ [AG-SPD] **Logo Kamples:** LogoKamples.tsx (SVG inline), TopBar logo con click home, favicon.svg, header.php meta, desktop resource + favicon.
    - TO-DO: Regenerar PNGs desktop con `cargo tauri icon desktop/src-tauri/icons/favicon.svg`

D4. ✅ [AG-SPD] **Admin tabs al nav:** useTabsIsla en AdminPanelIsland, tabs registradas en TopBar con keep-alive.

D5. ✅ [AG-SPD] **Sistema estilos refactor:** SelectorMenu (portal), EstadoVacio, BotonBase variante ninguno, CampoTexto border-bottom, sin adminPanelTitulo, 4 tabs admin migradas.

D5b. ✅ [AG-SPD] **Auditoría cola IA:** 3 bugs críticos corregidos (marcarError args, listarItems $tipo, polling frontend). Audit doc en `App/docs/auditoria-cola-ia.md`.

D6. ✅ [AG-SPD] **Filtros toggles:** Descripcion + padding aumentado. FiltroToggleDef con campo descripcion.

D7. ✅ [AG-SPD] **ModalAcciones centralizado:** Componente reutilizable, botones 100% ancho, 3 modales migrados (filtros, editar, coleccion).

D8. ✅ [AG-SPD] **Image edit + MetadataChips eliminado:** PHP endpoint POST /samples/{id}/imagen, subirImagenSample TS, preview 80x80 en modal, SelectorBase->SelectorMenu.

D9. ✅ [AG-SPD] **Skeleton loading system:** 6 componentes base (Skeleton, SkeletonFeed, SkeletonPerfil, SkeletonTarjetaSample, SkeletonTarjetaColeccion, SkeletonTarjetaPublicacion) + 16 islands migradas. CSS con animación pulso. Fix preexistente ModalFiltros variante.

---

## Pendientes sueltos

359. Componente centralizado estados vacios/carga (coherencia visual).
360. Al eliminar sample propio, restar credito.
361. ✅ **[POST-C9] Migración BD completada** — CHECK constraint actualizado a loop|oneshot + schema.ts regenerado.

---

## Auditoría de sistema de subidas — Plan (C367)

> Origen: Sprint Bugs Sync Desktop

- [ ] **367a** Cancelación por mala conexión: Verificar que reintentos (MAX_REINTENTOS=3, backoff exponencial) cubren desconexión mid-upload. Añadir timeout al fetch POST (AbortController con 120s) + test manual desconectando wifi.
- [ ] **367b** Integridad al mover archivos: Verificar hash pre/post `moverArchivoASinColeccion` para detectar corrupción durante rename. Si hash difiere, revertir.
- [ ] **367c** Pipeline IA resilience: Auditar `ProcesadorColaIA` — qué pasa si Groq está caído 24h, si el sample se borra entre encolado y procesamiento, si la respuesta IA es malformada.
- [ ] **367d** Upload queue edge cases: Qué pasa con archivos >100MB (timeout?), archivos de 0 bytes (debería rechazar), archivos corruptos (header WAV inválido), nombres con emojis/unicode especial.
- [ ] **367e** Server-side dedup: Considerar endpoint `POST /samples/check-duplicate` (hash parcial) consultado antes del upload. Alternativa: backend retorna `already_exists` con `sample_id` existente si hash coincide. TO-DO para implementar.
- [ ] **367f** Constraint UNIQUE: Agregar `UNIQUE (usuario_id, LOWER(nombre))` a tabla colecciones para dedup atómico (actual: check-then-insert con race window mínima).
