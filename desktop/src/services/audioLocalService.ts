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
 *
 * IMPORTANTE: startDrag({ item, icon }) requiere `icon` obligatorio:
 * ruta a imagen de preview del drag. Se resuelve la primera vez y se cachea.
 */

/* Cache de la ruta del icono de drag para no resolver en cada llamada */
let iconoDragCache: string | null = null;

/*
 * Resuelve la ruta absoluta del icono para el drag nativo.
 * Usa resolveResource para obtener el icono bundled del app (32x32.png).
 */
async function obtenerIconoDrag(): Promise<string> {
    if (iconoDragCache) return iconoDragCache;

    try {
        const { resolveResource } = await import('@tauri-apps/api/path');
        iconoDragCache = await resolveResource('icons/32x32.png');
    } catch {
        /*
         * Fallback: crear un PNG mínimo (1x1 transparente) en temp.
         * Esto cubre el caso donde resolveResource falle (ej: dev mode).
         */
        const { tempDir } = await import('@tauri-apps/api/path');
        const { writeFile, exists } = await import('@tauri-apps/plugin-fs');
        const tmpPath = `${await tempDir()}kamples_drag_icon.png`;

        if (!(await exists(tmpPath))) {
            /* PNG 1x1 transparente mínimo (67 bytes) */
            const pngMinimo = new Uint8Array([
                0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
                0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
                0x54, 0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02,
                0x00, 0x01, 0xE5, 0x27, 0xDE, 0xFC, 0x00, 0x00,
                0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
                0x60, 0x82,
            ]);
            await writeFile(tmpPath, pngMinimo);
        }

        iconoDragCache = tmpPath;
    }

    return iconoDragCache;
}

export async function iniciarDragNativo(
    sampleId: number,
    urlRemota: string,
    nombreArchivo: string,
): Promise<boolean> {
    if (!esDesktop()) return false;

    /* Resolver icono de drag (se cachea tras la primera llamada) */
    const iconoDrag = await obtenerIconoDrag();

    /* Primero verificar si hay copia local */
    const rutaLocal = obtenerRutaLocal(sampleId);

    if (rutaLocal) {
        try {
            const { exists } = await import('@tauri-apps/plugin-fs');
            if (await exists(rutaLocal)) {
                const { startDrag } = await import('@crabnebula/tauri-plugin-drag');
                await startDrag({ item: [rutaLocal], icon: iconoDrag });
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

        await startDrag({ item: [tempPath], icon: iconoDrag });
        return true;
    } catch (err) {
        console.error('[DragNativo] Error descargando para drag:', err);
        return false;
    }
}
