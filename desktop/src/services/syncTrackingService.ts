/*
 * Servicio: syncTrackingService — C355
 * CRUD tipado sobre Tauri Store para tracking de sync basado en colecciones.
 *
 * Reemplaza el flat array ArchivoLocal[] del sync v1 con un modelo
 * basado en Records indexados por sampleId+coleccionId para O(1) lookup.
 * Incluye historial de acciones para el tab historial (C358).
 *
 * Responsabilidad: persistencia y consulta. Sin lógica de negocio de sync.
 */

import { esDesktop } from './desktopService';
import { logSync } from './syncLogger';
import {
    appendOperacion,
    registrarAplicador,
    recuperar,
    checkpoint as journalCheckpoint,
    iniciarCheckpointPeriodico,
    establecerEstado,
    registrarCallbackCheckpoint,
    type OperacionJournal,
    type TipoOperacionJournal,
} from './syncJournal';

const STORE_FILE = 'sync-config.json';

/* Clave única: "{sampleId}_{coleccionId}" donde coleccionId=0 significa "sin colección" */
export function generarClaveTracking(sampleId: number, coleccionId: number | null): string {
    return `${sampleId}_${coleccionId ?? 0}`;
}

/* Tipos */

export interface ArchivoTracking {
    sampleId: number;
    coleccionId: number | null;     /* null = "Sin colección" */
    rutaLocal: string;              /* ruta absoluta en disco */
    nombreLocal: string;            /* nombre actual del archivo (puede diferir del server) */
    nombreServidor: string;         /* nombre original del server */
    descargadoEn: number;
    tamano: number;
    syncDeshabilitado: boolean;     /* true = borrado localmente, no re-descargar */
}

export interface ColeccionLocal {
    id: number;
    nombre: string;                 /* nombre de la colección en server */
    carpetaLocal: string;           /* nombre de la carpeta en disco (sanitizado) */
    creadaLocalmente: boolean;      /* true si fue creada como carpeta local primero */
    parentId: number | null;        /* null = raíz, number = subcolección (max 2 niveles) */
    version: number;                /* F5.2: optimistic locking — se incrementa en cada update del servidor */
}

export type TipoAccionHistorial =
    | 'descarga' | 'subida' | 'movido' | 'renombrado' | 'creado' | 'eliminado_local'
    | 'subida_pendiente' | 'subiendo' | 'error_subida';

export interface AccionHistorial {
    tipo: TipoAccionHistorial;
    descripcion: string;
    sampleId?: number;
    coleccionId?: number;
    timestamp: number;
}

/*
 * Modelo v2 del historial: 1 entrada por sample con estado mutable.
 * Reemplaza el log append-only (AccionHistorial[]) con un modelo
 * donde cada sample tiene una sola fila cuyo estado evoluciona:
 * detectado → subiendo → sincronizado (o error).
 *
 * Acciones de sistema (migración, resync) no aparecen en el historial
 * visible — solo samples reales con sampleId.
 */
export type EstadoSampleHistorial =
    | 'detectado'
    | 'subiendo'
    | 'sincronizado'
    | 'error'
    | 'moviendo'
    | 'descargando'
    | 'descargado';

export interface EntradaHistorialSample {
    sampleId: number;
    nombreArchivo: string;
    estado: EstadoSampleHistorial;
    imagenUrl: string | null;
    rutaLocal: string | null;
    coleccionNombre?: string;
    timestampCreado: number;
    timestampActualizado: number;
    error?: string;
}

export interface BaseSyncLocal {
    archivos: Record<string, ArchivoTracking>;
    colecciones: Record<number, ColeccionLocal>;
    sinColeccion: number[];         /* IDs de samples descargados sin colección */
    historial: AccionHistorial[];
    /*
     * Historial v2: por sample con estado mutable (upsert por sampleId).
     * Indexado como mapa para O(1) lookup, serializado como array para persistencia.
     */
    historialSamples: EntradaHistorialSample[];
    /* TC1: Versión monotónica para detección de escrituras concurrentes cross-window.
     * Se incrementa en cada escribirEnStore(). Si al leer del Store la versión es mayor
     * que la local, significa que otra ventana escribió — merger obligatorio antes de write. */
    checkpointVersion?: number;
    /*
     * C286: ID del usuario dueño de estos datos de tracking.
     * Al inicializar, si el userId almacenado no coincide con el usuario actual,
     * se limpia todo el tracking (los datos pertenecen a otra cuenta).
     * Sin este campo, colecciones de sesiones anteriores con otro usuario
     * contaminan el tracking → 403 en cascada al intentar operar sobre ellas.
     */
    userId?: number;
}

export interface ResumenDebugTracking {
    totalArchivos: number;
    totalColecciones: number;
    totalSinColeccion: number;
    totalDeshabilitados: number;
    totalHistorial: number;
    totalHistorialSamples: number;
    espacioTotalBytes: number;
    checkpointVersion: number;
    versionLocalConocida: number;
    userId: number | null;
    muestrasColecciones: Array<{
        id: number;
        nombre: string;
        carpetaLocal: string;
        parentId: number | null;
    }>;
    muestrasDeshabilitados: Array<{
        sampleId: number;
        nombreLocal: string;
        coleccionId: number | null;
        rutaLocal: string;
    }>;
}

/* Estado interno */
const MAX_HISTORIAL = 200;

const STORE_KEY_TRACKING = 'sync_tracking_v2';

let datos: BaseSyncLocal = {
    archivos: {},
    colecciones: {},
    sinColeccion: [],
    historial: [],
    historialSamples: [],
};

