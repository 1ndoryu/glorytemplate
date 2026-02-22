/*
 * Adaptador de API para desktop.
 * Configura GLORY_CONTEXT para que apiCliente.ts funcione
 * apuntando al servidor remoto en vez de WordPress local.
 *
 * En la web: PHP inyecta GLORY_CONTEXT con apiUrl y nonce.
 * En desktop: lo inyectamos manualmente con la URL del servidor
 * y un token JWT persistente en vez del nonce de sesión.
 */

import { esDesktop } from './desktopService';
import { obtenerToken } from './authDesktopService';

/*
 * URL base del servidor Kamples.
 * En desarrollo: la instancia local de WordPress.
 * En producción: el dominio del VPS.
 * Se puede configurar desde settings.
 */
const SERVIDOR_DEV = 'http://glory.local/wp-json';
const SERVIDOR_PROD = 'https://kamples.com/wp-json';

function obtenerServidorUrl(): string {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const config = (window as any).__KAMPLES_CONFIG__ as { serverUrl?: string } | undefined;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    if (config?.serverUrl) return config.serverUrl;

    /* En modo Tauri dev, usar instancia local de WordPress */
    if (import.meta.env.DEV) return SERVIDOR_DEV;
    return SERVIDOR_PROD;
}

/*
 * Inyecta GLORY_CONTEXT en window para que apiCliente.ts
 * funcione sin modificaciones.
 * El nonce se reemplaza por el token JWT almacenado localmente.
 */
export function configurarApiDesktop(): void {
    if (!esDesktop()) return;

    const token = obtenerToken();
    const serverUrl = obtenerServidorUrl();

    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).GLORY_CONTEXT = {
        apiUrl: serverUrl,
        restUrl: serverUrl,
        /* El nonce se usa en header X-WP-Nonce por apiCliente.
         * En desktop usamos JWT vía Authorization header.
         * Dejamos nonce vacío y añadimos el interceptor. */
        nonce: '',
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */

    /* Interceptar fetch para añadir Authorization header con JWT */
    if (token) {
        inyectarAuthHeader(token);
    }
}

/*
 * Intercepta fetch globalmente para añadir el header Authorization
 * cuando la petición va al servidor Kamples.
 * Esto permite que apiCliente.ts funcione sin modificaciones.
 */
const fetchOriginal = window.fetch.bind(window);

export function inyectarAuthHeader(token: string): void {
    const serverUrl = obtenerServidorUrl();

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

        /* Solo inyectar auth en peticiones al servidor Kamples */
        if (url.startsWith(serverUrl)) {
            const headers = new Headers(init?.headers);
            headers.set('Authorization', `Bearer ${token}`);
            /* En desktop, no usar credentials: same-origin (es cross-origin) */
            return fetchOriginal(input, {
                ...init,
                headers,
                credentials: 'omit',
            });
        }

        return fetchOriginal(input, init);
    };
}

/*
 * Actualiza el token en el interceptor (después de login o refresh).
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
