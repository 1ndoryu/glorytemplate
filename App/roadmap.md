# Kamples -- Roadmap Integral de Producto

> **Version:** 4.2 | **Ultima actualizacion:** 06/03/2026 | **Stack:** Glory Framework (WP + React Islands + TS)

## Indice de Modulos

Este roadmap esta organizado en archivos modulares para facilitar la navegacion y el mantenimiento.

| Modulo          | Archivo                                                                | Contenido                                                            |
| --------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Arquitectura    | [docs/roadmap/arquitectura.md](docs/roadmap/arquitectura.md)           | Vision, stack, paginas, planes, notas compactas                      |
| Pendientes      | [docs/roadmap/pendientes.md](docs/roadmap/pendientes.md)               | Tareas pendientes por fase (8-13), sprint revision, auditorias       |
| Completado      | [docs/roadmap/completado.md](docs/roadmap/completado.md)               | Todo el trabajo completado (F0-F7, Sync, Algoritmo, Desktop)         |
| Referencia Sync | [docs/roadmap/referencia-sync.md](docs/roadmap/referencia-sync.md)     | Arquitectura de referencia Sync v2 + Cola IA                         |
| Lecciones       | [docs/roadmap/lecciones.md](docs/roadmap/lecciones.md)                 | Gotchas y lecciones aprendidas por dominio                           |
| Dedup Global    | [docs/roadmap/plan-dedup-global.md](docs/roadmap/plan-dedup-global.md) | Plan "1 sample = 1 existencia" — dedup server + desktop + moderacion |

### Documentacion adicional

- `App/docs/algoritmo.md` -- Algoritmo de descubrimiento (changelog de auditorias)
- `App/docs/plan-sync-optimizacion.md` -- Plan de optimizacion sync (fases completadas)
- `App/docs/plan-sync-mejoras-v3.md` -- Auditoria de seguridad sync (v3)
- `App/docs/moderacion.md` -- Sistema de moderacion IA
- `App/docs/monetizacion.md` -- Modelo de monetizacion y revenue share
- `App/docs/plan-daw-channelrack-mixer.md` -- Plan DAW (Channel Rack + Mixer)
- `App/docs/plan-piano-roll.md` -- Plan Piano Roll
- `App/solid-seguridad-optimizacion.md` -- SOLID, seguridad y optimizacion
- `App/docs/roadmap/plan-dedup-global.md` -- Plan de deduplicacion global (1 sample = 1 existencia)
- `App/docs/plan-samples-metadata.md` -- Plan Sample Discovery & Metadata Engine (scraping + extraccion audio + whosampled data)

---

## Protocolo de actualizacion

1. Al completar una tarea, actualizar `docs/roadmap/pendientes.md` (mover a completado) y `docs/roadmap/completado.md`
2. Al descubrir un gotcha, documentar en `docs/roadmap/lecciones.md` bajo la seccion correspondiente
3. Al cambiar arquitectura o stack, actualizar `docs/roadmap/arquitectura.md`
4. Compactar secciones completadas cuando superen 10 items detallados





## Tareas nuevas a organizar y hacer

## QQ14 ✅ [AG-QQF]

Logout via API (POST /auth/logout) sin redirigir a wp-login.php. TopBar usa cerrarSesion() de apiAuth.ts + reload a /. GuardiaWpAdmin.php bloquea wp-admin y wp-login.php para no-admins (excepto AJAX, admin-post, logout nativo fallback). Archivos: AuthController.php (ruta+método), apiAuth.ts, TopBar.tsx, GuardiaWpAdmin.php, KamplesInit.php.

## QQ15 ✅ [AG-QQF]

Fix búsqueda/tags en feed: setBusqueda ya no auto-parsea tags (filtrosStore.ts). Comparación de tags normalizada con normalizarTag() en ambos lados (useFeedFiltros.ts). Búsqueda multi-término por coma con normalización de sinónimos.

## QQ16 ✅ [AG-QQF]

Separación Pro/Precio en creación y feed. Pro (Crown) = descarga exclusiva Pro, genera ingresos. Precio ($) = cualquiera puede comprar. Backend: DescargasController maneja 4 combinaciones (esPremium × precio) independientemente. Frontend: ContenidoCrear con 4 toggles (descarga/pro/precio/usuarios). TarjetaSample muestra icono $/Crown/Plus según estado. Archivos: DescargasController.php, useCrearContenido.ts, ContenidoCrear.tsx, useTarjetaSample.ts, TarjetaSample.tsx, tarjetaSample.css, modalCrear.css.

## QQ17 ✅ [AG-QQF]

Fix URLs colecciones con números: backfill automático de slugs NULL en colecciones existentes via `ColeccionesRepository::generarSlugsFaltantes()` (one-time run con WP transient). Colecciones nuevas ya generan slug al crearse. Frontend ya usaba `coleccion.slug ?? coleccion.id`. Archivo: KamplesInit.php.

## QQ18 ✅ [AG-QQF]

Fix comentarios en publicaciones del perfil: PerfilIsland ahora pasa `onLike`, `onComentar` y renderiza `SeccionComentariosPost` como children de TarjetaPublicacion. Hook usePerfilIsland con `manejarLikePost` (optimistic), `comentariosAbiertos` (Set), `alternarComentarios`. Archivos: usePerfilIsland.ts, PerfilIsland.tsx.

## QQ19 ✅ [AG-QQF]

"También te podría gustar" unificado con panel lateral. Página individual: eliminado renderizado inline y item en menú contextual — ahora al dar like se abre el panel lateral con PanelSugerencias (mismo flujo que feed). Feed: agregado item "También te podría gustar" (sin icono) en menú contextual que abre panel lateral. Archivos: useSampleDetalle.ts, SampleDetalleIsland.tsx, useMenuContextualSample.ts.

## QQ20 ✅ [AG-QQF]

Publicaciones muestran 1 comentario destacado (el de más likes) como preview inline. **Backend:** `ComentariosRepository::obtenerDestacadosPorPubs()` — query batch eficiente con `DISTINCT ON` (PostgreSQL), 1 query para todas las publicaciones del feed. `NormalizadorPublicacion::normalizarComentarioDestacado()` — normalización del row crudo. Integrado en `PublicacionesController::listar()` y `obtener()`. **Frontend:** `ComentarioDestacado` type en publicacion.ts. `ComentarioPreview` componente (avatar xs + nombre + tiempo + texto truncado a 2 líneas + likes). Se renderiza entre BarraAccionesPost y children slot; se oculta cuando children está presente (comentarios ya están abiertos). Clickeable para abrir comentarios. Archivos: ComentariosRepository.php, NormalizadorPublicacion.php, PublicacionesController.php, publicacion.ts, index.ts, TarjetaPublicacion.tsx, ComentarioPreview.tsx, comentarioPreview.css.

## QQ21a ✅ [AG-QQF]

inicioTagsContador ahora refleja resultados filtrados al buscar. FeedSamples ya tenía `onConteoChange` callback — conectado a InicioIsland con `setConteoFiltrado`. Counter muestra `{conteoFiltrado} de {totalServidor} samples` cuando hay búsqueda activa, `{totalServidor} samples` cuando no. Archivos: InicioIsland.tsx.

## QQ21b ✅ [AG-QQF]

Tags normalizados a inglés en el front. **Display:** BadgesMetadata en TarjetaSample ahora prefiere `emocion` (EN) sobre `emocion_es` (ES), y `tags` (EN) sobre `tags_es` (ES). **Búsqueda enriquecida:** `extraerTagsMetadata` en tagUtils.ts ahora incluye tags de AMBOS idiomas (`meta.tags` + `meta.tags_es` + `meta.tagsEs`) y emociones de ambos idiomas para que búsquedas en español sigan funcionando. Español preservado en metadata para enriquecimiento de búsqueda. Archivos: TarjetaSample.tsx, tagUtils.ts.

## QQ22 ✅ [AG-QQF]

Inspector de samples actualizado con todos los campos faltantes. **Backend:** NormalizadorSample ahora incluye `rutaOriginal`/`rutaOptimizada` (solo cuando `esMio=true`, seguridad C202 preservada), `permitirDescarga`, `licenciaLibre`, `publicadoAt`, `creadoAt`, `totalComentarios` en la respuesta. SQL SELECT extendido con columnas faltantes. **Frontend:** Sample type extendido con campos nuevos (`totalComentarios`, `idCorto`, `audioHash`, `permitirDescarga`, `licenciaLibre`, flags de estado). ModalInspectorSample ampliado: Info General (+idCorto, precio, reaccion, permitirDescarga, licenciaLibre, mostrarComunidad, verificado), Audio (+audioHash), Metadata IA (+carpetaPrimaria/Secundaria), Stats (+totalComentarios), nueva seccion Flags de Estado (esMio, yaColeccionado, enColeccion, yaComentado, yaComprado), nueva seccion Fechas (publicadoAt, creadoAt). Archivos: NormalizadorSample.php, sample.ts, ModalInspectorSample.tsx.

