/*
 * Servicio de reproducción local inteligente.
 * Si un audio ya está descargado localmente, lo reproduce desde disco
 * en vez de hacer fetch al servidor. La reproducción se registra
 * en la offline queue para sincronizar con el servidor después.
 *
 * Integración: se engancha al reproductorStore para interceptar
 * la carga de audio y bifurcar entre local y remoto.
 */

import { esDesktop } from './desktopService';
import { obtenerRutaLocal } from './syncService';
import { encolarOperacion } from './offlineQueueService';

/*
 * Verifica si un sample tiene copia local y retorna la URL apropiada.
 * - Si hay copia local → retorna file:// URL (Tauri la sirve)
 * - Si no → retorna null (usar URL remota normal)
 */
export async function resolverUrlAudio(sampleId: number, urlRemota: string): Promise<string> {
    if (!esDesktop()) return urlRemota;

    const rutaLocal = obtenerRutaLocal(sampleId);
    if (!rutaLocal) return urlRemota;

    /* Verificar que el archivo local existe */
    try {
        const { exists } = await import('@tauri-apps/plugin-fs');
        const existe = await exists(rutaLocal);
        if (existe) {
            /* Tauri convierte rutas locales a URLs seguras para el webview */
            const { convertFileSrc } = await import('@tauri-apps/api/core');
            return convertFileSrc(rutaLocal);
        }
    } catch {
        /* Si falla la verificación, usar URL remota */
    }

    return urlRemota;
}

/*
 * Registra una reproducción para sincronizar con el servidor.
 * Se llama tanto para reproducciones locales como remotas.
 * Si estamos offline, se encola; si online, se envía directo.
 */
export async function registrarReproduccionDesktop(
    sampleId: number,
    duracionEscuchada: number,
): Promise<void> {
    if (!esDesktop()) return;

    await encolarOperacion({
        tipo: 'reproduccion',
        endpoint: `/kamples/v1/reproducciones/${sampleId}`,
        method: 'POST',
        body: { duracion_escuchada: duracionEscuchada },
    });
}

/*
 * Servicio de drag-to-DAW / drag-to-desktop.
 * Permite arrastrar samples desde la app a apps externas
 * (DAWs como FL Studio, Ableton, etc.) o al escritorio.
 *
 * Usa @crabnebula/tauri-plugin-drag para drag nativo de archivos.
 * (Tauri 2.0 no incluye DnD nativo en @tauri-apps/api — requiere plugin externo.)
 */
export async function iniciarDragNativo(
    sampleId: number,
    urlRemota: string,
    nombreArchivo: string,
): Promise<boolean> {
    if (!esDesktop()) return false;

    /* Primero verificar si hay copia local */
    const rutaLocal = obtenerRutaLocal(sampleId);

    if (rutaLocal) {
        try {
            const { exists } = await import('@tauri-apps/plugin-fs');
            if (await exists(rutaLocal)) {
                const { startDrag } = await import('@crabnebula/tauri-plugin-drag');
                await startDrag({ item: [rutaLocal] });
                return true;
            }
        } catch (err) {
            console.warn('[DragNativo] Error con archivo local:', err);
        }
    }

    /* Si no hay local, descargar primero a temp y luego drag */
    try {
        const { tempDir } = await import('@tauri-apps/api/path');
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        const { startDrag } = await import('@crabnebula/tauri-plugin-drag');

        const tempPath = `${await tempDir()}kamples_drag_${nombreArchivo}`;
        const response = await fetch(urlRemota);
        const arrayBuffer = await response.arrayBuffer();
        await writeFile(tempPath, new Uint8Array(arrayBuffer));

        await startDrag({ item: [tempPath] });
        return true;
    } catch (err) {
        console.error('[DragNativo] Error descargando para drag:', err);
        return false;
    }
}
