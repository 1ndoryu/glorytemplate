/*
 * Servicio: syncWatcherSetup — Sync bidireccional y operaciones locales.
 *
 * Gestiona:
 * - Inicialización del watcher (fileWatcherService) + upload queue
 * - Callbacks de archivos nuevos/eliminados/movidos
 * - Callbacks de carpetas (crear/renombrar colecciones)
 * - Polling periódico de estructura de carpetas
 * - Operaciones de estado: marcarNoSincronizar, reactivarSync, etc.
 * - Operaciones de movimiento: manejarMoveLocal, moverSampleEnServidor
 *
 * Responsabilidad: watcher + operaciones local↔servidor. Sin descarga masiva.
 */

import { estaOnline } from './desktopService';
import { esDescargaEnCurso, esMovimientoInterno, obtenerBaseUrlSync, esSyncEnCurso, obtenerHeadersSyncGet } from './syncGuards';
import { clasificarError, esErrorDeRed } from './errorSync';
import { encolarOperacion } from './offlineQueueService';
import {
    estado,
    guardarIndice,
    buscarEnIndicePorRuta,
    actualizarIndiceArchivo,
    guardarCursorDelta,
    POLLING_CARPETAS_MS,
    type ArchivoLocal,
} from './syncState';
import { sincronizarEstructuraCarpetasV1 } from './syncDownloadV1';
import { inicializarPapelera, purgarExpirados } from './papeleraService';
import { logSync } from './syncLogger';

/* Carpetas locales del sistema que NO deben crear colecciones en el servidor.
 * QL70: Archivos dentro de estas carpetas sí se escanean y encolan para subida,
 * pero con carpetas vacías para que el server los trate como "sin colección". */
const CARPETAS_SISTEMA_SYNC = new Set([
    'sin colecci\u00f3n',
    'sin coleccion',
    'sin colecci\u00c3\u00b3n',
    'duplicados',
]);

/* Extensiones de audio reconocidas — debe mantenerse en sync con fileWatcherService.ts */
const EXTENSIONES_AUDIO_SCAN = new Set(['wav', 'mp3', 'flac', 'aiff', 'aif', 'ogg']);

/*
 * Carpetas totalmente excluidas del escaneo local.
 * Espeja CARPETAS_EXCLUIDAS_TOTAL de fileWatcherService.ts.
 */
const CARPETAS_EXCLUIDAS_SCAN = new Set(['.papelera']);

interface ResumenEscaneoLocal {
    directoriosEscaneados: number;
    audiosDetectados: number;
    encolados: number;
    yaSincronizados: number;
    staleLegacyLimpiados: number;
    carpetasIgnoradas: number;
    errores: number;
}

/*
 * Escanea la carpeta de sync en busca de archivos de audio locales que no
 * están en el tracking (no fueron detectados por el watcher — arranque,
 * archivos copiados mientras la app estaba cerrada, etc.) y los encola para
 * subida. Recorre toda la jerarquía sin límite artificial de profundidad.
 *
 * Idempotente: encolarArchivo ya tiene guards de dedup (ruta + hash).
 * Se puede llamar múltiples veces sin efectos secundarios.
 */
export async function escanearCarpetaYEncolar(): Promise<number> {
    const { config, trackingModule } = estado;
    if (!config.carpetaLocal || !config.sincronizacionActiva) {
        logSync.warn('syncWatcher', 'escanearCarpetaYEncolar ABORTADO — config incompleta', {
            carpetaLocal: !!config.carpetaLocal,
            sincronizacionActiva: config.sincronizacionActiva,
        });
        return 0;
    }

    try {
        const { readDir } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const { encolarArchivo } = await import('./uploadQueueService');

        const carpetaBase = config.carpetaLocal;
        const resumen: ResumenEscaneoLocal = {
            directoriosEscaneados: 0,
            audiosDetectados: 0,
            encolados: 0,
            yaSincronizados: 0,
            staleLegacyLimpiados: 0,
            carpetasIgnoradas: 0,
            errores: 0,
        };

        const procesarArchivo = async (
            rutaArchivo: string,
            nombreArchivo: string,
            carpetas: string[],
        ): Promise<void> => {
            const rutaNorm = rutaArchivo.replace(/\\/g, '/');
            resumen.audiosDetectados++;

            if (trackingModule) {
                const enTracking = trackingModule.buscarArchivoPorRuta(rutaNorm);
                if (enTracking && !enTracking.syncDeshabilitado) {
                    resumen.yaSincronizados++;
                    return;
                }
            }
            /* QL130: Si tracking v2 no tiene el archivo pero indice legacy si,
             * la entrada es stale (ej: samples eliminados del servidor). Limpiar. */
            const porRutaScan = buscarEnIndicePorRuta(rutaNorm);
            if (porRutaScan) {
                const idx = estado.indiceArchivos.indexOf(porRutaScan);
                if (idx >= 0) estado.indiceArchivos.splice(idx, 1);
                estado.indiceArchivosPorRuta.delete(rutaNorm);
                if (porRutaScan.nombreServidor) estado.indiceArchivosPorNombre.delete(porRutaScan.nombreServidor);
                if (porRutaScan.nombreOriginal && porRutaScan.nombreOriginal !== porRutaScan.nombreServidor) {
                    estado.indiceArchivosPorNombre.delete(porRutaScan.nombreOriginal);
                }
                guardarIndice();
                resumen.staleLegacyLimpiados++;
            }

            const fueEncolado = await encolarArchivo(rutaArchivo, nombreArchivo, carpetas);
            if (fueEncolado) {
                resumen.encolados++;
            }
        };

        const escanearDirectorio = async (
            rutaDirectorio: string,
            carpetasServidor: string[],
            sinColeccionDesdeAqui: boolean,
        ): Promise<void> => {
            resumen.directoriosEscaneados++;

            let entradas;
            try {
                entradas = await readDir(rutaDirectorio);
            } catch (errDir) {
                resumen.errores++;
                logSync.warn('syncWatcher', 'Error escaneando directorio local', {
                    rutaDirectorio,
                    error: errDir instanceof Error ? errDir.message : String(errDir),
                });
                return;
            }

            for (const entrada of entradas) {
                if (!entrada.name) continue;

                const nombreLower = entrada.name.toLowerCase();
                const rutaEntrada = await join(rutaDirectorio, entrada.name);

                if (entrada.isDirectory) {
                    if (CARPETAS_EXCLUIDAS_SCAN.has(nombreLower)) {
                        resumen.carpetasIgnoradas++;
                        continue;
                    }

                    const esCarpetaSistema = CARPETAS_SISTEMA_SYNC.has(nombreLower);
                    const siguienteSinColeccion = sinColeccionDesdeAqui || esCarpetaSistema;
                    const siguientesCarpetas = siguienteSinColeccion
                        ? []
                        : [...carpetasServidor, entrada.name];

                    await escanearDirectorio(rutaEntrada, siguientesCarpetas, siguienteSinColeccion);
                    continue;
                }

                const ext = entrada.name.split('.').pop()?.toLowerCase() ?? '';
                if (!EXTENSIONES_AUDIO_SCAN.has(ext)) continue;
                await procesarArchivo(rutaEntrada, entrada.name, carpetasServidor);
            }
        };

        await escanearDirectorio(carpetaBase, [], false);

        logSync.info('syncWatcher', 'Escaneo local completado', resumen);
        return resumen.encolados;
    } catch (err) {
        logSync.error('syncWatcher', 'Error en escaneo de carpeta local', {
            error: err instanceof Error ? err.message : String(err),
        });
        return 0;
    }
}

/* Operaciones de estado de sync por sample */

/*
 * Marca un sample como "no sincronizar" por ruta local.
 * Se llama cuando el usuario elimina un archivo de la carpeta sync.
 * El sample NO se borra del servidor — solo deja de sincronizarse.
 */
