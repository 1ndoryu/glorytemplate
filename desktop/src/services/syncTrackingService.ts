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

/* eslint-disable @typescript-eslint/no-explicit-any -- Tauri Store typing requires flexible interface */
let storeCache: { get: <T>(key: string) => Promise<T | null>; set: (key: string, val: unknown) => Promise<void>; save: () => Promise<void> } | null = null;

/* Inicialización */

export async function inicializarTracking(): Promise<void> {
    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        storeCache = store as typeof storeCache;

        const guardado = await storeCache!.get<BaseSyncLocal>(STORE_KEY_TRACKING);
        if (guardado) {
            /* Migrar estructura: añadir historialSamples si no existe en datos almacenados */
            datos = { ...guardado, historialSamples: guardado.historialSamples ?? [] };
            reconstruirIndices();
            reconstruirIndiceSampleHistorial();
        }
    } catch {
        /* Store no disponible — usar defaults */
    }

    /*
     * Listener cross-window: cuando otra ventana limpia el historial,
     * actualizar la copia in-memory para que el próximo persistir()
     * no sobreescriba el Store con datos viejos.
     */
    try {
        const { listen } = await import('@tauri-apps/api/event');
        void listen('limpiar-historial-samples', () => {
            datos.historialSamples = [];
            indiceSampleHistorial.clear();
            indiceNombreSampleHistorial.clear();
        });
    } catch {
        /* Entorno sin Tauri */
    }
}

async function persistir(): Promise<void> {
    if (enLote || !storeCache) return;
    try {
        const almacenado = await storeCache.get<BaseSyncLocal>(STORE_KEY_TRACKING);
        if (almacenado?.historialSamples && datos.historialSamples.length > 0) {
            fusionarHistorialSamplesPersistidos(datos.historialSamples, almacenado.historialSamples);
        }

        await storeCache.set(STORE_KEY_TRACKING, datos);
        await storeCache.save();
    } catch (err) {
        console.error('[SyncTracking] Error persistiendo datos:', err);
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

/* Colecciones */

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
    col.nombre = nombre;
    col.carpetaLocal = carpetaLocal;
    await persistir();
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
        await persistir();
    }
}

export async function quitarSinColeccion(sampleId: number): Promise<void> {
    sinColeccionSet.delete(sampleId);
    datos.sinColeccion = datos.sinColeccion.filter(id => id !== sampleId);
    await persistir();
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

    await persistir();
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

    await persistir();
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
    datos = {
        archivos: {},
        colecciones: {},
        sinColeccion: [],
        historial: [],
        historialSamples: [],
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
