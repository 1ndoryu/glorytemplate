/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Regenerar con: npx glory schema:generate */

export interface IAlgoritmoEstado {
  usuarioId: number
  cntLikes: number
  cntReproducciones: number
  cntCompletas: number
  cntDescargas: number
  cntFollows: number
  cntComentarios: number
  cntLikesPreciso: number
  cntReproduccionesPreciso: number
  cntCompletasPreciso: number
  cntDescargasPreciso: number
  cntFollowsPreciso: number
  cntComentariosPreciso: number
  ultimoRapido: string
  ultimoPreciso: string
  ultimaActividad: string
  versionPerfil: number
}

export interface IArticulosLikes {
  usuarioId: number
  articuloId: number
  createdAt: string
}

export interface IArticulos {
  id: number
  autorId: number
  titulo: string
  slug: string
  contenido: string
  extracto: string
  portadaUrl: string | null
  categoria: 'inspiracion' | 'mastering' | 'mezcla' | 'promocion-musical' | 'teoria-musical' | 'grabacion' | 'sampling' | 'diseno-sonoro' | 'herramientas' | 'ableton-live' | 'bitwig-studio' | 'cubase' | 'fl-studio' | 'garageband' | 'logic-pro' | 'pro-tools' | 'studio-one' | 'drops-gratis' | 'midi-gratis' | 'plugins-gratis' | 'presets-gratis' | 'proyectos-gratis' | 'sonidos-gratis' | 'entrevistas' | 'destacados' | 'noticias'
  embeds: Record<string, unknown>
  descargaPublica: boolean
  totalLikes: number
  totalComentarios: number
  moderacionEstado: 'pendiente' | 'revision' | 'aprobado' | 'rechazado'
  moderacionRazon: string | null
  createdAt: string
  updatedAt: string
  publicadoEn: string | null
  eliminadoEn: string | null
}

export interface IArtistasMusicales {
  id: number
  nombre: string
  slug: string
  imagenUrl: string | null
  whosampledSlug: string | null
  musicbrainzId: string | null
  metadata: Record<string, unknown>
  totalCanciones: number
  prioridad: number
  createdAt: string
  updatedAt: string
}

export interface IBloqueo {
  id: number
  bloqueadorId: number
  bloqueadoId: number
  razon: string
  createdAt: string
}

export interface ICancionesArtistas {
  cancionId: number
  artistaId: number
  rol: 'principal' | 'featuring' | 'producer'
}

export interface ICanciones {
  id: number
  titulo: string
  slug: string
  artistaId: number
  album: string | null
  sello: string | null
  anio: number | null
  duracionSegundos: number | null
  genero: string | null
  youtubeId: string | null
  spotifyId: string | null
  imagenUrl: string | null
  whosampledUrl: string | null
  bpm: number | null
  tonalidad: string | null
  metadata: Record<string, unknown>
  totalSampleada: number
  totalSamplea: number
  totalLikes: number
  totalComentarios: number
  createdAt: string
  updatedAt: string
}

export interface IColaExtraccionSamples {
  id: number
  relacionId: number
  youtubeId: string | null
  timingInicioSeg: number
  bpmDetectado: number | null
  duracionCompasSeg: number | null
  compasInicioSeg: number | null
  compasFinSeg: number | null
  estado: 'pendiente' | 'descargando' | 'analizando' | 'recortando' | 'extraido' | 'completado' | 'error' | 'revision_humana' | 'unificado'
  sampleId: number | null
  errorMensaje: string | null
  intentos: number
  procesadoAt: string | null
  createdAt: string
  lado: 'fuente' | 'destino'
  spotifyId: string | null
  rutaAudioExtraido: string | null
  rutaAudioCompleto: string | null
  metadataExtraccion: Record<string, unknown> | null
  proximoIntentoAt: string | null
}

export interface IColaProcesamientoIa {
  id: number
  tipo: 'sample' | 'comentario' | 'publicacion'
  entidadId: number
  operacion: 'analisis_audio' | 'moderacion_texto' | 'moderacion_imagen' | 'moderacion_completa'
  estado: 'pendiente' | 'procesando' | 'completado' | 'error_reintento' | 'error_final'
  intentos: number
  maxIntentos: number
  ultimoError: string | null
  proximoIntento: string | null
  metadata: Record<string, unknown>
  procesadoAt: string | null
  createdAt: string
}

export interface IColeccionesGuardadas {
  id: unknown
  usuarioId: number
  coleccionId: number
  createdAt: string
}

export interface IColeccionesLikes {
  id: number
  usuarioId: number
  coleccionId: number
  createdAt: string
}

export interface IColecciones {
  id: number
  usuarioId: number
  parentId: number | null
  nombre: string
  slug: string | null
  descripcion: string
  imagenUrl: string | null
  publica: boolean
  totalSamples: number
  createdAt: string
  updatedAt: string
  portadaUrl: string | null
  version: number
}

export interface IColeccionSamples {
  coleccionId: number
  sampleId: number
  usuarioId: number
  posicion: number
  addedAt: string
}

export interface IComentarios {
  id: number
  autorId: number
  tipo: 'sample' | 'publicacion' | 'cancion' | 'relacion' | 'articulo'
  targetId: number
  contenido: string | null
  createdAt: string
  tipoContenido: 'texto' | 'imagen' | 'audio'
  mediaUrl: string | null
  mediaMetadata: Record<string, unknown> | null
  moderacionEstado: 'pendiente' | 'revision' | 'aprobado' | 'rechazado'
  moderacionDetalle: Record<string, unknown>
  parentId: number | null
  totalRespuestas: number
  totalLikes: number
  updatedAt: string | null
}

