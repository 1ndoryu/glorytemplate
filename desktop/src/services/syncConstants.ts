/*
 * Constantes y tipos del sistema de sincronización.
 *
 * Archivo SIN dependencias externas — importable desde cualquier
 * ventana (main, sync, config) sin arrastrar el árbol completo de
 * servicios sync. syncState.ts re-exporta desde aquí para mantener
 * compatibilidad con importadores existentes.
 */

/* Tipos compartidos */

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
    borrarAlSubirExitoso: boolean;            /* default false — elimina archivo local tras upload exitoso */
    papeleraActiva: boolean;                  /* default true */
    papeleraDuracionDias: number;             /* default 30 */
}

export const CONFIG_AVANZADA_DEFAULT: SyncConfigAvanzada = {
    velocidadMaximaSubidaMbps: 0,
    archivosParalelos: 1,
    borrarEnServidorAlBorrarLocal: false,
    borrarEnLocalAlBorrarEnServidor: false,
    borrarAlSubirExitoso: false,
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
    syncDeshabilitado?: boolean;
    rutaEliminada?: string;
}

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

/* Constantes de persistencia */
export const STORE_FILE = 'sync-config.json';
export const STORE_KEY_CONFIG = 'sync_config';
export const STORE_KEY_INDICE = 'sync_indice';
export const STORE_KEY_CONFIG_AVANZADA = 'sync_config_avanzada';
export const STORE_KEY_CURSOR_DELTA = 'sync_cursor_delta';
export const POLLING_CARPETAS_MS = 60_000;
