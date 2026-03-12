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

## QQ36 

¿Porque cuando reproduzco los videos de youtube en los sampleos y canciones? dice 
Inicia sesión para confirmar que no eres un bot
De esta forma nos ayudas a proteger nuestra comunidad. Más información

en whosampled no pasa eso

si es porque estamos en local, lo entiendo, ignoralo pero si hay forma de arregalarlo, arreglalo.

## QQ37 ✅ [AG-QQF]

Resuelto por QQ28. El fix en `forzarResolucionDinamica()` auto-crea paginas WP faltantes (perfil, admin/panel, publicacion, etc.) cuando estan definidas en PageDefinition pero ausentes en BD. Cubre rutas dinamicas (/perfil/{username}) y estaticas (/admin/panel). Si la pagina se borra o no se sincronizo, se recrea al primer acceso con transient de 300s para evitar intentos repetidos. `crearPaginaDefinida()` ya maneja jerarquia padre/hijo (`asegurarPaginaPadre()` recursivo).

## QQ38 ✅ [AG-QQF]

Sistema de reportes centralizado. Un solo modal (ModalReportar), store (reportarStore), hook (useReportar) y endpoint backend (POST /reportar) para todos los tipos: usuario, publicacion, comentario, sample, error_plataforma. Backend: ModeracionController::reportarGenerico con validacion especifica por tipo (existencia, duplicados, rate limit). Frontend: reportarStore con tipo+targetId+targetNombre, ModalReportar adapta UI segun tipo. Eliminados: ModalReportarUsuario, ModalReportarError, reportarUsuarioStore, reportarErrorStore, useReportarUsuario, useReportarError. Migrados: useMenuContextualPerfil, useMenuContextualPublicacion (era window.prompt), useVentanaChat, useComentarioItem, useMenuContextualSample (tenia TO-DO), Sidebar, LayoutPrincipal.

## QQ39 ✅ [AG-QQF]

Tab de likes eliminado del perfil. Removido de `TABS_PERFIL`, eliminado estado `likesPerfil` y su API call (que usaba endpoint genérico como placeholder), simplificado `manejarLike` optimista a solo `samplesPerfil`. Import `Heart` limpiado de PerfilIsland. Archivos: usePerfilIsland.ts, PerfilIsland.tsx.

## QQ40 ✅ [AG-QQF]

Errores ortográficos corregidos + Google OAuth implementado. ModalAuth.tsx: 7 errores de ortografía corregidos (sesion→sesión, Contrasena→Contraseña, Registrate→Regístrate, signos de interrogación faltantes). Botón Google OAuth añadido a ambos formularios (login y registro) del modal. Backend: GoogleAuthController.php — endpoint POST /auth/google que recibe ID token de Google Identity Services, lo verifica server-side con oauth2.googleapis.com/tokeninfo (validación de aud, iss, email_verified, exp), crea o encuentra usuario WP por email, crea registro PG, actualiza avatar de Google si falta, genera JWT. Frontend: useGoogleAuth.ts hook que carga dinámicamente GSI script, inicializa con client_id de GLORY_CONTEXT, y dispara One Tap prompt. GoogleClientId inyectado en GLORY_CONTEXT desde config.php (.env). IconoGoogle.tsx componente SVG reutilizable (eliminado SVG duplicado en LoginIsland y RegistroIsland). loginConGoogle() en apiAuth.ts. AuthController.php refactorizado: helpers obtenerOCrearUsuarioPg/normalizarUsuario ahora public static (reutilizados por GoogleAuthController). AuthController 297 líneas (dentro del límite). Archivos: ModalAuth.tsx, authModal.css, useAuth.ts, useGoogleAuth.ts, IconoGoogle.tsx, apiAuth.ts, GoogleAuthController.php, AuthController.php, KamplesController.php, config.php, LoginIsland.tsx, RegistroIsland.tsx.

## QQ41 

Cambiar el buscador de inicio por un boton de registro secundario y otro primario de descargar, eso descargaría la aplicación.

Crea un md de como alojar la aplicación de forma de que se actualice en todos los usuarios, hacer lo necesario para que la autoactulización funcione, y como hacer el instalador ,etc.

## QQ42

verificar que el sync respete cuando  "Al borrar en local, borrar en el servidor" este desactivado para evitar perdida de datos. Cuando esto este desactivado, no vuelve a descargar los samples que se borraron en local. Implica agregar un boton de refozar sync en donde todos los samples que faltan se vuelven a descargar. El boton iría en el menu contexta, haria lo mismo que sicnronizar ahora pero con el agregado que fuerza descargar lo que falta. 

## QQ43

Verificar TO-DO sueltos en la aplicación y haz los que sean importantes.

## QQ44

La opción de mostrar kamples en el icono de bandeja de entrada en la aplicación no funciona, no vuelve a aparecer la aplicación, solo el sync

