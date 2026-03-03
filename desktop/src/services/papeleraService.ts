/*
 * Servicio: papeleraService — Papelera virtual para samples eliminados.
 *
 * Sistema de papelera de 30 dias (configurable) que retiene metadata de archivos
 * borrados antes de eliminarlos permanentemente. Los archivos se mueven a una
 * carpeta ".papelera" dentro de la carpeta de sync.
 *
 * Modelo de datos:
 * - Cada item de papelera contiene: ruta original, nombre, sampleId, fecha borrado
 * - Los archivos se mueven fisicamente a .papelera/ (no se eliminan de disco)
 * - Al expirar los dias configurados, se eliminan de disco permanentemente
 * - El usuario puede restaurar items antes de que expiren
 *
 * Persistencia: Tauri Store (papelera.json)
 */

import { estado } from './syncState';
import { marcarDescargaEnCurso, marcarMovimientoInterno } from './syncGuards';
import { actualizarEstadoSampleHistorial } from './syncService';

const STORE_FILE = 'papelera.json';
const STORE_KEY_ITEMS = 'papelera_items';
const NOMBRE_CARPETA_PAPELERA = '.papelera';

export interface ItemPapelera {
    id: string;
    rutaOriginal: string;
    rutaPapelera: string;
    nombreArchivo: string;
    sampleId: number | null;
    coleccionId: number | null;
    tamano: number;
    fechaEliminado: number;
    origen: 'local' | 'servidor';
}

let items: ItemPapelera[] = [];
let inicializado = false;

/* Inicializar papelera: cargar items del store y purgar expirados */
export async function inicializarPapelera(): Promise<void> {
    if (inicializado) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        const guardados = await store.get<ItemPapelera[]>(STORE_KEY_ITEMS);
        if (guardados) {
            items = guardados;
        }
    } catch {
        /* Store no disponible: papelera en memoria */
    }

    inicializado = true;

    /* Purgar items expirados al iniciar */
    await purgarExpirados();
}

