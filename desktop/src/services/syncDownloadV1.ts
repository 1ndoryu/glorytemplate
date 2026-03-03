/*
 * Servicio: syncDownloadV1 — Lógica legacy de descarga basada en metadata IA.
 *
 * Mantiene el código de sincronización v1 que usa carpeta_primaria/carpeta_secundaria.
 * Se ejecuta como fallback cuando el módulo v2 (syncCollectionService) no está disponible.
 * Se eliminará cuando la migración a v2 esté completa en todas las instancias.
 *
 * Responsabilidad: descarga v1. Sin estado propio (usa syncState).
 */

import { marcarDescargaEnCurso, marcarMovimientoInterno, obtenerBaseUrlSync } from './syncGuards';
import {
    estado,
    guardarIndice,
    guardarConfig,
    type CarpetaInfo,
    type SampleBasico,
    type ResultadoDescargaApi,
    type ProgressCallback,
} from './syncState';

/*
 * Registra un archivo descargado en el índice v1 legacy.
 * Usada internamente por la lógica v1 dentro de esta función.
 */
async function registrarEnIndiceV1(
    sampleId: number,
    ruta: string,
    nombreOriginal: string,
    nombreServidor: string,
): Promise<void> {
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

/*
 * Sync v1 legacy — sincroniza basándose en carpetas de metadata IA.
 * Descarga paginada de samples por carpeta primaria.
 */
export async function sincronizarConServidorV1(
    onProgreso?: ProgressCallback,
): Promise<{ nuevos: number; eliminados: number }> {
    const { config, indiceArchivos } = estado;
    if (!config.carpetaLocal || !config.sincronizacionActiva) {
        return { nuevos: 0, eliminados: 0 };
    }

    const carpetaBase = config.carpetaLocal;
    let nuevos = 0;

    try {
        const { mkdir, writeFile, rename } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const baseUrl = obtenerBaseUrlSync();

        /* Obtener estructura de carpetas del explorador del usuario */
        const respCarpetas = await fetch(`${baseUrl}/kamples/v1/me/coleccionados/carpetas`);
        if (!respCarpetas.ok) {
            throw new Error(`Error al obtener carpetas: ${respCarpetas.status}`);
        }
        const jsonCarpetas = await respCarpetas.json();
        const carpetas: CarpetaInfo[] = Array.isArray(jsonCarpetas)
            ? jsonCarpetas
            : (jsonCarpetas?.data ?? []);

        const total = carpetas.reduce((acc, c) => acc + c.total, 0);
        let procesados = 0;

        for (const carpeta of carpetas) {
            const rutaCarpeta = await join(carpetaBase, carpeta.primaria);
            try {
                await mkdir(rutaCarpeta, { recursive: true });
            } catch { /* La carpeta puede existir ya */ }

            for (const sub of carpeta.subcarpetas) {
                try {
                    const rutaSub = await join(rutaCarpeta, sub.nombre);
                    await mkdir(rutaSub, { recursive: true });
                } catch { /* subcarpeta puede existir ya */ }
            }

            /* Paginar todos los samples de esta carpeta primaria */
            let page = 1;
            let hayMas = true;

            while (hayMas) {
                const urlSamples =
                    `${baseUrl}/kamples/v1/me/coleccionados` +
                    `?carpeta=${encodeURIComponent(carpeta.primaria)}&per_page=100&page=${page}`;

                const respSamples = await fetch(urlSamples);
                if (!respSamples.ok) break;

                const json = await respSamples.json();
                const inner = json?.data ?? json;
                const samples: SampleBasico[] = Array.isArray(inner)
                    ? inner
                    : Array.isArray(inner?.data)
                        ? inner.data
                        : [];
                const pagination = inner?.pagination ?? { page, pages: 1 };

                for (const sample of samples) {
                    procesados++;

                    const archivoExistente = indiceArchivos.find(a => a.sampleId === sample.id);
                    if (archivoExistente) {
                        if (archivoExistente.syncDeshabilitado) {
                            onProgreso?.({
                                actual: procesados,
                                total,
                                sampleId: sample.id,
                                nombre: sample.titulo,
                                estado: 'descargado',
                            });
                            continue;
                        }
                        const subcarpetaEsperada = sample.metadata?.carpeta_secundaria || '';
                        if (subcarpetaEsperada) {
                            const rutaEsperada = await join(rutaCarpeta, subcarpetaEsperada);
                            const rutaNormalizada = archivoExistente.ruta.replace(/\\/g, '/');
                            const subNormalizada = subcarpetaEsperada.replace(/\\/g, '/');
                            if (!rutaNormalizada.includes(`/${subNormalizada}/`)) {
                                try {
                                    await mkdir(rutaEsperada, { recursive: true });
                                    const nombreArch = archivoExistente.ruta.replace(/\\/g, '/').split('/').pop() ?? '';
                                    const nuevaRuta = await join(rutaEsperada, nombreArch);

                                    marcarDescargaEnCurso(nuevaRuta);
                                    marcarDescargaEnCurso(archivoExistente.ruta);
                                    marcarMovimientoInterno(archivoExistente.ruta);

                                    await rename(archivoExistente.ruta, nuevaRuta);
                                    archivoExistente.ruta = nuevaRuta;
                                    await guardarIndice();
                                } catch (err) {
                                    console.error(`[Sync] Error reubicando sample ${sample.id} a subcarpeta:`, err);
                                }
                            }
                        }
                        onProgreso?.({
                            actual: procesados,
                            total,
                            sampleId: sample.id,
                            nombre: sample.titulo,
                            estado: 'descargado',
                        });
                        continue;
                    }

                    try {
                        onProgreso?.({
                            actual: procesados,
                            total,
                            sampleId: sample.id,
                            nombre: sample.titulo,
                            estado: 'descargando',
                        });

                        const respDescarga = await fetch(
                            `${baseUrl}/kamples/v1/samples/${sample.id}/descargar`,
                            { method: 'POST' },
                        );
                        if (!respDescarga.ok) {
                            throw new Error(`No se pudo obtener URL de descarga: ${respDescarga.status}`);
                        }
                        const { url: audioUrl, nombre, formato, tamano }: ResultadoDescargaApi =
                            await respDescarga.json();

                        const audioResp = await fetch(audioUrl);
                        if (!audioResp.ok) {
                            throw new Error(`Error al descargar audio: ${audioResp.status}`);
                        }
                        const buffer = await audioResp.arrayBuffer();

                        const nombreArchivo = nombre.includes('.') ? nombre : `${nombre}.${formato}`;

                        const subcarpeta = sample.metadata?.carpeta_secundaria || '';
                        let rutaDestino = rutaCarpeta;
                        if (subcarpeta) {
                            rutaDestino = await join(rutaCarpeta, subcarpeta);
                            try {
                                await mkdir(rutaDestino, { recursive: true });
                            } catch { /* puede existir */ }
                        }
                        const rutaArchivo = await join(rutaDestino, nombreArchivo);

                        marcarDescargaEnCurso(rutaArchivo);

                        await writeFile(rutaArchivo, new Uint8Array(buffer));

                        await registrarEnIndiceV1(sample.id, rutaArchivo, nombre, nombreArchivo);
                        nuevos++;

                        onProgreso?.({
                            actual: procesados,
                            total,
                            sampleId: sample.id,
                            nombre,
                            estado: 'descargado',
                            tamano,
                            ruta: rutaArchivo,
                        });
                    } catch (err) {
                        console.error(`[Sync] Error descargando sample ${sample.id}:`, err);
                        onProgreso?.({
                            actual: procesados,
                            total,
                            sampleId: sample.id,
                            nombre: sample.titulo,
                            estado: 'error',
                        });
                    }
                }

                hayMas = pagination.page < pagination.pages;
                page++;
            }
        }

        estado.config.ultimaSync = Date.now();
        await guardarConfig();

        return { nuevos, eliminados: 0 };
    } catch (err) {
        console.error('[Sync] Error global en sincronización v1:', err);
        throw err;
    }
}

/*
 * v1 fallback: sincroniza estructura de carpetas basada en metadata IA.
 * Crea carpetas primarias y subcarpetas en disco basándose en el endpoint /carpetas.
 */
export async function sincronizarEstructuraCarpetasV1(): Promise<void> {
    const { config } = estado;
    if (!config.carpetaLocal) return;

    try {
        const { mkdir } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const baseUrl = obtenerBaseUrlSync();

        const resp = await fetch(`${baseUrl}/kamples/v1/me/coleccionados/carpetas`);
        if (!resp.ok) return;

        const json = await resp.json();
        const carpetas: CarpetaInfo[] = Array.isArray(json) ? json : (json?.data ?? []);

        for (const carpeta of carpetas) {
            const rutaPrimaria = await join(config.carpetaLocal, carpeta.primaria);
            try {
                await mkdir(rutaPrimaria, { recursive: true });
            } catch { /* existe */ }

            for (const sub of carpeta.subcarpetas) {
                try {
                    const rutaSub = await join(rutaPrimaria, sub.nombre);
                    await mkdir(rutaSub, { recursive: true });
                } catch { /* existe */ }
            }
        }
    } catch (err) {
        console.error('[Sync] Error sincronizando estructura de carpetas v1:', err);
    }
}
