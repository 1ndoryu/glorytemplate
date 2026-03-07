/*
 * Servicio: errorSync — Taxonomía de errores y estrategias de recuperación.
 *
 * Clasifica errores HTTP y de red en categorías con estrategias
 * de retry específicas. Reemplaza el tratamiento uniforme de errores
 * con decisiones inteligentes por categoría.
 *
 * Inspirado en: patrón de clasificación de errores de Google Drive client.
 */

export type CategoriaError =
    | 'transitorio'
    | 'rate_limit'
    | 'conflicto'
    | 'autenticacion'
    | 'permanente'
    | 'desconocido';

export interface EstrategiaRecuperacion {
    reintentar: boolean;
    maxReintentos: number;
    calcularDelay: (intento: number) => number;
    notificarUsuario: boolean;
}

/**
 * Clasifica un error HTTP por su status code y opcionalmente el body.
 * Status 0 o ausente = error de red (transitorio).
 */
export function clasificarError(status: number, body?: string): CategoriaError {
    if (status === 0 || status === undefined) return 'transitorio';

    if (status === 429) return 'rate_limit';
    if (status === 409) return 'conflicto';
    if (status === 401 || status === 403) return 'autenticacion';

    if (status === 400 || status === 404 || status === 422) return 'permanente';

    if (status >= 500 || status === 502 || status === 503 || status === 504) return 'transitorio';

    if (status >= 200 && status < 300) return 'conflicto';

    return 'desconocido';
}

/**
 * Calcula delay con backoff exponencial + jitter.
 * Base 2s: 2s, 4s, 8s, 16s, 32s... capped a 5 min.
 */
function backoffConJitter(intento: number, baseMs = 2000): number {
    const delay = baseMs * Math.pow(2, intento);
    const jitter = Math.random() * delay * 0.3;
    return Math.min(delay + jitter, 300_000);
}

/**
 * Calcula delay para rate limit, respetando Retry-After si disponible.
 */
function delayRateLimit(intento: number, retryAfterMs?: number): number {
    if (retryAfterMs && retryAfterMs > 0) {
        return retryAfterMs + Math.random() * 1000;
    }
    return backoffConJitter(intento, 5000);
}

/**
 * Obtiene la estrategia de recuperación para una categoría de error.
 */
export function obtenerEstrategia(
    categoria: CategoriaError,
    retryAfterMs?: number
): EstrategiaRecuperacion {
    switch (categoria) {
        case 'transitorio':
            return {
                reintentar: true,
                maxReintentos: 5,
                calcularDelay: (i) => backoffConJitter(i),
                notificarUsuario: false,
            };

        case 'rate_limit':
            return {
                reintentar: true,
                maxReintentos: 3,
                calcularDelay: (i) => delayRateLimit(i, retryAfterMs),
                notificarUsuario: false,
            };

        case 'conflicto':
            return {
                reintentar: false,
                maxReintentos: 0,
                calcularDelay: () => 0,
                notificarUsuario: false,
            };

        case 'autenticacion':
            return {
                reintentar: true,
                maxReintentos: 1,
                calcularDelay: () => 500,
                notificarUsuario: true,
            };

        case 'permanente':
            return {
                reintentar: false,
                maxReintentos: 0,
                calcularDelay: () => 0,
                notificarUsuario: true,
            };

        case 'desconocido':
        default:
            return {
                reintentar: true,
                maxReintentos: 2,
                calcularDelay: (i) => backoffConJitter(i, 3000),
                notificarUsuario: true,
            };
    }
}

/**
 * Extrae Retry-After de una Response HTTP (en milisegundos).
 * Soporta formato segundos y formato fecha HTTP.
 */
export function extraerRetryAfterMs(headers: Headers): number | undefined {
    const valor = headers.get('retry-after');
    if (!valor) return undefined;

    const segundos = parseInt(valor, 10);
    if (!isNaN(segundos)) return segundos * 1000;

    const fecha = Date.parse(valor);
    if (!isNaN(fecha)) {
        const ahora = Date.now();
        return Math.max(fecha - ahora, 0);
    }

    return undefined;
}

/**
 * Determina si un error de fetch es un error de red (sin conexión, DNS, etc.)
 */
export function esErrorDeRed(error: unknown): boolean {
    if (error instanceof TypeError) {
        const msg = error.message.toLowerCase();
        return msg.includes('fetch') || msg.includes('network') || msg.includes('failed');
    }
    return false;
}
