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

## Sprint E — Fixes + Landing (completado)

E10. ✅ [AG-LND] FilaColecciones hover card: nombre dentro de la portada y autor (avatar + nombre) visible solo en hover.

E9. ✅ [AG-LND] Branding home público deslogueado: Junicode para título, Bricolage para subtítulos, subtítulos a 16px en rem, ancho 1280px, header integrado sin fondo fijo y buscador redondeado.

E1. ✅ [AG-SPE] Landing page rediseñada con hero+buscador, 9 feature blocks grid, tabla comparativa.
E2. ✅ [AG-SPE] 6 log fixes (NormalizadorSample, AdminRepo, ReportesRepo, ServicioIA, ReproduccionesRepo, BD migration).
E3. ✅ [AG-SPE] Logo a Sidebar + favicon override wp_head.
E4. ✅ [AG-SPE] editarImagenPortada full-width + drop zone.
E5. ✅ [AG-SPE] selectorMenu z-index --zMenuPortal:1100.
E6. ✅ [AG-SPE] feedTagsLista solo tags IA (metadata JSONB).
E6b. ✅ [AG-SPE] skeleton.css --colorBorde→--bordeSutil.
E7. ✅ [AG-SPE] Sync mostrar_en_comunidad=false + filtro carpetas OS.
E7b. ✅ [AG-SPE] Sentinel lineCounter.ts detecta servicios TS.
E8. ✅ [AG-SPE] Sentinel exclusiones expandidas.

---

## Glory Sentinel v3 — Nuevas detecciones + Eliminación IA

> **Plan completo:** `.agent/code-sentinel/PLAN_V3_DETECCIONES_Y_DEPRECACION_IA.md`
> **Origen:** Auditoría plan-sync-mejoras-v2.md reveló 22 hallazgos que Sentinel no detectó.

- [x] **S7** ✅ [AG-SEN] Eliminación completa IA: borrado aiAnalyzer.ts + prompts.ts + .gemini/, limpiados types/extension/provider/debounce/cache/ruleLoader/ruleCategories/package.json. ~600 LOC eliminadas.
- [x] **S8** ✅ [AG-SEN] 8 reglas PHP nuevas implementadas y registradas: toctou-select-insert, lock-sin-finally, catch-critico-solo-log, mime-type-cliente, cadena-isset-update, query-doble-verificacion, json-sin-limite-bd, retorno-ignorado-repo.
- [x] **S9** ✅ [AG-SEN] 5 reglas TS nuevas + 3 enhancements + fix falsos positivos desktop. listen-sin-cleanup, status-http-generico, handler-sin-trycatch, cola-sin-limite, objeto-mutable-exportado. Mejoras: json-decode-inseguro (detecta ?:/??), return-void-critico (sin hint + return check), limite-lineas (desktop/ habilitado).
- [x] **S10** ✅ [AG-SEN] Tests: 205 passing (0 failing). sprint89Rules.test.ts cubre todas las reglas nuevas (2+ tests por regla).
- [x] **S11** ✅ [AG-SEN] Regla `undefined-class-constant`: phpConstantIndexer.ts indexa todas las clases PHP del workspace + herencia. gloryConstantRules.ts resuelve self::/static::/parent::/ClassName:: via use statements. 221 tests passing. Detecta constantes como `CARPETA_DEFAULT` sin necesidad de abrir el archivo.
- [x] **S12** ✅ [AG-SEN] Fix falsos positivos reporte (43→~10 violaciones reales): VENTANA_WHITELIST 40→60 (interval-sin-whitelist), JSONB precede2 fix (hardcoded-sql-column), enum const declarations skip, promise-sin-catch window 6→20, type="file" input exclusion, query-doble-verificacion alias PHP var detection, retorno-ignorado-repo excluye Glory framework. FQN inline + json_decode recovery + sentinel-disable-next-line objetos/keys. 221 tests passing, VSIX 450.26KB.

---

## Pendientes sueltos

358b. ✅ [AG-THM] Historial sync panel refleja la imagen actual del sample tras generacion pipeline o edicion manual. Reconciliacion de `imagenUrl` extendida a entradas ya persistidas + merge cross-window del historial + invalidacion controlada del `src` en `sincPanelHistorialThumb`.

359. Componente centralizado estados vacios/carga (coherencia visual).
360. Al eliminar sample propio, restar credito.
361. ✅ **[POST-C9] Migración BD completada** — CHECK constraint actualizado a loop|oneshot + schema.ts regenerado.

---

## Sprint F — Fixes UX + Sync + UI

> ✅ Completado — AG-FIX

