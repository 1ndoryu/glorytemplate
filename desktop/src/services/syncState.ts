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

    indiceArchivos: [] as ArchivoLocal[],

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
    } catch { /* silencioso */ }
}

export async function guardarIndice(): Promise<void> {
    if (!esDesktop()) return;
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.set(STORE_KEY_INDICE, estado.indiceArchivos);
        await store.save();
    } catch { /* silencioso */ }
}