/* Índice en memoria para O(1) upsert en historialSamples. Clave: sampleId → índice en array.
 * Entradas sin sampleId real (pre-upload) se indexan por nombre en indiceNombreSampleHistorial. */
const indiceSampleHistorial = new Map<number, number>();
const indiceNombreSampleHistorial = new Map<string, number>();

/*
 * Índices secundarios para O(1) lookup por ruta y nombre.
 * Se reconstruyen al cargar datos y se mantienen en cada registrar/eliminar.
 * Clave del mapa → clave de tracking para acceso directo a datos.archivos[clave].
 */
const indiceRuta = new Map<string, string>();
const indiceNombre = new Map<string, string[]>();

/* Set sombra para O(1) en sinColeccion. El array en datos se mantiene para serialización al store. */
const sinColeccionSet = new Set<number>();

/* Modo lote: suspende persistencia hasta finalizarLote(). Evita 100+ escrituras en sync masiva. */
let enLote = false;

/* TA1: Referencia al unlisten del listener cross-window para cleanup en reinicialización */
let limpiarHistorialUnlisten: (() => void) | null = null;

/* TC1: Versión local conocida del Store. Se compara con la del Store antes de escribir. */
let versionLocalConocida = 0;

/* eslint-disable @typescript-eslint/no-explicit-any -- Tauri Store typing requires flexible interface */
let storeCache: { get: <T>(key: string) => Promise<T | null>; set: (key: string, val: unknown) => Promise<void>; save: () => Promise<void> } | null = null;

/* WAL (Write-Ahead Log): flag que indica si el journal está activo */
let journalActivo = false;

/**
 * Aplicador de operaciones del journal. Usado durante recuperación (startup)
 * para re-aplicar operaciones pendientes sobre el último checkpoint.
 * Cada operación modifica el estado mutándolo in-place.
 */
function aplicadorRecuperacion(op: OperacionJournal, estado: unknown): unknown {
    const s = estado as BaseSyncLocal;
    const d = op.datos as Record<string, unknown>;

    switch (op.tipo) {
        case 'TRACK_FILE': {
            s.archivos[d.clave as string] = d.archivo as ArchivoTracking;
            break;
        }
        case 'UNTRACK_FILE': {
            delete s.archivos[d.clave as string];
            break;
        }
        case 'ADD_COLLECTION': {
            const col = d.coleccion as ColeccionLocal;
            s.colecciones[col.id] = col;
            break;
        }
        case 'RENAME_COLLECTION': {
            const col = s.colecciones[d.id as number];
            if (col) {
                col.nombre = d.nombre as string;
                col.carpetaLocal = d.carpetaLocal as string;
            }
            break;
        }
        case 'DELETE_COLLECTION': {
            delete s.colecciones[d.id as number];
            break;
        }
        case 'MARK_DISABLED': {
            const archivo = s.archivos[d.clave as string];
            if (archivo) archivo.syncDeshabilitado = true;
            break;
        }
        case 'MARK_ENABLED': {
            const sampleId = d.sampleId as number;
            for (const [clave, arch] of Object.entries(s.archivos)) {
                if (arch.sampleId === sampleId) delete s.archivos[clave];
            }
            break;
        }
        case 'MOVE_FILE': {
            if (d.accion === 'agregarSinColeccion') {
                const sid = d.sampleId as number;
                if (!s.sinColeccion.includes(sid)) s.sinColeccion.push(sid);
            } else if (d.accion === 'quitarSinColeccion') {
                s.sinColeccion = s.sinColeccion.filter(id => id !== (d.sampleId as number));
            }
            break;
        }
        case 'UPDATE_HISTORIAL': {
            if (d.historialSamples !== undefined) {
                s.historialSamples = d.historialSamples as EntradaHistorialSample[];
            }
            if (d.historial !== undefined) {
                s.historial = d.historial as AccionHistorial[];
            }
            break;
        }
        case 'UPDATE_FILE': {
            /* Operación genérica — reservada para extensiones futuras */
            break;
        }
    }

    return s;
}

/**
 * Registra una operación en el journal WAL (solo escritura, sin re-aplicar).
 * Durante modo lote se omite — el checkpoint se hace en finalizarLote().
 */
async function registrarEnJournal(tipo: TipoOperacionJournal, datosOp: unknown): Promise<void> {
    if (enLote || !journalActivo) return;
    try {
        await appendOperacion({ tipo, datos: datosOp }, true);
    } catch {
        /* Error de journal no bloquea la operación — datos en memoria se persisten en próximo checkpoint */
    }
}

/**
 * Escribe el estado completo al Tauri Store (para acceso cross-window).
 * TC1: Incluye version gate — si otra ventana escribió una versión más nueva,
 * re-leer y fusionar antes de escribir para evitar sobrescribir datos.
 */