F1. ✅ [AG-FIX] Fix detección duplicados cross-carpeta: hashARutas 1:N Map + verificación de paths activos en tracking.
F2. ✅ [AG-FIX] Ocultar ruta subida: contenido vacío + origen_subida en metadata JSONB.
F3. ✅ [AG-FIX] Modal editar sample: imagen clickeable, X en esquina con overlay, imagen colors no borrable.
F4. ✅ [AG-FIX] Quitar icono sincPanelHistorialNavegar innecesario.
F5. ✅ [AG-FIX] Sync thumbnail: ya implementado (compara URLs, rehidrata en cada ciclo).
F6. ✅ [AG-FIX] Menú contextual: eliminado display:contents, usar e.currentTarget.getBoundingClientRect().
F7. ✅ [AG-FIX] Eliminada página explorador del nav sidebar + import FolderOpen.
F8. ✅ [AG-FIX] Rename carpeta → colección: ya implementado (evento nativo + patrón delete+create con grace period).
F9. ✅ [AG-FIX] Botón comentar: eliminado setComentado(true) prematuro, usa evento EVENTO_SAMPLE_COMENTADO.
F10. ✅ [AG-FIX] Similares optimizado: WP transient cache 15min + endpoint dedicado obtenerSimilares con scoring.
F11. ✅ [AG-FIX] Skeleton: layout con sidebar/topbar durante cargandoAuth + SkeletonColeccionDetalle nuevo.
F12. ✅ [AG-FIX] Coleccionados: creador ve sus samples sin importar estado (pendiente/activo).
F13. ✅ [AG-FIX] Borrado optimista publicaciones con rollback en error.
F14. ✅ [AG-FIX] Iconos desktop regenerados desde favicon.svg (todas resoluciones + plataformas).
F15. ✅ [AG-FIX] Modal config: CampoTexto variante="desnudo" elimina clases base conflictivas.

### Lecciones Sprint F
- [Sync]: hashARutas debe ser 1:N (Set) para detectar duplicados cross-carpeta. 1:1 Map pierde paths cuando el original se mueve.
- [Upload]: Nunca usar `descripcion` para datos internos de tracking. Campos de metadata JSONB son el lugar correcto.
- [CSS]: display:contents rompe getBoundingClientRect() (retorna zeros). Evitar en elementos que necesiten positioning.
- [Auth]: Durante cargandoAuth, mostrar layout completo (sidebar+topbar) con skeleton en contenido. No mostrar layout público.
- [BD]: Queries de "mis items" deben distinguir owner vs otros. Owner ve sus items en cualquier estado.
- [CampoTexto]: Variante 'desnudo' (sin clases base) es necesaria cuando un contexto override tiene estilos propios completos.

---

## Auditoría de sistema de subidas — Plan (C367)

> Origen: Sprint Bugs Sync Desktop

- [ ] **367a** Cancelación por mala conexión: Verificar que reintentos (MAX_REINTENTOS=3, backoff exponencial) cubren desconexión mid-upload. Añadir timeout al fetch POST (AbortController con 120s) + test manual desconectando wifi.
- [ ] **367b** Integridad al mover archivos: Verificar hash pre/post `moverArchivoASinColeccion` para detectar corrupción durante rename. Si hash difiere, revertir.
- [ ] **367c** Pipeline IA resilience: Auditar `ProcesadorColaIA` — qué pasa si Groq está caído 24h, si el sample se borra entre encolado y procesamiento, si la respuesta IA es malformada.
- [ ] **367d** Upload queue edge cases: Qué pasa con archivos >100MB (timeout?), archivos de 0 bytes (debería rechazar), archivos corruptos (header WAV inválido), nombres con emojis/unicode especial.
- [ ] **367e** Server-side dedup: Considerar endpoint `POST /samples/check-duplicate` (hash parcial) consultado antes del upload. Alternativa: backend retorna `already_exists` con `sample_id` existente si hash coincide. TO-DO para implementar.
- [ ] **367f** Constraint UNIQUE: Agregar `UNIQUE (usuario_id, LOWER(nombre))` a tabla colecciones para dedup atómico (actual: check-then-insert con race window mínima).

---

## Sprint G — Testing Batch Bugfixes (commit 6bed9ab9)

> ✅ Completado — AG-FIX