export async function marcarNoSincronizar(ruta: string): Promise<boolean> {
    const { trackingModule, indiceArchivos } = estado;

    /* v2: buscar en tracking por ruta y deshabilitar */
    if (trackingModule) {
        const archivoV2 = trackingModule.buscarArchivoPorRuta(ruta);
        if (archivoV2) {
            await trackingModule.marcarSyncDeshabilitado(archivoV2.sampleId, archivoV2.coleccionId);
            await trackingModule.registrarAccion({
                tipo: 'eliminado_local',
                descripcion: `Eliminado localmente: ${archivoV2.nombreLocal}`,
                sampleId: archivoV2.sampleId,
                coleccionId: archivoV2.coleccionId ?? undefined,
            });
        }
    }

    const rutaNormalizada = ruta.replace(/\\/g, '/');
    const archivo = buscarEnIndicePorRuta(rutaNormalizada);

    if (!archivo) {
        if (trackingModule?.buscarArchivoPorRuta(ruta)) return true;
        console.warn('[Sync] No se encontró archivo en índice para marcar no_sincronizar:', ruta);
        return false;
    }

    archivo.syncDeshabilitado = true;
    archivo.rutaEliminada = archivo.ruta;
    guardarIndice();

    console.info('[Sync] Sample marcado como no_sincronizar:', archivo.nombre, '(sampleId:', archivo.sampleId, ')');
    return true;
}

/*
 * Marca un sample como "no sincronizar" por su ID de sample.
 * Versión para usar desde la UI del explorador.
 */
export async function marcarNoSincronizarPorId(sampleId: number): Promise<boolean> {
    const { trackingModule, indiceArchivos } = estado;

    if (trackingModule) {
        const archivoV2 = trackingModule.buscarArchivoPorSampleId(sampleId);
        if (archivoV2) {
            await trackingModule.marcarSyncDeshabilitado(sampleId, archivoV2.coleccionId);
        }
    }

    const archivo = indiceArchivos.find(a => a.sampleId === sampleId);
    if (!archivo) {
        if (trackingModule?.buscarArchivoPorSampleId(sampleId)) return true;
        return false;
    }

    archivo.syncDeshabilitado = true;
    archivo.rutaEliminada = archivo.ruta;
    guardarIndice();

    console.info('[Sync] Sample marcado como no_sincronizar por ID:', sampleId);
    return true;
}

/*
 * Reactiva la sincronización de un sample.
 * El archivo se re-descargará en la próxima sincronización.
 */
export async function reactivarSync(sampleId: number): Promise<boolean> {
    const { trackingModule } = estado;
    let encontradoV2 = false;

    if (trackingModule) {
        encontradoV2 = await trackingModule.reactivarSync(sampleId);
    }

    const archivo = estado.indiceArchivos.find(a => a.sampleId === sampleId);
    if (!archivo && !encontradoV2) return false;

    estado.indiceArchivos = estado.indiceArchivos.filter(a => a.sampleId !== sampleId);
    guardarIndice();

    console.info('[Sync] Sync reactivada para sample:', sampleId, '— se descargará en próxima sync');
    return true;
}

/*
 * Obtiene el estado de sincronización de un sample.
 * Retorna: 'sincronizado' | 'no_sincronizar' | 'no_descargado'
 */
export function obtenerEstadoSync(sampleId: number): 'sincronizado' | 'no_sincronizar' | 'no_descargado' {
    const { trackingModule, indiceArchivos } = estado;

    if (trackingModule) {
        const archivoV2 = trackingModule.buscarArchivoPorSampleId(sampleId);
        if (archivoV2) {
            return archivoV2.syncDeshabilitado ? 'no_sincronizar' : 'sincronizado';
        }
    }

    const archivo = indiceArchivos.find(a => a.sampleId === sampleId);
    if (!archivo) return 'no_descargado';
    if (archivo.syncDeshabilitado) return 'no_sincronizar';
    return 'sincronizado';
}

/*
 * Obtiene todos los samples con sync deshabilitado.
 * Para mostrar en la UI del explorador.
 */
export function obtenerSamplesNoSincronizados(): Array<{ sampleId: number; nombre: string }> {
    const { trackingModule, indiceArchivos } = estado;

    if (trackingModule) {
        const todos = trackingModule.todosLosArchivos();
        const noSyncV2 = todos
            .filter(a => a.syncDeshabilitado)
            .map(a => ({ sampleId: a.sampleId, nombre: a.nombreLocal }));

        const idsV2 = new Set(noSyncV2.map(a => a.sampleId));
        const noSyncV1 = indiceArchivos
            .filter(a => a.syncDeshabilitado && !idsV2.has(a.sampleId))
            .map(a => ({ sampleId: a.sampleId, nombre: a.nombre }));

        return [...noSyncV2, ...noSyncV1];
    }

    return indiceArchivos
        .filter(a => a.syncDeshabilitado)
        .map(a => ({ sampleId: a.sampleId, nombre: a.nombre }));
}

/* Operaciones de movimiento local ↔ servidor */

/*
 * Resuelve la colección destino desde las carpetas del move y actualiza
 * tanto coleccion_samples en el servidor como coleccionId en el tracking.
 *
 * Problema original: manejarMoveLocal solo usaba PUT /me/coleccionados/{id}/carpeta
 * (actualiza metadata) sin tocar coleccion_samples. Resultado: el sample se "movía"
 * a nivel metadata pero nunca aparecía en la colección en la web/API.
 */
async function actualizarColeccionEnMovimiento(
    sampleId: number,
    carpetas: string[],
    archivoTracking: { sampleId: number; coleccionId: number | null; rutaLocal: string; nombreLocal: string; nombreServidor: string; descargadoEn: number; tamano: number; syncDeshabilitado: boolean } | null,
): Promise<void> {
    const { trackingModule } = estado;
    if (!trackingModule) return;

    const primaria = carpetas[0] || '';
    const esSinColeccion = !primaria || CARPETAS_SISTEMA_SYNC.has(primaria.toLowerCase());

    /* Resolver coleccionId destino — caminar N niveles de subcollections */
    let coleccionDestinoId: number | null = null;
    if (!esSinColeccion) {
        const colPadre = trackingModule.buscarColeccionPorCarpeta(primaria);
        if (colPadre) {
            coleccionDestinoId = colPadre.id;

            /* Caminar carpetas[1..N] buscando subcollections anidadas */
            const todasCols = trackingModule.todasLasColecciones();
            let padreActual = colPadre.id;
            for (let i = 1; i < carpetas.length; i++) {
                if (!carpetas[i]) break;
                const sub = todasCols.find(
                    c => c.parentId === padreActual
                        && c.carpetaLocal.toLowerCase() === carpetas[i].toLowerCase(),
                );
                if (!sub) break;
                coleccionDestinoId = sub.id;
                padreActual = sub.id;
            }
        }
    }

    /* Actualizar coleccion_samples en el servidor */
    try {
        const { agregarSampleAColeccion, invalidarCacheColecciones } = await import('./syncCollectionService');

        if (coleccionDestinoId !== null) {
            /* Move a una colección real → INSERT/UPDATE en coleccion_samples */
            await agregarSampleAColeccion(coleccionDestinoId, sampleId);
            invalidarCacheColecciones();
        }
        /* Para "sin coleccion" el PUT /me/coleccionados ya maneja la metadata;
         * el endpoint de quitar necesita el coleccionId origen que puede no estar
         * disponible de forma fiable. El delta sync reconciliará si es necesario. */
    } catch (err) {
        console.error('[Sync] Error actualizando coleccion_samples en move:', sampleId, err);
    }

    /* Actualizar coleccionId en tracking v2 */
    if (archivoTracking && archivoTracking.coleccionId !== coleccionDestinoId) {
        /* Clave tracking = sampleId_coleccionId → hay que eliminar entry vieja y crear nueva */
        await trackingModule.eliminarArchivo(archivoTracking.sampleId, archivoTracking.coleccionId);
        await trackingModule.registrarArchivo({
            ...archivoTracking,
            coleccionId: coleccionDestinoId,
        });
    }
}

/*
 * Llama al endpoint PUT /me/coleccionados/{id}/carpeta para mover
 * un sample a otra carpeta en el servidor.
 */
async function moverSampleEnServidor(
    sampleId: number,
    carpetaPrimaria: string,
    carpetaSecundaria: string,
): Promise<boolean> {
    if (!estaOnline()) {
        /* Encolar operacion para ejecutar al reconectar. Deduplicar por sampleId. */
        encolarOperacion({
            tipo: 'mover_carpeta',
            endpoint: `${obtenerBaseUrlSync()}/kamples/v1/me/coleccionados/${sampleId}/carpeta`,
            method: 'PUT',
            body: { carpeta_primaria: carpetaPrimaria, carpeta_secundaria: carpetaSecundaria },
            claveDuplicacion: `mover_carpeta_${sampleId}`,
        });
        console.info('[Sync] Move encolado para cuando haya conexion, sample:', sampleId);
        return true;
    }

    try {
        const baseUrl = obtenerBaseUrlSync();
        const resp = await fetch(`${baseUrl}/kamples/v1/me/coleccionados/${sampleId}/carpeta`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                carpeta_primaria: carpetaPrimaria,
                carpeta_secundaria: carpetaSecundaria,
            }),
        });

        if (!resp.ok) {
            const body = await resp.json().catch(() => ({}));
            console.error('[Sync] Error moviendo sample en servidor:', sampleId, body);
            return false;
        }

        console.info('[Sync] Sample movido en servidor:', sampleId, '→', carpetaPrimaria, carpetaSecundaria || '(raíz)');
        return true;
    } catch (err) {
        console.error('[Sync] Error en request de mover sample:', sampleId, err);
        return false;
    }
}

