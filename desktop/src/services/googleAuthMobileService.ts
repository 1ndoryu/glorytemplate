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
import { getCurrent, onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { crearLogger } from '@app/services/logger';
import { extraerResultadoDeepLink, leerDeepLinkPendienteAndroid, type GoogleAuthMobileResult } from './googleAuthDeepLink';

const GOOGLE_CLIENT_ID = '481587675160-g24onokgnnuhnghplrl1q3iscfnfc0ea.apps.googleusercontent.com';
const REDIRECT_URI = 'https://kamples.com/wp-json/kamples/v1/auth/google/mobile-callback';
const ESTADO_URI = 'https://kamples.com/wp-json/kamples/v1/auth/google/mobile-status';
const TIMEOUT_MS = 300_000; /* 5 minutos */
const log = crearLogger('googleAuthMobileService');

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

function generarRequestId(): string {
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function consultarEstadoServidor(requestId: string): Promise<GoogleAuthMobileResult | 'pendiente'> {
    const url = `${ESTADO_URI}?request_id=${encodeURIComponent(requestId)}&_t=${Date.now()}`;
    const resp = await fetch(url, {
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
        data?: GoogleAuthMobileResult | null;
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

async function leerDeepLinksActualesPlugin(): Promise<string[]> {
    try {
        const urls = await getCurrent();
        return Array.isArray(urls) ? urls.filter((url): url is string => typeof url === 'string' && url.length > 0) : [];
    } catch (err) {
        log.debug('No se pudo leer getCurrent() del plugin deep-link', err);
        return [];
    }
}

/*
 * Inicia el flujo OAuth de Google para Android.
 * Abre Chrome y espera el deep link de callback con el payload.
 * Retorna Promise que resuelve con token + usuario o rechaza en timeout/error.
 */
export async function iniciarGoogleOAuthMobile(): Promise<GoogleAuthMobileResult> {
    const { codeVerifier, codeChallenge } = await generarPkce();
    const deepLinksPrevios = new Set(await leerDeepLinksActualesPlugin());
    const requestId = generarRequestId();

    /* El state lleva el code_verifier en base64url para que el backend
     * PHP lo use en el token exchange con Google */
    const state = base64urlEncode(JSON.stringify({ codeVerifier, requestId }));

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
        let pollingId: number | null = null;
        let pollingServidorId: number | null = null;

        const limpiar = () => {
            clearTimeout(timeout);
            if (cancelarListener) cancelarListener();
            if (pollingId !== null) window.clearInterval(pollingId);
            if (pollingServidorId !== null) window.clearInterval(pollingServidorId);
        };

        const resolverDesdeUrl = (urlStr: string) => {
            if (resuelta) return;

            try {
                log.info('Procesando deep link OAuth Android');
                const resultado = extraerResultadoDeepLink(urlStr);
                resuelta = true;
                limpiar();
                resolve(resultado);
            } catch (err) {
                log.error('Error procesando deep link OAuth Android', err);
                if (!resuelta) {
                    resuelta = true;
                    limpiar();
                    reject(err instanceof Error ? err : new Error(String(err)));
                }
            }
        };

        const resolverDesdeColeccion = (urls: string[]) => {
            for (const urlStr of urls) {
                if (!deepLinksPrevios.has(urlStr)) {
                    resolverDesdeUrl(urlStr);
                    return;
                }
            }
        };

        const timeout = setTimeout(() => {
            if (resuelta) return;
            resuelta = true;
            limpiar();
            reject(new Error('Timeout: la autenticacion con Google no se completo en 5 minutos'));
        }, TIMEOUT_MS);

        /* Escuchar el deep link kamples://auth?payload=... */
        onOpenUrl((urls: string[]) => {
            resolverDesdeColeccion(urls);
        }).then(fn => {
            cancelarListener = fn;
            if (resuelta && cancelarListener) cancelarListener();
        }).catch(err => {
            if (!resuelta) {
                resuelta = true;
                limpiar();
                reject(err instanceof Error ? err : new Error(String(err)));
            }
        });

        pollingId = window.setInterval(() => {
            if (resuelta) return;

            leerDeepLinksActualesPlugin()
                .then((urls) => {
                    if (resuelta || urls.length === 0) return;
                    resolverDesdeColeccion(urls);
                })
                .catch(() => {
                    /* Best effort: seguimos con otras vías */
                });

            leerDeepLinkPendienteAndroid()
                .then((urlStr) => {
                    if (!urlStr || resuelta) return;
                    resolverDesdeUrl(urlStr);
                })
                .catch(() => {
                    /* Best effort: onOpenUrl sigue siendo la via principal */
                });
        }, 750);

        pollingServidorId = window.setInterval(() => {
            if (resuelta) return;

            consultarEstadoServidor(requestId)
                .then((resultado) => {
                    if (resultado === 'pendiente' || resuelta) return;

                    log.info('OAuth Android completado por polling server-side');
                    resuelta = true;
                    limpiar();
                    resolve(resultado);
                })
                .catch((err) => {
                    if (resuelta) return;

                    if (err instanceof Error && /HTTP 404|HTTP 429|HTTP 5\d\d/.test(err.message)) {
                        log.debug('Polling OAuth mobile reintentable', err.message);
                        return;
                    }

                    resuelta = true;
                    limpiar();
                    reject(err instanceof Error ? err : new Error(String(err)));
                });
        }, 1500);

        /* Abrir Chrome con la URL de autorizacion */
        open(authUrl).catch(err => {
            if (!resuelta) {
                resuelta = true;
                limpiar();
                reject(new Error(`Error abriendo navegador: ${err}`));
            }
        });

        leerDeepLinksActualesPlugin()
            .then((urls) => {
                if (resuelta || urls.length === 0) return;
                resolverDesdeColeccion(urls);
            })
            .catch(() => {
                /* El listener y el polling siguen activos */
            });

        consultarEstadoServidor(requestId)
            .then((resultado) => {
                if (resultado === 'pendiente' || resuelta) return;
                resuelta = true;
                limpiar();
                resolve(resultado);
            })
            .catch(() => {
                /* El polling seguirá intentando. */
            });
    });
}