Q1. ✅ [AG-FIX] Excluir carpeta 'duplicados' de sync watcher (fileWatcherService + syncWatcherSetup).
Q2. ✅ [AG-FIX] Detección colecciones huérfanas en rename carpetas: buscarColeccionHuerfana() + fallback en onCarpetaNueva y rename.
Q3. ✅ [AG-FIX] Auto-posts: tipo=TIPO_SAMPLE + moderacion_estado=APROBADO. crearPublicacion() extendida con params opcionales.
Q4. ✅ No problema — desktop reutiliza exactamente el mismo IMAGENES_COLOR array que server.
Q5. ✅ [AG-FIX] Selector colección: botón X absoluto para evitar reflow del buscador.
Q6. ✅ [AG-FIX] Audio cleanup en cambio de sample: deps [sample.rutaPreview] en useEffect.
Q7. ✅ [AG-FIX] Stats Cola IA: interfaz TS alineada con backend (completados_hoy, en_reintento, errores, encolados_hoy).
Q8. ✅ Sin errores — Mezclador type-check limpio.
Q9. ✅ [AG-FIX] Cuota Groq: captura x-ratelimit-* headers en GroqHttpClient + endpoint + UI CuotaGroqResumen.
Q10. ✅ [AG-FIX] CSS Cola IA: flex:1 en filtros, flex-shrink:0 en botones. NaN resuelto con Q7.
Q11. ✅ [AG-FIX] Rechazo masivo moderación: rechazarTodosPendientes() repo + endpoint + API + UI botón.
Q12. ✅ [AG-FIX] Auth modal cierra tras login/registro: useAuthModalStore.getState().cerrar().
Q13. ✅ [AG-FIX] Feed diversidad: _score_base (sin social) para ROW_NUMBER, _score (con social) para ORDER BY. max_por_autor 3→5.
Q14/Q15. ✅ [AG-FIX] ComentariosEnums: MODERACION_RECHAZADO → MODERACION_ESTADO_RECHAZADO (2 refs).
Q16. ✅ [AG-FIX] Groq vision: añadido -instruct suffix a llama-4-maverick + scout.
Q17. ✅ Ya implementado — TarjetaPublicacion muestra BadgeModeracion si esAutor|esAdmin.

### Bugfixes post Sprint G

C270. ✅ [AG-FIX] Parser error ComentariosRepository: formatter movió AND-filters a col 0 + `)` extra cerraba consultar() prematuramente. Fix: restaurar indentación + eliminar `)` duplicado.
C271. ✅ [AG-FIX] rechazarTodosPendientes: BaseRepository::ejecutar() devuelve int, NO PDOStatement. Eliminado `$stmt` intermedio + `->rowCount()`. También eliminados strings 'publicacion' hardcodeados en eliminarConCascada/recalcularComentarios → ComentariosEnums::TIPO_PUBLICACION / LikesEnums::TIPO_PUBLICACION.
C272. ✅ [AG-FIX] Enum constants MODERACION_ESTADO_*: PublicacionesEscrituraController usaba MODERACION_APROBADO sin prefijo ESTADO_. Corregidas 4 referencias en crear() y actualizar().
C273. ✅ [AG-FIX] Scroll infinito comunidad: useComunidadIsland no paginaba jamás (siempre page 1 sin IntersectionObserver). Implementado: sentinelRef + observer rootMargin 300px + paginaRef para evitar stale closure. ComunidadIsland añade div sentinel + SkeletonLoader cuando cargandoMas.

### Lecciones Sprint G
- [Cola IA]: Backend retorna snake_case (completados_hoy, en_reintento). Frontend TS debe coincidir exactamente. NaN silencioso por undefined + operador aritmético.
- [Groq]: Modelos vision Llama 4 requieren sufijo `-instruct`. Guard model (llama-guard-4-12b) NO lo requiere.
- [Sync]: Carpetas de sistema (papelera, duplicados) deben excluirse en AMBOS sets: CARPETAS_EXCLUIDAS_TOTAL y CARPETAS_SISTEMA_SYNC.
- [Auth]: authStore (datos usuario) y authModalStore (UI modal) son stores separados. Cerrar modal requiere acceder al store correcto.
- [Feed]: Para diversidad justa, el scoring de ROW_NUMBER (cap por autor) no debe incluir señales personalizadas (social boost). Solo métricas objetivas (frescura + engagement).
- [CSS]: Botones condicionales (X para limpiar) causan reflow. Usar position:absolute para elementos toggle.

### Bugfixes post Sprint G (cont.)

C274. ✅ [AG-FIX] Eliminar colección FK violation: eliminarDelUsuario() hacía DELETE FROM colecciones sin limpiar coleccion_samples. Cascada manual: verificar propiedad → DELETE coleccion_samples → DELETE colecciones.

C275. ✅ [AG-SYN] Sync rename broken + ColeccionDetalle crash:
- **buscarColeccionHuerfana import roto:** `import('./desktopService')` → `import('./syncService')` en syncCollectionService.ts. obtenerConfigSync solo existe en syncService.ts. Sin este fix, toda la cadena rename-via-orphan fallaba → creaba colección nueva en vez de renombrar.
- **ColeccionDetalleIsland .length crash:** useModalColeccion.ts pasaba `resp.data` (={ok:true}) del PUT a `manejarGuardarEdicion` → `setColeccion({ok:true})` → `coleccion.samples` undefined → crash. Fix: construir objeto fusionado desde colección existente + campos editados del formulario, preservando samples/tags/likes.

