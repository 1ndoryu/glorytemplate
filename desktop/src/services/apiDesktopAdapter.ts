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

function obtenerServidorUrl(): string {    const config = window.__KAMPLES_CONFIG__ as { serverUrl?: string } | undefined;    if (config?.serverUrl) return config.serverUrl;

    /* En dev, Vite proxy redirige /wp-json al target (kamples.com por defecto) */
    if (import.meta.env.DEV) return SERVIDOR_DEV;
    return SERVIDOR_PROD;
}

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
 */
const fetchOriginal = window.fetch.bind(window);

export function inyectarAuthHeader(token: string): void {
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        let url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

        /* Reescribir URLs absolutas a glory.local como relativas (proxy) */
        const urlProxy = reescribirUrlParaProxy(url);
        if (urlProxy !== url) {
            input = urlProxy;
            url = urlProxy;
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

        /* Interceptar respuestas JSON para reescribir URLs del backend */
        if (import.meta.env.DEV && url.includes('/wp-json/')) {
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
 * Necesario para que las imagenes/audio carguen antes de autenticarse.
 */
export function configurarProxyFetch(): void {
    if (!import.meta.env.DEV) return;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const urlProxy = reescribirUrlParaProxy(url);

        const response = await fetchOriginal(urlProxy !== url ? urlProxy : input, init);

        /* Interceptar respuestas JSON para reescribir URLs */
        if (url.includes('/wp-json/')) {
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
