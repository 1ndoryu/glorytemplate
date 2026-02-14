/*
 * Service: apiAuth — Kamples
 * Funciones de autenticación y perfil de usuario.
 */

import { apiGet, apiPost, apiPut } from './apiCliente';
import type { Usuario, UsuarioAutenticado } from '../types';

/*
 * Obtiene el perfil del usuario actualmente autenticado.
 * TO-DO: implementar endpoint /kamples/v1/me
 */
export const obtenerUsuarioActual = async () => {
    return apiGet<UsuarioAutenticado>('/me');
};

/*
 * Obtiene un perfil público por username.
 */
export const obtenerPerfil = async (username: string) => {
    return apiGet<Usuario>(`/perfil/${username}`);
};

/*
 * Actualiza el perfil del usuario autenticado.
 * TO-DO: implementar endpoint PUT /kamples/v1/me
 */
export const actualizarPerfil = async (datos: Partial<Usuario>) => {
    return apiPut<Usuario>('/me', datos);
};

/*
 * Login con credenciales (delega a WP).
 * TO-DO: implementar cuando tengamos auth custom.
 */
export const login = async (email: string, password: string) => {
    return apiPost<{ token: string; usuario: UsuarioAutenticado }>('/auth/login', {
        email,
        password,
    });
};

/*
 * Registro de nuevo usuario.
 * TO-DO: implementar endpoint POST /kamples/v1/auth/registro
 */
export const registrar = async (datos: {
    username: string;
    email: string;
    password: string;
    nombreVisible: string;
}) => {
    return apiPost<{ token: string; usuario: UsuarioAutenticado }>('/auth/registro', datos);
};