## QQ23 ✅ [AG-QQF]

Menú 3 puntos en perfiles de otros usuarios con Reportar + Bloquear/Desbloquear. Backend: POST `/reportar-usuario/{userId}` en SocialController (rate limit 5/24h, sanitización, ReportesRepository::crearReporteUsuario con tipo='usuario'). Frontend: reportarUsuarioStore (Zustand), ModalReportarUsuario + useReportarUsuario hook (reutiliza CSS de modalReportarError), useMenuContextualPerfil (construye items dinámicos con bloqueosStore). PerfilIsland: botón MoreHorizontal + MenuContextual. Chat: useVentanaChat report/block conectados a stores reales (antes eran placeholders). ModalReportarUsuario montado globalmente en LayoutPrincipal.

## QQ24 ✅ [AG-QQF]

Fix texto garbled en reportes (â€" en vez de —). Causa: PostgresService.php no seteaba `client_encoding` en la conexion PDO, causando Mojibake (UTF-8 bytes interpretados como Latin-1). Fix: agregado `SET client_encoding = 'UTF8'` en PostgresService.php despues de crear conexion. Aplica a toda la aplicacion, no solo reportes.

## QQ25 ✅ [AG-QQF]

Sistema de bloqueo user-to-user completo. BD: tabla `bloqueos` (PK, FK, UNIQUE, CHECK, indices). Schema: BloqueoSchema + BloqueoCols + BloqueoDTO. Backend: BloqueosRepository con CRUD + `sqlExcluirBloqueados()` helper reutilizable para SQL subqueries bidireccionales. API: POST/DELETE /block/{userId} (con rate limit + auto-unfollow mutuo), GET /me/bloqueados. Filtrado bidireccional inyectado en: MotorRecomendacion (feed personalizado + nuevo usuario), SamplesRepository (listarFeed, buscarSimilares, buscarPorScoring, listarConFiltros), PublicacionesController (feed social), ComentariosRepository (raíz + respuestas), NotificacionesRepository (listarConActor). Frontend: bloqueosStore (Zustand), apiBloqueos service, SeccionBloqueos en ModalConfiguracion. Perfil: campo `bloqueado` en respuesta de perfil público.

## QQ27 ✅ [AG-QQF]

Sistema de notificaciones mejorado. Backend: NotificacionesController normaliza actor data en objeto anidado `{username, nombreVisible, avatarUrl}` (antes eran campos planos). ServicioNotificaciones: nuevos métodos `publicacionRechazada()` y `comentarioRechazado()` (tipo='moderacion'). Notificaciones de rechazo automático añadidas en 5 puntos: anti-spam publicaciones (crear/editar), anti-spam comentarios (publicaciones + comentarios), IA moderación (publicaciones en shutdown hook, comentarios). Frontend: DropdownNotificaciones muestra avatar del actor cuando existe (img round 36px), fallback a icono por tipo. Items son `<a>` con href para soporte de click central (nueva pestaña). Añadido tipo `venta` con icono DollarSign. Hook soporta `soloMarcarLeida` para middle-click. CSS: clases `.dropdownItemAvatar`, `.dropdownItemConAvatar`. Archivos: NotificacionesController.php, ServicioNotificaciones.php, PublicacionesEscrituraController.php, ComentariosEscrituraController.php, ServicioModeracionIA.php, DropdownNotificaciones.tsx, useDropdownNotificaciones.ts, apiNotificaciones.ts, notificaciones.ts (utils), dropdownPanel.css.

## QQ28 ✅ [AG-QQF]

Fix 404 en URLs directas (publicaciones y otras rutas): En `PageTemplateInterceptor::forzarResolucionDinamica()`, si `get_page_by_path()` retorna null pero la pagina esta definida en `PageDefinition::getPaginasDefinidas()`, se auto-crea la pagina WP via `PageProcessor::crearPaginaDefinida()` con transient de 300s para evitar intentos repetidos. Aplica tanto a rutas dinamicas (publicacion/87) como paginas estaticas. Archivos: Glory/src/Manager/PageTemplateInterceptor.php.

## QQ29 ✅ [AG-QQF]

feedSamplesContenedor ya no aparece en relaciones sin samples. Se agrego `total_samples` al query de `porRelacionId()` via subquery (cuenta samples activos por `sample_fuente_id`, `sample_destino_id` y `relacion_sampleo_id`). Normalizer incluye `totalSamples` en la respuesta. `RelacionDetalleIsland` ahora guarda `FeedSamples` con `relacion.totalSamples > 0`, evitando peticion innecesaria. Archivos: RelacionesSampleRepository.php, NormalizadorCancion.php, cancion.ts, RelacionDetalleIsland.tsx.

## QQ30 ✅ [AG-QQF]

En contexto adjuntar: audio obligatorio para publicar, descarga forzada on (oculta), premium/precio ocultos, solo botón comunidad (off por defecto). `esContextoAdjuntar` flag en useCrearContenido.

## QQ30.1 ✅ [AG-QQF]

`crearElementoContenedor` reemplazado por `crearPrecioContenedor` (mismos estilos). SelectorMenu de tipo elemento sin `compacto` — ahora usa estilo select normal.

## QQ30.2 ✅ [AG-QQF]

Incluido en QQ30 — botones descarga/premium/precio ocultos en contexto adjuntar, solo comunidad visible (desactivado por defecto).

## QQ31 ✅ [AG-QQF]

Optimización de rendimiento del chat. **Problema:** Al abrir chat desde perfil, tardaba 2-5s por N+1 queries (3 queries × N conversaciones) + carga secuencial frontend. **Backend:** Nueva `ConversacionesRepository::listarDeUsuarioEnriquecido()` — 1 sola query con JOIN a `usuarios_ext` + 2 `LEFT JOIN LATERAL` (último mensaje + conteo no leídos). Reemplaza loop de `buscarParticipante()` + `ultimoDeConversacion()` + `contarNoLeidos()` por conversación. MensajesController simplificado (208 líneas, antes ~248). **Frontend:** `useChatIsland.ts` — carga paralela con `Promise.all([obtenerConversaciones(), obtenerMensajes()])` (antes secuencial). `marcarConversacionLeida()` cambiado de `await` a fire-and-forget. Archivos: ConversacionesRepository.php, MensajesController.php, useChatIsland.ts.

## QQ32 ✅ [AG-QQF]

Rediseño social del perfil. Backend: añadida columna `sitio_web` en `usuarios_ext` (v037 migration), PerfilController normaliza y actualiza `sitioWeb` (URL sanitization con `esc_url_raw`). Nuevo endpoint `GET /usuarios/{username}/seguidores` en SocialController con paginación + estado de follow del viewer. FollowsRepository: `listarSeguidores()` con JOIN a `usuarios_ext`. Frontend: Eliminada fecha de unión (Calendar) y contador de "Siguiendo" de PerfilIsland. "Seguidores" ahora clickable → abre ModalSeguidores (Zustand store + hook `useModalSeguidores` con scroll infinito + toggle follow/unfollow optimista con rollback). ModalConfiguracion: nuevo input "Enlace" con `sitioWeb` en payload de actualización. PerfilIsland muestra sitioWeb truncado a 40 chars. `.perfilMetadata` re-habilitada (ya no `display:none`). Añadida variable CSS `--hoverSutil`. Archivos: UsuariosExtSchema.php, UsuariosExtCols.php, v037 migration, PerfilController.php, SocialController.php, FollowsRepository.php, apiSocial.ts, seguidoresModalStore.ts, useModalSeguidores.ts, ModalSeguidores.tsx, modalSeguidores.css, PerfilIsland.tsx, LayoutPrincipal.tsx, useModalConfiguracion.ts, ModalConfiguracion.tsx, perfil.css, variables.css.

## QQ33 ✅ [AG-QQF]

Fix errores IDE: PipelineAudio usaba `DuplicadosPendientesRepository::crear()` inexistente → cambiado a `insertarRegistro()`. SocialController usaba `RateLimiter::verificar()` inexistente → cambiado a `verificarUsuario()`. SocialController excedía 300 líneas → extraído bloqueo+reportes a nuevo `ModeracionController.php` (141 líneas). Limpiados imports muertos (CancionesCols, RelacionesSampleCols). Registrado ModeracionController en KamplesController.

## QQ34 ✅ [AG-QQF]

Landing SEO + SVG optimization. **SVGs:** Script `scripts/optimize-svg-images.cjs` (sharp) recomprime imágenes base64 embebidas en SVGs: Kamples.svg 34→4.5MB (-87%), MiniDaw.svg 28→2.5MB (-91%), Sync.svg 5→1.4MB (-70%), Rolas.svg 1.2→1.0MB (-19%). Total 68MB→9.4MB (-86%). 59 imágenes JPEG/PNG recomprimidas con mozjpeg quality 68. **SEO:** Textos hero concisos ("Descubre, descarga y sincroniza samples"), h2 duplicado "DAW Web" corregido (Rolas → "Miles de samples por descubrir"), alt texts descriptivos para todas las secciones. **Performance:** width/height explícitos (1288×717) en todos los `<img>` para prevenir CLS, `fetchPriority="high"` en hero, `decoding="async"` en todas las imágenes, `loading="lazy"` en below-fold. **Cleanup:** Sección trending muerta (display:none + fetch innecesario) eliminada, hook reducido de 50 a 12 líneas, import TarjetaSample eliminado, footer en español. Archivos: LandingPublica.tsx, useLandingPublica.ts, 4 SVGs, optimize-svg-images.cjs.

## QQ35 ✅ [AG-QQF]

Modal configuración responsive. Fix: selector `.configModal` inexistente → `.modalContenedor.configModalLayout`. En mobile (<600px): fullscreen (100vw/100vh, sin border-radius), nav lateral → tabs horizontales scrolleables con scrollbar oculto, padding reducido en contenido, portada 80px, secciones horizontales → apiladas verticalmente. Fix colateral: gap hardcodeado 2px → `calc(var(--espacioXs)/2)` en `.configBloqueoInfo`. Archivos: modalConfiguracion.css.

## QQ36 ✅ [AG-QQF]

YouTube embed bot verification — investigado: el problema es inherente al entorno localhost. YouTube rechaza embeds desde orígenes `localhost`/IPs locales por tráfico sospechoso. WhoSampled funciona porque es un dominio público verificado. El código ya implementa correctamente `youtube-nocookie.com` (privacidad mejorada), validación de ID con regex `^[a-zA-Z0-9_-]{11}$`, y atributos `allow` apropiados. En producción (kamples.com con HTTPS) funcionará sin problemas. No hay fix aplicable — comportamiento esperado de YouTube en desarrollo local. Archivos verificados: CancionDetalleIsland.tsx, LadoCancionRelacion.tsx, useRelacionDetalleIsland.ts.

## QQ37 ✅ [AG-QQF]

Resuelto por QQ28. El fix en `forzarResolucionDinamica()` auto-crea paginas WP faltantes (perfil, admin/panel, publicacion, etc.) cuando estan definidas en PageDefinition pero ausentes en BD. Cubre rutas dinamicas (/perfil/{username}) y estaticas (/admin/panel). Si la pagina se borra o no se sincronizo, se recrea al primer acceso con transient de 300s para evitar intentos repetidos. `crearPaginaDefinida()` ya maneja jerarquia padre/hijo (`asegurarPaginaPadre()` recursivo).

## QQ38 ✅ [AG-QQF]

Sistema de reportes centralizado. Un solo modal (ModalReportar), store (reportarStore), hook (useReportar) y endpoint backend (POST /reportar) para todos los tipos: usuario, publicacion, comentario, sample, error_plataforma. Backend: ModeracionController::reportarGenerico con validacion especifica por tipo (existencia, duplicados, rate limit). Frontend: reportarStore con tipo+targetId+targetNombre, ModalReportar adapta UI segun tipo. Eliminados: ModalReportarUsuario, ModalReportarError, reportarUsuarioStore, reportarErrorStore, useReportarUsuario, useReportarError. Migrados: useMenuContextualPerfil, useMenuContextualPublicacion (era window.prompt), useVentanaChat, useComentarioItem, useMenuContextualSample (tenia TO-DO), Sidebar, LayoutPrincipal.

## QQ39 ✅ [AG-QQF]

Tab de likes eliminado del perfil. Removido de `TABS_PERFIL`, eliminado estado `likesPerfil` y su API call (que usaba endpoint genérico como placeholder), simplificado `manejarLike` optimista a solo `samplesPerfil`. Import `Heart` limpiado de PerfilIsland. Archivos: usePerfilIsland.ts, PerfilIsland.tsx.

## QQ40 ✅ [AG-QQF]

Errores ortográficos corregidos + Google OAuth implementado. ModalAuth.tsx: 7 errores de ortografía corregidos (sesion→sesión, Contrasena→Contraseña, Registrate→Regístrate, signos de interrogación faltantes). Botón Google OAuth añadido a ambos formularios (login y registro) del modal. Backend: GoogleAuthController.php — endpoint POST /auth/google que recibe ID token de Google Identity Services, lo verifica server-side con oauth2.googleapis.com/tokeninfo (validación de aud, iss, email_verified, exp), crea o encuentra usuario WP por email, crea registro PG, actualiza avatar de Google si falta, genera JWT. Frontend: useGoogleAuth.ts hook que carga dinámicamente GSI script, inicializa con client_id de GLORY_CONTEXT, y dispara One Tap prompt. GoogleClientId inyectado en GLORY_CONTEXT desde config.php (.env). IconoGoogle.tsx componente SVG reutilizable (eliminado SVG duplicado en LoginIsland y RegistroIsland). loginConGoogle() en apiAuth.ts. AuthController.php refactorizado: helpers obtenerOCrearUsuarioPg/normalizarUsuario ahora public static (reutilizados por GoogleAuthController). AuthController 297 líneas (dentro del límite). Archivos: ModalAuth.tsx, authModal.css, useAuth.ts, useGoogleAuth.ts, IconoGoogle.tsx, apiAuth.ts, GoogleAuthController.php, AuthController.php, KamplesController.php, config.php, LoginIsland.tsx, RegistroIsland.tsx.

## QQ41 ✅ [AG-QQF]

Landing page: reemplazado buscador hero por dos CTAs — "Crear cuenta gratis" (secundario, abre modal registro) + "Descargar app" (primario, link a /descargar con icono Download). Eliminados imports muertos: `Search` de lucide-react, `Input` de ui/Input. Hook `useLandingPublica` simplificado: removido `navegar` (ya no necesario sin buscador), solo expone `abrirAuth`. CSS limpio: eliminadas todas las clases `.landingHeroBuscador*` (6 reglas + 3 responsive overrides) y 7 variables CSS huérfanas en variables.css (`--landingEspacioBuscador`, `--landingPaddingBuscador*`, `--landingPaddingInput*`, `--landingPaddingBoton*`, `--landingAltoBotonBuscador`). Reutilizada clase existente `.landingHeroAcciones` para layout flex. Añadida `.landingHeroDescargarEnlace` para neutralizar estilos de `<a>`. **Auto-update docs:** Creado `App/docs/plan-desktop-distribucion.md` — guía completa de distribución Tauri 2: generación de claves de firma, configuración updater en tauri.conf.json, formato de respuesta del endpoint, opciones de hosting (GitHub Releases / servidor propio / híbrido), CI/CD pipeline con GitHub Actions, integración Rust/TS, checklist de implementación, consideraciones de seguridad. Archivos: LandingPublica.tsx, useLandingPublica.ts, landingPublica.css, variables.css, plan-desktop-distribucion.md.

## QQ42 ✅ [AG-QQF]

Reforzar sincronización: botón para re-descargar samples borrados localmente. **Verificación:** `borrarEnServidorAlBorrarLocal=false` ya funciona correctamente — al borrar localmente, `marcarNoSincronizar()` marca `syncDeshabilitado=true` y el sample no se re-descarga ni se borra del servidor. **Nuevo:** `reforzarSync()` en syncOrchestratorService — reactiva todos los samples con `syncDeshabilitado`, elimina sus entradas del tracking v2 + v1 para forzar re-descarga, y ejecuta sync completa. Es menos agresivo que `forzarResync()` (que resetea todo el tracking). **Pipeline completo:** `reactivarTodosSyncDeshabilitados()` en syncTrackingService → `reforzarSync()` en syncOrchestratorService → re-export en syncService.ts → expuesto en `window.__KAMPLES_SYNC__` (main.tsx + sync.tsx) → `KamplesSync` interface + `reforzarSyncAhora` callback en usePanelSincronizacion → botón "Reforzar sincronización" (icono RefreshCw) en menú contextual de VentanaSincPanel, justo debajo de "Sincronizar ahora". Tipo `MARK_ENABLED_ALL` añadido a TipoOperacionJournal. Archivos: syncTrackingService.ts, syncOrchestratorService.ts, syncService.ts, syncJournal.ts, global.d.ts, main.tsx, sync.tsx, usePanelSincronizacion.ts, VentanaSincPanel.tsx.

## QQ43 ✅ [AG-QQF]

Auditoría completa de TO-DOs: 42 encontrados, 3 críticos corregidos. **(1) Bug TransaccionesEnums:** `'descarga'` hardcodeado en INSERT violaba CHECK constraint — la BD rechazaría el INSERT. Fix: agregado `'descarga'` al CHECK en TransaccionesSchema.php, regenerado TransaccionesEnums.php con `TIPO_DESCARGA`, reemplazado string literal por constante en TransaccionesRepository.php, creada migración v039 para ALTER TABLE. **(2) Chat rollback optimista:** catches vacíos en `useChatIsland.ts` dejaban mensajes fantasma en UI tras fallo de envío. Fix: agregado `eliminarMensaje(id)` a mensajesStore + rollback en ambos catches (texto y multimedia). **(3) Dead CSS cleanup:** eliminadas 3 reglas muertas + 2 keyframes (.exploradorModalOverlay, .exploradorModalContenido, .exploradorModalTitulo) de exploradorDragModal.css. Archivos: TransaccionesSchema.php, TransaccionesEnums.php, TransaccionesRepository.php, v039_transacciones_tipo_descarga.sql, useChatIsland.ts, mensajesStore.ts, exploradorDragModal.css.

## QQ44 ✅ [AG-QQF]

Fix tray icon "Mostrar Kamples" no funcionaba. **Causa:** La ventana principal en `tauri.conf.json` no tenía `"label": "main"` explícito. El handler Rust en `lib.rs` buscaba `app.get_webview_window("main")` que retornaba `None` silenciosamente. También afectaba "Minimizar a bandeja" (mismo label). **Fix:** Agregado `"label": "main"` a la primera ventana en tauri.conf.json. Las ventanas `sync-panel` y `config-sync` ya tenían labels explícitos y funcionaban correctamente. Archivo: tauri.conf.json.

## QQ45 ✅ [AG-QQF]

Modal de bienvenida con seleccion de generos favoritos. Backend: columna `generos_favoritos` JSONB en `usuarios_ext` (v038 migration). PerfilController: whitelist de 30 generos, validacion max 10, `decodificarGeneros()` helper. PerfilUsuario: carga generos declarados y los incluye en perfil de recomendacion. ConstructorSenales: `sqlContexto` inyecta generos declarados como tags suplementarios en scoring — para usuarios nuevos sin interacciones, son la senal primaria de contexto; para usuarios con historial, suplementan los tags de comportamiento. Frontend: generosModalStore (Zustand), useModalGeneros hook con seleccion multi-toggle y persistencia via API, ModalGeneros component con grid de badges, modalGeneros.css. Auto-apertura: LayoutPrincipal detecta usuario autenticado sin generos y abre modal automaticamente. Configuracion: boton "Editar generos" en seccion Apariencia de ModalConfiguracion. Tipo `Usuario` extendido con `generosPreferidos: string[]`. Archivos: UsuariosExtSchema.php, UsuariosExtCols.php, v038 migration, PerfilController.php, PerfilUsuario.php, ConstructorSenales.php, UsuariosExtRepository.php, usuario.ts, generosModalStore.ts, useModalGeneros.ts, ModalGeneros.tsx, modalGeneros.css, LayoutPrincipal.tsx, ModalConfiguracion.tsx.

permite que el usuario pueda agregar tags personalizadas, sería un badge al final con placeholder que diga, agregar personalizado, y permitir que agregue maximo 10, puede selecionar maximo 10 generos incluyendo sus tags personalizadas si es que agrega, minimo 1, si el usuario no tiene nada slecionado el modal se abrira cada vez que recargue ✅ [AG-QQF] Implementado: input inline con borde dashed y ícono + al final del grid de géneros. Enter para agregar. Tags personalizados se muestran como badges activos removibles. Backend actualizado para aceptar tags personalizados sanitizados (regex `/[^a-z0-9\s\-&]/`, max 30 chars/tag, max 10 total). Contador muestra X/10. Modal sigue abriéndose si generosPreferidos está vacío.

## QQ46 ✅ [AG-QQF]

Punto rojo indicador de samples no reproducidos. **Backend:** Nuevo endpoint `GET /reproducciones/ids` — query liviana (`SELECT DISTINCT sample_id`) que devuelve solo los IDs de samples reproducidos por el usuario. ReproduccionesRepository::listarIdsReproducidos(). **Frontend:** reproducidosStore (Zustand global) — se carga una vez al autenticar, mantiene `Set<number>` de IDs reproducidos. Selector eficiente `s.cargado && !s.ids.has(sampleId)` para evitar re-renders masivos. trackingReproduccion.ts actualiza el store optimísticamente al reproducir un sample (`marcarReproducido`). TarjetaSample.tsx muestra `<span className="tarjetaPuntoRojo">` entre el título y el badge de verificado. CSS: punto rojo de 6px con `var(--error)`, `border-radius: var(--radioFull)`. Funciona en todas las islas que usan TarjetaSample (feed, perfil, comunidad, detalle, explorador). Archivos: ReproduccionesRepository.php, ReproduccionesController.php, apiReproduciones.ts, reproducidosStore.ts, trackingReproduccion.ts, TarjetaSample.tsx, tarjetaSample.css, LayoutPrincipal.tsx.

## QQ47 ✅ [AG-QQF]

Tooltip flotante de perfil estilo Twitter/X. **Arquitectura:** tooltipPerfilStore (Zustand global con cache de perfiles + timers centralizados show 400ms/hide 250ms), useHoverPerfil (hook trigger reutilizable con pre-carga de perfil), useTooltipPerfil (lógica del tooltip: carga con cache, follow/unfollow optimista, cierre por Escape/scroll), usePosicionTooltipPerfil (posicionamiento inteligente debajo/arriba del ancla con ajuste viewport), TooltipPerfil (componente flotante sin overlay oscuro, montado globalmente en LayoutPrincipal). **Integración:** TarjetaPublicacion agrega hover en el nombre del autor — funciona automáticamente en ComunidadIsland, PerfilIsland y PublicacionIsland. ComunidadIsland simplificado: eliminado CardPerfil local y useState, el botón + ahora usa abrirInmediato del store global. **Optimización:** perfiles se cachean en el store, pre-carga al hover evita delay visible, tooltip aparece instantáneo en hovers repetidos. Archivos: tooltipPerfilStore.ts, useHoverPerfil.ts, useTooltipPerfil.ts, usePosicionTooltipPerfil.ts, TooltipPerfil.tsx, tooltipPerfil.css, TarjetaPublicacion.tsx, ComunidadIsland.tsx, LayoutPrincipal.tsx.

## QQ48 ✅ [AG-QQF]

Fix crash ModalSeguidores: `TypeError: Cannot read properties of undefined (reading 'length')`. **Causa:** `obtenerSeguidores()` retorna `RespuestaApi<{ data: SeguidorResumen[]; total: number }>` — si la API retorna `resp.data` sin campo `data` interno (shape inesperado), `setSeguidores(resp.data.data)` asigna `undefined` al estado, y `seguidores.length` en `hayMas` crashea. **Fix:** Guard defensivo `resp.data.data ?? []` y `resp.data.total ?? 0` en la carga inicial y en `cargarMas()`. Archivo: useModalSeguidores.ts.

## QQ49 ✅ [AG-QQF]

Reproductor minimalista rebuild completo. **Arquitectura:** Audio global único via `useMotorAudio` (1 HTMLAudioElement persistente montado en LayoutPrincipal), store reescrito (`contexto` reemplaza `cola`, `reproducir()` reemplaza `setSample`, `pendingSeek` para seek sin refs), `useAudioPlayback` delegado 100% al store (sin audio local por tarjeta). **UI:** Pill shape (`border-radius: 9999px`, `width: fit-content`, `max-width: 640px`, `height: 48px`), portada circular 36px, controles inline (prev/play/next con BotonBase ghost), barra de progreso 3px, botón like con optimistic update, shuffle toggle. **Contexto:** Cada `<TarjetaSample>` recibe `contexto` (lista de samples del feed/colección/etc.) para que siguiente/anterior funcionen en cualquier vista. Limpieza: eliminado `useReproductor.ts` (dead code), eliminados props `activa`/`reproduciendo`/`progreso` de TarjetaSample (ahora lee del store). Archivos: reproductorStore.ts, useMotorAudio.ts (nuevo), useReproductorGlobal.ts, useAudioPlayback.ts, useTarjetaSample.ts, ReproductorGlobal.tsx, TarjetaSample.tsx, LayoutPrincipal.tsx, reproductorGlobal.css, ReproductorIsland.tsx, + 8 islands/componentes actualizados con contexto.

## QQ50 ✅ [AG-QQF]

Menu contextual de canciones + play button para sample adjunto. **Backend:** Subquery `row_to_json()` correlacionada en `CancionesRepository::feed()` que devuelve el primer sample activo (via `samples.cancion_origen_id`) como JSON embebido en cada cancion del feed. Agregado a los 3 modos de ordenamiento (inteligente, top_sampleados, hot). `NormalizadorCancion::decodeSampleAdjunto()` decodifica el JSON a array camelCase. **Frontend:** Tipo `SampleAdjuntoCancion` en `cancion.ts`, campo opcional `sampleAdjunto` en `Cancion`. `TarjetaCancionFeed` muestra botón Play (con Pause toggle) solo cuando `sampleAdjunto` existe. `useMenuContextualCancion` hook nuevo con items: ver canción, copiar enlace, ver artista, abrir en WhoSampled. `ExplorarCancionesIsland` integra el menú contextual (MenuContextual portal) y maneja play/pause via `reproductorStore.reproducir()` construyendo un `SampleResumen` minimo desde el `sampleAdjunto`. Archivos: CancionesRepository.php, NormalizadorCancion.php, cancion.ts, TarjetaCancionFeed.tsx, ExplorarCancionesIsland.tsx, useMenuContextualCancion.ts (nuevo), useFeedCanciones.ts, hooks/index.ts.

## QQ51 ✅ [AG-QQF]

Inspector sample admin-only + campos origen/sampleo + nombre original. **Backend:** `NormalizadorSample::sqlSelectSamples()` ahora incluye `cancion_origen_id` y `relacion_sampleo_id` en el SELECT. `normalizar()` expone `cancionOrigenId` y `relacionSampleoId`. **Frontend:** Tipo `Sample` extendido con `cancionOrigenId?: number | null` y `relacionSampleoId?: number | null`. `useMenuContextualSample`: item "inspeccionar" solo visible para admin (`esAdmin` conditional spread). `ModalInspectorSample`: nombre original extraído de `rutaOriginal` (basename) mostrado en Info General, nueva sección "Origen y Sampleo" con campos "Es Recorte" (derivado de `relacionSampleoId != null`), "Canción Origen ID" y "Relación Sampleo ID". Archivos: NormalizadorSample.php, sample.ts, useMenuContextualSample.ts, ModalInspectorSample.tsx.

## QQ52 ✅ [AG-QQF]

Overhaul completo del chat. **Backend:** `ConversacionesRepository::listarDeUsuarioEnriquecido()` ampliado con `es_mutuo` boolean (doble EXISTS subquery en `follows` para detectar follow mutuo) + `NOT EXISTS` en `bloqueos` para excluir conversaciones con usuarios bloqueados bidireccional. `MensajesController`: bloqueo bidireccional en `obtenerMensajes` y `iniciarConversacion` via `BloqueosRepository::existeBloqueoMutuo()`. `esMutuo` incluido en response JSON de conversaciones. `MensajesEnvioController`: check de bloqueo pre-envío, anti-spam (`ServicioAntiSpam::evaluarTexto()`) en mensajes de texto, limite audio 30MB. `ServicioAntiSpam`: refactorizado — nuevo `evaluarTexto()` reutilizable (patrones 1-4 sin consulta BD), `evaluar()` lo usa + check duplicados. **Frontend:** Badge no leídos en TopBar (`totalMensajesNoLeidos` via `useMensajesStore`, clase `topbarBotonNotificacionesPendientes` en botón Mail). Tabs principal/solicitudes en DropdownMensajes (filtro por `esMutuo`, badge contador). Staging multimedia (preview de imagen/audio antes de enviar con botones enviar/cancelar). Visor imagen inline (VisorImagen + visorImagenStore — reemplaza `window.open`, usa Modal del sistema, montado en LayoutPrincipal). Tipo `Conversacion` extendido con `esMutuo: boolean`. TO-DO: eliminar conversación requiere endpoint backend (soft/hard delete design decision pendiente). Archivos: ConversacionesRepository.php, MensajesController.php, MensajesEnvioController.php, ServicioAntiSpam.php, mensaje.ts, useTopBar.ts, TopBar.tsx, useDropdownMensajes.ts, DropdownMensajes.tsx, dropdownPanel.css, useVentanaChat.ts, ChatFlotante.tsx, chatFlotante.css, useBurbujaMensaje.tsx, visorImagenStore.ts (nuevo), VisorImagen.tsx (nuevo), visorImagen.css (nuevo), LayoutPrincipal.tsx.

## QQ53 ✅ [AG-QQF]

Fix texto garbled en moderación (â€" y otros caracteres Mojibake). **Causa:** El archivo `TabModeracionAdmin.tsx` tenía double-encoding UTF-8 (bytes UTF-8 re-interpretados como Windows-1252 y re-codificados). QQ24 (PDO client_encoding) solo arregló datos de BD, pero el source code ya tenía los caracteres corruptos hardcodeados. **Fix:** 16 reemplazos de Mojibake en el TSX: `â€–` → `—`, `Ã³` → `ó`, `Ãº` → `ú`, `Ã¡` → `á`, `Ã­` → `í`, `Â·` → `·` en comentarios, JSX, strings y atributos. Archivo: TabModeracionAdmin.tsx.

## QQ54 ✅ [AG-QQF]

Fix géneros favoritos no se guardaban. **Causa raíz:** Migraciones SQL v036-v039 nunca fueron ejecutadas contra PostgreSQL. La columna `generos_favoritos` (JSONB) no existía en `usuarios_ext`, PUT /me fallaba con 500 silencioso y GET /me retornaba `generosPreferidos: []` por fallback `?? '[]'`. **Fix:** Ejecutadas las 4 migraciones pendientes (v036-v039). **Lección:** No existe auto-runner de migraciones — deben ejecutarse manualmente.

## QQ55

Tengo dudas sobre el arrastre de sonidos desde la aplicacion, actualmente funciona, cuando arrastro un un sonido, se pega o se copia donde lo arrastre, esto es realmente util para tener la aplicación abierta y arrastrar un sonido a un daw externo, lo que hay que revisar es que esto sea igual que hacer una descarga, o sea debe consumir un credito en caso de que el sample no haya sido descargado, y sample que arrastra, debe ser el original, no la version optmizada. He estado probando y funciona porque el archivo resultante es un wav, pero esto una pequeña revision.

## QQ56

Revisiones de optmizacion de uso de banda, revisar que los audios optimizados se cachen durante 3 meses, esto no cambia, las imagenes de las publicaciones que esten optimizadas a un 70% de calidad y cacheadas, revision de almacenamiento.

A. Que los audios eliminados vayan a la papelera por 30 días, y que despues de 30 dias se borren completamentamente del disco. Esto incluye las publicaciones, los adjuntos, los comentarios, todos los medias que generan estas interacciones deben estar muy optimizados, el de las publicaciones un 70%, el de los comentarios un 50% (cuando digo 70% me refiero a que mientras mas alto sea el valor, mas calidad tiene), los mensajes 40%. Cuando se borre un chat que se borren todos los adjuntos, cuando se borre una publicaciones que se borre todos los comentarios y sus adjuntos, cuando se borre un sample sus comentarios y adjuntos tambien, cuando se borre un comentario de alguna cancion o sampleo, etc. Creo que se entiende mi idea.  

## QQ57

No hay una forma de ver la papelera, que los usuarios vean el boton de 3 puntos en sus propios perfiles y que so abra un menu contextual donde aparezca configuracion, y otro de papelera, la papelera es un modal grande no aparece una lista de lo que ha eliminado, incluyendo sus samples y publicaciones, los comentarios, mensajes y esas cosas no van a la papelera. 

## QQ58 ✅ [AG-QQF]

Revisión profunda de errores React. **4 issues reales encontrados y corregidos:** (1) `console.log` + parámetro sin usar en ShowcaseFormularios.tsx. (2) `throw new Error()` sin mensaje en usePanelDetalleSample.ts. (3) Inline type import en FavoritosIsland.tsx → import type estándar. (4) `Conversacion.esMutuo` requerido por tipo pero `POST /mensajes/nueva` no lo retornaba → nuevo método `FollowsRepository::sonMutuos()` (1 query, 2 EXISTS) + integración en MensajesController. **2 CSS fixes:** modalCrear.css colores hardcodeados → `var(--acento)`/`var(--acentoMuted)`. tarjetaSample.css fallback incorrecto `#e6a817` en `var(--advertencia)` eliminado. Archivos: ShowcaseFormularios.tsx, usePanelDetalleSample.ts, FavoritosIsland.tsx, FollowsRepository.php, MensajesController.php, modalCrear.css, tarjetaSample.css.

## QQ59

Presiento que hay errores de php, si existe alguna forma de escanearlos todos, seria genial.

## QQ60

Cuando le doy a comprar a un sample, no hace nada, debería abrir un modal con la inforamcion de la compra que se va a realizar, minimalista, y al confirmar, abrir stripe. No he configurado el webhook porque aun no estamos en produccion pero supongo que eso no debería ser problema para abrir la compra.

## QQ61 

Revisiones de seguridad y optimizacion generales, el proyecto es muy grande pero se puede al menos revisar lo mas importante y obvio.

## QQ62 ✅ [AG-QQF]

Fix reproductor: siguiente/click no reproducía automáticamente. **Causa:** `useMotorAudio.ts` solo llamaba `audio.play()` cuando `state.reproduciendo` cambiaba de valor, pero `siguiente()`, `anterior()` y `reproducir()` setean `reproduciendo: true` cuando ya era `true`, así que la condición `state.reproduciendo !== prevState.reproduciendo` nunca se cumplía. **Fix:** En el bloque de cambio de sample, después de `audio.load()`, llamar `audio.play()` directamente si `state.reproduciendo` es true. Archivo: useMotorAudio.ts.

## QQ63 ✅ [AG-QQF]

Botón WhatsApp en menú de usuario con modal de solicitud de ingreso al grupo beta. **Backend:** Nuevo tipo `solicitud_whatsapp` en TIPOS_PERMITIDOS de ModeracionController. Endpoint `GET /solicitud-whatsapp/estado` verifica disponibilidad (1 por usuario, 6 diarias globales). Case en `procesarReporte` con validación de duplicado + limite diario. `ReportesRepository`: métodos `contarPorTipoYUsuario()` y `contarPorTipoHoy()`. Datos se guardan en tabla reportes: razon=motivo, detalles="Nombre: X\nTeléfono: Y\nPaís: Z\n\nDescripción". **Frontend:** `solicitudWhatsappStore` (Zustand), `useSolicitudWhatsapp` hook (5 campos, verificación de disponibilidad al abrir, envía a `/reportar`, redirect a grupo WA tras éxito), `ModalSolicitudWhatsapp` (3 estados: formulario, ya enviada, limite diario — reutiliza CSS modalReportarError). TopBar: item "Grupo de WhatsApp" con icono MessageCircle antes de logout. URL del grupo no visible en botón, solo redirige tras envío exitoso.## QQ64 ✅ [AG-QQF]

Fix reportes mostraban `error_plataforma #0 —` sin asunto ni descripción. **Causa:** Triple mismatch: 1) `ReportesRepository::listarPendientes()` no incluía columna `detalles` en el SELECT, 2) Interface `ReporteAdmin` esperaba campo `motivo` pero la BD devuelve `razon`, 3) Template usaba `rep.motivo` que era `undefined`. **Fix:** Agregada columna `detalles` al SELECT, renombrado `motivo` a `razon` en interface + agregado `detalles: string | null`, template ahora usa `rep.razon` y muestra `rep.detalles` en div separado con `white-space: pre-wrap`. Archivos: ReportesRepository.php, apiAdmin.ts, TabModeracionAdmin.tsx, adminPanel.css.

