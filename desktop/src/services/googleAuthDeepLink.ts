import { invoke } from '@tauri-apps/api/core';
import type { UsuarioAutenticado } from '@app/types/usuario';

export interface GoogleAuthMobileResult {
    token: string;
    usuario: UsuarioAutenticado;
}

/* Decodifica base64url a string. Google OAuth móvil devuelve el payload así. */
function base64urlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return atob(base64);
}

export async function leerDeepLinkPendienteAndroid(): Promise<string | null> {
    const url = await invoke<string | null>('leer_deep_link_android_pendiente');
    return url && url.trim() ? url : null;
}

export function extraerResultadoDeepLink(urlStr: string): GoogleAuthMobileResult {
    const url = new URL(urlStr);
    if (url.protocol !== 'kamples:' || url.host !== 'auth') {
        throw new Error('Deep link OAuth no coincide con Kamples');
    }

    const payload = url.searchParams.get('payload');
    const error = url.searchParams.get('error');

    if (error) {
        throw new Error(decodeURIComponent(error));
    }

    if (!payload) {
        throw new Error('Deep link OAuth sin payload');
    }

    const datos = JSON.parse(base64urlDecode(payload)) as {
        token?: string;
        usuario?: UsuarioAutenticado;
    };

    if (!datos.token || !datos.usuario) {
        throw new Error('Payload OAuth incompleto: falta token o usuario');
    }

    return { token: datos.token, usuario: datos.usuario };
}