/*
 * Adaptador de API para desktop.
 * Configura GLORY_CONTEXT para que apiCliente.ts funcione.
 *
 * En DEV: Vite proxy redirige /wp-json y /wp-content al servidor target
 *         (kamples.com por defecto, configurable via KAMPLES_API_TARGET).
 * En PROD: apunta directamente al servidor de produccion.
 *
 * En la web: PHP inyecta GLORY_CONTEXT con apiUrl y nonce.
 * En desktop: lo inyectamos manualmente con URL local (proxy)
 * y un token JWT persistente en vez del nonce de sesion.
 */

import { esDesktop } from './desktopService';
import { obtenerToken } from './authDesktopService';

/*
 * URL base del servidor Kamples.
 * En desarrollo: el proxy de Vite (mismo origen, sin CORS).
 * En produccion: el dominio del VPS.
 */
const SERVIDOR_DEV = '/wp-json';
const SERVIDOR_PROD = 'https://kamples.com/wp-json';

/*
 * Android: Tauri intercepta TODOS los requests al host del dev server (10.x.x.x:1420)
 * via shouldInterceptRequest. Al recrear el WebResourceRequest sin el body (limitacion
 * de la API de Android), el POST llega sin cuerpo a Vite/PHP.
 * Solucion: en Android dev, requests directos a kamples.com — Tauri no los intercepta.
 * kamples.com devuelve CORS dinamico (echo del Origin), asi que funciona cross-origin.
 */
const esAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

function obtenerServidorUrl(): string {
    const config = window.__KAMPLES_CONFIG__ as { serverUrl?: string } | undefined;
    if (config?.serverUrl) return config.serverUrl;

    if (import.meta.env.DEV) {
        /* Android dev: ir directo a produccion para evitar que Tauri intercepte y pierda el body */
        if (esAndroid) return SERVIDOR_PROD;
        /* Desktop dev: Vite proxy redirige /wp-json al target (kamples.com por defecto) */
        return SERVIDOR_DEV;
    }
    return SERVIDOR_PROD;
}

/*
 * Google Client ID inyectado en build time por Vite (define en vite.config.ts).
 * Lee de la .env del proyecto raiz — es un valor publico, no un secret.
 */
declare const __GOOGLE_CLIENT_ID__: string;

/*
 * Inyecta GLORY_CONTEXT en window para que apiCliente.ts
 * funcione sin modificaciones.
 */
export function configurarApiDesktop(): void {
    if (!esDesktop()) return;

    const token = obtenerToken();
    const serverUrl = obtenerServidorUrl();    window.GLORY_CONTEXT = {
        apiUrl: serverUrl,
        restUrl: serverUrl,
        /* Nonce vacio: en desktop usamos JWT via Authorization header */
        nonce: '',
        /* QK16: Google Client ID para GSI (login con Google en desktop) */
        googleClientId: typeof __GOOGLE_CLIENT_ID__ !== 'undefined' ? __GOOGLE_CLIENT_ID__ : '',
    };    /* Configurar interceptor: si hay token, inyecta auth + proxy.
     * Si no hay token (primer uso), solo proxy de URLs. */
    if (token) {
        inyectarAuthHeader(token);
    } else {
        configurarProxyFetch();
    }
}

/*
 * En dev, el backend retorna URLs absolutas (https://kamples.com/wp-content/...).
 * Las convertimos a relativas (/wp-content/...) para que pasen por el proxy Vite.
 * Lista de dominios cuyas URLs deben ser reescritas al proxy local.
 */
const DOMINIOS_PROXY = ['http://glory.local', 'https://glory.local', 'https://kamples.com', 'http://kamples.com'];

function reescribirUrlParaProxy(url: string): string {
    if (!import.meta.env.DEV) return url;
    for (const dominio of DOMINIOS_PROXY) {
        if (url.startsWith(dominio)) {
            return url.slice(dominio.length);
        }
    }
    return url;
}

/*
 * Resuelve una URL segun el entorno y plataforma:
 * - Android dev: relativas /wp-json/* -> absolutas kamples.com (bypass interceptor Tauri)
 * - Desktop dev: absolutas kamples.com/* -> relativas /wp-json/* (proxy Vite)
 * - Prod: sin cambio
 */
function resolverUrlParaEntorno(url: string): string {
    if (!import.meta.env.DEV) return url;
    if (esAndroid) {
        /* Relativas que van al dev server: convertir a absolutas para esquivar Tauri */
        if (url.startsWith('/')) return `https://kamples.com${url}`;
        return url;
    }
    /* Desktop: absolutas kamples.com -> relativas para Vite proxy */
    return reescribirUrlParaProxy(url);
}

/*
 * Reescribe recursivamente todas las URLs de glory.local en un objeto JSON.
 * Esto asegura que <img src>, <audio src> y cualquier URL en datos
 * apunten al proxy local de Vite en vez de cross-origin.
 */
function reescribirUrlsEnObjeto<T>(obj: T): T {
    if (!import.meta.env.DEV) return obj;
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        return reescribirUrlParaProxy(obj) as unknown as T;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => reescribirUrlsEnObjeto(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
        const resultado: Record<string, unknown> = {};
        for (const [clave, valor] of Object.entries(obj as Record<string, unknown>)) {
            resultado[clave] = reescribirUrlsEnObjeto(valor);
        }
        return resultado as T;
    }

    return obj;
}

/*
 * Intercepta fetch globalmente para:
 * 1. Reescribir URLs de request a glory.local como relativas (proxy Vite).
 * 2. Anadir header Authorization con JWT en peticiones a la API.
 * 3. Reescribir URLs en las respuestas JSON (imagenes, audio, etc.).
 * 4. QK16: Detectar 401 (token expirado) y auto-logout.
 */
