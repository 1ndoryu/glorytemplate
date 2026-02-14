/*
 * Tipos base — Sample
 * Representa un sample de audio en la plataforma.
 */

export type EstadoSample = 'procesando' | 'activo' | 'inactivo' | 'eliminado';
export type TipoSample = 'loop' | 'oneshot' | 'fx' | 'vocal' | 'stem' | 'otro';
export type NotaMusical = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type EscalaMusical = 'mayor' | 'menor';

export interface MetadataSample {
    genero: string[];
    instrumentos: string[];
    sentimiento: string[];
    tipo: TipoSample;
    descripcionIA: string;
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
    metadata: MetadataSample;
    tags: string[];
    estado: EstadoSample;
    esPremium: boolean;
    precio: number | null;
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
}

/* Version resumida para listas y tarjetas */
export interface SampleResumen {
    id: number;
    titulo: string;
    slug: string;
    bpm: number | null;
    key: NotaMusical | null;
    escala: EscalaMusical | null;
    duracion: number;
    tags: string[];
    tipo: TipoSample;
    esPremium: boolean;
    rutaPreview: string;
    rutaWaveform: string;
    imagenUrl: string | null;
    totalDescargas: number;
    totalLikes: number;
    creador: UsuarioResumen;
    liked?: boolean;
}

/* Importamos referencia para evitar circular */
export interface UsuarioResumen {
    id: number;
    username: string;
    nombreVisible: string;
    avatarUrl: string | null;
    verificado: boolean;
}
