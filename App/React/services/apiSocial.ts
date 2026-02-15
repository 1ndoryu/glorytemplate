/*
 * Service: apiSocial — Kamples
 * Funciones de red social: follows, likes, publicaciones.
 * Conecta directamente con la API sin fallback a mock.
 */

import { apiGet, apiPost, apiDelete } from './apiCliente';
import type { RespuestaApi } from './apiCliente';
import type { Publicacion, Comentario } from '../types';

/* Follows */

export const seguirUsuario = async (usuarioId: number): Promise<RespuestaApi<{ seguido: boolean }>> => {
    return apiPost<{ seguido: boolean }>(`/follow/${usuarioId}`);
};

export const dejarDeSeguir = async (usuarioId: number): Promise<RespuestaApi<{ seguido: boolean }>> => {
    return apiDelete<{ seguido: boolean }>(`/follow/${usuarioId}`);
};

/* Likes */

export const darLike = async (tipo: 'sample' | 'publicacion', targetId: number): Promise<RespuestaApi<{ liked: boolean }>> => {
    return apiPost<{ liked: boolean }>(`/like`, { tipo, targetId });
};

export const quitarLike = async (tipo: 'sample' | 'publicacion', targetId: number): Promise<RespuestaApi<{ liked: boolean }>> => {
    return apiDelete<{ liked: boolean }>(`/like/${tipo}/${targetId}`);
};

/* Publicaciones */

export const crearPublicacion = async (datos: {
    tipo: 'social' | 'sample';
    contenido: string;
    imagenes?: string[];
    samplesAdjuntos?: number[];
}): Promise<RespuestaApi<Publicacion>> => {
    return apiPost<Publicacion>('/publicaciones', datos);
};

export const obtenerFeedInicio = async (page = 1): Promise<RespuestaApi<Publicacion[]>> => {
    return apiGet<Publicacion[]>('/feed/inicio', { page });
};

/* Comentarios */

export const obtenerComentarios = async (
    tipo: 'sample' | 'publicacion',
    targetId: number,
    page = 1
): Promise<RespuestaApi<Comentario[]>> => {
    return apiGet<Comentario[]>(`/comentarios/${tipo}/${targetId}`, { page });
};

export const crearComentario = async (
    tipo: 'sample' | 'publicacion',
    targetId: number,
    contenido: string
): Promise<RespuestaApi<Comentario>> => {
    return apiPost<Comentario>(`/comentarios/${tipo}/${targetId}`, { contenido });
};

/* Reposts */

export const repostear = async (publicacionId: number): Promise<RespuestaApi<{ reposteado: boolean }>> => {
    return apiPost<{ reposteado: boolean }>(`/repost/${publicacionId}`);
};

export const quitarRepost = async (publicacionId: number): Promise<RespuestaApi<{ reposteado: boolean }>> => {
    return apiDelete<{ reposteado: boolean }>(`/repost/${publicacionId}`);
};
