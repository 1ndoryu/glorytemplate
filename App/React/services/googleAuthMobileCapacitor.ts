/* [173A-8] OAuth móvil con Capacitor.
 * Usa Browser + App para volver al WebView vía deep link y conserva polling server-side como respaldo.
 * Gotcha: el navegador externo no comparte cookies con el WebView, por eso el backend devuelve JWT. */

import { crearLogger } from './logger';
import type { UsuarioAutenticado } from '../types/usuario';

const GOOGLE_CLIENT_ID = '481587675160-g24onokgnnuhnghplrl1q3iscfnfc0ea.apps.googleusercontent.com';
const TIMEOUT_MS = 300_000;
const log = crearLogger('googleAuthMobileCapacitor');

export interface GoogleAuthMobileCapacitorResult {
    token: string;
    usuario: UsuarioAutenticado;
}

function obtenerBaseApi(): string {
    const glory = (window as unknown as Record<string, unknown>).GLORY_CONTEXT as
        | { apiUrl?: string; restUrl?: string }
        | undefined;
    
    const urlBackend = glory?.apiUrl ?? glory?.restUrl;
    if (urlBackend) {
        try {
            const urlObj = new URL(urlBackend);
            return urlObj.origin;
        } catch {
            return 'https://kamples.com';
        }
    }
    
    // Si estamos en Capacitor WebView (localhost), forzamos la URL de producción
    // para que Google autorice el redirect_uri configurado en su consola.
    return 'https://kamples.com';
}

function obtenerRedirectUri(): string {
    return `${obtenerBaseApi()}/wp-json/kamples/v1/auth/google/mobile-callback`;
}

function obtenerEstadoUri(requestId: string): string {
    return `${obtenerBaseApi()}/wp-json/kamples/v1/auth/google/mobile-status?request_id=${encodeURIComponent(requestId)}&_t=${Date.now()}`;
}

function base64urlEncode(str: string): string {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function base64urlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return atob(base64);
}

function generarRequestId(): string {
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function generarPkce(): Promise<{ codeVerifier: string; codeChallenge: string }> {
    const bytes = new Uint8Array(64);
    crypto.getRandomValues(bytes);

    const codeVerifier = btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    return { codeVerifier, codeChallenge };
}

function extraerResultadoDeepLink(urlStr: string): GoogleAuthMobileCapacitorResult {
    const url = new URL(urlStr);
    const protocoloValido = url.protocol === 'com.kamples.mobile:' || url.protocol === 'kamples:';
    if (!protocoloValido || url.host !== 'auth') {
        throw new Error('Deep link OAuth no coincide con Kamples');
    }

    const error = url.searchParams.get('error');
    if (error) {
        throw new Error(decodeURIComponent(error));
    }

    const payload = url.searchParams.get('payload');
    if (!payload) {
        throw new Error('Deep link OAuth sin payload');
    }

    const datos = JSON.parse(base64urlDecode(payload)) as {
        token?: string;
        usuario?: UsuarioAutenticado;
    };

    if (!datos.token || !datos.usuario) {
        throw new Error('Payload OAuth incompleto');
    }

    return {
        token: datos.token,
        usuario: datos.usuario,
    };
}

async function consultarEstadoServidor(requestId: string): Promise<GoogleAuthMobileCapacitorResult | 'pendiente'> {
    const resp = await fetch(obtenerEstadoUri(requestId), {
        method: 'GET',
        credentials: 'omit',
        headers: {
            Accept: 'application/json',
        },
    });

    if (!resp.ok) {
        throw new Error(`Error consultando estado OAuth mobile: HTTP ${resp.status}`);
    }

    const data = await resp.json() as {
        ok?: boolean;
        estado?: string;
        error?: string | null;
        data?: GoogleAuthMobileCapacitorResult | null;
    };

    if (!data.ok) {
        throw new Error(data.error || 'Error consultando estado OAuth mobile');
    }

    if (data.estado === 'pendiente') {
        return 'pendiente';
    }

    if (data.estado === 'error') {
        throw new Error(data.error || 'Error al completar autenticación con Google');
    }

    if (!data.data?.token || !data.data?.usuario) {
        throw new Error('Estado OAuth mobile incompleto');
    }

    return data.data;
}

export async function iniciarGoogleOAuthCapacitor(): Promise<GoogleAuthMobileCapacitorResult> {
    const [{ App }, { Browser }] = await Promise.all([
        import('@capacitor/app'),
        import('@capacitor/browser'),
    ]);

    const { codeVerifier, codeChallenge } = await generarPkce();
    const requestId = generarRequestId();
    const state = base64urlEncode(JSON.stringify({ codeVerifier, requestId }));

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: obtenerRedirectUri(),
        scope: 'openid email profile',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        access_type: 'offline',
        prompt: 'select_account',
        state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return new Promise<GoogleAuthMobileCapacitorResult>((resolve, reject) => {
        let resuelta = false;
        let timeoutId: number | null = null;
        let pollingId: number | null = null;
        let appListener: { remove: () => Promise<void> } | null = null;

        const limpiar = async () => {
            if (timeoutId !== null) window.clearTimeout(timeoutId);
            if (pollingId !== null) window.clearInterval(pollingId);
            if (appListener) {
                try {
                    await appListener.remove();
                } catch {
                    /* noop */
                }
            }
            try {
                await Browser.close();
            } catch {
                /* noop */
            }
        };

        const finalizarConError = async (err: unknown) => {
            if (resuelta) return;
            resuelta = true;
            await limpiar();
            reject(err instanceof Error ? err : new Error(String(err)));
        };

        const finalizarConExito = async (resultado: GoogleAuthMobileCapacitorResult) => {
            if (resuelta) return;
            resuelta = true;
            await limpiar();
            resolve(resultado);
        };

        App.addListener('appUrlOpen', ({ url }: { url: string }) => {
            if (!url || resuelta) return;
            try {
                log.info('OAuth móvil: deep link recibido');
                void finalizarConExito(extraerResultadoDeepLink(url));
            } catch (err) {
                void finalizarConError(err);
            }
        }).then(listener => {
            appListener = listener;
        }).catch(err => {
            void finalizarConError(err);
        });

        timeoutId = window.setTimeout(() => {
            void finalizarConError(new Error('Timeout: la autenticación con Google no se completó en 5 minutos.'));
        }, TIMEOUT_MS);

        pollingId = window.setInterval(() => {
            if (resuelta) return;

            consultarEstadoServidor(requestId)
                .then((resultado) => {
                    if (resultado === 'pendiente' || resuelta) return;
                    log.info('OAuth móvil completado por polling server-side');
                    void finalizarConExito(resultado);
                })
                .catch((err) => {
                    if (resuelta) return;
                    if (err instanceof Error && /HTTP 404|HTTP 429|HTTP 5\d\d/.test(err.message)) {
                        log.debug('Polling OAuth mobile reintentable', err.message);
                        return;
                    }
                    void finalizarConError(err);
                });
        }, 1500);

        Browser.open({ url: authUrl }).catch(err => {
            void finalizarConError(new Error(`Error abriendo navegador: ${String(err)}`));
        });

        consultarEstadoServidor(requestId)
            .then((resultado) => {
                if (resultado === 'pendiente' || resuelta) return;
                void finalizarConExito(resultado);
            })
            .catch(() => {
                /* polling activo */
            });
    });
}