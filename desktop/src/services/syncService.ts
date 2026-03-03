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
import {
    marcarDescargaEnCurso,
    marcarMovimientoInterno,
    obtenerBaseUrlSync,
    adquirirLockSync,
    registrarSyncActiva,
    liberarLockSync,
    esSyncEnCurso,
} from './syncGuards';
import {
    estado,
    guardarConfig,
    guardarIndice,
    cargarConfigAvanzada,
    reconstruirIndicesArchivos,
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

    /* Reconstruir índices O(1) para lookups rápidos del watcher */
    reconstruirIndicesArchivos();

    /* Cargar configuración avanzada (paralelismo, throttle, papelera) */
    await cargarConfigAvanzada();

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

    /* Escuchar evento de la ventana config-sync para refrescar config en memoria */
    try {
        const { listen } = await import('@tauri-apps/api/event');
        await listen('config-sync-actualizada', async () => {
            console.info('[Sync] Config actualizada desde ventana independiente, recargando...');
            await cargarConfigAvanzada();
        });
    } catch (err) {
        console.error('[Sync] Error registrando listener de config:', err);
    }

    /* Rehidratar imágenes de portada de samples ya sincronizados que no las tienen.
     * Se lanza en background (no bloquea inicialización). */
    rehidratarImagenesPendientes().catch(() => {});
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
        console.error('[Sync] Error abriendo carpeta local:', err);
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

/* Historial de acciones (wrapper público) */

/*
 * Registra una acción en el historial del panel de sync.
 * Wrapper público de trackingModule.registrarAccion() para que otros servicios
 * (uploadQueueService) puedan escribir historial sin acceso directo al tracking.
 */
export async function registrarAccionHistorial(datos: {
    tipo: string;
    descripcion: string;
    sampleId?: number;
    coleccionId?: number;
}): Promise<void> {
    const { trackingModule } = estado;
    if (!trackingModule) return;
    /* El tipo se valida por TipoAccionHistorial en el tracking module.
     * Hacemos cast seguro porque los callers internos usan tipos conocidos. */
    await trackingModule.registrarAccion(datos as Omit<import('./syncTrackingService').AccionHistorial, 'timestamp'>);
}

/* Registro de subidas locales */

/*
 * Registra un archivo subido desde carpeta local:
 * - actualiza índice/tracking igual que una descarga
 * - agrega entrada de historial tipo "subida" para feedback persistente en panel
 */
export async function registrarSubidaLocal(
    sampleId: number,
    ruta: string,
    nombreArchivo: string,
    coleccionId?: number | null,
): Promise<void> {
    await registrarDescarga(sampleId, ruta, nombreArchivo, nombreArchivo, coleccionId);

    const { trackingModule } = estado;
    if (!trackingModule) return;

    await trackingModule.registrarAccion({
        tipo: 'subida',
        descripcion: `Archivo subido: "${nombreArchivo}"`,
        sampleId,
        coleccionId: coleccionId ?? undefined,
    });

    /* Historial per-sample v2: marcar como sincronizado */
    if (trackingModule.actualizarEstadoSample) {
        await trackingModule.actualizarEstadoSample({
            sampleId,
            nombreArchivo,
            estado: 'sincronizado',
            rutaLocal: ruta,
        });
    }
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

        /*
         * FIX: Marcar la nueva ruta como "descarga en curso" ANTES del rename.
         * El rename produce un evento CREATE en el watcher que, sin este guard,
         * genera una subida duplicada por race condition:
         * el watcher detecta el CREATE antes de que el tracking se actualice.
         *
         * También marcar la ruta ORIGINAL como movimiento interno para que
         * el evento DELETE no dispare manejarBorradoLocal → softDeleteEnServidor
         * si la actualización de tracking falla.
         */
        marcarDescargaEnCurso(nuevaRuta);
        marcarMovimientoInterno(rutaActual);

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

            /* Historial per-sample v2: actualizar ruta tras mover */
            if (trackingModule.actualizarEstadoSample) {
                await trackingModule.actualizarEstadoSample({
                    sampleId,
                    nombreArchivo,
                    estado: 'sincronizado',
                    rutaLocal: nuevaRuta,
                    coleccionNombre: 'Sin colección',
                });
            }
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
        console.info('[Sync] Sync ya en curso, esperando resultado existente...');
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

/**
 * Upsert en historial per-sample: actualiza el estado de un sample existente
 * o crea nueva entrada. Un sample = una fila, estado mutable.
 */
export async function actualizarEstadoSampleHistorial(datos: {
    sampleId: number;
    nombreArchivo: string;
    estado: string;
    imagenUrl?: string | null;
    rutaLocal?: string | null;
    coleccionNombre?: string;
    error?: string;
}): Promise<void> {
    const { trackingModule } = estado;
    if (!trackingModule?.actualizarEstadoSample) return;
    await trackingModule.actualizarEstadoSample(
        datos as Parameters<typeof trackingModule.actualizarEstadoSample>[0],
    );
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

const REHIDRATAR_IMAGENES_INTERVALO_MS = 60_000;
let ultimaRehidratacionImagenes = 0;

/**
 * Rehidratación periódica de portadas para entradas del historial sin imagen.
 * Diseñada para ser llamada frecuentemente (ej: polling UI); tiene throttle interno.
 */
export async function rehidratarImagenesPendientesSync(): Promise<void> {
    const ahora = Date.now();
    if (ahora - ultimaRehidratacionImagenes < REHIDRATAR_IMAGENES_INTERVALO_MS) return;
    ultimaRehidratacionImagenes = ahora;
    await rehidratarImagenesPendientes();
}

export async function rehidratarImagenesPendientesForzadoSync(): Promise<void> {
    const ahora = Date.now();
    /* Forzado: permite rehidratación inmediata tras upload exitoso,
     * pero actualiza marca temporal para evitar tormenta de requests. */
    ultimaRehidratacionImagenes = ahora;
    await rehidratarImagenesPendientes();
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

/*
 * Rehidrata imágenes de portada para entradas del historial que no las tienen.
 * Usa batch fetch: GET /samples?creador=username para obtener todas las imágenes
 * del usuario en una sola request, luego mapea sampleId → imagenUrl.
 *
 * Se lanza en background al inicializar el sync service. No bloquea el flujo.
 * Solo procesa entradas con sampleId > 0 y imagenUrl === null.
 */
async function rehidratarImagenesPendientes(): Promise<void> {
    const { trackingModule, collectionModule } = estado;
    if (!trackingModule?.obtenerHistorialSamples || !trackingModule?.actualizarEstadoSample) return;
    if (!collectionModule?.obtenerColeccionesDelServidor) return;
    if (!estaOnline()) return;

    const historial = trackingModule.obtenerHistorialSamples(100);
    const sinImagen = historial.filter(e => e.sampleId > 0 && !e.imagenUrl);
    if (sinImagen.length === 0) return;

    try {
        const datos = await collectionModule.obtenerColeccionesDelServidor();
        if (!datos) return;

        /* Construir mapa sampleId → imagenUrl para O(1) lookup desde snapshot de sync. */
        const mapaImagenes = new Map<number, string>();
        for (const coleccion of datos.colecciones) {
            for (const sample of coleccion.samples) {
                const imagen = sample.imagenUrl ?? sample.imagen_url ?? null;
                if (sample.id && imagen) {
                    mapaImagenes.set(sample.id, imagen);
                }
            }
        }
        for (const sample of datos.sinColeccion) {
            const imagen = sample.imagenUrl ?? sample.imagen_url ?? null;
            if (sample.id && imagen) {
                mapaImagenes.set(sample.id, imagen);
            }
        }

        /* Actualizar entradas sin imagen que encontramos en el batch */
        let actualizadas = 0;
        for (const entrada of sinImagen) {
            const urlImagen = mapaImagenes.get(entrada.sampleId);
            if (urlImagen) {
                await trackingModule.actualizarEstadoSample({
                    sampleId: entrada.sampleId,
                    nombreArchivo: entrada.nombreArchivo,
                    estado: entrada.estado,
                    imagenUrl: urlImagen,
                });
                actualizadas++;
            }
        }

        if (actualizadas > 0) {
            console.info(`[Sync] Rehidratadas ${actualizadas} imágenes de samples en historial`);
        }
    } catch (err) {
        console.error('[Sync] Error rehidratando imágenes pendientes:', err);
    }
}