export interface IContribucionesPendientes {
  id: number
  contribuidorId: number
  cancionDestinoId: number | null
  cancionFuenteId: number | null
  cancionNuevaTitulo: string | null
  cancionNuevaArtista: string | null
  cancionNuevaYoutubeUrl: string | null
  cancionNuevaLado: 'destino' | 'fuente' | null
  tipoRelacion: 'sample' | 'cover' | 'remix' | 'interpolation'
  tipoElemento: 'hook_riff' | 'vocals_lyrics' | 'drums' | 'bass' | 'keys_synth' | 'sound_effect' | 'multiple_elements' | 'other'
  estado: 'pendiente' | 'aprobada' | 'rechazada'
  moderadorId: number | null
  moderadorNota: string | null
  relacionCreadaId: number | null
  relacionExistenteId: number | null
  tipoContribucion: 'nueva' | 'edicion' | 'eliminacion'
  cambiosPropuestos: Record<string, unknown> | null
  createdAt: string
  resueltoAt: string | null
}

export interface IConversaciones {
  id: number
  aceptada: boolean
  ultimoMensajeAt: string
  createdAt: string
}

export interface IDescargas {
  id: number
  usuarioId: number
  sampleId: number
  calidad: string
  createdAt: string
  tamanoBytes: number
}

export interface IDuplicadosPendientes {
  id: unknown
  sampleOriginalId: number
  sampleDuplicadoId: number
  tipo: unknown
  estado: unknown
  resueltoPor: number | null
  resueltoAt: string | null
  notas: string | null
  createdAt: string
}

export interface IFollows {
  seguidorId: number
  seguidoId: number
  createdAt: string
}

export interface ILikes {
  usuarioId: number
  tipo: 'sample' | 'publicacion' | 'comentario' | 'cancion' | 'relacion'
  targetId: number
  createdAt: string
  reaccion: 'like' | 'dislike' | 'encanta'
}

export interface IMensajes {
  id: number
  conversacionId: number
  autorId: number
  contenido: string
  leido: boolean
  createdAt: string
  tipo: string
  mediaUrl: string | null
  mediaMetadata: Record<string, unknown> | null
}

export interface INotificaciones {
  id: number
  usuarioId: number
  tipo: string
  titulo: string | null
  mensaje: string
  leida: boolean
  enlace: string | null
  actorId: number | null
  createdAt: string
  datos: Record<string, unknown>
}

export interface IPublicaciones {
  id: number
  autorId: number
  tipo: 'social' | 'sample'
  contenido: string
  imagenes: string[]
  samplesAdjuntos: string[]
  totalLikes: number
  totalComentarios: number
  totalReposts: number
  createdAt: string
  repostId: number | null
  imagenesMetadata: Record<string, unknown>
  moderacionEstado: 'pendiente' | 'revision' | 'aprobado' | 'rechazado'
  moderacionDetalle: Record<string, unknown>
  moderacionRazon: string | null
  updatedAt: string
  eliminadoEn: string | null
}

export interface IPushSubscriptions {
  id: number
  usuarioId: number
  endpoint: string
  auth: string
  plataforma: string
  activa: boolean
  createdAt: string
  updatedAt: string
}

export interface IRelacionesSample {
  id: number
  cancionDestinoId: number
  cancionFuenteId: number
  whosampledId: number | null
  tipoRelacion: 'sample' | 'cover' | 'remix' | 'interpolation'
  tipoElemento: 'hook_riff' | 'vocals_lyrics' | 'drums' | 'bass' | 'keys_synth' | 'sound_effect' | 'multiple_elements' | 'other'
  timingsDestino: Record<string, unknown>
  timingsFuente: Record<string, unknown>
  apareceEnTodo: boolean
  sampleId: number | null
  sampleFuenteId: number | null
  sampleDestinoId: number | null
  votosTotal: number
  votosPromedio: number
  fuente: 'scraping' | 'comunidad' | 'musicbrainz' | 'import'
  contribuidorId: number | null
  verificada: boolean
  totalLikes: number
  totalComentarios: number
  createdAt: string
  updatedAt: string
}

export interface IReportesDuplicados {
  id: number
  sampleOriginalId: number
  sampleDuplicadoId: number
  reportadorId: number
  estado: 'reportado' | 'en_revision' | 'resuelto' | 'rechazado'
  pruebasTexto: string
  resueltoAt: string | null
  createdAt: string
}

export interface IReportes {
  id: number
  tipo: 'usuario' | 'publicacion' | 'comentario' | 'sample' | 'error_plataforma' | 'solicitud_whatsapp' | 'legal'
  targetId: number
  reportadorId: number
  reportadoId: number | null
  razon: string
  detalles: string | null
  estado: 'pendiente' | 'resuelto' | 'descartado'
  resueltoPor: number | null
  resueltoAt: string | null
  createdAt: string
}

export interface IReproducciones {
  id: number
  usuarioId: number | null
  sampleId: number
  duracionEscuchada: number
  completada: boolean
  createdAt: string
}

export interface ISamples {
  id: number
  creadorId: number
  titulo: string
  slug: string
  descripcion: string
  bpm: number | null
  key: string | null
  escala: string | null
  duracion: number
  formato: string
  tamano: number
  metadata: Record<string, unknown>
  tags: string[]
  estado: 'procesando' | 'activo' | 'inactivo' | 'eliminado' | 'en_supervision'
  tipo: 'loop' | 'oneshot'
  esPremium: boolean
  precio: number | null
  rutaOriginal: string | null
  rutaOptimizada: string | null
  rutaPreview: string | null
  rutaWaveform: string | null
  imagenUrl: string | null
  embedding: number[] | null
  totalDescargas: number
  totalLikes: number
  totalReproducciones: number
  publicadoAt: string | null
  createdAt: string
  updatedAt: string
  idCorto: string | null
  permitirDescarga: boolean
  licenciaLibre: boolean
  audioHash: string | null
  hashParcial: string | null
  totalComentarios: number
  verificado: boolean
  mostrarEnComunidad: boolean
  cancionOrigenId: number | null
  relacionSampleoId: number | null
  eliminadoEn: string | null
}

export interface IScrapingLog {
  id: number
  url: string
  tipoPagina: 'hot_samples' | 'hot_covers' | 'hot_remixes' | 'sample_detail' | 'cover_detail' | 'remix_detail' | 'artist' | 'track' | 'track_samples' | 'track_sampled' | 'browse_year' | 'browse_genre'
  estado: 'pendiente' | 'procesado' | 'error' | 'skip'
  intentos: number
  bytesDescargados: number
  errorMensaje: string | null
  reScrapeable: boolean
  proximoRescrape: string | null
  vecesRescrapeado: number
  procesadoAt: string | null
  createdAt: string
}

