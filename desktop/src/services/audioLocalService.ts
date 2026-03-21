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
 * Cache de archivos pre-descargados listos para drag nativo.
 * Mapeados por sampleId → ruta temporal. Se limpian tras el primer uso.
 */
const dragTempCache = new Map<number, string>();
/* Set de sampleIds cuya descarga para drag ya está en progreso (evitar duplicados) */
const dragPreparando = new Set<number>();

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

/* [2003A-34] Paso 3 eliminado. Descarga directa desde CDN/preview
 * bypaseaba el sistema de créditos — descargar sin consumir crédito.
 * Ahora el caller (useTarjetaSample) llama descargarSample() primero
 * para consumir el crédito, y luego pasa la URL API a descargarYArrastrar(). */

export async function iniciarDragNativo(
    sampleId: number,
    nombreArchivo: string,
    iconoPersonalizado?: string,
): Promise<boolean> {
    if (!esDesktop()) return false;

    /* Resolver icono de drag (personalizado si se provee, o genérico) */
    const iconoDrag = iconoPersonalizado || await obtenerIconoDrag();

    /* 1. Prioridad: copia local sincronizada (la más rápida y confiable) */
    const rutaLocal = obtenerRutaLocal(sampleId);
    if (rutaLocal) {
        try {
            const { startDrag } = await import('@crabnebula/tauri-plugin-drag');
            await startDrag({ item: [rutaLocal], icon: iconoDrag });
            return true;
        } catch (err) {
            console.warn('[DragNativo] Error con archivo local, probando temporal:', err);
        }
    }

    /* 2. Fallback: archivo pre-descargado via prepararDragNativo() o descargarYArrastrar() */
    const rutaTemp = dragTempCache.get(sampleId);
    if (rutaTemp) {
        try {
            const { exists } = await import('@tauri-apps/plugin-fs');
            if (await exists(rutaTemp)) {
                const { startDrag } = await import('@crabnebula/tauri-plugin-drag');
                await startDrag({ item: [rutaTemp], icon: iconoDrag });
                return true;
            }
            dragTempCache.delete(sampleId); /* archivo ya no existe (limpieza OS) */
        } catch (err) {
            console.warn('[DragNativo] Error con archivo temporal:', err);
            dragTempCache.delete(sampleId);
        }
    }

    return false;
}

/*
 * [2003A-34] Descarga un archivo desde una URL autorizada por la API (ya consumió crédito)
 * y lo arrastra nativamente. El caller es responsable de haber llamado descargarSample()
 * antes para validar créditos y obtener la URL.
 */
export async function descargarYArrastrar(
    sampleId: number,
    urlDescarga: string,
    nombreArchivo: string,
    iconoPersonalizado?: string,
): Promise<boolean> {
    if (!esDesktop() || !urlDescarga) return false;

    try {
        const iconoDrag = iconoPersonalizado || await obtenerIconoDrag();
        const { tempDir } = await import('@tauri-apps/api/path');
        const { writeFile } = await import('@tauri-apps/plugin-fs');

        const tempPath = `${await tempDir()}${nombreArchivo}`;
        const response = await fetch(urlDescarga);
        if (!response.ok) throw new Error(`HTTP ${response.status} para ${urlDescarga}`);

        const arrayBuffer = await response.arrayBuffer();
        await writeFile(tempPath, new Uint8Array(arrayBuffer));
        dragTempCache.set(sampleId, tempPath);

        const { startDrag } = await import('@crabnebula/tauri-plugin-drag');
        await startDrag({ item: [tempPath], icon: iconoDrag });
        return true;
    } catch (err) {
        console.warn('[DragNativo] Error descargando para drag:', err);
        return false;
    }
}

/*
 * Pre-carga el icono de drag en cache durante la inicialización de la app.
 * Evita latencia IPC en el primer arrastre del usuario — llamar en init().
 */
export async function preCachearIconoDrag(): Promise<void> {
    await obtenerIconoDrag();
}