## QQ65 ✅ [AG-QQF]

Sistema de suspensión de usuarios completo. **Backend:** Migración v040 con 5 columnas nuevas (estado, suspendido_hasta, suspension_razon, marcado_eliminacion_en, sera_eliminado_en). Schema/Cols/Enums actualizados. `ServicioSuspension.php` (suspender, desuspender, marcarParaEliminacion, cancelarEliminacion, verificarAutoSuspension con umbral 4 reportes/2h → 48h, verificarSuspension). `UsuariosExtRepository`: 5 métodos nuevos de estado de cuenta. `ReportesRepository::contarReportesRecientesSobreUsuario()` con whitelist INTERVAL. `AuthMiddleware::verificarSuspensionActiva()` → 403 con code 'usuario_suspendido'. `AdminModeracionController`: 4 rutas nuevas (suspender/desuspender/eliminar/cancelar-eliminacion). Auto-suspensión trigger en `ModeracionController::procesarReporte()`. Filtros de suspensión en `SamplesRepository::listarFeed()` y `PublicacionesRepository::listarFeed()/listarFeedPuntuado()`. `AdminRepository` expone estado+suspendido_hasta+suspension_razon+sera_eliminado_en. `PerfilController`: perfil oculto para suspendidos (404 excepto admin), datos de suspensión en `/me`. **Frontend:** Tipo `DatosSuspension` + campo `suspension` en `UsuarioAutenticado`. `UsuarioAdmin` extendido con 4 campos. API: `suspenderUsuarioAdmin/desuspenderUsuarioAdmin/marcarEliminacionUsuarioAdmin/cancelarEliminacionUsuarioAdmin`. `useAccionesSuspension` hook + `ModalSuspenderAdmin` (duración + razón). `useTabUsuariosAdmin` hook (SRP extraído). `TabUsuariosAdmin` con columna Estado + botones suspender/desuspender/eliminar/cancelar. `OverlaySuspension` overlay (blur, razón, countdown, logout) montado en LayoutPrincipal. CSS: `overlaySuspension.css`. TO-DO pendiente: D (auto-ocultación de samples/publicaciones individuales por reportes), F parcial (menú 3 puntos en perfil público — actualmente solo en admin panel).