/*
 * Versión pública de moverSampleEnServidor.
 * Usada por uploadQueueService para asignar carpeta tras subir un archivo.
 */
export async function moverSampleEnServidorPublico(
    sampleId: number,
    carpetaPrimaria: string,
    carpetaSecundaria: string,
): Promise<boolean> {
    return moverSampleEnServidor(sampleId, carpetaPrimaria, carpetaSecundaria);
}

/*
 * Maneja un MOVE local (archivo movido de una carpeta a otra dentro de sync).
 * 1. Actualiza la ruta en el índice local + tracking v2
 * 2. Calcula nuevas carpeta_primaria/secundaria desde la ruta
 * 3. Llama PUT /me/coleccionados/{id}/carpeta para sincronizar con el server
 */
async function manejarMoveLocal(
    rutaAnterior: string,
    rutaNueva: string,
    nombreArchivo: string,
    carpetas: string[],
): Promise<void> {
    const { trackingModule, indiceArchivos } = estado;
    const rutaAntNorm = rutaAnterior.replace(/\\/g, '/');
    const archivo = buscarEnIndicePorRuta(rutaAntNorm);

    if (!archivo) {
        /*
         * Fallback a tracking v2: si el archivo existe en v2 pero no en v1
         * (puede pasar tras migración parcial o crash antes de persistir v1),
         * procesar el move directamente en v2 para no perderlo.
         */
        if (trackingModule) {
            const archivoV2 = trackingModule.buscarArchivoPorRuta(rutaAnterior);
            if (archivoV2) {
                archivoV2.rutaLocal = rutaNueva;
                if (archivoV2.syncDeshabilitado) archivoV2.syncDeshabilitado = false;
                await trackingModule.registrarArchivo(archivoV2);
                await trackingModule.registrarAccion({
                    tipo: 'movido',
                    descripcion: `Movido a ${carpetas[0] || 'General'}${carpetas[1] ? '/' + carpetas[1] : ''}`,
                    sampleId: archivoV2.sampleId,
                });

                const primaria = carpetas[0] || 'General';
                const secundaria = carpetas[1] || '';

                /* C384: Asegurar colección destino existe (idempotente) */
                if (primaria && primaria !== 'General' && estado.collectionModule) {
                    try {
                        await estado.collectionModule.crearColeccionDesdeLocal(primaria);
                    } catch (err) {
                        console.error('[Sync] Error asegurando colección destino en move v2:', primaria, err);
                    }
                }

                await moverSampleEnServidor(archivoV2.sampleId, primaria, secundaria);
                /* Actualizar coleccion_samples en servidor + coleccionId en tracking */
                await actualizarColeccionEnMovimiento(archivoV2.sampleId, carpetas, archivoV2);
                console.info('[Sync] Move procesado (solo v2): sample', archivoV2.sampleId, '→', primaria, secundaria || '(raíz)');
                return;
            }
        }

        console.warn('[Sync] Move sin tracking previo; se trata como archivo nuevo para upload:', rutaNueva);

        const carpetaDestino = (carpetas[0] ?? '').trim();
        if (carpetaDestino && !CARPETAS_SISTEMA_SYNC.has(carpetaDestino.toLowerCase())) {
            estado.collectionModule?.crearColeccionDesdeLocal(carpetaDestino).catch(err => {
                console.error('[Sync] Error creando colección destino desde move no trackeado:', err);
            });
        }

        try {
            const { encolarArchivo } = await import('./uploadQueueService');
            await encolarArchivo(rutaNueva, nombreArchivo, carpetas);
        } catch (err) {
            console.error('[Sync] Error encolando move no trackeado como upload:', err);
        }
        return;
    }

    archivo.ruta = rutaNueva;
    if (archivo.syncDeshabilitado) {
        archivo.syncDeshabilitado = false;
        archivo.rutaEliminada = undefined;
    }
    actualizarIndiceArchivo(archivo, rutaAntNorm);
    guardarIndice();

    /* v2: actualizar tracking si existe */
    let archivoTrackingRef: { sampleId: number; coleccionId: number | null; rutaLocal: string; nombreLocal: string; nombreServidor: string; descargadoEn: number; tamano: number; syncDeshabilitado: boolean } | null = null;
    if (trackingModule) {
        const archivoTracking = trackingModule.buscarArchivoPorSampleId(archivo.sampleId);
        if (archivoTracking) {
            archivoTracking.rutaLocal = rutaNueva;
            if (archivoTracking.syncDeshabilitado) archivoTracking.syncDeshabilitado = false;
            await trackingModule.registrarArchivo(archivoTracking);
            await trackingModule.registrarAccion({
                tipo: 'movido',
                descripcion: `Movido a ${carpetas[0] || 'General'}${carpetas[1] ? '/' + carpetas[1] : ''}`,
                sampleId: archivo.sampleId,
            });
            archivoTrackingRef = archivoTracking;
        }
    }

    const primaria = carpetas[0] || 'General';
    const secundaria = carpetas[1] || '';

    /*
     * C384: Asegurar que la colección destino existe antes de mover.
     * Si el usuario mueve un archivo a una carpeta nueva que no tiene colección
     * en el servidor, crearla ahora. crearColeccionDesdeLocal es idempotente.
     */
    if (primaria && primaria !== 'General' && estado.collectionModule) {
        try {
            await estado.collectionModule.crearColeccionDesdeLocal(primaria);
        } catch (err) {
            console.error('[Sync] Error asegurando colección destino en move:', primaria, err);
        }
    }

    await moverSampleEnServidor(archivo.sampleId, primaria, secundaria);
    /* Actualizar coleccion_samples en servidor + coleccionId en tracking */
    await actualizarColeccionEnMovimiento(archivo.sampleId, carpetas, archivoTrackingRef);

    console.info('[Sync] Move procesado: sample', archivo.sampleId, '→', primaria, secundaria || '(raíz)');
}

/* Polling de estructura de carpetas */

/*
 * F2.2: Polling adaptivo — Ajusta intervalo según actividad.
 * - Con cambios recientes: 15s (feedback rápido)
 * - Normal: 60s (default)
 * - Sin cambios por mucho tiempo: gradualmente hasta 5min
 */
const POLLING_MIN_MS = 15_000;
const POLLING_MAX_MS = 300_000;

let pollingTimeout: ReturnType<typeof setTimeout> | null = null;

function ajustarIntervaloPolling(huboCambios: boolean): void {
    if (huboCambios) {
        estado.intervaloPollingMs = POLLING_MIN_MS;
    } else {
        estado.intervaloPollingMs = Math.min(
            Math.round(estado.intervaloPollingMs * 1.5),
            POLLING_MAX_MS,
        );
    }
}

function programarProximoPolling(): void {
    if (pollingTimeout) clearTimeout(pollingTimeout);
    pollingTimeout = setTimeout(async () => {
        try {
            const resultado = await sincronizarEstructuraCarpetas();
            ajustarIntervaloPolling(resultado);
        } catch {
            /* Error ya logueado en sincronizarEstructuraCarpetas */
        }
        programarProximoPolling();
    }, estado.intervaloPollingMs);
}

/*
 * F2.1: Consulta delta sync al servidor.
 * Retorna true si hay cambios pendientes (el caller debe ejecutar full sync).
 * Retorna false si no hay cambios (no hace falta full sync → ahorra ancho de banda).
 * En caso de error, retorna true para forzar full sync como fallback seguro.
 */