C276. ✅ [AG-SYN] Auth sync 403 — solución arquitectónica multi-capa:
- **Causa raíz:** El header `Authorization` puede no llegar a PHP-FPM en ciertos entornos nginx (Local by Flywheel). `$_SERVER['HTTP_AUTHORIZATION']` vacío + `getallheaders()` lee de `$_SERVER` → ambos fallan.
- **Capa 1 — PHP:** `AuthMiddleware::obtenerBearerToken()` ahora busca en 4 fuentes: `HTTP_AUTHORIZATION`, `REDIRECT_HTTP_AUTHORIZATION`, `HTTP_X_KAMPLES_AUTH` (custom header), `getallheaders()` con normalización case-insensitive.
- **Capa 2 — Desktop interceptor:** `apiDesktopAdapter` envía DOBLE header: `Authorization` + `X-Kamples-Auth`. nginx no filtra headers custom.
- **Capa 3 — Sync headers explícitos:** Nuevo sistema `obtenerHeadersSync()`/`obtenerHeadersSyncGet()` en `syncGuards.ts` con token dedicado (`establecerTokenSync`). Todos los sync fetch calls (8 total en syncCollectionService + syncService) usan headers explícitos con JWT por doble vía, independiente del interceptor global.
- **Capa 4 — Diagnósticos:** `extraerErrorRespuesta()` para logging de response body en errores (antes solo se logueaba status code).

### Lecciones C274-C276
- [Sync]: imports dinámicos (`await import('./x')`) no dan error de tipo en build — solo fallan en runtime. Verificar siempre que el export existe en el módulo target.
- [API PUT]: Si el backend retorna solo `{ok:true}` sin el recurso completo, el frontend debe fusionar campos conocidos con el estado existente, no reemplazar el objeto entero. Alternativa: hacer que el PUT retorne el recurso actualizado (REST convencional).
- [FK Cascade]: WordPress no soporta FK constraints nativos. Toda tabla con referencias cruzadas requiere cascada manual en DELETE (limpiar hijos antes que padre).
- [Auth nginx]: nginx + PHP-FPM puede no pasar `$_SERVER['HTTP_AUTHORIZATION']` (depende de `fastcgi_params` config). Headers custom (`X-Kamples-Auth`) SÍ se pasan siempre. Doble vía = auth robusta cross-entorno.
- [Sync fetch]: NUNCA depender solo del interceptor global de `window.fetch` para auth en servicios críticos. Headers explícitos + token dedicado (setter pattern en módulo sin dependencias) evita problemas de init order y context isolation (MPA windows).

C277. ✅ [AG-SYN] Plan de mejoras sync — arquitectura de confianza:
- Auditoría completa de 10 archivos sync (~7200 LOC): syncService, syncCollectionService, syncTrackingService, syncWatcherSetup, fileWatcherService, uploadQueueService, offlineQueueService, papeleraService, syncGuards, syncState.
- Investigación de patrones: Google Drive (change tokens/delta), Dropbox (WAL/journal/content-addressed), OneDrive (eTag/delta query), Unison (reconciliación 3-way), rsync (verificación pre-transfer), Circuit Breaker (Nygard).
- Plan creado en `App/docs/plan-sync-mejoras.md` con 6 fases priorizadas:
  - F1: Persistencia confiable (WAL + backup rotativo) — PRIORIDAD MÁXIMA
  - F2: Delta sync (cursor + adaptive polling) — ALTA
  - F3: Integridad (content hashing + reconciliación + verificación post-descarga) — MEDIA
  - F4: Errores inteligentes (taxonomía + backoff + circuit breaker) — MEDIA
  - F5: Operaciones atómicas (transacciones con rollback + versioning) — MEDIA-BAJA
  - F6: Observabilidad (logger estructurado + panel diagnóstico) — BAJA
- 10 archivos nuevos planificados, 12 existentes a modificar.

C278. ✅ [AG-SYN] Implementación plan sync mejoras — Fases F1-F6 (parcial):
- **F1 — WAL/Persistencia confiable:**
  - syncJournal.ts: checkpoint file renombrado (evita conflicto Tauri Store), soloRegistrar param, callback checkpoint.
  - syncTrackingService.ts: journal integrado — aplicadorRecuperacion (10 tipos de operación), registrarEnJournal (append-only sin re-aplicar), escribirEnStore (extraído de persistir), inicializarTracking con recuperación journal + fallback Store, 11 CRUD methods migrados de persistir() a journal append, 5 admin methods mantienen persistir() directo (reset, limpiar, migración, finalizarLote).
  - Backup rotativo: 3 copias rotan antes de cada checkpoint, intentarBackups() en recuperación.