const fetchOriginal = window.fetch.bind(window);

/*
 * QK16: Guard de concurrencia para evitar que multiples 401 simultaneos
 * disparen logout/redireccion multiples veces.
 */
let manejando401 = false;

/*
 * QK38: Flag de inicializacion completa.
 * Los 401 durante la inicializacion (sync service, offline queue) se ignoran
 * porque pueden ser transitorios (servidor arrancando, timing, etc.).
 * Solo se procesan 401s DESPUES de que todos los servicios esten listos.
 */
let authInicializada = false;

/*
 * QK38: Marca el sistema de auth como completamente inicializado.
 * Se llama desde desktopService DESPUES de que auth + sync + offline esten listos.
 */
export function marcarAuthInicializada(): void {
    authInicializada = true;
}

async function manejarSesionExpirada(): Promise<void> {
    /* QK38: No procesar 401s durante la inicializacion — pueden ser transitorios */
    if (!authInicializada) return;
    if (manejando401) return;
    manejando401 = true;

    try {
        /* QK38: Verificar si el token realmente expiro antes de destruir la sesion.
         * Usa fetchOriginal para evitar recursion con el interceptor. */
        const { obtenerToken: leerToken } = await import('./authDesktopService');
        const tokenActual = leerToken();

        if (tokenActual) {
            const baseUrl = (window.GLORY_CONTEXT as Record<string, string> | undefined)?.apiUrl ?? '/wp-json';
            try {
                const resp = await fetchOriginal(`${baseUrl}/kamples/v1/me`, {
                    headers: {
                        'Authorization': `Bearer ${tokenActual}`,
                        'X-Kamples-Auth': `Bearer ${tokenActual}`,
                    },
                });
                if (resp.ok) {
                    /* Token ES valido — el 401 original fue transitorio (cookie/nonce conflict, etc.) */
                    return;
                }
            } catch {
                /* Error de red — no hacer logout por fallo de conectividad */
                return;
            }
        }

        /* Token realmente invalido o inexistente — proceder con logout */
        const { cerrarSesionDesktop } = await import('./authDesktopService');
        await cerrarSesionDesktop();

        /* Limpiar estado de autenticacion en Zustand */
        const { useAuthStore } = await import('@app/stores/authStore');
        useAuthStore.getState().cerrarSesion();

        /* Redirigir a home — el flujo normal mostrara el modal de auth */
        const { useNavigationStore } = await import('@/core/router/navigationStore');
        useNavigationStore.getState().navegar('/');
    } catch (err) {
        console.error('[ApiDesktop] Error al manejar sesion expirada:', err);
    } finally {
        /* Delay antes de permitir re-manejo para evitar loops rapidos */
        setTimeout(() => { manejando401 = false; }, 2000);
    }
}

export function inyectarAuthHeader(token: string): void {
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        let url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

        /* Resolver URL segun plataforma: Android->absoluta kamples.com, Desktop dev->proxy Vite */
        const urlResuelta = resolverUrlParaEntorno(url);
        if (urlResuelta !== url) {
            input = urlResuelta;
            url = urlResuelta;
        }

        /* Preparar headers */
        const headers = new Headers(init?.headers);

        /* Inyectar auth en peticiones a la API Kamples */
        if (url.includes('/wp-json/')) {
            headers.set('Authorization', `Bearer ${token}`);
            /* Fallback para nginx/LocalWP que no pasan Authorization a PHP-FPM */
            headers.set('X-Kamples-Auth', `Bearer ${token}`);
        }

        const response = await fetchOriginal(input, {
            ...init,
            headers,
        });

        /* QK16: Token expirado/invalido — auto-logout y redireccion.
         * Se dispara async para que el caller reciba el 401 normalmente. */
        if (response.status === 401 && url.includes('/wp-json/')) {
            manejarSesionExpirada();
        }

        /* Interceptar respuestas JSON para reescribir URLs del backend (solo desktop dev) */
        if (import.meta.env.DEV && !esAndroid && url.includes('/wp-json/')) {
            const contentType = response.headers.get('content-type') ?? '';
            if (contentType.includes('application/json')) {
                const json = await response.json();
                const jsonReescrito = reescribirUrlsEnObjeto(json);
                return new Response(JSON.stringify(jsonReescrito), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                });
            }
        }

        return response;
    };
}

/*
 * Configura solo la reescritura de URLs (sin token, antes de login).
 * En desktop dev: reescribe absolutas a relativas para Vite proxy.
 * En Android dev: reescribe relativas a absolutas kamples.com para evitar
 * que Tauri intercepte el request al dev server y pierda el body POST.
 */
export function configurarProxyFetch(): void {
    if (!import.meta.env.DEV) return;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const urlResuelta = resolverUrlParaEntorno(url);
        const targetInput = urlResuelta !== url ? urlResuelta : input;

        const response = await fetchOriginal(targetInput, init);

        /* Reescribir URLs en respuestas JSON (solo desktop dev; Android usa URLs absolutas directas) */
        if (!esAndroid && url.includes('/wp-json/')) {
            const contentType = response.headers.get('content-type') ?? '';
            if (contentType.includes('application/json')) {
                const json = await response.json();
                const jsonReescrito = reescribirUrlsEnObjeto(json);
                return new Response(JSON.stringify(jsonReescrito), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                });
            }
        }

        return response;
    };
}

/*
 * Actualiza el token en el interceptor (despues de login o refresh).
 */
export function actualizarTokenApi(nuevoToken: string): void {
    inyectarAuthHeader(nuevoToken);
}

/*
 * Restaura fetch original (para logout).
 */
export function limpiarAuthApi(): void {
    window.fetch = fetchOriginal;
}
