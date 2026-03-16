/*
 * Servicio: syncState — Estado compartido del sistema de sincronización.
 *
 * Centraliza el estado mutable (config, índice v1, refs a módulos v2)
 * y la persistencia en Tauri Store. Importado por todos los módulos sync
 * que necesitan acceso al estado sin crear dependencias circulares.
 *
 * Tipos y constantes viven en syncConstants.ts (sin dependencias),
 * y se re-exportan aquí para compatibilidad con importadores existentes.
 *
 * Responsabilidad: estado + persistencia. Sin lógica de negocio.
 */

import { esDesktop } from './desktopService';
import { persistirConDebounce, flushPersistencia } from './persistenciaDebounce';
import { logSync } from './syncLogger';

/* Re-exportar tipos y constantes desde módulo sin dependencias */
export type {
    SyncConfig,
    SyncConfigAvanzada,
    ArchivoLocal,
    CarpetaInfo,
    SampleBasico,
    ResultadoDescargaApi,
    ProgresoSync,
    ProgressCallback,
} from './syncConstants';

export {
    CONFIG_AVANZADA_DEFAULT,
    STORE_FILE,
    STORE_KEY_CONFIG,
    STORE_KEY_INDICE,
    STORE_KEY_CONFIG_AVANZADA,
    STORE_KEY_CURSOR_DELTA,
    POLLING_CARPETAS_MS,
} from './syncConstants';

import type {
    SyncConfig,
    SyncConfigAvanzada,
    ArchivoLocal,
} from './syncConstants';
import {
    CONFIG_AVANZADA_DEFAULT,
    STORE_FILE,
    STORE_KEY_CONFIG,
    STORE_KEY_INDICE,
    STORE_KEY_CONFIG_AVANZADA,
    STORE_KEY_CURSOR_DELTA,
    POLLING_CARPETAS_MS,
} from './syncConstants';

/*
 * Estado global mutable del sync.
 * Objeto compartido por referencia entre todos los módulos sync.
 * Esto evita problemas con re-exports de variables mutables en ESM.
 *
 * TM2: En JavaScript single-threaded las mutaciones no son verdaderamente concurrentes,
 * pero pueden intercalarse en puntos de `await`. Las operaciones críticas de tracking v2
 * pasan por el journal (syncJournal.ts) que serializa escrituras. El indiceArchivos legacy
 * (v1) puede recibir mutaciones intercaladas pero está en deprecación progresiva.
 * TO-DO: Eliminar indiceArchivos y estado.indiceArchivosPor* una vez que v1 esté deshabilitado.
 */
export const estado = {
    config: {
        carpetaLocal: null,
        sincronizacionActiva: false,
        ultimaSync: 0,
    } as SyncConfig,

    configAvanzada: { ...CONFIG_AVANZADA_DEFAULT } as SyncConfigAvanzada,

    indiceArchivos: [] as ArchivoLocal[],

    /*
     * Índices secundarios O(1) para evitar find() O(n) en watcher callbacks.
     * Se reconstruyen al cargar/modificar indiceArchivos.
     */
    indiceArchivosPorRuta: new Map<string, ArchivoLocal>(),
    indiceArchivosPorNombre: new Map<string, ArchivoLocal>(),

    /* C355: Módulos v2 cargados dinámicamente en init */
    trackingModule: null as typeof import('./syncTrackingService') | null,
    collectionModule: null as typeof import('./syncCollectionService') | null,

    /* Intervalo para polling de estructura de carpetas del servidor */
    pollingCarpetasInterval: null as ReturnType<typeof setInterval> | null,

    /* F2.1: Cursor delta sync — posición actual en el changelog del servidor.
     * 0 = primera sync (descarga completa). >0 = delta incremental desde ese punto. */
    ultimoCursorDelta: 0,

    /* F2.2: Intervalo adaptivo de polling basado en actividad */
    intervaloPollingMs: POLLING_CARPETAS_MS,
};

/* Persistencia */

export async function guardarConfig(): Promise<void> {
    if (!esDesktop()) return;
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.set(STORE_KEY_CONFIG, estado.config);
        await store.save();
    } catch (err) {
        logSync.error('syncState', 'Error guardando config', { error: err instanceof Error ? err.message : String(err) });
    }
}

/**
 * Persiste el índice de archivos con debounce.
 * En batch de 1000 archivos, esto reduce 1000 escrituras a ~1.
 */
export function guardarIndice(): void {
    if (!esDesktop()) return;
    persistirConDebounce(
        'sync_indice',
        STORE_FILE,
        STORE_KEY_INDICE,
        estado.indiceArchivos,
    );
}

/**
 * Fuerza la persistencia inmediata del índice.
 * Usar al final de operaciones críticas o antes de cerrar.
 */
