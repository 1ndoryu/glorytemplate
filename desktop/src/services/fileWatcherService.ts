/*
 * Servicio: fileWatcherService — Observador de carpeta de sincronización.
 *
 * Monitorea la carpeta local de sync en busca de:
 * - Archivos de audio nuevos → los encola para subida automática
 * - Archivos eliminados → marca como no_sincronizar (no borra del server)
 *
 * Usa @tauri-apps/plugin-fs watch() con debounce para agrupar eventos
 * rápidos (ej: copiar múltiples archivos de golpe).
 *
 * Flujo:
 *   watch(carpetaSync) → evento create → validar extensión →
 *   verificar no-duplicado → encolar en uploadQueueService
 *
 *   watch(carpetaSync) → evento remove → marcar sync_deshabilitado
 *   en el índice local (NO borrar del servidor)
 */

import { esDesktop } from './desktopService';
import { obtenerConfigSync } from './syncService';

const EXTENSIONES_AUDIO = new Set([
    'wav', 'mp3', 'flac', 'aiff', 'aif', 'ogg',
]);

/* Archivos temporales que los editores/DAWs crean durante grabación */
const PATRONES_TEMPORALES = [
    /^\./, /~$/, /\.tmp$/i, /\.part$/i, /\.crdownload$/i,
    /\.download$/i, /Thumbs\.db$/i, /desktop\.ini$/i,
];

/* Cache de archivos recientemente procesados para ignorar eventos duplicados */
const archivosRecientes = new Map<string, number>();
const DEBOUNCE_ARCHIVO_MS = 3000;

type UnwatchFn = () => void;

let unwatchFn: UnwatchFn | null = null;
let observando = false;

/* Callback externo que fileWatcherService llama cuando detecta un archivo nuevo */
type OnArchivoNuevoFn = (ruta: string, nombreArchivo: string, carpetas: string[]) => void;
type OnArchivoEliminadoFn = (ruta: string) => void;

let onArchivoNuevo: OnArchivoNuevoFn | null = null;
let onArchivoEliminado: OnArchivoEliminadoFn | null = null;

/*
 * Registra los callbacks externos para archivos nuevos/eliminados.
 * Se llama desde syncService al inicializar.
 */
export function registrarCallbacks(
    cbNuevo: OnArchivoNuevoFn,
    cbEliminado: OnArchivoEliminadoFn,
): void {
    onArchivoNuevo = cbNuevo;
    onArchivoEliminado = cbEliminado;
}

/*
 * Inicia la observación de la carpeta de sincronización.
 * Retorna true si se inició correctamente, false si no hay carpeta configurada.
 */
export async function iniciarObservacion(): Promise<boolean> {
    if (!esDesktop() || observando) return false;

    const config = obtenerConfigSync();
    if (!config.carpetaLocal || !config.sincronizacionActiva) return false;

    try {
        const { watch } = await import('@tauri-apps/plugin-fs');

        unwatchFn = await watch(
            config.carpetaLocal,
            (evento) => { procesarEvento(evento, config.carpetaLocal!); },
            { recursive: true, delayMs: 1500 },
        );

        observando = true;
        console.info('[FileWatcher] Observando carpeta:', config.carpetaLocal);
        return true;
    } catch (err) {
        console.error('[FileWatcher] Error iniciando observación:', err);
        return false;
    }
}

/*
 * Detiene la observación de la carpeta.
 */
export async function detenerObservacion(): Promise<void> {
    if (unwatchFn) {
        unwatchFn();
        unwatchFn = null;
    }
    observando = false;
    archivosRecientes.clear();
    console.info('[FileWatcher] Observación detenida');
}

/*
 * Indica si el watcher está activo.
 */
export function estaObservando(): boolean {
    return observando;
}

/*
 * Procesa un evento del watcher del filesystem.
 * Filtra por tipos relevantes (create, remove) y valida extensiones.
 */
