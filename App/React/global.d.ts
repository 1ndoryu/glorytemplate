/*
 * Extensiones de Window para globals inyectados por desktop/main.tsx.
 * Necesario para hooks que acceden a window.__KAMPLES_* sin (window as any).
 */

/* Progreso reportado por sincronizarConServidor() en cada archivo */
interface ProgresoSyncGlobal {
    actual: number;
    total: number;
    sampleId: number;
    nombre: string;
    estado: 'descargando' | 'descargado' | 'error';
    tamano?: number;
    ruta?: string;
}

interface Window {
    __KAMPLES_DESKTOP__?: boolean;
    __KAMPLES_VERSION__?: string;
    __KAMPLES_SYNC__?: {
        elegirCarpetaSync: () => Promise<string | null>;
        toggleSincronizacion: (activa: boolean) => Promise<void>;
        obtenerConfigSync: () => { carpetaLocal: string | null; sincronizacionActiva: boolean; ultimaSync: number };
        sincronizarConServidor: (onProgreso?: (p: ProgresoSyncGlobal) => void) => Promise<{ nuevos: number; eliminados: number }>;
        sincronizarSampleIndividual: (sampleId: number, carpetaPrimaria?: string, carpetaSecundaria?: string) => Promise<string | null>;
        obtenerRutaLocal: (sampleId: number) => string | null;
        obtenerEstadoSync: (sampleId: number) => 'sincronizado' | 'no_sincronizar' | 'no_descargado';
        marcarNoSincronizarPorId: (sampleId: number) => Promise<boolean>;
        reactivarSync: (sampleId: number) => Promise<boolean>;
        obtenerSamplesNoSincronizados: () => Array<{ sampleId: number; nombre: string }>;
    };
    __KAMPLES_UPLOAD__?: {
        obtenerEstadoCola: () => { items: unknown[]; totalPendientes: number; totalErrores: number; procesando: boolean };
        onProgresoUpload: (cb: (progreso: unknown) => void) => void;
        reintentarItem: (itemId: string) => Promise<void>;
        eliminarItemCola: (itemId: string) => Promise<void>;
    };
    __KAMPLES_DRAG__?: {
        iniciarDragNativo: (sampleId: number, urlRemota: string, nombreArchivo: string) => Promise<boolean>;
    };
    __TAURI_INTERNALS__?: unknown;
}