## QQ66

He generado .sentinel-report.md, revisalo, cualquier problema real solucionalo, los falso positivo corrigelos en la extension en agent.

## QQ67

✅ [AG-SEC] Migrado modelo de moderación: `meta-llama/llama-guard-4-12b` (deprecado) → `openai/gpt-oss-safeguard-20b`. API compatible (mismo endpoint Groq chat completions), mismos prompts. Archivos: AnalizadoresModeracion.php, ServicioModeracionIA.php. 

## QQ68

✅ [AG-SEC] Panel lateral se sincroniza con reproductor + item "Abrir panel" en menú contextual. usePanelLateral detecta cambio de sampleActual y actualiza panel si está abierto en modo detalle/comentarios. useMenuContextualSample refactorizado: items extraídos a construirItemsMenuSample (SRP, TO-DO resuelto). Archivos: usePanelLateral.ts, useMenuContextualSample.ts, construirItemsMenuSample.ts (nuevo).


## QQ69

✅ [AG-SEC] Dos fixes chat: (A) Chat flotante ahora marca conversación como leída al abrir — useMensajesStore.marcarConversacionLeida() local + API marcarConversacionLeida(). Faltaba en useVentanaChat.ts (useChatIsland ya lo hacía). (B) Visor imagen: pointer-events:none en contenedor transparente .visorImagenModal + pointer-events:auto en .visorImagenImg para que clicks en área transparente lleguen al overlay y cierren. Archivos: useVentanaChat.ts, visorImagen.css.