async function escribirEnStore(): Promise<void> {
    if (!storeCache) return;

    const almacenado = await storeCache.get<BaseSyncLocal>(STORE_KEY_TRACKING);
    const versionStore = almacenado?.checkpointVersion ?? 0;

    /* TC1: Si la versión del Store es mayor que la nuestra, otra ventana escribió.
     * Re-leer el estado completo del Store antes de mergear historial. */
    if (versionStore > versionLocalConocida && almacenado) {
        logSync.info('tracking', `TC1: Versión Store (${versionStore}) > local (${versionLocalConocida}), fusionando datos cross-window`);

        /*
         * C287: Guard de userId — si el Store pertenece a otro usuario, NO fusionar
         * colecciones/archivos/sinColeccion. Evita que datos de un usuario anterior
         * se re-importen despues del cleanup de inicializarTracking.
         * Solo fusionar historialSamples (neutro respecto a propiedad).
         */
        const mismoUsuario = !datos.userId || !almacenado.userId || datos.userId === almacenado.userId;

        if (mismoUsuario) {
            /* Fusionar archivos: preferir datos locales (nuestra ventana es la que hizo cambios),
             * pero importar archivos que la otra ventana añadió y nosotros no tenemos */
            for (const [clave, archivoRemoto] of Object.entries(almacenado.archivos)) {
                if (!datos.archivos[clave]) {
                    datos.archivos[clave] = archivoRemoto;
                }
            }

            /* Fusionar colecciones: importar las que no tenemos */
            for (const [idStr, colRemota] of Object.entries(almacenado.colecciones)) {
                const id = Number(idStr);
                if (!datos.colecciones[id]) {
                    datos.colecciones[id] = colRemota;
                }
            }

            /* Fusionar sinColeccion: unión de sets */
            const sinColSet = new Set([...datos.sinColeccion, ...almacenado.sinColeccion]);
            datos.sinColeccion = Array.from(sinColSet);

            reconstruirIndices();
        } else {
            logSync.warn('tracking',
                `TC1: Store pertenece a usuario #${almacenado.userId}, local es #${datos.userId}. Omitiendo merge de colecciones/archivos.`);
        }
    }

    if (almacenado?.historialSamples && datos.historialSamples.length > 0) {
        fusionarHistorialSamplesPersistidos(datos.historialSamples, almacenado.historialSamples);
    }

    /* TC1: Incrementar versión y escribir */
    versionLocalConocida = versionStore + 1;
    datos.checkpointVersion = versionLocalConocida;

    await storeCache.set(STORE_KEY_TRACKING, datos);
    await storeCache.save();
}

/* Inicialización */

/**
 * Inicializa el tracking de sync.
 *
 * @param userIdActual ID del usuario autenticado actualmente.
 *   Si el tracking almacenado pertenece a un usuario diferente,
 *   se limpia completamente para evitar operar sobre recursos ajenos (403).
 *   Si no se proporciona (undefined), se omite la verificación de propiedad
 *   (backward-compatible para ventanas secundarias sin contexto de auth).
 */
export async function inicializarTracking(userIdActual?: number): Promise<void> {
    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        storeCache = store as typeof storeCache;
    } catch {
        /* Store no disponible */
    }

    /* Configurar journal WAL para persistencia confiable contra crashes */
    const estadoVacio: BaseSyncLocal = {
        archivos: {}, colecciones: {}, sinColeccion: [], historial: [], historialSamples: [],
    };
    registrarAplicador(aplicadorRecuperacion, estadoVacio);
    registrarCallbackCheckpoint(async () => {
        try {
            await escribirEnStore();
        } catch (err) {
            logSync.warn('tracking', 'Error escribiendo en Store durante checkpoint', {
                error: err instanceof Error ? err.message : String(err)
            });
        }
    });

    /* Intentar recuperación desde journal (protege contra crashes) */
    const recuperado = await recuperar<BaseSyncLocal>();

    if (recuperado && (Object.keys(recuperado.archivos).length > 0 || Object.keys(recuperado.colecciones).length > 0)) {
        datos = { ...recuperado, historialSamples: recuperado.historialSamples ?? [] };
        logSync.info('tracking', 'Estado recuperado desde journal');

        /*
         * C288: Tras journal recovery, sincronizar versionLocalConocida y userId desde Store.
         * Sin esto:
         * - versionLocalConocida queda en 0 (journal no la persiste)
         * - Store tiene version N (escrita por checkpoints anteriores)
         * - El primer escribirEnStore() ve Store(N)>local(0) → TC1 merge
         *   re-importa datos viejos (posiblemente de otro usuario).
         *
         * También leer userId del Store: el journal puede tener datos sin userId
         * (pre-C286) o con userId de otro usuario. El Store es la fuente de verdad
         * porque fue el último en recibir un checkpoint con userId correcto.
         */
        if (storeCache) {
            try {
                const storeData = await storeCache.get<BaseSyncLocal>(STORE_KEY_TRACKING);
                if (storeData) {
                    versionLocalConocida = storeData.checkpointVersion ?? 0;

                    /* Si el journal no tiene userId pero el Store sí, adoptar el del Store
                     * para que el ownership check posterior funcione correctamente */
                    if (datos.userId === undefined && storeData.userId !== undefined) {
                        datos.userId = storeData.userId;
                    }
                }
            } catch {
                /* Store no disponible — TC1 merge podría dispararse pero es mejor que fallar */
            }
        }
    } else if (storeCache) {
        /* Fallback: cargar desde Tauri Store (caso normal sin crash previo) */
        try {
            const guardado = await storeCache.get<BaseSyncLocal>(STORE_KEY_TRACKING);
            if (guardado) {
                datos = { ...guardado, historialSamples: guardado.historialSamples ?? [] };
                /* TC1: Sincronizar versión local con la del Store */
                versionLocalConocida = guardado.checkpointVersion ?? 0;
            }
        } catch {
            /* Store no disponible — usar defaults vacíos */
        }
    }

    /*
     * C286: Verificación de propiedad por usuario.
     * Si el tracking almacenado pertenece a un usuario diferente al actual,
     * limpiar TODOS los datos. Colecciones/archivos de otro usuario generan
     * 403 en cascada (el servidor verifica propiedad por JWT).
     *
     * Caso retrocompatible: tracking sin userId (pre-C286) → se adopta
     * como del usuario actual y se marca con su ID en el próximo checkpoint.
     */
    if (userIdActual !== undefined && userIdActual > 0) {
        const userIdAlmacenado = datos.userId;

        if (userIdAlmacenado !== undefined && userIdAlmacenado !== userIdActual) {
            logSync.warn('tracking',
                `Tracking pertenece a usuario #${userIdAlmacenado}, pero el usuario actual es #${userIdActual}. Limpiando datos ajenos.`);

            datos = {
                archivos: {},
                colecciones: {},
                sinColeccion: [],
                historial: [],
                historialSamples: [],
                userId: userIdActual,
            };

            /*
             * C287: Persistir estado limpio al Store inmediatamente.
             * Sin esto, versionLocalConocida queda en 0 mientras Store tiene version N.
             * El primer escribirEnStore() ve Store(N) > local(0) → TC1 merge
             * re-importa TODAS las colecciones/archivos del usuario anterior.
             */
            if (storeCache) {
                try {
                    const storeActual = await storeCache.get<BaseSyncLocal>(STORE_KEY_TRACKING);
                    const versionActualStore = storeActual?.checkpointVersion ?? 0;
                    versionLocalConocida = versionActualStore + 1;
                    datos.checkpointVersion = versionLocalConocida;
                    await storeCache.set(STORE_KEY_TRACKING, datos);
                    await storeCache.save();
                    logSync.info('tracking', `Estado limpio persistido al Store (version: ${versionLocalConocida})`);
                } catch (err) {
                    logSync.warn('tracking', 'Error persistiendo estado limpio al Store', {
                        error: err instanceof Error ? err.message : String(err)
                    });
                }
            }
        } else {
            /* Marcar userId si no existía (migración from pre-C286 tracking) */
            datos.userId = userIdActual;
        }
    }

    /* Sincronizar estado del journal con datos cargados */
    establecerEstado(datos);
    journalActivo = true;

    reconstruirIndices();
    reconstruirIndiceSampleHistorial();

    /* Iniciar checkpoint periódico WAL (cada 30s si hay operaciones pendientes) */
    iniciarCheckpointPeriodico();

    /*
     * Listener cross-window: cuando otra ventana limpia el historial,
     * actualizar la copia in-memory para que el próximo persistir()
     * no sobreescriba el Store con datos viejos.
     * TA1: Guardar unlisten para prevenir acumulación de listeners en reinicializaciones.
     */
    try {
        if (limpiarHistorialUnlisten) {
            limpiarHistorialUnlisten();
            limpiarHistorialUnlisten = null;
        }
        const { listen } = await import('@tauri-apps/api/event');
        limpiarHistorialUnlisten = await listen('limpiar-historial-samples', () => {
            datos.historialSamples = [];
            indiceSampleHistorial.clear();
            indiceNombreSampleHistorial.clear();
        });
    } catch {
        /* Entorno sin Tauri */
    }
}

