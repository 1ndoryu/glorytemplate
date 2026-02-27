/*
 * Servicio: syncService — Fachada pública del sistema de sincronización.
 *
 * Orquesta la inicialización y expone la API pública consumida por:
 * - desktop/src/main.tsx (window.__KAMPLES_SYNC__)
 * - uploadQueueService (registrarDescarga, moverSampleEnServidorPublico, etc.)
 * - fileWatcherService (obtenerConfigSync)
 * - audioLocalService (obtenerRutaLocal)
 * - desktopService (inicializarSyncService)
 *
 * Arquitectura interna (módulos):
 * - syncState.ts: estado compartido + persistencia
 * - syncDownloadV1.ts: lógica legacy v1
 * - syncWatcherSetup.ts: watcher bidireccional + operaciones locales
 * - syncTrackingService.ts: persistencia tipada v2
 * - syncCollectionService.ts: mapeo colecciones ↔ carpetas
 * - syncGuards.ts: guards de descarga + base URL centralizada
 */

import { esDesktop, estaOnline } from './desktopService';
import { marcarDescargaEnCurso, obtenerBaseUrlSync } from './syncGuards';
import {
    estado,
    guardarConfig,
    guardarIndice,
    STORE_FILE,
    STORE_KEY_CONFIG,
    STORE_KEY_INDICE,
    type SyncConfig,
    type ArchivoLocal,
    type ResultadoDescargaApi,
    type ProgressCallback,
} from './syncState';
import { sincronizarConServidorV1 } from './syncDownloadV1';
import {
    inicializarSyncBidireccional,
    detenerSyncBidireccional as detenerBidireccional,
    marcarNoSincronizar as _marcarNoSincronizar,
    marcarNoSincronizarPorId as _marcarNoSincronizarPorId,
    reactivarSync as _reactivarSync,
    obtenerEstadoSync as _obtenerEstadoSync,
    obtenerSamplesNoSincronizados as _obtenerSamplesNoSincronizados,
    moverSampleEnServidorPublico as _moverSampleEnServidorPublico,
} from './syncWatcherSetup';

/* Re-exports para mantener API pública sin romper importadores */
export { type ProgresoSync, type ProgressCallback, type SyncConfig } from './syncState';

/* Re-exports de operaciones del watcher */
export const marcarNoSincronizar = _marcarNoSincronizar;
export const marcarNoSincronizarPorId = _marcarNoSincronizarPorId;
export const reactivarSync = _reactivarSync;
export const obtenerEstadoSync = _obtenerEstadoSync;
export const obtenerSamplesNoSincronizados = _obtenerSamplesNoSincronizados;
export const moverSampleEnServidorPublico = _moverSampleEnServidorPublico;
export const detenerSyncBidireccional = detenerBidireccional;

/* Inicialización */

/*
 * Inicializa el servicio de sync: carga config, tracking v2 y migra si necesario.
 */
export async function inicializarSyncService(): Promise<void> {
    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);

        const configGuardada = await store.get<SyncConfig>(STORE_KEY_CONFIG);
        if (configGuardada) estado.config = configGuardada;

        const indiceGuardado = await store.get<ArchivoLocal[]>(STORE_KEY_INDICE);
        if (indiceGuardado) estado.indiceArchivos = indiceGuardado;
    } catch {
        /* Config no disponible — usar defaults */
    }

    /* C355: Inicializar tracking v2 y migrar datos v1 si es primera vez */
    try {
        estado.trackingModule = await import('./syncTrackingService');
        estado.collectionModule = await import('./syncCollectionService');
        await estado.trackingModule.inicializarTracking();

        if (estado.trackingModule.totalArchivos() === 0 && estado.indiceArchivos.length > 0) {
            const migrado = await estado.trackingModule.migrarDesdeV1();
            if (migrado) {
                console.info('[Sync] Migración v1→v2 completada automáticamente');
            }
        }
    } catch (err) {
        console.error('[Sync] Error inicializando tracking v2:', err);
    }

    await inicializarSyncBidireccional();
}

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
        console.error('[Sync] Error eligiendo carpeta:', err);
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

/* Registro de descargas */

/*
 * Registra un archivo descargado en tracking v2 + índice v1 legacy.
 */
