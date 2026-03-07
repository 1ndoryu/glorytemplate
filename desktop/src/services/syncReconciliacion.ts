/*
 * Servicio: syncReconciliacion — Verificación periódica de integridad.
 *
 * Compara 3 estados: disco real, tracking local, servidor.
 * Detecta divergencias silenciosas y las resuelve:
 * - Archivos en disco pero no en tracking → re-trackear o encolar upload
 * - Archivos en tracking pero no en disco → marcar faltante, re-descargar
 * - Archivos en ambos pero con tamaño diferente → marcar modificado
 *
 * Inspirado en: Unison file synchronizer (reconciliación 3-way).
 */

import { logSync } from './syncLogger';

export type TipoDivergencia =
    | 'en_disco_sin_tracking'
    | 'en_tracking_sin_disco'
    | 'tamano_distinto'
    | 'coleccion_sin_carpeta'
    | 'carpeta_sin_coleccion';

export interface Divergencia {
    tipo: TipoDivergencia;
    ruta?: string;
    sampleId?: number;
    coleccionId?: number;
    detalle: string;
}

export interface ResultadoReconciliacion {
    timestamp: number;
    duracionMs: number;
    archivosEnDisco: number;
    archivosEnTracking: number;
    divergencias: Divergencia[];
    corregidasAutomaticamente: number;
}

const EXTENSIONES_AUDIO = new Set(['wav', 'mp3', 'flac', 'aiff', 'aif', 'ogg']);

/**
 * Ejecuta reconciliación completa entre disco y tracking.
 * No modifica estado — solo detecta divergencias.
 */
export async function detectarDivergencias(
    carpetaBase: string,
    archivosSeguidos: Array<{ ruta: string; sampleId: number; tamano: number; coleccionId: number | null }>,
    coleccionesLocales: Array<{ id: number; carpetaLocal: string }>
): Promise<ResultadoReconciliacion> {
    const inicio = Date.now();
    const divergencias: Divergencia[] = [];

    logSync.info('reconciliacion', 'Iniciando reconciliación de integridad');

    /* Listar archivos reales en disco */
    let archivosEnDisco: Map<string, number>;
    let carpetasEnDisco: Set<string>;
    try {
        const resultado = await escanearDisco(carpetaBase);
        archivosEnDisco = resultado.archivos;
        carpetasEnDisco = resultado.carpetas;
    } catch (error) {
        logSync.error('reconciliacion', 'Error escaneando disco', {
            error: error instanceof Error ? error.message : String(error)
        });
        return {
            timestamp: Date.now(),
            duracionMs: Date.now() - inicio,
            archivosEnDisco: 0,
            archivosEnTracking: archivosSeguidos.length,
            divergencias: [{
                tipo: 'en_disco_sin_tracking',
                detalle: 'Error escaneando disco — reconciliación abortada',
            }],
            corregidasAutomaticamente: 0,
        };
    }

    /* Set de rutas normalizadas del tracking */
    const rutasTracking = new Map<string, typeof archivosSeguidos[0]>();
    for (const arch of archivosSeguidos) {
        rutasTracking.set(normalizarRuta(arch.ruta), arch);
    }

    /* Diferencia A: en disco pero no en tracking */
    for (const [ruta] of archivosEnDisco) {
        if (!rutasTracking.has(ruta)) {
            divergencias.push({
                tipo: 'en_disco_sin_tracking',
                ruta,
                detalle: `Archivo en disco no trackeado: ${ruta}`,
            });
        }
    }

    /* Diferencia B: en tracking pero no en disco */
    for (const [ruta, arch] of rutasTracking) {
        if (!archivosEnDisco.has(ruta)) {
            divergencias.push({
                tipo: 'en_tracking_sin_disco',
                ruta,
                sampleId: arch.sampleId,
                coleccionId: arch.coleccionId ?? undefined,
                detalle: `Archivo trackeado pero no existe en disco: ${ruta}`,
            });
        }
    }

    /* Intersección: verificar tamaño */
    for (const [ruta, arch] of rutasTracking) {
        const tamanoDisco = archivosEnDisco.get(ruta);
        if (tamanoDisco !== undefined && arch.tamano > 0 && tamanoDisco !== arch.tamano) {
            divergencias.push({
                tipo: 'tamano_distinto',
                ruta,
                sampleId: arch.sampleId,
                detalle: `Tamaño difiere: tracking=${arch.tamano} disco=${tamanoDisco}`,
            });
        }
    }

    /* Colecciones sin carpeta en disco */
    for (const col of coleccionesLocales) {
        const carpetaNorm = normalizarRuta(`${carpetaBase}/${col.carpetaLocal}`);
        if (!carpetasEnDisco.has(carpetaNorm)) {
            divergencias.push({
                tipo: 'coleccion_sin_carpeta',
                coleccionId: col.id,
                detalle: `Colección ${col.id} (${col.carpetaLocal}) sin carpeta en disco`,
            });
        }
    }

    const resultado: ResultadoReconciliacion = {
        timestamp: Date.now(),
        duracionMs: Date.now() - inicio,
        archivosEnDisco: archivosEnDisco.size,
        archivosEnTracking: archivosSeguidos.length,
        divergencias,
        corregidasAutomaticamente: 0,
    };

    logSync.info('reconciliacion', `Reconciliación completada en ${resultado.duracionMs}ms`, {
        enDisco: resultado.archivosEnDisco,
        enTracking: resultado.archivosEnTracking,
        divergencias: divergencias.length,
    });

    return resultado;
}

