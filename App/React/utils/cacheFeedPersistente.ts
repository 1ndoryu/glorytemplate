/*
 * Cache persistente para el feed de samples.
 * Usa localStorage para sobrevivir recargas y reinicios de la app desktop.
 * Solo cachea pagina 1 de cada tipo de feed (el caso critico de UX).
 *
 * TTL: 24 horas. Datos mas viejos se ignoran y se borran en lectura.
 * Las interacciones CRUD invalidan el cache.
 */

import type { SampleResumen } from '@app/types';

const PREFIJO = 'feedCache_';
/* QK55: TTL reducido a 5 minutos para evitar feed congelado por horas */
const TTL_MS = 5 * 60 * 1000;

interface EntradaCache {
    ts: number;
    datos: SampleResumen[];
}

function clave(feedKey: string): string {
    return `${PREFIJO}${feedKey}_p1`;
}

export function leerCacheFeed(feedKey: string): SampleResumen[] | null {
    try {
        const raw = localStorage.getItem(clave(feedKey));
        if (!raw) return null;
        const entrada: EntradaCache = JSON.parse(raw);
        if (Date.now() - entrada.ts > TTL_MS) {
            localStorage.removeItem(clave(feedKey));
            return null;
        }
        return entrada.datos;
    } catch {
        return null;
    }
}

export function guardarCacheFeed(feedKey: string, datos: SampleResumen[]): void {
    try {
        const entrada: EntradaCache = { ts: Date.now(), datos };
        localStorage.setItem(clave(feedKey), JSON.stringify(entrada));
    } catch {
        /* localStorage lleno o no disponible — silencioso */
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
