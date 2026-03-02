/*
 * Extensiones de Window para globals inyectados por el tema (Glory) y desktop/main.tsx.
 * Necesario para hooks que acceden a window.__KAMPLES_* y GLORY_CONTEXT sin (window as any).
 *
 * IMPORTANTE: GloryContext está definido en Glory/assets/react/src/types/glory.ts.
 * Aquí se extiende (declaration merging) para agregar los campos específicos de Kamples
 * que PHP inyecta vía el filtro glory_react_context en config.php.
 * No redeclarar Window.GLORY_CONTEXT — ya está declarado en glory.ts como Partial<GloryContext>.
 */

/*
 * Extensión del GloryContext de Glory con campos inyectados por Kamples (config.php).
 * Declaration merging: los campos se fusionan con la interfaz base de Glory.
 */
interface GloryContext {
    isLoggedIn?: boolean;
    /* userId omitido — ya declarado como number | undefined en glory.ts */
    devMode?: boolean;
    currentUser?: {
        id: number;
        username: string;
        email: string;
        nombreVisible: string;
        avatarUrl: string | null;
    };
}

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
    /* GLORY_CONTEXT ya está declarado en Glory/assets/react/src/types/glory.ts */
    __KAMPLES_DESKTOP__?: boolean;
    __KAMPLES_VERSION__?: string;
    __KAMPLES_SYNC__?: {
        elegirCarpetaSync: () => Promise<string | null>;
        toggleSincronizacion: (activa: boolean) => Promise<void>;
        obtenerConfigSync: () => { carpetaLocal: string | null; sincronizacionActiva: boolean; ultimaSync: number };
        sincronizarConServidor: (onProgreso?: (p: ProgresoSyncGlobal) => void) => Promise<{ nuevos: number; eliminados: number }>;
        sincronizarSampleIndividual: (sampleId: number, carpetaPrimaria?: string, carpetaSecundaria?: string, coleccionId?: number) => Promise<string | null>;
        obtenerRutaLocal: (sampleId: number) => string | null;
        abrirCarpetaSync: () => Promise<boolean>;
        obtenerEstadoSync: (sampleId: number) => 'sincronizado' | 'no_sincronizar' | 'no_descargado';
        marcarNoSincronizarPorId: (sampleId: number) => Promise<boolean>;
        reactivarSync: (sampleId: number) => Promise<boolean>;
        obtenerSamplesNoSincronizados: () => Array<{ sampleId: number; nombre: string }>;
        /* C358: Historial y resync */
        obtenerHistorialSync: (limite?: number) => Array<{ tipo: string; descripcion: string; sampleId?: number; coleccionId?: number; timestamp: number }>;
        obtenerColeccionesSync: () => Array<{ id: number; nombre: string; carpetaLocal: string; archivos: number }>;
        forzarResync: (onProgreso?: (p: ProgresoSyncGlobal) => void) => Promise<{ nuevos: number; eliminados: number }>;
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