async function consultarDeltaSync(): Promise<boolean> {
    const baseUrl = obtenerBaseUrlSync();
    const cursor = estado.ultimoCursorDelta;

    try {
        const resp = await fetch(
            `${baseUrl}/kamples/v1/me/sync/delta?cursor=${cursor}`,
            { headers: obtenerHeadersSyncGet() },
        );

        if (!resp.ok) {
            const cat = clasificarError(resp.status);
            logSync.warn('syncWatcher', 'Delta endpoint respondió con error', { status: resp.status, categoria: cat });
            /* En error de autenticación, no forzar full sync (no tiene sentido) */
            return cat !== 'autenticacion';
        }

        const json = await resp.json() as {
            data: {
                cambios: Array<{ id: number; tipo: string; entidadId: number; metadata: Record<string, unknown> }>;
                cursor: number;
                hayMas: boolean;
                fullSyncRequired: boolean;
            };
        };

        const { cambios, cursor: nuevoCursor, hayMas, fullSyncRequired } = json.data;

        /* Actualizar cursor siempre que recibimos uno válido */
        if (nuevoCursor > 0) {
            estado.ultimoCursorDelta = nuevoCursor;
            guardarCursorDelta().catch(() => {});
        }

        /* Primera sync o cursor purgado: necesita full sync */
        if (fullSyncRequired) {
            logSync.info('syncWatcher', 'Delta indica full sync requerido', { cursor, nuevoCursor });
            return true;
        }

        /* Hay cambios concretos: necesita full sync para aplicarlos */
        if (cambios.length > 0 || hayMas) {
            logSync.info('syncWatcher', 'Delta detectó cambios pendientes', {
                cambios: cambios.length,
                hayMas,
                tipos: [...new Set(cambios.map(c => c.tipo))],
            });
            return true;
        }

        /* Sin cambios: no hace falta full sync */
        logSync.debug('syncWatcher', 'Delta sin cambios, omitiendo full sync');
        return false;
    } catch (err) {
        if (esErrorDeRed(err)) {
            logSync.warn('syncWatcher', 'Error de red consultando delta, omitiendo ciclo');
            return false;
        }
        logSync.error('syncWatcher', 'Error consultando delta sync', { error: err instanceof Error ? err.message : String(err) });
        /* En error desconocido, forzar full sync como fallback seguro */
        return true;
    }
}

/*
 * C289b: Reconciliación periódica de descargas.
 * Cada RECONCILIACION_DESCARGAS_MS (5 min), forzar full sync con descargas
 * aunque delta diga "sin cambios". Resuelve:
 * - Samples que existían en el servidor antes de activar sync
 * - Descargas que fallaron y nunca se reintentaron
 * - Cualquier divergencia servidor→local silenciosa
 */
const RECONCILIACION_DESCARGAS_MS = 5 * 60 * 1000;
let ultimaSyncConDescargas = 0;

/*
 * Sincroniza la estructura de carpetas del servidor a disco local.
 * F2.1: Consulta delta primero para evitar full sync innecesarios.
 * C289: Sync completo (con descargas) cuando delta detecta cambios.
 * C289b: Bypass periódico del delta para reconciliar descargas faltantes.
 * v1: crea carpetas basadas en metadata IA.
 * Retorna true si hubo cambios para ajustar el intervalo de polling.
 */
async function sincronizarEstructuraCarpetas(): Promise<boolean> {
    const { config, collectionModule } = estado;
    if (!config.carpetaLocal || !estaOnline()) return false;

    /* No ejecutar polling si hay una sync completa en curso (evita race conditions) */
    if (esSyncEnCurso()) return false;

    /* F2.1: Consultar delta antes de ejecutar full sync.
     * Si el cursor ya está inicializado (>0), usamos delta para ahorrar ancho de banda.
     * Si cursor=0 (primera vez), el delta retornará fullSyncRequired=true. */
    let necesitaSync = await consultarDeltaSync();

    /*
     * C289b: Bypass periódico — si no hay cambios delta pero ha pasado suficiente
     * tiempo desde la última sync completa con descargas, forzar full sync.
     * Esto garantiza que samples pre-existentes o con descarga fallida se reintenten.
     * descargarSiNecesario() es idempotente: si el sample ya existe en tracking,
     * retorna 'existente' sin re-descargar.
     */
    const tiempoSinReconciliacion = Date.now() - ultimaSyncConDescargas;
    if (!necesitaSync && tiempoSinReconciliacion > RECONCILIACION_DESCARGAS_MS) {
        logSync.info('syncWatcher', `Reconciliación de descargas: ${Math.round(tiempoSinReconciliacion / 1000)}s sin sync completa, forzando`);
        necesitaSync = true;
    }

    if (!necesitaSync) return false;

    if (collectionModule) {
        try {
            /*
             * QL106: Si borrarAlSubirExitoso está activo, forzar soloEstructura=true
             * para mantener tracking de carpetas pero NO descargar archivos.
             * Sin este guard, el polling periódico descarga samples que el usuario
             * quiere mantener solo en servidor (el orquestador tiene su propio guard,
             * pero esta ruta bypasea el orquestador).
             */
            const soloEstructura = estado.configAvanzada.borrarAlSubirExitoso;
            if (soloEstructura) {
                logSync.debug('syncWatcher', 'Descargas omitidas en polling: borrarAlSubirExitoso activo');
            }
            const resultado = await collectionModule.sincronizarColecciones(config.carpetaLocal, undefined, soloEstructura);
            /* C289b: Actualizar timestamp de última sync completa con descargas */
            ultimaSyncConDescargas = Date.now();
            /* Hubo cambios si se descargaron nuevos archivos o se crearon carpetas */
            return resultado.nuevos > 0;
        } catch (err) {
            logSync.error('syncWatcher', 'Error en polling de colecciones v2', { error: err instanceof Error ? err.message : String(err) });
        }
        return false;
    }

    /* v1 fallback */
    await sincronizarEstructuraCarpetasV1();
    return false;
}

/* Borrado local → papelera + borrado en servidor si configurado */

/*
 * Maneja la eliminacion de un archivo local detectada por el watcher.
 * 1. Si la papelera esta activa, el archivo ya fue movido por el OS (watcher detecta remove).
 *    Registrar en tracking como no_sincronizar.
 * 2. Si borrado bidireccional (local→servidor) esta activo, llamar soft-delete en servidor.
 * 3. Rate-limit: maximo 50 borrados en servidor por ciclo de sync.
 */
const LIMITE_BORRADOS_POR_CICLO = 50;
let borradosEnCiclo = 0;
let ultimoResetBorrados = Date.now();
/* QL63: Cola de reintentos para soft-deletes que superan el rate limit */
const colaBorradosPendientes: number[] = [];

async function manejarBorradoLocal(ruta: string): Promise<void> {
    /*
     * Defensa: si esta ruta fue marcada como movimiento interno
     * (ej: rename de moverArchivoASinColeccion), ignorar el DELETE.
     * Sin esto, un fallo en la actualización de tracking podría causar
     * soft-delete del sample recién subido cuando borrarEnServidorAlBorrarLocal está activo.
     */
    if (esMovimientoInterno(ruta)) {
        console.info('[Sync] Ignorando DELETE de ruta movida internamente:', ruta);
        return;
    }

    /* Marcar como no sincronizar (comportamiento base) */
    await marcarNoSincronizar(ruta);

    /* Verificar si borrado bidireccional local→servidor esta activo */
    if (!estado.configAvanzada.borrarEnServidorAlBorrarLocal) return;

    /* Rate-limit: resetear contador cada 5 minutos y drenar cola pendiente */
    const ahora = Date.now();
    if (ahora - ultimoResetBorrados > 5 * 60 * 1000) {
        borradosEnCiclo = 0;
        ultimoResetBorrados = ahora;
        /* QL63: Drenar cola de borrados pendientes del ciclo anterior */
        while (colaBorradosPendientes.length > 0 && borradosEnCiclo < LIMITE_BORRADOS_POR_CICLO) {
            const pendienteId = colaBorradosPendientes.shift()!;
            await softDeleteEnServidor(pendienteId);
            borradosEnCiclo++;
        }
    }

    if (borradosEnCiclo >= LIMITE_BORRADOS_POR_CICLO) {
        /* QL63: Encolar para siguiente ciclo en vez de ignorar silenciosamente */
        const rutaNorm = ruta.replace(/\\/g, '/');
        const archivo = buscarEnIndicePorRuta(rutaNorm);
        const sid = archivo?.sampleId ?? estado.trackingModule?.buscarArchivoPorRuta(ruta)?.sampleId;
        if (sid) {
            colaBorradosPendientes.push(sid);
            console.warn(`[Sync] Limite borrados alcanzado (${LIMITE_BORRADOS_POR_CICLO}/ciclo). Encolado para siguiente ciclo:`, sid);
        }
        return;
    }

    /* Buscar sampleId en indice */
    const rutaNorm = ruta.replace(/\\/g, '/');
    const archivo = buscarEnIndicePorRuta(rutaNorm);
    const sampleId = archivo?.sampleId;

    if (!sampleId) {
        /* Intentar buscar en tracking v2 */
        const archivoV2 = estado.trackingModule?.buscarArchivoPorRuta(ruta);
        if (!archivoV2) return;
        await softDeleteEnServidor(archivoV2.sampleId);
        borradosEnCiclo++;
        return;
    }

    await softDeleteEnServidor(sampleId);
    borradosEnCiclo++;
}

