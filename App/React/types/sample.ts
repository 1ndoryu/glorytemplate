/*
 * Tipos base — Sample
 * Representa un sample de audio en la plataforma.
 */

export type EstadoSample = 'procesando' | 'activo' | 'inactivo' | 'eliminado';
export type TipoSample = 'loop' | 'oneshot' | 'fx' | 'vocal' | 'stem' | 'otro';
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
    rutaOriginal: string;
    rutaOptimizada: string;
    rutaPreview: string;
    rutaWaveform: string;
    imagenUrl: string | null;
    totalDescargas: number;
    totalLikes: number;
    totalReproducciones: number;
    publicadoAt: string | null;
    creadoAt: string;
    actualizadoAt: string;

    /* Relacion opcional cargada via API */
    creador?: UsuarioResumen;
    verificado?: boolean;
    /* C220: Toggle visibilidad en comunidad */
    mostrarEnComunidad?: boolean;
}

/* Tipos de reaccion posibles */
export type TipoReaccion = 'like' | 'dislike' | 'encanta';

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
}

/* Importamos referencia para evitar circular */
export interface UsuarioResumen {
    id: number;
    username: string;
    nombreVisible: string;
    avatarUrl: string | null;
    verificado: boolean;
}
