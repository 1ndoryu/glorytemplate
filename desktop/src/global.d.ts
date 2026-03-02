/*
 * Declaraciones de tipos para globals del proyecto
 * Kamples Desktop + plugins sin tipos oficiales.
 */

/* Globals inyectados por main.tsx */
interface Window {
    __GLORY_ROUTES__?: Record<string, { island: string; props?: Record<string, unknown> }>;
    __KAMPLES_DESKTOP__?: boolean;
    __KAMPLES_VERSION__?: string;
    __TAURI_INTERNALS__?: unknown;
    GLORY_CONTEXT?: {
        apiUrl?: string;
        restUrl?: string;
        nonce?: string;
        isLoggedIn?: boolean;
        userId?: unknown;
    };
    /* C341: Sync bidireccional — funciones expuestas en window */
    __KAMPLES_SYNC__?: {
        elegirCarpetaSync: () => Promise<string | null>;
        toggleSincronizacion: (activa: boolean) => Promise<void>;
        obtenerConfigSync: () => { carpetaLocal: string | null; sincronizacionActiva: boolean; ultimaSync: number };
        sincronizarConServidor: (onProgreso?: (progreso: { actual: number; total: number; sampleId: number; nombre: string; estado: 'descargando' | 'descargado' | 'error'; tamano?: number; ruta?: string }) => void) => Promise<{ nuevos: number; eliminados: number }>;
        sincronizarSampleIndividual: (sampleId: number, carpetaPrimaria?: string, carpetaSecundaria?: string, coleccionId?: number) => Promise<string | null>;
        obtenerRutaLocal: (sampleId: number) => string | null;
        abrirCarpetaSync: () => Promise<boolean>;
        obtenerEstadoSync: (sampleId: number) => 'sincronizado' | 'no_sincronizar' | 'no_descargado';
        marcarNoSincronizarPorId: (sampleId: number) => Promise<boolean>;
        reactivarSync: (sampleId: number) => Promise<boolean>;
        obtenerSamplesNoSincronizados: () => Array<{ sampleId: number; nombre: string }>;
        /* C358: Historial y resync */
        obtenerHistorialSync: (limite?: number) => Array<{ tipo: string; descripcion: string; sampleId?: number; coleccionId?: number; timestamp: number }>;
        obtenerHistorialSamplesSync: (limite?: number) => Array<{ sampleId: number; nombreArchivo: string; estado: 'detectado' | 'subiendo' | 'sincronizado' | 'error' | 'moviendo' | 'descargando' | 'descargado'; imagenUrl: string | null; rutaLocal: string | null; coleccionNombre?: string; timestampCreado: number; timestampActualizado: number; error?: string }>;
        obtenerColeccionesSync: () => Array<{ id: number; nombre: string; carpetaLocal: string; archivos: number }>;
        forzarResync: (onProgreso?: (progreso: { actual: number; total: number; sampleId: number; nombre: string; estado: 'descargando' | 'descargado' | 'error'; tamano?: number; ruta?: string }) => void) => Promise<{ nuevos: number; eliminados: number }>;
        haySyncEnCurso: () => boolean;
        limpiarHistorialSync: () => Promise<void>;
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
    /* Configuración del servidor para apiDesktopAdapter */
    __KAMPLES_CONFIG__?: {
        serverUrl?: string;
    };
}

/* Declaraciones para @crabnebula/tauri-plugin-drag */
declare module '@crabnebula/tauri-plugin-drag' {
    interface DragOptions {
        item: string[];
        icon?: string;
    }
    export function startDrag(options: DragOptions): Promise<void>;
}