async function persistir(): Promise<void> {
    if (enLote) return;
    try {
        if (journalActivo) {
            /* WAL activo: forzar checkpoint (escribe checkpoint file + callback a Store) */
            await journalCheckpoint();
        } else if (storeCache) {
            /* Fallback sin journal (pre-inicialización o entorno sin fs) */
            await escribirEnStore();
        }
    } catch (err) {
        logSync.error('tracking', 'Error persistiendo datos', { error: err instanceof Error ? err.message : String(err) });
    }
}

function obtenerClaveHistorialSample(entrada: Pick<EntradaHistorialSample, 'sampleId' | 'nombreArchivo'>): string {
    if (entrada.sampleId > 0) return `sample:${entrada.sampleId}`;
    return `nombre:${entrada.nombreArchivo.toLowerCase()}`;
}

function fusionarHistorialSamplesPersistidos(
    historialLocal: EntradaHistorialSample[],
    historialPersistido: EntradaHistorialSample[],
): void {
    const mapaPersistido = new Map<string, EntradaHistorialSample>();
    for (const entrada of historialPersistido) {
        mapaPersistido.set(obtenerClaveHistorialSample(entrada), entrada);
    }

    for (const entradaLocal of historialLocal) {
        const entradaPersistida = mapaPersistido.get(obtenerClaveHistorialSample(entradaLocal));
        if (!entradaPersistida) continue;

        if (entradaLocal.sampleId === 0 && entradaPersistida.sampleId > 0) {
            entradaLocal.sampleId = entradaPersistida.sampleId;
        }

        const persistidaMasReciente = entradaPersistida.timestampActualizado > entradaLocal.timestampActualizado;
        if (entradaPersistida.imagenUrl && (!entradaLocal.imagenUrl || persistidaMasReciente)) {
            entradaLocal.imagenUrl = entradaPersistida.imagenUrl;
            entradaLocal.timestampActualizado = Math.max(
                entradaLocal.timestampActualizado,
                entradaPersistida.timestampActualizado,
            );
        }

        if (persistidaMasReciente) {
            if (!entradaLocal.rutaLocal && entradaPersistida.rutaLocal) {
                entradaLocal.rutaLocal = entradaPersistida.rutaLocal;
            }
            if (!entradaLocal.coleccionNombre && entradaPersistida.coleccionNombre) {
                entradaLocal.coleccionNombre = entradaPersistida.coleccionNombre;
            }
            if (!entradaLocal.error && entradaPersistida.error) {
                entradaLocal.error = entradaPersistida.error;
            }
        }
    }
}

/* Reconstruye índices secundarios desde datos.archivos y sinColeccion. Llamado al cargar o migrar. */
function reconstruirIndices(): void {
    indiceRuta.clear();
    indiceNombre.clear();
    sinColeccionSet.clear();

    for (const [clave, archivo] of Object.entries(datos.archivos)) {
        const rutaNorm = archivo.rutaLocal.replace(/\\/g, '/');
        indiceRuta.set(rutaNorm, clave);

        for (const nombre of [archivo.nombreServidor, archivo.nombreLocal]) {
            const existentes = indiceNombre.get(nombre) ?? [];
            if (!existentes.includes(clave)) existentes.push(clave);
            indiceNombre.set(nombre, existentes);
        }
    }

    for (const id of datos.sinColeccion) {
        sinColeccionSet.add(id);
    }
}

