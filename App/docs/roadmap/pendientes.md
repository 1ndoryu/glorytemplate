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
361. ✅ [AG-FIX] Fix llamada a método indefinido `buscarPorTexto` a `buscarTexto` en ContribucionesController. La búsqueda fallaba porque el método renombrado en `CancionesRepository` no se había actualizado en el controlador.

362. ✅ [AG-UI] Mover tarjetaCancionFeedSampleos al lado del botón de like y quitar padding de botones en canciones.

### C800-C801 — Verificacion y correccion samples extraidos [AG-COR]

800. ✅ [AG-COR] Sistema de correccion de metadata IA en samples extraidos: boton "Corregir IA" en menu contextual (admin) → modal con instrucciones → ServicioIA::corregirMetadata() → endpoint POST /samples/{id}/corregir-ia actualiza titulo, slug, tags, metadata JSONB. Archivos: corregirIAStore, useCorregirIA, ModalCorregirIA, modalCorregirIA.css, apiSamples (corregirMetadataIA), SamplesModificacionController, ServicioIA.
801. ✅ [AG-COR] Enlace "Ver en YouTube" en menu contextual de samples extraidos — usa youtube_id de metadata. PublicadorExtraccion almacena youtube_id, useMenuContextualSample muestra opcion condicionalmente.

**Nota C800:** Se elimino tablaRelacionesColAcciones (columna de acciones en tabla de relaciones de canciones) — la correccion va en el menu contextual del sample, no en la tabla de canciones. Limpiados: TablaRelaciones.tsx, TarjetaRelacionSample.tsx, CancionDetalleIsland.tsx, tablaRelaciones.css.

### C802 — Legal Shield + Community Contributions ✅ [AG-SEC]

> Completado: migracion v033, seed users (SeedUsuarios + SeedConfig + DevController endpoints), ContribucionesService + ContribucionesController, ReporteLegalController (POST /reportar-legal sin auth + GET /admin/reportes/legales), frontend completo (BuscadorCanciones, ModalContribucion, BotonReporteLegal, ModalReporteLegal, useContribucion, useReporteLegal, apiContribuciones, apiReporteLegal), TarjetaRelacionSample con contrib display, fix descripciones auto-generadas, endpoint retroactivo sincronizar-descripciones.

**Pendiente C802 (siguiente iteracion):**
- [x] **C802a** Panel admin moderar contribuciones (island admin — TabContribuciones) ✅ [AG-SDC] (= C807)
- [ ] **C802b** Integrar BuscadorCanciones en modal publicacion/edicion sample (L5.5)
- [x] **C802c** Menus contextuales 3-puntos para adjuncion de samples (L5.6) [AG-ADJ] — CancionDetalleIsland (menu: "Subir sample de esta cancion") + RelacionDetalleIsland (menu: "Adjuntar sample manual"). L7.1: selector de lado ahora DENTRO del modal (ModalCrear muestra SelectorLado cuando relacionId presente pero sin ladoRelacion). crearModalStore con ContextoAdjuntar + LadoOpcion + seleccionarLado(), useMenuRelacionDetalle hook extraido.
- [x] **C802d** Edicion de contribuciones pendientes por el propio usuario (L6.1) [AG-L6C]
- [ ] **C802e** Pagina estatica /politica-dmca (L4)

### C802-L6 — CRUD Completo + Contribuciones Publicas ✅ [AG-L6C]

> Plan detallado en `App/docs/plan-legal-contribuciones.md` FASE L6.

- [x] **L6.1** CRUD contribuciones propias: PUT/DELETE propias pendientes, migracion v034, schema regenerado, apiContribuciones.ts [AG-L6C]
- [x] **L6.2** Ediciones comunitarias: ModalEdicionRelacion + useEdicionRelacion, botones en TablaRelaciones/TarjetaRelacionSample, wired en CancionDetalleIsland [AG-L6C]
- [x] **L6.3** Eliminacion de samples por autor: soft-delete (marcarEliminado) + admin hard-delete (eliminarConCascada) [AG-L6C]
- [x] **L6.4** Admin CRUD completo: PUT/DELETE /admin/contribuciones/{id} y /admin/relaciones/{id} [AG-L6C]
- [x] **L6.4c** Panel admin moderar contribuciones (componente isla admin, misma tarea que C802a) ✅ [AG-SDC]

### C802-L7 — Adjuncion Manual Completa + Edicion de Media (Gaps identificados)

> Ver analisis completo en `App/docs/plan-legal-contribuciones.md` FASE L7.

- [x] **L7.1** Selector de lado en modal (no en menu contextual) — SelectorLado en ModalCrear.tsx, crearModalStore con LadoOpcion + seleccionarLado(), menu simplificado a 1 item
- [x] **L7.2** Timing de inicio en upload — campo `inicio_segundos` en ContenidoCrear (CampoTexto number), useCrearContenido state+pre-fill+reset, apiSamples FormData append, SamplesUploadController almacena como PG array en timings_fuente/timings_destino de la relacion
- [x] **L7.3** Endpoint `POST /relaciones/{id}/vincular-sample` — CancionesController: valida relacion+sample+ownership+side libre, actualiza sample_*_id + agrega metadata. Frontend: apiRelaciones.vincularSample()
- [x] **L7.4** `ModalVincularSampleExistente.tsx` — modal 2 pasos (selector lado + buscador samples propios), useVincularSample hook (debounced search + confirmar), wired en useMenuRelacionDetalle + RelacionDetalleIsland. CSS: modalVincularSample.css
- [x] **L7.5** Endpoint `DELETE /relaciones/{id}/sample/{lado}` — CancionesController: valida relacion+side+ownership, nullifica sample_*_id + timings_*. Frontend: apiRelaciones.desvincularSample()
- [x] **L7.6** Item "Quitar de este sampleo" en useMenuContextualSample — solo si metadata.adjuncion_manual + relacion_id + puedeEditar. Usa desvincularSample() + toast confirmar + evento sample-actualizado
- [x] **L7.7** ModalEdicionRelacion extendido — campos: youtube_url (CampoTexto), timings fuente/destino (CampoTexto comma-sep), verificada (Checkbox admin-only). Hook useEdicionRelacion con estado+parseo+diff. TablaRelaciones pasa timings+verificada en construirRelacionEditable
- [x] **L7.8** ContribucionesService::aplicarEdicion() — whitelist extendida: timings_fuente/destino (PG int array), verificada (bool). youtube_url como TO-DO moderador (no hay columna directa en relacion)

