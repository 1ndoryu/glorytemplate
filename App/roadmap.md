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

## Tareas nuevas a organizar, borrar esto despues de organizar

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

## QQ51

Asegurarse de que el nombre original del sample que se suba se guarda en la informacion del sample, esto tiene que salir en inspesionar sample, y la funcionalidad de inspesionar asegurarse que solo este disponible para admin. Tambien falta ciertas informaciones, no esta mostrando cosas como si es un recorte y la informacion de sampleo o cancion de origen si es que esta disponible esa info, etc.

## QQ52 

Cuando llegue un mensaje, chatFlotanteVentana tiene que abrirse automaticamente de la conversación, asegurarse de que el bloqueo funcionen, en ese contexto, sea, no poder recibir ni que aparezcan mensajes de usuarios bloqueados. Cuando recibo un mensaje el icono de mensaje no se pone rojo como el de notificaciones, además parece que los mensajes nunca se marcan como leidos en el modal, cuando seleciono un adjunto, este se envia automaticamente en vez de ponerse en el input para escribirse un mensaje del adjunto. Asegurarse de que haya rate limits para los mensajes, y una optimización muy agresiva para las imagenes, no permitir audios de max 30 mb, solo permitir imagenes y audios, agregar una detección de spam, agregar un tab al modal de principal y posible spam, donde todos los mensajes de usuarios que se siguen mutuamente llegan a principal y usuarios que no se siguen lleguen a posible spam, agregar un boton en la lista de chats (el modal) para poder realizar acciones, borrar, bloquear, reportar, ver perfil. Las imagenes de los chat tienen que abrirse como se abren las imagenes de las publicaciones y no en otra pestaña, los mensajes no funcionan en tiempo real, esperamos que cuando se despliegue en el vps, puedan funcionar en tiempo real, verifica en coolifiy manager (rust) va a poder correr lo que sea necesario para que los mensajes y notificaciones usen websocket 

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

## QQ58

Hay varios errores de react, revisa.

## QQ59

Presiento que hay errores de php, si existe alguna forma de escanearlos todos, seria genial.

## QQ60

Cuando le doy a comprar a un sample, no hace nada, debería abrir un modal con la inforamcion de la compra que se va a realizar, minimalista, y al confirmar, abrir stripe. No he configurado el webhook porque aun no estamos en produccion pero supongo que eso no debería ser problema para abrir la compra.

## QQ61 

Revisiones de seguridad y optimizacion generales, el proyecto es muy grande pero se puede al menos revisar lo mas importante y obvio.

## QQ62 ✅ [AG-QQF]

Fix reproductor: siguiente/click no reproducía automáticamente. **Causa:** `useMotorAudio.ts` solo llamaba `audio.play()` cuando `state.reproduciendo` cambiaba de valor, pero `siguiente()`, `anterior()` y `reproducir()` setean `reproduciendo: true` cuando ya era `true`, así que la condición `state.reproduciendo !== prevState.reproduciendo` nunca se cumplía. **Fix:** En el bloque de cambio de sample, después de `audio.load()`, llamar `audio.play()` directamente si `state.reproduciendo` es true. Archivo: useMotorAudio.ts.

## QQ63 

En el menu contextual de usuario donde aparece el logout, arruba de logut agregar un boton de whatsapp, esto hará que el usuario ingrese a https://chat.whatsapp.com/JOduGKvWGR9KbYfBS9BWGL en otra pestaña, sera el grupo del proyecto, pero antes, abrira un modal de solicitud, tiene que ser igual al modal de reporte, de hecho, para no complicarnso la vida utilizarmeos la misma logica de reporte, no repitas solo centraliza.

## QQ64

Envie un reporte pero sale asi

@admin
hace 0m
error_plataforma #0 —

no sale el asunto ni la descripcion.

# ANTES DE LA ULTIMA TAREA

Asegurarte de que todo los cambios se hayan subido, no importa que no sean tus cambios, haz commit de todo. Una vez que todo este asegurado. Haz una copia de seguirdad local del tema, en la misma carpeta de themes.

Cuandos tengas el respaldo de seguridad, ahora, lo que vas a hacer es que la rama main kamples, la vas a separar en repositorio individual, preservar todos los submodulos y todo igual, incluyendo el gitingore y todo eos, todos los subrepositorios que queden igual, solo es sacar la rama main-kamples a un repositorio independiente, en caso de que sea posible preservar todos los commit y esa informacion, genial, mi github es https://github.com/1ndoryu

Asegurarse de que el proyecto tenga una licencia fuerte, y cuando este separado en un repositorio independiente, configura style.css para que tema se llame kamples

## ULTIMA TAREA

Desplegar kamples en la vps con coolify manager rust (kamples.com)

Primero vamos ahorrarnos trabajo y asegurarnos de que los procesos de fondo scrapper, recortes, webhoock para los mensajes, notificaciones, los despliegues y todas estas cosas vayan a funcionar en linux, incluyendo la IA, la optización de audio, etc. Cuando hagas el despliegue, la url no funciona, coolify tiene un problema de que las url incialmente son de testeos, asi que no intentes empezar con kamples, deja que se cree la url temporal que genera coolify, entonces, cuando se suba todo, asegurate que haga el build automatico con cada update, que se selecione el tema glory template, instala el sitio con lo que suele pedir la instalacion para que tu mismo compruebues si corre, va a dar error, siempre da error, asi que activa el modo dev, no intentes ejecutar comandos desde coolify el powershell siempre tien probles con las comillas, la mejor opcion es crear los comandos en local y usar algun mecanimos para ejecutarlos en la vps 