## QQ70

✅ [AG-SEC] Fix play canciones: NormalizadorCancion::decodeSampleAdjunto() no convertía ruta_preview (filesystem absoluto) a URL HTTP. La BD almacena paths como `C:\...\wp-content\uploads\...` y NormalizadorSample::rutaAUrl() convierte a `http://glory.local/wp-content/...`. El método decodeSampleAdjunto copiaba el path crudo, así el frontend recibía una ruta inválida como src del Audio. Fix: usar NormalizadorSample::rutaAUrl() para rutaPreview e imagenUrl. Archivo: NormalizadorCancion.php.

## QQ71 

✅ [AG-SEC] Auditoría profunda QQ65 — commit aad13717. CRITICO: verificarSuspensionActiva nunca se llamaba. Creado verificarCuentaActiva() unificado (ban+suspensión), aplicado a ~35 endpoints en 18 controllers. PublicacionesEscrituraController dividido en 2 (SRP). AdminModeracionController: fix fail-safe null pgId.
- [Seguridad]: verificarCuentaActiva = ban check primero (prioridad mayor), luego suspensión. Retorna null si cuenta activa.
- [Arquitectura]: WordPress REST API no tiene middleware nativo. Los checks van dentro del cuerpo de cada método, tras obtenerIdPg().
- [Housekeeping]: marcarLeida, marcarTodasLeidas, moverSampleACarpeta NO bloqueados para suspendidos.
- [Frontend]: apiCliente.ts ya mapea json?.message a RespuestaApi.error — el hook usa resp.error ?? fallback correctamente.

