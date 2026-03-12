/*
 * Servicio: syncService — Fachada pública del sistema de sincronización.
 *
 * TA6: Refactorizado como fachada slim. La lógica se distribuyó en:
 * - syncInitService.ts: inicialización, config, migración v1→v2
 * - syncOrchestratorService.ts: sync principal, individual, resync
 * - syncRegistroService.ts: registro de descargas/subidas, movimiento de archivos
 * - syncRehidratacionService.ts: rehidratación de imágenes de portada
 *
 * Todos los importadores externos siguen apuntando a este archivo (fachada).
 * Los módulos internos adicionales se mantienen:
 * - syncState.ts: estado compartido + persistencia
 * - syncDownloadV1.ts: lógica legacy v1
 * - syncWatcherSetup.ts: watcher bidireccional + operaciones locales
 * - syncTrackingService.ts: persistencia tipada v2
 * - syncCollectionService.ts: mapeo colecciones ↔ carpetas
 * - syncGuards.ts: guards de descarga + base URL centralizada
 */

import { esDesktop } from './desktopService';
import { esSyncEnCurso } from './syncGuards';
import { logSync } from './syncLogger';
import {
    estado,
    guardarConfig,
    type SyncConfig,
} from './syncState';
import {
    detenerSyncBidireccional as detenerBidireccional,
    marcarNoSincronizar as _marcarNoSincronizar,
    marcarNoSincronizarPorId as _marcarNoSincronizarPorId,
    reactivarSync as _reactivarSync,
    obtenerEstadoSync as _obtenerEstadoSync,
    obtenerSamplesNoSincronizados as _obtenerSamplesNoSincronizados,
    moverSampleEnServidorPublico as _moverSampleEnServidorPublico,
} from './syncWatcherSetup';

/* Re-exports de tipos para mantener API pública sin romper importadores */
export { type ProgresoSync, type ProgressCallback, type SyncConfig } from './syncState';

/* Re-exports de módulos extraídos */
export { inicializarSyncService } from './syncInitService';
export {
    sincronizarConServidor,
    sincronizarSampleIndividual,
    forzarResync,
    reforzarSync,
} from './syncOrchestratorService';
export {
    registrarDescarga,
    registrarAccionHistorial,
    registrarSubidaLocal,
    moverArchivoASinColeccion,
    actualizarEstadoSampleHistorial,
} from './syncRegistroService';
export {
    rehidratarImagenesPendientesSync,
    rehidratarImagenesPendientesForzadoSync,
} from './syncRehidratacionService';

/* Re-exports de operaciones del watcher */
export const marcarNoSincronizar = _marcarNoSincronizar;
export const marcarNoSincronizarPorId = _marcarNoSincronizarPorId;
export const reactivarSync = _reactivarSync;
export const obtenerEstadoSync = _obtenerEstadoSync;
export const obtenerSamplesNoSincronizados = _obtenerSamplesNoSincronizados;
export const moverSampleEnServidorPublico = _moverSampleEnServidorPublico;
export const detenerSyncBidireccional = detenerBidireccional;

/* Configuración */

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
            estado.config.carpetaLocal = carpeta;
            await guardarConfig();
            return carpeta;
        }
    } catch (err) {
        logSync.error('syncService', 'Error eligiendo carpeta', { error: err instanceof Error ? err.message : String(err) });
    }

    return null;
}

export async function toggleSincronizacion(activa: boolean): Promise<void> {
    estado.config.sincronizacionActiva = activa;
    await guardarConfig();
}

export function obtenerConfigSync(): SyncConfig {
    return { ...estado.config };
}

export function haySyncEnCurso(): boolean {
    return esSyncEnCurso();
}

export async function abrirCarpetaSync(): Promise<boolean> {
    if (!esDesktop()) return false;
    if (!estado.config.carpetaLocal) return false;

    try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('abrir_carpeta', { ruta: estado.config.carpetaLocal });
        return true;
    } catch (err) {
        logSync.error('syncService', 'Error abriendo carpeta local', { error: err instanceof Error ? err.message : String(err) });
        return false;
    }
}

