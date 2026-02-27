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

const STORE_FILE = 'sync-config.json';

/* Clave única: "{sampleId}_{coleccionId}" donde coleccionId=0 significa "sin colección" */
export function generarClaveTracking(sampleId: number, coleccionId: number | null): string {
    return `${sampleId}_${coleccionId ?? 0}`;
}

/* ==================== Tipos ==================== */

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
}

export type TipoAccionHistorial = 'descarga' | 'subida' | 'movido' | 'renombrado' | 'creado' | 'eliminado_local';

export interface AccionHistorial {
    tipo: TipoAccionHistorial;
    descripcion: string;
    sampleId?: number;
    coleccionId?: number;
    timestamp: number;
}

export interface BaseSyncLocal {
    archivos: Record<string, ArchivoTracking>;
    colecciones: Record<number, ColeccionLocal>;
    sinColeccion: number[];         /* IDs de samples descargados sin colección */
    historial: AccionHistorial[];
}

/* Estado interno */
const MAX_HISTORIAL = 200;

const STORE_KEY_TRACKING = 'sync_tracking_v2';

let datos: BaseSyncLocal = {
    archivos: {},
    colecciones: {},
    sinColeccion: [],
    historial: [],
};

/*
 * Índices secundarios para O(1) lookup por ruta y nombre.
 * Se reconstruyen al cargar datos y se mantienen en cada registrar/eliminar.
 * Clave del mapa → clave de tracking para acceso directo a datos.archivos[clave].
 */
const indiceRuta = new Map<string, string>();
const indiceNombre = new Map<string, string[]>();

/* Modo lote: suspende persistencia hasta finalizarLote(). Evita 100+ escrituras en sync masiva. */
let enLote = false;

/* eslint-disable @typescript-eslint/no-explicit-any -- Tauri Store typing requires flexible interface */
let storeCache: { get: <T>(key: string) => Promise<T | null>; set: (key: string, val: unknown) => Promise<void>; save: () => Promise<void> } | null = null;

/* ==================== Inicialización ==================== */

export async function inicializarTracking(): Promise<void> {
    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        storeCache = store as typeof storeCache;

        const guardado = await storeCache!.get<BaseSyncLocal>(STORE_KEY_TRACKING);
        if (guardado) {
            datos = guardado;
            reconstruirIndices();
        }
    } catch {
        /* Store no disponible — usar defaults */
    }
}

async function persistir(): Promise<void> {
    if (enLote || !storeCache) return;
    try {
        await storeCache.set(STORE_KEY_TRACKING, datos);
        await storeCache.save();
    } catch (err) {
        console.error('[SyncTracking] Error persistiendo datos:', err);
    }
}

/* Reconstruye índices secundarios desde datos.archivos. Llamado al cargar o migrar. */
function reconstruirIndices(): void {
    indiceRuta.clear();
    indiceNombre.clear();
    for (const [clave, archivo] of Object.entries(datos.archivos)) {
        const rutaNorm = archivo.rutaLocal.replace(/\\/g, '/');
        indiceRuta.set(rutaNorm, clave);

        for (const nombre of [archivo.nombreServidor, archivo.nombreLocal]) {
            const existentes = indiceNombre.get(nombre) ?? [];
            if (!existentes.includes(clave)) existentes.push(clave);
            indiceNombre.set(nombre, existentes);
        }
    }
}

/* ==================== Lote (batch) ==================== */

/** Inicia modo lote: las operaciones no persisten individualmente. */
export function iniciarLote(): void { enLote = true; }

/** Finaliza modo lote y persiste todos los cambios acumulados. */
export async function finalizarLote(): Promise<void> {
    enLote = false;
    await persistir();
}

/* ==================== Archivos ==================== */

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

    await persistir();
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
    await persistir();
}

export async function marcarSyncDeshabilitado(sampleId: number, coleccionId: number | null): Promise<boolean> {
    const clave = generarClaveTracking(sampleId, coleccionId);
    const archivo = datos.archivos[clave];
    if (!archivo) return false;

    archivo.syncDeshabilitado = true;
    await persistir();
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
    if (encontrado) await persistir();
    return encontrado;
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

/* ==================== Colecciones ==================== */

export function obtenerColeccion(id: number): ColeccionLocal | null {
    return datos.colecciones[id] ?? null;
}

export function todasLasColecciones(): ColeccionLocal[] {
    return Object.values(datos.colecciones);
}

export async function registrarColeccion(coleccion: ColeccionLocal): Promise<void> {
    datos.colecciones[coleccion.id] = coleccion;
    await persistir();
}

export async function eliminarColeccion(id: number): Promise<void> {
    delete datos.colecciones[id];
    await persistir();
}

export async function actualizarNombreColeccion(id: number, nombre: string, carpetaLocal: string): Promise<void> {
    const col = datos.colecciones[id];
    if (!col) return;
    col.nombre = nombre;
    col.carpetaLocal = carpetaLocal;
    await persistir();
}

export function buscarColeccionPorCarpeta(carpetaLocal: string): ColeccionLocal | null {
    for (const col of Object.values(datos.colecciones)) {
        if (col.carpetaLocal === carpetaLocal) return col;
    }
    return null;
}

/* ==================== Sin colección ==================== */

export function esSinColeccion(sampleId: number): boolean {
    return datos.sinColeccion.includes(sampleId);
}

export async function agregarSinColeccion(sampleId: number): Promise<void> {
    if (!datos.sinColeccion.includes(sampleId)) {
        datos.sinColeccion.push(sampleId);
        await persistir();
    }
}

export async function quitarSinColeccion(sampleId: number): Promise<void> {
    datos.sinColeccion = datos.sinColeccion.filter(id => id !== sampleId);
    await persistir();
}

export function totalSinColeccion(): number {
    return datos.sinColeccion.length;
}

/* ==================== Historial ==================== */

export async function registrarAccion(accion: Omit<AccionHistorial, 'timestamp'>): Promise<void> {
    datos.historial.unshift({ ...accion, timestamp: Date.now() });

    /* Limitar tamaño del historial */
    if (datos.historial.length > MAX_HISTORIAL) {
        datos.historial = datos.historial.slice(0, MAX_HISTORIAL);
    }

    await persistir();
}

export function obtenerHistorial(limite = 50): AccionHistorial[] {
    return datos.historial.slice(0, limite);
}

export async function limpiarHistorial(): Promise<void> {
    datos.historial = [];
    await persistir();
}

/* ==================== Migración v1 → v2 ==================== */

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
        }

        reconstruirIndices();
        await persistir();

        /* Registrar migración en historial */
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

/* ==================== Reset completo ==================== */

export async function resetearTracking(): Promise<void> {
    datos = {
        archivos: {},
        colecciones: {},
        sinColeccion: [],
        historial: [],
    };
    indiceRuta.clear();
    indiceNombre.clear();
    await persistir();
}

/* Obtener snapshot inmutable para UI */
export function obtenerDatosSync(): Readonly<BaseSyncLocal> {
    return datos;
}