/*
 * [2003A-18] Descarga un sample a un archivo temporal y lo registra en cache
 * para que el siguiente intento de drag nativo sea instantáneo.
 *
 * Flujo: useTarjetaSample llama esto cuando el usuario arrastra sin archivo local.
 * La descarga ocurre en background; al completarse se muestra un toast y el
 * próximo arrastre pasa a través de dragTempCache → startDrag() con mouse presionado.
 *
 * No lanza si el sample ya está siendo preparado (dedup por sampleId).
 */
export async function prepararDragNativo(
    sampleId: number,
    urlRemota: string,
    nombreArchivo: string,
): Promise<void> {
    if (!esDesktop()) return;
    if (dragPreparando.has(sampleId)) return;
    if (dragTempCache.has(sampleId)) return;

    dragPreparando.add(sampleId);
    try {
        const { tempDir } = await import('@tauri-apps/api/path');
        const { writeFile } = await import('@tauri-apps/plugin-fs');

        /* [2003A-34] Sin prefijo kamples_drag_ — usar nombre limpio del sample */
        const tempPath = `${await tempDir()}${nombreArchivo}`;
        const response = await fetch(urlRemota);
        if (!response.ok) throw new Error(`HTTP ${response.status} para ${urlRemota}`);

        const arrayBuffer = await response.arrayBuffer();
        await writeFile(tempPath, new Uint8Array(arrayBuffer));
        dragTempCache.set(sampleId, tempPath);
    } catch (err) {
        console.error('[DragNativo] Error preparando archivo para drag:', err);
        throw err; /* relay para que el caller muestre feedback al usuario */
    } finally {
        dragPreparando.delete(sampleId);
    }
}

/*
 * [2003A-18] Verifica síncronamente si hay un archivo listo para drag nativo
 * en el temp cache. Usado por el handler de dragStart para decidir
 * e.preventDefault() sin esperar async.
 */
export function estaListoParaDrag(sampleId: number): boolean {
    return dragTempCache.has(sampleId);
}

/* [2003A-37] Genera un PNG con preview verde (nombre del sample) para usar como
 * icono de drag nativo en Tauri. Réplica del .dragPreviewSample de la web.
 * Se cachea en temp para reusar entre drags sin regenerar. */
let previewDragCacheMap = new Map<string, string>();

function dibujarRectRedondeado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

export async function generarPreviewDrag(nombre: string): Promise<string> {
    const cached = previewDragCacheMap.get(nombre);
    if (cached) return cached;

    const textoMostrar = nombre.length > 25 ? nombre.slice(0, 25) + '...' : nombre;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const fontSize = 13;
    const paddingH = 12;
    const paddingV = 8;
    const iconSize = 14;
    const gap = 6;

    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    const textWidth = Math.ceil(ctx.measureText(textoMostrar).width);

    const width = paddingH + iconSize + gap + textWidth + paddingH;
    const height = paddingV * 2 + fontSize + 4;
    canvas.width = width;
    canvas.height = height;

    const c = canvas.getContext('2d')!;

    /* Fondo verde con esquinas redondeadas */
    c.fillStyle = '#22c55e';
    dibujarRectRedondeado(c, 0, 0, width, height, 6);
    c.fill();

    /* Icono nota musical simplificado */
    c.strokeStyle = '#fff';
    c.fillStyle = '#fff';
    c.lineWidth = 1.5;
    const ix = paddingH + 2;
    const iy = paddingV + 2;
    c.beginPath();
    c.moveTo(ix + 3, iy);
    c.lineTo(ix + 3, iy + 10);
    c.stroke();
    c.beginPath();
    c.arc(ix + 1, iy + 10, 2.5, 0, Math.PI * 2);
    c.fill();

    /* Texto del nombre */
    c.fillStyle = '#fff';
    c.font = `bold ${fontSize}px system-ui, sans-serif`;
    c.textBaseline = 'middle';
    c.fillText(textoMostrar, paddingH + iconSize + gap, height / 2 + 1);

    const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
    });
    const arrayBuffer = await blob.arrayBuffer();

    const { tempDir } = await import('@tauri-apps/api/path');
    const { writeFile } = await import('@tauri-apps/plugin-fs');
    const path = `${await tempDir()}kamples_drag_preview.png`;
    await writeFile(path, new Uint8Array(arrayBuffer));

    previewDragCacheMap.set(nombre, path);
    return path;
}