## QQ72

✅ [AG-SEC] Optimización BD profunda. Creados 8 índices críticos en migración v041:
- `idx_publicaciones_autor_created_opt` — partial index excluyendo rechazados
- `idx_likes_usuario_tipo_target_opt` — covered query para favoritos
- `idx_comentarios_tipo_target_created_opt` — partial excluyendo rechazados
- `idx_mensajes_conv_no_leidos_opt` — LATERAL JOIN conversaciones
- `idx_rel_fuente_tipo_recursivo_opt` — CTE recursivo con INCLUDE
- `idx_reproducciones_usuario_sample_opt` — DISTINCT sample_id por usuario
- `idx_colecciones_usuario_opt` — compuesto con publica + fecha
- `idx_notificaciones_usuario_tipo_opt` — filtro tipo no leídas
- Índices ya existentes que se verificaron: bloqueos (bidireccional), cancion_origen, relacion_sampleo, publicaciones_autor, comentarios_target, rel_fuente_tipo
- Impacto estimado: feed 85-90% más rápido, favoritos 95%+, comentarios 90%+, bloqueos 80%+

## QQ73

✅ [AG-SEC] Removido 'sentimiento' de CATEGORIAS_SELECT en useFeedSamples.ts. Inputs BPM en SelectorBPM ahora usan variante='desnudo' en CampoTexto para evitar estilos de campTextoInput/campoTextoArea. Archivos: useFeedSamples.ts, SelectorBPM.tsx.