/*
 * Soft-delete de un sample en el servidor.
 * Marca como eliminado sin borrar permanentemente (el servidor puede tener su propia papelera).
 */
async function softDeleteEnServidor(sampleId: number): Promise<boolean> {
    if (!estaOnline()) {
        encolarOperacion({
            tipo: 'soft_delete',
            endpoint: `${obtenerBaseUrlSync()}/kamples/v1/samples/${sampleId}`,
            method: 'DELETE',
            body: { soft: true },
            claveDuplicacion: `soft_delete_${sampleId}`,
        });
        return true;
    }

    try {
        const baseUrl = obtenerBaseUrlSync();
        const resp = await fetch(`${baseUrl}/kamples/v1/samples/${sampleId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ soft: true }),
        });

        if (!resp.ok) {
            console.error('[Sync] Error en soft-delete servidor:', sampleId, resp.status);
            return false;
        }

        console.info('[Sync] Sample eliminado en servidor (soft-delete):', sampleId);
        return true;
    } catch (err) {
        console.error('[Sync] Error en soft-delete:', sampleId, err);
        return false;
    }
}

/* Inicialización del watcher bidireccional */

/*
 * Inicializa el sistema de sync bidireccional:
 * 1. Conecta fileWatcherService para detectar archivos nuevos/eliminados
 * 2. Inicializa uploadQueueService para subida automática
 * 3. Inicia observación de la carpeta de sync
 * 4. Inicia polling periódico de carpetas del servidor
 */
export async function inicializarSyncBidireccional(): Promise<void> {
    const { config, trackingModule, collectionModule } = estado;
    if (!config.carpetaLocal || !config.sincronizacionActiva) {
        logSync.warn('syncWatcher', 'inicializarSyncBidireccional ABORTADO — config incompleta', {
            carpetaLocal: config.carpetaLocal ?? '(null)',
            sincronizacionActiva: config.sincronizacionActiva,
            razon: !config.carpetaLocal
                ? 'No hay carpeta de sync configurada. Ve a Configuracion > Sync para seleccionar una carpeta.'
                : 'Sincronizacion desactivada en la configuracion.',
        });
        return;
    }

    try {
        const { registrarCallbacks, registrarCallbacksCarpeta, registrarCallbacksSubcarpeta, iniciarObservacion } = await import('./fileWatcherService');
        const { inicializarUploadQueue, encolarArchivo } = await import('./uploadQueueService');

        /* Inicializar papelera y purgar expirados */
        await inicializarPapelera();
        await purgarExpirados();

        registrarCallbacks(
            /* Archivo nuevo */
            (ruta: string, nombreArchivo: string, carpetas: string[]) => {
                const rutaNorm = ruta.replace(/\\/g, '/');

                if (esDescargaEnCurso(rutaNorm)) {
                    console.info('[Sync] Ignorando create propio (descarga en curso):', nombreArchivo);
                    return;
                }

                /*
                 * P4: Normalizar nombre para dedup.
                 * Si el archivo pasó por papelera, su nombre tiene prefijo timestamp
                 * que rompe búsquedas por nombre en tracking e índice.
                 */
                if (trackingModule) {
                    const enTrackingPorRuta = trackingModule.buscarArchivoPorRuta(rutaNorm);
                    if (enTrackingPorRuta) {
                        if (enTrackingPorRuta.syncDeshabilitado) {
                            /* Archivo re-añadido en la misma ruta tras borrado local. */
                            console.info('[Sync] Archivo re-anadido tras borrado local (misma ruta), re-encolando:', nombreArchivo);
                            trackingModule.eliminarArchivo(enTrackingPorRuta.sampleId, enTrackingPorRuta.coleccionId)
                                .then(() => encolarArchivo(ruta, nombreArchivo, carpetas))
                                .catch(err => console.error('[Sync] Error limpiando tracking para re-encolar:', nombreArchivo, err));
                        } else {
                            console.info('[Sync] Archivo ya en tracking v2 (misma ruta), ignorando:', nombreArchivo);
                        }
                        return;
                    }
                }

                const porRuta = buscarEnIndicePorRuta(rutaNorm);
                if (porRuta) {
                    /*
                     * QL130: Si tracking v2 no tiene este archivo (ya se verifico arriba y no retorno),
                     * la entrada del indice legacy es obsoleta (ej: samples eliminados del servidor).
                     * Limpiar la entrada stale y permitir re-upload.
                     */
                    console.warn('[Sync] Entrada stale en indice legacy (tracking v2 no la tiene), limpiando:', nombreArchivo);
                    const idx = estado.indiceArchivos.indexOf(porRuta);
                    if (idx >= 0) estado.indiceArchivos.splice(idx, 1);
                    estado.indiceArchivosPorRuta.delete(rutaNorm);
                    if (porRuta.nombreServidor) estado.indiceArchivosPorNombre.delete(porRuta.nombreServidor);
                    if (porRuta.nombreOriginal && porRuta.nombreOriginal !== porRuta.nombreServidor) {
                        estado.indiceArchivosPorNombre.delete(porRuta.nombreOriginal);
                    }
                    guardarIndice();
                    /* No return — continuar al enqueue */
                }

                /*
                 * No bloquear por nombre:
                 * nombres iguales pueden representar archivos distintos.
                 * El dedup real vive en uploadQueue (hash + idempotency key).
                 */

                encolarArchivo(ruta, nombreArchivo, carpetas);
            },
            /* Archivo eliminado — papelera + borrado bidireccional */
            (ruta: string) => {
                manejarBorradoLocal(ruta);
            },
            /* Archivo movido */
            (rutaAnterior: string, rutaNueva: string, nombreArchivo: string, carpetas: string[]) => {
                manejarMoveLocal(rutaAnterior, rutaNueva, nombreArchivo, carpetas);
            },
        );

        /* C357: Callbacks de carpetas para sincronizar colecciones */
        if (collectionModule) {
            const colMod = collectionModule;
            registrarCallbacksCarpeta(
                (nombre: string, _rutaCompleta: string) => {
                    /* Excluir carpetas del sistema que NO son colecciones reales */
                    if (CARPETAS_SISTEMA_SYNC.has(nombre.toLowerCase())) {
                        console.info('[Sync] Carpeta de sistema ignorada (no es colección):', nombre);
                        return;
                    }
                    /*
                     * Antes de crear una colección nueva, verificar si hay una colección
                     * huérfana (su carpeta ya no existe en disco). Esto ocurre cuando el
                     * watcher emite CREATE en vez de RENAME: la carpeta vieja desapareció
                     * y apareció la nueva, pero no se detectó como rename.
                     */
                    (async () => {
                        try {
                            /*
                             * C287: Si la colección ya existe en tracking, omitir.
                             * Sin esto, cada evento sobre el interior de la carpeta
                             * (crear archivos, subcarpetas) re-dispara este callback
                             * y buscarColeccionHuerfana encuentra colecciones de otro
                             * usuario → 403 en cascada.
                             */
                            if (trackingModule) {
                                const existente = trackingModule.buscarColeccionPorCarpeta(nombre);
                                if (existente) {
                                    console.info('[Sync] Carpeta ya vinculada en tracking, omitiendo:', nombre, '→ id:', existente.id);
                                    return;
                                }
                            }

                            /*
                             * QL121: Cuando borrarAlSubirExitoso esta activo, las carpetas
                             * se vacian tras subir y pueden desaparecer del disco.
                             * buscarColeccionHuerfana detectaria esas carpetas vacias/borradas
                             * como "huerfanas" y las renombraria a la carpeta nueva, causando
                             * merge destructivo de colecciones. PROHIBIDO usar deteccion de
                             * huerfanas en modo borrar-tras-subida: siempre crear nueva.
                             */
                            if (!estado.configAvanzada.borrarAlSubirExitoso) {
                                const huerfana = await colMod.buscarColeccionHuerfana(nombre);
                                if (huerfana) {
                                    console.info('[Sync] Carpeta nueva detectada como posible rename (huérfana encontrada):', huerfana.id, huerfana.nombre, '→', nombre);
                                    const exito = await colMod.renombrarColeccionEnServidor(huerfana.id, nombre);
                                    if (!exito && trackingModule) {
                                        /*
                                         * Si la colección aún existe en tracking (fallo por red/conflict),
                                         * actualizar nombre local como fallback optimista.
                                         * Si ya no existe (403 → desvinculada), crear una nueva.
                                         */
                                        const aunExiste = trackingModule.obtenerColeccion(huerfana.id);
                                        if (aunExiste) {
                                            await trackingModule.actualizarNombreColeccion(huerfana.id, nombre, nombre);
                                        } else {
                                            console.info('[Sync] Colección huérfana desvinculada (403), creando nueva para:', nombre);
                                            await colMod.crearColeccionDesdeLocal(nombre);
                                        }
                                    }
                                    return;
                                }
                            }
                            console.info('[Sync] Carpeta nueva detectada → crear colección:', nombre);
                            await colMod.crearColeccionDesdeLocal(nombre);
                        } catch (err) {
                            console.error('[Sync] Error en callback carpeta nueva:', err);
                        }
                    })();
                },
                (nombreAnterior: string, nombreNuevo: string, _rutaNueva: string) => {
                    if (!trackingModule) return;
                    /* Excluir carpetas del sistema que NO son colecciones reales */
                    if (CARPETAS_SISTEMA_SYNC.has(nombreNuevo.toLowerCase())) {
                        console.info('[Sync] Rename a carpeta de sistema ignorado:', nombreNuevo);
                        return;
                    }
                    const coleccion = trackingModule.buscarColeccionPorCarpeta(nombreAnterior);
                    if (coleccion) {
                        console.info('[Sync] Carpeta renombrada → renombrar colección:', coleccion.id, nombreAnterior, '→', nombreNuevo);
                        colMod.renombrarColeccionEnServidor(coleccion.id, nombreNuevo)
                            .then(exito => {
                                if (!exito) {
                                    trackingModule.actualizarNombreColeccion(coleccion.id, nombreNuevo, nombreNuevo).catch(err => {
                                        console.error('[Sync] Error actualizando nombre local de colección:', err);
                                    });
                                }
                            })
                            .catch(err => {
                                console.error('[Sync] Error renombrando colección:', err);
                            });
                    } else {
                        /*
                         * Fallback robusto: la colección no se encontró por el nombre anterior.
                         * Buscar en orden: en-vuelo → huérfana (carpeta desaparecida) → servidor → crear nueva.
                         * La detección de huérfana es el caso más probable: la carpeta ya fue renombrada
                         * en disco pero tracking aún tiene el nombre viejo.
                         */
                        console.info('[Sync] Carpeta renombrada sin colección local → verificando en-vuelo/huérfana/servidor:', nombreAnterior, '→', nombreNuevo);
                        (async () => {
                            try {
                                /* 1. Creación en vuelo del nombre viejo */
                                const idEnVuelo = await colMod.esperarCreacionEnVuelo(nombreAnterior);
                                if (idEnVuelo) {
                                    console.info('[Sync] Creación en-vuelo completada, renombrando:', idEnVuelo, '→', nombreNuevo);
                                    const exito = await colMod.renombrarColeccionEnServidor(idEnVuelo, nombreNuevo);
                                    if (!exito && trackingModule) {
                                        await trackingModule.actualizarNombreColeccion(idEnVuelo, nombreNuevo, nombreNuevo);
                                    }
                                    return;
                                }

                                /* 2. Colección huérfana: buscar en tracking alguna cuya carpeta ya NO existe en disco.
                                 * Esto detecta el caso donde buscarColeccionPorCarpeta falla por
                                 * diferencia de nombre (sanitización, case, etc.) pero la carpeta
                                 * fue efectivamente renombrada → la vieja ya no existe.
                                 * QL121: Desactivado con borrarAlSubirExitoso — carpetas vacias/borradas
                                 * son normales, no renames. */
                                if (!estado.configAvanzada.borrarAlSubirExitoso) {
                                    const huerfana = await colMod.buscarColeccionHuerfana(nombreNuevo);
                                    if (huerfana) {
                                        console.info('[Sync] Colección huérfana detectada como rename:', huerfana.id, huerfana.nombre, '→', nombreNuevo);
                                        const exito = await colMod.renombrarColeccionEnServidor(huerfana.id, nombreNuevo);
                                        if (!exito && trackingModule) {
                                            await trackingModule.actualizarNombreColeccion(huerfana.id, nombreNuevo, nombreNuevo);
                                        }
                                        return;
                                    }
                                }

                                /* 3. Buscar en servidor por nombre anterior */
                                const idServidor = await colMod.buscarColeccionServidorPorNombrePublico(nombreAnterior);
                                if (idServidor) {
                                    console.info('[Sync] Colección encontrada en servidor por nombre anterior, renombrando:', idServidor, '→', nombreNuevo);
                                    const exito = await colMod.renombrarColeccionEnServidor(idServidor, nombreNuevo);
                                    if (!exito && trackingModule) {
                                        await trackingModule.actualizarNombreColeccion(idServidor, nombreNuevo, nombreNuevo);
                                    }
                                } else {
                                    console.info('[Sync] Colección no existe en ningún registro → crear nueva:', nombreNuevo);
                                    await colMod.crearColeccionDesdeLocal(nombreNuevo);
                                }
                            } catch (err) {
                                console.error('[Sync] Error en fallback rename de colección:', err);
                            }
                        })();
                    }
                },
            );

            /*
             * C387: Callbacks de subcarpetas para sincronizar subcolecciones.
             * Se disparan cuando se crea o renombra una carpeta de nivel 2
             * (dentro de una colección existente).
             */
            registrarCallbacksSubcarpeta(
                (nombreSub: string, carpetaPadre: string, rutaCompleta: string) => {
                    if (CARPETAS_SISTEMA_SYNC.has(nombreSub.toLowerCase())) return;
                    if (!trackingModule) {
                        console.warn('[Sync] Subcarpeta nueva ignorada (sin tracking):', nombreSub);
                        return;
                    }

                    /*
                     * C3: Carpeta creada dentro de "Sin colección" → mover fuera como colección.
                     * crearColeccionDesdeLocal es idempotente, así que si el watcher re-dispara
                     * al detectar la carpeta nueva en root, no crea duplicados.
                     */
                    if (CARPETAS_SISTEMA_SYNC.has(carpetaPadre.toLowerCase())) {
                        (async () => {
                            try {
                                const { rename, exists } = await import('@tauri-apps/plugin-fs');
                                const { join, dirname } = await import('@tauri-apps/api/path');

                                const dirPadre = await dirname(rutaCompleta);
                                const rootSync = await dirname(dirPadre);
                                const nuevaRuta = await join(rootSync, nombreSub);

                                if (await exists(nuevaRuta)) {
                                    console.warn('[Sync] Destino ya existe, no se puede mover fuera de Sin colección:', nuevaRuta);
                                    return;
                                }

                                await rename(rutaCompleta, nuevaRuta);
                                console.info('[Sync] C3: Carpeta movida fuera de Sin colección:', nombreSub);
                                await colMod.crearColeccionDesdeLocal(nombreSub);
                            } catch (err) {
                                console.error('[Sync] Error moviendo carpeta fuera de Sin colección:', err);
                            }
                        })();
                        return;
                    }

                    const padre = trackingModule.buscarColeccionPorCarpeta(carpetaPadre);
                    if (!padre) {
                        console.warn('[Sync] Subcarpeta nueva ignorada (padre no encontrado):', carpetaPadre, '/', nombreSub);
                        return;
                    }

                    /* QL103: Guard — omitir si la subcolección ya existe en tracking */
                    const subExistente = trackingModule.buscarSubcoleccion(carpetaPadre, nombreSub);
                    if (subExistente) {
                        console.info('[Sync] Subcarpeta ya vinculada en tracking, omitiendo:', carpetaPadre, '/', nombreSub, '→ id:', subExistente.id);
                        return;
                    }

                    console.info('[Sync] Subcarpeta nueva → crear subcolección:', nombreSub, 'en', carpetaPadre, '(padreId:', padre.id, ')');
                    colMod.crearColeccionDesdeLocal(nombreSub, padre.id).catch(err => {
                        console.error('[Sync] Error creando subcolección desde subcarpeta local:', err);
                    });
                },
                (nombreAnterior: string, nombreNuevo: string, carpetaPadre: string, _rutaNueva: string) => {
                    if (!trackingModule) return;
                    if (CARPETAS_SISTEMA_SYNC.has(nombreNuevo.toLowerCase())) return;

                    const sub = trackingModule.buscarSubcoleccion(carpetaPadre, nombreAnterior);
                    if (sub) {
                        console.info('[Sync] Subcarpeta renombrada → renombrar subcolección:', sub.id, nombreAnterior, '→', nombreNuevo);
                        colMod.renombrarColeccionEnServidor(sub.id, nombreNuevo)
                            .then(exito => {
                                if (!exito && trackingModule) {
                                    trackingModule.actualizarNombreColeccion(sub.id, nombreNuevo, nombreNuevo).catch(err => {
                                        console.error('[Sync] Error actualizando nombre local de subcolección:', err);
                                    });
                                }
                            })
                            .catch(err => {
                                console.error('[Sync] Error renombrando subcolección:', err);
                            });
                    } else {
                        /* Padre podría no estar en tracking aún — crear la subcolección como nueva */
                        const padre = trackingModule.buscarColeccionPorCarpeta(carpetaPadre);
                        if (padre) {
                            console.info('[Sync] Subcarpeta renombrada sin sub local → crear nueva:', nombreNuevo, 'en padreId:', padre.id);
                            colMod.crearColeccionDesdeLocal(nombreNuevo, padre.id).catch(err => {
                                console.error('[Sync] Error creando subcolección tras rename:', err);
                            });
                        } else {
                            console.warn('[Sync] Subcarpeta renombrada ignorada (padre y sub no encontrados):', carpetaPadre, '/', nombreAnterior);
                        }
                    }
                },
            );
        }

        await inicializarUploadQueue();

        /* QL78: Limpieza retroactiva de archivos subidos que quedaron en disco.
         * Se ejecuta tras inicializar la cola (donde se restauran hashARutas). */
        try {
            const { limpiarArchivosSubidosEnDisco } = await import('./uploadQueueService');
            limpiarArchivosSubidosEnDisco().catch(() => {});
        } catch { /* plugin-fs no disponible */ }

        const iniciado = await iniciarObservacion();
        if (iniciado) {
            console.info('[Sync] Sync bidireccional activado');
        }

        await sincronizarEstructuraCarpetas();

        /*
         * Escaneo inicial: detectar archivos locales preexistentes que el watcher
         * no puede ver (no emite eventos para archivos ya presentes al iniciar).
         * Se lanza async para no bloquear el arranque.
         */
        escanearCarpetaYEncolar().catch(err => {
            console.error('[Sync] Error en escaneo inicial de carpeta local:', err);
        });

        /*
         * Listener para escaneo bajo demanda desde el sync panel.
         * "Sincronizar ahora" emite este evento para detectar archivos nuevos.
         */
        try {
            const { listen: listenTauri } = await import('@tauri-apps/api/event');
            await listenTauri('escanear-subidas-local', () => {
                escanearCarpetaYEncolar().catch(err => {
                    console.error('[Sync] Error en escaneo local bajo demanda:', err);
                });
            });
        } catch {
            /* Entorno sin Tauri — ignorar */
        }

        /* F2.2: Usar polling adaptivo en vez de intervalo fijo */
        programarProximoPolling();

        /* F3.2: Reconciliación periódica de integridad.
         * Cada 7 días, verificar que disco y tracking estén sincronizados.
         * Detecta divergencias silenciosas (archivos borrados externamente, etc.) */
        const RECONCILIACION_INTERVALO_MS = 7 * 24 * 60 * 60 * 1000;
        setInterval(() => {
            ejecutarReconciliacion().catch(err => {
                logSync.warn('syncWatcher', 'Error en reconciliación periódica', {
                    error: err instanceof Error ? err.message : String(err),
                });
            });
        }, RECONCILIACION_INTERVALO_MS);

        /*
         * C288: Reconciliación periódica de estructura de carpetas para detectar renames.
         * El debounced watcher no emite rename events fiables en Windows+OneDrive.
         * Este timer escanea carpetas cada 15s y detecta renames por comparación.
         */
        reconciliacionCarpetasInterval = setInterval(() => {
            reconciliarEstructuraCarpetas().catch(err => {
                logSync.warn('syncWatcher', 'Error en reconciliación de carpetas', {
                    error: err instanceof Error ? err.message : String(err),
                });
            });
        }, RECONCILIACION_CARPETAS_MS);

        /* QL91: Analisis periodico de archivos huerfanos (cada 30min).
         * Detecta archivos no subidos, no borrados, o en error permanente. */
        try {
            const { iniciarAnalisisPeriodicoHuerfanos, analizarArchivosHuerfanos } = await import('./syncOrphanAnalysis');
            iniciarAnalisisPeriodicoHuerfanos();
            /* Ejecutar un analisis inicial tras 60s para no competir con el escaneo de arranque */
            setTimeout(() => {
                analizarArchivosHuerfanos().catch(() => {});
            }, 60_000);
        } catch { /* Modulo no disponible */ }

    } catch (err) {
        logSync.error('syncWatcher', 'Error inicializando sync bidireccional', { error: err instanceof Error ? err.message : String(err) });
    }
}

/*
 * F3.2: Reconciliación — compara disco vs tracking para detectar divergencias.
 * Exportado para que el panel de sync pueda ejecutarla bajo demanda.
 */
export async function ejecutarReconciliacion(): Promise<void> {
    const { config, trackingModule } = estado;
    if (!config.carpetaLocal || !trackingModule) return;

    const { detectarDivergencias } = await import('./syncReconciliacion');

    const todosArchivos = trackingModule.todosLosArchivos();
    const archivosParaReconciliar = Object.values(todosArchivos).map(a => ({
        ruta: a.rutaLocal,
        sampleId: a.sampleId,
        tamano: a.tamano,
        coleccionId: a.coleccionId,
    }));

    const colecciones = trackingModule.todasLasColecciones().map(c => ({
        id: c.id,
        carpetaLocal: c.carpetaLocal,
    }));

    const resultado = await detectarDivergencias(
        config.carpetaLocal,
        archivosParaReconciliar,
        colecciones,
    );

    if (resultado.divergencias.length > 0) {
        logSync.warn('syncWatcher', `Reconciliación: ${resultado.divergencias.length} divergencias detectadas`, {
            tiempoMs: resultado.duracionMs,
            enDisco: resultado.archivosEnDisco,
            enTracking: resultado.archivosEnTracking,
        });
    } else {
        logSync.info('syncWatcher', `Reconciliación OK: ${resultado.archivosEnDisco} archivos verificados en ${resultado.duracionMs}ms`);
    }
}

/*
 * C288: Reconciliación periódica de estructura de carpetas.
 *
 * El debounced watcher de Tauri (notify-rs) NO emite rename events fiables
 * en Windows con OneDrive. El cloud filter driver (cldflt.sys) absorbe los
 * rename y no los propaga a notify. Resultado: renombrar una carpeta o
 * subcarpeta no genera NINGÚN evento en el watcher → nombre local diverge
 * del servidor silenciosamente.
 *
 * Solución: escanear periódicamente la estructura de carpetas en disco,
 * comparar con tracking, y detectar renames a través de reconciliación:
 * - Carpeta en tracking cuya carpetaLocal NO existe en disco = "desaparecida"
 * - Carpeta en disco que NO tiene tracking = "nueva"
 * - Si hay exactamente 1 desaparecida y 1 nueva dentro del mismo padre → rename
 *
 * Frecuencia: cada RECONCILIACION_CARPETAS_MS (15s). Es un listado de directorios
 * ligero (readDir), no un hash/stat de archivos.
 */
const RECONCILIACION_CARPETAS_MS = 15_000;
let reconciliacionCarpetasInterval: ReturnType<typeof setInterval> | null = null;

async function reconciliarEstructuraCarpetas(): Promise<void> {
    const { config, trackingModule, collectionModule } = estado;
    if (!config.carpetaLocal || !trackingModule || !collectionModule) return;

    /*
     * QL121: Cuando borrarAlSubirExitoso esta activo, las carpetas de colecciones
     * anteriores se vacian (archivos borrados tras subir) y pueden ser eliminadas
     * por el usuario o el OS. La reconciliacion interpreta esto como "rename"
     * (1 desaparecida + 1 nueva = rename) y RENOMBRA la coleccion vieja a la nueva,
     * causando merge destructivo. SOLUCION: omitir reconciliacion de renames en este
     * modo. Las carpetas nuevas se crean correctamente via el callback onCarpetaNueva.
     */
    if (estado.configAvanzada.borrarAlSubirExitoso) {
        logSync.debug('syncWatcher', 'Reconciliacion omitida — borrarAlSubirExitoso activo (QL121)');
        return;
    }

    try {
        const { readDir, exists } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');

        const carpetaBase = config.carpetaLocal;
        const colMod = collectionModule;
        const tracking = trackingModule;

        /* Nivel 1: carpetas raíz = colecciones principales (parentId null) */
        const entradas = await readDir(carpetaBase);
        const carpetasEnDisco = new Set<string>();

        for (const entrada of entradas) {
            if (!entrada.name || !entrada.isDirectory) continue;
            const nombreLower = entrada.name.toLowerCase();
            if (CARPETAS_SISTEMA_SYNC.has(nombreLower)) continue;
            if (CARPETAS_EXCLUIDAS_SCAN.has(nombreLower)) continue;
            carpetasEnDisco.add(entrada.name);
        }

        const coleccionesRaiz = tracking.todasLasColecciones().filter(c => c.parentId === null);

        /* Clasificar: desaparecidas (en tracking pero no en disco) y nuevas (en disco pero no en tracking) */
        const desaparecidas: Array<{ id: number; nombre: string; carpetaLocal: string }> = [];
        for (const col of coleccionesRaiz) {
            let encontrada = false;
            for (const enDisco of carpetasEnDisco) {
                if (enDisco.toLowerCase() === col.carpetaLocal.toLowerCase()
                    || enDisco.toLowerCase() === col.nombre.toLowerCase()) {
                    encontrada = true;
                    break;
                }
            }
            if (!encontrada) {
                /* Verificar con exists() por si hay diferencia de encoding/case */
                const rutaCol = await join(carpetaBase, col.carpetaLocal);
                if (!await exists(rutaCol)) {
                    desaparecidas.push({ id: col.id, nombre: col.nombre, carpetaLocal: col.carpetaLocal });
                }
            }
        }

        const nuevas: string[] = [];
        for (const enDisco of carpetasEnDisco) {
            const tracked = tracking.buscarColeccionPorCarpeta(enDisco);
            if (!tracked) {
                nuevas.push(enDisco);
            }
        }

        /* Parear: si hay exactamente 1 desaparecida y 1 nueva → rename */
        if (desaparecidas.length === 1 && nuevas.length === 1) {
            const vieja = desaparecidas[0];
            const nueva = nuevas[0];
            logSync.info('syncWatcher',
                `Reconciliación: rename carpeta detectado: ${vieja.carpetaLocal} → ${nueva}`);

            const exito = await colMod.renombrarColeccionEnServidor(vieja.id, nueva);
            if (!exito) {
                await tracking.actualizarNombreColeccion(vieja.id, nueva, nueva);
            }
        } else if (desaparecidas.length > 0 && nuevas.length > 0) {
            /*
             * Múltiples renames simultáneos: no podemos parear con certeza.
             * Intentar parear por proximidad temporal (todas del mismo batch).
             * Fallback: crear nuevas + dejar huérfanas para cleanup posterior.
             */
            const pareados = Math.min(desaparecidas.length, nuevas.length);
            for (let i = 0; i < pareados; i++) {
                const vieja = desaparecidas[i];
                const nueva = nuevas[i];
                logSync.info('syncWatcher',
                    `Reconciliación: rename múltiple ${i + 1}/${pareados}: ${vieja.carpetaLocal} → ${nueva}`);
                const exito = await colMod.renombrarColeccionEnServidor(vieja.id, nueva);
                if (!exito) {
                    await tracking.actualizarNombreColeccion(vieja.id, nueva, nueva);
                }
            }
        }

        /* Nivel 2: subcarpetas dentro de cada colección raíz */
        for (const entrada of entradas) {
            if (!entrada.name || !entrada.isDirectory) continue;
            const nombreLower = entrada.name.toLowerCase();
            if (CARPETAS_SISTEMA_SYNC.has(nombreLower)) continue;
            if (CARPETAS_EXCLUIDAS_SCAN.has(nombreLower)) continue;

            const padre = tracking.buscarColeccionPorCarpeta(entrada.name);
            if (!padre) continue;

            const rutaCarpeta = await join(carpetaBase, entrada.name);
            let subEntradas;
            try {
                subEntradas = await readDir(rutaCarpeta);
            } catch {
                continue;
            }

            const subsEnDisco = new Set<string>();
            for (const sub of subEntradas) {
                if (!sub.name || !sub.isDirectory) continue;
                if (CARPETAS_SISTEMA_SYNC.has(sub.name.toLowerCase())) continue;
                if (CARPETAS_EXCLUIDAS_SCAN.has(sub.name.toLowerCase())) continue;
                subsEnDisco.add(sub.name);
            }

            const subcolecciones = tracking.subcoleccionesDePadre(padre.id);

            const subsDesaparecidas: Array<{ id: number; nombre: string; carpetaLocal: string }> = [];
            for (const sub of subcolecciones) {
                let encontrada = false;
                for (const enDisco of subsEnDisco) {
                    if (enDisco.toLowerCase() === sub.carpetaLocal.toLowerCase()
                        || enDisco.toLowerCase() === sub.nombre.toLowerCase()) {
                        encontrada = true;
                        break;
                    }
                }
                if (!encontrada) {
                    const rutaSub = await join(rutaCarpeta, sub.carpetaLocal);
                    if (!await exists(rutaSub)) {
                        subsDesaparecidas.push({ id: sub.id, nombre: sub.nombre, carpetaLocal: sub.carpetaLocal });
                    }
                }
            }

            const subsNuevas: string[] = [];
            for (const enDisco of subsEnDisco) {
                const tracked = tracking.buscarSubcoleccion(entrada.name, enDisco);
                if (!tracked) {
                    subsNuevas.push(enDisco);
                }
            }

            if (subsDesaparecidas.length === 1 && subsNuevas.length === 1) {
                const vieja = subsDesaparecidas[0];
                const nueva = subsNuevas[0];
                logSync.info('syncWatcher',
                    `Reconciliación: rename subcarpeta detectado en ${entrada.name}: ${vieja.carpetaLocal} → ${nueva}`);
                const exito = await colMod.renombrarColeccionEnServidor(vieja.id, nueva);
                if (!exito) {
                    await tracking.actualizarNombreColeccion(vieja.id, nueva, nueva);
                }
            } else if (subsDesaparecidas.length > 0 && subsNuevas.length > 0) {
                const pareados = Math.min(subsDesaparecidas.length, subsNuevas.length);
                for (let i = 0; i < pareados; i++) {
                    const vieja = subsDesaparecidas[i];
                    const nueva = subsNuevas[i];
                    logSync.info('syncWatcher',
                        `Reconciliación: rename subcarpeta múltiple ${i + 1}/${pareados} en ${entrada.name}: ${vieja.carpetaLocal} → ${nueva}`);
                    const exito = await colMod.renombrarColeccionEnServidor(vieja.id, nueva);
                    if (!exito) {
                        await tracking.actualizarNombreColeccion(vieja.id, nueva, nueva);
                    }
                }
            }
        }
    } catch (err) {
        logSync.warn('syncWatcher', 'Error en reconciliación de estructura de carpetas', {
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

/*
 * Detiene el watcher si está activo (para cleanup al cerrar).
 */
export async function detenerSyncBidireccional(): Promise<void> {
    if (estado.pollingCarpetasInterval) {
        clearInterval(estado.pollingCarpetasInterval);
        estado.pollingCarpetasInterval = null;
    }
    if (pollingTimeout) {
        clearTimeout(pollingTimeout);
        pollingTimeout = null;
    }
    if (reconciliacionCarpetasInterval) {
        clearInterval(reconciliacionCarpetasInterval);
        reconciliacionCarpetasInterval = null;
    }
    /* QL91: Detener analisis periodico de huerfanos */
    try {
        const { detenerAnalisisPeriodicoHuerfanos } = await import('./syncOrphanAnalysis');
        detenerAnalisisPeriodicoHuerfanos();
    } catch { /* Modulo no disponible */ }
    try {
        const { detenerObservacion } = await import('./fileWatcherService');
        await detenerObservacion();
    } catch {
        /* Ignorar si no se importó */
    }
}