/* Reconstruye índice de historialSamples para O(1) upsert por sampleId */
function reconstruirIndiceSampleHistorial(): void {
    indiceSampleHistorial.clear();
    indiceNombreSampleHistorial.clear();
    for (let i = 0; i < datos.historialSamples.length; i++) {
        const entrada = datos.historialSamples[i];
        if (entrada.sampleId > 0) {
            indiceSampleHistorial.set(entrada.sampleId, i);
        }
        indiceNombreSampleHistorial.set(entrada.nombreArchivo.toLowerCase(), i);
    }
}

/* Lote (batch) */

/** Inicia modo lote: las operaciones no persisten individualmente. */
export function iniciarLote(): void { enLote = true; }

/** Finaliza modo lote y persiste todos los cambios acumulados. */
export async function finalizarLote(): Promise<void> {
    enLote = false;
    await persistir();
}

/* Archivos */

export function obtenerArchivo(sampleId: number, coleccionId: number | null): ArchivoTracking | null {
    const clave = generarClaveTracking(sampleId, coleccionId);
    return datos.archivos[clave] ?? null;
}

export function buscarArchivoPorSampleId(sampleId: number): ArchivoTracking | null {
    /* Buscar en cualquier colección */
    for (const archivo of Object.values(datos.archivos)) {
        if (archivo.sampleId === sampleId) return archivo;
    }
    return null;
}

/** O(1) lookup por ruta normalizada usando índice secundario. */
export function buscarArchivoPorRuta(ruta: string): ArchivoTracking | null {
    const rutaNorm = ruta.replace(/\\/g, '/');
    const clave = indiceRuta.get(rutaNorm);
    if (clave) return datos.archivos[clave] ?? null;
    return null;
}

/** O(1) lookup por nombre de archivo usando índice secundario. */
export function buscarArchivoPorNombre(nombre: string): ArchivoTracking | null {
    const claves = indiceNombre.get(nombre);
    if (claves && claves.length > 0) return datos.archivos[claves[0]] ?? null;
    return null;
}

export async function registrarArchivo(archivo: ArchivoTracking): Promise<void> {
    const clave = generarClaveTracking(archivo.sampleId, archivo.coleccionId);

    /* Limpiar índice de entrada anterior si existía con otra ruta/nombre */
    const anterior = datos.archivos[clave];
    if (anterior) {
        indiceRuta.delete(anterior.rutaLocal.replace(/\\/g, '/'));
    }

    datos.archivos[clave] = archivo;

    /* Actualizar índices secundarios */
    const rutaNorm = archivo.rutaLocal.replace(/\\/g, '/');
    indiceRuta.set(rutaNorm, clave);
    for (const nombre of [archivo.nombreServidor, archivo.nombreLocal]) {
        const existentes = indiceNombre.get(nombre) ?? [];
        if (!existentes.includes(clave)) existentes.push(clave);
        indiceNombre.set(nombre, existentes);
    }

    await registrarEnJournal('TRACK_FILE', { clave, archivo });
}

export async function eliminarArchivo(sampleId: number, coleccionId: number | null): Promise<void> {
    const clave = generarClaveTracking(sampleId, coleccionId);
    const archivo = datos.archivos[clave];

    if (archivo) {
        /* Limpiar índices secundarios */
        indiceRuta.delete(archivo.rutaLocal.replace(/\\/g, '/'));
        for (const nombre of [archivo.nombreServidor, archivo.nombreLocal]) {
            const existentes = indiceNombre.get(nombre);
            if (existentes) {
                const filtrado = existentes.filter(c => c !== clave);
                if (filtrado.length === 0) indiceNombre.delete(nombre);
                else indiceNombre.set(nombre, filtrado);
            }
        }
    }

    delete datos.archivos[clave];
    await registrarEnJournal('UNTRACK_FILE', { clave });
}

export async function marcarSyncDeshabilitado(sampleId: number, coleccionId: number | null): Promise<boolean> {
    const clave = generarClaveTracking(sampleId, coleccionId);
    const archivo = datos.archivos[clave];
    if (!archivo) return false;

    archivo.syncDeshabilitado = true;
    await registrarEnJournal('MARK_DISABLED', { clave });
    return true;
}

export async function reactivarSync(sampleId: number): Promise<boolean> {
    /* Buscar y eliminar en todas las colecciones para que se re-descargue */
    let encontrado = false;
    for (const [clave, archivo] of Object.entries(datos.archivos)) {
        if (archivo.sampleId === sampleId) {
            delete datos.archivos[clave];
            encontrado = true;
        }
    }
    if (encontrado) await registrarEnJournal('MARK_ENABLED', { sampleId });
    return encontrado;
}

/*
 * Reactiva todos los samples marcados como syncDeshabilitado.
 * Elimina sus entradas del tracking para forzar re-descarga en la próxima sync.
 * Usado por "Reforzar sincronización" para recuperar archivos borrados localmente.
 */
export async function reactivarTodosSyncDeshabilitados(): Promise<number> {
    let reactivados = 0;
    for (const [clave, archivo] of Object.entries(datos.archivos)) {
        if (archivo.syncDeshabilitado) {
            delete datos.archivos[clave];
            reactivados++;
        }
    }
    if (reactivados > 0) {
        await registrarEnJournal('MARK_ENABLED_ALL', { reactivados });
    }
    return reactivados;
}