export interface ISuscripciones {
  id: number
  usuarioId: number
  plan: string
  estado: 'activa' | 'cancelada' | 'vencida' | 'periodo_prueba'
  stripeSubscriptionId: string | null
  inicioAt: string | null
  finAt: string | null
  createdAt: string
}

export interface ISyncChangelog {
  id: number
  usuarioId: number
  tipo: 'sample_added' | 'sample_removed' | 'sample_updated' | 'collection_created' | 'collection_renamed' | 'collection_deleted' | 'collection_merged'
  entidadId: number
  metadata: Record<string, unknown>
  createdAt: string
}

export interface ITransacciones {
  id: number
  compradorId: number
  creadorId: number | null
  sampleId: number | null
  tipo: 'suscripcion' | 'compra_sample' | 'payout' | 'descarga'
  monto: number
  moneda: string
  estado: 'completada' | 'completed' | 'pendiente' | 'fallida' | 'reembolsada'
  stripePaymentId: string | null
  createdAt: string
  pagoCreador: number
  comisionPlataforma: number
}

export interface IUsuariosExt {
  id: number
  wpUserId: number
  username: string
  email: string | null
  nombreVisible: string
  bio: string
  avatarUrl: string | null
  portadaUrl: string | null
  plan: 'free' | 'pro' | 'premium'
  rol: 'usuario' | 'creador' | 'admin'
  verificado: boolean
  totalSeguidores: number
  totalSeguidos: number
  totalSamples: number
  totalDescargas: number
  stripeCustomerId: string | null
  stripeConnectId: string | null
  createdAt: string
  updatedAt: string
  violacionesModeracion: number
  baneadoHasta: string | null
  banRazon: string | null
  creditosBonus: number
  stripeSubscriptionId: string | null
  esSeed: boolean
  sitioWeb: string | null
  generosFavoritos: Record<string, unknown>
  estado: 'activo' | 'suspendido' | 'en_eliminacion'
  suspendidoHasta: string | null
  suspensionRazon: string | null
  marcadoEliminacionEn: string | null
  seraEliminadoEn: string | null
  registroIp: string | null
  paypalEmail: string | null
}

/* Constantes de columna (mirror de PHP) */
export const AlgoritmoEstadoCols = {
  TABLA: 'algoritmo_estado',
  USUARIO_ID: 'usuario_id',
  CNT_LIKES: 'cnt_likes',
  CNT_REPRODUCCIONES: 'cnt_reproducciones',
  CNT_COMPLETAS: 'cnt_completas',
  CNT_DESCARGAS: 'cnt_descargas',
  CNT_FOLLOWS: 'cnt_follows',
  CNT_COMENTARIOS: 'cnt_comentarios',
  CNT_LIKES_PRECISO: 'cnt_likes_preciso',
  CNT_REPRODUCCIONES_PRECISO: 'cnt_reproducciones_preciso',
  CNT_COMPLETAS_PRECISO: 'cnt_completas_preciso',
  CNT_DESCARGAS_PRECISO: 'cnt_descargas_preciso',
  CNT_FOLLOWS_PRECISO: 'cnt_follows_preciso',
  CNT_COMENTARIOS_PRECISO: 'cnt_comentarios_preciso',
  ULTIMO_RAPIDO: 'ultimo_rapido',
  ULTIMO_PRECISO: 'ultimo_preciso',
  ULTIMA_ACTIVIDAD: 'ultima_actividad',
  VERSION_PERFIL: 'version_perfil'
} as const

export const ArticulosLikesCols = {
  TABLA: 'articulos_likes',
  USUARIO_ID: 'usuario_id',
  ARTICULO_ID: 'articulo_id',
  CREATED_AT: 'created_at'
} as const

export const ArticulosCols = {
  TABLA: 'articulos',
  ID: 'id',
  AUTOR_ID: 'autor_id',
  TITULO: 'titulo',
  SLUG: 'slug',
  CONTENIDO: 'contenido',
  EXTRACTO: 'extracto',
  PORTADA_URL: 'portada_url',
  CATEGORIA: 'categoria',
  EMBEDS: 'embeds',
  DESCARGA_PUBLICA: 'descarga_publica',
  TOTAL_LIKES: 'total_likes',
  TOTAL_COMENTARIOS: 'total_comentarios',
  MODERACION_ESTADO: 'moderacion_estado',
  MODERACION_RAZON: 'moderacion_razon',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  PUBLICADO_EN: 'publicado_en',
  ELIMINADO_EN: 'eliminado_en'
} as const

export const ArtistasMusicalesCols = {
  TABLA: 'artistas_musicales',
  ID: 'id',
  NOMBRE: 'nombre',
  SLUG: 'slug',
  IMAGEN_URL: 'imagen_url',
  WHOSAMPLED_SLUG: 'whosampled_slug',
  MUSICBRAINZ_ID: 'musicbrainz_id',
  METADATA: 'metadata',
  TOTAL_CANCIONES: 'total_canciones',
  PRIORIDAD: 'prioridad',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
} as const

export const BloqueoCols = {
  TABLA: 'bloqueos',
  ID: 'id',
  BLOQUEADOR_ID: 'bloqueador_id',
  BLOQUEADO_ID: 'bloqueado_id',
  RAZON: 'razon',
  CREATED_AT: 'created_at'
} as const

export const CancionesArtistasCols = {
  TABLA: 'canciones_artistas',
  CANCION_ID: 'cancion_id',
  ARTISTA_ID: 'artista_id',
  ROL: 'rol'
} as const