export async function flushIndice(): Promise<void> {
    await flushPersistencia('sync_indice');
}

/**
 * Persiste la configuración avanzada.
 */
export async function guardarConfigAvanzada(): Promise<void> {
    if (!esDesktop()) return;
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.set(STORE_KEY_CONFIG_AVANZADA, estado.configAvanzada);
        await store.save();
    } catch (err) {
        logSync.error('syncState', 'Error guardando config avanzada', { error: err instanceof Error ? err.message : String(err) });
    }
}

/**
 * Carga la configuración avanzada del store.
 * Se llama durante inicialización del sync.
 */
export async function cargarConfigAvanzada(): Promise<SyncConfigAvanzada> {
    if (!esDesktop()) return { ...CONFIG_AVANZADA_DEFAULT };

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        const guardada = await store.get<SyncConfigAvanzada>(STORE_KEY_CONFIG_AVANZADA);
        if (guardada) {
            /* Merge con defaults para campos nuevos que no existan en versiones anteriores */
            estado.configAvanzada = { ...CONFIG_AVANZADA_DEFAULT, ...guardada };
            /* QL63: Enforcement de exclusion mutua — si ambos flags estan activos, priorizar borrarAlSubirExitoso */
            if (estado.configAvanzada.borrarAlSubirExitoso && estado.configAvanzada.borrarEnServidorAlBorrarLocal) {
                estado.configAvanzada.borrarEnServidorAlBorrarLocal = false;
            }
        }
    } catch (err) {
        console.error('[SyncState] Error cargando config avanzada:', err);
    }

    return { ...estado.configAvanzada };
}

/* F2.1: Persistencia del cursor delta para delta sync */

export async function cargarCursorDelta(): Promise<void> {
    if (!esDesktop()) return;
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        const cursor = await store.get<number>(STORE_KEY_CURSOR_DELTA);
        if (typeof cursor === 'number' && cursor > 0) {
            estado.ultimoCursorDelta = cursor;
        }
    } catch {
        /* Cursor no disponible — arranca desde 0 (full sync) */
    }
}

export async function guardarCursorDelta(): Promise<void> {
    if (!esDesktop() || estado.ultimoCursorDelta <= 0) return;
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.set(STORE_KEY_CURSOR_DELTA, estado.ultimoCursorDelta);
        await store.save();
    } catch (err) {
        logSync.error('syncState', 'Error guardando cursor delta', { error: err instanceof Error ? err.message : String(err) });
    }
}

/* Índices secundarios O(1) */

/**
 * Reconstruye los índices Map a partir del array indiceArchivos.
 * Llamar después de cargar datos o modificar el array completo.
 */
export function reconstruirIndicesArchivos(): void {
    estado.indiceArchivosPorRuta.clear();
    estado.indiceArchivosPorNombre.clear();

    for (const archivo of estado.indiceArchivos) {
        const rutaNorm = archivo.ruta.replace(/\\/g, '/');
        estado.indiceArchivosPorRuta.set(rutaNorm, archivo);

        if (archivo.nombreServidor) {
            estado.indiceArchivosPorNombre.set(archivo.nombreServidor, archivo);
        }
        if (archivo.nombreOriginal && archivo.nombreOriginal !== archivo.nombreServidor) {
            estado.indiceArchivosPorNombre.set(archivo.nombreOriginal, archivo);
        }
    }
}

/**
 * Busca un archivo en el índice por ruta normalizada. O(1).
 */
export function buscarEnIndicePorRuta(ruta: string): ArchivoLocal | undefined {
    return estado.indiceArchivosPorRuta.get(ruta.replace(/\\/g, '/'));
}

/**
 * Busca un archivo en el índice por nombre. O(1).
 */
export function buscarEnIndicePorNombre(nombre: string): ArchivoLocal | undefined {
    return estado.indiceArchivosPorNombre.get(nombre);
}

/**
 * Actualiza los índices cuando se modifica un archivo existente.
 */
export function actualizarIndiceArchivo(archivo: ArchivoLocal, rutaAnterior?: string): void {
    /* Limpiar entrada anterior si la ruta cambió */
    if (rutaAnterior) {
        estado.indiceArchivosPorRuta.delete(rutaAnterior.replace(/\\/g, '/'));
    }

    const rutaNorm = archivo.ruta.replace(/\\/g, '/');
    estado.indiceArchivosPorRuta.set(rutaNorm, archivo);

    if (archivo.nombreServidor) {
        estado.indiceArchivosPorNombre.set(archivo.nombreServidor, archivo);
    }
    if (archivo.nombreOriginal && archivo.nombreOriginal !== archivo.nombreServidor) {
        estado.indiceArchivosPorNombre.set(archivo.nombreOriginal, archivo);
    }
}
