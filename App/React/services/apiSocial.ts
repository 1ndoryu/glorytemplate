/*
 * Service: apiSocial — Kamples
 * Funciones de red social: follows, likes, publicaciones.
 */

import { apiGet, apiPost, apiDelete } from './apiCliente';
import type { Publicacion } from '../types';

/*
 * Follow a un usuario.
 */
export const seguirUsuario = async (usuarioId: number) => {
    return apiPost<{ seguido: boolean }>(`/follow/${usuarioId}`);
};

/*
 * Unfollow de un usuario.
 */
export const dejarDeSeguir = async (usuarioId: number) => {
    return apiDelete<{ seguido: boolean }>(`/follow/${usuarioId}`);
};

/*
 * Like a un sample o publicación.
 */
export const darLike = async (tipo: 'sample' | 'publicacion', targetId: number) => {
    return apiPost<{ liked: boolean }>(`/like`, { tipo, targetId });
};

/*
 * Quitar like.
 */
export const quitarLike = async (tipo: 'sample' | 'publicacion', targetId: number) => {
    return apiDelete<{ liked: boolean }>(`/like/${tipo}/${targetId}`);
};

/*
 * Crear publicación social.
 */
export const crearPublicacion = async (datos: {
    tipo: 'social' | 'sample';
    contenido: string;
    imagenes?: string[];
    samplesAdjuntos?: number[];
}) => {
    return apiPost<Publicacion>('/publicaciones', datos);
};

/*
 * Obtener feed de inicio (publicaciones de seguidos + trending).
 */
export const obtenerFeedInicio = async (page = 1) => {
    return apiGet<Publicacion[]>('/feed/inicio', { page });
};