export const CancionesCols = {
  TABLA: 'canciones',
  ID: 'id',
  TITULO: 'titulo',
  SLUG: 'slug',
  ARTISTA_ID: 'artista_id',
  ALBUM: 'album',
  SELLO: 'sello',
  ANIO: 'anio',
  DURACION_SEGUNDOS: 'duracion_segundos',
  GENERO: 'genero',
  YOUTUBE_ID: 'youtube_id',
  SPOTIFY_ID: 'spotify_id',
  IMAGEN_URL: 'imagen_url',
  WHOSAMPLED_URL: 'whosampled_url',
  BPM: 'bpm',
  TONALIDAD: 'tonalidad',
  METADATA: 'metadata',
  TOTAL_SAMPLEADA: 'total_sampleada',
  TOTAL_SAMPLEA: 'total_samplea',
  TOTAL_LIKES: 'total_likes',
  TOTAL_COMENTARIOS: 'total_comentarios',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
} as const

export const ColaExtraccionSamplesCols = {
  TABLA: 'cola_extraccion_samples',
  ID: 'id',
  RELACION_ID: 'relacion_id',
  YOUTUBE_ID: 'youtube_id',
  TIMING_INICIO_SEG: 'timing_inicio_seg',
  BPM_DETECTADO: 'bpm_detectado',
  DURACION_COMPAS_SEG: 'duracion_compas_seg',
  COMPAS_INICIO_SEG: 'compas_inicio_seg',
  COMPAS_FIN_SEG: 'compas_fin_seg',
  ESTADO: 'estado',
  SAMPLE_ID: 'sample_id',
  ERROR_MENSAJE: 'error_mensaje',
  INTENTOS: 'intentos',
  PROCESADO_AT: 'procesado_at',
  CREATED_AT: 'created_at',
  LADO: 'lado',
  SPOTIFY_ID: 'spotify_id',
  RUTA_AUDIO_EXTRAIDO: 'ruta_audio_extraido',
  RUTA_AUDIO_COMPLETO: 'ruta_audio_completo',
  METADATA_EXTRACCION: 'metadata_extraccion',
  PROXIMO_INTENTO_AT: 'proximo_intento_at'
} as const

export const ColaProcesamientoIaCols = {
  TABLA: 'cola_procesamiento_ia',
  ID: 'id',
  TIPO: 'tipo',
  ENTIDAD_ID: 'entidad_id',
  OPERACION: 'operacion',
  ESTADO: 'estado',
  INTENTOS: 'intentos',
  MAX_INTENTOS: 'max_intentos',
  ULTIMO_ERROR: 'ultimo_error',
  PROXIMO_INTENTO: 'proximo_intento',
  METADATA: 'metadata',
  PROCESADO_AT: 'procesado_at',
  CREATED_AT: 'created_at'
} as const

export const ColeccionesGuardadasCols = {
  TABLA: 'colecciones_guardadas',
  ID: 'id',
  USUARIO_ID: 'usuario_id',
  COLECCION_ID: 'coleccion_id',
  CREATED_AT: 'created_at'
} as const

export const ColeccionesLikesCols = {
  TABLA: 'colecciones_likes',
  ID: 'id',
  USUARIO_ID: 'usuario_id',
  COLECCION_ID: 'coleccion_id',
  CREATED_AT: 'created_at'
} as const

export const ColeccionesCols = {
  TABLA: 'colecciones',
  ID: 'id',
  USUARIO_ID: 'usuario_id',
  PARENT_ID: 'parent_id',
  NOMBRE: 'nombre',
  SLUG: 'slug',
  DESCRIPCION: 'descripcion',
  IMAGEN_URL: 'imagen_url',
  PUBLICA: 'publica',
  TOTAL_SAMPLES: 'total_samples',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  PORTADA_URL: 'portada_url',
  VERSION: 'version'
} as const

export const ColeccionSamplesCols = {
  TABLA: 'coleccion_samples',
  COLECCION_ID: 'coleccion_id',
  SAMPLE_ID: 'sample_id',
  USUARIO_ID: 'usuario_id',
  POSICION: 'posicion',
  ADDED_AT: 'added_at'
} as const

export const ComentariosCols = {
  TABLA: 'comentarios',
  ID: 'id',
  AUTOR_ID: 'autor_id',
  TIPO: 'tipo',
  TARGET_ID: 'target_id',
  CONTENIDO: 'contenido',
  CREATED_AT: 'created_at',
  TIPO_CONTENIDO: 'tipo_contenido',
  MEDIA_URL: 'media_url',
  MEDIA_METADATA: 'media_metadata',
  MODERACION_ESTADO: 'moderacion_estado',
  MODERACION_DETALLE: 'moderacion_detalle',
  PARENT_ID: 'parent_id',
  TOTAL_RESPUESTAS: 'total_respuestas',
  TOTAL_LIKES: 'total_likes',
  UPDATED_AT: 'updated_at'
} as const

export const ContribucionesPendientesCols = {
  TABLA: 'contribuciones_pendientes',
  ID: 'id',
  CONTRIBUIDOR_ID: 'contribuidor_id',
  CANCION_DESTINO_ID: 'cancion_destino_id',
  CANCION_FUENTE_ID: 'cancion_fuente_id',
  CANCION_NUEVA_TITULO: 'cancion_nueva_titulo',
  CANCION_NUEVA_ARTISTA: 'cancion_nueva_artista',
  CANCION_NUEVA_YOUTUBE_URL: 'cancion_nueva_youtube_url',
  CANCION_NUEVA_LADO: 'cancion_nueva_lado',
  TIPO_RELACION: 'tipo_relacion',
  TIPO_ELEMENTO: 'tipo_elemento',
  ESTADO: 'estado',
  MODERADOR_ID: 'moderador_id',
  MODERADOR_NOTA: 'moderador_nota',
  RELACION_CREADA_ID: 'relacion_creada_id',
  RELACION_EXISTENTE_ID: 'relacion_existente_id',
  TIPO_CONTRIBUCION: 'tipo_contribucion',
  CAMBIOS_PROPUESTOS: 'cambios_propuestos',
  CREATED_AT: 'created_at',
  RESUELTO_AT: 'resuelto_at'
} as const

export const ConversacionesCols = {
  TABLA: 'conversaciones',
  ID: 'id',
  ACEPTADA: 'aceptada',
  ULTIMO_MENSAJE_AT: 'ultimo_mensaje_at',
  CREATED_AT: 'created_at'
} as const

