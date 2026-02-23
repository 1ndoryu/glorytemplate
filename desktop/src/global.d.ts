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
    };
    /* C341: Sync bidireccional — funciones expuestas en window */
    __KAMPLES_SYNC__?: {
        elegirCarpetaSync: () => Promise<string | null>;
        toggleSincronizacion: (activa: boolean) => Promise<void>;
        obtenerConfigSync: () => { carpetaLocal: string | null; sincronizacionActiva: boolean; ultimaSync: number };
        sincronizarConServidor: (onProgreso?: unknown) => Promise<{ nuevos: number; eliminados: number }>;
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
        iniciarDragNativo: (rutaArchivo: string, iconoUrl: string) => Promise<void>;
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