export async function registrarDescarga(
    sampleId: number,
    ruta: string,
    nombreOriginal: string,
    nombreServidor: string,
    coleccionId?: number | null,
): Promise<void> {
    const { trackingModule } = estado;

    if (trackingModule) {
        await trackingModule.registrarArchivo({
            sampleId,
            coleccionId: coleccionId ?? null,
            rutaLocal: ruta,
            nombreLocal: nombreServidor,
            nombreServidor,
            descargadoEn: Date.now(),
            tamano: 0,
            syncDeshabilitado: false,
        });
    }

    estado.indiceArchivos = estado.indiceArchivos.filter(a => a.sampleId !== sampleId);
    estado.indiceArchivos.push({
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

/* Operaciones de archivo */

/*
 * Mueve un archivo de la raíz de sync a la carpeta "Sin colección" y actualiza tracking.
 */
export async function moverArchivoASinColeccion(
    rutaActual: string,
    nombreArchivo: string,
    sampleId: number,
): Promise<string | null> {
    if (!estado.config.carpetaLocal) return null;

    try {
        const { mkdir, rename } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const { trackingModule } = estado;

        const carpetaSinCol = await join(estado.config.carpetaLocal, 'Sin colección');
        await mkdir(carpetaSinCol, { recursive: true }).catch(() => { /* ya existe */ });

        const nuevaRuta = await join(carpetaSinCol, nombreArchivo);
        await rename(rutaActual, nuevaRuta);

        if (trackingModule) {
            const archivo = trackingModule.buscarArchivoPorSampleId(sampleId);
            if (archivo) {
                await trackingModule.registrarArchivo({
                    ...archivo,
                    rutaLocal: nuevaRuta,
                    coleccionId: null,
                });
            }
            await trackingModule.agregarSinColeccion(sampleId);
            await trackingModule.registrarAccion({
                tipo: 'movido',
                descripcion: `${nombreArchivo} → Sin colección`,
                sampleId,
            });
        }

        const archivoV1 = estado.indiceArchivos.find(a => a.sampleId === sampleId);
        if (archivoV1) {
            archivoV1.ruta = nuevaRuta;
            await guardarIndice();
        }

        console.info('[Sync] Archivo movido a Sin colección:', nombreArchivo);
        return nuevaRuta;
    } catch (err) {
        console.error('[Sync] Error moviendo archivo a Sin colección:', err);
        return null;
    }
}

/* Sincronización principal */

/*
 * Sincroniza la carpeta local con el servidor.
 * v2: delega a syncCollectionService. v1: fallback a syncDownloadV1.
 */
export async function sincronizarConServidor(
    onProgreso?: ProgressCallback,
): Promise<{ nuevos: number; eliminados: number }> {
    const { config, collectionModule } = estado;
    if (!config.carpetaLocal || !config.sincronizacionActiva || !estaOnline()) {
        return { nuevos: 0, eliminados: 0 };
    }

    if (collectionModule) {
        try {
            const resultado = await collectionModule.sincronizarColecciones(
                config.carpetaLocal,
                onProgreso ? (progreso) => {
                    onProgreso({
                        actual: progreso.actual,
                        total: progreso.total,
                        sampleId: progreso.sampleId ?? 0,
                        nombre: progreso.nombre ?? '',
                        estado: progreso.estado === 'omitido' ? 'descargado' : (progreso.estado ?? 'descargando'),
                    });
                } : undefined,
            );

            estado.config.ultimaSync = Date.now();
            await guardarConfig();
            return { nuevos: resultado.nuevos, eliminados: 0 };
        } catch (err) {
            console.error('[Sync] Error en sync v2 (colecciones):', err);
            throw err;
        }
    }

    return sincronizarConServidorV1(onProgreso);
}

/*
 * Sincroniza un sample individual a la carpeta local.
 */
export async function sincronizarSampleIndividual(
    sampleId: number,
    carpetaPrimaria?: string,
    carpetaSecundaria?: string,
    coleccionId?: number,
): Promise<string | null> {
    if (!esDesktop() || !estaOnline()) return null;
    if (!estado.config.carpetaLocal || !estado.config.sincronizacionActiva) return null;

    const existente = obtenerRutaLocal(sampleId);
    if (existente) return existente;

    try {
        const { mkdir, writeFile } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const baseUrl = obtenerBaseUrlSync();
        const { trackingModule } = estado;

        const respDescarga = await fetch(
            `${baseUrl}/kamples/v1/samples/${sampleId}/descargar`,
            { method: 'POST' },
        );
        if (!respDescarga.ok) {
            console.error(`[SyncIndividual] No se pudo obtener URL de descarga: ${respDescarga.status}`);
            return null;
        }
        const { url: audioUrl, nombre, formato }: ResultadoDescargaApi =
            await respDescarga.json();

        const audioResp = await fetch(audioUrl);
        if (!audioResp.ok) {
            console.error(`[SyncIndividual] Error al descargar audio: ${audioResp.status}`);
            return null;
        }
        const buffer = await audioResp.arrayBuffer();

        const nombreArchivo = nombre.includes('.') ? nombre : `${nombre}.${formato}`;
        const carpetaBase = estado.config.carpetaLocal;

        let rutaDestino: string;
        const coleccionLocal = coleccionId && trackingModule
            ? trackingModule.obtenerColeccion(coleccionId)
            : null;

        if (coleccionLocal) {
            rutaDestino = await join(carpetaBase, coleccionLocal.carpetaLocal);
            try {
                await mkdir(rutaDestino, { recursive: true });
            } catch { /* puede existir */ }
        } else {
            const primaria = carpetaPrimaria || 'General';
            rutaDestino = await join(carpetaBase, primaria);
            try {
                await mkdir(rutaDestino, { recursive: true });
            } catch { /* puede existir */ }

            if (carpetaSecundaria) {
                rutaDestino = await join(rutaDestino, carpetaSecundaria);
                try {
                    await mkdir(rutaDestino, { recursive: true });
                } catch { /* puede existir */ }
            }
        }

        const rutaArchivo = await join(rutaDestino, nombreArchivo);
        marcarDescargaEnCurso(rutaArchivo);

        await writeFile(rutaArchivo, new Uint8Array(buffer));
        await registrarDescarga(sampleId, rutaArchivo, nombre, nombreArchivo, coleccionId ?? null);

        console.info(`[SyncIndividual] Sample ${sampleId} descargado a: ${rutaArchivo}`);
        return rutaArchivo;
    } catch (err) {
        console.error(`[SyncIndividual] Error sincronizando sample ${sampleId}:`, err);
        return null;
    }
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

/* C358: Historial y colecciones */

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

export async function forzarResync(
    onProgreso?: ProgressCallback,
): Promise<{ nuevos: number; eliminados: number }> {
    const { trackingModule } = estado;

    if (trackingModule) {
        await trackingModule.resetearTracking();
        await trackingModule.registrarAccion({
            tipo: 'creado',
            descripcion: 'Re-sync forzada por el usuario',
        });
    }

    estado.indiceArchivos = [];
    await guardarIndice();

    return sincronizarConServidor(onProgreso);
}
