/*
 * Servicio de sincronización de archivos de audio (v2).
 * Gestiona la carpeta local donde se sincroniza la librería del usuario.
 *
 * v2: Basado en colecciones del servidor. Cada colección = carpeta local.
 * Usa syncTrackingService para persistencia tipada y syncCollectionService
 * para la lógica de mapeo colecciones ↔ carpetas.
 *
 * Flujo:
 * 1. Usuario elige carpeta de sincronización (dialog de Tauri)
 * 2. GET /me/sync/colecciones obtiene colecciones + samples
 * 3. Crea carpetas locales por colección, descarga samples nuevos
 * 4. Archivos se nombran con el nombre del servidor
 * 5. El tracking basado en sampleId+coleccionId evita duplicados
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

function obtenerBaseUrl(): string {    const ctx = window.GLORY_CONTEXT as { apiUrl?: string } | undefined;    return ctx?.apiUrl ?? '/wp-json';
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

/* Intervalo para polling de estructura de carpetas del servidor */
let pollingCarpetasInterval: ReturnType<typeof setInterval> | null = null;
const POLLING_CARPETAS_MS = 60_000; /* Cada 60s sincronizar estructura de carpetas */

/* C355: Referencia al módulo de tracking v2, cargado en init */
let trackingModule: typeof import('./syncTrackingService') | null = null;
let collectionModule: typeof import('./syncCollectionService') | null = null;

/*
 * Guard contra auto-trigger del watcher.
 * Cuando syncService descarga archivos a la carpeta local, el watcher lo detecta
 * como "archivo nuevo" e intenta re-subirlo. Este Set guarda las rutas que estamos
 * escribiendo nosotros mismos para que el callback onArchivoNuevo las ignore.
 */
const descargasEnCurso = new Set<string>();
const GRACIA_DESCARGA_MS = 10_000; /* Ignorar creates propios por 10s post-descarga */

/*
 * Inicializa el servicio de sync: carga config, tracking v2 y migra si necesario.
 * C355: Ahora usa syncTrackingService para persistencia tipada.
 */