### C802-L7-UX — Revision UX integral ✅ [AG-ADJ]

- [x] **L7-UX.1** tipo_elemento en upload: SamplesUploadController valida contra RelacionesSampleEnums::TODOS_TIPO_ELEMENTO whitelist, almacena en relacion. Frontend: SelectorMenu en ContenidoCrear (cuando audioAdjunto + enContextoRelacion), apiSamples envia tipo_elemento en FormData ✅
- [x] **L7-UX.2** BuscadorCanciones deseleccionar: onSeleccionar acepta null, boton X (BotonBase ghost) en cancion seleccionada, buscadorCancionInfo + buscadorCancionQuitar CSS. Todos los botones nativos convertidos a BotonBase ✅
- [x] **L7-UX.3** ModalVincularSampleExistente back + mini feed: boton "Cambiar lado" (ArrowLeft) en footer cuando no hay ladoInicial; thumbnails imagen (36x36px) o placeholder icon Music; vincularSampleItemImagen/ImagenVacia CSS ✅
- [x] **L7-UX.4** ModalEdicionRelacion verificada admin-only: Checkbox condicionado a useAuthStore(s => s.usuario?.rol === 'admin') ✅
- [x] **L7-UX.5** Verificar/desverificar desde menu 3-puntos: PUT /relaciones/{id}/verificar (requerirAdmin), apiRelaciones.verificarRelacion(), ShieldCheck/ShieldOff en TablaRelaciones, manejarVerificarRelacion en useMenuCancionDetalle (admin-only), wired en CancionDetalleIsland ✅

> Lecciones L7-UX:
> - [Admin check React]: `useAuthStore(s => s.usuario?.rol === 'admin')` — selector especifico, no suscribir al store completo.
> - [apiCliente]: Existe `apiPut` pero NO `apiPatch`. Usar PUT para updates idempotentes.
> - [BotonBase]: BuscadorCanciones tenia 3 botones nativos. Sentinel los detecta. Siempre usar BotonBase variante="ghost" tamano="ninguno" para botones de icono.
> - [TO-DO]: BuscadorCanciones necesita extraccion de logica a useBuscadorCanciones.ts (4 useState + debounce + click-fuera).

### Sprint 806-813 — Sample Discovery UX + Admin Processes [AG-SDC]

> Plan detallado en `App/docs/plan-sample-discovery.md`

- [x] **806.1** Timings obligatorios en contribuciones: campos timing_fuente/timing_destino en modal, parseo m:ss, almacenamiento en cambios_propuestos JSONB, extraccion en aprobar(). Refactor useContribucion de 9 useState a 2 (formulario + estado). Backend duplicados ya detectados (409). ✅ [AG-SDC]
- [x] **807** Panel admin moderacion contribuciones (= L6.4c): TabContribucionesAdmin con lista paginada, aprobar/rechazar, useTabContribuciones polling 30s, apiContribuciones admin functions. Wired en AdminPanelIsland tab 'contribuciones'. ✅ [AG-SDC]
- [x] **808** Panel procesos de fondo: GestorProcesosFondo (lock files + PID tracking), ProcesosFondoController (4 endpoints REST), TabProcesosAdmin con cards por proceso, useTabProcesos polling adaptativo (5s running/30s stopped), apiProcesos service. Wired en AdminPanelIsland tab 'procesos'. ✅ [AG-SDC]
- [x] **809** Distribucion seed users: tercer proceso 'seed' integrado en panel 808, ejecuta SeedUsuarios (generarUsuarios + atribuirRelaciones + atribuirSamples) sincrono ✅ [AG-SDC]
- [x] **810** Quitar "Vincular sample existente" de TablaRelaciones: eliminado de 3 archivos (TablaRelaciones, useMenuCancionDetalle, CancionDetalleIsland) ✅ [AG-SDC]
- [x] **811** DevAcciones a menu contextual admin-only: "Generar recorte" movido a useMenuRelacionDetalle via OpcionesMenuRelacion, eliminado div devAcciones ✅ [AG-SDC]
- [x] **812** Rediseno /musica/: feed vertical con TopBar tabs (Inteligente/Top Sampleados/Hot), TarjetaCancionFeed con like button + 3-dot menu + sampleos count, endpoint /canciones/feed con liked status per-user (subquery correlacionada), useFeedCanciones con like optimista + rollback, eliminado PanelDevCanciones (migrado a 808), eliminado useExplorarCanciones (dead code). Busqueda: ExplorarCancionesIsland conectado a filtrosStore.busqueda, useFeedCanciones soporta modo busqueda (buscarCanciones server-side) vs modo feed con infinite scroll. ✅ [AG-SDC] [AG-DAW]
- [x] **813** Mostrar contribuidor en sampleos: LEFT JOIN usuarios_ext en porRelacionId(), NormalizadorCancion retorna contribuidorId/Username, badge en RelacionDetalleIsland ✅ [AG-SDC]

