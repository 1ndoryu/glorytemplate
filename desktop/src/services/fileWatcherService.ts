/*
 * Servicio: fileWatcherService — Observador de carpeta de sincronización.
 *
 * Monitorea la carpeta local de sync en busca de:
 * - Archivos de audio nuevos → los encola para subida automática
 * - Archivos eliminados → marca como no_sincronizar (no borra del server)
 * - Carpetas de nivel 1 creadas/renombradas → sincroniza con colecciones (C357)
 *
 * Usa @tauri-apps/plugin-fs watch() con debounce para agrupar eventos
 * rápidos (ej: copiar múltiples archivos de golpe).
 *
 * Flujo:
 *   watch(carpetaSync) → evento create → validar extensión →
 *   verificar no-duplicado → encolar en uploadQueueService
 *
 *   watch(carpetaSync) → evento remove → marcar sync_deshabilitado
 *   en el índice local (NO borrar del servidor)
 *
 *   watch(carpetaSync) → evento create/rename carpeta nivel 1 →
 *   crear o renombrar colección en el servidor (C357)
 */

import { esDesktop } from './desktopService';
import { obtenerConfigSync } from './syncService';
import { logSync } from './syncLogger';
import { esDescargaMasivaEnCurso } from './syncGuards';

/* QL107: Tipos de @tauri-apps/plugin-fs definidos localmente.
 * TS 5.9 con moduleResolution 'bundler' no resuelve los export type
 * del modulo via import type ni import(). Los tipos son identicos. */
interface EventoWatch {
    type: string | Record<string, unknown>;
    paths: string[];
    attrs: unknown;
}

const EXTENSIONES_AUDIO = new Set([
    'wav', 'mp3', 'flac', 'aiff', 'aif', 'ogg',
]);

/*
 * QL62: Extensiones conocidas de archivos no-audio.
 * Si un path de nivel 1 tiene alguna de estas extensiones, NO es una carpeta,
 * es un archivo suelto que el usuario colocó en la raíz de la carpeta sync.
 * Esto previene que "READ ME!.txt" o "PandaFX.gif" se traten como colecciones.
 */
const EXTENSIONES_ARCHIVO_CONOCIDAS = new Set([
    'txt', 'md', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv',
    'gif', 'png', 'jpg', 'jpeg', 'webp', 'bmp', 'svg', 'ico', 'tiff', 'psd', 'ai',
    'exe', 'msi', 'dmg', 'app', 'bat', 'sh', 'ps1', 'cmd',
    'zip', 'rar', 'tar', 'gz', '7z', 'bz2', 'xz', 'iso',
    'json', 'xml', 'html', 'htm', 'css', 'js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'php',
    'avi', 'mov', 'mp4', 'mkv', 'wmv', 'flv', 'webm', 'm4v',
    'mid', 'midi', 'sf2', 'sfz', 'vst', 'dll', 'so', 'dylib',
    'als', 'flp', 'logic', 'cpr', 'ptx', 'rpp',
    'torrent', 'lnk', 'url', 'desktop',
    'log', 'bak', 'old', 'orig', 'swp', 'swo',
]);

/*
 * QL68: Heuristica para detectar si un nombre tiene extension de archivo.
 * Si tiene un punto seguido de 1-10 caracteres alfanumericos al final → es archivo, no carpeta.
 * Esto cubre extensiones inventadas/desconocidas no presentes en EXTENSIONES_ARCHIVO_CONOCIDAS.
 * Carpetas con puntos en el nombre (ej: "v2.0") siguen pasando porque el check
 * de EXTENSIONES_AUDIO y EXTENSIONES_ARCHIVO_CONOCIDAS se hace primero.
 */
function pareceArchivoConExtension(nombre: string): boolean {
    const ultimoPunto = nombre.lastIndexOf('.');
    if (ultimoPunto <= 0 || ultimoPunto === nombre.length - 1) return false;
    const sufijo = nombre.slice(ultimoPunto + 1);
    return sufijo.length <= 10 && /^[a-zA-Z0-9]+$/.test(sufijo);
}

async function esDirectorioReal(ruta: string): Promise<boolean> {
    try {
        const { stat } = await import('@tauri-apps/plugin-fs');
        const info = await stat(ruta);
        return Boolean((info as { isDirectory?: boolean }).isDirectory);
    } catch {
        return false;
    }
}

/* Archivos temporales que los editores/DAWs crean durante grabación */
const PATRONES_TEMPORALES = [
    /^\./, /~$/, /\.tmp$/i, /\.part$/i, /\.crdownload$/i,
    /\.download$/i, /Thumbs\.db$/i, /desktop\.ini$/i,
];

/*
 * P1+P7: Carpetas internas excluidas del watcher.
 * CARPETAS_EXCLUIDAS_TOTAL: se ignora TODO evento (create, delete, modify).
 * CARPETAS_SISTEMA_NO_COLECCION: carpetas que permiten subida de archivos de audio
 *   pero NO deben generar colecciones en el servidor. El watcher procesa CREATEs
 *   de archivos pero bloquea eventos de creacion de carpeta para estos nombres.
 *   QL70: "Sin colección" y "duplicados" ahora suben archivos al servidor.
 * El filtro se aplica por segmento de ruta (split('/')) para evitar falsos
 * positivos con nombres como "carpeta.papelera-mix/".
 */
const CARPETAS_EXCLUIDAS_TOTAL = new Set([
    '.papelera',
]);

/*
 * QL70: Carpetas del sistema sync que permiten subida de archivos pero NO deben
 * generar colecciones. En manejarArchivoNuevo se descartan estos nombres de
 * la lista de carpetas para que el server los trate como "sin colección".
 */
const CARPETAS_SISTEMA_NO_COLECCION = new Set([
    'sin colecci\u00f3n',
    'sin coleccion',
    'duplicados',
]);

/* Cache de archivos recientemente procesados para ignorar eventos duplicados */
const archivosRecientes = new Map<string, number>();
const DEBOUNCE_ARCHIVO_MS = 3000;

/* Cache de carpetas recientemente procesadas para ignorar eventos duplicados.
 * Evita que eventos create + modify sobre la misma carpeta disparen
 * múltiples llamadas a onCarpetaNueva (causa raíz de duplicación de colecciones). */
const carpetasRecientes = new Map<string, number>();
const DEBOUNCE_CARPETA_MS = 5000;

/*
 * Carpetas pendientes de creacion: cuando Windows crea una carpeta nueva,
 * la nombra "Nueva carpeta" y luego el usuario la renombra.
 * Si disparamos onCarpetaNueva inmediatamente, creamos una coleccion con
 * nombre incorrecto en el servidor. Delay de 3s da tiempo al rename.
 * Si el rename llega antes del timeout, cancelamos y usamos el nombre final.
 */
