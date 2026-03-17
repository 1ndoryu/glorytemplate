/*
 * Servicio: syncOrchestratorService — Orquestación de sincronización.
 *
 * Extraído de syncService.ts (TA6) para cumplir SRP.
 * Contiene: sincronizarConServidor, ejecutarSync, sincronizarSampleIndividual,
 * forzarResync. Maneja locks, circuit breaker, retry de colas.
 */

import { esDesktop, estaOnline } from './desktopService';
import {
    marcarDescargaEnCurso,
    obtenerBaseUrlSync,
    adquirirLockSync,
    registrarSyncActiva,
    liberarLockSync,
} from './syncGuards';
import { logSync } from './syncLogger';
import {
    estado,
    guardarConfig,
    guardarIndice,
    type ProgressCallback,
    type ResultadoDescargaApi,
} from './syncState';
import { sincronizarConServidorV1 } from './syncDownloadV1';
import { registrarDescarga } from './syncRegistroService';
import { rehidratarImagenesPendientes } from './syncRehidratacionService';

/**
 * Sincroniza la carpeta local con el servidor.
 * v2: delega a syncCollectionService. v1: fallback a syncDownloadV1.
 *
 * Lock concurrente: si ya hay una sync activa, retorna su resultado
 * en vez de ejecutar una segunda en paralelo (evita race conditions + IO duplicado).
 */
export async function sincronizarConServidor(
    onProgreso?: ProgressCallback,
    opciones?: { forzar?: boolean },
): Promise<{ nuevos: number; eliminados: number }> {
    const { config, collectionModule } = estado;
    const esForzado = opciones?.forzar ?? false;

    if (!config.carpetaLocal || !estaOnline()) {
        return { nuevos: 0, eliminados: 0 };
    }

    /* Si auto-sync está desactivada Y no es forzado, no ejecutar */
    if (!config.sincronizacionActiva && !esForzado) {
        return { nuevos: 0, eliminados: 0 };
    }

    /* Lock concurrente: si ya hay sync en curso, retornar misma Promise */
    const lock = adquirirLockSync();
    if (!lock.adquirido) {
        logSync.debug('syncService', 'Sync ya en curso, esperando resultado existente');
        return lock.promesaExistente as Promise<{ nuevos: number; eliminados: number }>;
    }

    const promesaSync = ejecutarSync(collectionModule, onProgreso);
    registrarSyncActiva(promesaSync);

    try {
        return await promesaSync;
    } finally {
        liberarLockSync();
    }
}

/*
 * Lógica interna de sync, separada del lock para claridad.
 */
