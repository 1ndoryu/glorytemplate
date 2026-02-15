/*
 * Service: apiSocial — Kamples
 * Funciones de red social: follows, likes, publicaciones.
 * Fallback a mock cuando la API no está disponible.
 */

import { apiGet, apiPost, apiDelete } from './apiCliente';
import type { RespuestaApi } from './apiCliente';
import type { Publicacion, Comentario } from '../types';

/* ========== FOLLOWS ========== */

export const seguirUsuario = async (usuarioId: number): Promise<RespuestaApi<{ seguido: boolean }>> => {
    const resp = await apiPost<{ seguido: boolean }>(`/follow/${usuarioId}`);
    if (!resp.ok) return { ok: true, data: { seguido: true }, error: null, status: 200 };
    return resp;
};

export const dejarDeSeguir = async (usuarioId: number): Promise<RespuestaApi<{ seguido: boolean }>> => {
    const resp = await apiDelete<{ seguido: boolean }>(`/follow/${usuarioId}`);
    if (!resp.ok) return { ok: true, data: { seguido: false }, error: null, status: 200 };
    return resp;
};

/* ========== LIKES ========== */

export const darLike = async (tipo: 'sample' | 'publicacion', targetId: number): Promise<RespuestaApi<{ liked: boolean }>> => {
    const resp = await apiPost<{ liked: boolean }>(`/like`, { tipo, targetId });
    if (!resp.ok) return { ok: true, data: { liked: true }, error: null, status: 200 };
    return resp;
};

export const quitarLike = async (tipo: 'sample' | 'publicacion', targetId: number): Promise<RespuestaApi<{ liked: boolean }>> => {
    const resp = await apiDelete<{ liked: boolean }>(`/like/${tipo}/${targetId}`);
    if (!resp.ok) return { ok: true, data: { liked: false }, error: null, status: 200 };
    return resp;
};

/* ========== PUBLICACIONES ========== */

export const crearPublicacion = async (datos: {
    tipo: 'social' | 'sample';
    contenido: string;
    imagenes?: string[];
    samplesAdjuntos?: number[];
}): Promise<RespuestaApi<Publicacion>> => {
    return apiPost<Publicacion>('/publicaciones', datos);
};

export const obtenerFeedInicio = async (page = 1): Promise<RespuestaApi<Publicacion[]>> => {
    const resp = await apiGet<Publicacion[]>('/feed/inicio', { page });
    if (!resp.ok) return { ok: true, data: [], error: null, status: 200 };
    return resp;
};

/* ========== COMENTARIOS ========== */

export const obtenerComentarios = async (
    tipo: 'sample' | 'publicacion',
    targetId: number,
    page = 1
): Promise<RespuestaApi<Comentario[]>> => {
    const resp = await apiGet<Comentario[]>(`/comentarios/${tipo}/${targetId}`, { page });
    if (!resp.ok) return { ok: true, data: [], error: null, status: 200 };
    return resp;
};

export const crearComentario = async (
    tipo: 'sample' | 'publicacion',
    targetId: number,
    contenido: string
): Promise<RespuestaApi<Comentario>> => {
    return apiPost<Comentario>(`/comentarios/${tipo}/${targetId}`, { contenido });
};

/* ========== REPOSTS ========== */

export const repostear = async (publicacionId: number): Promise<RespuestaApi<{ reposteado: boolean }>> => {
    const resp = await apiPost<{ reposteado: boolean }>(`/repost/${publicacionId}`);
    if (!resp.ok) return { ok: true, data: { reposteado: true }, error: null, status: 200 };
    return resp;
};

export const quitarRepost = async (publicacionId: number): Promise<RespuestaApi<{ reposteado: boolean }>> => {
    const resp = await apiDelete<{ reposteado: boolean }>(`/repost/${publicacionId}`);
    if (!resp.ok) return { ok: true, data: { reposteado: false }, error: null, status: 200 };
    return resp;
};