> Lecciones Sprint 806-813:
> - [cambios_propuestos JSONB]: Columna existente reutilizada para transportar timings a traves del pipeline contribucion→aprobacion sin migracion BD.
> - [useState refactor]: Patron formulario unico con actualizar() generico reduce 9 useState a 2, cumpliendo regla max 3.
> - [OpcionesMenuRelacion]: Interfaz para pasar contexto admin/callbacks a hook de menu sin acoplar.
> - [Lock files vs DB]: Para process tracking, archivos .lock JSON en App/logs/ evitan migración BD y se integran con logs existentes.
> - [Busqueda canciones 2 modos]: useFeedCanciones acepta busqueda opcional. Cuando es non-empty: llama buscarCanciones (server-side), deshabilita infinite scroll. Cuando vacío: feed normal. ExplorarCancionesIsland lee filtrosStore.busqueda via selector. Mensaje vacio dinamico muestra la query buscada.
> - [Liked canciones]: Patron subquery correlacionada (reaccion_usuario) replica NormalizadorSample. Feed publico pero incluye liked si hay sesion activa. UsuarioHelper::obtenerIdPg() retorna null si no autenticado.
> - [TopBar tabs como ordering]: Los ids de las tabs coinciden con los valores del tipo OrdenFeedCanciones. Se valida con Set para defensa contra ids inesperados.
> - [PanelDevCanciones eliminado]: Funcionalidad migrada a TabProcesosAdmin (808). Borrar componente + CSS asociado al desacoplar.
> - [Polling adaptativo]: 5s cuando hay procesos running (feedback rapido), 30s cuando todos stopped (bajo overhead).
> - [escapeshellarg PID]: Aunque PID es int, siempre escapar con escapeshellarg antes de pasar a exec(). Defensa en profundidad.
> - [posix_kill guard]: Envolver en function_exists() + fallback `kill -0` para portabilidad Windows/Linux.
> - [Likes polimorfica]: Tabla likes usa tipo+target_id, NO cancion_id. Siempre verificar LikesCols antes de asumir FK directo.
> - [Feed inteligente]: Algoritmo heuristico: LN(total_sampleada+1)*3 + freshness*2 + RANDOM()*1.5. No necesita tabla intermedia.

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

## FASE S — Sample Discovery & Metadata Engine (C601)

> Plan completo en `App/docs/plan-samples-metadata.md`  
> Misión: Preservar relaciones de samples musicales (WhoSampled en riesgo por adquisición Spotify). Scraping diario hot-samples + extracción de audio por compás + integración con catálogo Kamples.  
> Meta: 100K relaciones en 1 año. Diferenciador: Splice + WhoSampled fusionados.

### S1 — Infraestructura BD
- [x] **S1.1** Schemas PHP: ArtistasMusicales, Canciones, CancionesArtistas, RelacionesSample, ScrapingLog, ColaExtraccionSamples ✅
- [x] **S1.2** Generator: Cols, DTO, Enums, schema.ts generados ✅
- [x] **S1.3** Migraciones (tablas + índices) — ejecutadas via psql (v027_sample_discovery.sql: 6 tablas + 14 índices) ✅
- [x] **S1.4** Repositorios PHP con métodos custom (6 repos: ArtistasMusicales, Canciones, CancionesArtistas, RelacionesSample, ScrapingLog, ColaExtraccionSamples) ✅
- [x] **S1.5** API endpoints REST: CancionesController con 7 endpoints (listar, buscar, top, detalle cancion, detalle artista, top artistas, estadisticas) ✅ [AG-SMD]

### S2 — Scraper Core (Python/Scrapy + DataImpulse)
- [x] **S2.1** Proyecto Python: requirements.txt, scrapy.cfg, .env, .gitignore ✅
- [x] **S2.2** DataImpulse middleware (proxy + bandwidth tracking + budget cutoff) ✅
- [x] **S2.3** HotSamplesSpider (hot-samples + hot-covers + hot-remixes, 5 pages max) ✅
- [x] **S2.4** SampleDetailSpider (parsing completo con selectores verificados) ✅
- [x] **S2.5** PostgresPipeline (upsert artista→canción→cancion_artista→relación) ✅
- [x] **S2.6** Bandwidth tracking + presupuesto ✅
- [x] **S2.7** Scripts cron: run_daily.sh, run_extraction.sh, stats.py ✅
- [x] **S2.8** Tests con fixture HTML real (test_parsers.py, 30+ tests) ✅

### S3 — Pipeline Extracción Audio
- [x] **S3.1** audio_download.py (yt-dlp wrapper, WAV, cache, 300s timeout) ✅
- [x] **S3.2** bpm_analyzer.py (librosa beat tracking, time signature, confianza) ✅
- [x] **S3.3** sample_cutter.py (recorte alineado a compás: -1 + 8 compases, ffmpeg fade) ✅
- [x] **S3.4** kamples_inserter.py (inserción en BD, tags auto, vinculación relación, ruta_waveform) ✅
- [x] **S3.5** pipeline.py (orquestador: cola→descargar→analizar→recortar→waveform→insertar) ✅
- [x] **S3.6** waveform_generator.py (librosa → 120 peaks normalizados → JSON compatible con ProcesadorFFmpeg.php) ✅ [AG-SMD]
- [x] **S3.7** Cron batch: run_daily.sh + run_extraction.sh (lock file) + cron_runner.py cross-platform (Windows Task Scheduler + Linux cron) ✅ [AG-SMD]

### S4 — UI React Islands
- [x] **S4.1** CancionDetalleIsland + useCancionDetalle (detalle canción, portada, artistas, YouTube embed, relaciones) ✅ [AG-SMD]
- [x] **S4.2** TarjetaRelacionSample component (tarjeta reutilizable origen/destino, badges tipo/elemento) ✅ [AG-SMD]
- [x] **S4.3** ExplorarCancionesIsland + useExplorarCanciones (tabs recientes/top/buscar, grid, estadísticas) ✅ [AG-SMD]
- [x] **S4.4** SeccionSampleDiscovery + useRelacionDiscovery (integración en SampleDetalleIsland, enlace canción fuente/destino) ✅ [AG-SMD]
- [x] **S4.5** CadenaSamples widget (visualización cadena A→B→C, endpoint recursive, integrado en CancionDetalle) ✅ [AG-SMD]
- [x] **S4.6** Búsqueda textual (TopBar enlace "Buscar canciones", URL param q, placeholder dinámico) ✅ [AG-SMD]