/**
 * Escanea recursivamente la carpeta base (2 niveles máximo).
 * Retorna Map de archivos (ruta normalizada → tamaño) y Set de carpetas.
 */
async function escanearDisco(
    carpetaBase: string
): Promise<{ archivos: Map<string, number>; carpetas: Set<string> }> {
    const { readDir, stat } = await import('@tauri-apps/plugin-fs');
    const archivos = new Map<string, number>();
    const carpetas = new Set<string>();

    const entradas = await readDir(carpetaBase);
    for (const entrada of entradas) {
        if (!entrada.name || entrada.name.startsWith('.')) continue;

        const rutaCompleta = `${carpetaBase}/${entrada.name}`;
        const rutaNorm = normalizarRuta(rutaCompleta);

        if (entrada.isDirectory) {
            carpetas.add(rutaNorm);

            /* Nivel 2: subcolecciones */
            try {
                const subEntradas = await readDir(rutaCompleta);
                for (const sub of subEntradas) {
                    if (!sub.name || sub.name.startsWith('.')) continue;
                    const subRuta = `${rutaCompleta}/${sub.name}`;
                    const subNorm = normalizarRuta(subRuta);

                    if (sub.isDirectory) {
                        carpetas.add(subNorm);
                        /* Nivel 3: archivos dentro de subcolecciones */
                        try {
                            const subSubEntradas = await readDir(subRuta);
                            for (const ss of subSubEntradas) {
                                if (!ss.name) continue;
                                const ext = ss.name.split('.').pop()?.toLowerCase() ?? '';
                                if (EXTENSIONES_AUDIO.has(ext)) {
                                    const ssRuta = normalizarRuta(`${subRuta}/${ss.name}`);
                                    try {
                                        const info = await stat(`${subRuta}/${ss.name}`);
                                        archivos.set(ssRuta, info.size ?? 0);
                                    } catch {
                                        archivos.set(ssRuta, 0);
                                    }
                                }
                            }
                        } catch {
                            /* Subcolección no leíble */
                        }
                    } else {
                        const ext = sub.name.split('.').pop()?.toLowerCase() ?? '';
                        if (EXTENSIONES_AUDIO.has(ext)) {
                            try {
                                const info = await stat(subRuta);
                                archivos.set(subNorm, info.size ?? 0);
                            } catch {
                                archivos.set(subNorm, 0);
                            }
                        }
                    }
                }
            } catch {
                /* Carpeta no leíble */
            }
        } else {
            const ext = entrada.name.split('.').pop()?.toLowerCase() ?? '';
            if (EXTENSIONES_AUDIO.has(ext)) {
                try {
                    const info = await stat(rutaCompleta);
                    archivos.set(rutaNorm, info.size ?? 0);
                } catch {
                    archivos.set(rutaNorm, 0);
                }
            }
        }
    }

    return { archivos, carpetas };
}

function normalizarRuta(ruta: string): string {
    return ruta.replace(/\\/g, '/').toLowerCase();
}