- **F2 — Delta sync E2E:**
  - Backend: SyncChangelogSchema.php + SyncChangelogCols.php + SyncChangelogEnums.php. SyncChangelogRepository.php (registrar, obtenerDelta, purgar). v024_sync_changelog.sql (tabla + índices). SyncController.php endpoint GET /me/sync/delta.
  - Triggers: ColeccionesCrudController (5 ops) + DescargasController (first download).
  - Frontend: consultarDeltaSync() en syncWatcherSetup, cursor persistence via Tauri Store, polling optimizado (skip full sync si no hay cambios).
  - Adaptive polling: POLLING_MIN_MS=15s, MAX=5min, recursive setTimeout.
- **F3 — Integridad:** verificarTamano post-descarga, ejecutarReconciliacion periódica (7 días).
- **F4 — Errores:** errorSync.ts (taxonomía 6 categorías), backoff exponencial en offlineQueue/uploadQueue, circuitBreaker.ts integrado.
- **F5 — Atómico:** TransaccionSync en rename colección (rollback automático).
- **F6 — Observabilidad:** syncLogger.ts (logger estructurado con rotación), logSync integrado en 9 files incluido fileWatcherService (24 console calls migrados).
- ✅ **F5.2:** Versioning implementado — campo `version` en colecciones (v025 migration), optimistic locking en `actualizarCampos()`, 409 Conflict response, version sync bidireccional en desktop.
- ✅ **F6.2:** Panel diagnóstico UI — `useDiagnosticoSync` hook + `DiagnosticoSync.tsx` component (4 secciones: estado general, circuit breaker, cola offline, logs) integrado en VentanaSincPanel.

C279. ✅ [AG-SYN] F5.2 + F6.2 + Auditoría profunda v2:
- **F5.2 Versioning:** v025_colecciones_version.sql ejecutado, ColeccionesSchema/Cols/Repository/Controller actualizados con optimistic locking, SyncRepository/Controller incluyen `version`, desktop syncTrackingService/syncCollectionService con `version: number` en ColeccionLocal/ColeccionSync + rename con 409 handling + polling version sync.
- **F6.2 Panel diagnóstico:** syncLogger exporta EntradaLog + obtenerUltimasEntradas(), hook useDiagnosticoSync (recopila circuit breaker, cola offline, journal, cursor delta, polling, logs con refresh 3s), DiagnosticoSync.tsx (4 secciones + 4 acciones: reset circuit, retry queue, export logs, refresh), diagnosticoSync.css, integración en VentanaSincPanel menú toggle.
- **Auditoría v2:** Análisis profundo de 8 archivos PHP + 19 archivos TS. Hallazgos: 3 críticos PHP + 2 críticos TS + 8 altos + 6 medios. Plan de ejecución en 5 sesiones. Documento completo en `App/docs/plan-sync-mejoras-v2.md`.

### Lecciones C279
- [Optimistic locking]: Implementar como parámetro opcional ($versionEsperada) permite backward compatibility — callers existentes siguen funcionando sin enviar version.
- [409 Conflict]: Desktop debe enviar la versión que conoce y manejar 409 con log + skip (no retry automático, el usuario decide).
- [Panel diagnóstico]: Refresh con setInterval 3s es razonable — datos de diagnóstico no necesitan ser real-time. Export logs como JSON facilita debugging offline.
- [Auditoría]: v024_sync_changelog.sql ya tenía los índices creados — el subagente de auditoría no leyó la migración y reportó falso positivo. Siempre verificar hallazgos de auditoría contra el código fuente real.

C280. ✅ [AG-SYN] Hardening sync — plan-sync-mejoras-v2 implementado (20 archivos, +1237/-847):
- **PHP (7 archivos):** C1 INSERT atómico posición (ON CONFLICT), C2+A2 advisory lock session-level try/finally, C3 revenue share retorna bool + caller verifica, A1 MIME server-side, A5 obtenerDelta 2→1 query, A6 $limite validado en repo, A7 solo ESTADO_ACTIVO en sync, A8 metadata JSONB 10KB límite, M1 _jsonError flag, M4 5+1 changelog calls verificados, M5 enum validation, M6 documentación purga.
- **TypeScript (13 archivos):** TC1 checkpointVersion + merge cross-window, TC2 hashesPendientesEncola dedup race, TA1 unlisten memory leak, TA2 409 body inspection, TA3 journal checkpoint reorder (callback antes truncación), TA4 rename try-catch, TA5 v1_migracion_completada flag multi-window, TA6 split syncService.ts 834→208 LOC (4 módulos: syncInitService, syncOrchestratorService, syncRegistroService, syncRehidratacionService), TM1 per-sample error boundaries descarga, TM5 MAX_COLA_SIZE=500 FIFO, TB2 circuitBreaker auto-reset 30min TTL, TM2 documentación concurrencia.
- **Diferidos:** A3+A4 service layer PHP (TO-DO en código), TM3 completar migración v1→v2 (~30 refs indiceArchivos), TM4 hash post-descarga (requiere endpoint backend).