const carpetasPendientesCreacion = new Map<string, {
    timeout: ReturnType<typeof setTimeout>;
    nombreOriginal: string;
    rutaCompleta: string;
}>();
const DELAY_CREACION_CARPETA_MS = 3000;

/*
 * C1: Nombres de carpetas temporales que los sistemas operativos crean
 * al hacer "Nueva carpeta". NUNCA deben generar colecciones — el timeout
 * se extiende a 60s (tiempo suficiente para que el usuario renombre).
 * Si no se renombra en 60s, se ignora silenciosamente.
 */
const NOMBRES_CARPETA_TEMPORAL = new Set([
    'nueva carpeta',
    'new folder',
    'nuevo directorio',
    'untitled folder',
    'sans titre',
    'neuer ordner',
]);
const DELAY_CARPETA_TEMPORAL_MS = 60_000;

/*
 * QL76: Buffer de acumulacion para copias masivas.
 * Cuando el usuario copia/mueve muchos archivos a la carpeta de sync,
 * el sistema acumulaba cada deteccion y procesaba inmediatamente (hash I/O + upload),
 * compitiendo por I/O con la copia en curso y ralentizando el sistema.
 *
 * Solucion: acumular archivos nuevos en buffer y procesarlos despues de un
 * periodo de quietud (sin nuevos archivos detectados). Si siguen llegando
 * archivos, el timer se reinicia. Hay un tope maximo para no bloquear
 * indefinidamente en copias muy grandes.
 */
const QUIETUD_BATCH_MS = 5_000;
const MAX_ESPERA_BATCH_MS = 30_000;

interface ArchivoBufferado {
    ruta: string;
    nombre: string;
    carpetas: string[];
}

let bufferArchivosNuevos: ArchivoBufferado[] = [];
let timeoutFlushBatch: ReturnType<typeof setTimeout> | null = null;
let timestampInicioBatch: number | null = null;

function acumularArchivoNuevo(ruta: string, nombre: string, carpetas: string[]): void {
    bufferArchivosNuevos.push({ ruta, nombre, carpetas });

    const ahora = Date.now();
    if (!timestampInicioBatch) timestampInicioBatch = ahora;

    /* Si llevamos mas de MAX_ESPERA_BATCH_MS acumulando, flush parcial */
    if (ahora - timestampInicioBatch >= MAX_ESPERA_BATCH_MS) {
        flushBufferArchivos();
        return;
    }

    /* Reiniciar timer de quietud */
    if (timeoutFlushBatch) clearTimeout(timeoutFlushBatch);
    timeoutFlushBatch = setTimeout(flushBufferArchivos, QUIETUD_BATCH_MS);
}

function flushBufferArchivos(): void {
    if (timeoutFlushBatch) {
        clearTimeout(timeoutFlushBatch);
        timeoutFlushBatch = null;
    }
    timestampInicioBatch = null;

    const batch = bufferArchivosNuevos.splice(0);
    if (batch.length === 0) return;

    logSync.info('watcher', `Flush batch: ${batch.length} archivos nuevos acumulados`);

    for (const { ruta, nombre, carpetas } of batch) {
        if (onArchivoNuevo) {
            onArchivoNuevo(ruta, nombre, carpetas);
        }
    }
}

/* Purga periódica del cache para evitar crecimiento ilimitado en batches grandes */
const PURGA_INTERVALO_MS = 10_000;
const PURGA_TTL_MS = 30_000;
let purgaInterval: ReturnType<typeof setInterval> | null = null;

function iniciarPurgaPeriodica(): void {
    if (purgaInterval) return;
    purgaInterval = setInterval(() => {
        const ahora = Date.now();
        for (const [k, v] of archivosRecientes) {
            if (ahora - v > PURGA_TTL_MS) archivosRecientes.delete(k);
        }
    }, PURGA_INTERVALO_MS);
}

function detenerPurgaPeriodica(): void {
    if (purgaInterval) {
        clearInterval(purgaInterval);
        purgaInterval = null;
    }
}

/*
 * Gracia para detección de MOVEs.
 * Un MOVE genera DELETE + CREATE. Bufferamos el DELETE por GRACIA_MOVE_MS
 * y si aparece un CREATE con el mismo nombre, se trata como move.
 */
const GRACIA_MOVE_MS = 5000;

interface EliminacionPendiente {
    ruta: string;
    nombreArchivo: string;
    timeout: ReturnType<typeof setTimeout>;
}

/* Mapa: nombreArchivo normalizado → EliminacionPendiente */
const eliminacionesPendientes = new Map<string, EliminacionPendiente>();

/*
 * C287: Buffer para rename events no pareados.
 * En Windows, el notify crate puede emitir From y To como eventos separados
 * con modify.kind='name' y 1 path cada uno. Sin buffer, ambos se ignoran
 * silenciosamente en el for loop (esEventoCreacion y esEventoEliminacion
 * no detectan modify.kind='name').
 * Se buferea el primer path y se espera al segundo para parear como rename.
 * Si no llega par en GRACIA_RENAME_PAR_MS, se despacha como DELETE sintético
 * para que el patrón delete+create detecte el rename al llegar un CREATE posterior.
 */
interface RenameNoPareado {
    ruta: string;
    timestamp: number;
    timeout: ReturnType<typeof setTimeout>;
    baseNormalizada: string;
    carpetaBase: string;
}
let renamePendienteNoPareado: RenameNoPareado | null = null;
const GRACIA_RENAME_PAR_MS = 2000;

type UnwatchFn = () => void;

let unwatchFn: UnwatchFn | null = null;
let observando = false;

/* Callbacks externos que fileWatcherService llama según el evento detectado */
type OnArchivoNuevoFn = (ruta: string, nombreArchivo: string, carpetas: string[]) => void;
type OnArchivoEliminadoFn = (ruta: string) => void;
type OnArchivoMovidoFn = (rutaAnterior: string, rutaNueva: string, nombreArchivo: string, carpetas: string[]) => void;

/* C357: Callbacks para eventos de carpetas de nivel 1 (colecciones) */
type OnCarpetaNuevaFn = (nombre: string, rutaCompleta: string) => void;
type OnCarpetaRenombradaFn = (nombreAnterior: string, nombreNuevo: string, rutaNueva: string) => void;

let onArchivoNuevo: OnArchivoNuevoFn | null = null;
let onArchivoEliminado: OnArchivoEliminadoFn | null = null;
let onArchivoMovido: OnArchivoMovidoFn | null = null;

