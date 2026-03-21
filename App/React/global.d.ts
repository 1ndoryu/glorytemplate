/// <reference types="vite/client" />
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
    __KAMPLES_MOBILE__?: boolean;
    __KAMPLES_VERSION__?: string;
    Capacitor?: {
        isNativePlatform?: () => boolean;
        getPlatform?: () => string;
    };
    __KAMPLES_ANDROID_BRIDGE__?: {
        leerTokenFcm: () => Promise<string | null>;
        leerNavegacionFcmPendiente: () => Promise<string | null>;
        leerDeepLinkPendiente: () => Promise<string | null>;
    };
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
        obtenerHistorialSamplesSync: (limite?: number) => Array<{ sampleId: number; nombreArchivo: string; estado: 'detectado' | 'subiendo' | 'sincronizado' | 'error' | 'moviendo' | 'descargando' | 'descargado'; imagenUrl: string | null; rutaLocal: string | null; coleccionNombre?: string; timestampCreado: number; timestampActualizado: number; error?: string }>;
        haySyncEnCurso: () => boolean;
        limpiarHistorialSync: () => Promise<void>;
        recargarHistorialDesdeStore: () => Promise<void>;
        rehidratarImagenesPendientesSync: () => Promise<void>;
        toggleVentanaSync?: () => Promise<void>;
    };
    __KAMPLES_UPLOAD__?: {
        obtenerEstadoCola: () => { items: unknown[]; totalPendientes: number; totalErrores: number; procesando: boolean };
        onProgresoUpload: (cb: (progreso: unknown) => void) => void;
        reintentarItem: (itemId: string) => Promise<void>;
        eliminarItemCola: (itemId: string) => Promise<void>;
    };
    __KAMPLES_DRAG__?: {
        iniciarDragNativo: (sampleId: number, nombreArchivo: string, iconoPersonalizado?: string) => Promise<boolean>;
        descargarYArrastrar: (sampleId: number, urlDescarga: string, nombreArchivo: string, iconoPersonalizado?: string) => Promise<boolean>;
        prepararDragNativo: (sampleId: number, urlRemota: string, nombreArchivo: string) => Promise<void>;
        estaListoParaDrag: (sampleId: number) => boolean;
        generarPreviewDrag: (nombre: string) => Promise<string>;
    };
    __TAURI_INTERNALS__?: unknown;
}

/*
 * Declaración de módulo para tauri-plugin-notification.
 * El módulo real vive en desktop/node_modules/ y solo se resuelve en builds Tauri.
 * En web, el import dinámico nunca se ejecuta (guardado por esTauri()).
 * Esta declaración permite que el type-check de Glory/assets/react pase sin error.
 */
declare module '@tauri-apps/plugin-notification' {
    export function isPermissionGranted(): Promise<boolean>;
    export function requestPermission(): Promise<'granted' | 'denied' | 'default'>;
    export function sendNotification(options: {
        id?: number;
        title: string;
        body?: string;
        channelId?: string;
        icon?: string;
        largeBody?: string;
        summary?: string;
        sound?: string;
        group?: string;
    }): Promise<void>;
    export function createChannel(channel: {
        id: string;
        name: string;
        description?: string;
        importance?: number;
        visibility?: number;
        vibration?: boolean;
        sound?: string;
    }): Promise<void>;
}

/*
 * Declaración de módulo para tauri-plugin-fs.
 * Solo se ejecuta en Tauri (desktop/Android). En web, el import dinámico no llega.
 * QL34: necesario para leer fcm_token.txt desde el servicio nativo Android.
 */
declare module '@tauri-apps/plugin-fs' {
    export enum BaseDirectory {
        Audio = 1,
        Cache = 2,
        Config = 3,
        Data = 4,
        LocalData = 5,
        Document = 6,
        Download = 7,
        Picture = 8,
        Public = 9,
        Video = 10,
        Resource = 11,
        Temp = 12,
        AppConfig = 13,
        AppData = 14,
        AppLocalData = 15,
        AppCache = 16,
        AppLog = 17,
        Desktop = 18,
        Executable = 19,
        Font = 20,
        Home = 21,
        Runtime = 22,
        Template = 23,
    }

    interface FsOptions {
        baseDir?: BaseDirectory;
    }

    export function readTextFile(path: string, options?: FsOptions): Promise<string>;
    export function exists(path: string, options?: FsOptions): Promise<boolean>;
    export function writeTextFile(path: string, contents: string, options?: FsOptions): Promise<void>;
    export function readFile(path: string, options?: FsOptions): Promise<Uint8Array>;
    export function writeFile(path: string, contents: Uint8Array, options?: FsOptions): Promise<void>;
    export function mkdir(path: string, options?: FsOptions & { recursive?: boolean }): Promise<void>;
    export function remove(path: string, options?: FsOptions & { recursive?: boolean }): Promise<void>;
    export function rename(oldPath: string, newPath: string, options?: { oldPathBaseDir?: BaseDirectory; newPathBaseDir?: BaseDirectory }): Promise<void>;
    export function stat(path: string, options?: FsOptions): Promise<{ isFile: boolean; isDirectory: boolean; size: number }>;
    export function readDir(path: string, options?: FsOptions): Promise<Array<{ name: string; isFile: boolean; isDirectory: boolean }>>;
}

/*
 * Declaración de módulo para @tauri-apps/api/app.
 * QL48: necesario para obtener la versión de la app en Android (verificador de versión).
 */
declare module '@tauri-apps/api/app' {
    export function getVersion(): Promise<string>;
    export function getName(): Promise<string>;
    export function getTauriVersion(): Promise<string>;
}

/*
 * Declaración de módulo para tauri-plugin-shell.
 * QL48: necesario para abrir enlaces externos desde Android/desktop.
 */
declare module '@tauri-apps/plugin-shell' {
    export function open(path: string): Promise<void>;
}

declare module '@capacitor/app' {
    export const App: {
        addListener: (
            eventName: 'appUrlOpen',
            listenerFunc: (event: { url: string }) => void,
        ) => Promise<{ remove: () => Promise<void> }>;
    };
}

declare module '@capacitor/browser' {
    export const Browser: {
        open: (options: { url: string }) => Promise<void>;
        close: () => Promise<void>;
    };
}

declare module '@capacitor/push-notifications' {
    export const PushNotifications: {
        requestPermissions: () => Promise<{ receive: 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied' }>;
        register: () => Promise<void>;
        addListener: (
            eventName: 'registration' | 'registrationError' | 'pushNotificationActionPerformed',
            listenerFunc: (payload: unknown) => void,
        ) => Promise<{ remove: () => Promise<void> }>;
    };
}
