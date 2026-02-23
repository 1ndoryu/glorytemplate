/*
 * Servicio de sincronización de archivos de audio.
 * Gestiona la carpeta local donde se sincroniza la librería del usuario.
 *
 * Flujo:
 * 1. Usuario elige carpeta de sincronización (dialog de Tauri)
 * 2. Se crea un índice local de archivos descargados
 * 3. Al conectar, compara con el servidor y descarga/elimina diferencias
 * 4. Archivos se nombran con su nombre local original
 * 5. Re-descargas usan el nombre generado por el servidor
 *
 * TO-DO: Archivo excede 300 lineas (681). Dividir en:
 * - syncConfigService.ts (config, índice, guardar/cargar store)
 * - syncDownloadService.ts (sincronizarConServidor, sincronizarSampleIndividual)
 * - syncStateService.ts (estado no_sincronizar, reactivar, bidireccional)
 */

import { esDesktop, estaOnline } from './desktopService';

const STORE_FILE = 'sync-config.json';

/* Tipos mínimos locales para evitar importar desde App/React */
interface CarpetaInfo {
    primaria: string;
    total: number;
    subcarpetas: Array<{ nombre: string; total: number }>;
}

interface SampleBasico {
    id: number;
    titulo: string;
    /* C338: metadata incluye carpeta_secundaria para estructura de subcarpetas */
    metadata?: {
        carpeta_primaria?: string;
        carpeta_secundaria?: string;
        [key: string]: unknown;
    };
}

interface ResultadoDescargaApi {
    url: string;
    nombre: string;
    formato: string;
    tamano: number;
}

export interface ProgresoSync {
    actual: number;
    total: number;
    sampleId: number;
    nombre: string;
    estado: 'descargando' | 'descargado' | 'error';
    tamano?: number;
    ruta?: string;
}

export type ProgressCallback = (progreso: ProgresoSync) => void;

function obtenerBaseUrl(): string {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const ctx = (window as any).GLORY_CONTEXT as { apiUrl?: string } | undefined;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    return ctx?.apiUrl ?? '/wp-json';
}

interface SyncConfig {
    carpetaLocal: string | null;
    sincronizacionActiva: boolean;
    ultimaSync: number;
}

interface ArchivoLocal {
    ruta: string;
    nombre: string;
    sampleId: number;
    hash: string;
    descargadoEn: number;
    nombreOriginal: string;
    nombreServidor: string;
    /*
     * C341: Si true, el archivo se eliminó localmente pero no del server.
     * No se re-descarga en la próxima sync. Visible en el explorador.
     */
    syncDeshabilitado?: boolean;
    /* Ruta original antes de que se eliminara (para UI) */
    rutaEliminada?: string;
}

const STORE_KEY_CONFIG = 'sync_config';
const STORE_KEY_INDICE = 'sync_indice';

let config: SyncConfig = {
    carpetaLocal: null,
    sincronizacionActiva: false,
    ultimaSync: 0,
};

let indiceArchivos: ArchivoLocal[] = [];

/*
 * Inicializa el servicio de sync: carga config e índice.
 * C341: También inicializa fileWatcher y uploadQueue para sync bidireccional.
 */
export async function inicializarSyncService(): Promise<void> {
    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);

        const configGuardada = await store.get<SyncConfig>(STORE_KEY_CONFIG);
        if (configGuardada) config = configGuardada;

        const indiceGuardado = await store.get<ArchivoLocal[]>(STORE_KEY_INDICE);
        if (indiceGuardado) indiceArchivos = indiceGuardado;
    } catch {
        /* Config no disponible — usar defaults */
    }

    /* C341: Inicializar sync bidireccional (watcher + upload queue) */
    await inicializarSyncBidireccional();
}

/*
 * Abre un diálogo para que el usuario elija la carpeta de sincronización.
 */
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
            config.carpetaLocal = carpeta;
            await guardarConfig();
            return carpeta;
        }
    } catch (err) {
        console.error('[Sync] Error eligiendo carpeta:', err);
    }

    return null;
}