### S5 — Expansión Scraper
- [x] **S5.1** ArtistSpider (artist.py: scrapea /most-sampled-artists/, sigue a tracks, delega detalles a SampleDetailSpider) ✅ [AG-SMD]
- [x] **S5.2** TrackSpider — /samples/ (track.py: listas paginadas de samples de un track, delega a SampleDetailSpider) ✅ [AG-SMD]
- [x] **S5.3** TrackSpider — /sampled/ (track.py: listas paginadas de canciones que samplearon un track) ✅ [AG-SMD]
- [x] **S5.4** BrowseYearSpider (browse_year.py: cobertura sistemática por año/década, categorías samples/covered/remixed) ✅ [AG-SMD]
- [x] **S5.5** Covers/remixes parsing ya cubierto por SampleDetailSpider._seguir_related() desde S2 ✅ [AG-SMD]
- [x] **S5.6** Productores N:N ya cubierto por PostgresPipeline (canciones_artistas rol='producer') desde S2 ✅ [AG-SMD]

### S5-UI — Página Música
- [x] **S5-UI.1** Ruta `/musica` registrada en pages.php (reutiliza ExplorarCancionesIsland) ✅ [AG-SMD]
- [x] **S5-UI.2** Sidebar: ítem "Música" con icono Music agregado a la navegación principal ✅ [AG-SMD]
- [x] **S5-UI.3** Ruta antigua `/explorar/canciones` reemplazada por `/musica` ✅ [AG-SMD]

### S5-FIX — Scraper metadata pipeline
- [x] **S5-FIX.1** TrackMetadataItem: nuevo item con genre/tags/youtube_id extraídos de track overview ✅ [AG-SCR]
- [x] **S5-FIX.2** `extraer_metadata_track_overview()` parser con selectores `span[itemprop="genre"]`, `span[itemprop="keywords"]`, `.track-embed .embed-placeholder` ✅ [AG-SCR]
- [x] **S5-FIX.3** Pipeline: `_upsert_cancion` persiste youtube_id+genero en INSERT/ON CONFLICT ✅ [AG-SCR]
- [x] **S5-FIX.4** Pipeline: handler TrackMetadataItem actualiza cancion existente con genre/youtube_id/tags(JSONB metadata) ✅ [AG-SCR]
- [x] **S5-FIX.5** Pipeline: featuring artists insertados como rol "featuring" en canciones_artistas ✅ [AG-SCR]
- [x] **S5-FIX.6** Filtro tags: omite "WhoSampled #N" automáticamente (PATRON_WHOSAMPLED_NUM) ✅ [AG-SCR]

### S6 — Audio Search + Contribución Comunitaria
- [ ] **S6.1-S6.6** Chromaprint fingerprinting, búsqueda por audio, UI contribución, moderación, sistema Cred

### S5.5 — Spotify ID support — ✅ COMPLETADO C706
- [x] **S5.5.1** Migración v030: columna `spotify_id` en `canciones` ✅ [AG-NAV]
- [x] **S5.5.2** Schema + Cols + DTO actualizados para spotify_id ✅ [AG-NAV]
- [x] **S5.5.3** Scraper: `_extraer_spotify_id_de_embed()` en parsers.py (ambos lados + overview) ✅ [AG-NAV]
- [x] **S5.5.4** Pipeline: spotify_id en INSERT/UPDATE de canciones + TrackMetadataItem ✅ [AG-NAV]
- [x] **S5.5.5** API: NormalizadorCancion expone spotifyId, fuente_spotifyId, destino_spotifyId ✅ [AG-NAV]
- [x] **S5.5.6** Frontend: embed Spotify como fallback en LadoCancionRelacion + RelacionDetalleIsland ✅ [AG-NAV]

### S-ARTISTA — Página de artista (/artista/{slug}) — ✅ COMPLETADO C708
- [x] **S-A1** Ampliar endpoint GET /artistas/{slug}: sampleadoPor, sampleaA, estadísticas genus ✅ [AG-REC]
- [x] **S-A2** relacionesDeCancionesFuente(), relacionesDeCancionesDestino() en RelacionesSampleRepository + generosPorArtista en CancionesRepository ✅ [AG-REC]
- [x] **S-A3** Hook useArtistaDetalle.ts ✅ [AG-REC]
- [x] **S-A4** ArtistaDetalleIsland.tsx + artistaDetalle.css (tabs: canciones/sampleado por/samplea a) ✅ [AG-REC]
- [x] **S-A5** Ruta /artista/:slug en pages.php + registro en appIslands.tsx ✅ [AG-REC]

### S-RECORTE — Generación automática de samples desde sampleos — ✅ COMPLETADO C709
- [x] **S-R1** Migración v031: campo `lado`/`spotify_id` en cola, `sample_fuente_id`/`sample_destino_id` en relaciones, `cancion_origen_id` en samples ✅ [AG-REC]
- [x] **S-R2** encolarBilateral() en ColaExtraccionSamplesRepository ✅ [AG-REC]
- [x] **S-R3** audio_download.py: soporte spotdl como fallback Spotify ✅ [AG-REC]
- [x] **S-R4** kamples_inserter.py + pipeline.py: bilateral, MP3 320kbps, cancion_origen_id ✅ [AG-REC]
- [x] **S-R5** DevController: POST /dev/recorte/generar + botón en RelacionDetalleIsland ✅ [AG-REC]
- [ ] **S-R6** Navegación cruzada: sample→canción→sampleo en UI (pendiente)
- [x] **S-R7** Auto-enqueue en PostgresPipeline Scrapy post-inserción relación ✅ [AG-REC]
- [ ] **S-R8** Descripción auto-generada desde metadata (pendiente)