export const DescargasCols = {
  TABLA: 'descargas',
  ID: 'id',
  USUARIO_ID: 'usuario_id',
  SAMPLE_ID: 'sample_id',
  CALIDAD: 'calidad',
  CREATED_AT: 'created_at',
  TAMANO_BYTES: 'tamano_bytes'
} as const

export const DuplicadosPendientesCols = {
  TABLA: 'duplicados_pendientes',
  ID: 'id',
  SAMPLE_ORIGINAL_ID: 'sample_original_id',
  SAMPLE_DUPLICADO_ID: 'sample_duplicado_id',
  TIPO: 'tipo',
  ESTADO: 'estado',
  RESUELTO_POR: 'resuelto_por',
  RESUELTO_AT: 'resuelto_at',
  NOTAS: 'notas',
  CREATED_AT: 'created_at'
} as const

export const FollowsCols = {
  TABLA: 'follows',
  SEGUIDOR_ID: 'seguidor_id',
  SEGUIDO_ID: 'seguido_id',
  CREATED_AT: 'created_at'
} as const

export const LikesCols = {
  TABLA: 'likes',
  USUARIO_ID: 'usuario_id',
  TIPO: 'tipo',
  TARGET_ID: 'target_id',
  CREATED_AT: 'created_at',
  REACCION: 'reaccion'
} as const

export const MensajesCols = {
  TABLA: 'mensajes',
  ID: 'id',
  CONVERSACION_ID: 'conversacion_id',
  AUTOR_ID: 'autor_id',
  CONTENIDO: 'contenido',
  LEIDO: 'leido',
  CREATED_AT: 'created_at',
  TIPO: 'tipo',
  MEDIA_URL: 'media_url',
  MEDIA_METADATA: 'media_metadata'
} as const

export const NotificacionesCols = {
  TABLA: 'notificaciones',
  ID: 'id',
  USUARIO_ID: 'usuario_id',
  TIPO: 'tipo',
  TITULO: 'titulo',
  MENSAJE: 'mensaje',
  LEIDA: 'leida',
  ENLACE: 'enlace',
  ACTOR_ID: 'actor_id',
  CREATED_AT: 'created_at',
  DATOS: 'datos'
} as const

export const PublicacionesCols = {
  TABLA: 'publicaciones',
  ID: 'id',
  AUTOR_ID: 'autor_id',
  TIPO: 'tipo',
  CONTENIDO: 'contenido',
  IMAGENES: 'imagenes',
  SAMPLES_ADJUNTOS: 'samples_adjuntos',
  TOTAL_LIKES: 'total_likes',
  TOTAL_COMENTARIOS: 'total_comentarios',
  TOTAL_REPOSTS: 'total_reposts',
  CREATED_AT: 'created_at',
  REPOST_ID: 'repost_id',
  IMAGENES_METADATA: 'imagenes_metadata',
  MODERACION_ESTADO: 'moderacion_estado',
  MODERACION_DETALLE: 'moderacion_detalle',
  MODERACION_RAZON: 'moderacion_razon',
  UPDATED_AT: 'updated_at',
  ELIMINADO_EN: 'eliminado_en'
} as const

export const PushSubscriptionsCols = {
  TABLA: 'push_subscriptions',
  ID: 'id',
  USUARIO_ID: 'usuario_id',
  ENDPOINT: 'endpoint',
  AUTH: 'auth',
  PLATAFORMA: 'plataforma',
  ACTIVA: 'activa',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
} as const

export const RelacionesSampleCols = {
  TABLA: 'relaciones_sample',
  ID: 'id',
  CANCION_DESTINO_ID: 'cancion_destino_id',
  CANCION_FUENTE_ID: 'cancion_fuente_id',
  WHOSAMPLED_ID: 'whosampled_id',
  TIPO_RELACION: 'tipo_relacion',
  TIPO_ELEMENTO: 'tipo_elemento',
  TIMINGS_DESTINO: 'timings_destino',
  TIMINGS_FUENTE: 'timings_fuente',
  APARECE_EN_TODO: 'aparece_en_todo',
  SAMPLE_ID: 'sample_id',
  SAMPLE_FUENTE_ID: 'sample_fuente_id',
  SAMPLE_DESTINO_ID: 'sample_destino_id',
  VOTOS_TOTAL: 'votos_total',
  VOTOS_PROMEDIO: 'votos_promedio',
  FUENTE: 'fuente',
  CONTRIBUIDOR_ID: 'contribuidor_id',
  VERIFICADA: 'verificada',
  TOTAL_LIKES: 'total_likes',
  TOTAL_COMENTARIOS: 'total_comentarios',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
} as const

export const ReportesDuplicadosCols = {
  TABLA: 'reportes_duplicados',
  ID: 'id',
  SAMPLE_ORIGINAL_ID: 'sample_original_id',
  SAMPLE_DUPLICADO_ID: 'sample_duplicado_id',
  REPORTADOR_ID: 'reportador_id',
  ESTADO: 'estado',
  PRUEBAS_TEXTO: 'pruebas_texto',
  RESUELTO_AT: 'resuelto_at',
  CREATED_AT: 'created_at'
} as const

export const ReportesCols = {
  TABLA: 'reportes',
  ID: 'id',
  TIPO: 'tipo',
  TARGET_ID: 'target_id',
  REPORTADOR_ID: 'reportador_id',
  REPORTADO_ID: 'reportado_id',
  RAZON: 'razon',
  DETALLES: 'detalles',
  ESTADO: 'estado',
  RESUELTO_POR: 'resuelto_por',
  RESUELTO_AT: 'resuelto_at',
  CREATED_AT: 'created_at'
} as const

export const ReproduccionesCols = {
  TABLA: 'reproducciones',
  ID: 'id',
  USUARIO_ID: 'usuario_id',
  SAMPLE_ID: 'sample_id',
  DURACION_ESCUCHADA: 'duracion_escuchada',
  COMPLETADA: 'completada',
  CREATED_AT: 'created_at'
} as const