/*
 * Activa o desactiva la sincronización automática.
 */
export async function toggleSincronizacion(activa: boolean): Promise<void> {
    config.sincronizacionActiva = activa;
    await guardarConfig();
}

/*
 * Verifica si un sample ya está descargado localmente.
 * Retorna la ruta local si existe, null si no.
 */
export function obtenerRutaLocal(sampleId: number): string | null {
    const archivo = indiceArchivos.find(a => a.sampleId === sampleId);
    return archivo?.ruta ?? null;
}

/*
 * Registra un archivo descargado en el índice local.
 */
export async function registrarDescarga(
    sampleId: number,
    ruta: string,
    nombreOriginal: string,
    nombreServidor: string,
): Promise<void> {
    /* Evitar duplicados */
    indiceArchivos = indiceArchivos.filter(a => a.sampleId !== sampleId);

    indiceArchivos.push({
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
 * Obtiene la configuración actual de sync.
 */
export function obtenerConfigSync(): SyncConfig {
    return { ...config };
}

/*
 * Sincroniza la carpeta local con el servidor.
 * 1. Obtiene estructura de carpetas del explorador del usuario.
 * 2. Por cada carpeta, descarga samples nuevos (no están en el índice local).
 * 3. Llama onProgreso para actualizar la UI en tiempo real.
 * - [sync]: mirroring explorador structure: carpetaLocal/primaria/nombre.formato
 */
export async function sincronizarConServidor(
    onProgreso?: ProgressCallback,
): Promise<{ nuevos: number; eliminados: number }> {
    if (!config.carpetaLocal || !config.sincronizacionActiva || !estaOnline()) {
        return { nuevos: 0, eliminados: 0 };
    }

    const carpetaBase = config.carpetaLocal;
    let nuevos = 0;

    try {
        const { mkdir, writeFile, rename } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const baseUrl = obtenerBaseUrl();

        /* Obtener estructura de carpetas del explorador del usuario */
        const respCarpetas = await fetch(`${baseUrl}/kamples/v1/me/coleccionados/carpetas`);
        if (!respCarpetas.ok) {
            throw new Error(`Error al obtener carpetas: ${respCarpetas.status}`);
        }
        const jsonCarpetas = await respCarpetas.json();
        /* PHP retorna { data: CarpetaInfo[] } — extraer array */
        const carpetas: CarpetaInfo[] = Array.isArray(jsonCarpetas)
            ? jsonCarpetas
            : (jsonCarpetas?.data ?? []);

        const total = carpetas.reduce((acc, c) => acc + c.total, 0);
        let procesados = 0;

        for (const carpeta of carpetas) {
            /* Crear carpeta primaria en disco */
            const rutaCarpeta = await join(carpetaBase, carpeta.primaria);
            try {
                await mkdir(rutaCarpeta, { recursive: true });
            } catch { /* La carpeta puede existir ya — ignorar */ }

            /*
             * C338: Crear subcarpetas en disco para que aparezcan en el explorador local.
             * Incluye "General" y cualquier nueva subcarpeta creada por el usuario.
             */
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
                /*
                 * PHP retorna doble envoltura:
                 * WP_REST_Response({ data: { data: SampleResumen[], pagination: {} } })
                 * Por eso hay que perforar json.data.data para llegar al array.
                 */
                const inner = json?.data ?? json;
                const samples: SampleBasico[] = Array.isArray(inner)
                    ? inner
                    : Array.isArray(inner?.data)
                        ? inner.data
                        : [];
                const pagination = inner?.pagination ?? { page, pages: 1 };

                for (const sample of samples) {
                    procesados++;

                    /*
                     * C338-fix: Si ya está en el índice local, verificar si necesita
                     * reubicarse a la subcarpeta correcta. Samples descargados antes de
                     * C338 están en la carpeta primaria plana — hay que moverlos.
                     *
                     * C341: Si el sample tiene syncDeshabilitado, no re-descargar.
                     */
                    const archivoExistente = indiceArchivos.find(a => a.sampleId === sample.id);
                    if (archivoExistente) {
                        /* C341: Skip samples marcados como no_sincronizar */
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
                            /* Si el archivo NO está ya en la subcarpeta correcta, moverlo */
                            const rutaNormalizada = archivoExistente.ruta.replace(/\\/g, '/');
                            const subNormalizada = subcarpetaEsperada.replace(/\\/g, '/');
                            if (!rutaNormalizada.includes(`/${subNormalizada}/`)) {
                                try {
                                    await mkdir(rutaEsperada, { recursive: true });
                                    const nombreArch = archivoExistente.ruta.replace(/\\/g, '/').split('/').pop() ?? '';
                                    const nuevaRuta = await join(rutaEsperada, nombreArch);
                                    await rename(archivoExistente.ruta, nuevaRuta);
                                    /* Actualizar índice con la nueva ruta */
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

                        /* Obtener URL firmada de descarga del servidor */
                        const respDescarga = await fetch(
                            `${baseUrl}/kamples/v1/samples/${sample.id}/descargar`,
                            { method: 'POST' },
                        );
                        if (!respDescarga.ok) {
                            throw new Error(`No se pudo obtener URL de descarga: ${respDescarga.status}`);
                        }
                        const { url: audioUrl, nombre, formato, tamano }: ResultadoDescargaApi =
                            await respDescarga.json();

                        /* Descargar el archivo de audio */
                        const audioResp = await fetch(audioUrl);
                        if (!audioResp.ok) {
                            throw new Error(`Error al descargar audio: ${audioResp.status}`);
                        }
                        const buffer = await audioResp.arrayBuffer();

                        /*
                         * PHP retorna nombre ya con extensión: "titulo.wav"
                         * No añadir formato de nuevo para evitar "titulo.wav.wav".
                         * Solo usar formato como fallback si nombre no tiene punto.
                         */
                        const nombreArchivo = nombre.includes('.') ? nombre : `${nombre}.${formato}`;

                        /*
                         * C338: Colocar archivo en subcarpeta si el sample tiene carpeta_secundaria.
                         * Estructura: carpetaBase/primaria/subcarpeta/nombre.formato
                         * Si no tiene subcarpeta, va directo en la carpeta primaria.
                         */
                        const subcarpeta = sample.metadata?.carpeta_secundaria || '';
                        let rutaDestino = rutaCarpeta;
                        if (subcarpeta) {
                            rutaDestino = await join(rutaCarpeta, subcarpeta);
                            try {
                                await mkdir(rutaDestino, { recursive: true });
                            } catch { /* puede existir */ }
                        }
                        const rutaArchivo = await join(rutaDestino, nombreArchivo);
                        await writeFile(rutaArchivo, new Uint8Array(buffer));

                        /* Registrar en índice local para no re-descargar */
                        await registrarDescarga(sample.id, rutaArchivo, nombre, nombreArchivo);
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

        config.ultimaSync = Date.now();
        await guardarConfig();

        return { nuevos, eliminados: 0 };
    } catch (err) {
        console.error('[Sync] Error global en sincronización:', err);
        throw err;
    }
}

/*
 * Extrae metadata de la ruta del archivo para auto-descripción.
 * Analiza las 3 carpetas padre + nombre del archivo.
 *
 * Ejemplo: /Samples/808/Bass/deep_sub_hit.wav
 * → { carpetas: ['Samples', '808', 'Bass'], nombre: 'deep_sub_hit' }
 */
export function extraerMetadataDeRuta(rutaCompleta: string): {
    carpetas: string[];
    nombreArchivo: string;
    extension: string;
} {
    /* Normalizar separadores (Windows usa \, macOS/Linux usa /) */
    const partes = rutaCompleta.replace(/\\/g, '/').split('/').filter(Boolean);
    const archivoConExt = partes.pop() ?? '';
    const dotIndex = archivoConExt.lastIndexOf('.');

    const nombreArchivo = dotIndex > 0 ? archivoConExt.slice(0, dotIndex) : archivoConExt;
    const extension = dotIndex > 0 ? archivoConExt.slice(dotIndex + 1) : '';

    /* Tomar las últimas 3 carpetas (las más relevantes) */
    const carpetas = partes.slice(-3);

    return { carpetas, nombreArchivo, extension };
}

/*
 * Sincroniza un sample individual a la carpeta local.
 * Se usa al coleccionar un sample: descarga inmediatamente al disco
 * sin esperar a una sync completa. Si sync no está configurada, no-op.
 *
 * Flujo:
 * 1. Verifica que hay carpeta local configurada y sync activa.
 * 2. POST /samples/{id}/descargar para obtener URL firmada.
 * 3. Descarga el archivo a carpetaLocal/carpetaPrimaria/[subcarpeta/]nombre.formato
 * 4. Registra en el índice local.
 *
 * Retorna la ruta local del archivo descargado, o null si falla.
 */
export async function sincronizarSampleIndividual(
    sampleId: number,
    carpetaPrimaria?: string,
    carpetaSecundaria?: string,
): Promise<string | null> {
    if (!esDesktop() || !estaOnline()) return null;
    if (!config.carpetaLocal || !config.sincronizacionActiva) return null;

    /* Si ya está en el índice, no re-descargar */
    const existente = obtenerRutaLocal(sampleId);
    if (existente) return existente;

    try {
        const { mkdir, writeFile } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const baseUrl = obtenerBaseUrl();

        /* Obtener URL firmada de descarga */
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

        /* Descargar el archivo de audio */
        const audioResp = await fetch(audioUrl);
        if (!audioResp.ok) {
            console.error(`[SyncIndividual] Error al descargar audio: ${audioResp.status}`);
            return null;
        }
        const buffer = await audioResp.arrayBuffer();

        /* Construir ruta destino: carpetaLocal / primaria / [subcarpeta /] nombre */
        const nombreArchivo = nombre.includes('.') ? nombre : `${nombre}.${formato}`;
        const carpetaBase = config.carpetaLocal;
        const primaria = carpetaPrimaria || 'General';

        let rutaDestino = await join(carpetaBase, primaria);
        try {
            await mkdir(rutaDestino, { recursive: true });
        } catch { /* puede existir */ }

        if (carpetaSecundaria) {
            rutaDestino = await join(rutaDestino, carpetaSecundaria);
            try {
                await mkdir(rutaDestino, { recursive: true });
            } catch { /* puede existir */ }
        }

        const rutaArchivo = await join(rutaDestino, nombreArchivo);
        await writeFile(rutaArchivo, new Uint8Array(buffer));

        /* Registrar en índice local */
        await registrarDescarga(sampleId, rutaArchivo, nombre, nombreArchivo);

        console.info(`[SyncIndividual] Sample ${sampleId} descargado a: ${rutaArchivo}`);
        return rutaArchivo;
    } catch (err) {
        console.error(`[SyncIndividual] Error sincronizando sample ${sampleId}:`, err);
        return null;
    }
}

async function guardarConfig(): Promise<void> {
    if (!esDesktop()) return;
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.set(STORE_KEY_CONFIG, config);
        await store.save();
    } catch { /* silencioso */ }
}

async function guardarIndice(): Promise<void> {
    if (!esDesktop()) return;
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.set(STORE_KEY_INDICE, indiceArchivos);
        await store.save();
    } catch { /* silencioso */ }
}

/* ============================================================
 * C341: SYNC BIDIRECCIONAL — Watcher + Upload Queue + Estado
 * ============================================================ */

/*
 * Inicializa el sistema de sync bidireccional:
 * 1. Conecta fileWatcherService para detectar archivos nuevos/eliminados
 * 2. Inicializa uploadQueueService para subida automática
 * 3. Inicia observación de la carpeta de sync
 */
async function inicializarSyncBidireccional(): Promise<void> {
    if (!config.carpetaLocal || !config.sincronizacionActiva) return;

    try {
        const { registrarCallbacks, iniciarObservacion } = await import('./fileWatcherService');
        const { inicializarUploadQueue, encolarArchivo } = await import('./uploadQueueService');

        /* Registrar callbacks del watcher */
        registrarCallbacks(
            /* Archivo nuevo: verificar no está en el índice → encolar upload */
            (ruta: string, nombreArchivo: string, carpetas: string[]) => {
                const yaEnIndice = indiceArchivos.some(
                    a => a.ruta.replace(/\\/g, '/') === ruta.replace(/\\/g, '/'),
                );
                if (!yaEnIndice) {
                    encolarArchivo(ruta, nombreArchivo, carpetas);
                } else {
                    console.info('[Sync] Archivo ya en índice, ignorando:', nombreArchivo);
                }
            },
            /* Archivo eliminado: marcar como no_sincronizar */
            (ruta: string) => {
                marcarNoSincronizar(ruta);
            },
        );

        /* Inicializar upload queue (carga items pendientes del store) */
        await inicializarUploadQueue();

        /* Iniciar observación de la carpeta */
        const iniciado = await iniciarObservacion();
        if (iniciado) {
            console.info('[Sync] Sync bidireccional activado');
        }
    } catch (err) {
        console.error('[Sync] Error inicializando sync bidireccional:', err);
    }
}

/*
 * Marca un sample como "no sincronizar" por ruta local.
 * Se llama cuando el usuario elimina un archivo de la carpeta sync.
 * El sample NO se borra del servidor — solo deja de sincronizarse.
 */
export async function marcarNoSincronizar(ruta: string): Promise<boolean> {
    const rutaNormalizada = ruta.replace(/\\/g, '/');
    const archivo = indiceArchivos.find(
        a => a.ruta.replace(/\\/g, '/') === rutaNormalizada,
    );

    if (!archivo) {
        console.warn('[Sync] No se encontró archivo en índice para marcar no_sincronizar:', ruta);
        return false;
    }

    archivo.syncDeshabilitado = true;
    archivo.rutaEliminada = archivo.ruta;
    await guardarIndice();

    console.info('[Sync] Sample marcado como no_sincronizar:', archivo.nombre, '(sampleId:', archivo.sampleId, ')');
    return true;
}

/*
 * Marca un sample como "no sincronizar" por su ID de sample.
 * Versión para usar desde la UI del explorador.
 */
export async function marcarNoSincronizarPorId(sampleId: number): Promise<boolean> {
    const archivo = indiceArchivos.find(a => a.sampleId === sampleId);
    if (!archivo) return false;

    archivo.syncDeshabilitado = true;
    archivo.rutaEliminada = archivo.ruta;
    await guardarIndice();

    console.info('[Sync] Sample marcado como no_sincronizar por ID:', sampleId);
    return true;
}

/*
 * Reactiva la sincronización de un sample.
 * El archivo se re-descargará en la próxima sincronización.
 */
export async function reactivarSync(sampleId: number): Promise<boolean> {
    const archivo = indiceArchivos.find(a => a.sampleId === sampleId);
    if (!archivo) return false;

    /* Quitar del índice completamente para que se re-descargue */
    indiceArchivos = indiceArchivos.filter(a => a.sampleId !== sampleId);
    await guardarIndice();

    console.info('[Sync] Sync reactivada para sample:', sampleId, '— se descargará en próxima sync');
    return true;
}

/*
 * Obtiene el estado de sincronización de un sample.
 * Retorna: 'sincronizado' | 'no_sincronizar' | 'no_descargado'
 */
export function obtenerEstadoSync(sampleId: number): 'sincronizado' | 'no_sincronizar' | 'no_descargado' {
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
    return indiceArchivos
        .filter(a => a.syncDeshabilitado)
        .map(a => ({ sampleId: a.sampleId, nombre: a.nombre }));
}

/*
 * Detiene el watcher si está activo (para cleanup al cerrar).
 */
export async function detenerSyncBidireccional(): Promise<void> {
    try {
        const { detenerObservacion } = await import('./fileWatcherService');
        await detenerObservacion();
    } catch {
        /* Ignorar si no se importó */
    }
}
