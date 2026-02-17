/*
 * Service: apiSocial — Kamples
 * Funciones de red social: follows, likes, publicaciones.
 * Conecta directamente con la API sin fallback a mock.
 */

import { apiGet, apiPost, apiDelete, apiPostFormData, apiPut } from './apiCliente';
import type { RespuestaApi } from './apiCliente';
import type { Publicacion, Comentario, TipoReaccion } from '../types';

/* Follows */

export const seguirUsuario = async (usuarioId: number): Promise<RespuestaApi<{ seguido: boolean }>> => {
    return apiPost<{ seguido: boolean }>(`/follow/${usuarioId}`);
};

export const dejarDeSeguir = async (usuarioId: number): Promise<RespuestaApi<{ seguido: boolean }>> => {
    return apiDelete<{ seguido: boolean }>(`/follow/${usuarioId}`);
};

/* Lista de IDs de usuarios seguidos (para filtro "solo seguidos") */
export const obtenerMisSeguidos = async (): Promise<RespuestaApi<{ id: number }[]>> => {
    return apiGet<{ id: number }[]>('/me/seguidos');
};

/* Likes / Reacciones */

export const darLike = async (
    tipo: 'sample' | 'publicacion',
    targetId: number,
    reaccion: TipoReaccion = 'like'
): Promise<RespuestaApi<{ liked: boolean; reaccion: TipoReaccion }>> => {
    /* Backend espera snake_case: target_id */
    return apiPost<{ liked: boolean; reaccion: TipoReaccion }>(`/like`, { tipo, target_id: targetId, reaccion });
};

export const quitarLike = async (
    tipo: 'sample' | 'publicacion',
    targetId: number
): Promise<RespuestaApi<{ liked: boolean; reaccion: null }>> => {
    /* DELETE /like espera body con tipo y target_id (snake_case) */
    return apiDelete<{ liked: boolean; reaccion: null }>('/like', { tipo, target_id: targetId });
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

/* Listar publicaciones de un usuario específico (para tab perfil) */
export const listarPublicacionesUsuario = async (
    username: string,
    page = 1
): Promise<RespuestaApi<{ data: Publicacion[]; page: number }>> => {
    return apiGet<{ data: Publicacion[]; page: number }>('/publicaciones', { autor: username, page });
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

/* Subir imagen para publicación al servidor (evita blob:// URLs) */
export const subirImagenPublicacion = async (archivo: File): Promise<RespuestaApi<{ url: string }>> => {
    const formData = new FormData();
    formData.append('imagen', archivo);
    return apiPostFormData<{ url: string }>('/publicaciones/imagenes', formData);
};

/* C126: Datos editables de una publicación */
export interface DatosActualizarPublicacion {
    contenido?: string;
    imagenes?: string[];
    moderacionEstado?: string; /* solo admin */
}

/*
 * C126: Actualizar publicación.
 * Solo el autor o admin pueden editar.
 */
export const actualizarPublicacion = async (
    publicacionId: number,
    datos: DatosActualizarPublicacion
): Promise<RespuestaApi<{ ok: boolean }>> => {
    return apiPut<{ ok: boolean }>(`/publicaciones/${publicacionId}`, datos);
};

/*
 * C126: Eliminar publicación.
 * Solo el autor o admin pueden eliminar.
 */
export const eliminarPublicacion = async (
    publicacionId: number
): Promise<RespuestaApi<{ eliminado: boolean }>> => {
    return apiDelete<{ eliminado: boolean }>(`/publicaciones/${publicacionId}`);
};