### S-FIX-2 — Pipeline publicacion: creadorId + FK delete + WP Cron ✅ [AG-FIX] C711-C218

Commits: `79f586db`, `fc3db49f`, `b575fb68`, `55b9fd8b`

- [x] **S-FIX2.1** Fix FK violation al borrar sample: `SamplesRepository::eliminarConCascada()` llama `ColaExtraccionSamplesRepository::desvincularSampleId()` antes de DELETE ✅
- [x] **S-FIX2.2** Fix creadorId=0 en PublicadorExtraccion: `resolverCreadorId()` usa `contribuidor_id` de relacion (JOIN en `extraidos()`), fallback a `KAMPLES_SISTEMA_USUARIO_ID` en .env (default usuario 7 admin) ✅
- [x] **S-FIX2.3** Fix WP Cron race condition: reemplazado WP Cron por endpoint REST directo `POST /dev/extraccion/publicar-auto`. Python notifica tras terminar extraccion. Autenticacion via `X-Kamples-Secret`. ✅
- [x] **S-FIX2.4** Refactor `publicarExtracciones()` en DevController: desestructuración explícita de return para Sentinel ✅
- [x] **S-FIX2.5** KAMPLES_SITE_URL + KAMPLES_CRON_SECRET añadidas a kamples-scraper/.env ✅
- [x] **S-FIX2.6** Cola 5,6 (relacion 182) reseteadas a estado `extraido` y publicadas — pipeline end-to-end verificado ✅
- [x] **S-FIX2.7** Fix 401 en publicar-auto: `getenv()` → `$_ENV ?? getenv()` en `verificarSecretCron()` y `resolverCreadorId()`. Dotenv::createImmutable() popula solo `$_ENV`, no `putenv()`. ✅

> TO-DO: DevController supera 300 lineas (539). Separar en DevRecorteController + DevPublicacionController. Marcar como tarea pendiente de sprint.
> Lecciones: [WP Cron] No depender de tráfico para cron en dev — usar endpoint REST directo con secret. [creadorId] Resolver desde contribuidor_id de la relación (JOIN en extraidos()), no hardcodear. [FK delete] SIEMPRE desreferenciar FKs en tablas secundarias antes de DELETE en tabla fuente. [Dotenv] Dotenv::createImmutable() popula SOLO $_ENV. NUNCA usar getenv() sin fallback $_ENV. Patron correcto: `$_ENV['KEY'] ?? getenv('KEY') ?? ''`.

### S-FIX — Bugfixes artista + cola + logging — ✅ COMPLETADO C710 [AG-REC]
- [x] **S-FIX.1** DISTINCT ON (c.id) en cancionesDeArtista() para eliminar duplicados por roles múltiples ✅
- [x] **S-FIX.2** Mapeo bilateral→unilateral en detalleArtista(): _relacionBilateralAUnilateral() convierte fuente_*/destino_* a cancion_titulo/artista_nombre para NormalizadorCancion ✅
- [x] **S-FIX.3** modoCola flag en _spiderParaTipo(): DEPTH_LIMIT=0 + CLOSESPIDER_PAGECOUNT=1 al procesar cola ✅
- [x] **S-FIX.4** Logs detallados pipeline: timing por paso (6 pasos), tamaños archivos, BPM/beats, ruta salida ✅
> Lecciones: bilateral queries (fuente_titulo/destino_titulo) NO son compatibles directas con NormalizadorCancion::relacion() que espera cancion_titulo. Siempre transformar antes de normalizar. Scrapy DEPTH_LIMIT=0 previene follow links.

### S-ESCALA — Escalabilidad relacional (C703) — ✅ COMPLETADO C704
- [x] **S-E.1** Trigger PostgreSQL: `total_sampleada`/`total_samplea` auto-update en INSERT/DELETE de `relaciones_sample` ✅ [AG-NAV]
- [x] **S-E.2** Pipeline cambiar `ON CONFLICT DO NOTHING` → `DO UPDATE` para timings/votos en relaciones re-encontradas ✅ [AG-NAV]
- [x] **S-E.3** Índices compuestos: `(dest_id, tipo_relacion)`, `(fuente_id, tipo_relacion)`, `(verificada, created_at DESC)` ✅ [AG-NAV]
- [x] **S-E.4** Re-scraping strategy: `proximo_rescrape` en scraping_log, rescraping automático para tracks/artists ✅ [AG-NAV]
> Implementado en migración v029. Detalle en `completado.md` → C704.

### S-UI — Mejoras UI/SEO Sample Discovery — ✅ [AG-SDI]

- [x] **S-UI.1** Relaciones completas en sample detail: `relacionPorSampleId()` enriquecido con `samplesDe/sampleadaEn` de ambas canciones + `ladoExtraccion` ✅
- [x] **S-UI.2** Indicador visual fuente/destino: `SeccionSampleDiscovery` muestra "Extraído de {canción}" con conector + todas las relaciones adicionales ✅
- [x] **S-UI.3** Imagen portada desde canción: `PublicadorExtraccion::publicarItem()` hereda `imagen_url` de la canción origen al sample ✅
- [x] **S-UI.4** URLs SEO correctas: `construirUrlSampleo()` callers corregidos — `TablaRelaciones` y `TarjetaRelacionSample` pasan datos en posiciones correctas, con soporte both-sides via `RelacionSample.destinoTitulo/fuenteTitulo/destinoArtista/fuenteArtista` ✅
- [x] **S-UI.5** SEO title en RelacionDetalleIsland: h1 descriptivo `"{destino} samplea a {fuente}"` + `document.title` dinámico ✅