/* C357: Callbacks de carpetas */
let onCarpetaNueva: OnCarpetaNuevaFn | null = null;
let onCarpetaRenombrada: OnCarpetaRenombradaFn | null = null;

/* C387: Callbacks para eventos de subcarpetas de nivel 2 (subcolecciones) */
type OnSubcarpetaNuevaFn = (nombreSub: string, carpetaPadre: string, rutaCompleta: string) => void;
type OnSubcarpetaRenombradaFn = (nombreAnterior: string, nombreNuevo: string, carpetaPadre: string, rutaNueva: string) => void;

let onSubcarpetaNueva: OnSubcarpetaNuevaFn | null = null;
let onSubcarpetaRenombrada: OnSubcarpetaRenombradaFn | null = null;

/*
 * Buffer de eliminaciones de carpetas para detectar renames.
 * Similar al patrón delete+create → move para archivos.
 */
const carpetasEliminadasPendientes = new Map<string, { nombre: string; ruta: string; timeout: ReturnType<typeof setTimeout> }>();
const GRACIA_RENAME_CARPETA_MS = 3000;

/*
 * C387: State para subcarpetas de nivel 2.
 * Debounce y buffers análogos a los de carpetas de nivel 1 pero con clave
 * compuesta carpetaPadre/nombreSub para evitar colisiones entre colecciones.
 */
const subcarpetasRecientes = new Map<string, number>();
const subcarpetasPendientesCreacion = new Map<string, {
    timeout: ReturnType<typeof setTimeout>;
    nombreOriginal: string;
    carpetaPadre: string;
    rutaCompleta: string;
}>();
const subcarpetasEliminadasPendientes = new Map<string, {
    nombre: string;
    carpetaPadre: string;
    ruta: string;
    timeout: ReturnType<typeof setTimeout>;
}>();

/*
 * Registra los callbacks externos para archivos nuevos/eliminados/movidos.
 * Se llama desde syncService al inicializar.
 */
export function registrarCallbacks(
    cbNuevo: OnArchivoNuevoFn,
    cbEliminado: OnArchivoEliminadoFn,
    cbMovido?: OnArchivoMovidoFn,
): void {
    onArchivoNuevo = cbNuevo;
    onArchivoEliminado = cbEliminado;
    onArchivoMovido = cbMovido ?? null;
}

/*
 * C357: Registra callbacks para eventos de carpetas de nivel 1 (colecciones).
 * Separados de los callbacks de archivos para mantener SRP.
 */
export function registrarCallbacksCarpeta(
    cbNueva: OnCarpetaNuevaFn,
    cbRenombrada: OnCarpetaRenombradaFn,
): void {
    onCarpetaNueva = cbNueva;
    onCarpetaRenombrada = cbRenombrada;
}

/*
 * C387: Registra callbacks para eventos de subcarpetas de nivel 2 (subcolecciones).
 * carpetaPadre identifica en qué colección se creó la subcarpeta.
 */
export function registrarCallbacksSubcarpeta(
    cbNueva: OnSubcarpetaNuevaFn,
    cbRenombrada: OnSubcarpetaRenombradaFn,
): void {
    onSubcarpetaNueva = cbNueva;
    onSubcarpetaRenombrada = cbRenombrada;
}

/*
 * Inicia la observación de la carpeta de sincronización.
 * Retorna true si se inició correctamente, false si no hay carpeta configurada.
 */
export async function iniciarObservacion(): Promise<boolean> {
    if (!esDesktop() || observando) return false;

    const config = obtenerConfigSync();
    if (!config.carpetaLocal || !config.sincronizacionActiva) {
        logSync.warn('watcher', 'iniciarObservacion ABORTADO — config incompleta', {
            carpetaLocal: !!config.carpetaLocal,
            sincronizacionActiva: config.sincronizacionActiva,
        });
        return false;
    }

    try {
        const fsModule = await import('@tauri-apps/plugin-fs');
        /* QL107: watch existe en el modulo pero TS 5.9 no lo resuelve
         * correctamente via dynamic import() — cast seguro. */
        const watchFn = (fsModule as Record<string, unknown>).watch as (
            paths: string | string[],
            cb: (event: EventoWatch) => void,
            options?: { recursive?: boolean; delayMs?: number },
        ) => Promise<UnwatchFn>;

        unwatchFn = await watchFn(
            config.carpetaLocal,
            (evento: EventoWatch) => { void procesarEvento(evento, config.carpetaLocal!); },
            { recursive: true, delayMs: 1500 },
        );

        observando = true;
        iniciarPurgaPeriodica();
        logSync.info('watcher', `Observando carpeta: ${config.carpetaLocal}`);
        return true;
    } catch (err) {
        logSync.error('watcher', 'Error iniciando observación', { error: err instanceof Error ? err.message : String(err) });
        return false;
    }
}

/*
 * Detiene la observación de la carpeta.
 */
export async function detenerObservacion(): Promise<void> {
    if (unwatchFn) {
        unwatchFn();
        unwatchFn = null;
    }
    observando = false;
    detenerPurgaPeriodica();
    archivosRecientes.clear();
    carpetasRecientes.clear();

    /* Limpiar eliminaciones pendientes para evitar callbacks sueltos */
    for (const [, pendiente] of eliminacionesPendientes) {
        clearTimeout(pendiente.timeout);
    }
    eliminacionesPendientes.clear();

    /* C357: Limpiar carpetas pendientes de rename */
    for (const [, pendiente] of carpetasEliminadasPendientes) {
        clearTimeout(pendiente.timeout);
    }
    carpetasEliminadasPendientes.clear();

    /* Limpiar creaciones de carpeta pendientes (debounce rename) */
    for (const [, pendiente] of carpetasPendientesCreacion) {
        clearTimeout(pendiente.timeout);
    }
    carpetasPendientesCreacion.clear();

    /* C387: Limpiar state de subcarpetas */
    for (const [, pendiente] of subcarpetasPendientesCreacion) {
        clearTimeout(pendiente.timeout);
    }
    subcarpetasPendientesCreacion.clear();
    for (const [, pendiente] of subcarpetasEliminadasPendientes) {
        clearTimeout(pendiente.timeout);
    }
    subcarpetasEliminadasPendientes.clear();
    subcarpetasRecientes.clear();

    /* C287: Limpiar rename no pareado pendiente */
    if (renamePendienteNoPareado) {
        clearTimeout(renamePendienteNoPareado.timeout);
        renamePendienteNoPareado = null;
    }

    /* QL76: Flush inmediato del buffer de archivos pendientes al detener */
    flushBufferArchivos();

    logSync.info('watcher', 'Observación detenida');
}