export function listarArchivosPorColeccion(coleccionId: number | null): ArchivoTracking[] {
    return Object.values(datos.archivos).filter(a => a.coleccionId === coleccionId);
}

export function todosLosArchivos(): ArchivoTracking[] {
    return Object.values(datos.archivos);
}

export function totalArchivos(): number {
    return Object.keys(datos.archivos).length;
}

export function espacioTotalBytes(): number {
    return Object.values(datos.archivos).reduce((sum, a) => sum + a.tamano, 0);
}

/* Colecciones */

export function obtenerColeccion(id: number): ColeccionLocal | null {
    return datos.colecciones[id] ?? null;
}

export function todasLasColecciones(): ColeccionLocal[] {
    return Object.values(datos.colecciones);
}

export async function registrarColeccion(coleccion: ColeccionLocal): Promise<void> {
    datos.colecciones[coleccion.id] = coleccion;
    await registrarEnJournal('ADD_COLLECTION', { coleccion });
}

export async function eliminarColeccion(id: number): Promise<void> {
    delete datos.colecciones[id];
    await registrarEnJournal('DELETE_COLLECTION', { id });
}

/*
 * Buscar subcolección por nombre de carpeta dentro de una colección padre.
 * carpetaPadre: nombre de carpeta del padre (nivel 1).
 * nombreSub: nombre de subcarpeta (nivel 2).
 */
export function buscarSubcoleccion(carpetaPadre: string, nombreSub: string): ColeccionLocal | null {
    const padre = buscarColeccionPorCarpeta(carpetaPadre);
    if (!padre) return null;
    const busqueda = nombreSub.toLowerCase();
    for (const col of Object.values(datos.colecciones)) {
        if (col.parentId !== padre.id) continue;
        if (col.carpetaLocal.toLowerCase() === busqueda) return col;
        if (col.nombre.toLowerCase() === busqueda) return col;
    }
    return null;
}

/* Listar subcolecciones de un padre por ID */
export function subcoleccionesDePadre(parentId: number): ColeccionLocal[] {
    return Object.values(datos.colecciones).filter(c => c.parentId === parentId);
}

export async function actualizarNombreColeccion(id: number, nombre: string, carpetaLocal: string): Promise<void> {
    const col = datos.colecciones[id];
    if (!col) return;

    const carpetaAnterior = col.carpetaLocal;
    col.nombre = nombre;
    col.carpetaLocal = carpetaLocal;

    /*
     * C289: Actualizar rutaLocal e indiceRuta de archivos tras rename.
     * Sin esto, los archivos mantienen la ruta vieja → el watcher los ve como
     * archivos nuevos en la nueva ruta → re-upload → duplicados.
     * Se actualizan archivos de la colección directa + subcollecciones hijas.
     */
    if (carpetaAnterior !== carpetaLocal) {
        const idsAfectadas = new Set<number>([id]);
        for (const sub of Object.values(datos.colecciones)) {
            if (sub.parentId === id) idsAfectadas.add(sub.id);
        }

        const escapedOld = carpetaAnterior.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const patronReemplazo = new RegExp(`([/\\\\])${escapedOld}([/\\\\])`, 'i');

        for (const [clave, archivo] of Object.entries(datos.archivos)) {
            if (archivo.coleccionId === null || !idsAfectadas.has(archivo.coleccionId)) continue;

            const nuevaRuta = archivo.rutaLocal.replace(patronReemplazo, `$1${carpetaLocal}$2`);
            if (nuevaRuta !== archivo.rutaLocal) {
                const rutaNormAnterior = archivo.rutaLocal.replace(/\\/g, '/');
                indiceRuta.delete(rutaNormAnterior);
                archivo.rutaLocal = nuevaRuta;
                const rutaNormNueva = nuevaRuta.replace(/\\/g, '/');
                indiceRuta.set(rutaNormNueva, clave);
            }
        }
    }

    await registrarEnJournal('RENAME_COLLECTION', { id, nombre, carpetaLocal });
}

export function buscarColeccionPorCarpeta(carpetaLocal: string): ColeccionLocal | null {
    const busqueda = carpetaLocal.toLowerCase();
    for (const col of Object.values(datos.colecciones)) {
        /*
         * Comparación case-insensitive: Windows no distingue mayúsculas en nombres de carpeta.
         * Sin esto, el watcher reporta "Mi Carpeta" pero tracking tiene "mi carpeta" → no match
         * → se crea colección duplicada en vez de renombrar.
         */
        if (col.carpetaLocal.toLowerCase() === busqueda) return col;
        /* Fallback: comparar también por nombre de colección (el watcher puede reportar
         * el nombre exacto del directorio que coincide con el nombre, no con carpetaLocal sanitizada) */
        if (col.nombre.toLowerCase() === busqueda) return col;
    }
    return null;
}

/* Sin colección */

export function esSinColeccion(sampleId: number): boolean {
    return sinColeccionSet.has(sampleId);
}

export async function agregarSinColeccion(sampleId: number): Promise<void> {
    if (!sinColeccionSet.has(sampleId)) {
        sinColeccionSet.add(sampleId);
        datos.sinColeccion.push(sampleId);
        await registrarEnJournal('MOVE_FILE', { accion: 'agregarSinColeccion', sampleId });
    }
}

export async function quitarSinColeccion(sampleId: number): Promise<void> {
    sinColeccionSet.delete(sampleId);
    datos.sinColeccion = datos.sinColeccion.filter(id => id !== sampleId);
    await registrarEnJournal('MOVE_FILE', { accion: 'quitarSinColeccion', sampleId });
}

export function totalSinColeccion(): number {
    return datos.sinColeccion.length;
}