## QQ45 ✅ [AG-QQF]

Modal de bienvenida con seleccion de generos favoritos. Backend: columna `generos_favoritos` JSONB en `usuarios_ext` (v038 migration). PerfilController: whitelist de 30 generos, validacion max 10, `decodificarGeneros()` helper. PerfilUsuario: carga generos declarados y los incluye en perfil de recomendacion. ConstructorSenales: `sqlContexto` inyecta generos declarados como tags suplementarios en scoring — para usuarios nuevos sin interacciones, son la senal primaria de contexto; para usuarios con historial, suplementan los tags de comportamiento. Frontend: generosModalStore (Zustand), useModalGeneros hook con seleccion multi-toggle y persistencia via API, ModalGeneros component con grid de badges, modalGeneros.css. Auto-apertura: LayoutPrincipal detecta usuario autenticado sin generos y abre modal automaticamente. Configuracion: boton "Editar generos" en seccion Apariencia de ModalConfiguracion. Tipo `Usuario` extendido con `generosPreferidos: string[]`. Archivos: UsuariosExtSchema.php, UsuariosExtCols.php, v038 migration, PerfilController.php, PerfilUsuario.php, ConstructorSenales.php, UsuariosExtRepository.php, usuario.ts, generosModalStore.ts, useModalGeneros.ts, ModalGeneros.tsx, modalGeneros.css, LayoutPrincipal.tsx, ModalConfiguracion.tsx.

permite que el usuario pueda agregar tags personalizadas, sería un badge al final con placeholder que diga, agregar personalizado, y permitir que agregue maximo 10, puede selecionar maximo 10 generos incluyendo sus tags personalizadas si es que agrega, minimo 1, si el usuario no tiene nada slecionado el modal se abrira cada vez que recargue ✅ [AG-QQF] Implementado: input inline con borde dashed y ícono + al final del grid de géneros. Enter para agregar. Tags personalizados se muestran como badges activos removibles. Backend actualizado para aceptar tags personalizados sanitizados (regex `/[^a-z0-9\s\-&]/`, max 30 chars/tag, max 10 total). Contador muestra X/10. Modal sigue abriéndose si generosPreferidos está vacío.

## QQ46 ✅ [AG-QQF]

Punto rojo indicador de samples no reproducidos. **Backend:** Nuevo endpoint `GET /reproducciones/ids` — query liviana (`SELECT DISTINCT sample_id`) que devuelve solo los IDs de samples reproducidos por el usuario. ReproduccionesRepository::listarIdsReproducidos(). **Frontend:** reproducidosStore (Zustand global) — se carga una vez al autenticar, mantiene `Set<number>` de IDs reproducidos. Selector eficiente `s.cargado && !s.ids.has(sampleId)` para evitar re-renders masivos. trackingReproduccion.ts actualiza el store optimísticamente al reproducir un sample (`marcarReproducido`). TarjetaSample.tsx muestra `<span className="tarjetaPuntoRojo">` entre el título y el badge de verificado. CSS: punto rojo de 6px con `var(--error)`, `border-radius: var(--radioFull)`. Funciona en todas las islas que usan TarjetaSample (feed, perfil, comunidad, detalle, explorador). Archivos: ReproduccionesRepository.php, ReproduccionesController.php, apiReproduciones.ts, reproducidosStore.ts, trackingReproduccion.ts, TarjetaSample.tsx, tarjetaSample.css, LayoutPrincipal.tsx.

## QQ47 ✅ [AG-QQF]

Tooltip flotante de perfil estilo Twitter/X. **Arquitectura:** tooltipPerfilStore (Zustand global con cache de perfiles + timers centralizados show 400ms/hide 250ms), useHoverPerfil (hook trigger reutilizable con pre-carga de perfil), useTooltipPerfil (lógica del tooltip: carga con cache, follow/unfollow optimista, cierre por Escape/scroll), usePosicionTooltipPerfil (posicionamiento inteligente debajo/arriba del ancla con ajuste viewport), TooltipPerfil (componente flotante sin overlay oscuro, montado globalmente en LayoutPrincipal). **Integración:** TarjetaPublicacion agrega hover en el nombre del autor — funciona automáticamente en ComunidadIsland, PerfilIsland y PublicacionIsland. ComunidadIsland simplificado: eliminado CardPerfil local y useState, el botón + ahora usa abrirInmediato del store global. **Optimización:** perfiles se cachean en el store, pre-carga al hover evita delay visible, tooltip aparece instantáneo en hovers repetidos. Archivos: tooltipPerfilStore.ts, useHoverPerfil.ts, useTooltipPerfil.ts, usePosicionTooltipPerfil.ts, TooltipPerfil.tsx, tooltipPerfil.css, TarjetaPublicacion.tsx, ComunidadIsland.tsx, LayoutPrincipal.tsx.