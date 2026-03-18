/*
 * Cache persistente para el feed de samples.
 * Usa localStorage para sobrevivir recargas y reinicios de la app desktop.
 * Solo cachea pagina 1 de cada tipo de feed (el caso critico de UX).
 *
 * QK100: Estrategia stale-while-revalidate real.
 * leerCacheFeed() SIEMPRE devuelve datos si existen (aunque stale).
 * esCacheStale() indica si se debe revalidar en background.
 * Esto evita "Cargando samples..." salvo en la primera visita absoluta.
 *
 * Las interacciones CRUD invalidan el cache.
 */

import type { SampleResumen } from '@app/types';

const PREFIJO = 'feedCache_';
/* QK100: TTL solo indica "necesita revalidacion", nunca borra datos */
const TTL_REVALIDACION_MS = 5 * 60 * 1000;
/* Datos se eliminan solo si no se usan en 7 dias (limpieza de space) */
const TTL_MAXIMO_MS = 7 * 24 * 60 * 60 * 1000;

interface EntradaCache {
    ts: number;
    datos: SampleResumen[];
    /* [183A-24] Total real del servidor para evitar mostrar 30 cuando hay datos stale. */
    total?: number;
}

function clave(feedKey: string): string {
    return `${PREFIJO}${feedKey}_p1`;
}

/*
 * QK100: Lee cache SIEMPRE que exista, sin importar antigüedad (hasta TTL_MAXIMO).
 * El caller decide si revalidar via esCacheStale().
 */
export function leerCacheFeed(feedKey: string): SampleResumen[] | null {
    try {
        const raw = localStorage.getItem(clave(feedKey));
        if (!raw) return null;
        const entrada: EntradaCache = JSON.parse(raw);
        /* Solo eliminar si supera el TTL maximo (7 dias de inactividad) */
        if (Date.now() - entrada.ts > TTL_MAXIMO_MS) {
            localStorage.removeItem(clave(feedKey));
            return null;
        }
        return entrada.datos;
    } catch {
        return null;
    }
}

/*
 * QK100: Indica si el cache necesita revalidacion (>5 min).
 * No borra datos, solo señala que se debe fetchear en background.
 */
export function esCacheStale(feedKey: string): boolean {
    try {
        const raw = localStorage.getItem(clave(feedKey));
        if (!raw) return true;
        const entrada: EntradaCache = JSON.parse(raw);
        return Date.now() - entrada.ts > TTL_REVALIDACION_MS;
    } catch {
        return true;
    }
}

export function guardarCacheFeed(feedKey: string, datos: SampleResumen[], total?: number): void {
    try {
        const entrada: EntradaCache = { ts: Date.now(), datos, total };
        localStorage.setItem(clave(feedKey), JSON.stringify(entrada));
    } catch {
        /* localStorage lleno o no disponible — silencioso */
    }
}

/* [183A-24] Leer total cacheado sin cargar los datos completos. */
export function leerTotalCacheFeed(feedKey: string): number | null {
    try {
        const raw = localStorage.getItem(clave(feedKey));
        if (!raw) return null;
        const entrada: EntradaCache = JSON.parse(raw);
        return entrada.total ?? null;
    } catch {
        return null;
    }
}

export function invalidarCacheFeed(feedKey?: string): void {
    try {
        if (feedKey) {
            localStorage.removeItem(clave(feedKey));
            return;
        }
        /* Sin key: limpiar todos los caches de feed */
        const claves = Object.keys(localStorage).filter(k => k.startsWith(PREFIJO));
        for (const k of claves) localStorage.removeItem(k);
    } catch {
        /* Silencioso */
    }
}