/* Mover un archivo a la papelera en lugar de eliminarlo */
export async function moverAPapelera(
    rutaOriginal: string,
    nombreArchivo: string,
    sampleId: number | null,
    coleccionId: number | null,
    origen: 'local' | 'servidor',
    carpetaBase: string,
): Promise<boolean> {
    if (!estado.configAvanzada.papeleraActiva) return false;

    try {
        const { rename, mkdir, stat } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');

        const carpetaPapelera = await join(carpetaBase, NOMBRE_CARPETA_PAPELERA);
        try {
            await mkdir(carpetaPapelera, { recursive: true });
        } catch { /* ya existe */ }

        /* Nombre unico para evitar colisiones: timestamp + nombre */
        const nombreUnico = `${Date.now()}_${nombreArchivo}`;
        const rutaPapelera = await join(carpetaPapelera, nombreUnico);

        /* Obtener tamano antes de mover */
        let tamano = 0;
        try {
            const info = await stat(rutaOriginal);
            tamano = info.size ?? 0;
        } catch { /* si falla stat, seguir con tamano 0 */ }

        /* P2: Guard para que el watcher ignore el CREATE en .papelera/.
         * Defensa en profundidad: P1 (filtro en watcher) es la línea principal,
         * este guard es el fallback por si algún edge case lo atraviesa. */
        marcarDescargaEnCurso(rutaPapelera);
        marcarMovimientoInterno(rutaOriginal);

        /* Mover archivo (no eliminarlo) */
        await rename(rutaOriginal, rutaPapelera);

        const item: ItemPapelera = {
            id: `pap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            rutaOriginal,
            rutaPapelera,
            nombreArchivo,
            sampleId,
            coleccionId,
            tamano,
            fechaEliminado: Date.now(),
            origen,
        };

        items.push(item);
        await guardarPapelera();

        /* P6: Actualizar historial per-sample para que el panel muestre estado correcto */
        actualizarEstadoSampleHistorial({
            sampleId: sampleId ?? 0,
            nombreArchivo,
            estado: 'en_papelera',
            rutaLocal: rutaPapelera,
        }).catch(() => { /* No bloquear movimiento a papelera por fallo en historial */ });

        console.info('[Papelera] Archivo movido a papelera:', nombreArchivo);
        return true;
    } catch (err) {
        console.error('[Papelera] Error moviendo a papelera:', err);
        return false;
    }
}

/* Restaurar un archivo de la papelera a su ubicacion original */
export async function restaurarDePapelera(itemId: string): Promise<boolean> {
    const item = items.find(i => i.id === itemId);
    if (!item) return false;

    try {
        const { rename, exists, mkdir } = await import('@tauri-apps/plugin-fs');

        /* Verificar que el archivo en papelera existe */
        const existeEnPapelera = await exists(item.rutaPapelera);
        if (!existeEnPapelera) {
            /* Archivo ya no existe en papelera: limpiar registro */
            items = items.filter(i => i.id !== itemId);
            await guardarPapelera();
            return false;
        }

        /* Asegurar que la carpeta destino existe */
        const partes = item.rutaOriginal.replace(/\\/g, '/').split('/');
        partes.pop(); /* quitar nombre archivo */
        const carpetaDestino = partes.join('/');
        try {
            await mkdir(carpetaDestino, { recursive: true });
        } catch { /* ya existe */ }

        /* Mover de vuelta a ubicacion original */
        marcarMovimientoInterno(item.rutaPapelera);
        await rename(item.rutaPapelera, item.rutaOriginal);

        items = items.filter(i => i.id !== itemId);
        await guardarPapelera();

        console.info('[Papelera] Archivo restaurado:', item.nombreArchivo);
        return true;
    } catch (err) {
        console.error('[Papelera] Error restaurando archivo:', err);
        return false;
    }
}

/* Eliminar un item de la papelera permanentemente */
export async function eliminarPermanente(itemId: string): Promise<void> {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    try {
        const { remove, exists } = await import('@tauri-apps/plugin-fs');

        const existeArchivo = await exists(item.rutaPapelera);
        if (existeArchivo) {
            await remove(item.rutaPapelera);
        }
    } catch (err) {
        console.error('[Papelera] Error eliminando permanentemente:', err);
    }

    items = items.filter(i => i.id !== itemId);
    await guardarPapelera();
}

/* Purgar items que exceden la duracion configurada */
export async function purgarExpirados(): Promise<number> {
    const duracionMs = estado.configAvanzada.papeleraDuracionDias * 24 * 60 * 60 * 1000;
    const ahora = Date.now();

    const expirados = items.filter(i => (ahora - i.fechaEliminado) >= duracionMs);
    if (expirados.length === 0) return 0;

    let eliminados = 0;
    for (const item of expirados) {
        try {
            const { remove, exists } = await import('@tauri-apps/plugin-fs');
            const existeArchivo = await exists(item.rutaPapelera);
            if (existeArchivo) {
                await remove(item.rutaPapelera);
            }
            eliminados++;
        } catch (err) {
            console.error('[Papelera] Error purgando expirado:', item.nombreArchivo, err);
        }
    }

    const idsExpirados = new Set(expirados.map(i => i.id));
    items = items.filter(i => !idsExpirados.has(i.id));
    await guardarPapelera();

    if (eliminados > 0) {
        console.info(`[Papelera] Purgados ${eliminados} items expirados`);
    }

    return eliminados;
}

/* Obtener items en la papelera (para UI) */
export function obtenerItemsPapelera(): ItemPapelera[] {
    return [...items];
}

/* Obtener conteo y tamano total de papelera */
export function obtenerEstadoPapelera(): { cantidad: number; tamanoTotal: number } {
    return {
        cantidad: items.length,
        tamanoTotal: items.reduce((sum, i) => sum + i.tamano, 0),
    };
}

/* Vaciar papelera completamente */
export async function vaciarPapelera(): Promise<void> {
    for (const item of items) {
        try {
            const { remove, exists } = await import('@tauri-apps/plugin-fs');
            const existeArchivo = await exists(item.rutaPapelera);
            if (existeArchivo) {
                await remove(item.rutaPapelera);
            }
        } catch {
            /* Continuar con los demas */
        }
    }

    items = [];
    await guardarPapelera();
    console.info('[Papelera] Papelera vaciada');
}

/* Persistir items en Tauri Store */
async function guardarPapelera(): Promise<void> {
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.set(STORE_KEY_ITEMS, items);
        await store.save();
    } catch {
        /* Fallo silencioso */
    }
}
