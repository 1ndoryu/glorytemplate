/*
 * Servicio de autenticacion Google para Android (APK Tauri).
 *
 * Flujo: PKCE + deep link
 * 1. Genera code_verifier con WebCrypto
 * 2. Abre Chrome con la URL de autorizacion de Google
 * 3. Google redirige a nuestro backend PHP (/auth/google/mobile-callback)
 * 4. PHP intercambia code por tokens, genera JWT
 * 5. PHP redirige a kamples://auth?payload=BASE64URL(json)
 * 6. El plugin deep-link captura la URL y onOpenUrl() la recibe en JS
 * 7. Este servicio parsea el payload y retorna token + usuario
 *
 * El client_secret NUNCA sale del servidor.
 */

import { open } from '@tauri-apps/plugin-shell';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import type { UsuarioAutenticado } from '@app/types/usuario';

const GOOGLE_CLIENT_ID = '481587675160-g24onokgnnuhnghplrl1q3iscfnfc0ea.apps.googleusercontent.com';
const REDIRECT_URI = 'https://kamples.com/wp-json/kamples/v1/auth/google/mobile-callback';
const TIMEOUT_MS = 300_000; /* 5 minutos */

export interface GoogleAuthMobileResult {
    token: string;
    usuario: UsuarioAutenticado;
}

/* RFC 7636: genera code_verifier aleatorio de 64 bytes en base64url */
async function generarPkce(): Promise<{ codeVerifier: string; codeChallenge: string }> {
    const randomBytes = new Uint8Array(64);
    crypto.getRandomValues(randomBytes);

    const codeVerifier = btoa(String.fromCharCode(...randomBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    const encoded = new TextEncoder().encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    return { codeVerifier, codeChallenge };
}

/* Codifica string a base64url (sin padding) para el parametro state */
function base64urlEncode(str: string): string {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/* Decodifica base64url a string */
function base64urlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return atob(base64);
}

/*
 * Inicia el flujo OAuth de Google para Android.
 * Abre Chrome y espera el deep link de callback con el payload.
 * Retorna Promise que resuelve con token + usuario o rechaza en timeout/error.
 */
export async function iniciarGoogleOAuthMobile(): Promise<GoogleAuthMobileResult> {
    const { codeVerifier, codeChallenge } = await generarPkce();

    /* El state lleva el code_verifier en base64url para que el backend
     * PHP lo use en el token exchange con Google */
    const state = base64urlEncode(codeVerifier);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: 'openid email profile',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        access_type: 'offline',
        prompt: 'select_account',
        state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return new Promise<GoogleAuthMobileResult>((resolve, reject) => {
        let resuelta = false;
        let cancelarListener: (() => void) | null = null;

        const timeout = setTimeout(() => {
            if (resuelta) return;
            resuelta = true;
            if (cancelarListener) cancelarListener();
            reject(new Error('Timeout: la autenticacion con Google no se completo en 5 minutos'));
        }, TIMEOUT_MS);

        /* Escuchar el deep link kamples://auth?payload=... */
        onOpenUrl((urls: string[]) => {
            for (const urlStr of urls) {
                if (resuelta) return;

                try {
                    const url = new URL(urlStr);
                    if (url.protocol !== 'kamples:' || url.host !== 'auth') continue;

                    const payload = url.searchParams.get('payload');
                    const error = url.searchParams.get('error');

                    if (error) {
                        resuelta = true;
                        clearTimeout(timeout);
                        reject(new Error(decodeURIComponent(error)));
                        return;
                    }

                    if (!payload) continue;

                    const datos = JSON.parse(base64urlDecode(payload)) as {
                        token?: string;
                        usuario?: UsuarioAutenticado;
                    };

                    if (!datos.token || !datos.usuario) {
                        resuelta = true;
                        clearTimeout(timeout);
                        reject(new Error('Payload OAuth incompleto: falta token o usuario'));
                        return;
                    }

                    resuelta = true;
                    clearTimeout(timeout);
                    resolve({ token: datos.token, usuario: datos.usuario });
                } catch (err) {
                    if (!resuelta) {
                        resuelta = true;
                        clearTimeout(timeout);
                        reject(err instanceof Error ? err : new Error(String(err)));
                    }
                }
            }
        }).then(fn => {
            cancelarListener = fn;
            if (resuelta && cancelarListener) cancelarListener();
        }).catch(err => {
            if (!resuelta) {
                resuelta = true;
                clearTimeout(timeout);
                reject(err instanceof Error ? err : new Error(String(err)));
            }
        });

        /* Abrir Chrome con la URL de autorizacion */
        open(authUrl).catch(err => {
            if (!resuelta) {
                resuelta = true;
                clearTimeout(timeout);
                if (cancelarListener) cancelarListener();
                reject(new Error(`Error abriendo navegador: ${err}`));
            }
        });
    });
}
