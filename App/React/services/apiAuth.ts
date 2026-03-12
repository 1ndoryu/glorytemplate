/*
 * Service: apiAuth — Kamples
 * Funciones de autenticación y perfil de usuario.
 */

import { apiGet, apiPost, apiPut, apiPostFormData } from './apiCliente';
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
 * Sube una imagen de perfil (avatar).
 * Usa FormData para enviar el archivo binario al servidor.
 */
export const subirAvatar = async (archivo: File) => {
    const formData = new FormData();
    formData.append('avatar', archivo);
    return apiPostFormData<{ ok: boolean; data: UsuarioAutenticado; avatarUrl: string }>('/me/avatar', formData);
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
 * Endpoint: POST /kamples/v1/auth/registro
 */
export const registrar = async (datos: {
    username: string;
    email: string;
    password: string;
    nombreVisible: string;
}) => {
    return apiPost<{ token: string; usuario: UsuarioAutenticado }>('/auth/registro', datos);
};

/*
 * QQ14: Cierra la sesión del usuario via API (sin redirigir a wp-login.php).
 * Destruye cookies WP server-side.
 */
export const cerrarSesion = async () => {
    return apiPost<{ ok: boolean }>('/auth/logout', {});
};

/*
 * QQ40: Login/registro con Google OAuth.
 * Recibe el credential (ID token de Google Identity Services)
 * y lo envía al backend para verificación server-side.
 */
export const loginConGoogle = async (credential: string) => {
    return apiPost<{ token: string; usuario: UsuarioAutenticado }>('/auth/google', {
        credential,
    });
};
