/*
 * Servicio: syncState — Estado compartido del sistema de sincronización.
 *
 * Centraliza el estado mutable (config, índice v1, refs a módulos v2)
 * y la persistencia en Tauri Store. Importado por todos los módulos sync
 * que necesitan acceso al estado sin crear dependencias circulares.
 *
 * Responsabilidad: estado + persistencia. Sin lógica de negocio.
 */

import { esDesktop } from './desktopService';
import { persistirConDebounce, flushPersistencia } from './persistenciaDebounce';

/* Tipos del sistema sync */

export interface CarpetaInfo {
    primaria: string;
    total: number;
    subcarpetas: Array<{ nombre: string; total: number }>;
}

export interface SampleBasico {
    id: number;
    titulo: string;
    metadata?: {
        carpeta_primaria?: string;
        carpeta_secundaria?: string;
        [key: string]: unknown;
    };
}

export interface ResultadoDescargaApi {
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

export interface SyncConfig {
    carpetaLocal: string | null;
    sincronizacionActiva: boolean;
    ultimaSync: number;
}

/**
 * Configuración avanzada de sync, persistida por separado.
 * Controla: paralelismo, throttle, borrado bidireccional, papelera.
 */
export interface SyncConfigAvanzada {
    velocidadMaximaSubidaMbps: number;       /* 0 = sin límite */
    archivosParalelos: number;                /* 1-5, default 1 */
    borrarEnServidorAlBorrarLocal: boolean;   /* default false */
    borrarEnLocalAlBorrarEnServidor: boolean; /* default false */
    papeleraActiva: boolean;                  /* default true */
    papeleraDuracionDias: number;             /* default 30 */
}

export const CONFIG_AVANZADA_DEFAULT: SyncConfigAvanzada = {
    velocidadMaximaSubidaMbps: 0,
    archivosParalelos: 1,
    borrarEnServidorAlBorrarLocal: false,
    borrarEnLocalAlBorrarEnServidor: false,
    papeleraActiva: true,
    papeleraDuracionDias: 30,
};

export interface ArchivoLocal {
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

/* Constantes de persistencia */
export const STORE_FILE = 'sync-config.json';
export const STORE_KEY_CONFIG = 'sync_config';
export const STORE_KEY_INDICE = 'sync_indice';
export const STORE_KEY_CONFIG_AVANZADA = 'sync_config_avanzada';
export const POLLING_CARPETAS_MS = 60_000;

/*
 * Estado global mutable del sync.
 * Objeto compartido por referencia entre todos los módulos sync.
 * Esto evita problemas con re-exports de variables mutables en ESM.
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
        console.error('[SyncState] Error guardando config:', err);
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
        console.error('[SyncState] Error guardando config avanzada:', err);
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
        }
    } catch (err) {
        console.error('[SyncState] Error cargando config avanzada:', err);
    }

    return { ...estado.configAvanzada };
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
