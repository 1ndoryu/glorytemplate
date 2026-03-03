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
import { esDescargaEnCurso, obtenerBaseUrlSync, esSyncEnCurso } from './syncGuards';
import { encolarOperacion } from './offlineQueueService';
import {
    estado,
    guardarIndice,
    buscarEnIndicePorRuta,
    buscarEnIndicePorNombre,
    actualizarIndiceArchivo,
    POLLING_CARPETAS_MS,
    type ArchivoLocal,
} from './syncState';
import { sincronizarEstructuraCarpetasV1 } from './syncDownloadV1';
import { inicializarPapelera, purgarExpirados } from './papeleraService';

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
    _nombreArchivo: string,
    carpetas: string[],
): Promise<void> {
    const { trackingModule, indiceArchivos } = estado;
    const rutaAntNorm = rutaAnterior.replace(/\\/g, '/');
    const archivo = buscarEnIndicePorRuta(rutaAntNorm);

    if (!archivo) {
        console.warn('[Sync] Move: archivo no encontrado en índice por ruta anterior:', rutaAnterior);
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
        }
    }

    const primaria = carpetas[0] || 'General';
    const secundaria = carpetas[1] || '';
    await moverSampleEnServidor(archivo.sampleId, primaria, secundaria);

    console.info('[Sync] Move procesado: sample', archivo.sampleId, '→', primaria, secundaria || '(raíz)');
}

/*
 * Actualiza la ruta de un archivo conocido detectado en nueva ubicación.
 * (archivo copiado/movido dentro de la carpeta sync, reconocido por nombre)
 */
async function actualizarRutaYCarpeta(
    archivo: ArchivoLocal,
    rutaNueva: string,
    carpetas: string[],
): Promise<void> {
    const { trackingModule } = estado;
    const rutaAnterior = archivo.ruta.replace(/\\/g, '/');

    archivo.ruta = rutaNueva;
    if (archivo.syncDeshabilitado) {
        archivo.syncDeshabilitado = false;
        archivo.rutaEliminada = undefined;
    }
    actualizarIndiceArchivo(archivo, rutaAnterior);
    guardarIndice();

    if (trackingModule) {
        const archivoTracking = trackingModule.buscarArchivoPorSampleId(archivo.sampleId);
        if (archivoTracking) {
            archivoTracking.rutaLocal = rutaNueva;
            if (archivoTracking.syncDeshabilitado) archivoTracking.syncDeshabilitado = false;
            await trackingModule.registrarArchivo(archivoTracking);
        }
    }

    const primaria = carpetas[0] || 'General';
    const secundaria = carpetas[1] || '';
    await moverSampleEnServidor(archivo.sampleId, primaria, secundaria);
}

/* Polling de estructura de carpetas */

/*
 * Sincroniza la estructura de carpetas del servidor a disco local.
 * v2: delega a collectionModule (soloEstructura=true, no descarga).
 * v1: crea carpetas basadas en metadata IA.
 */