function procesarEvento(
    evento: { type: unknown; paths: string[] },
    carpetaBase: string,
): void {
    const tipo = evento.type;

    for (const ruta of evento.paths) {
        const normalizada = ruta.replace(/\\/g, '/');
        const nombreArchivo = normalizada.split('/').pop() ?? '';

        /* Ignorar archivos temporales */
        if (PATRONES_TEMPORALES.some(p => p.test(nombreArchivo))) continue;

        /* Verificar extensión de audio */
        const extension = nombreArchivo.split('.').pop()?.toLowerCase() ?? '';
        if (!EXTENSIONES_AUDIO.has(extension)) continue;

        /* Debounce por archivo: ignorar si fue procesado recientemente */
        const ahora = Date.now();
        const ultimoProcesado = archivosRecientes.get(normalizada);
        if (ultimoProcesado && (ahora - ultimoProcesado) < DEBOUNCE_ARCHIVO_MS) continue;
        archivosRecientes.set(normalizada, ahora);

        /* Limpiar cache vieja periodicamente */
        if (archivosRecientes.size > 500) {
            for (const [k, v] of archivosRecientes) {
                if (ahora - v > 30_000) archivosRecientes.delete(k);
            }
        }

        if (esEventoCreacion(tipo)) {
            manejarArchivoNuevo(ruta, normalizada, carpetaBase);
        } else if (esEventoEliminacion(tipo)) {
            manejarArchivoEliminado(ruta);
        }
    }
}

/*
 * Determina si el tipo de evento es una creación de archivo.
 */
function esEventoCreacion(tipo: unknown): boolean {
    if (tipo === 'any') return false;
    if (typeof tipo === 'object' && tipo !== null && 'create' in tipo) return true;
    /* Modify puede significar que el archivo termino de escribirse */
    if (typeof tipo === 'object' && tipo !== null && 'modify' in tipo) {
        const modify = (tipo as { modify: { kind: string } }).modify;
        /* Solo data changes, no metadata */
        return modify?.kind === 'data' || modify?.kind === 'any';
    }
    return false;
}

/*
 * Determina si el tipo de evento es una eliminación de archivo.
 */
function esEventoEliminacion(tipo: unknown): boolean {
    if (typeof tipo === 'object' && tipo !== null && 'remove' in tipo) return true;
    return false;
}

/*
 * Maneja la detección de un archivo de audio nuevo en la carpeta sync.
 * Extrae contexto de carpetas padre (hasta 3 niveles) para la IA.
 */
function manejarArchivoNuevo(rutaOriginal: string, rutaNormalizada: string, carpetaBase: string): void {
    /* Verificar que no está ya en el índice local (ya sincronizado) */
    /* TO-DO: Comparación por hash además de ruta para detectar renames */

    /* Extraer las 3 carpetas padre relativas a la carpeta base de sync */
    const baseNormalizada = carpetaBase.replace(/\\/g, '/');
    const relativa = rutaNormalizada.startsWith(baseNormalizada)
        ? rutaNormalizada.slice(baseNormalizada.length).replace(/^\//, '')
        : rutaNormalizada;

    const partes = relativa.split('/');
    const nombreArchivo = partes.pop() ?? '';
    /* Carpetas entre la base de sync y el archivo (max 3 niveles) */
    const carpetas = partes.slice(0, 3);

    console.info('[FileWatcher] Archivo nuevo detectado:', nombreArchivo, 'carpetas:', carpetas);

    if (onArchivoNuevo) {
        onArchivoNuevo(rutaOriginal, nombreArchivo, carpetas);
    }
}

/*
 * Maneja la eliminación de un archivo de audio de la carpeta sync.
 * NO borra del servidor — solo marca como no_sincronizar en el índice local.
 */
function manejarArchivoEliminado(rutaOriginal: string): void {
    console.info('[FileWatcher] Archivo eliminado detectado:', rutaOriginal);

    if (onArchivoEliminado) {
        onArchivoEliminado(rutaOriginal);
    }
}