/* Historial per-sample (v2): upsert por sampleId con estado mutable */

const MAX_HISTORIAL_SAMPLES = 100;

/**
 * Upsert: si ya existe una entrada para este sampleId (o nombreArchivo si sampleId=0),
 * actualiza su estado. Si no existe, inserta al inicio. Persiste automáticamente.
 *
 * Flujo típico de upload:
 *   1. Detectado (sampleId=0, nombre=X) → crea entrada
 *   2. Subiendo (sampleId=0, nombre=X) → actualiza por nombre
 *   3. Sincronizado (sampleId=REAL, nombre=X) → actualiza por nombre y fija sampleId real
 */
export async function actualizarEstadoSample(entrada: {
    sampleId: number;
    nombreArchivo: string;
    estado: EstadoSampleHistorial;
    imagenUrl?: string | null;
    rutaLocal?: string | null;
    coleccionNombre?: string;
    error?: string;
}): Promise<void> {
    const ahora = Date.now();
    const nombreNorm = entrada.nombreArchivo.toLowerCase();

    /* Buscar entrada existente: primero por sampleId real, luego por nombre */
    let idxExistente: number | undefined;
    if (entrada.sampleId > 0) {
        idxExistente = indiceSampleHistorial.get(entrada.sampleId);
    }
    if (idxExistente === undefined) {
        idxExistente = indiceNombreSampleHistorial.get(nombreNorm);
    }

    if (idxExistente !== undefined && idxExistente < datos.historialSamples.length) {
        /* Actualizar entrada existente */
        const existente = datos.historialSamples[idxExistente];
        existente.estado = entrada.estado;
        existente.timestampActualizado = ahora;

        /* Actualizar sampleId si ahora tenemos el real (era 0 y ahora es > 0) */
        if (entrada.sampleId > 0 && existente.sampleId === 0) {
            existente.sampleId = entrada.sampleId;
        }

        if (entrada.imagenUrl !== undefined) existente.imagenUrl = entrada.imagenUrl;
        if (entrada.rutaLocal !== undefined) existente.rutaLocal = entrada.rutaLocal;
        if (entrada.coleccionNombre !== undefined) existente.coleccionNombre = entrada.coleccionNombre;
        if (entrada.error !== undefined) existente.error = entrada.error;
        if (entrada.nombreArchivo) existente.nombreArchivo = entrada.nombreArchivo;

        /* Mover al inicio para que aparezca primero (más reciente) */
        if (idxExistente > 0) {
            datos.historialSamples = [
                existente,
                ...datos.historialSamples.slice(0, idxExistente),
                ...datos.historialSamples.slice(idxExistente + 1),
            ];
            reconstruirIndiceSampleHistorial();
        }
    } else {
        /* Insertar nueva entrada al inicio */
        const nueva: EntradaHistorialSample = {
            sampleId: entrada.sampleId,
            nombreArchivo: entrada.nombreArchivo,
            estado: entrada.estado,
            imagenUrl: entrada.imagenUrl ?? null,
            rutaLocal: entrada.rutaLocal ?? null,
            coleccionNombre: entrada.coleccionNombre,
            timestampCreado: ahora,
            timestampActualizado: ahora,
            error: entrada.error,
        };
        datos.historialSamples.unshift(nueva);

        /* Limitar tamaño */
        if (datos.historialSamples.length > MAX_HISTORIAL_SAMPLES) {
            datos.historialSamples = datos.historialSamples.slice(0, MAX_HISTORIAL_SAMPLES);
        }

        reconstruirIndiceSampleHistorial();
    }

    await registrarEnJournal('UPDATE_HISTORIAL', { historialSamples: datos.historialSamples });
}

/**
 * Obtiene el historial per-sample ordenado por última actualización.
 * Retorna copias superficiales de cada entrada para evitar que mutaciones
 * internas (ej: actualizarEstadoSample) invaliden comparaciones en React.
 * Sin esto, el polling en usePanelSincronizacion compara objetos mutados
 * contra sí mismos y nunca detecta cambios (ej: imagen actualizada).
 */
export function obtenerHistorialSamples(limite = 50): EntradaHistorialSample[] {
    return datos.historialSamples.slice(0, limite).map(e => ({ ...e }));
}

export function obtenerResumenDebugTracking(): ResumenDebugTracking {
    const archivos = Object.values(datos.archivos);
    const colecciones = Object.values(datos.colecciones);
    const deshabilitados = archivos
        .filter(archivo => archivo.syncDeshabilitado)
        .slice(0, 15)
        .map(archivo => ({
            sampleId: archivo.sampleId,
            nombreLocal: archivo.nombreLocal,
            coleccionId: archivo.coleccionId,
            rutaLocal: archivo.rutaLocal,
        }));

    return {
        totalArchivos: archivos.length,
        totalColecciones: colecciones.length,
        totalSinColeccion: datos.sinColeccion.length,
        totalDeshabilitados: archivos.filter(archivo => archivo.syncDeshabilitado).length,
        totalHistorial: datos.historial.length,
        totalHistorialSamples: datos.historialSamples.length,
        espacioTotalBytes: archivos.reduce((total, archivo) => total + archivo.tamano, 0),
        checkpointVersion: datos.checkpointVersion ?? 0,
        versionLocalConocida,
        userId: datos.userId ?? null,
        muestrasColecciones: colecciones.slice(0, 15).map(coleccion => ({
            id: coleccion.id,
            nombre: coleccion.nombre,
            carpetaLocal: coleccion.carpetaLocal,
            parentId: coleccion.parentId,
        })),
        muestrasDeshabilitados: deshabilitados,
    };
}