export const SamplesCols = {
  TABLA: 'samples',
  ID: 'id',
  CREADOR_ID: 'creador_id',
  TITULO: 'titulo',
  SLUG: 'slug',
  DESCRIPCION: 'descripcion',
  BPM: 'bpm',
  KEY: 'key',
  ESCALA: 'escala',
  DURACION: 'duracion',
  FORMATO: 'formato',
  TAMANO: 'tamano',
  METADATA: 'metadata',
  TAGS: 'tags',
  ESTADO: 'estado',
  TIPO: 'tipo',
  ES_PREMIUM: 'es_premium',
  PRECIO: 'precio',
  RUTA_ORIGINAL: 'ruta_original',
  RUTA_OPTIMIZADA: 'ruta_optimizada',
  RUTA_PREVIEW: 'ruta_preview',
  RUTA_WAVEFORM: 'ruta_waveform',
  IMAGEN_URL: 'imagen_url',
  EMBEDDING: 'embedding',
  TOTAL_DESCARGAS: 'total_descargas',
  TOTAL_LIKES: 'total_likes',
  TOTAL_REPRODUCCIONES: 'total_reproducciones',
  PUBLICADO_AT: 'publicado_at',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  ID_CORTO: 'id_corto',
  PERMITIR_DESCARGA: 'permitir_descarga',
  LICENCIA_LIBRE: 'licencia_libre',
  AUDIO_HASH: 'audio_hash',
  HASH_PARCIAL: 'hash_parcial',
  TOTAL_COMENTARIOS: 'total_comentarios',
  VERIFICADO: 'verificado',
  MOSTRAR_EN_COMUNIDAD: 'mostrar_en_comunidad',
  CANCION_ORIGEN_ID: 'cancion_origen_id',
  RELACION_SAMPLEO_ID: 'relacion_sampleo_id',
  ELIMINADO_EN: 'eliminado_en'
} as const

export const ScrapingLogCols = {
  TABLA: 'scraping_log',
  ID: 'id',
  URL: 'url',
  TIPO_PAGINA: 'tipo_pagina',
  ESTADO: 'estado',
  INTENTOS: 'intentos',
  BYTES_DESCARGADOS: 'bytes_descargados',
  ERROR_MENSAJE: 'error_mensaje',
  RE_SCRAPEABLE: 're_scrapeable',
  PROXIMO_RESCRAPE: 'proximo_rescrape',
  VECES_RESCRAPEADO: 'veces_rescrapeado',
  PROCESADO_AT: 'procesado_at',
  CREATED_AT: 'created_at'
} as const

export const SuscripcionesCols = {
  TABLA: 'suscripciones',
  ID: 'id',
  USUARIO_ID: 'usuario_id',
  PLAN: 'plan',
  ESTADO: 'estado',
  STRIPE_SUBSCRIPTION_ID: 'stripe_subscription_id',
  INICIO_AT: 'inicio_at',
  FIN_AT: 'fin_at',
  CREATED_AT: 'created_at'
} as const

export const SyncChangelogCols = {
  TABLA: 'sync_changelog',
  ID: 'id',
  USUARIO_ID: 'usuario_id',
  TIPO: 'tipo',
  ENTIDAD_ID: 'entidad_id',
  METADATA: 'metadata',
  CREATED_AT: 'created_at'
} as const

export const TransaccionesCols = {
  TABLA: 'transacciones',
  ID: 'id',
  COMPRADOR_ID: 'comprador_id',
  CREADOR_ID: 'creador_id',
  SAMPLE_ID: 'sample_id',
  TIPO: 'tipo',
  MONTO: 'monto',
  MONEDA: 'moneda',
  ESTADO: 'estado',
  STRIPE_PAYMENT_ID: 'stripe_payment_id',
  CREATED_AT: 'created_at',
  PAGO_CREADOR: 'pago_creador',
  COMISION_PLATAFORMA: 'comision_plataforma'
} as const

export const UsuariosExtCols = {
  TABLA: 'usuarios_ext',
  ID: 'id',
  WP_USER_ID: 'wp_user_id',
  USERNAME: 'username',
  EMAIL: 'email',
  NOMBRE_VISIBLE: 'nombre_visible',
  BIO: 'bio',
  AVATAR_URL: 'avatar_url',
  PORTADA_URL: 'portada_url',
  PLAN: 'plan',
  ROL: 'rol',
  VERIFICADO: 'verificado',
  TOTAL_SEGUIDORES: 'total_seguidores',
  TOTAL_SEGUIDOS: 'total_seguidos',
  TOTAL_SAMPLES: 'total_samples',
  TOTAL_DESCARGAS: 'total_descargas',
  STRIPE_CUSTOMER_ID: 'stripe_customer_id',
  STRIPE_CONNECT_ID: 'stripe_connect_id',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  VIOLACIONES_MODERACION: 'violaciones_moderacion',
  BANEADO_HASTA: 'baneado_hasta',
  BAN_RAZON: 'ban_razon',
  CREDITOS_BONUS: 'creditos_bonus',
  STRIPE_SUBSCRIPTION_ID: 'stripe_subscription_id',
  ES_SEED: 'es_seed',
  SITIO_WEB: 'sitio_web',
  GENEROS_FAVORITOS: 'generos_favoritos',
  ESTADO: 'estado',
  SUSPENDIDO_HASTA: 'suspendido_hasta',
  SUSPENSION_RAZON: 'suspension_razon',
  MARCADO_ELIMINACION_EN: 'marcado_eliminacion_en',
  SERA_ELIMINADO_EN: 'sera_eliminado_en',
  REGISTRO_IP: 'registro_ip',
  PAYPAL_EMAIL: 'paypal_email'
} as const