### Lecciones C280
- [Advisory Locks]: pg_advisory_xact_lock no sirve con PDO autocommit — cada query es su propia transacción, lock se libera al terminar. Usar pg_advisory_lock (session-level) + pg_advisory_unlock explícito en finally.
- [Journal]: Orden de operaciones en checkpoint importa: callback ANTES de truncar journal. Si callback falla, journal permanece intacto para recovery.
- [Race Dedup]: Un Set con hashes "en proceso de encolado" cierra la ventana entre await calcularHash() y cola.push(). Marcar sincrónicamente post-await, limpiar en finally.
- [Cross-Window]: checkpointVersion monotónico + merge antes de write es el patrón correcto para Store compartido.
- [Split Facade]: Mantener syncService.ts como re-export facade permite split sin cambiar ningún importador. Dependencias circulares se rompen con logic inline o dynamic import.

C281. ✅ [AG-SYN] Fix 500 sync/colecciones + Tauri journal permissions:
- **Causa raíz 500:** `SamplesEnums::TODOS_ESTADOS` no existía — el schema generator no emitía constantes agregadas `TODOS_*`. Fix: actualizar `generarEnums()` en `schemaGenerate.mjs` para emitir `TODOS_{columna}` arrays (self-referencing). Regenerados 11 Enums.
- **Causa raíz journal:** `writeTextFile`/`readTextFile` requieren `fs:allow-write-text-file`/`fs:allow-read-text-file` en Tauri 2.0 (separados de `fs:allow-write-file`/`fs:allow-read-file` que son para binarios). También añadido `fs:scope-appdata-recursive`.
- **Ref fix:** `TODOS_ESTADOS` → `TODOS_ESTADO` (el generador usa nombre de columna singular).

### Lecciones C281
- [Schema Generator]: `writeFile` vs `writeTextFile` son permisos separados en Tauri 2.0. Si usas `writeTextFile` (texto), necesitas `fs:allow-write-text-file`, no `fs:allow-write-file` (binario).
- [Schema Generator]: Al añadir constantes de validación que referencian enums auto-generados, verificar que la constante existe en el archivo generado. Si no, extender el generador — no hardcodear el valor.
- [Naming]: El generador usa el nombre de columna (`estado`) para el prefijo, produciendo `TODOS_ESTADO` (singular). Convención a recordar.

C282. ✅ [AG-FIX] Fix PHP runtime errors + enum constants + schema regen (28 archivos, +129/-62):
- Fix errores runtime PHP en repositories y controllers.
- Constantes enum corregidas y regeneradas con schema generator.

C283. ✅ [AG-FIX] Sprint Seguridad 1 — plan-sync-mejoras-v3:
- SEC-C1: INTERVAL parametrizado con whitelist en repositorio.
- SEC-C2: Fallback secret eliminado en environment.php.
- SEC-A3: Filtro extensión client-side en uploadQueueService (validación pre-upload).
- SEC-M2: Rate limit sync read endpoints.
- SEC-M4: shell:allow-open restrictivo en Tauri capabilities.

C284. ✅ [AG-FIX] CLI php:check — `npx glory php:check`:
- Comando CLI que valida sintaxis de todos los archivos PHP del proyecto (268 archivos).
- Fix BOM en ManejadorGit.php.

C285. ✅ [AG-FIX] Fix file lock os error 32 + 403 collection ownership cleanup:
- uploadQueueService: `esperarArchivoDisponible()` con backoff exponencial (300ms base, 5 intentos) — espera que el SO libere el archivo antes de leer.
- syncCollectionService: manejo 403 en renombrar y agregarSample — elimina colección del tracking local cuando no pertenece al usuario.
- syncWatcherSetup: tras fallo rename por 403, crea colección nueva en lugar de actualizar entrada fantasma.
- Fix `logSync.warning` → `logSync.warn` (typo de sesión anterior en SEC-A3).

C286. ✅ [AG-FIX] Tracking scoped por usuario — solución arquitectónica contaminación cross-usuario:
- **Causa raíz:** El tracking local (Tauri Store) no tenía noción de qué usuario era dueño de los datos. Al cambiar de sesión/cuenta, colecciones del usuario anterior permanecían → `crearColeccionDesdeLocal()` las encontraba y devolvía su ID ajeno → 403 en cascada.
- **BaseSyncLocal.userId:** Nuevo campo que identifica al dueño del tracking.
- **inicializarTracking(userIdActual):** Recibe userId del auth. Si el tracking pertenece a otro usuario, limpia TODO automáticamente.
- **cerrarSesionDesktop:** Ahora llama `resetearTracking()` para limpiar datos al logout.
- **Retrocompatible:** Tracking sin userId (pre-C286) se adopta como del usuario actual.