> Lecciones:
> - [URL SEO]: `construirUrlSampleo()` necesita 5 params (destArtista, destTitulo, fuenteArtista, fuenteTitulo). Callers con datos de un solo lado deben usar `urlSampleo()` helper que posiciona según `direccion`.
> - [Tipo RelacionSample]: Agregar campos opcionales del otro lado (`destinoTitulo`, `fuenteArtista`, etc.) permite URLs completas sin cambiar las queries PHP.
> - [imagen portada]: `CancionesRepository::buscarConArtista()` retorna `imagen_url` — usar para heredar a samples generados.
> - [ladoExtraccion]: Comparar `sample_fuente_id === sampleId` en PHP para determinar lado, enviar al frontend como `ladoExtraccion`.

### S-UI2 — Panel lateral Discovery + Origin marker ✅ [AG-UI] C712

- [x] **S-UI2.1** Panel lateral discovery: `TarjetaCancionMini` (nuevo componente) muestra canción fuente/destino en PanelDetalleSample cuando el sample tiene relación — título + artista + portada + etiqueta ✅
- [x] **S-UI2.2** discoveryIndicadorOrigen eliminado: reemplazado por marcador `●` en la fila de origen dentro de `TablaRelaciones` (clase `tablaRelacionesFilaOrigen` + border-left acento) ✅
- [x] **S-UI2.3** Retroactive imagen_url: 4 samples existentes (148-151) sin imagen actualizados via UPDATE FROM canciones WHERE cancion_origen_id IS NOT NULL AND imagen_url IS NULL ✅

> Lecciones S-UI2:
> - [Panel hooks]: `useRelacionDiscovery` acepta `sampleId?: number | null` — se puede llamar en PanelDetalleSample pasando `sample.id` directamente sin hook adicional.
> - [CSS vars]: `--superficieElevada` y `--bordeInteractivo` NO existen. Usar `--fondoElevado1/2/3` y `--bordeActivo` respectivamente.
> - [Retroactive data]: Samples generados antes de S-UI.3 tienen `imagen_url = NULL`. Fix: `UPDATE samples SET imagen_url = c.imagen_url FROM canciones c WHERE s.cancion_origen_id = c.id AND s.imagen_url IS NULL`.
> - [TablaRelaciones origin marker]: `marcarOrigen={esFuente}` en fuente, `marcarOrigen={!esFuente}` en destino. Marca solo `idx === 0` (primera fila = canción origen directa).

### S-FIX-3 — yt-dlp PO Token + Spotify fallback ✅ [AG-BTL] C900c
- [x] **S-FIX3.1** Plugin PO Token instalado y funcional: `bgutil-ytdlp-pot-provider` v1.3.1 (pip) + server scripts v1.3.1 construidos en `~/bgutil-ytdlp-pot-provider/server/build/`. yt-dlp detecta automáticamente 3 providers (http, script-node, script-deno). Descarga verificada exitosa con client android_vr + PO token. ✅
- [x] **S-FIX3.2** audio_download.py reescrito: eliminadas estrategias obsoletas (android/tv_embedded/ios/browser cookies). Ahora usa yt-dlp nativo con plugin PO token (elige client optimo auto) + fallback cookies.txt para restricción de edad. ✅
- [x] **S-FIX3.3** Spotify fallback mejorado: nuevo `_descargar_spotify_por_nombre(artista, titulo)` — busca en Spotify por nombre cuando no hay spotify_id. pipeline.py pasa `fuente_artista`/`fuente_titulo` a `descargar_audio()`. ✅
- [x] **S-FIX3.4** requirements.txt: `yt-dlp>=2025.5`, `bgutil-ytdlp-pot-provider>=1.3` añadidos. ✅
> **Setup requerido (una vez por máquina):**
> ```shell
> git clone --single-branch --branch 1.3.1 https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git ~/bgutil-ytdlp-pot-provider
> cd ~/bgutil-ytdlp-pot-provider/server && npm ci && npx tsc
> pip install bgutil-ytdlp-pot-provider>=1.3
> ```
> **Nota:** Videos individuales pueden fallar por restricciones específicas (no por IP). El plugin PO token NO garantiza 100% bypass pero funciona para la mayoría de videos públicos. OAuth2 ya NO es soportado por YouTube.
> Lecciones: [PO Token] YouTube requiere Proof of Origin tokens desde 2025. Sin plugin, TODOS los clients fallan (LOGIN_REQUIRED/UNPLAYABLE). [bgutil versiones] Plugin pip y server scripts DEBEN ser la misma major version. [Spotify fallback] spotdl acepta queries de texto además de URLs — `spotdl download "artista - titulo"` busca automáticamente.

### S-FIX-5 — android_vr primario + _bgutil_servidor_activo() con cache ✅ [AG-BTL] C900e
- [x] **S-FIX5.1** Diagnóstico: `fetch_pot=always` en base_cmd sin bgutil server activo hace que yt-dlp use web client → falla con "The page needs to be reloaded" en TODOS los requests (incluyendo ytsearch). ✅
- [x] **S-FIX5.2** `_bgutil_servidor_activo()`: chequea `localhost:4416/ping` con urllib.request, timeout=2s, resultado cacheado por proceso. Evita múltiples checks por video. ✅
- [x] **S-FIX5.3** `_descargar_youtube()` estrategias rediseñadas: (1) android_vr sin PO tokens, (2) android_vr+cookies, (3) web+fetch_pot solo si bgutil activo. Elimina dependencia en servidor externo para contenido público. ✅
- [x] **S-FIX5.4** `_descargar_youtube_search()`: reemplazado `fetch_pot=always` por `player_client=android_vr`. Mismo cliente que descarga directa para consistencia. ✅
- [x] **S-FIX5.5** `_ERRORES_AUTH` ampliado con "unavailable" y comentarios por tipo de error. base_cmd limpio (sin extractor-args globales). ✅
> **Root cause del fallo masivo:** El servidor bgutil se apaga cuando se cierra el terminal. La pipeline cron/scheduled no tiene el servidor activo. android_vr no necesita servidor → funciona como primario robusto.
> Lecciones: [bgutil server efímero] Si bgutil se inicia en terminal interactivo, muere al cerrar sesión. Para producción, usar systemd/PM2/NSSM. [fetch_pot sin server] fetch_pot=always sin servidor bgutil activo es peor que no usarlo — fuerza web client que falla. [android_vr resiliente] android_vr funciona para 95%+ del contenido público sin ningún servidor externo.

