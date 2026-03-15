/*
 * Servicio de autenticación Google para la app de escritorio nativa.
 *
 * Implementa OAuth 2.0 Authorization Code + PKCE (RFC 7636):
 * 1. Genera code_verifier y code_challenge con WebCrypto (sin deps extra).
 * 2. Invoca el comando Rust `iniciar_oauth_google` que:
 *    - Abre el navegador del sistema con la URL de autorización
 *    - Escucha en un puerto local para capturar el authorization code
 * 3. Llama al backend PHP para intercambiar el código por tokens
 *    (el client_secret nunca sale del servidor).
 *
 * No depende de Google Identity Services (GSI): funciona en cualquier webview
 * sin importar si el origen está registrado en Google Cloud Console.
 */

import { invoke } from '@tauri-apps/api/core';
import { loginConGoogleDesktop } from '@app/services/apiAuth';
import type { UsuarioAutenticado } from '@app/types/usuario';

interface OAuthCallbackResult {
    code: string;
    redirect_uri: string;
}

export interface GoogleAuthDesktopResult {
    token: string;
    usuario: UsuarioAutenticado;
}

/* RFC 7636: genera un code_verifier aleatorio de 64 bytes en base64url */
async function generarPkce(): Promise<{ codeVerifier: string; codeChallenge: string }> {
    const randomBytes = new Uint8Array(64);
    crypto.getRandomValues(randomBytes);

    const codeVerifier = btoa(String.fromCharCode(...randomBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    /* code_challenge = BASE64URL(SHA-256(ASCII(code_verifier))) */
    const encoded = new TextEncoder().encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    return { codeVerifier, codeChallenge };
}

/*
 * Inicia el flujo OAuth de Google abriendo el navegador del sistema.
 * Bloquea hasta que el usuario completa la autenticación (máx 5 min).
 * El backend Rust captura el callback y lo devuelve aquí para
 * intercambiarlo server-side sin exponer secretos en el bundle.
 */
export async function iniciarGoogleOAuthDesktop(): Promise<GoogleAuthDesktopResult> {
    const { codeVerifier, codeChallenge } = await generarPkce();

    /* Abrir browser + esperar callback (bloqueante en hilo Rust) */
    const callbackResult = await invoke<OAuthCallbackResult>('iniciar_oauth_google', {
        codeChallenge,
    });

    const { code, redirect_uri } = callbackResult;

    /* Intercambiar código por tokens vía nuestro backend PHP (mantiene client_secret seguro) */
    const authResp = await loginConGoogleDesktop({
        code,
        codeVerifier,
        redirectUri: redirect_uri,
    });

    if (!authResp.ok || !authResp.data) {
        throw new Error(authResp.error ?? 'Error al intercambiar código de autorización con Google');
    }

    return authResp.data as unknown as GoogleAuthDesktopResult;
}