async function sincronizarEstructuraCarpetas(): Promise<void> {
    const { config, collectionModule } = estado;
    if (!config.carpetaLocal || !estaOnline()) return;

    /* No ejecutar polling si hay una sync completa en curso (evita race conditions) */
    if (esSyncEnCurso()) return;

    if (collectionModule) {
        try {
            await collectionModule.sincronizarColecciones(config.carpetaLocal, undefined, true);
        } catch (err) {
            console.error('[Sync] Error en polling de colecciones v2:', err);
        }
        return;
    }

    /* v1 fallback */
    await sincronizarEstructuraCarpetasV1();
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

async function manejarBorradoLocal(ruta: string): Promise<void> {
    /* Marcar como no sincronizar (comportamiento base) */
    await marcarNoSincronizar(ruta);

    /* Verificar si borrado bidireccional local→servidor esta activo */
    if (!estado.configAvanzada.borrarEnServidorAlBorrarLocal) return;

    /* Rate-limit: resetear contador cada 5 minutos */
    const ahora = Date.now();
    if (ahora - ultimoResetBorrados > 5 * 60 * 1000) {
        borradosEnCiclo = 0;
        ultimoResetBorrados = ahora;
    }

    if (borradosEnCiclo >= LIMITE_BORRADOS_POR_CICLO) {
        console.warn('[Sync] Limite de borrados en servidor alcanzado (50/ciclo). Ignorando:', ruta);
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
    if (!config.carpetaLocal || !config.sincronizacionActiva) return;

    try {
        const { registrarCallbacks, registrarCallbacksCarpeta, iniciarObservacion } = await import('./fileWatcherService');
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

                if (trackingModule) {
                    const enTracking = trackingModule.buscarArchivoPorRuta(ruta)
                        ?? trackingModule.buscarArchivoPorNombre(nombreArchivo);
                    if (enTracking) {
                        if (enTracking.syncDeshabilitado) {
                            /* El archivo fue borrado localmente y el usuario lo volvio a anadir:
                             * limpiar el entry del tracking para que el upload lo trate como nuevo. */
                            console.info('[Sync] Archivo re-anadido tras borrado local, re-encolando:', nombreArchivo);
                            trackingModule.eliminarArchivo(enTracking.sampleId, enTracking.coleccionId)
                                .then(() => encolarArchivo(ruta, nombreArchivo, carpetas))
                                .catch(err => console.error('[Sync] Error limpiando tracking para re-encolar:', nombreArchivo, err));
                        } else {
                            console.info('[Sync] Archivo ya en tracking v2, ignorando:', nombreArchivo);
                        }
                        return;
                    }
                }

                const porRuta = buscarEnIndicePorRuta(rutaNorm);
                if (porRuta) {
                    console.info('[Sync] Archivo ya en índice (por ruta), ignorando:', nombreArchivo);
                    return;
                }

                const porNombre = buscarEnIndicePorNombre(nombreArchivo);
                if (porNombre) {
                    console.info('[Sync] Archivo conocido detectado en nueva ubicación:', nombreArchivo);
                    actualizarRutaYCarpeta(porNombre, ruta, carpetas);
                    return;
                }

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

        /* Carpetas locales del sistema que NO deben crear colecciones en el servidor.
         * Son carpetas internas de la app, no colecciones del usuario. */
        const carpetasSistema = new Set([
            'sin colecci\u00f3n',       /* Sin colección (canónico) */
            'sin coleccion',             /* variante sin tilde */
            'sin colecci\u00c3\u00b3n', /* variante mojibake legacy */
        ]);

        /* C357: Callbacks de carpetas para sincronizar colecciones */
        if (collectionModule) {
            const colMod = collectionModule;
            registrarCallbacksCarpeta(
                (nombre: string, _rutaCompleta: string) => {
                    /* Excluir carpetas del sistema que NO son colecciones reales */
                    if (carpetasSistema.has(nombre.toLowerCase())) {
                        console.info('[Sync] Carpeta de sistema ignorada (no es colección):', nombre);
                        return;
                    }
                    console.info('[Sync] Carpeta nueva detectada → crear colección:', nombre);
                    colMod.crearColeccionDesdeLocal(nombre).catch(err => {
                        console.error('[Sync] Error creando colección desde carpeta local:', err);
                    });
                },
                (nombreAnterior: string, nombreNuevo: string, _rutaNueva: string) => {
                    if (!trackingModule) return;
                    /* Excluir carpetas del sistema que NO son colecciones reales */
                    if (carpetasSistema.has(nombreNuevo.toLowerCase())) {
                        console.info('[Sync] Rename a carpeta de sistema ignorado:', nombreNuevo);
                        return;
                    }
                    const coleccion = trackingModule.buscarColeccionPorCarpeta(nombreAnterior);
                    if (coleccion) {
                        console.info('[Sync] Carpeta renombrada → renombrar colección:', coleccion.id, nombreAnterior, '→', nombreNuevo);
                        colMod.renombrarColeccionEnServidor(coleccion.id, nombreNuevo).catch(err => {
                            console.error('[Sync] Error renombrando colección:', err);
                        });
                        trackingModule.actualizarNombreColeccion(coleccion.id, nombreNuevo, nombreNuevo).catch(err => {
                            console.error('[Sync] Error actualizando nombre local de colección:', err);
                        });
                    } else {
                        console.info('[Sync] Carpeta renombrada sin colección asociada → crear:', nombreNuevo);
                        colMod.crearColeccionDesdeLocal(nombreNuevo).catch(err => {
                            console.error('[Sync] Error creando colección desde rename:', err);
                        });
                    }
                },
            );
        }

        await inicializarUploadQueue();

        const iniciado = await iniciarObservacion();
        if (iniciado) {
            console.info('[Sync] Sync bidireccional activado');
        }

        await sincronizarEstructuraCarpetas();
        estado.pollingCarpetasInterval = setInterval(() => {
            sincronizarEstructuraCarpetas();
        }, POLLING_CARPETAS_MS);
    } catch (err) {
        console.error('[Sync] Error inicializando sync bidireccional:', err);
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
    try {
        const { detenerObservacion } = await import('./fileWatcherService');
        await detenerObservacion();
    } catch {
        /* Ignorar si no se importó */
    }
}
