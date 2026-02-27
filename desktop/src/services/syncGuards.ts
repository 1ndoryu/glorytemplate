/*
 * Servicio: syncGuards — Estado compartido para coordinación entre servicios de sync.
 *
 * Centraliza:
 * - Set de rutas de descarga activas (evita que fileWatcher re-encole archivos recién descargados)
 * - Lock de sync concurrente (evita dos syncs simultáneos)
 * - URL base de la API para servicios de sync
 *
 * Separado en su propio módulo para evitar dependencias circulares:
 * syncService y syncCollectionService ambos necesitan estas utilidades.
 */

/* ==================== Descargas en curso ==================== */

const descargasEnCurso = new Set<string>();
const GRACIA_DESCARGA_MS = 10_000;

/**
 * Marca una ruta como descarga en curso para que el watcher la ignore.
 * La ruta se limpia automáticamente después de GRACIA_DESCARGA_MS.
 */
export function marcarDescargaEnCurso(ruta: string): void {
    const normalizada = ruta.replace(/\\/g, '/');
    descargasEnCurso.add(normalizada);
    setTimeout(() => {
        descargasEnCurso.delete(normalizada);
    }, GRACIA_DESCARGA_MS);
}

/**
 * Verifica si una ruta está marcada como descarga en curso.
 * Usado por el callback onArchivoNuevo del watcher.
 */
export function esDescargaEnCurso(ruta: string): boolean {
    return descargasEnCurso.has(ruta.replace(/\\/g, '/'));
}

/* ==================== Lock de sync concurrente ==================== */

/*
 * Previene que dos sincronizaciones masivas corran simultáneamente.
 * Si un caller intenta adquirir el lock mientras otro lo tiene,
 * recibe la misma Promise (evita trabajo duplicado).
 *
 * Patrón: el primer caller ejecuta la sync y todos los demás
 * await-ean la misma Promise. Al finalizar, el lock se libera.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let syncPromesaActiva: Promise<any> | null = null;

/**
 * Verifica si hay una sync en curso.
 */
export function esSyncEnCurso(): boolean {
    return syncPromesaActiva !== null;
}

/**
 * Adquiere el lock de sync concurrente.
 * Si ya hay una sync en curso, retorna { adquirido: false, promesaExistente }.
 * Si no, marca el lock y retorna { adquirido: true }.
 * El caller que adquiere el lock DEBE llamar liberarLockSync() al finalizar.
 */
export function adquirirLockSync(): { adquirido: true } | { adquirido: false; promesaExistente: Promise<unknown> } {
    if (syncPromesaActiva) {
        return { adquirido: false, promesaExistente: syncPromesaActiva };
    }
    return { adquirido: true };
}

/**
 * Registra la Promise de sync activa para que otros callers puedan await-earla.
 */
export function registrarSyncActiva(promesa: Promise<unknown>): void {
    syncPromesaActiva = promesa;
}

/**
 * Libera el lock de sync concurrente.
 */
export function liberarLockSync(): void {
    syncPromesaActiva = null;
}

/* ==================== URL base API ==================== */

/**
 * URL base de la API para servicios de sync.
 * Centralizada aquí para evitar duplicación en 3 archivos.
 */
export function obtenerBaseUrlSync(): string {
    const ctx = window.GLORY_CONTEXT as { apiUrl?: string } | undefined;
    return ctx?.apiUrl ?? '/wp-json';
}