### S-FIX-6 — tv_embedded primario + _ejecutar_ytsearch multi-cliente ✅ [AG-BTL] C900f
- [x] **S-FIX6.1** Diagnóstico: `android_vr + cookies` causa "Requested format is not available" de forma sistemática. Mezclar cookies de sesión web con player_client=android_vr genera mismatch de contexto de API: android_vr usa endpoints distintos que el web player donde viven las cookies. ✅
- [x] **S-FIX6.2** `tv_embedded` como cliente primario: contexto embed, diferente detección anti-bot que web/android. No requiere PO tokens ni cookies. Históricamente más permisivo con contenido de labels. ✅
- [x] **S-FIX6.3** Estrategias rediseñadas: `tv_embedded` → `android_vr` → `tv_embedded+cookies` → `web_bgutil` (condicional). Eliminado `android_vr+cookies` (patrón roto). ✅
- [x] **S-FIX6.4** `_ERRORES_CONTINUAR` ampliado: agrega "requested format" y "private video" para continuar al siguiente cliente. ✅
- [x] **S-FIX6.5** `_ejecutar_ytsearch()` extraído como helper: recibe `player_client` como param, itera tv_embedded → android_vr desde `_descargar_youtube_search()`. ✅
> Lecciones: [android_vr + cookies = mismatch] android_vr usa Google TV/Cast API endpoints. Las cookies son de la cuenta web. Cuando se mezclan, el player puede autenticar pero retorna lista de formatos de android_vr (limitada) con la sesión web, generando inconsistencias. tv_embedded es el cliente correcto para usar con cookies de navegador. [tv_embedded acceso] tv_embedded pide el video como si fuera un embed de YouTube, evitando algunas restricciones de "solo disponible en YouTube" de canales oficiales.
- [x] **S-FIX4.1** Diagnóstico raíz: bgutil NO era llamado. `PLAYER_PO_TOKEN_POLICY(required=False, recommended=False)` en web client → yt-dlp en modo `auto` nunca fetcha player PO tokens. Fix: `--extractor-args "youtube:fetch_pot=always"` fuerza bgutil a generar tokens para CADA request. ✅
- [x] **S-FIX4.2** `_descargar_youtube_search()` nuevo: busca `ytsearch5:artista titulo` con `--max-downloads 1` + `--ignore-errors` + cookies + `fetch_pot=always`. Itera resultados automáticamente hasta el primer MP3 descargable. Evita restricciones DRM de canales oficiales encontrando subidas no oficiales. ✅
- [x] **S-FIX4.3** `_ejecutar_spotdl()` helper: usa `Popen + threading` para leer stdout/stderr en tiempo real y matar el proceso inmediatamente al detectar "rate" + "limit". Evita esperar los 86400s de retry de Spotify API. ✅
- [x] **S-FIX4.4** Priority chain actualizada: YouTube ID → YouTube search → Spotify ID → Spotify name search. Spotdl como último recurso. ✅
- [x] **S-FIX4.5** Módulo docstring actualizado con arquitectura completa de la estrategia. ✅
> **Contexto:** Todos los videos en cola eran contenido de labels oficiales (Commodores, Jodeci, etc.) → UNPLAYABLE incluso con tokens válidos (restricción DRM, no bot detection). YouTube search fallback puede encontrar subidas no oficiales sin esas restricciones.
> **Estado Spotify:** rate limit de 24h activo por testing previo con spotdl. Expira automáticamente; el pipeline reintentará vía spotdl cuando se reactive.
> Lecciones: [fetch_pot=auto no llama bgutil] En modo auto, yt-dlp solo pide PO tokens si `required=True` para el client. Para activar bgutil siempre usar `fetch_pot=always`. [Label content UNPLAYABLE] Videos de sellos oficiales retornan UNPLAYABLE incluso con tokens PO válidos — es restricción DRM/Premium, no bot detection. YT search es el único workaround (buscar subidas no oficiales). [spotdl rate limit Popen] `subprocess.run()` con capture_output no puede detectar rate limit a tiempo. Popen + threads permiten kill inmediato al detectar el mensaje en stderr/stdout.

