/*
 * Tipos base — Publicacion
 * Representa una publicacion social del feed.
 */

import type { UsuarioResumen } from './usuario';
import type { SampleResumen } from './sample';

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
    reposteado?: boolean;
    creadoAt: string;

    /* Relacion */
    autor: UsuarioResumen;
}

export interface Comentario {
    id: number;
    autorId: number;
    contenido: string;
    creadoAt: string;
    autor: UsuarioResumen;
}