/* Constantes de valores enum/check (mirror de PHP) */
export const ArticulosEnums = {
  CATEGORIA_INSPIRACION: 'inspiracion',
  CATEGORIA_MASTERING: 'mastering',
  CATEGORIA_MEZCLA: 'mezcla',
  CATEGORIA_PROMOCION_MUSICAL: 'promocion-musical',
  CATEGORIA_TEORIA_MUSICAL: 'teoria-musical',
  CATEGORIA_GRABACION: 'grabacion',
  CATEGORIA_SAMPLING: 'sampling',
  CATEGORIA_DISENO_SONORO: 'diseno-sonoro',
  CATEGORIA_HERRAMIENTAS: 'herramientas',
  CATEGORIA_ABLETON_LIVE: 'ableton-live',
  CATEGORIA_BITWIG_STUDIO: 'bitwig-studio',
  CATEGORIA_CUBASE: 'cubase',
  CATEGORIA_FL_STUDIO: 'fl-studio',
  CATEGORIA_GARAGEBAND: 'garageband',
  CATEGORIA_LOGIC_PRO: 'logic-pro',
  CATEGORIA_PRO_TOOLS: 'pro-tools',
  CATEGORIA_STUDIO_ONE: 'studio-one',
  CATEGORIA_DROPS_GRATIS: 'drops-gratis',
  CATEGORIA_MIDI_GRATIS: 'midi-gratis',
  CATEGORIA_PLUGINS_GRATIS: 'plugins-gratis',
  CATEGORIA_PRESETS_GRATIS: 'presets-gratis',
  CATEGORIA_PROYECTOS_GRATIS: 'proyectos-gratis',
  CATEGORIA_SONIDOS_GRATIS: 'sonidos-gratis',
  CATEGORIA_ENTREVISTAS: 'entrevistas',
  CATEGORIA_DESTACADOS: 'destacados',
  CATEGORIA_NOTICIAS: 'noticias',
  MODERACION_ESTADO_PENDIENTE: 'pendiente',
  MODERACION_ESTADO_REVISION: 'revision',
  MODERACION_ESTADO_APROBADO: 'aprobado',
  MODERACION_ESTADO_RECHAZADO: 'rechazado'
} as const

export const CancionesArtistasEnums = {
  ROL_PRINCIPAL: 'principal',
  ROL_FEATURING: 'featuring',
  ROL_PRODUCER: 'producer'
} as const

export const ColaExtraccionSamplesEnums = {
  ESTADO_PENDIENTE: 'pendiente',
  ESTADO_DESCARGANDO: 'descargando',
  ESTADO_ANALIZANDO: 'analizando',
  ESTADO_RECORTANDO: 'recortando',
  ESTADO_EXTRAIDO: 'extraido',
  ESTADO_COMPLETADO: 'completado',
  ESTADO_ERROR: 'error',
  ESTADO_REVISION_HUMANA: 'revision_humana',
  ESTADO_UNIFICADO: 'unificado',
  LADO_FUENTE: 'fuente',
  LADO_DESTINO: 'destino'
} as const

export const ColaProcesamientoIaEnums = {
  TIPO_SAMPLE: 'sample',
  TIPO_COMENTARIO: 'comentario',
  TIPO_PUBLICACION: 'publicacion',
  OPERACION_ANALISIS_AUDIO: 'analisis_audio',
  OPERACION_MODERACION_TEXTO: 'moderacion_texto',
  OPERACION_MODERACION_IMAGEN: 'moderacion_imagen',
  OPERACION_MODERACION_COMPLETA: 'moderacion_completa',
  ESTADO_PENDIENTE: 'pendiente',
  ESTADO_PROCESANDO: 'procesando',
  ESTADO_COMPLETADO: 'completado',
  ESTADO_ERROR_REINTENTO: 'error_reintento',
  ESTADO_ERROR_FINAL: 'error_final'
} as const

export const ComentariosEnums = {
  TIPO_SAMPLE: 'sample',
  TIPO_PUBLICACION: 'publicacion',
  TIPO_CANCION: 'cancion',
  TIPO_RELACION: 'relacion',
  TIPO_ARTICULO: 'articulo',
  TIPO_CONTENIDO_TEXTO: 'texto',
  TIPO_CONTENIDO_IMAGEN: 'imagen',
  TIPO_CONTENIDO_AUDIO: 'audio',
  MODERACION_ESTADO_PENDIENTE: 'pendiente',
  MODERACION_ESTADO_REVISION: 'revision',
  MODERACION_ESTADO_APROBADO: 'aprobado',
  MODERACION_ESTADO_RECHAZADO: 'rechazado'
} as const

export const ContribucionesPendientesEnums = {
  CANCION_NUEVA_LADO_DESTINO: 'destino',
  CANCION_NUEVA_LADO_FUENTE: 'fuente',
  TIPO_RELACION_SAMPLE: 'sample',
  TIPO_RELACION_COVER: 'cover',
  TIPO_RELACION_REMIX: 'remix',
  TIPO_RELACION_INTERPOLATION: 'interpolation',
  TIPO_ELEMENTO_HOOK_RIFF: 'hook_riff',
  TIPO_ELEMENTO_VOCALS_LYRICS: 'vocals_lyrics',
  TIPO_ELEMENTO_DRUMS: 'drums',
  TIPO_ELEMENTO_BASS: 'bass',
  TIPO_ELEMENTO_KEYS_SYNTH: 'keys_synth',
  TIPO_ELEMENTO_SOUND_EFFECT: 'sound_effect',
  TIPO_ELEMENTO_MULTIPLE_ELEMENTS: 'multiple_elements',
  TIPO_ELEMENTO_OTHER: 'other',
  ESTADO_PENDIENTE: 'pendiente',
  ESTADO_APROBADA: 'aprobada',
  ESTADO_RECHAZADA: 'rechazada',
  TIPO_CONTRIBUCION_NUEVA: 'nueva',
  TIPO_CONTRIBUCION_EDICION: 'edicion',
  TIPO_CONTRIBUCION_ELIMINACION: 'eliminacion'
} as const

export const DuplicadosPendientesEnums = {
  TIPO_CROSS_USUARIO: 'cross_usuario',
  TIPO_MISMO_USUARIO: 'mismo_usuario',
  TIPO_BACKFILL: 'backfill',
  ESTADO_PENDIENTE: 'pendiente',
  ESTADO_APROBADO: 'aprobado',
  ESTADO_RECHAZADO: 'rechazado',
  ESTADO_FUSIONADO: 'fusionado'
} as const

