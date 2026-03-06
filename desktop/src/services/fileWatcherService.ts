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

const EXTENSIONES_AUDIO = new Set([
    'wav', 'mp3', 'flac', 'aiff', 'aif', 'ogg',
]);

/* Archivos temporales que los editores/DAWs crean durante grabación */
const PATRONES_TEMPORALES = [
    /^\./, /~$/, /\.tmp$/i, /\.part$/i, /\.crdownload$/i,
    /\.download$/i, /Thumbs\.db$/i, /desktop\.ini$/i,
];

/*
 * P1+P7: Carpetas internas excluidas del watcher.
 * CARPETAS_EXCLUIDAS_TOTAL: se ignora TODO evento (create, delete, modify).
 * CARPETAS_SOLO_DELETE: se ignoran CREATEs pero se procesan DELETEs
 *   (para que manejarBorradoLocal funcione si alguien borra desde ahí).
 * El filtro se aplica por segmento de ruta (split('/')) para evitar falsos
 * positivos con nombres como "carpeta.papelera-mix/".
 */
const CARPETAS_EXCLUIDAS_TOTAL = new Set([
    '.papelera',
]);
const CARPETAS_SOLO_DELETE = new Set([
    'sin colecci\u00f3n',
    'sin coleccion',
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
    if (!config.carpetaLocal || !config.sincronizacionActiva) return false;

    try {
        const { watch } = await import('@tauri-apps/plugin-fs');

        unwatchFn = await watch(
            config.carpetaLocal,
            (evento) => { procesarEvento(evento, config.carpetaLocal!); },
            { recursive: true, delayMs: 1500 },
        );

        observando = true;
        iniciarPurgaPeriodica();
        console.info('[FileWatcher] Observando carpeta:', config.carpetaLocal);
        return true;
    } catch (err) {
        console.error('[FileWatcher] Error iniciando observación:', err);
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

    console.info('[FileWatcher] Observación detenida');
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
function procesarEvento(
    evento: { type: unknown; paths: string[] },
    carpetaBase: string,
): void {
    const tipo = evento.type;

    const baseNormalizada = carpetaBase.replace(/\\/g, '/').replace(/\/$/, '');

    /*
     * Manejo explícito de rename/move nativo del FS.
     * Algunos proveedores emiten modify.kind = 'name' con 2 paths (origen, destino)
     * en vez de remove+create. Si no lo manejamos aquí, el move se pierde.
     */
    if (esEventoRename(tipo) && evento.paths.length >= 2) {
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
                console.info('[FileWatcher] Creacion cancelada por rename:', nombreOrigen, '→', nombreNueva);
            }

            console.info('[FileWatcher] Rename carpeta (evento name):', nombreOrigen, '→', nombreNueva);
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
            const carpetaPadre = segDestinoArr[0];
            const subOrigen = segOrigenArr[1];
            const subNuevo = segDestinoArr[1];

            /* Cancelar creacion pendiente del nombre origen si existe */
            const claveSubOrigen = `${carpetaPadre.toLowerCase()}/${subOrigen.toLowerCase()}`;
            const pendienteSub = subcarpetasPendientesCreacion.get(claveSubOrigen);
            if (pendienteSub) {
                clearTimeout(pendienteSub.timeout);
                subcarpetasPendientesCreacion.delete(claveSubOrigen);
                console.info('[FileWatcher] Creacion subcarpeta cancelada por rename:', subOrigen, '→', subNuevo);
            }

            console.info('[FileWatcher] Rename subcarpeta (evento name):', subOrigen, '→', subNuevo, 'en', carpetaPadre);
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
            console.info('[FileWatcher] Move archivo (evento name):', rutaOrigen, '→', rutaDestino);
            if (onArchivoMovido) {
                onArchivoMovido(rutaOrigen, rutaDestino, nombreArchivo, carpetas);
                return;
            }
            if (onArchivoNuevo) {
                onArchivoNuevo(rutaDestino, nombreArchivo, carpetas);
                return;
            }
        }
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

        /* Exclusión parcial: ignorar CREATEs pero permitir DELETEs en Sin colección */
        /*
         * Exclusión parcial: ignorar CREATEs de archivos dentro de Sin colección.
         * C3: Permitir CREATEs de subcarpetas (nivel 2) para poder moverlas fuera.
         */
        if (esEventoCreacion(tipo) && segmentosRuta.some(s => CARPETAS_SOLO_DELETE.has(s.toLowerCase()))) {
            const extensionTemprana = nombreArchivo.split('.').pop()?.toLowerCase() ?? '';
            const esPosibleSubcarpeta = segmentosRuta.length === 2 && !EXTENSIONES_AUDIO.has(extensionTemprana);
            if (!esPosibleSubcarpeta) continue;
        }

        /*
         * C357: Detectar eventos de carpetas de nivel 1 (hijas directas de carpetaBase).
         * Una carpeta de nivel 1 = carpeta de colección. Si se crea o renombra, sincronizar.
         * Heurística: si el path NO tiene extensión de audio y es hijo directo de base,
         * tratarlo como posible evento de carpeta.
         */
        const extension = nombreArchivo.split('.').pop()?.toLowerCase() ?? '';

        if (relativa && !relativa.includes('/') && !EXTENSIONES_AUDIO.has(extension)) {
            /* Es un path directo bajo carpetaBase sin extensión de audio → posible carpeta */
            procesarEventoCarpeta(tipo, normalizada, relativa, baseNormalizada);
            continue;
        }

        /*
         * C387: Detectar eventos de subcarpetas de nivel 2 (subcolecciones).
         * Exactamente 2 segmentos en la ruta relativa: carpetaPadre/nombreSub.
         * Ej: "MiColeccion/Kicks" → carpetaPadre="MiColeccion", nombreSub="Kicks".
         */
        if (segmentosRuta.length === 2 && !EXTENSIONES_AUDIO.has(extension)) {
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
    /* Extraer las 3 carpetas padre relativas a la carpeta base de sync */
    const baseNormalizada = carpetaBase.replace(/\\/g, '/');
    const relativa = rutaNormalizada.startsWith(baseNormalizada + '/')
        ? rutaNormalizada.slice(baseNormalizada.length + 1)
        : '';

    /*
     * Guard defensivo: en circunstancias normales procesarEvento ya filtró rutas fuera
     * de la carpeta base. Este guard protege ante llamadas directas o cambios futuros.
     */
    if (!relativa) {
        console.warn('[FileWatcher] manejarArchivoNuevo: ruta fuera de carpeta base ignorada:', rutaNormalizada, '(base:', carpetaBase, ')');
        return;
    }

    const partes = relativa.split('/');
    const nombreArchivo = partes.pop() ?? '';
    /* Carpetas entre la base de sync y el archivo (max 3 niveles) */
    const carpetas = partes.slice(0, 3);

    /* Verificar si hay una eliminación pendiente con el mismo nombre */
    const clave = nombreArchivo.toLowerCase();
    const pendiente = eliminacionesPendientes.get(clave);

    if (pendiente) {
        /* Es un MOVE: cancelar la eliminación pendiente y emitir move */
        clearTimeout(pendiente.timeout);
        eliminacionesPendientes.delete(clave);

        console.info('[FileWatcher] Move detectado:', pendiente.ruta, '→', rutaOriginal);

        if (onArchivoMovido) {
            onArchivoMovido(pendiente.ruta, rutaOriginal, nombreArchivo, carpetas);
        }
        return;
    }

    console.info('[FileWatcher] Archivo nuevo detectado:', nombreArchivo, 'carpetas:', carpetas);

    if (onArchivoNuevo) {
        onArchivoNuevo(rutaOriginal, nombreArchivo, carpetas);
    }
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

    console.info('[FileWatcher] Eliminación detectada (esperando', GRACIA_MOVE_MS, 'ms por posible move):', rutaOriginal);

    const timeout = setTimeout(() => {
        eliminacionesPendientes.delete(clave);
        console.info('[FileWatcher] Eliminación confirmada (no fue move):', rutaOriginal);
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
                console.info('[FileWatcher] Creacion cancelada por rename (delete+create):', pendiente.nombre);
            }

            console.info('[FileWatcher] Rename de carpeta detectado:', pendiente.nombre, '→', nombreCarpeta);

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

        console.info('[FileWatcher] Carpeta nueva detectada, esperando rename:', nombreCarpeta);

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
                console.info('[FileWatcher] Carpeta temporal ignorada (no renombrada a tiempo):', nombreCarpeta);
                return;
            }
            console.info('[FileWatcher] Carpeta nueva confirmada (sin rename):', nombreCarpeta);
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
            console.info('[FileWatcher] Carpeta eliminada (no fue rename):', nombreCarpeta);
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

            console.info('[FileWatcher] Rename subcarpeta detectado:', pendiente.nombre, '→', nombreSubcarpeta, 'en', carpetaPadre);

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

        console.info('[FileWatcher] Subcarpeta nueva detectada, esperando rename:', nombreSubcarpeta, 'en', carpetaPadre);

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
                console.info('[FileWatcher] Subcarpeta temporal ignorada:', nombreSubcarpeta, 'en', carpetaPadre);
                return;
            }
            console.info('[FileWatcher] Subcarpeta nueva confirmada (sin rename):', nombreSubcarpeta, 'en', carpetaPadre);
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
            console.info('[FileWatcher] Subcarpeta eliminada (no fue rename):', nombreSubcarpeta, 'en', carpetaPadre);
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