/* Consultas */

/*
 * Verifica si un sample ya está descargado localmente.
 * Retorna la ruta local si existe, null si no.
 */
export function obtenerRutaLocal(sampleId: number): string | null {
    const { trackingModule, indiceArchivos } = estado;

    if (trackingModule) {
        const archivo = trackingModule.buscarArchivoPorSampleId(sampleId);
        if (archivo && !archivo.syncDeshabilitado) return archivo.rutaLocal;
    }

    const archivo = indiceArchivos.find(a => a.sampleId === sampleId);
    return archivo?.ruta ?? null;
}

/* Utilidades */

/*
 * Extrae metadata de la ruta del archivo para auto-descripción.
 */
export function extraerMetadataDeRuta(rutaCompleta: string): {
    carpetas: string[];
    nombreArchivo: string;
    extension: string;
} {
    const partes = rutaCompleta.replace(/\\/g, '/').split('/').filter(Boolean);
    const archivoConExt = partes.pop() ?? '';
    const dotIndex = archivoConExt.lastIndexOf('.');

    const nombreArchivo = dotIndex > 0 ? archivoConExt.slice(0, dotIndex) : archivoConExt;
    const extension = dotIndex > 0 ? archivoConExt.slice(dotIndex + 1) : '';
    const carpetas = partes.slice(-3);

    return { carpetas, nombreArchivo, extension };
}

/* Historial y colecciones */

export function obtenerHistorialSync(limite = 50): Array<{
    tipo: string;
    descripcion: string;
    sampleId?: number;
    coleccionId?: number;
    timestamp: number;
}> {
    if (!estado.trackingModule) return [];
    return estado.trackingModule.obtenerHistorial(limite);
}

/**
 * Historial per-sample v2: una entrada por sample con estado evolutivo.
 * Usado por VentanaSincPanel para mostrar historial con imagen y click-to-navigate.
 */
export function obtenerHistorialSamplesSync(limite = 50): Array<{
    sampleId: number;
    nombreArchivo: string;
    estado: 'detectado' | 'subiendo' | 'sincronizado' | 'error' | 'moviendo' | 'descargando' | 'descargado';
    imagenUrl: string | null;
    rutaLocal: string | null;
    coleccionNombre?: string;
    timestampCreado: number;
    timestampActualizado: number;
    error?: string;
}> {
    if (!estado.trackingModule?.obtenerHistorialSamples) return [];
    return estado.trackingModule.obtenerHistorialSamples(limite);
}

export async function limpiarHistorialSync(): Promise<void> {
    if (!estado.trackingModule) return;
    await estado.trackingModule.limpiarHistorial();
    /* Limpiar también historial per-sample v2 */
    if (estado.trackingModule.limpiarHistorialSamples) {
        await estado.trackingModule.limpiarHistorialSamples();
    }
}

/**
 * Re-lee el historial per-sample desde el Tauri Store compartido.
 * Necesario en ventanas MPA (sync panel) para ver actualizaciones de la ventana main
 * (ej: imagen de portada obtenida post-pipeline). Throttle interno de 5s.
 */
export async function recargarHistorialDesdeStore(): Promise<void> {
    if (!estado.trackingModule?.recargarHistorialDesdeStore) return;
    await estado.trackingModule.recargarHistorialDesdeStore();
}

export function obtenerColeccionesSync(): Array<{
    id: number;
    nombre: string;
    carpetaLocal: string;
    archivos: number;
}> {
    const { trackingModule } = estado;
    if (!trackingModule) return [];

    const colecciones = trackingModule.todasLasColecciones();
    const resultado = colecciones.map(col => ({
        id: col.id,
        nombre: col.nombre,
        carpetaLocal: col.carpetaLocal,
        archivos: trackingModule.listarArchivosPorColeccion(col.id).length,
    }));

    const totalSinCol = trackingModule.totalSinColeccion();
    if (totalSinCol > 0) {
        resultado.push({
            id: 0,
            nombre: 'Sin colección',
            carpetaLocal: 'Sin colección',
            archivos: totalSinCol,
        });
    }

    return resultado;
}