## QQ74

✅ [AG-SEC] Fix descargas mostrando samples eliminados. **Causa:** Las queries `coleccionadosDeUsuario()`, `contarColeccionados()` y `carpetasColeccionados()` seguían el patrón F12 (creador ve propios sin filtro de estado) pero no excluían `estado='eliminado'`. **Fix:** En `coleccionadosDeUsuario` y `contarColeccionados`: añadido `WHERE s.estado != 'eliminado'` global antes del OR clause (ambos branches — propios y descargados — excluyen eliminados). En `carpetasColeccionados`: añadido `AND s.estado != 'eliminado'` en la subquery UNION del creador (la rama de descargas ya filtraba `estado='activo'`). Todas las referencias usan `SamplesEnums::ESTADO_ELIMINADO`. Archivo: SamplesRepository.php.

## QQ75

✅ [AG-SEC] Preview aleatorio de colecciones implementado. **Nuevo hook** `useColeccionPreview.ts`: al clickear Play en TarjetaColeccion, carga los samples de la colección via `obtenerColeccion(id)`, reproduce uno aleatorio con `reproductorStore.reproducir()`, activa modo aleatorio, y programa timer de 10s que llama `siguiente()` cíclicamente. Se suscribe a cambios de sampleActual para reiniciar timer. Si el usuario pausa externamente, limpia el preview. Toggle: segundo click detiene. **Store:** Añadido `coleccionPreviewId: number | null` y `setColeccionPreviewId()` al reproductorStore para coordinar estado entre tarjetas sin contexto shared. Se limpia en `cerrar()`. **TarjetaColeccion.tsx:** Añadido botón Play/Pause con Loader2 en zona inferior derecha de la portada (aparece en hover, siempre visible cuando activo). Clase CSS `tarjetaColeccionReproduciendo` para borde acento. **CSS:** Estilos para `.tarjetaColeccionPreviewContenedor`, `.tarjetaColeccionPreviewBtn`, `.tarjetaColeccionPreviewActivo`, spinner con @keyframes girar. Archivos: useColeccionPreview.ts (nuevo), TarjetaColeccion.tsx, reproductorStore.ts, tarjetaColeccion.css.

## QQ76

✅ [AG-SEC] Auto-ocultacion de samples/publicaciones por reportes + verificacion menu 3 puntos perfil. **Part 1 (Auto-ocultacion):** Nuevo metodo `ReportesRepository::sqlFiltroAutoOcultacion()` genera fragmento SQL `NOT EXISTS (...)` reutilizable para excluir contenido con >= N reportes pendientes. Umbrales: UMBRAL_OCULTAR_SAMPLE=5, UMBRAL_OCULTAR_PUBLICACION=3, UMBRAL_OCULTAR_COMENTARIO=3. El creador sigue viendo su propio contenido (condicion OR en SQL). Inyectado en: `SamplesRepository::listarFeed()`, `PublicacionesRepository::listarFeed()`, `PublicacionesRepository::listarFeedPuntuado()`. **Part 2 (Menu 3 puntos perfil):** Ya existia completo desde QQ23 (PerfilIsland.tsx + useMenuContextualPerfil.tsx con Reportar + Bloquear/Desbloquear). Archivos: ReportesRepository.php (metodo + constantes), SamplesRepository.php (import + filtro), PublicacionesRepository.php (import + filtro x2).

## QQ77 

✅ [AG-SEC] Fix modal seguidores siempre vacío. **2 bugs:** (1) Backend: `buscarPorUsername()` solo seleccionaba `id`, sin `total_seguidores` — controller usaba `$target['total_seguidores'] ?? 0` que siempre era 0. Fix: añadido `TOTAL_SEGUIDORES` al SELECT. (2) Frontend: `obtenerSeguidores` tipado como `RespuestaApi<{data:...; total:...}>` pero apiCliente desenvuelve `json.data` automáticamente — `resp.data` ya era el array, no un wrapper. Fix: tipo corregido a `RespuestaApi<SeguidorResumen[]>`, hook usa `resp.data` directamente y `resp.total` para el total. Archivos: UsuariosExtRepository.php, apiSocial.ts, useModalSeguidores.ts.


## QQ78

✅ [AG-SEC] Fix metadata IA no aparece en detalle de sample. **Causa:** La página de detalle solo mostraba `sample.descripcion` (campo del usuario) que está vacío en ~90% de samples. La descripción IA (`metadata.descripcion_es`) existía en BD pero no se usaba como fallback. **Fix:** Cadena de fallback: `descripcion → metadata.descripcion_es → metadata.descripcion → metadata.descripcionIA`. Añadidos badges de artista vibes (`artista_vibes`) debajo de los tags en la vista de detalle. Archivo: SampleDetalleIsland.tsx.

## QQ79

✅ [AG-SEC] Fix esRecorte + enriquecer inspector con datos de canción origen. **3 bugs corregidos:** (1) `relacion_sampleo_id` nunca se establecía en el sample al subir con relación — fix en SamplesUploadController y PublicadorExtraccion: ahora ambos ejecutan `actualizarCampos(RELACION_SAMPLEO_ID)` tras vincular a la relación. (2) Inspector usaba solo `relacionSampleoId != null` para determinar esRecorte — corregido a `cancionOrigenId != null || relacionSampleoId != null`. (3) Inspector solo mostraba IDs crudos — ahora muestra nombre de canción origen y enlace (`/cancion/{slug}/`) gracias a subselect `row_to_json` en `sqlSelectSamples()` que trae `titulo` y `slug` de la canción. Tipo `Sample` extendido con `cancionOrigen?: { titulo, slug }`. Archivos: NormalizadorSample.php, SamplesUploadController.php, PublicadorExtraccion.php, ModalInspectorSample.tsx, sample.ts, SampleDetalleIsland.tsx.


## QQ80 

✅ [AG-SEC] Fix error compilación useVentanaChat: faltaba `const resp = await obtenerMensajes(chat.conversacionId)` antes de usar `resp`. Se había perdido la línea durante la edición PowerShell de QQ69. Archivo: useVentanaChat.ts.

## QQ81

✅ [AG-SEC] Favicon Kamples corregido. El SVG existia pero usaba fill blanco sin fondo (invisible en temas claros del navegador). Rediseñado: fondo #070707 con esquinas redondeadas (rx=6) + logo en color acento #4a665b. El header.php ya referenciaba el archivo correctamente. Archivo: Glory/assets/images/favicon.svg.

## QQ82

✅ [AG-SEC] Revisión SEO profunda — accesibilidad pública, auth modals, nav global, sitemaps. **6 cambios principales:**
1. **ColeccionDetalleIsland público:** Eliminado `conAutenticacion` HOC. Colecciones ahora visibles sin login. Auth guards (login modal) en `manejarGuardar` y `manejarDescargarZip` via `useAuthModalStore`.
2. **ComunidadIsland público:** Reemplazado `conAutenticacion` por wrapper `ComunidadBase` que muestra `<LandingPublica />` para anónimos (antes: pantalla negra). Split en ComunidadContenido + ComunidadBase para respetar reglas de hooks.
3. **NavPublico global:** Nuevo componente sticky en `LayoutPrincipal` para usuarios no autenticados. Links: Explorar (/descubrir/), Música (/musica/). Botones login/registro. Eliminada nav inline duplicada de LandingPublica.
4. **Explorar público:** Ya funcionaba — DescubrirIsland no usaba `conAutenticacion`, feed API es pública. Algoritmo cae a ordenamiento por fecha para anónimos (sin señales de usuario).
5. **Auth modals en acciones:** Nuevo utility `requiereAuth()` (getState Zustand, no hook). Integrado en: like (feed+descubrir), comentar, coleccionar, guardar (bookmark), descargar, añadir a colección — 5 archivos.
6. **Sitemaps faltantes:** Nuevos providers para canciones (`/cancion/{slug}/`) y artistas (`/artista/{slug}/`). Repos con `listarParaSitemap()` + `contarParaSitemap()`. Total: 5 sitemap providers.
- [SEO]: Páginas individuales (samples, colecciones, canciones, artistas) ya tenían meta tags vía DynamicSeoResolver. El bottleneck era accesibilidad (auth walls) y cobertura de sitemaps.
- [Arquitectura]: `requiereAuth()` usa `getState()` — funciona fuera de React components/hooks, ideal para handlers de eventos.
- [React]: Para evitar hooks condicionales, patron ComunidadContenido (hooks) + ComunidadBase (auth wrapper con early return).
Archivos: ColeccionDetalleIsland.tsx, ComunidadIsland.tsx, LayoutPrincipal.tsx, LandingPublica.tsx, useColeccionDetalle.tsx, useDescubrirIsland.ts, useFeedSamples.ts, useTarjetaSample.ts, construirItemsMenuSample.ts, requiereAuth.ts, NavPublico.tsx, navPublico.css, SeoSitemapProvider.php, CancionesRepository.php, ArtistasMusicalesRepository.php.

