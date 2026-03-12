/*
 * Tipos base — Publicacion
 * Representa una publicacion social del feed.
 * Union types derivados del Schema System (CHECK constraints de la DB).
 */

import type { UsuarioResumen } from './usuario';
import type { SampleResumen, TipoReaccion } from './sample';
import type { IPublicaciones } from './_generated/schema';

/* Derivado del schema — se actualiza automaticamente con npx glory schema:generate */
export type TipoPublicacion = IPublicaciones['tipo'];

export interface Publicacion {
    id: number;
    autorId: number;
    tipo: TipoPublicacion;
    contenido: string;
    imagenes: string[];
    samplesAdjuntos: SampleResumen[];
    totalLikes: number;
    totalComentarios: number;
    totalReposts: number;
    liked?: boolean;
    reaccion?: TipoReaccion | null;
    reposteado?: boolean;
    creadoAt: string;
    moderacionEstado?: 'pendiente' | 'aprobado' | 'revision' | 'rechazado' | null;

    /* Relacion */
    autor: UsuarioResumen;

    /* Repost: datos del post original cuando esta publicacion es un repost */
    repostOriginal?: RepostOriginal | null;

    /* QQ20: Comentario con más likes para preview inline */
    comentarioDestacado?: ComentarioDestacado | null;
}

/* Estructura mínima del comentario destacado devuelto por el backend */
export interface ComentarioDestacado {
    id: number;
    autorId: number;
    contenido: string;
    totalLikes: number;
    creadoAt: string;
    tipoContenido?: 'texto' | 'imagen' | 'audio';
    mediaUrl?: string | null;
    autor: {
        id: number;
        username: string;
        nombreVisible: string;
        avatarUrl?: string;
    };
}

export interface RepostOriginal {
    id: number;
    contenido: string;
    imagenes: string[];
    autor: UsuarioResumen;
    samplesAdjuntos?: SampleResumen[];
}

export interface Comentario {
    id: number;
    autorId: number;
    contenido: string;
    creadoAt: string;
    editadoAt?: string | null;
    autor: UsuarioResumen;
    /* C130: Soporte multimedia */
    tipoContenido?: 'texto' | 'imagen' | 'audio';
    mediaUrl?: string | null;
    mediaMetadata?: {
        formato?: string;
        tamano?: number;
        mimeType?: string;
        /* C201: Picos waveform generados por backend (FFmpeg) */
        picos?: number[];
        waveformUrl?: string;
    } | null;
    /* C265: Respuestas y likes */
    parentId?: number | null;
    totalLikes?: number;
    totalRespuestas?: number;
    liked?: boolean;
    respuestas?: Comentario[];
}
