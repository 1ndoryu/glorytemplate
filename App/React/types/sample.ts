/*
 * Tipos base — Sample
 * Representa un sample de audio en la plataforma.
 * Union types derivados del Schema System (CHECK constraints de la DB).
 */

import type { ISamples, ILikes } from './_generated/schema';

/* Derivados del schema — se actualizan automaticamente con npx glory schema:generate */
export type EstadoSample = ISamples['estado'];
export type TipoSample = ISamples['tipo'];
export type NotaMusical = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type EscalaMusical = 'mayor' | 'menor';

export interface MetadataSample {
    /* Campos de la IA (camelCase en frontend) */
    nombreArchivoBase?: string;
    tags?: string[];
    tagsEs?: string[];
    genero?: string[] | string;
    emocion?: string;
    emocionEs?: string;
    instrumentos?: string[] | string;
    artistaVibes?: string[] | string;
    descripcionCorta?: string;
    descripcionCortaEs?: string;
    descripcion?: string;
    descripcionEs?: string;
    bpmConfianza?: number;
    keyConfianza?: number;
    /* Variantes snake_case (vienen directo del JSONB de Postgres) */
    nombre_archivo_base?: string;
    tags_es?: string[];
    emocion_es?: string;
    artista_vibes?: string[] | string;
    descripcion_corta?: string;
    descripcion_corta_es?: string;
    descripcion_es?: string;
    bpm_confianza?: number;
    key_confianza?: number;
    /* C282: Clasificacion automatica en carpetas por IA */
    carpeta_primaria?: string;
    carpeta_secundaria?: string;
    carpetaPrimaria?: string;
    carpetaSecundaria?: string;
    /* Campos legacy por compatibilidad */
    sentimiento?: string[];
    tipo?: TipoSample;
    descripcionIA?: string;
    /* Indexado libre para otros campos IA futuros */
    [key: string]: unknown;
}

export interface Sample {
    id: number;
    creadorId: number;
    titulo: string;
    slug: string;
    descripcion: string;
    bpm: number | null;
    key: NotaMusical | null;
    escala: EscalaMusical | null;
    duracion: number;
    formato: string;
    tamano: number;
    metadata: MetadataSample | null;
    tags: string[];
    tipo: TipoSample;
    estado: EstadoSample;
    esPremium: boolean;
    precio: number | null;
    liked?: boolean;
    reaccion?: TipoReaccion | null;
    /* C202: Rutas originales solo se envian cuando esMio (QQ22) */
    rutaOriginal?: string;
    rutaOptimizada?: string;
    rutaPreview: string;
    rutaWaveform: string;
    imagenUrl: string | null;
    totalDescargas: number;
    totalLikes: number;
    totalReproducciones: number;
    totalComentarios: number;
    publicadoAt: string | null;
    creadoAt: string;
    actualizadoAt: string;
    /* QQ22: Campos adicionales para inspector */
    idCorto?: string;
    audioHash?: string | null;
    permitirDescarga?: boolean;
    licenciaLibre?: boolean;

    /* Relacion opcional cargada via API */
    creador?: UsuarioResumen;
    verificado?: boolean;
    /* C220: Toggle visibilidad en comunidad */
    mostrarEnComunidad?: boolean;
    /* Flags de estado del usuario autenticado */
    yaColeccionado?: boolean;
    yaGuardadoEnColeccion?: boolean;
    yaComentado?: boolean;
    esMio?: boolean;
    yaComprado?: boolean;
    /* QQ51: Info de origen — cancion y relacion de sampleo si es un recorte */
    cancionOrigenId?: number | null;
    relacionSampleoId?: number | null;
    /* QQ79: Datos enriquecidos de la cancion de origen */
    cancionOrigen?: { titulo: string; slug: string } | null;
    /* [173A-5] Coleccion original del creador que contiene este sample, si existe
     * [183A-55] imagenUrl agregado para portada en panel lateral */
    coleccionOriginal?: { id: number; nombre: string; slug: string | null; imagenUrl?: string | null } | null;
    /* QQ117: Metadatos de extraccion (fuente, timing, metodo descarga) */
    extraccion?: ExtraccionSample | null;
}

