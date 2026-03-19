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

/* QQ32: Resumen de seguidor para el modal */
export interface SeguidorResumen {
    id: number;
    username: string;
    nombreVisible: string;
    avatarUrl: string | null;
    siguiendo: boolean;
}

/* QQ32: Lista paginada de seguidores de un usuario */
export const obtenerSeguidores = async (
    username: string,
    page = 1,
    perPage = 20
): Promise<RespuestaApi<SeguidorResumen[]>> => {
    return apiGet<SeguidorResumen[]>(
        `/usuarios/${encodeURIComponent(username)}/seguidores`,
        { page, perPage }
    );
};

/* Tipos de contenido que soportan likes y comentarios */
export type TipoLikeable = 'sample' | 'publicacion' | 'cancion' | 'relacion';
export type TipoComentable = 'sample' | 'publicacion' | 'cancion' | 'relacion' | 'articulo';

/* Likes / Reacciones */

export const darLike = async (
    tipo: TipoLikeable,
    targetId: number,
    reaccion: TipoReaccion = 'like'
): Promise<RespuestaApi<{ liked: boolean; reaccion: TipoReaccion }>> => {
    /* Backend espera snake_case: target_id */
    return apiPost<{ liked: boolean; reaccion: TipoReaccion }>(`/like`, { tipo, target_id: targetId, reaccion });
};

export const quitarLike = async (
    tipo: TipoLikeable,
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
    tipo: TipoComentable,
    targetId: number,
    page = 1
): Promise<RespuestaApi<Comentario[]>> => {
    return apiGet<Comentario[]>(`/comentarios/${tipo}/${targetId}`, { page });
};

export const crearComentario = async (
    tipo: TipoComentable,
    targetId: number,
    contenido: string,
    parentId?: number
): Promise<RespuestaApi<Comentario>> => {
    const body: Record<string, unknown> = { contenido };
    if (parentId) body.parentId = parentId;
    return apiPost<Comentario>(`/comentarios/${tipo}/${targetId}`, body);
};

/*
 * C130: Crear comentario multimedia (imagen o audio).
 * Envía FormData con el archivo + contenido opcional (caption).
 */
export const crearComentarioMultimedia = async (
    tipo: TipoComentable,
    targetId: number,
    tipoContenido: 'imagen' | 'audio',
    archivo: File,
    contenido?: string,
    parentId?: number
): Promise<RespuestaApi<Comentario>> => {
    const formData = new FormData();
    formData.append('tipoContenido', tipoContenido);
    formData.append('media', archivo);
    if (contenido) formData.append('contenido', contenido);
    if (parentId) formData.append('parentId', String(parentId));
    return apiPostFormData<Comentario>(`/comentarios/${tipo}/${targetId}`, formData);
};

/* C264: Editar comentario (solo autor) */
export const editarComentario = async (
    id: number,
    contenido: string
): Promise<RespuestaApi<{ id: number; contenido: string; editadoAt: string }>> => {
    return apiPut<{ id: number; contenido: string; editadoAt: string }>(`/comentarios/${id}`, { contenido });
};

/* C264: Eliminar comentario (autor o admin) */
export const eliminarComentario = async (id: number): Promise<RespuestaApi<{ ok: boolean }>> => {
    return apiDelete<{ ok: boolean }>(`/comentarios/${id}`);
};

/* C264: Reportar comentario */
export const reportarComentario = async (
    id: number,
    razon: string
): Promise<RespuestaApi<{ ok: boolean; message: string }>> => {
    return apiPost<{ ok: boolean; message: string }>(`/comentarios/${id}/reportar`, { razon });
};

/* C265: Like/unlike comentario */
export const darLikeComentario = async (
    id: number
): Promise<RespuestaApi<{ totalLikes: number; liked: boolean }>> => {
    return apiPost<{ totalLikes: number; liked: boolean }>(`/comentarios/${id}/like`);
};

export const quitarLikeComentario = async (
    id: number
): Promise<RespuestaApi<{ totalLikes: number; liked: boolean }>> => {
    return apiDelete<{ totalLikes: number; liked: boolean }>(`/comentarios/${id}/like`);
};

/* C265: Obtener respuestas de un comentario */
export const obtenerRespuestas = async (
    comentarioId: number
): Promise<RespuestaApi<Comentario[]>> => {
    return apiGet<Comentario[]>(`/comentarios/${comentarioId}/respuestas`);
};

/* Reposts */

export const repostear = async (publicacionId: number): Promise<RespuestaApi<{ reposteado: boolean }>> => {
    return apiPost<{ reposteado: boolean }>(`/publicaciones/${publicacionId}/repost`);
};

export const quitarRepost = async (publicacionId: number): Promise<RespuestaApi<{ reposteado: boolean }>> => {
    return apiDelete<{ reposteado: boolean }>(`/publicaciones/${publicacionId}/repost`);
};

/* Obtener una publicación individual (para actualizar en tiempo real tras edición) */
export const obtenerPublicacion = async (id: number): Promise<RespuestaApi<Publicacion>> => {
    return apiGet<Publicacion>(`/publicaciones/${id}`);
};

/* Subir imagen para publicación al servidor (evita blob:// URLs) */
export const subirImagenPublicacion = async (archivo: File): Promise<RespuestaApi<{ url: string }>> => {
    const formData = new FormData();
    formData.append('imagen', archivo);
    return apiPostFormData<{ url: string }>('/publicaciones/imagenes', formData);
};

/* C322: Reportar publicación */
export const reportarPublicacion = async (
    publicacionId: number,
    razon: string = 'contenido inapropiado'
): Promise<RespuestaApi<{ ok: boolean; message: string }>> => {
    return apiPost<{ ok: boolean; message: string }>(`/publicaciones/${publicacionId}/reportar`, { razon });
};

/* QQ23: Reportar usuario */
export const reportarUsuario = async (
    usuarioId: number,
    razon: string,
    detalles?: string,
): Promise<RespuestaApi<{ ok: boolean; message: string }>> => {
    return apiPost<{ ok: boolean; message: string }>(`/reportar-usuario/${usuarioId}`, { razon, detalles });
};

/* C126: Datos editables de una publicación */
export interface DatosActualizarPublicacion {
    contenido?: string;
    imagenes?: string[];
    samplesAdjuntos?: number[];
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