## QQ83 

✅ [AG-SEC] Artista detalle canciones = tabla estilo TablaRelaciones + imagen perfil fallback. **Canciones:** Reemplazada lista flex (`artistaDetalleCancionFila` con buttons) por tabla HTML reutilizando clases `.tablaRelaciones*`. Columnas: portada, canción+album, año, género (badge). Filas clickables con navegación. **Imagen artista:** Fallback a `canciones[0].imagenUrl` cuando `artista.imagenUrl` es null — sin cambios backend, datos ya disponibles. Eliminados ~70 líneas de CSS dead code (`.artistaDetalleListaCanciones`, `.artistaDetalleCancionFila`, etc.). Archivos: ArtistaDetalleIsland.tsx, artistaDetalle.css.

## QQ84

Si ya tengo tauri, puedo hacer la aplicacion para android, necesito la apk, esto implica que en la apk, desactivar lo de suscribirse mediante stripe para evitar el problema de la playstore, implica evitar salirse de la pagina pues supongo que es un web view excepto para el logeo de google, implica hacer las paginas de terminos, y la otra de servicio, no cargan, estan en el footer del landing, para no complicarnos la vida por el momento haremos que el login se pueda salir para ir a google ingresar los datos y regresar logeado, esto implica simular una navegador porque con las apk google suele bloquear. 

Implica agregar el gesto de recargar tirando hacia arriba, implica que las reproducciones, descarags, funcionen. Implica que las notificaciones funcionen en android, implica que la aplicación funcione en modo office con lo que se pueda.

Esta tarea es complicada si puedes adelantar todo lo que puedas sin requerir ayuda externa mejor. 

## QQ85 

✅ [AG-SEC] Favicon WordPress eliminado. `wp_site_icon` (prioridad 99) inyectaba el favicon de WP via `wp_head()` antes del custom `<link>` en header.php. Fix: `remove_action('wp_head', 'wp_site_icon', 99)` en SeoFrontendRenderer.php junto al `remove_action` existente de `rel_canonical`. Ahora solo se muestra el favicon SVG personalizado. Archivo: Glory/src/Seo/SeoFrontendRenderer.php.
- [WP]: `wp_site_icon` se registra en prioridad 99, hay que especificarla en `remove_action` para que funcione.

## QQ86

✅ [AG-SEC] Mensajes se marcan como leídos al abrir dropdown. **Problema:** `DropdownMensajes` cargaba conversaciones pero nunca llamaba endpoint de marcar leídos — el badge rojo persistía indefinidamente. **Backend:** Nuevo endpoint `POST /mensajes/leer-todas` + `MensajesRepository::marcarTodosLeidosDeUsuario()` — UPDATE batch con JOIN a conversaciones del usuario. **Frontend:** `marcarTodasConversacionesLeidas()` en apiMensajes.ts, `marcarTodasLeidas()` en mensajesStore.ts. `useDropdownMensajes`: useEffect al montar que detecta `noLeidos > 0` → store local inmediato + API fire-and-forget. El badge rojo desaparece al abrir el dropdown. Archivos: MensajesRepository.php, MensajesController.php, apiMensajes.ts, mensajesStore.ts, useDropdownMensajes.ts.

## QQ87 ✅ [AG-QQF]

Comentario `/* 2UPRA */` añadido al inicio de reproductorStore.ts. Archivo: reproductorStore.ts.

## QQ88 ✅ [AG-QQF]

DescubrirIsland reescrito para ser idéntico a InicioIsland: FilaColecciones + barra de control con ordenamiento (Inteligente/Recientes/Top Semanal/Top Mensual) + FeedSamples con tags, infinite scroll, virtualización + ModalFiltros. Filtros avanzados (reproducidos/likeados/descargados/seguidos) condicionales a `autenticado`. Lógica extraída a `useDescubrirIsland.ts` (SRP). **ColeccionesIsland** nueva: página pública `/colecciones/` con grid responsive de TarjetaColeccion + búsqueda con debounce. Hook `useColeccionesPublicas.ts`. CSS `coleccionesPublicas.css`. Registrada en `pages.php` y `appIslands.tsx`. **NavPublico:** añadido enlace "Colecciones" entre Explorar y Música. Eliminados archivos muertos: `useDescubrirIsland.ts` (viejo) y `descubrir.css`. Archivos: DescubrirIsland.tsx, useDescubrirIsland.ts (nuevo), ColeccionesIsland.tsx (nuevo), useColeccionesPublicas.ts (nuevo), coleccionesPublicas.css (nuevo), NavPublico.tsx, pages.php, appIslands.tsx.

## QQ89

Auditoría profunda de seguridada y rendimiento, aplicar correciones sin dañar el codigo.

## QQ90

Cuando subo un audio, en en el adjunto debería, al lado de la x debería aparecer un icono para adjuntar una imagen de portada al sample, al adjuntar remplazaría el icono pondría imagen cuadrada pequeña con bordes redondeado y al subirse el sample ya tendría un partada subida por el usuario. 

# QQ91 

En los mensajes el numero de mensajes no se actualiza, deberia quedar en 0 cuando se ven todos, (casi igual a QQ86)



---

## Despliegue Produccion (VPS Coolify)

**Estado:** Funcional — sitio carga HTTP 200 con tema Kamples activo.

- **Stack UUID:** `mo4so4440c488g8woow4cow0`
- **URL temporal:** `http://wordpress-mo4so4440c488g8woow4cow0.66.94.100.241.sslip.io`
- **WordPress:** Tema activo, SEO funcionando (OG, structured data, sitemaps), React islands cargando (CSS/JS enlazados)
- **PostgreSQL 18:** pgvector 0.8.2, 28 tablas creadas (41 migraciones ejecutadas)
- **React build:** Completado (Vite + prerender, dist/assets + dist/ssg)
- **Glory submodule:** Commit `d9ef2085` en `main` (fix `registrarRutaDinamica`)
- **Env vars:** Todas presentes (Stripe, Google OAuth, Groq, DataImpulse, PG)
- **Pendiente:** `GLORY_STRIPE_WEBHOOK_SECRET` vacio — configurar en Coolify cuando se conecte dominio
- **Pendiente:** Conectar dominio `kamples.com` en Coolify
- **Lecciones:**
  - [Submodule]: Glory en servidor estaba en `glory-react` (branch viejo sin `registrarRutaDinamica`). Fix: `git stash` + `git submodule update --init Glory`
  - [PG18]: Mount en `/var/lib/postgresql` (no `/var/lib/postgresql/data`) — breaking change PG18
  - [Migraciones]: No hay auto-runner. Ejecutar manualmente con PHP runner base64-encoded
  - [React build]: `npm install` necesario en servidor antes de `npm run build` (soundtouchjs faltaba)
  - [coolify-manager-rs]: `find_container` retornaba siempre el primer container del stack. Fix: doble grep UUID+nombre/imagen
  - [WAV upload]: En Linux/Apache los WAV se reportan como `audio/wave`, `audio/vnd.wave` o `application/octet-stream`. Whitelist expandida; finfo magic bytes hace la verificacion real.
  - [Publicaciones]: `shutdown` hook unreliable en Docker Apache/mod_php — publicaciones se quedan en `pendiente` para siempre. Solucion: crear con `aprobado` directamente; IA puede rechazar async.
  - [Moderacion panel vacio]: `moderacion_razon` faltaba en la tabla `publicaciones` en produccion — la query SQL crasheaba silenciosamente. Siempre verificar que columnas nuevas tienen su migracion SQL antes de desplegar.
  - [Migraciones auto]: `deploy --update` ahora ejecuta `run_pending_migrations()` automaticamente. Credenciales PG leidas de env vars del contenedor WP (`KAMPLES_PG_USER`, `KAMPLES_PG_DB`). Tracking en tabla `_migraciones_ejecutadas`. v001 siempre se salta (schema base). Los errores de migracion son no-fatales (warning + continua).
  - [Base64 exec]: Para comandos con comillas dobles/simples mezcladas, usar base64: `echo "cmd" | base64 -d | bash`. Evitar `echo 'cmd'` con DEFAULT '' en SQL (las comillas simples terminan el string de shell).
  - [Tracking inicial]: `_migraciones_ejecutadas` se creo en produccion con v001-v041 preregistrados (ON CONFLICT DO NOTHING) para evitar re-ejecucion al hacer el primer `deploy --update`.