export async function inicializarSyncService(): Promise<void> {
    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);

        const configGuardada = await store.get<SyncConfig>(STORE_KEY_CONFIG);
        if (configGuardada) config = configGuardada;

        /* Cargar índice v1 legacy por compatibilidad con funciones internas */
        const indiceGuardado = await store.get<ArchivoLocal[]>(STORE_KEY_INDICE);
        if (indiceGuardado) indiceArchivos = indiceGuardado;
    } catch {
        /* Config no disponible — usar defaults */
    }

    /* C355: Inicializar tracking v2 y migrar datos v1 si es primera vez */
    try {
        trackingModule = await import('./syncTrackingService');
        collectionModule = await import('./syncCollectionService');
        await trackingModule.inicializarTracking();

        /* Si no hay datos v2 pero sí v1, migrar automáticamente */
        if (trackingModule.totalArchivos() === 0 && indiceArchivos.length > 0) {
            const migrado = await trackingModule.migrarDesdeV1();
            if (migrado) {
                console.info('[Sync] Migración v1→v2 completada automáticamente');
            }
        }
    } catch (err) {
        console.error('[Sync] Error inicializando tracking v2:', err);
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
 * C355: Busca primero en tracking v2, fallback a índice v1.
 * Retorna la ruta local si existe, null si no.
 */
export function obtenerRutaLocal(sampleId: number): string | null {
    /* v2: buscar en tracking tipado */
    if (trackingModule) {
        const archivo = trackingModule.buscarArchivoPorSampleId(sampleId);
        if (archivo && !archivo.syncDeshabilitado) return archivo.rutaLocal;
    }

    /* v1 fallback */
    const archivo = indiceArchivos.find(a => a.sampleId === sampleId);
    return archivo?.ruta ?? null;
}

/*
 * Mueve un archivo de la raíz de sync a la carpeta "Sin colección" y actualiza tracking.
 * Llamado por uploadQueueService después de subir un sample que estaba en la raíz.
 * Retorna la nueva ruta o null si no se pudo mover.
 */
export async function moverArchivoASinColeccion(
    rutaActual: string,
    nombreArchivo: string,
    sampleId: number,
): Promise<string | null> {
    if (!config.carpetaLocal) return null;

    try {
        const { mkdir, rename } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');

        const carpetaSinCol = await join(config.carpetaLocal, 'Sin colección');
        await mkdir(carpetaSinCol, { recursive: true }).catch(() => { /* ya existe */ });

        const nuevaRuta = await join(carpetaSinCol, nombreArchivo);

        /* Mover el archivo físicamente */
        await rename(rutaActual, nuevaRuta);

        /* Actualizar tracking v2 con nueva ruta */
        if (trackingModule) {
            const archivo = trackingModule.buscarArchivoPorSampleId(sampleId);
            if (archivo) {
                /* Re-registrar con la ruta corregida y coleccionId null */
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

        /* Actualizar índice v1 también */
        const archivoV1 = indiceArchivos.find(a => a.sampleId === sampleId);
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

/*
 * Registra un archivo descargado en el índice local.
 * C355: Registra también en tracking v2 si está disponible.
 */
export async function registrarDescarga(
    sampleId: number,
    ruta: string,
    nombreOriginal: string,
    nombreServidor: string,
    coleccionId?: number | null,
): Promise<void> {
    /* v2: registrar en tracking tipado */
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

    /* v1: mantener índice legacy por compatibilidad */
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
 * Sincroniza la carpeta local con el servidor (v2: basado en colecciones).
 * C355: Delega a syncCollectionService que usa el nuevo endpoint /me/sync/colecciones.
 * Mantiene la firma original para compatibilidad con la API pública.
 * El callback onProgreso se adapta del formato v2 al formato v1 esperado por la UI.
 */
export async function sincronizarConServidor(
    onProgreso?: ProgressCallback,
): Promise<{ nuevos: number; eliminados: number }> {
    if (!config.carpetaLocal || !config.sincronizacionActiva || !estaOnline()) {
        return { nuevos: 0, eliminados: 0 };
    }

    /* C355: Si hay módulo de colecciones disponible, usar sync v2 */
    if (collectionModule) {
        try {
            const resultado = await collectionModule.sincronizarColecciones(
                config.carpetaLocal,
                onProgreso ? (progreso) => {
                    /* Adaptar formato de progreso v2 → v1 */
                    onProgreso({
                        actual: progreso.actual,
                        total: progreso.total,
                        sampleId: progreso.sampleId ?? 0,
                        nombre: progreso.nombre ?? '',
                        estado: progreso.estado === 'omitido' ? 'descargado' : (progreso.estado ?? 'descargando'),
                    });
                } : undefined,
            );

            config.ultimaSync = Date.now();
            await guardarConfig();

            return { nuevos: resultado.nuevos, eliminados: 0 };
        } catch (err) {
            console.error('[Sync] Error en sync v2 (colecciones):', err);
            throw err;
        }
    }

    /* Fallback: sync v1 legacy (basado en carpetas de metadata IA) */
    return sincronizarConServidorV1(onProgreso);
}

/*
 * Sync v1 legacy — mantiene el código original por si el módulo v2 no está disponible.
 * Se eliminará cuando la migración esté completa en todas las instancias.
 */
async function sincronizarConServidorV1(
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

                                    /* Marcar ambas rutas para que el watcher no reaccione al rename */
                                    descargasEnCurso.add(nuevaRuta.replace(/\\/g, '/'));
                                    descargasEnCurso.add(archivoExistente.ruta.replace(/\\/g, '/'));
                                    setTimeout(() => {
                                        descargasEnCurso.delete(nuevaRuta.replace(/\\/g, '/'));
                                        descargasEnCurso.delete(archivoExistente.ruta.replace(/\\/g, '/'));
                                    }, GRACIA_DESCARGA_MS);

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

                        /* Marcar como descarga propia para que el watcher no lo re-suba */
                        descargasEnCurso.add(rutaArchivo.replace(/\\/g, '/'));
                        setTimeout(() => {
                            descargasEnCurso.delete(rutaArchivo.replace(/\\/g, '/'));
                        }, GRACIA_DESCARGA_MS);

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
 * C355: Acepta coleccionId opcional para destino basado en colecciones (v2).
 * Si se pasa coleccionId y hay una colección registrada en tracking, usa
 * la carpeta de esa colección como destino.
 *
 * Flujo:
 * 1. Verifica que hay carpeta local configurada y sync activa.
 * 2. POST /samples/{id}/descargar para obtener URL firmada.
 * 3. Descarga el archivo a carpeta destino (colección o primaria/subcarpeta).
 * 4. Registra en el índice local + tracking v2.
 *
 * Retorna la ruta local del archivo descargado, o null si falla.
 */
export async function sincronizarSampleIndividual(
    sampleId: number,
    carpetaPrimaria?: string,
    carpetaSecundaria?: string,
    coleccionId?: number,
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

        const nombreArchivo = nombre.includes('.') ? nombre : `${nombre}.${formato}`;
        const carpetaBase = config.carpetaLocal;

        /*
         * C355: Determinar carpeta destino.
         * Si hay coleccionId y existe la colección en tracking → usar carpeta de colección.
         * Si no, fallback a lógica v1 (primaria/subcarpeta).
         */
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

        /* Marcar como descarga propia para que el watcher no lo re-suba */
        descargasEnCurso.add(rutaArchivo.replace(/\\/g, '/'));
        setTimeout(() => {
            descargasEnCurso.delete(rutaArchivo.replace(/\\/g, '/'));
        }, GRACIA_DESCARGA_MS);

        await writeFile(rutaArchivo, new Uint8Array(buffer));

        /* Registrar en índice local + tracking v2 */
        await registrarDescarga(sampleId, rutaArchivo, nombre, nombreArchivo, coleccionId ?? null);

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

/* C341: SYNC BIDIRECCIONAL — Watcher + Upload Queue + Estado */

/*
 * Inicializa el sistema de sync bidireccional:
 * 1. Conecta fileWatcherService para detectar archivos nuevos/eliminados
 * 2. Inicializa uploadQueueService para subida automática
 * 3. Inicia observación de la carpeta de sync
 */
async function inicializarSyncBidireccional(): Promise<void> {
    if (!config.carpetaLocal || !config.sincronizacionActiva) return;

    try {
        const { registrarCallbacks, registrarCallbacksCarpeta, iniciarObservacion } = await import('./fileWatcherService');
        const { inicializarUploadQueue, encolarArchivo } = await import('./uploadQueueService');

        /* Registrar callbacks del watcher */
        registrarCallbacks(
            /*
             * Archivo nuevo: verificar no está en el índice por ruta NI por nombre.
             * Buscar por nombre evita re-subir un archivo que ya se descargó del server
             * y el usuario simplemente copió/movió dentro de la carpeta sync.
             */
            (ruta: string, nombreArchivo: string, carpetas: string[]) => {
                const rutaNorm = ruta.replace(/\\/g, '/');

                /* Guard: Ignorar archivos que nosotros mismos acabamos de descargar */
                if (descargasEnCurso.has(rutaNorm)) {
                    console.info('[Sync] Ignorando create propio (descarga en curso):', nombreArchivo);
                    return;
                }

                /* v2: buscar en tracking primero */
                if (trackingModule) {
                    const enTracking = trackingModule.buscarArchivoPorRuta(ruta)
                        ?? trackingModule.buscarArchivoPorNombre(nombreArchivo);
                    if (enTracking) {
                        console.info('[Sync] Archivo ya en tracking v2, ignorando:', nombreArchivo);
                        return;
                    }
                }

                /* v1: Buscar por ruta exacta */
                const porRuta = indiceArchivos.find(
                    a => a.ruta.replace(/\\/g, '/') === rutaNorm,
                );
                if (porRuta) {
                    console.info('[Sync] Archivo ya en índice (por ruta), ignorando:', nombreArchivo);
                    return;
                }

                /*
                 * Buscar por nombre de archivo — un sample descargado del server
                 * que fue movido/copiado dentro de la carpeta sync no debe re-subirse.
                 * Comparamos el nombre completo (con extensión) para evitar false matches.
                 */
                const porNombre = indiceArchivos.find(
                    a => a.nombreServidor === nombreArchivo || a.nombreOriginal === nombreArchivo,
                );
                if (porNombre) {
                    /* Actualizar la ruta en el índice y las carpetas en el servidor */
                    console.info('[Sync] Archivo conocido detectado en nueva ubicación:', nombreArchivo);
                    actualizarRutaYCarpeta(porNombre, ruta, carpetas);
                    return;
                }

                encolarArchivo(ruta, nombreArchivo, carpetas);
            },
            /* Archivo eliminado: marcar como no_sincronizar */
            (ruta: string) => {
                marcarNoSincronizar(ruta);
            },
            /* Archivo movido: actualizar ruta en índice + mover carpeta en servidor */
            (rutaAnterior: string, rutaNueva: string, nombreArchivo: string, carpetas: string[]) => {
                manejarMoveLocal(rutaAnterior, rutaNueva, nombreArchivo, carpetas);
            },
        );

        /*
         * C357: Registrar callbacks de carpetas para sincronizar colecciones.
         * Solo si el módulo de colecciones v2 está disponible.
         */
        if (collectionModule) {
            const colMod = collectionModule;
            registrarCallbacksCarpeta(
                /* Carpeta nueva de nivel 1 → crear colección en servidor */
                (nombre: string, _rutaCompleta: string) => {
                    console.info('[Sync] Carpeta nueva detectada → crear colección:', nombre);
                    colMod.crearColeccionDesdeLocal(nombre).catch(err => {
                        console.error('[Sync] Error creando colección desde carpeta local:', err);
                    });
                },
                /* Carpeta renombrada → renombrar colección en servidor */
                (nombreAnterior: string, nombreNuevo: string, _rutaNueva: string) => {
                    if (!trackingModule) return;
                    const coleccion = trackingModule.buscarColeccionPorCarpeta(nombreAnterior);
                    if (coleccion) {
                        console.info('[Sync] Carpeta renombrada → renombrar colección:', coleccion.id, nombreAnterior, '→', nombreNuevo);
                        colMod.renombrarColeccionEnServidor(coleccion.id, nombreNuevo).catch(err => {
                            console.error('[Sync] Error renombrando colección:', err);
                        });
                        /* Actualizar tracking local */
                        trackingModule.actualizarNombreColeccion(coleccion.id, nombreNuevo, nombreNuevo).catch(err => {
                            console.error('[Sync] Error actualizando nombre local de colección:', err);
                        });
                    } else {
                        /* No se encontró colección — posiblemente es nueva, crearla */
                        console.info('[Sync] Carpeta renombrada sin colección asociada → crear:', nombreNuevo);
                        colMod.crearColeccionDesdeLocal(nombreNuevo).catch(err => {
                            console.error('[Sync] Error creando colección desde rename:', err);
                        });
                    }
                },
            );
        }

        /* Inicializar upload queue (carga items pendientes del store) */
        await inicializarUploadQueue();

        /* Iniciar observación de la carpeta */
        const iniciado = await iniciarObservacion();
        if (iniciado) {
            console.info('[Sync] Sync bidireccional activado');
        }

        /* Polling periódico de carpetas del servidor → crear localmente */
        await sincronizarEstructuraCarpetas();
        pollingCarpetasInterval = setInterval(() => {
            sincronizarEstructuraCarpetas();
        }, POLLING_CARPETAS_MS);
    } catch (err) {
        console.error('[Sync] Error inicializando sync bidireccional:', err);
    }
}

/*
 * Marca un sample como "no sincronizar" por ruta local.
 * Se llama cuando el usuario elimina un archivo de la carpeta sync.
 * El sample NO se borra del servidor — solo deja de sincronizarse.
 * C355: También actualiza tracking v2.
 */
export async function marcarNoSincronizar(ruta: string): Promise<boolean> {
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
    const archivo = indiceArchivos.find(
        a => a.ruta.replace(/\\/g, '/') === rutaNormalizada,
    );

    if (!archivo) {
        /* Si v2 lo encontró, la operación fue exitosa */
        if (trackingModule?.buscarArchivoPorRuta(ruta)) return true;
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
 * C355: También actualiza tracking v2.
 */
export async function marcarNoSincronizarPorId(sampleId: number): Promise<boolean> {
    /* v2: buscar por sampleId y deshabilitar */
    if (trackingModule) {
        const archivoV2 = trackingModule.buscarArchivoPorSampleId(sampleId);
        if (archivoV2) {
            await trackingModule.marcarSyncDeshabilitado(sampleId, archivoV2.coleccionId);
        }
    }

    const archivo = indiceArchivos.find(a => a.sampleId === sampleId);
    if (!archivo) {
        /* Si v2 lo encontró, la operación fue exitosa */
        if (trackingModule?.buscarArchivoPorSampleId(sampleId)) return true;
        return false;
    }

    archivo.syncDeshabilitado = true;
    archivo.rutaEliminada = archivo.ruta;
    await guardarIndice();

    console.info('[Sync] Sample marcado como no_sincronizar por ID:', sampleId);
    return true;
}

/*
 * Reactiva la sincronización de un sample.
 * El archivo se re-descargará en la próxima sincronización.
 * C355: También elimina del tracking v2 para forzar re-descarga.
 */
export async function reactivarSync(sampleId: number): Promise<boolean> {
    let encontradoV2 = false;
    /* v2: eliminar de tracking para que se re-descargue */
    if (trackingModule) {
        encontradoV2 = await trackingModule.reactivarSync(sampleId);
    }

    const archivo = indiceArchivos.find(a => a.sampleId === sampleId);
    if (!archivo && !encontradoV2) return false;

    /* Quitar del índice v1 completamente para que se re-descargue */
    indiceArchivos = indiceArchivos.filter(a => a.sampleId !== sampleId);
    await guardarIndice();

    console.info('[Sync] Sync reactivada para sample:', sampleId, '— se descargará en próxima sync');
    return true;
}

/*
 * Obtiene el estado de sincronización de un sample.
 * C355: Consulta tracking v2 primero, fallback a v1.
 * Retorna: 'sincronizado' | 'no_sincronizar' | 'no_descargado'
 */
export function obtenerEstadoSync(sampleId: number): 'sincronizado' | 'no_sincronizar' | 'no_descargado' {
    /* v2: buscar en tracking tipado primero */
    if (trackingModule) {
        const archivoV2 = trackingModule.buscarArchivoPorSampleId(sampleId);
        if (archivoV2) {
            return archivoV2.syncDeshabilitado ? 'no_sincronizar' : 'sincronizado';
        }
    }

    /* v1 fallback */
    const archivo = indiceArchivos.find(a => a.sampleId === sampleId);
    if (!archivo) return 'no_descargado';
    if (archivo.syncDeshabilitado) return 'no_sincronizar';
    return 'sincronizado';
}

/*
 * Obtiene todos los samples con sync deshabilitado.
 * C355: Incluye datos de tracking v2 para completitud.
 * Para mostrar en la UI del explorador.
 */
export function obtenerSamplesNoSincronizados(): Array<{ sampleId: number; nombre: string }> {
    /* v2: obtener del tracking tipado */
    if (trackingModule) {
        const todos = trackingModule.todosLosArchivos();
        const noSyncV2 = todos
            .filter(a => a.syncDeshabilitado)
            .map(a => ({ sampleId: a.sampleId, nombre: a.nombreLocal }));

        /* Agregar samples de v1 que no estén en v2 */
        const idsV2 = new Set(noSyncV2.map(a => a.sampleId));
        const noSyncV1 = indiceArchivos
            .filter(a => a.syncDeshabilitado && !idsV2.has(a.sampleId))
            .map(a => ({ sampleId: a.sampleId, nombre: a.nombre }));

        return [...noSyncV2, ...noSyncV1];
    }

    /* v1 fallback */
    return indiceArchivos
        .filter(a => a.syncDeshabilitado)
        .map(a => ({ sampleId: a.sampleId, nombre: a.nombre }));
}

/*
 * C358: Obtiene el historial de acciones de sync.
 * Retorna los últimos N eventos del tracking v2.
 */
export function obtenerHistorialSync(limite = 50): Array<{
    tipo: string;
    descripcion: string;
    sampleId?: number;
    coleccionId?: number;
    timestamp: number;
}> {
    if (!trackingModule) return [];
    return trackingModule.obtenerHistorial(limite);
}

/*
 * C358: Obtiene información de colecciones sincronizadas.
 * Para mostrar el mapeo colecciones ↔ carpetas en el panel.
 */
export function obtenerColeccionesSync(): Array<{
    id: number;
    nombre: string;
    carpetaLocal: string;
    archivos: number;
}> {
    if (!trackingModule) return [];
    const colecciones = trackingModule.todasLasColecciones();
    const resultado = colecciones.map(col => ({
        id: col.id,
        nombre: col.nombre,
        carpetaLocal: col.carpetaLocal,
        archivos: trackingModule!.listarArchivosPorColeccion(col.id).length,
    }));

    /* Incluir "Sin colección" como entrada virtual (id=0) si hay samples sueltos */
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

/*
 * C358: Fuerza una re-sincronización completa.
 * Resetea el tracking v2 y ejecuta sincronizarConServidor de nuevo
 * para que todos los archivos se re-evalúen.
 */
export async function forzarResync(
    onProgreso?: ProgressCallback,
): Promise<{ nuevos: number; eliminados: number }> {
    /* Resetear tracking v2 */
    if (trackingModule) {
        await trackingModule.resetearTracking();
        await trackingModule.registrarAccion({
            tipo: 'creado',
            descripcion: 'Re-sync forzada por el usuario',
        });
    }

    /* Limpiar índice v1 también */
    indiceArchivos = [];
    await guardarIndice();

    /* Re-ejecutar sync completa */
    return sincronizarConServidor(onProgreso);
}

/*
 * Detiene el watcher si está activo (para cleanup al cerrar).
 */
export async function detenerSyncBidireccional(): Promise<void> {
    if (pollingCarpetasInterval) {
        clearInterval(pollingCarpetasInterval);
        pollingCarpetasInterval = null;
    }
    try {
        const { detenerObservacion } = await import('./fileWatcherService');
        await detenerObservacion();
    } catch {
        /* Ignorar si no se importó */
    }
}

/*
 * Sincroniza la estructura de carpetas del servidor a disco local.
 * C357: En v2, delega a collectionModule para sincronizar colecciones.
 * En v1, crea carpetas basadas en la estructura de metadata IA.
 * Se ejecuta periódicamente y al iniciar sync bidireccional.
 */
async function sincronizarEstructuraCarpetas(): Promise<void> {
    if (!config.carpetaLocal || !estaOnline()) return;

    /* C357: v2 — sincronizar colecciones silenciosamente (sin progreso) */
    if (collectionModule) {
        try {
            await collectionModule.sincronizarColecciones(config.carpetaLocal);
        } catch (err) {
            console.error('[Sync] Error en polling de colecciones v2:', err);
        }
        return;
    }

    /* v1 fallback: crear carpetas basadas en metadata IA */
    try {
        const { mkdir } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const baseUrl = obtenerBaseUrl();

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
        console.error('[Sync] Error sincronizando estructura de carpetas:', err);
    }
}

/*
 * Maneja un MOVE local (archivo movido de una carpeta a otra dentro de sync).
 * 1. Actualiza la ruta en el índice local
 * 2. Calcula nuevas carpeta_primaria/secundaria desde la ruta
 * 3. Llama PUT /me/coleccionados/{id}/carpeta para sincronizar con el server
 */
async function manejarMoveLocal(
    rutaAnterior: string,
    rutaNueva: string,
    _nombreArchivo: string,
    carpetas: string[],
): Promise<void> {
    const rutaAntNorm = rutaAnterior.replace(/\\/g, '/');
    const archivo = indiceArchivos.find(
        a => a.ruta.replace(/\\/g, '/') === rutaAntNorm,
    );

    if (!archivo) {
        console.warn('[Sync] Move: archivo no encontrado en índice por ruta anterior:', rutaAnterior);
        return;
    }

    /* Actualizar ruta local en el índice */
    archivo.ruta = rutaNueva;
    /* Si estaba marcado como no_sincronizar por un delete previo, reactivar */
    if (archivo.syncDeshabilitado) {
        archivo.syncDeshabilitado = false;
        archivo.rutaEliminada = undefined;
    }
    await guardarIndice();

    /* Mover en el servidor: carpetas[0] = primaria, carpetas[1] = secundaria */
    const primaria = carpetas[0] || 'General';
    const secundaria = carpetas[1] || '';
    await moverSampleEnServidor(archivo.sampleId, primaria, secundaria);

    console.info('[Sync] Move procesado: sample', archivo.sampleId, '→', primaria, secundaria || '(raíz)');
}

/*
 * Actualiza la ruta de un archivo conocido detectado en nueva ubicación.
 * Sucede cuando un archivo del índice aparece con nombre igual pero ruta distinta
 * (ej: copiado entre subcarpetas). No encola upload — solo actualiza ubicación.
 */
async function actualizarRutaYCarpeta(
    archivo: ArchivoLocal,
    rutaNueva: string,
    carpetas: string[],
): Promise<void> {
    archivo.ruta = rutaNueva;
    if (archivo.syncDeshabilitado) {
        archivo.syncDeshabilitado = false;
        archivo.rutaEliminada = undefined;
    }
    await guardarIndice();

    /* Sincronizar ubicación con el servidor */
    const primaria = carpetas[0] || 'General';
    const secundaria = carpetas[1] || '';
    await moverSampleEnServidor(archivo.sampleId, primaria, secundaria);
}

/*
 * Llama al endpoint PUT /me/coleccionados/{id}/carpeta para mover
 * un sample a otra carpeta en el servidor.
 * Las carpetas se crean implícitamente en el backend si no existen.
 */
async function moverSampleEnServidor(
    sampleId: number,
    carpetaPrimaria: string,
    carpetaSecundaria: string,
): Promise<boolean> {
    if (!estaOnline()) {
        console.warn('[Sync] Sin conexión, move en servidor pospuesto para sample:', sampleId);
        return false;
    }

    try {
        const baseUrl = obtenerBaseUrl();
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