C287. ✅ [AG-FIX] 3 bugs post-C286 — TC1 merge, carpeta repetida, subcarpeta rename:
- **Bug 1 — TC1 merge re-importa datos contaminados:** Tras el cleanup por userId, `versionLocalConocida` quedaba en 0 mientras Store tenía versión N. El primer `escribirEnStore()` detectaba Store(N)>local(0) → TC1 merge re-importaba TODAS las colecciones del usuario anterior. **Fix:** (a) Persistir estado limpio al Store inmediatamente después del cleanup + actualizar `versionLocalConocida`. (b) Guard de userId en TC1 merge: si `almacenado.userId !== datos.userId`, omitir merge de colecciones/archivos/sinColeccion.
- **Bug 2 — Callback "carpeta nueva" se dispara repetidamente:** Cada evento dentro de una carpeta (crear archivo, subcarpeta) re-disparaba el callback de `onCarpetaNueva`. `buscarColeccionHuerfana` encontraba colecciones ajenas → 403 → desvincula → siguiente evento encuentra otra → loop. **Fix:** Verificar `buscarColeccionPorCarpeta(nombre)` ANTES de buscar huérfanas. Si ya existe en tracking, omitir.
- **Bug 3 — Rename subcarpeta no detectado:** En Windows, notify-rs puede emitir rename como 2 eventos separados (`RenameMode::From` + `RenameMode::To`) con 1 path cada uno. Tauri descarta el RenameMode en la serialización. El handler de rename solo procesaba eventos con 2+ paths. Eventos con 1 path caían al for loop donde `esEventoCreacion`/`esEventoEliminacion` no detectan `modify.kind='name'` → se ignoraban silenciosamente. **Fix:** Buffer de rename no pareados (`manejarRenameNoPareado`): buferea primer path, si llega segundo lo parea y re-despacha como rename con 2 paths. Si timeout sin par, despacha como DELETE sintético para el patrón delete+create existente.

C288. ✅ [AG-FIX] Fix TC1 journal recovery + reconciliación periódica de carpetas:
- **Bug 1 — TC1 merge tras journal recovery:** El journal recovery cargaba datos correctamente pero NO sincronizaba `versionLocalConocida` con el Store. Resultado: `versionLocalConocida=0` vs Store version N → TC1 merge siempre se disparaba tras recovery, re-importando datos posiblemente contaminados. Además, si el journal no tenía `userId` (pre-C286), el ownership check no podía limpiar datos ajenos. **Fix:** Tras journal recovery, leer Store para sincronizar `versionLocalConocida` y adoptar `userId` del Store si falta en journal.
- **Bug 2 — Renames de carpetas y subcarpetas no detectados en Windows+OneDrive:** El debounced watcher de Tauri (notify-rs con `delayMs: 1500`) NO emite rename events fiables en Windows con OneDrive. El cloud filter driver (`cldflt.sys`) absorbe los rename → el watcher no ve NINGÚN evento → nombre local diverge del servidor silenciosamente. **Fix:** Reconciliación periódica de estructura de carpetas (`reconciliarEstructuraCarpetas`, cada 15s): escanea directorios en disco, compara con tracking, detecta carpetas "desaparecidas" (en tracking pero no en disco) + "nuevas" (en disco pero no en tracking) → las parea como renames. Funciona para nivel 1 (colecciones) y nivel 2 (subcarpetas).

