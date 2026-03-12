/*
 * Service: apiBloqueos — Kamples (QQ25)
 * Funciones de bloqueo/desbloqueo de usuarios.
 */

import { apiGet, apiPost, apiDelete } from './apiCliente';
import type { RespuestaApi } from './apiCliente';

export interface UsuarioBloqueado {
    id: number;
    username: string;
    nombre_visible: string;
    avatar_url: string | null;
    bloqueado_at: string;
}

export const bloquearUsuario = async (
    usuarioId: number
): Promise<RespuestaApi<{ ok: boolean }>> => {
    return apiPost<{ ok: boolean }>(`/block/${usuarioId}`);
};

export const desbloquearUsuario = async (
    usuarioId: number
): Promise<RespuestaApi<{ ok: boolean }>> => {
    return apiDelete<{ ok: boolean }>(`/block/${usuarioId}`);
};

export const obtenerMisBloqueados = async (): Promise<RespuestaApi<UsuarioBloqueado[]>> => {
    return apiGet<UsuarioBloqueado[]>('/me/bloqueados');
};
