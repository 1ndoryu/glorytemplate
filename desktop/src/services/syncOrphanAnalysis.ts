/*
 * Servicio: syncOrphanAnalysis — QL91 Analisis periodico de archivos huerfanos.
 *
 * Detecta y resuelve archivos que quedaron en la carpeta de sync sin subir
 * o sin borrar cuando borrarAlSubirExitoso esta activo. Se ejecuta cada 30 min.
 *
 * Casos que resuelve:
 *   1. Archivo en disco, no en cola, no en tracking -> encolar para subida
 *   2. Archivo subido (en hashARutas/completados), aun en disco con borrarAlSubirExitoso -> borrar
 *   3. Items de cola en estado 'error' por mas de 1h -> reintentar
 *   4. Carpeta local vacia tras borrar todos sus archivos -> NO borrar coleccion (solo log)
 */

import { estado, buscarEnIndicePorRuta, guardarIndice } from './syncState';
import { logSync } from './syncLogger';

const EXTENSIONES_AUDIO = new Set(['wav', 'mp3', 'flac', 'aiff', 'aif', 'ogg']);
const CARPETAS_EXCLUIDAS = new Set(['.papelera']);
const ERROR_REINTENTAR_DESPUES_MS = 60 * 60 * 1000;
const ANALISIS_INTERVALO_MS = 30 * 60 * 1000;

let intervalo: ReturnType<typeof setInterval> | null = null;
let ejecutando = false;

export interface ResultadoAnalisis {
    archivosEncolados: number;
    archivosEliminados: number;
    erroresReintentados: number;
    carpetasVaciasDetectadas: number;
}

/*
 * Ejecuta el analisis completo de huerfanos.
 * Guard de concurrencia: si ya se esta ejecutando, se omite (setInterval
 * podria solapar si una ejecucion tarda mas que el intervalo).
 */
