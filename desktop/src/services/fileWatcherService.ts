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

/*
 * Gracia para detección de MOVEs.
 * Un MOVE genera DELETE + CREATE. Bufferamos el DELETE por GRACIA_MOVE_MS
 * y si aparece un CREATE con el mismo nombre, se trata como move.
 */
const GRACIA_MOVE_MS = 5000;

interface EliminacionPendiente {
    ruta: string;
    nombreArchivo: string;
    timeout: ReturnType<typeof setTimeout>;
}

/* Mapa: nombreArchivo normalizado → EliminacionPendiente */
const eliminacionesPendientes = new Map<string, EliminacionPendiente>();

type UnwatchFn = () => void;

let unwatchFn: UnwatchFn | null = null;
let observando = false;

/* Callbacks externos que fileWatcherService llama según el evento detectado */
type OnArchivoNuevoFn = (ruta: string, nombreArchivo: string, carpetas: string[]) => void;
type OnArchivoEliminadoFn = (ruta: string) => void;
type OnArchivoMovidoFn = (rutaAnterior: string, rutaNueva: string, nombreArchivo: string, carpetas: string[]) => void;

let onArchivoNuevo: OnArchivoNuevoFn | null = null;
let onArchivoEliminado: OnArchivoEliminadoFn | null = null;
let onArchivoMovido: OnArchivoMovidoFn | null = null;

/*
 * Registra los callbacks externos para archivos nuevos/eliminados/movidos.
 * Se llama desde syncService al inicializar.
 */
export function registrarCallbacks(
    cbNuevo: OnArchivoNuevoFn,
    cbEliminado: OnArchivoEliminadoFn,
    cbMovido?: OnArchivoMovidoFn,
): void {
    onArchivoNuevo = cbNuevo;
    onArchivoEliminado = cbEliminado;
    onArchivoMovido = cbMovido ?? null;
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

    /* Limpiar eliminaciones pendientes para evitar callbacks sueltos */
    for (const [, pendiente] of eliminacionesPendientes) {
        clearTimeout(pendiente.timeout);
    }
    eliminacionesPendientes.clear();

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
            /*
             * Para eliminaciones, limpiar del debounce cache: si luego llega un
             * create (move), no debe ser bloqueado por el debounce del delete previo.
             */
            archivosRecientes.delete(normalizada);
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
 * Antes de emitir onArchivoNuevo, verifica si hay una eliminación pendiente
 * con el mismo nombre → en ese caso es un MOVE, no un archivo nuevo.
 */
function manejarArchivoNuevo(rutaOriginal: string, rutaNormalizada: string, carpetaBase: string): void {
    /* Extraer las 3 carpetas padre relativas a la carpeta base de sync */
    const baseNormalizada = carpetaBase.replace(/\\/g, '/');
    const relativa = rutaNormalizada.startsWith(baseNormalizada)
        ? rutaNormalizada.slice(baseNormalizada.length).replace(/^\//, '')
        : rutaNormalizada;

    const partes = relativa.split('/');
    const nombreArchivo = partes.pop() ?? '';
    /* Carpetas entre la base de sync y el archivo (max 3 niveles) */
    const carpetas = partes.slice(0, 3);

    /* Verificar si hay una eliminación pendiente con el mismo nombre */
    const clave = nombreArchivo.toLowerCase();
    const pendiente = eliminacionesPendientes.get(clave);

    if (pendiente) {
        /* Es un MOVE: cancelar la eliminación pendiente y emitir move */
        clearTimeout(pendiente.timeout);
        eliminacionesPendientes.delete(clave);

        console.info('[FileWatcher] Move detectado:', pendiente.ruta, '→', rutaOriginal);

        if (onArchivoMovido) {
            onArchivoMovido(pendiente.ruta, rutaOriginal, nombreArchivo, carpetas);
        }
        return;
    }

    console.info('[FileWatcher] Archivo nuevo detectado:', nombreArchivo, 'carpetas:', carpetas);

    if (onArchivoNuevo) {
        onArchivoNuevo(rutaOriginal, nombreArchivo, carpetas);
    }
}

/*
 * Maneja la eliminación de un archivo de audio de la carpeta sync.
 * NO ejecuta inmediatamente — buferea por GRACIA_MOVE_MS para detectar MOVEs.
 * Si pasada la gracia no apareció un CREATE con el mismo nombre, se confirma.
 */
function manejarArchivoEliminado(rutaOriginal: string): void {
    const normalizada = rutaOriginal.replace(/\\/g, '/');
    const nombreArchivo = normalizada.split('/').pop() ?? '';
    const clave = nombreArchivo.toLowerCase();

    /* Si ya hay una eliminación pendiente para este nombre, cancelar la anterior */
    const existente = eliminacionesPendientes.get(clave);
    if (existente) {
        clearTimeout(existente.timeout);
    }

    console.info('[FileWatcher] Eliminación detectada (esperando', GRACIA_MOVE_MS, 'ms por posible move):', rutaOriginal);

    const timeout = setTimeout(() => {
        eliminacionesPendientes.delete(clave);
        console.info('[FileWatcher] Eliminación confirmada (no fue move):', rutaOriginal);
        if (onArchivoEliminado) {
            onArchivoEliminado(rutaOriginal);
        }
    }, GRACIA_MOVE_MS);

    eliminacionesPendientes.set(clave, {
        ruta: rutaOriginal,
        nombreArchivo,
        timeout,
    });
}
