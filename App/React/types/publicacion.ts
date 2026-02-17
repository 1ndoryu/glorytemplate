/*
 * Tipos base — Publicacion
 * Representa una publicacion social del feed.
 */

import type { UsuarioResumen } from './usuario';
import type { SampleResumen, TipoReaccion } from './sample';

export type TipoPublicacion = 'social' | 'sample';

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
}

export interface Comentario {
    id: number;
    autorId: number;
    contenido: string;
    creadoAt: string;
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
}