### Lecciones C282-C288
- [File Lock]: Windows mantiene lock exclusivo durante copy/write. El file watcher emite CREATE inmediatamente. Esperar con backoff corto (300ms-5s) es más eficiente que desperdiciar un retry completo de la cola (2s+ backoff).
- [403 Ownership]: Colecciones en tracking local que no pertenecen al usuario actual generan 403 en loop. Solución: delink inmediato del tracking + crear nueva colección si necesario.
- [Logger TS vs PHP]: TypeScript syncLogger usa `warn`, PHP KamplesLogger usa `warning`. No confundir.
- [Schema]: npx glory php:check es útil para validar antes de commit masivo PHP.
- [Tracking Scoping]: El tracking de sync DEBE estar scoped por userId. Sin esto, cambiar de cuenta contamina el tracking con colecciones ajenas → 403 en cascada. La solución es almacenar userId en BaseSyncLocal y verificar en inicialización. También limpiar tracking en logout.
- [Contaminación cross-usuario]: `crearColeccionDesdeLocal()` confiaba en el tracking local para decidir "ya existe". Si el tracking tenía colecciones de otro usuario, devolvía su ID ajeno sin verificar con el servidor. El userId scoping previene esto limpiando datos ajenos al inicializar.
- [TC1 Merge]: Limpiar datos in-memory NO es suficiente si el Store persiste datos viejos. Hay que escribir al Store inmediatamente tras cleanup Y actualizar `versionLocalConocida` para que TC1 merge no re-importe lo borrado. Regla: toda limpieza de datos DEBE incluir persistencia inmediata.
- [Carpeta nueva repetida]: Los modify events del interior de una carpeta pueden re-disparar `onCarpetaNueva` para la carpeta padre. Siempre verificar tracking ANTES de buscar huérfanas o crear nuevas.
- [Rename unpaired]: En Windows con notify-rs, rename events de subcarpetas pueden llegar como 2 eventos separados (From+To) con 1 path cada uno. Tauri descarta RenameMode en la serialización a JS. El handler de rename DEBE contemplar ambos formatos (pareado con 2 paths Y separado con 1 path + buffer).
- [Journal recovery + TC1]: El journal NO persiste `versionLocalConocida`. Tras recovery, SIEMPRE leer la versión del Store para evitar que TC1 merge se dispare por versión desincronizada. También adoptar `userId` del Store si el journal no lo tiene.
- [Watcher + OneDrive]: El debounced watcher de Tauri/notify-rs NO emite rename events para carpetas en Windows con OneDrive (cloud filter driver absorbe eventos). La ÚNICA solución fiable es reconciliación periódica: escanear disco cada N segundos y comparar con tracking para detectar renames. No se puede confiar en eventos del watcher para renames de carpetas.

### Lecciones C278
- [WAL]: El journal NO reemplaza el Tauri Store — lo complementa. Store necesario para acceso cross-window (MPA). Journal = crash recovery. Checkpoint escribe a ambos.
- [WAL]: Para evitar doble aplicación (mutación directa + aplicador), appendOperacion acepta soloRegistrar=true que solo escribe al archivo sin re-aplicar en memoria.
- [WAL]: El checkpoint file (sync-checkpoint.json) DEBE diferir del STORE_FILE (sync-config.json). Son formatos distintos: Tauri Store maneja múltiples keys internamente, el checkpoint es {meta, estado}.
- [Delta]: cursor=0 o cursor purgado → fullSyncRequired=true. El cliente hace full sync normal y recibe el cursor actual.
- [Delta]: Los changelog triggers van en los controllers (punto de escritura), no en los repositories (podrían llamarse desde contextos sin usuario).
- [fileWatcher]: Template literals (`${}`) son más legibles que console.info con args separados por coma para logSync.

C289. ✅ [AG-FIX] 5 bugs sync — colecciones fantasma, paths tras rename, server→local download, caché, rate limit:
- **Bug 1 — Colecciones fantasma:** `sincronizarColecciones` purgaba samples pero NUNCA colecciones. Colecciones borradas del servidor persisten en tracking → 403 cascada. Fix: purga comparando tracking vs servidor.
- **Bug 2 — Re-upload + duplicados tras rename:** `actualizarNombreColeccion` no actualizaba `rutaLocal` de archivos. Tras rename, watcher los veía como nuevos → re-upload → duplicados. Fix: actualizar rutaLocal + indiceRuta de archivos de la colección + subcollecciones.
- **Bug 3 — Server→local no descarga:** Polling usaba `soloEstructura=true` siempre. Fix: cambiar a `false` cuando delta detecta cambios.
- **Bug 4 — Cache colecciones:** obtenerColeccionesDelServidor sin caché → 429. Fix: caché TTL 10s + invalidación tras create/rename.
- **Bug 5 — Rate limit PHP:** sync_colecciones 60→120/min, sync_delta 120→200/min.

### Lecciones C289
- [Tracking]: Purgar colecciones es tan importante como purgar samples. Sin purga, tracking acumula fantasmas indefinidamente.
- [Rename paths]: Al renombrar colección, TODOS los archivos dentro necesitan actualización de rutaLocal + reindexado. Sin esto, watcher los trata como nuevos.
- [Polling]: soloEstructura=true impedía server→local para samples. Polling DEBE hacer sync completo cuando delta detecta cambios.
- [Cache]: Sin caché, obtenerColeccionesDelServidor se llama 3-4 veces por ciclo. Cache TTL 10s reduce calls drásticamente.
- [Regex path]: Para reemplazar segmento de carpeta en paths, `([/\\])FOLDER([/\\])` es seguro (requiere separadores a ambos lados, evita matches parciales como as1 en as11).
