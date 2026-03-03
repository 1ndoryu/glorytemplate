/*
 * Utilidad: Persistencia debounced para Tauri Store.
 *
 * Agrupa múltiples escrituras a disco en una sola operación.
 * Evita disk thrashing cuando se procesan batches de 100+ archivos
 * que generarían 100+ llamadas individuales a store.set() + store.save().
 *
 * Incluye flush con beforeunload para no perder datos en cierre.
 */

import { esDesktop } from './desktopService';

const DEBOUNCE_MS_DEFAULT = 2000;

interface TareaPendiente {
    timeout: ReturnType<typeof setTimeout>;
    datos: unknown;
    ejecutar: () => Promise<void>;
}

const tareasPendientes = new Map<string, TareaPendiente>();

/**
 * Programa una escritura debounced al Tauri Store.
 * Si se llama múltiples veces con la misma clave antes del debounce,
 * solo la última escritura se persiste.
 *
 * @param clave Identificador único de la operación (ej: 'upload_cola', 'sync_indice')
 * @param storeFile Nombre del archivo store (ej: 'sync-config.json')
 * @param storeKey Key dentro del store (ej: 'upload_cola')
 * @param datos Datos a persistir
 * @param debounceMs Millisegundos de debounce (default 2000)
 */
export function persistirConDebounce(
    clave: string,
    storeFile: string,
    storeKey: string,
    datos: unknown,
    debounceMs = DEBOUNCE_MS_DEFAULT,
): void {
    if (!esDesktop()) return;

    const existente = tareasPendientes.get(clave);
    if (existente) {
        clearTimeout(existente.timeout);
    }

    const ejecutar = async (): Promise<void> => {
        try {
            const { load } = await import('@tauri-apps/plugin-store');
            const store = await load(storeFile);
            await store.set(storeKey, datos);
            await store.save();
        } catch (err) {
            console.error(`[PersistenciaDebounce] Error persistiendo ${clave}:`, err);
        } finally {
            tareasPendientes.delete(clave);
        }
    };

    const timeout = setTimeout(() => {
        ejecutar();
    }, debounceMs);

    tareasPendientes.set(clave, { timeout, datos, ejecutar });
}

/**
 * Fuerza la persistencia inmediata de una clave específica.
 * Usado antes de cerrar la app o al finalizar una operación crítica.
 */
export async function flushPersistencia(clave: string): Promise<void> {
    const tarea = tareasPendientes.get(clave);
    if (!tarea) return;

    clearTimeout(tarea.timeout);
    await tarea.ejecutar();
}

/**
 * Fuerza la persistencia de TODAS las claves pendientes.
 * Usado en beforeunload/cleanup.
 */
export async function flushTodo(): Promise<void> {
    const promesas: Promise<void>[] = [];

    for (const [, tarea] of tareasPendientes) {
        clearTimeout(tarea.timeout);
        promesas.push(tarea.ejecutar());
    }

    await Promise.allSettled(promesas);
}

/* Registrar flush global en beforeunload para no perder datos en cierre */
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        /* Flush sincrónico best-effort: no podemos await en beforeunload.
         * Los stores Tauri son persistidos de forma síncrona internamente. */
        for (const [, tarea] of tareasPendientes) {
            clearTimeout(tarea.timeout);
            tarea.ejecutar().catch(() => {});
        }
    });
}