/**
 * Recarga el historial per-sample desde el Tauri Store.
 *
 * Necesario en ventanas MPA (sync panel): la ventana main actualiza el Store
 * (ej: imagen post-pipeline), pero la ventana sync tiene su propia copia en memoria.
 * El Store de Tauri 2.0 comparte el backend entre ventanas, así que store.get()
 * retorna datos frescos sin leer de disco.
 *
 * Throttle interno de 2s: balance entre frescura de datos y carga IPC.
 * Reducido de 5s para que imágenes rehidratadas por la ventana main
 * aparezcan más rápido en el sync panel.
 */
let ultimaRecargaStore = 0;
const RECARGA_STORE_INTERVALO_MS = 2000;

export async function recargarHistorialDesdeStore(): Promise<void> {
    const ahora = Date.now();
    if (ahora - ultimaRecargaStore < RECARGA_STORE_INTERVALO_MS) return;
    ultimaRecargaStore = ahora;

    if (!storeCache) return;
    try {
        const guardado = await storeCache.get<BaseSyncLocal>(STORE_KEY_TRACKING);
        if (guardado?.historialSamples) {
            datos.historialSamples = guardado.historialSamples;
            reconstruirIndiceSampleHistorial();
        }
    } catch {
        /* Store no disponible o error de lectura */
    }
}

/** Limpia el historial per-sample completo. */
export async function limpiarHistorialSamples(): Promise<void> {
    datos.historialSamples = [];
    indiceSampleHistorial.clear();
    indiceNombreSampleHistorial.clear();
    await persistir();

    /*
     * Notificar a otras ventanas Tauri (ej: main window) para que limpien
     * su copia in-memory del historial. Sin esto, la ventana main persiste
     * su datos.historialSamples viejo y sobreescribe el Store limpio.
     */
    try {
        const { emit } = await import('@tauri-apps/api/event');
        await emit('limpiar-historial-samples', {});
    } catch {
        /* Entorno sin Tauri — ignorar */
    }
}

/* Historial legacy (append-only, mantenido para compatibilidad con SincPanelTabs) */

export async function registrarAccion(accion: Omit<AccionHistorial, 'timestamp'>): Promise<void> {
    datos.historial.unshift({ ...accion, timestamp: Date.now() });

    /* Limitar tamaño del historial */
    if (datos.historial.length > MAX_HISTORIAL) {
        datos.historial = datos.historial.slice(0, MAX_HISTORIAL);
    }

    await registrarEnJournal('UPDATE_HISTORIAL', { historial: datos.historial });
}

export function obtenerHistorial(limite = 50): AccionHistorial[] {
    return datos.historial.slice(0, limite);
}

export async function limpiarHistorial(): Promise<void> {
    datos.historial = [];
    await persistir();
}

/* Migración v1 → v2 */

/**
 * Migra el índice plano ArchivoLocal[] (v1) al nuevo formato BaseSyncLocal (v2).
 * Lee el store key viejo 'sync_indice' y convierte cada ArchivoLocal a ArchivoTracking.
 * Samples v1 van todos a coleccionId=null (sin colección) porque v1 no tenía colecciones.
 * La asignación a colecciones se hará en la primera sync v2 completa.
 */
export async function migrarDesdeV1(): Promise<boolean> {
    if (!esDesktop()) return false;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);

        interface ArchivoLocalV1 {
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

        const indiceV1 = await store.get<ArchivoLocalV1[]>('sync_indice');
        if (!indiceV1 || indiceV1.length === 0) return false;

        /* Ya existe datos v2 con archivos → no migrar */
        if (Object.keys(datos.archivos).length > 0) return false;

        for (const v1 of indiceV1) {
            const tracking: ArchivoTracking = {
                sampleId: v1.sampleId,
                coleccionId: null,
                rutaLocal: v1.ruta,
                nombreLocal: v1.nombre,
                nombreServidor: v1.nombreServidor,
                descargadoEn: v1.descargadoEn,
                tamano: 0,
                syncDeshabilitado: v1.syncDeshabilitado ?? false,
            };

            const clave = generarClaveTracking(v1.sampleId, null);
            datos.archivos[clave] = tracking;
            datos.sinColeccion.push(v1.sampleId);
            sinColeccionSet.add(v1.sampleId);
        }

        reconstruirIndices();
        await persistir();

        /* Eliminar clave v1 para que la migración no se repita en futuros reinicios.
         * Sin esto, si el store v2 falla al cargar en algún reinicio, la presencia
         * de sync_indice vuelve a trigger la migración produciendo duplicados. */
        try {
            await store.set('sync_indice', null);
            await store.save();
        } catch {
            /* No crítico: la migración ya ocurrió, el peor caso es una re-migración idempotente */
        }

        /* Registrar migración en historial legacy (no aparece en historialSamples) */
        await registrarAccion({
            tipo: 'creado',
            descripcion: `Migración v1→v2: ${indiceV1.length} archivos convertidos`,
        });

        console.info(`[SyncTracking] Migración v1→v2 completada: ${indiceV1.length} archivos`);
        return true;
    } catch (err) {
        console.error('[SyncTracking] Error en migración v1→v2:', err);
        return false;
    }
}

/* Reset completo */

export async function resetearTracking(): Promise<void> {
    const userIdActual = datos.userId;
    datos = {
        archivos: {},
        colecciones: {},
        sinColeccion: [],
        historial: [],
        historialSamples: [],
        userId: userIdActual,
    };
    indiceRuta.clear();
    indiceNombre.clear();
    sinColeccionSet.clear();
    indiceSampleHistorial.clear();
    await persistir();
}

/* Obtener snapshot inmutable para UI */
export function obtenerDatosSync(): Readonly<BaseSyncLocal> {
    return datos;
}