export const LikesEnums = {
  TIPO_SAMPLE: 'sample',
  TIPO_PUBLICACION: 'publicacion',
  TIPO_COMENTARIO: 'comentario',
  TIPO_CANCION: 'cancion',
  TIPO_RELACION: 'relacion',
  REACCION_LIKE: 'like',
  REACCION_DISLIKE: 'dislike',
  REACCION_ENCANTA: 'encanta'
} as const

export const PublicacionesEnums = {
  TIPO_SOCIAL: 'social',
  TIPO_SAMPLE: 'sample',
  MODERACION_ESTADO_PENDIENTE: 'pendiente',
  MODERACION_ESTADO_REVISION: 'revision',
  MODERACION_ESTADO_APROBADO: 'aprobado',
  MODERACION_ESTADO_RECHAZADO: 'rechazado'
} as const

export const RelacionesSampleEnums = {
  TIPO_RELACION_SAMPLE: 'sample',
  TIPO_RELACION_COVER: 'cover',
  TIPO_RELACION_REMIX: 'remix',
  TIPO_RELACION_INTERPOLATION: 'interpolation',
  TIPO_ELEMENTO_HOOK_RIFF: 'hook_riff',
  TIPO_ELEMENTO_VOCALS_LYRICS: 'vocals_lyrics',
  TIPO_ELEMENTO_DRUMS: 'drums',
  TIPO_ELEMENTO_BASS: 'bass',
  TIPO_ELEMENTO_KEYS_SYNTH: 'keys_synth',
  TIPO_ELEMENTO_SOUND_EFFECT: 'sound_effect',
  TIPO_ELEMENTO_MULTIPLE_ELEMENTS: 'multiple_elements',
  TIPO_ELEMENTO_OTHER: 'other',
  FUENTE_SCRAPING: 'scraping',
  FUENTE_COMUNIDAD: 'comunidad',
  FUENTE_MUSICBRAINZ: 'musicbrainz',
  FUENTE_IMPORT: 'import'
} as const

export const ReportesDuplicadosEnums = {
  ESTADO_REPORTADO: 'reportado',
  ESTADO_EN_REVISION: 'en_revision',
  ESTADO_RESUELTO: 'resuelto',
  ESTADO_RECHAZADO: 'rechazado'
} as const

export const ReportesEnums = {
  TIPO_USUARIO: 'usuario',
  TIPO_PUBLICACION: 'publicacion',
  TIPO_COMENTARIO: 'comentario',
  TIPO_SAMPLE: 'sample',
  TIPO_ERROR_PLATAFORMA: 'error_plataforma',
  TIPO_SOLICITUD_WHATSAPP: 'solicitud_whatsapp',
  TIPO_LEGAL: 'legal',
  ESTADO_PENDIENTE: 'pendiente',
  ESTADO_RESUELTO: 'resuelto',
  ESTADO_DESCARTADO: 'descartado'
} as const

export const SamplesEnums = {
  ESTADO_PROCESANDO: 'procesando',
  ESTADO_ACTIVO: 'activo',
  ESTADO_INACTIVO: 'inactivo',
  ESTADO_ELIMINADO: 'eliminado',
  ESTADO_EN_SUPERVISION: 'en_supervision',
  TIPO_LOOP: 'loop',
  TIPO_ONESHOT: 'oneshot'
} as const

export const ScrapingLogEnums = {
  TIPO_PAGINA_HOT_SAMPLES: 'hot_samples',
  TIPO_PAGINA_HOT_COVERS: 'hot_covers',
  TIPO_PAGINA_HOT_REMIXES: 'hot_remixes',
  TIPO_PAGINA_SAMPLE_DETAIL: 'sample_detail',
  TIPO_PAGINA_COVER_DETAIL: 'cover_detail',
  TIPO_PAGINA_REMIX_DETAIL: 'remix_detail',
  TIPO_PAGINA_ARTIST: 'artist',
  TIPO_PAGINA_TRACK: 'track',
  TIPO_PAGINA_TRACK_SAMPLES: 'track_samples',
  TIPO_PAGINA_TRACK_SAMPLED: 'track_sampled',
  TIPO_PAGINA_BROWSE_YEAR: 'browse_year',
  TIPO_PAGINA_BROWSE_GENRE: 'browse_genre',
  ESTADO_PENDIENTE: 'pendiente',
  ESTADO_PROCESADO: 'procesado',
  ESTADO_ERROR: 'error',
  ESTADO_SKIP: 'skip'
} as const

export const SuscripcionesEnums = {
  ESTADO_ACTIVA: 'activa',
  ESTADO_CANCELADA: 'cancelada',
  ESTADO_VENCIDA: 'vencida',
  ESTADO_PERIODO_PRUEBA: 'periodo_prueba'
} as const

export const SyncChangelogEnums = {
  TIPO_SAMPLE_ADDED: 'sample_added',
  TIPO_SAMPLE_REMOVED: 'sample_removed',
  TIPO_SAMPLE_UPDATED: 'sample_updated',
  TIPO_COLLECTION_CREATED: 'collection_created',
  TIPO_COLLECTION_RENAMED: 'collection_renamed',
  TIPO_COLLECTION_DELETED: 'collection_deleted',
  TIPO_COLLECTION_MERGED: 'collection_merged'
} as const

export const TransaccionesEnums = {
  TIPO_SUSCRIPCION: 'suscripcion',
  TIPO_COMPRA_SAMPLE: 'compra_sample',
  TIPO_PAYOUT: 'payout',
  TIPO_DESCARGA: 'descarga',
  ESTADO_COMPLETADA: 'completada',
  ESTADO_COMPLETED: 'completed',
  ESTADO_PENDIENTE: 'pendiente',
  ESTADO_FALLIDA: 'fallida',
  ESTADO_REEMBOLSADA: 'reembolsada'
} as const

export const UsuariosExtEnums = {
  PLAN_FREE: 'free',
  PLAN_PRO: 'pro',
  PLAN_PREMIUM: 'premium',
  ROL_USUARIO: 'usuario',
  ROL_CREADOR: 'creador',
  ROL_ADMIN: 'admin',
  ESTADO_ACTIVO: 'activo',
  ESTADO_SUSPENDIDO: 'suspendido',
  ESTADO_EN_ELIMINACION: 'en_eliminacion'
} as const
