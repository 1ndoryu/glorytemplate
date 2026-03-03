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

/* Descargas en curso */

const descargasEnCurso = new Set<string>();
const descargasTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const GRACIA_DESCARGA_MS = 10_000;

/**
 * Marca una ruta como descarga en curso para que el watcher la ignore.
 * La ruta se limpia automáticamente después de GRACIA_DESCARGA_MS.
 * Si se llama repetidamente para la misma ruta, cancela el timeout anterior
 * para evitar acumulación de timers (1000 descargas = 1000 timers sin este fix).
 */
export function marcarDescargaEnCurso(ruta: string): void {
    const normalizada = ruta.replace(/\\/g, '/');
    descargasEnCurso.add(normalizada);

    /* Cancelar timeout anterior para esta ruta si existe */
    const timerAnterior = descargasTimeouts.get(normalizada);
    if (timerAnterior) {
        clearTimeout(timerAnterior);
    }

    const nuevoTimer = setTimeout(() => {
        descargasEnCurso.delete(normalizada);
        descargasTimeouts.delete(normalizada);
    }, GRACIA_DESCARGA_MS);

    descargasTimeouts.set(normalizada, nuevoTimer);
}

/**
 * Verifica si una ruta está marcada como descarga en curso.
 * Usado por el callback onArchivoNuevo del watcher.
 */
export function esDescargaEnCurso(ruta: string): boolean {
    return descargasEnCurso.has(ruta.replace(/\\/g, '/'));
}

/* Movimientos internos — protege rutas origen de DELETE falsos */

/*
 * Cuando hacemos rename() interno (ej: moverArchivoASinColeccion), la ruta
 * ORIGINAL genera un evento DELETE en el watcher. Si manejarBorradoLocal la
 * procesa y borrarEnServidorAlBorrarLocal está activo, puede hacer soft-delete
 * del sample recién subido (si la actualización de tracking falló).
 *
 * Este Set marca rutas origen de moves internos para que manejarBorradoLocal
 * las ignore. TTL automático de GRACIA_MOVIMIENTO_MS.
 */
const movimientosInternos = new Set<string>();
const movimientosTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const GRACIA_MOVIMIENTO_MS = 15_000;

/**
 * Marca una ruta como origen de un movimiento interno.
 * manejarBorradoLocal la ignorará durante GRACIA_MOVIMIENTO_MS.
 */
export function marcarMovimientoInterno(ruta: string): void {
    const normalizada = ruta.replace(/\\/g, '/');
    movimientosInternos.add(normalizada);

    const timerAnterior = movimientosTimeouts.get(normalizada);
    if (timerAnterior) clearTimeout(timerAnterior);

    const nuevoTimer = setTimeout(() => {
        movimientosInternos.delete(normalizada);
        movimientosTimeouts.delete(normalizada);
    }, GRACIA_MOVIMIENTO_MS);

    movimientosTimeouts.set(normalizada, nuevoTimer);
}

/**
 * Verifica si una ruta está marcada como origen de movimiento interno.
 */
export function esMovimientoInterno(ruta: string): boolean {
    return movimientosInternos.has(ruta.replace(/\\/g, '/'));
}

/* Lock de sync concurrente */

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

/* URL base API */

/**
 * URL base de la API para servicios de sync.
 * Centralizada aquí para evitar duplicación en 3 archivos.
 */
export function obtenerBaseUrlSync(): string {
    const ctx = window.GLORY_CONTEXT as { apiUrl?: string } | undefined;
    return ctx?.apiUrl ?? '/wp-json';
}