async function ejecutarSync(
    collectionModule: typeof estado.collectionModule,
    onProgreso?: ProgressCallback,
): Promise<{ nuevos: number; eliminados: number }> {
    const carpetaLocal = estado.config.carpetaLocal;
    if (!carpetaLocal) return { nuevos: 0, eliminados: 0 };

    /* C378: Forzar retry de items con error en la cola de uploads.
     *
     * Arquitectura multi-ventana Tauri: el sync panel (sync.html) ejecuta este código
     * pero la cola real de uploads vive en la ventana principal (index.html).
     * Los módulos importados aquí operan sobre instancias locales con cola vacía.
     *
     * Solución: accedemos directamente al Tauri Store compartido (fuente de verdad)
     * y reseteamos los items en error. Además emitimos eventos para que la ventana
     * principal refresque su cola en memoria y procese los items. */
    try {
        const { load } = await import('@tauri-apps/plugin-store');

        /* 1. Resetear errores en upload-queue.json (cola de subida de archivos) */
        const uploadStore = await load('upload-queue.json');
        const uploadCola = await uploadStore.get<Array<{
            id: string;
            estado: string;
            intentos: number;
            ultimoError?: string;
            timestampActualizado: number;
            rutaArchivo: string;
            [k: string]: unknown;
        }>>('upload_cola');

        if (uploadCola) {
            let uploadCambios = false;
            for (const item of uploadCola) {
                if (item.estado === 'error') {
                    item.estado = 'pendiente';
                    item.intentos = 0;
                    item.ultimoError = undefined;
                    item.timestampActualizado = Date.now();
                    uploadCambios = true;
                }
            }
            if (uploadCambios) {
                await uploadStore.set('upload_cola', uploadCola);
                await uploadStore.save();
                logSync.info('syncOrchestrator', 'Reseteados items con error en upload-queue.json', {
                    totalPendientes: uploadCola.filter(item => item.estado === 'pendiente').length,
                });
            }
        }

        /* 2. Resetear errores en offline-queue.json (cola de operaciones API) */
        const offlineStore = await load('offline-queue.json');
        const offlineCola = await offlineStore.get<Array<{
            id: string;
            intentos: number;
            [k: string]: unknown;
        }>>('operaciones_pendientes');

        if (offlineCola) {
            let offlineCambios = false;
            for (const op of offlineCola) {
                if (op.intentos > 0) {
                    op.intentos = 0;
                    offlineCambios = true;
                }
            }
            if (offlineCambios) {
                await offlineStore.set('operaciones_pendientes', offlineCola);
                await offlineStore.save();
                logSync.info('syncOrchestrator', 'Reseteados intentos en offline-queue.json');
            }
        }

        /* 3. Resetear entradas del tracking historial (sync-config.json) que están en 'error'
         *    para que la UI del panel muestre el estado correcto. */
        const trackingStore = await load('sync-config.json');
        const tracking = await trackingStore.get<{
            historialSamples?: Array<{
                estado: string;
                error?: string;
                timestampActualizado: number;
                nombreArchivo: string;
                [k: string]: unknown;
            }>;
            [k: string]: unknown;
        }>('sync_tracking_v2');

        if (tracking?.historialSamples) {
            let trackingCambios = false;
            for (const sample of tracking.historialSamples) {
                if (sample.estado === 'error') {
                    sample.estado = 'subiendo';
                    sample.error = undefined;
                    sample.timestampActualizado = Date.now();
                    trackingCambios = true;
                }
            }
            if (trackingCambios) {
                await trackingStore.set('sync_tracking_v2', tracking);
                await trackingStore.save();
                logSync.info('syncOrchestrator', 'Reseteadas entradas de error en tracking historial');
            }
        }

        /* 4. Emitir eventos Tauri para que la ventana principal recargue su cola
         *    en memoria desde el Store ya actualizado y procese los items.
         *    C385: escanear-subidas-local hace que la ventana principal escanee la
         *    carpeta local y encole archivos que el watcher no detectó (startup,
         *    archivos copiados mientras la app estaba cerrada). */
        const { emit } = await import('@tauri-apps/api/event');
        await emit('reintentar-errores-upload', {});
        await emit('reintentar-errores-offline', {});
        await emit('escanear-subidas-local', {});
    } catch (e) {
        logSync.warn('syncService', 'No se pudo reintentar colas de subida/offline antes de sync', { error: e instanceof Error ? e.message : String(e) });
    }

    /*
     * QL73: Si borrarAlSubirExitoso esta activo, no descargar archivos del servidor.
     * El proposito de esa opcion es que los archivos locales se borren al subir;
     * descargarlos de vuelta contradice esa intencion.
     * La logica de retry de colas de subida (arriba) sigue ejecutandose porque
     * el usuario aun quiere que sus uploads pendientes se reintenten.
     */
    if (estado.configAvanzada.borrarAlSubirExitoso) {
        logSync.info('syncOrchestrator', 'Descarga omitida: borrarAlSubirExitoso activo');
        estado.config.ultimaSync = Date.now();
        await guardarConfig();
        return { nuevos: 0, eliminados: 0 };
    }

    if (collectionModule) {
        try {
            const resultado = await collectionModule.sincronizarColecciones(
                carpetaLocal,
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

            /* Rehidratar imágenes de samples que aún no las tengan.
             * El pipeline del backend genera imágenes async (~30-60s post-upload).
             * Al ejecutar esto en cada ciclo de sync, convergemos eventualmente
             * sin depender de timing del pipeline. */
            rehidratarImagenesPendientes().catch(() => {});

            return { nuevos: resultado.nuevos, eliminados: 0 };
        } catch (err) {
            logSync.error('syncService', 'Error en sync v2 (colecciones)', { error: err instanceof Error ? err.message : String(err) });
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

    /* QL73: No descargar si el usuario quiere borrar tras subir */
    if (estado.configAvanzada.borrarAlSubirExitoso) return null;

    /* Verificar si ya está descargado (inline para evitar circular con syncService) */
    const { trackingModule, indiceArchivos } = estado;
    let existente: string | null = null;
    if (trackingModule) {
        const archivo = trackingModule.buscarArchivoPorSampleId(sampleId);
        if (archivo && !archivo.syncDeshabilitado) existente = archivo.rutaLocal;
    }
    if (!existente) {
        const archivoV1 = indiceArchivos.find(a => a.sampleId === sampleId);
        existente = archivoV1?.ruta ?? null;
    }
    if (existente) return existente;

    try {
        const { mkdir, writeFile } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const baseUrl = obtenerBaseUrlSync();
        const { trackingModule } = estado;

        const { obtenerHeadersSyncGet } = await import('./syncGuards');
        const respDescarga = await fetch(
            `${baseUrl}/kamples/v1/samples/${sampleId}/descargar`,
            { method: 'POST', headers: obtenerHeadersSyncGet() },
        );
        if (!respDescarga.ok) {
            logSync.error('syncOrchestrator', 'No se pudo obtener URL de descarga para sample individual', {
                sampleId,
                status: respDescarga.status,
            });
            return null;
        }
        const { url: audioUrl, nombre, formato }: ResultadoDescargaApi =
            await respDescarga.json();

        const audioResp = await fetch(audioUrl);
        if (!audioResp.ok) {
            logSync.error('syncOrchestrator', 'Error al descargar audio de sample individual', {
                sampleId,
                status: audioResp.status,
            });
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

        logSync.info('syncOrchestrator', 'Sample individual descargado', { sampleId, rutaArchivo });
        return rutaArchivo;
    } catch (err) {
        logSync.error('syncOrchestrator', 'Error sincronizando sample individual', {
            sampleId,
            error: err instanceof Error ? err.message : String(err),
        });
        return null;
    }
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

    /*
     * Limpiar hashes de uploads conocidos: sin esto, archivos previamente subidos
     * se rechazan como duplicados incluso después de resetear tracking.
     * hashesConocidos es write-only por diseño (monotónico), así que necesita
     * limpieza explícita cuando el tracking se resetea.
     */
    try {
        const { limpiarHashesConocidos } = await import('./uploadQueueService');
        await limpiarHashesConocidos();
    } catch {
        /* uploadQueueService no disponible — continuar sin limpiar hashes */
    }

    estado.indiceArchivos = [];
    await guardarIndice();

    return sincronizarConServidor(onProgreso);
}

/*
 * Reforzar sync: reactiva samples marcados como no_sincronizar (borrados localmente)
 * y ejecuta sync completa para re-descargarlos.
 *
 * Diferencia con forzarResync: forzarResync resetea TODO el tracking (re-descarga completa).
 * reforzarSync solo reactiva los samples con syncDeshabilitado, preservando el tracking
 * de archivos que ya existen en disco. Es más rápida y menos agresiva.
 */
export async function reforzarSync(
    onProgreso?: ProgressCallback,
): Promise<{ nuevos: number; eliminados: number }> {
    const { trackingModule } = estado;

    /* Reactivar todos los samples con sync deshabilitado en tracking v2 */
    let reactivadosV2 = 0;
    if (trackingModule) {
        reactivadosV2 = await trackingModule.reactivarTodosSyncDeshabilitados();
        if (reactivadosV2 > 0) {
            await trackingModule.registrarAccion({
                tipo: 'creado',
                descripcion: `Reforzar sync: ${reactivadosV2} samples reactivados para re-descarga`,
            });
        }
    }

    /* Reactivar en índice v1 (legacy fallback): eliminar entradas deshabilitadas */
    const cantidadAntes = estado.indiceArchivos.length;
    estado.indiceArchivos = estado.indiceArchivos.filter(a => !a.syncDeshabilitado);
    const reactivadosV1 = cantidadAntes - estado.indiceArchivos.length;
    if (reactivadosV1 > 0 || reactivadosV2 > 0) {
        await guardarIndice();
    }

    logSync.info('syncOrchestrator', `Reforzar sync: ${reactivadosV2 + reactivadosV1} samples reactivados (v2: ${reactivadosV2}, v1: ${reactivadosV1})`);

    return sincronizarConServidor(onProgreso, { forzar: true });
}
