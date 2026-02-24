/*
 * Hook: useEstadoSync — Lógica de estado de sincronización para desktop.
 *
 * Provee helpers para consultar y modificar el estado de sync de samples
 * directamente desde window.__KAMPLES_SYNC__ (inyectado por desktop/main.tsx).
 * Si no estamos en desktop, retorna funciones no-op.
 *
 * Se usa en ExploradorIsland para badges y menú contextual.
 */

export type EstadoSync = 'sincronizado' | 'no_sincronizar' | 'no_descargado';

const esDesktop = (): boolean => !!window.__KAMPLES_DESKTOP__;

/*
 * Obtiene el estado de sync de un sample por su ID.
 * Retorna null si no estamos en desktop o sync no está configurada.
 */
export function obtenerEstadoSyncSample(sampleId: number): EstadoSync | null {
    if (!esDesktop()) return null;
    const sync = window.__KAMPLES_SYNC__;
    if (!sync?.obtenerEstadoSync) return null;
    return sync.obtenerEstadoSync(sampleId) as EstadoSync;
}

/*
 * Alterna el estado de sync de un sample.
 * - sincronizado → no_sincronizar (desactiva sync)
 * - no_sincronizar → reactivar (se descargará en la próxima sync)
 */
export async function toggleSyncSample(sampleId: number, estadoActual: EstadoSync): Promise<boolean> {
    const sync = window.__KAMPLES_SYNC__;
    if (!sync) return false;

    if (estadoActual === 'no_sincronizar') {
        return await sync.reactivarSync(sampleId);
    }
    if (estadoActual === 'sincronizado') {
        return await sync.marcarNoSincronizarPorId(sampleId);
    }
    return false;
}

/*
 * Verifica si estamos en el entorno desktop.
 */
export function estaEnDesktop(): boolean {
    return esDesktop();
}
