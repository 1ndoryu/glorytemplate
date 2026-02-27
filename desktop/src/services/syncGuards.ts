/*
 * Servicio: syncGuards — Estado compartido para coordinación entre servicios de sync.
 *
 * Centraliza el Set de rutas de descarga activas para evitar que fileWatcher
 * re-encole archivos recién descargados por syncCollectionService o syncService.
 *
 * Separado en su propio módulo para evitar dependencias circulares:
 * syncService y syncCollectionService ambos necesitan marcar/verificar descargas.
 */

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

/**
 * URL base de la API para servicios de sync.
 * Centralizada aquí para evitar duplicación en 3 archivos.
 */
export function obtenerBaseUrlSync(): string {
    const ctx = window.GLORY_CONTEXT as { apiUrl?: string } | undefined;
    return ctx?.apiUrl ?? '/wp-json';
}