/*
 * Indica si el watcher está activo.
 */
export function estaObservando(): boolean {
    return observando;
}

/*
 * Procesa un evento del watcher del filesystem.
 * Filtra por tipos relevantes (create, remove) y valida extensiones.
 * C357: También detecta eventos de carpetas de nivel 1 (colecciones).
 */
async function procesarEvento(
    evento: { type: unknown; paths: string[] },
    carpetaBase: string,
): Promise<void> {
    const tipo = evento.type;

    const baseNormalizada = carpetaBase.replace(/\\/g, '/').replace(/\/$/, '');

    /*
     * Manejo explícito de rename/move nativo del FS.
     * Algunos proveedores emiten modify.kind = 'name' con 2 paths (origen, destino)
     * en vez de remove+create. Si no lo manejamos aquí, el move se pierde.
     * TA4: try-catch para evitar que un fallo en callbacks detenga el watcher loop.
     */
    if (esEventoRename(tipo) && evento.paths.length >= 2) {
      try {
        const rutaOrigen = evento.paths[0] ?? '';
        const rutaDestino = evento.paths[1] ?? '';
        const origenNorm = rutaOrigen.replace(/\\/g, '/');
        const destinoNorm = rutaDestino.replace(/\\/g, '/');

        const relativaOrigen = origenNorm.startsWith(baseNormalizada + '/')
            ? origenNorm.slice(baseNormalizada.length + 1)
            : '';
        const relativaDestino = destinoNorm.startsWith(baseNormalizada + '/')
            ? destinoNorm.slice(baseNormalizada.length + 1)
            : '';

        const segmentosOrigen = relativaOrigen.split('/').filter(Boolean);
        const segmentosDestino = relativaDestino.split('/').filter(Boolean);

        if (segmentosOrigen.some(s => CARPETAS_EXCLUIDAS_TOTAL.has(s)) || segmentosDestino.some(s => CARPETAS_EXCLUIDAS_TOTAL.has(s))) {
            return;
        }

        const nombreDestino = destinoNorm.split('/').pop() ?? '';
        const extensionDestino = nombreDestino.split('.').pop()?.toLowerCase() ?? '';

        const esCarpetaNivel1Rename =
            !!relativaOrigen
            && !!relativaDestino
            && !relativaOrigen.includes('/')
            && !relativaDestino.includes('/')
            && !EXTENSIONES_AUDIO.has(extensionDestino);

        if (esCarpetaNivel1Rename) {
            if (!await esDirectorioReal(destinoNorm)) {
                logSync.warn('watcher', `Rename ignorado: destino sin extension pero no es carpeta real: ${nombreDestino}`);
                return;
            }
            const nombreOrigen = relativaOrigen;
            const nombreNueva = relativaDestino;

            /* Cancelar creacion pendiente del nombre origen.
             * Esto cubre el caso "Nueva carpeta" → "test2" donde Windows
             * primero emite CREATE y luego RENAME. Sin esto, la coleccion
             * se crea con el nombre temporal. */
            const claveOrigen = nombreOrigen.toLowerCase();
            const pendiente = carpetasPendientesCreacion.get(claveOrigen);
            if (pendiente) {
                clearTimeout(pendiente.timeout);
                carpetasPendientesCreacion.delete(claveOrigen);
                logSync.info('watcher', `Creacion cancelada por rename: ${nombreOrigen} → ${nombreNueva}`);
            }

            logSync.info('watcher', `Rename carpeta (evento name): ${nombreOrigen} → ${nombreNueva}`);
            if (onCarpetaRenombrada) {
                onCarpetaRenombrada(nombreOrigen, nombreNueva, rutaDestino);
            }
            return;
        }

        /*
         * C387: Detectar rename de subcarpetas de nivel 2.
         * Ambos paths deben tener exactamente 2 segmentos con el mismo padre.
         */
        const segOrigenArr = relativaOrigen.split('/').filter(Boolean);
        const segDestinoArr = relativaDestino.split('/').filter(Boolean);

        const esSubcarpetaRename =
            segOrigenArr.length === 2
            && segDestinoArr.length === 2
            && segOrigenArr[0].toLowerCase() === segDestinoArr[0].toLowerCase()
            && !EXTENSIONES_AUDIO.has(extensionDestino);

        if (esSubcarpetaRename) {
            if (!await esDirectorioReal(destinoNorm)) {
                logSync.warn('watcher', `Rename subcarpeta ignorado: destino no es carpeta real: ${relativaDestino}`);
                return;
            }
            const carpetaPadre = segDestinoArr[0];
            const subOrigen = segOrigenArr[1];
            const subNuevo = segDestinoArr[1];

            /* Cancelar creacion pendiente del nombre origen si existe */
            const claveSubOrigen = `${carpetaPadre.toLowerCase()}/${subOrigen.toLowerCase()}`;
            const pendienteSub = subcarpetasPendientesCreacion.get(claveSubOrigen);
            if (pendienteSub) {
                clearTimeout(pendienteSub.timeout);
                subcarpetasPendientesCreacion.delete(claveSubOrigen);
                logSync.info('watcher', `Creacion subcarpeta cancelada por rename: ${subOrigen} → ${subNuevo}`);
            }

            logSync.info('watcher', `Rename subcarpeta (evento name): ${subOrigen} → ${subNuevo} en ${carpetaPadre}`);
            if (onSubcarpetaRenombrada) {
                onSubcarpetaRenombrada(subOrigen, subNuevo, carpetaPadre, rutaDestino);
            }
            return;
        }

        /* Guard: solo procesar el move si el destino está dentro de la carpeta base */
        if (EXTENSIONES_AUDIO.has(extensionDestino) && relativaDestino) {
            const partesDestino = relativaDestino.split('/');
            const nombreArchivo = partesDestino.pop() ?? nombreDestino;
            const carpetas = partesDestino.slice(0, 3);
            logSync.info('watcher', `Move archivo (evento name): ${rutaOrigen} → ${rutaDestino}`);
            if (onArchivoMovido) {
                onArchivoMovido(rutaOrigen, rutaDestino, nombreArchivo, carpetas);
                return;
            }
            if (onArchivoNuevo) {
                onArchivoNuevo(rutaDestino, nombreArchivo, carpetas);
                return;
            }
        }
      } catch (err) {
        logSync.error('watcher', 'Error procesando evento rename', {
            error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    /*
     * C287: Fallback para rename events con un solo path (From/To separados).
     * En Windows, notify puede emitir RenameMode::From y RenameMode::To como
     * eventos independientes con modify.kind='name' y paths.length=1.
     * Sin este fallback, ambos se ignoran silenciosamente porque
     * esEventoCreacion/esEventoEliminacion no detectan modify.kind='name'.
     *
     * Estrategia: buffear el primer path (From) y esperar el segundo (To).
     * Si llega par, re-despachar como rename pareado con 2 paths.
     * Si no llega par (timeout), despachar como DELETE sintético para que
     * el patrón delete+create existente detecte el rename.
     */
    if (esEventoRename(tipo) && evento.paths.length === 1) {
        manejarRenameNoPareado(evento.paths[0], baseNormalizada, carpetaBase);
        return;
    }

    for (const ruta of evento.paths) {
        const normalizada = ruta.replace(/\\/g, '/');
        const nombreArchivo = normalizada.split('/').pop() ?? '';

        /* Ignorar archivos temporales */
        if (PATRONES_TEMPORALES.some(p => p.test(nombreArchivo))) continue;

        /*
         * P1+P7: Filtro temprano de carpetas excluidas.
         * Se evalúa ANTES de clasificar tipo de evento para cortar lo más pronto posible.
         */
        const relativa = normalizada.startsWith(baseNormalizada + '/')
            ? normalizada.slice(baseNormalizada.length + 1)
            : '';

        /*
         * Guard crítico: omitir eventos de rutas que NO están dentro de la carpeta base.
         * En Windows con OneDrive/SMB el driver del sistema de archivos puede emitir
         * eventos para directorios hermanos o padres de la carpeta vigilada.
         * Sin este filtro, archivos fuera del scope configurado se encolarían para subida.
         */
        if (!relativa) continue;

        const segmentosRuta = relativa.split('/');

        /* Exclusión total: ignorar TODO evento dentro de .papelera/ */
        if (segmentosRuta.some(s => CARPETAS_EXCLUIDAS_TOTAL.has(s))) continue;

        /*
         * QL70: Carpetas sistema (sin colección, duplicados) permiten CREATEs de archivos
         * pero NO deben generar eventos de carpeta (procesarEventoCarpeta).
         * El filtro de carpeta se aplica más abajo en la detección de nivel 1.
         */

        /*
         * C357: Detectar eventos de carpetas de nivel 1 (hijas directas de carpetaBase).
         * Una carpeta de nivel 1 = carpeta de colección. Si se crea o renombra, sincronizar.
         * Heurística: si el path NO tiene extensión de audio y es hijo directo de base,
         * tratarlo como posible evento de carpeta.
         * QL62: Si tiene extensión de archivo conocida (txt, gif, png, etc.) NO es carpeta.
         * Evita que archivos sueltos como "READ ME!.txt" creen colecciones fantasma.
         */
        const extension = nombreArchivo.split('.').pop()?.toLowerCase() ?? '';

        if (relativa && !relativa.includes('/') && !EXTENSIONES_AUDIO.has(extension)) {
            /* QL62+QL68: Archivos con extensión conocida o desconocida no son carpetas */
            if (extension && (EXTENSIONES_ARCHIVO_CONOCIDAS.has(extension) || pareceArchivoConExtension(nombreArchivo))) {
                logSync.warn('watcher', `Archivo no-audio ignorado en raiz sync: ${nombreArchivo}`);
                continue;
            }
            if (esEventoCreacion(tipo) && !await esDirectorioReal(normalizada)) {
                logSync.warn('watcher', `Archivo sin extension ignorado en raiz sync (no es carpeta real): ${nombreArchivo}`);
                continue;
            }
            /* QL70: No crear colección para carpetas de sistema (sin colección, duplicados).
             * Archivos de audio dentro de ellas sí se suben (procesados abajo). */
            if (CARPETAS_SISTEMA_NO_COLECCION.has(relativa.toLowerCase())) {
                continue;
            }
            /* Es un path directo bajo carpetaBase sin extensión de audio → posible carpeta */
            procesarEventoCarpeta(tipo, normalizada, relativa, baseNormalizada);
            continue;
        }

        /*
         * C387: Detectar eventos de subcarpetas de nivel 2 (subcolecciones).
         * Exactamente 2 segmentos en la ruta relativa: carpetaPadre/nombreSub.
         * Ej: "MiColeccion/Kicks" → carpetaPadre="MiColeccion", nombreSub="Kicks".
         * QL62: Misma proteccion que nivel 1 — ignorar si tiene extension conocida.
         */
        if (segmentosRuta.length === 2 && !EXTENSIONES_AUDIO.has(extension)) {
            if (extension && (EXTENSIONES_ARCHIVO_CONOCIDAS.has(extension) || pareceArchivoConExtension(segmentosRuta[1]))) {
                logSync.warn('watcher', `Archivo no-audio ignorado en subcarpeta: ${relativa}`);
                continue;
            }
            if (esEventoCreacion(tipo) && !await esDirectorioReal(normalizada)) {
                logSync.warn('watcher', `Archivo sin extension ignorado en subcarpeta (no es carpeta real): ${relativa}`);
                continue;
            }
            const [carpetaPadre, nombreSubcarpeta] = segmentosRuta;
            procesarEventoSubcarpeta(tipo, normalizada, nombreSubcarpeta, carpetaPadre, baseNormalizada);
            continue;
        }

        /* Verificar extensión de audio para archivos normales */
        if (!EXTENSIONES_AUDIO.has(extension)) continue;

        /* Debounce por archivo: ignorar si fue procesado recientemente */
        const ahora = Date.now();
        const ultimoProcesado = archivosRecientes.get(normalizada);
        if (ultimoProcesado && (ahora - ultimoProcesado) < DEBOUNCE_ARCHIVO_MS) continue;
        archivosRecientes.set(normalizada, ahora);

        if (esEventoCreacion(tipo)) {
            manejarArchivoNuevo(ruta, normalizada, carpetaBase);
        } else if (esEventoEliminacion(tipo)) {
            /*
             * Para eliminaciones, limpiar del debounce cache: si luego llega un
             * create (move), no debe ser bloqueado por el debounce del delete previo.
             */
            archivosRecientes.delete(normalizada);
            manejarArchivoEliminado(ruta);
        }
    }
}

/*
 * Determina si el tipo de evento es una creación de archivo.
 */
function esEventoCreacion(tipo: unknown): boolean {
    if (tipo === 'any') return false;
    if (typeof tipo === 'object' && tipo !== null && 'create' in tipo) return true;
    /* Modify puede significar que el archivo termino de escribirse */
    if (typeof tipo === 'object' && tipo !== null && 'modify' in tipo) {
        const modify = (tipo as { modify: { kind: string } }).modify;
        /* Solo data changes, no metadata */
        return modify?.kind === 'data' || modify?.kind === 'any';
    }
    return false;
}

function esEventoRename(tipo: unknown): boolean {
    if (typeof tipo === 'object' && tipo !== null && 'modify' in tipo) {
        const modify = (tipo as { modify: { kind: string } }).modify;
        return modify?.kind === 'name';
    }
    return false;
}

/*
 * Determina si el tipo de evento es una eliminación de archivo.
 */
function esEventoEliminacion(tipo: unknown): boolean {
    if (typeof tipo === 'object' && tipo !== null && 'remove' in tipo) return true;
    return false;
}

/*
 * Maneja la detección de un archivo de audio nuevo en la carpeta sync.
 * Antes de emitir onArchivoNuevo, verifica si hay una eliminación pendiente
 * con el mismo nombre → en ese caso es un MOVE, no un archivo nuevo.
 */
function manejarArchivoNuevo(rutaOriginal: string, rutaNormalizada: string, carpetaBase: string): void {
    /* Extraer todas las carpetas padre relativas a la carpeta base de sync */
    const baseNormalizada = carpetaBase.replace(/\\/g, '/');
    const relativa = rutaNormalizada.startsWith(baseNormalizada + '/')
        ? rutaNormalizada.slice(baseNormalizada.length + 1)
        : '';

    /*
     * Guard defensivo: en circunstancias normales procesarEvento ya filtró rutas fuera
     * de la carpeta base. Este guard protege ante llamadas directas o cambios futuros.
     */
    if (!relativa) {
        logSync.warn('watcher', `Ruta fuera de carpeta base ignorada: ${rutaNormalizada} (base: ${carpetaBase})`);
        return;
    }

    const partes = relativa.split('/');
    const nombreArchivo = partes.pop() ?? '';
    /*
     * Carpetas entre la base de sync y el archivo (max 3 niveles).
     * QL70: Filtrar nombres de carpetas de sistema (sin colección, duplicados)
     * para que el server trate estos archivos como "sin colección" en vez
     * de crear una colección con ese nombre.
     */
    const carpetas = partes.filter(
        c => !CARPETAS_SISTEMA_NO_COLECCION.has(c.toLowerCase()),
    );

    /* Verificar si hay una eliminación pendiente con el mismo nombre */
    const clave = nombreArchivo.toLowerCase();
    const pendiente = eliminacionesPendientes.get(clave);

    if (pendiente) {
        /* Es un MOVE: cancelar la eliminación pendiente y emitir move */
        clearTimeout(pendiente.timeout);
        eliminacionesPendientes.delete(clave);

        logSync.info('watcher', `Move detectado: ${pendiente.ruta} → ${rutaOriginal}`);

        if (onArchivoMovido) {
            onArchivoMovido(pendiente.ruta, rutaOriginal, nombreArchivo, carpetas);
        }
        return;
    }

    logSync.info('watcher', `Archivo nuevo detectado: ${nombreArchivo} carpetas: ${carpetas.join('/')}`);

    /*
     * QL76: Acumular en buffer en vez de procesar inmediatamente.
     * Cuando se copian muchos archivos, el hash I/O y los uploads compiten
     * con la copia en curso. El buffer espera un periodo de quietud antes
     * de despachar el batch completo al uploadQueue.
     */
    acumularArchivoNuevo(rutaOriginal, nombreArchivo, carpetas);
}

/*
 * Maneja la eliminación de un archivo de audio de la carpeta sync.
 * NO ejecuta inmediatamente — buferea por GRACIA_MOVE_MS para detectar MOVEs.
 * Si pasada la gracia no apareció un CREATE con el mismo nombre, se confirma.
 */
function manejarArchivoEliminado(rutaOriginal: string): void {
    const normalizada = rutaOriginal.replace(/\\/g, '/');
    const nombreArchivo = normalizada.split('/').pop() ?? '';
    const clave = nombreArchivo.toLowerCase();

    /* Si ya hay una eliminación pendiente para este nombre, cancelar la anterior */
    const existente = eliminacionesPendientes.get(clave);
    if (existente) {
        clearTimeout(existente.timeout);
    }

    logSync.info('watcher', `Eliminación detectada (esperando ${GRACIA_MOVE_MS}ms por posible move): ${rutaOriginal}`);

    const timeout = setTimeout(() => {
        eliminacionesPendientes.delete(clave);
        logSync.info('watcher', `Eliminación confirmada (no fue move): ${rutaOriginal}`);
        if (onArchivoEliminado) {
            onArchivoEliminado(rutaOriginal);
        }
    }, GRACIA_MOVE_MS);

    eliminacionesPendientes.set(clave, {
        ruta: rutaOriginal,
        nombreArchivo,
        timeout,
    });
}

/*
 * C357: Procesa eventos de carpetas de nivel 1 (colecciones).
 * Detecta creación y rename (delete+create con diferente nombre).
 *
 * Rename de carpeta emite: remove(nombreViejo) + create(nombreNuevo).
 * Se usa buffer temporal similar al de archivos para detectar el patrón.
 */
function procesarEventoCarpeta(
    tipo: unknown,
    rutaCompleta: string,
    nombreCarpeta: string,
    _baseNormalizada: string,
): void {
    /* QL103: Suprimir eventos de carpeta durante sync masivo (mkdir + writeFile) */
    if (esDescargaMasivaEnCurso()) return;

    if (esEventoCreacion(tipo)) {
        /* Verificar si hay una carpeta eliminada pendiente → es un rename */
        const pendiente = encuentraCarpetaEliminadaPendiente();

        if (pendiente) {
            clearTimeout(pendiente.timeout);
            carpetasEliminadasPendientes.delete(pendiente.nombre);

            /* Cancelar creacion pendiente del nombre viejo (delete+create rename) */
            const clavePendiente = pendiente.nombre.toLowerCase();
            const creacionPendiente = carpetasPendientesCreacion.get(clavePendiente);
            if (creacionPendiente) {
                clearTimeout(creacionPendiente.timeout);
                carpetasPendientesCreacion.delete(clavePendiente);
                logSync.info('watcher', `Creacion cancelada por rename (delete+create): ${pendiente.nombre}`);
            }

            logSync.info('watcher', `Rename de carpeta detectado: ${pendiente.nombre} → ${nombreCarpeta}`);

            if (onCarpetaRenombrada) {
                onCarpetaRenombrada(pendiente.nombre, nombreCarpeta, rutaCompleta);
            }
            return;
        }

        /* Debounce por carpeta: ignorar si fue procesada recientemente.
         * Previene que el par create + modify emita dos callbacks. */
        const claveCarpeta = nombreCarpeta.toLowerCase();
        const ahora = Date.now();
        const ultimoProcesada = carpetasRecientes.get(claveCarpeta);
        if (ultimoProcesada && (ahora - ultimoProcesada) < DEBOUNCE_CARPETA_MS) return;
        carpetasRecientes.set(claveCarpeta, ahora);

        logSync.info('watcher', `Carpeta nueva detectada, esperando rename: ${nombreCarpeta}`);

        /* Delay la creacion para dar tiempo a que Windows complete el rename.
         * Sin esto, "Nueva carpeta" se envia al servidor antes de que el usuario
         * termine de escribir el nombre real.
         * C1: Carpetas con nombres temporales del OS (Nueva carpeta, New folder, etc.)
         * tienen timeout extendido de 60s y NO se crean si expiran — se ignoran. */
        const claveCreacion = nombreCarpeta.toLowerCase();
        const pendienteExistente = carpetasPendientesCreacion.get(claveCreacion);
        if (pendienteExistente) clearTimeout(pendienteExistente.timeout);

        const esTemporal = NOMBRES_CARPETA_TEMPORAL.has(claveCreacion)
            || /^nueva carpeta\s*\(\d+\)$/i.test(nombreCarpeta)
            || /^new folder\s*\(\d+\)$/i.test(nombreCarpeta);
        const delayMs = esTemporal ? DELAY_CARPETA_TEMPORAL_MS : DELAY_CREACION_CARPETA_MS;

        const timeoutCreacion = setTimeout(() => {
            carpetasPendientesCreacion.delete(claveCreacion);
            if (esTemporal) {
                logSync.info('watcher', `Carpeta temporal ignorada (no renombrada a tiempo): ${nombreCarpeta}`);
                return;
            }
            logSync.info('watcher', `Carpeta nueva confirmada (sin rename): ${nombreCarpeta}`);
            if (onCarpetaNueva) {
                onCarpetaNueva(nombreCarpeta, rutaCompleta);
            }
        }, delayMs);

        carpetasPendientesCreacion.set(claveCreacion, {
            timeout: timeoutCreacion,
            nombreOriginal: nombreCarpeta,
            rutaCompleta,
        });
    } else if (esEventoEliminacion(tipo)) {
        /* Bufferar eliminación para detectar posible rename */
        const existente = carpetasEliminadasPendientes.get(nombreCarpeta);
        if (existente) {
            clearTimeout(existente.timeout);
        }

        const timeout = setTimeout(() => {
            carpetasEliminadasPendientes.delete(nombreCarpeta);
            /* Eliminación confirmada — la carpeta fue borrada, no renombrada.
             * No sincronizamos borrado de carpeta al servidor (podría ser limpieza local). */
            logSync.info('watcher', `Carpeta eliminada (no fue rename): ${nombreCarpeta}`);
        }, GRACIA_RENAME_CARPETA_MS);

        carpetasEliminadasPendientes.set(nombreCarpeta, {
            nombre: nombreCarpeta,
            ruta: rutaCompleta,
            timeout,
        });
    }
}

/*
 * Busca la primera carpeta eliminada pendiente (para detectar rename).
 * Debería haber como máximo una a la vez en una operación de rename.
 */
function encuentraCarpetaEliminadaPendiente(): { nombre: string; ruta: string; timeout: ReturnType<typeof setTimeout> } | null {
    for (const [, val] of carpetasEliminadasPendientes) {
        return val;
    }
    return null;
}

/*
 * C387: Procesa eventos de subcarpetas de nivel 2 (subcolecciones).
 * Lógica análoga a procesarEventoCarpeta pero con clave compuesta
 * carpetaPadre/nombreSub y callbacks dedicados (onSubcarpetaNueva/Renombrada).
 *
 * Rename de subcarpeta emite: remove(padre/viejo) + create(padre/nuevo).
 * El buffer de eliminaciones se busca filtrando por el mismo carpetaPadre.
 */
function procesarEventoSubcarpeta(
    tipo: unknown,
    rutaCompleta: string,
    nombreSubcarpeta: string,
    carpetaPadre: string,
    _baseNormalizada: string,
): void {
    /* QL103: Suprimir eventos de subcarpeta durante sync masivo */
    if (esDescargaMasivaEnCurso()) return;

    const claveCompuesta = `${carpetaPadre.toLowerCase()}/${nombreSubcarpeta.toLowerCase()}`;

    if (esEventoCreacion(tipo)) {
        /* Verificar si hay una subcarpeta eliminada pendiente del mismo padre → rename */
        const pendiente = encuentraSubcarpetaEliminadaPendiente(carpetaPadre);

        if (pendiente) {
            clearTimeout(pendiente.timeout);
            const clavePendiente = `${pendiente.carpetaPadre.toLowerCase()}/${pendiente.nombre.toLowerCase()}`;
            subcarpetasEliminadasPendientes.delete(clavePendiente);

            /* Cancelar creacion pendiente del nombre viejo si existía */
            const claveCreacionVieja = `${pendiente.carpetaPadre.toLowerCase()}/${pendiente.nombre.toLowerCase()}`;
            const creacionPendiente = subcarpetasPendientesCreacion.get(claveCreacionVieja);
            if (creacionPendiente) {
                clearTimeout(creacionPendiente.timeout);
                subcarpetasPendientesCreacion.delete(claveCreacionVieja);
            }

            logSync.info('watcher', `Rename subcarpeta detectado: ${pendiente.nombre} → ${nombreSubcarpeta} en ${carpetaPadre}`);

            if (onSubcarpetaRenombrada) {
                onSubcarpetaRenombrada(pendiente.nombre, nombreSubcarpeta, carpetaPadre, rutaCompleta);
            }
            return;
        }

        /* Debounce: ignorar si fue procesada recientemente */
        const ahora = Date.now();
        const ultimoProcesada = subcarpetasRecientes.get(claveCompuesta);
        if (ultimoProcesada && (ahora - ultimoProcesada) < DEBOUNCE_CARPETA_MS) return;
        subcarpetasRecientes.set(claveCompuesta, ahora);

        logSync.info('watcher', `Subcarpeta nueva detectada, esperando rename: ${nombreSubcarpeta} en ${carpetaPadre}`);

        /* Delay para dar tiempo a rename de Windows ("Nueva carpeta" → nombre real)
         * C1: Misma lógica de carpetas temporales aplicada a subcarpetas. */
        const pendienteExistente = subcarpetasPendientesCreacion.get(claveCompuesta);
        if (pendienteExistente) clearTimeout(pendienteExistente.timeout);

        const esTemporalSub = NOMBRES_CARPETA_TEMPORAL.has(nombreSubcarpeta.toLowerCase())
            || /^nueva carpeta\s*\(\d+\)$/i.test(nombreSubcarpeta)
            || /^new folder\s*\(\d+\)$/i.test(nombreSubcarpeta);
        const delayMsSub = esTemporalSub ? DELAY_CARPETA_TEMPORAL_MS : DELAY_CREACION_CARPETA_MS;

        const timeoutCreacion = setTimeout(() => {
            subcarpetasPendientesCreacion.delete(claveCompuesta);
            if (esTemporalSub) {
                logSync.info('watcher', `Subcarpeta temporal ignorada: ${nombreSubcarpeta} en ${carpetaPadre}`);
                return;
            }
            logSync.info('watcher', `Subcarpeta nueva confirmada (sin rename): ${nombreSubcarpeta} en ${carpetaPadre}`);
            if (onSubcarpetaNueva) {
                onSubcarpetaNueva(nombreSubcarpeta, carpetaPadre, rutaCompleta);
            }
        }, delayMsSub);

        subcarpetasPendientesCreacion.set(claveCompuesta, {
            timeout: timeoutCreacion,
            nombreOriginal: nombreSubcarpeta,
            carpetaPadre,
            rutaCompleta,
        });
    } else if (esEventoEliminacion(tipo)) {
        /* Bufferar eliminación para detectar posible rename */
        const existente = subcarpetasEliminadasPendientes.get(claveCompuesta);
        if (existente) {
            clearTimeout(existente.timeout);
        }

        const timeout = setTimeout(() => {
            subcarpetasEliminadasPendientes.delete(claveCompuesta);
            logSync.info('watcher', `Subcarpeta eliminada (no fue rename): ${nombreSubcarpeta} en ${carpetaPadre}`);
        }, GRACIA_RENAME_CARPETA_MS);

        subcarpetasEliminadasPendientes.set(claveCompuesta, {
            nombre: nombreSubcarpeta,
            carpetaPadre,
            ruta: rutaCompleta,
            timeout,
        });
    }
}

/*
 * C387: Busca la primera subcarpeta eliminada pendiente dentro de un padre específico.
 * Filtra por carpetaPadre para no cruzar renames entre colecciones distintas.
 */
function encuentraSubcarpetaEliminadaPendiente(carpetaPadre: string): {
    nombre: string;
    carpetaPadre: string;
    ruta: string;
    timeout: ReturnType<typeof setTimeout>;
} | null {
    const padreNorm = carpetaPadre.toLowerCase();
    for (const [, val] of subcarpetasEliminadasPendientes) {
        if (val.carpetaPadre.toLowerCase() === padreNorm) return val;
    }
    return null;
}

/*
 * C287: Maneja rename events con un solo path (From/To separados).
 *
 * En Windows, notify-rs puede emitir RenameMode::From y RenameMode::To
 * como eventos independientes con modify.kind='name'. Tauri descarta
 * el RenameMode, así que ambos llegan como { modify: { kind: 'name' } }
 * con paths.length=1. Sin este handler, caen al for loop donde
 * esEventoCreacion y esEventoEliminacion no los reconocen → se ignoran.
 *
 * Flujo:
 *   1. Primer path (From, viejo) → buffear con timeout.
 *   2. Segundo path (To, nuevo) → parear con buffer → re-despachar
 *      como rename con 2 paths (procesarEvento recursivo).
 *   3. Si solo llega 1 path (timeout sin par) → despachar como DELETE
 *      sintético para que el patrón delete+create existente lo detecte
 *      cuando llegue un CREATE posterior.
 */
function manejarRenameNoPareado(
    ruta: string,
    baseNormalizada: string,
    carpetaBase: string,
): void {
    const normalizada = ruta.replace(/\\/g, '/');
    const relativa = normalizada.startsWith(baseNormalizada + '/')
        ? normalizada.slice(baseNormalizada.length + 1)
        : '';
    if (!relativa) return;

    const segmentos = relativa.split('/').filter(Boolean);
    if (segmentos.some(s => CARPETAS_EXCLUIDAS_TOTAL.has(s))) return;

    if (renamePendienteNoPareado) {
        /* Segundo path — parear con el primero y re-despachar como rename pareado */
        clearTimeout(renamePendienteNoPareado.timeout);
        const origenRuta = renamePendienteNoPareado.ruta;
        renamePendienteNoPareado = null;

        logSync.info('watcher', `Rename pareado desde eventos separados: ${origenRuta} → ${ruta}`);

        /* Re-despachar: el handler de rename pareado (2 paths) resuelve nivel 1, 2 y archivos */
        void procesarEvento(
            { type: { modify: { kind: 'name' } }, paths: [origenRuta, ruta] },
            carpetaBase,
        );
    } else {
        /* Primer path — buffear esperando el segundo */
        const timeout = setTimeout(() => {
            const pendiente = renamePendienteNoPareado;
            renamePendienteNoPareado = null;
            if (!pendiente) return;

            /*
             * Sin par: despachar como DELETE sintético.
             * Si luego llega un CREATE (nuevo nombre), el patrón delete+create
             * en procesarEventoCarpeta/Subcarpeta detectará el rename.
             */
            const norm = pendiente.ruta.replace(/\\/g, '/');
            const rel = norm.startsWith(pendiente.baseNormalizada + '/')
                ? norm.slice(pendiente.baseNormalizada.length + 1)
                : '';
            if (!rel) return;

            const segs = rel.split('/').filter(Boolean);
            const tipoRemove = { remove: { kind: 'any' } };

            if (segs.length === 1 && !EXTENSIONES_AUDIO.has(segs[0].split('.').pop()?.toLowerCase() ?? '')) {
                logSync.info('watcher', `Rename sin par → dispatch como eliminación carpeta: ${rel}`);
                procesarEventoCarpeta(tipoRemove, norm, rel, pendiente.baseNormalizada);
            } else if (segs.length === 2 && !EXTENSIONES_AUDIO.has(segs[1].split('.').pop()?.toLowerCase() ?? '')) {
                logSync.info('watcher', `Rename sin par → dispatch como eliminación subcarpeta: ${rel}`);
                procesarEventoSubcarpeta(tipoRemove, norm, segs[1], segs[0], pendiente.baseNormalizada);
            }
        }, GRACIA_RENAME_PAR_MS);

        renamePendienteNoPareado = {
            ruta,
            timestamp: Date.now(),
            timeout,
            baseNormalizada,
            carpetaBase,
        };
    }
}