/* QQ117+QQ23: Metadata de extraccion vinculada desde cola_extraccion_samples */
export interface ExtraccionSample {
    youtubeId: string | null;
    spotifyId: string | null;
    timingInicioSeg: number | null;
    bpmDetectado: number | null;
    duracionCompasSeg: number | null;
    compasInicioSeg: number | null;
    compasFinSeg: number | null;
    lado: string | null;
    estado: string | null;
    rutaAudioExtraido: string | null;
    /* QK61: Flag booleano — indica si el audio completo esta guardado para extensiones */
    tieneAudioCompleto: boolean;
    fuenteUrl: string | null;
    fuenteTitulo: string | null;
    fuenteArtista: string | null;
    descargaMetodo: string | null;
    origen: string | null;
    ladoExtraccion: string | null;
    /* QQ23: Campos adicionales del JSONB metadata_extraccion */
    sampleoFuenteTitulo: string | null;
    sampleoFuenteArtista: string | null;
    sampleoDestinoTitulo: string | null;
    sampleoDestinoArtista: string | null;
    votosTotal: number | null;
    tipoElemento: string | null;
    recortePorCompas: string | null;
    duracionExtraida: number | null;
    formatoExtraido: string | null;
    tamanoBytes: number | null;
    /* QK32: Slugs y albums de canciones fuente/destino para links en inspector */
    fuenteSlug: string | null;
    fuenteAlbum: string | null;
    destinoSlug: string | null;
    destinoAlbum: string | null;
}

/* Tipos de reaccion — derivado del schema (CHECK en tabla likes) */
export type TipoReaccion = ILikes['reaccion'];

/* Version resumida para listas y tarjetas */
export interface SampleResumen {
    id: number;
    titulo: string;
    slug: string;
    descripcion?: string;
    bpm: number | null;
    key: NotaMusical | null;
    escala: EscalaMusical | null;
    duracion: number;
    /* QL87: formato viene del backend (wav, mp3, flac, etc.) */
    formato?: string;
    tags: string[];
    tipo: TipoSample;
    esPremium: boolean;
    precio: number | null;
    rutaPreview: string;
    rutaWaveform: string;
    imagenUrl: string | null;
    totalDescargas: number;
    totalLikes: number;
    totalReproducciones: number;
    metadata: MetadataSample | null;
    audioHash?: string | null;
    creador: UsuarioResumen;
    liked?: boolean;
    reaccion?: TipoReaccion | null;
    verificado?: boolean;
    /* C220: Toggle visibilidad en comunidad */
    mostrarEnComunidad?: boolean;
    /*
     * Flags de estado del usuario autenticado respecto a este sample.
     * Pre-cargados por el backend via subqueries (igual que liked/reaccion).
     *
     * TERMINOLOGIA IMPORTANTE (no confundir):
     * - yaColeccionado: el usuario ya "colecciono" (boton +). Equivale a descargar.
     *   Tambien true si esMio (el usuario subio el sample). Tabla: descargas.
     * - yaGuardadoEnColeccion: el sample esta en al menos 1 coleccion/playlist
     *   del usuario (boton Bookmark). Tabla: coleccion_samples. Accion distinta.
     * - yaComentado: el usuario dejo al menos 1 comentario en este sample.
     * - esMio: el usuario es el creador/uploader del sample.
     */
    yaColeccionado?: boolean;
    yaGuardadoEnColeccion?: boolean;
    yaComentado?: boolean;
    esMio?: boolean;
    /* QQ11: true si el usuario ya compró este sample (transaccion compra_sample completada) */
    yaComprado?: boolean;
    /* QQ51: relaciones de sampleo (columna DB, siempre viene del backend) */
    cancionOrigenId?: number | null;
    relacionSampleoId?: number | null;
    /* [173A-5] Coleccion original del creador que contiene este sample, si existe
     * [183A-55] imagenUrl agregado para portada en panel lateral */
    coleccionOriginal?: { id: number; nombre: string; slug: string | null; imagenUrl?: string | null } | null;
    /* QK30: El backend siempre retorna extraccion (null si no hay datos) */
    extraccion?: ExtraccionSample | null;
    /* [193A-31] Debug score — solo presente cuando admin + debug activo */
    scoreDebug?: ScoreDebug | null;
}

/* [193A-31] Datos de debug del algoritmo de scoring, solo para admin */
export interface ScoreDebug {
    total: number;
    serendipia: boolean;
    rn: number;
    rnGenero: number;
    generoDiversidad: string | null;
    /** [213A-3] Posición del sample entre los del mismo tipo (loop/oneshot) en esta página */
    rnTipo: number;
    /** [2103A-19] Posición del sample entre los de la misma colección origen en esta página */
    rnColeccion: number;
    verificado: boolean;
    tieneEmbedding: boolean;
    horasPublicacion: number | null;
    boostReciente: number;
}

/* Importamos referencia para evitar circular */
export interface UsuarioResumen {
    id: number;
    username: string;
    nombreVisible: string;
    avatarUrl: string | null;
    verificado: boolean;
}
