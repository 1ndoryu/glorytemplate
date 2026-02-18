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

export interface IColecciones {
  id: number
  usuarioId: number
  nombre: string
  descripcion: string
  imagenUrl: string | null
  publica: boolean
  totalSamples: number
  createdAt: string
  updatedAt: string
  portadaUrl: string | null
}

export interface IColeccionSamples {
  coleccionId: number
  sampleId: number
  posicion: number
  addedAt: string
}

export interface IComentarios {
  id: number
  autorId: number
  tipo: string
  targetId: number
  contenido: string | null
  createdAt: string
  tipoContenido: string
  mediaUrl: string | null
  mediaMetadata: Record<string, unknown> | null
  moderacionEstado: string
  moderacionDetalle: Record<string, unknown>
  parentId: number | null
  totalRespuestas: number
  totalLikes: number
  updatedAt: string | null
}

export interface IConversaciones {
  id: number
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

export interface IFollows {
  seguidorId: number
  seguidoId: number
  createdAt: string
}

export interface ILikes {
  usuarioId: number
  tipo: string
  targetId: number
  createdAt: string
  reaccion: string
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
  tipo: string
  contenido: string
  imagenes: string[]
  samplesAdjuntos: string[]
  totalLikes: number
  totalComentarios: number
  totalReposts: number
  createdAt: string
  repostId: number | null
  imagenesMetadata: Record<string, unknown>
  moderacionEstado: string
  moderacionDetalle: Record<string, unknown>
}

export interface IReportesDuplicados {
  id: number
  sampleOriginalId: number
  sampleDuplicadoId: number
  reportadorId: number
  estado: string
  pruebasTexto: string
  resueltoAt: string | null
  createdAt: string
}

export interface IReportes {
  id: number
  tipo: string
  targetId: number
  reportadorId: number
  reportadoId: number | null
  razon: string
  detalles: string | null
  estado: string
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
  estado: string
  tipo: string
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
  totalComentarios: number
  verificado: boolean
  mostrarEnComunidad: boolean
}

export interface ISuscripciones {
  id: number
  usuarioId: number
  plan: string
  estado: string
  stripeSubscriptionId: string | null
  inicioAt: string | null
  finAt: string | null
  createdAt: string
}

export interface ITransacciones {
  id: number
  compradorId: number
  creadorId: number | null
  sampleId: number | null
  tipo: string
  monto: number
  moneda: string
  estado: string
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
  plan: string
  rol: string
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

export const ColeccionesCols = {
  TABLA: 'colecciones',
  ID: 'id',
  USUARIO_ID: 'usuario_id',
  NOMBRE: 'nombre',
  DESCRIPCION: 'descripcion',
  IMAGEN_URL: 'imagen_url',
  PUBLICA: 'publica',
  TOTAL_SAMPLES: 'total_samples',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  PORTADA_URL: 'portada_url'
} as const

export const ColeccionSamplesCols = {
  TABLA: 'coleccion_samples',
  COLECCION_ID: 'coleccion_id',
  SAMPLE_ID: 'sample_id',
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

export const ConversacionesCols = {
  TABLA: 'conversaciones',
  ID: 'id',
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
  MODERACION_DETALLE: 'moderacion_detalle'
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
  TOTAL_COMENTARIOS: 'total_comentarios',
  VERIFICADO: 'verificado',
  MOSTRAR_EN_COMUNIDAD: 'mostrar_en_comunidad'
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
  CREDITOS_BONUS: 'creditos_bonus'
} as const