### S-FIX-7 — Estrategias corregidas + nightly + diagnóstico GVS ✅ [AG-BTL] C900g
> **DIAGNÓSTICO MANUAL COMPLETO (junio 2026):** Cada cliente probado individualmente con yt-dlp CLI directo.
- [x] **S-FIX7.1** `tv_embedded` ELIMINADO: yt-dlp 2026.03.03+ lo salta silenciosamente con "WARNING: Skipping unsupported client tv_embedded". Todo el código basado en tv_embedded era código muerto. ✅
- [x] **S-FIX7.2** `android_vr + cookies` CONFIRMADO roto: yt-dlp rechaza android_vr cuando hay cookies con "WARNING: Skipping client android_vr since it does not support cookies". Genera "Requested format is not available" (solo retorna imágenes). ✅
- [x] **S-FIX7.3** bgutil PO tokens INVÁLIDOS para GVS experiment: Tanto HTTP server como script-deno como script-node generan tokens que YouTube rechaza. script-deno/node fallan con "Failed to generate an integrity token" para tv_downgraded. Para web_safari generan token pero YouTube responde UNPLAYABLE. ✅
- [x] **S-FIX7.4** Estrategias corregidas: (1) default sin cookies (android_vr auto-seleccionado para público), (2) default con cookies (tv_downgraded/web/web_safari para restringidos). Eliminados todos los `--extractor-args youtube:player_client=...` hardcodeados. ✅
- [x] **S-FIX7.5** Search corregido: ytsearch5→ytsearch3 (menos API calls = menos bot detection). Sin cookies primero, con cookies después. Eliminada iteración por player_client (obsoleta). ✅
- [x] **S-FIX7.6** `_bgutil_servidor_activo()` eliminado: servidor ya no aporta valor (tokens inválidos). Elimina dependencia y latencia innecesaria. ✅
- [x] **S-FIX7.7** yt-dlp actualizado a nightly 2026.03.11 (dev): `pip install --pre "yt-dlp[default]"`. Incluye yt-dlp-ejs y pycryptodomex. ✅
> **Estado actual (realista):**
> - android_vr sin cookies FUNCIONA para contenido público cuando la IP no está flaggeada.
> - Tras ~10 requests consecutivos, YouTube flaggea la IP (LOGIN_REQUIRED en todo). Se desflaggea tras 1-2h de inactividad.
> - Con cookies, android_vr se descarta → solo quedan web-based clients → GVS BLOQUEA todos.
> - bgutil (1.3.1) NO genera integrity tokens válidos para la GVS experiment actual de YouTube.
> **Acción requerida del usuario:**
> 1. Parar requests yt-dlp por 1-2h para desflaggear IP.
> 2. Cerrar Chrome y re-exportar cookies con extensión "Get cookies.txt LOCALLY" → reemplazar kamples-scraper/cookies.txt.
> 3. Monitorear releases de bgutil-ytdlp-pot-provider para fix de GVS experiment.
> 4. Procesar cola en lotes pequeños (3-5 items) con pausas entre lotes para evitar IP flagging.
> Lecciones: [tv_embedded obsoleto] Eliminado de yt-dlp 2026.03.03. [android_vr no soporta cookies] yt-dlp lo descarta silenciosamente si hay cookies — causa "Requested format is not available". [GVS experiment] YouTube GVS experiment vincula PO tokens a video IDs — bgutil 1.3.1 genera tokens inválidos. Afecta TODOS los clientes web (web, web_safari, mweb, tv_downgraded). [IP flagging acumulativo] Cada request fallido incrementa el flag. ~10 requests = LOGIN_REQUIRED para todo. Se desflaggea con inactividad. [Cookies frescas criticas] cookies.txt puede invalidarse server-side aunque no expire. Re-exportar periódicamente.

### S-FIX-8 — SoundCloud como fuente primaria + proxy eliminado ✅ [AG-BTL] C900h
> **Investigacion exhaustiva (2026-03-13):** 20+ fuentes alternativas probadas. Cobalt, Piped, Invidious, pytubefix, converter sites (Y2Mate, loader.to, cnvmp3, vevioz, yt5s, savefrom, y2meta, tomp3) — TODOS muertos/bloqueados. Proxy DataImpulse funciona pero inviable a escala ($240/mes @2000/dia). **SoundCloud API v2 descubierta: gratis, sin auth, tracks completos, 128kbps, 15/15 = 100% exito.**
- [x] **S-FIX8.1** `_obtener_soundcloud_client_id()`: extraccion dinamica del client_id desde frontend JS de SoundCloud, cache a nivel de modulo ✅
- [x] **S-FIX8.2** `_descargar_soundcloud()`: busqueda + filtro de snippets (<60s) + seleccion de transcoding + descarga ✅
- [x] **S-FIX8.3** `_elegir_transcoding_soundcloud()`: progressive MP3 > HLS MP3 > HLS AAC, excluye encrypted (DRM) ✅
- [x] **S-FIX8.4** `_descargar_progressive()` + `_descargar_hls()`: descarga directa y HLS (m3u8→segmentos→concatenar) ✅
- [x] **S-FIX8.5** `descargar_audio()` reescrito: SoundCloud→YT local→Deezer(timing<=30s)→YT search→Spotify ID→Spotify search. Proxy eliminado de cadena activa ✅
- [x] **S-FIX8.6** Fix breaking change: eliminado `proxy_url=proxy_url` de `_descargar_youtube_search()` (no acepta ese kwarg) ✅
- [x] **S-FIX8.7** `pipeline.py`: pasa `timing_seg=timing` a `descargar_audio()` para routing inteligente Deezer ✅
- [x] **S-FIX8.8** plan-fuentes-audio.md reescrito: SoundCloud primario, alternativas descartadas documentadas ✅
- [x] **S-FIX8.9** investigacion-fuentes-audio.md actualizado con resultados finales y tabla de fuentes descartadas ✅
- [x] **S-FIX8.10** Test files temporales eliminados (14 archivos: test_conv*.py, test_sc_*.py, test_proxy*.py, check_timings.py, test_rick.mp3) ✅
- [ ] **S-FIX8.11** Probar con cola real (659 items): medir cobertura SoundCloud en produccion (pendiente)
> **Proyeccion:** 2000 tracks/dia, ~10 GB bandwidth, ~3.5h, **$0/mes**. Elimina dependencia de proxy ($240/mes inviable).
> Lecciones: [SoundCloud API v2] Publica sin auth. client_id del frontend JS, cacheable. Transcodings progressive = descarga directa (mas rapido que HLS). DRM = ctr-encrypted-hls/cbc-encrypted-hls — excluir. [Converter sites] Todos con Turnstile/CAPTCHA, APIs muertas. Ejecutan yt-dlp en servidores propios con IP pools. [Piped/Invidious] Ecosistema muerto Mar 2026. [pytubefix] Mismo GVS blocking que yt-dlp. [Deezer GW API] Requiere ARL (cookie login) para full tracks, anonymous solo da CSRF invalid.
