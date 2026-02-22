/*
 * Servicio de sincronización de archivos de audio.
 * Gestiona la carpeta local donde se sincroniza la librería del usuario.
 *
 * Flujo:
 * 1. Usuario elige carpeta de sincronización (dialog de Tauri)
 * 2. Se crea un índice local de archivos descargados
 * 3. Al conectar, compara con el servidor y descarga/elimina diferencias
 * 4. Archivos se nombran con su nombre local original
 * 5. Re-descargas usan el nombre generado por el servidor
 */

import { esDesktop, estaOnline } from './desktopService';

const STORE_FILE = 'sync-config.json';

interface SyncConfig {
    carpetaLocal: string | null;
    sincronizacionActiva: boolean;
    ultimaSync: number;
}

interface ArchivoLocal {
    ruta: string;
    nombre: string;
    sampleId: number;
    hash: string;
    descargadoEn: number;
    nombreOriginal: string;
    nombreServidor: string;
}

const STORE_KEY_CONFIG = 'sync_config';
const STORE_KEY_INDICE = 'sync_indice';

let config: SyncConfig = {
    carpetaLocal: null,
    sincronizacionActiva: false,
    ultimaSync: 0,
};

let indiceArchivos: ArchivoLocal[] = [];

/*
 * Inicializa el servicio de sync: carga config e índice.
 */
export async function inicializarSyncService(): Promise<void> {
    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);

        const configGuardada = await store.get<SyncConfig>(STORE_KEY_CONFIG);
        if (configGuardada) config = configGuardada;

        const indiceGuardado = await store.get<ArchivoLocal[]>(STORE_KEY_INDICE);
        if (indiceGuardado) indiceArchivos = indiceGuardado;
    } catch {
        /* Config no disponible — usar defaults */
    }
}

/*
 * Abre un diálogo para que el usuario elija la carpeta de sincronización.
 */
export async function elegirCarpetaSync(): Promise<string | null> {
    if (!esDesktop()) return null;

    try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const carpeta = await open({
            directory: true,
            multiple: false,
            title: 'Elegir carpeta de sincronización',
        });

        if (carpeta && typeof carpeta === 'string') {
            config.carpetaLocal = carpeta;
            await guardarConfig();
            return carpeta;
        }
    } catch (err) {
        console.error('[Sync] Error eligiendo carpeta:', err);
    }

    return null;
}

/*
 * Activa o desactiva la sincronización automática.
 */
export async function toggleSincronizacion(activa: boolean): Promise<void> {
    config.sincronizacionActiva = activa;
    await guardarConfig();
}

/*
 * Verifica si un sample ya está descargado localmente.
 * Retorna la ruta local si existe, null si no.
 */
export function obtenerRutaLocal(sampleId: number): string | null {
    const archivo = indiceArchivos.find(a => a.sampleId === sampleId);
    return archivo?.ruta ?? null;
}

/*
 * Registra un archivo descargado en el índice local.
 */
export async function registrarDescarga(
    sampleId: number,
    ruta: string,
    nombreOriginal: string,
    nombreServidor: string,
): Promise<void> {
    /* Evitar duplicados */
    indiceArchivos = indiceArchivos.filter(a => a.sampleId !== sampleId);

    indiceArchivos.push({
        ruta,
        nombre: nombreOriginal,
        sampleId,
        hash: '',
        descargadoEn: Date.now(),
        nombreOriginal,
        nombreServidor,
    });

    await guardarIndice();
}

/*
 * Obtiene la configuración actual de sync.
 */
export function obtenerConfigSync(): SyncConfig {
    return { ...config };
}

/*
 * Sincroniza la carpeta local con el servidor.
 * Compara el índice local con las descargas del servidor.
 */
export async function sincronizarConServidor(): Promise<{ nuevos: number; eliminados: number }> {
    if (!config.carpetaLocal || !config.sincronizacionActiva || !estaOnline()) {
        return { nuevos: 0, eliminados: 0 };
    }

    /* TO-DO: Implementar comparación con API /descargas del servidor */
    /* Por ahora, marcar timestamp de última sync */
    config.ultimaSync = Date.now();
    await guardarConfig();

    return { nuevos: 0, eliminados: 0 };
}

/*
 * Extrae metadata de la ruta del archivo para auto-descripción.
 * Analiza las 3 carpetas padre + nombre del archivo.
 *
 * Ejemplo: /Samples/808/Bass/deep_sub_hit.wav
 * → { carpetas: ['Samples', '808', 'Bass'], nombre: 'deep_sub_hit' }
 */
export function extraerMetadataDeRuta(rutaCompleta: string): {
    carpetas: string[];
    nombreArchivo: string;
    extension: string;
} {
    /* Normalizar separadores (Windows usa \, macOS/Linux usa /) */
    const partes = rutaCompleta.replace(/\\/g, '/').split('/').filter(Boolean);
    const archivoConExt = partes.pop() ?? '';
    const dotIndex = archivoConExt.lastIndexOf('.');

    const nombreArchivo = dotIndex > 0 ? archivoConExt.slice(0, dotIndex) : archivoConExt;
    const extension = dotIndex > 0 ? archivoConExt.slice(dotIndex + 1) : '';

    /* Tomar las últimas 3 carpetas (las más relevantes) */
    const carpetas = partes.slice(-3);

    return { carpetas, nombreArchivo, extension };
}

async function guardarConfig(): Promise<void> {
    if (!esDesktop()) return;
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.set(STORE_KEY_CONFIG, config);
        await store.save();
    } catch { /* silencioso */ }
}

async function guardarIndice(): Promise<void> {
    if (!esDesktop()) return;
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.set(STORE_KEY_INDICE, indiceArchivos);
        await store.save();
    } catch { /* silencioso */ }
}