export async function analizarArchivosHuerfanos(): Promise<ResultadoAnalisis> {
    if (ejecutando) return { archivosEncolados: 0, archivosEliminados: 0, erroresReintentados: 0, carpetasVaciasDetectadas: 0 };
    ejecutando = true;

    const resultado: ResultadoAnalisis = {
        archivosEncolados: 0,
        archivosEliminados: 0,
        erroresReintentados: 0,
        carpetasVaciasDetectadas: 0,
    };

    try {
        const { config, trackingModule, configAvanzada } = estado;
        if (!config.carpetaLocal || !config.sincronizacionActiva) return resultado;

        const { readDir, exists, remove } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const { encolarArchivo, obtenerEstadoCola, reintentarTodosConError } = await import('./uploadQueueService');

        const carpetaBase = config.carpetaLocal;
        const estadoCola = obtenerEstadoCola();
        const rutasEnCola = new Set(estadoCola.items.map(i => i.rutaArchivo.replace(/\\/g, '/')));
        const ahora = Date.now();

        /* Paso 1: Reintentar items de cola en estado error con mas de 1h de antiguedad */
        const itemsErrorViejos = estadoCola.items.filter(
            i => i.estado === 'error' && (ahora - i.timestampActualizado) > ERROR_REINTENTAR_DESPUES_MS
        );
        if (itemsErrorViejos.length > 0) {
            logSync.info('orphanAnalysis', `Reintentando ${itemsErrorViejos.length} items en error (>1h)`);
            await reintentarTodosConError();
            resultado.erroresReintentados = itemsErrorViejos.length;
        }

        /* Paso 2: Escanear carpeta de sync buscando huerfanos */
        const escarbarCarpeta = async (rutaCarpeta: string, carpetas: string[], profundidad: number): Promise<void> => {
            try {
                const entradas = await readDir(rutaCarpeta);
                let tieneArchivosAudio = false;

                for (const entrada of entradas) {
                    if (!entrada.name) continue;
                    const nombreLower = entrada.name.toLowerCase();

                    if (entrada.isDirectory) {
                        if (CARPETAS_EXCLUIDAS.has(nombreLower)) continue;
                        if (profundidad >= 2) continue;

                        const rutaSub = await join(rutaCarpeta, entrada.name);
                        await escarbarCarpeta(rutaSub, [...carpetas, entrada.name], profundidad + 1);
                        continue;
                    }

                    const ext = nombreLower.split('.').pop() ?? '';
                    if (!EXTENSIONES_AUDIO.has(ext)) continue;
                    tieneArchivosAudio = true;

                    const rutaArchivo = await join(rutaCarpeta, entrada.name);
                    const rutaNorm = rutaArchivo.replace(/\\/g, '/');

                    /* Ya en cola? Omitir */
                    if (rutasEnCola.has(rutaNorm)) continue;

                    /* Ya en tracking (sincronizado)? */
                    const enTracking = trackingModule?.buscarArchivoPorRuta(rutaNorm);
                    const enIndice = buscarEnIndicePorRuta(rutaNorm);

                    if (enTracking && !enTracking.syncDeshabilitado) {
                        /* Archivo sincronizado exitosamente. Si borrarAlSubirExitoso, eliminar. */
                        if (configAvanzada.borrarAlSubirExitoso) {
                            try {
                                await remove(rutaArchivo);
                                resultado.archivosEliminados++;
                                logSync.info('orphanAnalysis', `Archivo sincronizado eliminado: ${entrada.name}`);
                            } catch (err) {
                                logSync.warn('orphanAnalysis', `No se pudo eliminar archivo sincronizado: ${entrada.name}`, {
                                    error: err instanceof Error ? err.message : String(err),
                                });
                            }
                        }
                        continue;
                    }

                    if (enIndice) {
                        const idx = estado.indiceArchivos.indexOf(enIndice);
                        if (idx >= 0) estado.indiceArchivos.splice(idx, 1);
                        estado.indiceArchivosPorRuta.delete(rutaNorm);
                        if (enIndice.nombreServidor) estado.indiceArchivosPorNombre.delete(enIndice.nombreServidor);
                        if (enIndice.nombreOriginal && enIndice.nombreOriginal !== enIndice.nombreServidor) {
                            estado.indiceArchivosPorNombre.delete(enIndice.nombreOriginal);
                        }
                        guardarIndice();
                        logSync.warn('orphanAnalysis', `Entrada stale en indice legacy limpiada: ${entrada.name}`);
                    }

                    /* Archivo huerfano: no en cola, no en tracking, no en indice -> encolar */
                    try {
                        await encolarArchivo(rutaArchivo, entrada.name, carpetas);
                        resultado.archivosEncolados++;
                        logSync.info('orphanAnalysis', `Archivo huerfano encolado: ${entrada.name}`);
                    } catch (err) {
                        logSync.warn('orphanAnalysis', `Error encolando huerfano: ${entrada.name}`, {
                            error: err instanceof Error ? err.message : String(err),
                        });
                    }
                }

                /*
                 * QL91 Nota: Carpeta vacia. Solo log, NO borrar la carpeta ni la coleccion.
                 * El usuario puede haber vaciado la carpeta queriendo mantener la coleccion
                 * en el servidor. Borrar carpetas locales no debe borrar colecciones.
                 */
                if (!tieneArchivosAudio && carpetas.length > 0) {
                    const todasSubCarpetas = entradas.filter(e => e.isDirectory);
                    const soloNoExcluidas = todasSubCarpetas.filter(e => e.name && !CARPETAS_EXCLUIDAS.has(e.name.toLowerCase()));
                    if (soloNoExcluidas.length === 0) {
                        resultado.carpetasVaciasDetectadas++;
                        logSync.debug('orphanAnalysis', `Carpeta vacia detectada (no se borra): ${carpetas.join('/')}`);
                    }
                }
            } catch (err) {
                logSync.warn('orphanAnalysis', `Error escaneando carpeta: ${rutaCarpeta}`, {
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        };

        /* Verificar que la carpeta base existe antes de escanear */
        const carpetaExiste = await exists(carpetaBase);
        if (!carpetaExiste) {
            logSync.warn('orphanAnalysis', 'Carpeta de sync no existe, omitiendo analisis');
            return resultado;
        }

        await escarbarCarpeta(carpetaBase, [], 0);

        if (resultado.archivosEncolados > 0 || resultado.archivosEliminados > 0 || resultado.erroresReintentados > 0) {
            logSync.info('orphanAnalysis', 'Analisis completado', {
                encolados: resultado.archivosEncolados,
                eliminados: resultado.archivosEliminados,
                reintentados: resultado.erroresReintentados,
                carpetasVacias: resultado.carpetasVaciasDetectadas,
            });
        }

        return resultado;
    } catch (err) {
        logSync.error('orphanAnalysis', 'Error en analisis de huerfanos', {
            error: err instanceof Error ? err.message : String(err),
        });
        return resultado;
    } finally {
        ejecutando = false;
    }
}

/* Inicia el timer periodico. Llamar desde inicializarSyncBidireccional. */
export function iniciarAnalisisPeriodicoHuerfanos(): void {
    if (intervalo) return;
    intervalo = setInterval(() => {
        analizarArchivosHuerfanos().catch(err => {
            logSync.warn('orphanAnalysis', 'Error en analisis periodico', {
                error: err instanceof Error ? err.message : String(err),
            });
        });
    }, ANALISIS_INTERVALO_MS);
    logSync.info('orphanAnalysis', 'Analisis periodico de huerfanos iniciado (cada 30min)');
}

/* Detiene el timer. Llamar desde detenerSyncBidireccional. */
export function detenerAnalisisPeriodicoHuerfanos(): void {
    if (intervalo) {
        clearInterval(intervalo);
        intervalo = null;
    }
}
