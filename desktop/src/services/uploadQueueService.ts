/* sentinel-disable-file limite-lineas
 * Justificacion: Cola central de subida con multiples guards de seguridad (race conditions,
 * dedup por hash, antispam, circuit breaker, backoff, semaforo, persistencia). Dividirlo
 * requiere refactoring mayor de estado compartido no relacionado a ninguna tarea actual. */
/*
 * Servicio: uploadQueueService — Cola de subida de samples al servidor.
 *
 * Gestiona la subida automática de archivos detectados por fileWatcherService.
 * Procesa en orden FIFO con reintentos, detección de duplicados por hash parcial,
 * y persistencia en Tauri Store para resistir cierres inesperados.
 *
 * Flujo por archivo:
 *   1. Verificar duplicado (hash parcial: primeros 8KB + últimos 8KB + tamaño)
 *   2. Extraer contexto de ruta (3 carpetas padre + nombre de archivo)
 *   3. Generar título y tags desde el contexto
 *   4. Construir FormData y POST /samples/upload
 *   5. Registrar en índice de syncService
 *   6. Notificar progreso a la UI
 *
 * Detección de duplicados:
 *   Hash parcial = SHA-256 de (primeros 8KB + últimos 8KB + tamaño en bytes)
 *   Esto es rápido (no lee el archivo completo) y suficientemente robusto
 *   para archivos de audio que difieren en contenido.
 */

import { esDesktop, estaOnline } from './desktopService';
import { extraerMetadataDeRuta, registrarSubidaLocal, registrarAccionHistorial, actualizarEstadoSampleHistorial, moverSampleEnServidorPublico, moverArchivoASinColeccion, rehidratarImagenesPendientesForzadoSync, obtenerConfigSync } from './syncService';
import { obtenerBaseUrlSync } from './syncGuards';
import { Semaforo } from './semaforo';
import { persistirConDebounce, flushPersistencia } from './persistenciaDebounce';
import { estado } from './syncState';
import { esRutaPapelera, normalizarNombreParaDedup } from './normalizarNombreArchivo';
import { clasificarError, obtenerEstrategia, esErrorDeRed } from './errorSync';
import { circuitoUpload, CircuitoBiertoError } from './circuitBreaker';
import { logSync } from './syncLogger';

const STORE_FILE = 'upload-queue.json';

/*
 * SEC-A3: Extensiones de audio validas para subida.
 * Solo estos formatos se aceptan — cualquier otro se rechaza antes de encolar.
 * Server-side tambien valida (defensa en profundidad).
 */
const EXTENSIONES_AUDIO_VALIDAS = new Set(['.wav', '.mp3', '.flac', '.aiff', '.aif', '.ogg']);

function esExtensionAudioValida(nombreArchivo: string): boolean {
    const ultimoPunto = nombreArchivo.lastIndexOf('.');
    if (ultimoPunto < 0) return false;
    return EXTENSIONES_AUDIO_VALIDAS.has(nombreArchivo.substring(ultimoPunto).toLowerCase());
}

/*
 * Verifica si una ruta de archivo está dentro de la carpeta de sync configurada.
 * Normaliza separadores y casing para comparación segura en Windows.
 * Retorna false si no hay carpeta configurada (failsafe: bloquear).
 */
function estaEnCarpetaSync(rutaArchivo: string): boolean {
    const config = obtenerConfigSync();
    if (!config?.carpetaLocal) return false;
    const carpetaNorm = config.carpetaLocal.replace(/\\/g, '/').toLowerCase();
    const rutaNorm = rutaArchivo.replace(/\\/g, '/').toLowerCase();
    return rutaNorm.startsWith(carpetaNorm);
}
const STORE_KEY_COLA = 'upload_cola';
const STORE_KEY_HASHES = 'upload_hashes_procesados';

const MAX_REINTENTOS = 3;
const BACKOFF_BASE_MS = 2000;

/*
 * Espera a que un archivo sea legible (no bloqueado por otro proceso).
 *
 * En Windows, los file watchers emiten CREATE antes de que la escritura finalice.
 * OneDrive y operaciones de copia mantienen un lock exclusivo hasta completar.
 * Intentar readFile inmediatamente causa "os error 32: being used by another process".
 *
 * Usa backoff exponencial corto: 300ms, 600ms, 1.2s, 2.4s, 4.8s (~9.3s total).
 * Si tras 5 intentos sigue bloqueado, retorna false para que el flujo
 * normal de reintentos de la cola lo maneje.
 */
const READINESS_MAX_INTENTOS = 5;
const READINESS_DELAY_MS = 300;

async function esperarArchivoDisponible(rutaArchivo: string): Promise<boolean> {
    const { stat } = await import('@tauri-apps/plugin-fs');

    for (let intento = 0; intento < READINESS_MAX_INTENTOS; intento++) {
        try {
            const info = await stat(rutaArchivo);
            /*
             * stat() puede funcionar en archivos locked (solo lee metadata del FS).
             * Pero si el tamanio es 0, el archivo aun no tiene contenido visible.
             * Un tamanio > 0 es condicion necesaria (no suficiente) para readability.
             */
            if (info.size && info.size > 0) {
                /*
                 * Intentar lectura minima (1 byte) para confirmar que el lock de escritura
                 * se ha liberado. Esto es lo que realmente falla con os error 32.
                 */
                try {
                    const { readFile } = await import('@tauri-apps/plugin-fs');
                    await readFile(rutaArchivo, { offset: 0, length: 1 } as Parameters<typeof readFile>[1]);
                    return true;
                } catch {
                    /* Lock sigue activo, continuar esperando */
                }
            }
        } catch {
            /* Archivo no existe o inaccesible */
        }

        if (intento < READINESS_MAX_INTENTOS - 1) {
            const delay = READINESS_DELAY_MS * Math.pow(2, intento);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    return false;
}

/* Estado de cada item en la cola */
export type EstadoUpload = 'pendiente' | 'subiendo' | 'completado' | 'error' | 'duplicado';

export interface ItemUploadCola {
    id: string;
    rutaArchivo: string;
    nombreArchivo: string;
    carpetas: string[];
    estado: EstadoUpload;
    intentos: number;
    ultimoError?: string;
    timestampCreado: number;
    timestampActualizado: number;
    sampleIdServidor?: number;
    hashParcial?: string;
    /** Clave de idempotencia para evitar duplicados si el upload se reintenta tras timeout */
    idempotencyKey: string;
}

export interface ProgresoUpload {
    item: ItemUploadCola;
    totalEnCola: number;
    posicionEnCola: number;
}

export interface ResumenDebugUploadQueue {
    totalItems: number;
    totalPendientes: number;
    totalSubiendo: number;
    totalErrores: number;
    totalCompletados: number;
    totalDuplicados: number;
    procesando: boolean;
    rutasEnCola: number;
    rutasEnVuelo: number;
    hashesConocidos: number;
    hashesEnVuelo: number;
    hashesPendientesEncola: number;
    hashesMapeados: number;
    hashesBloqueadosAntispam: number;
    muestrasActivas: Array<{
        id: string;
        nombreArchivo: string;
        estado: EstadoUpload;
        intentos: number;
        rutaArchivo: string;
        sampleIdServidor?: number;
        ultimoError?: string;
        timestampActualizado: number;
    }>;
}

type OnProgresoUploadFn = (progreso: ProgresoUpload) => void;

let cola: ItemUploadCola[] = [];
let hashesConocidos = new Set<string>();
/*
 * C6: Mapa hash → rutas para poder verificar si un hash corresponde a un archivo
 * activo en tracking (no borrado del servidor). Permite dedup cross-carpeta correcta.
 * 1:N porque un mismo contenido puede existir en múltiples rutas (copias).
 */
let hashARutas = new Map<string, Set<string>>();
let procesando = false;
let callbackProgreso: OnProgresoUploadFn | null = null;

/* Set O(1) para verificar si una ruta ya está en cola. Evita cola.some() O(n). */
let rutasEnCola = new Set<string>();

/*
 * Guard síncrono contra race condition en encolarArchivo().
 * Problema: encolarArchivo es async y el callback del watcher no hace await.
 * Si llegan dos eventos rápidos (create + modify), ambos entran en encolarArchivo,
 * ambos pasan rutasEnCola.has() (que se actualiza DESPUÉS del await calcularHash),
 * y ambos encolan el mismo archivo → duplicado.
 *
 * Solución: este Set se actualiza SÍNCRONAMENTE al inicio de encolarArchivo,
 * antes de cualquier await. El segundo llamado lo ve inmediatamente y retorna false.
 */
const rutasEncolando = new Set<string>();

/*
 * Guard de hash en vuelo para uploads paralelos.
 * Con archivosParalelos > 1, dos items con el mismo hash podrían ejecutar
 * subirArchivo() simultáneamente, ambos pasando hashesConocidos.has() antes
 * de que ninguno lo añada. Este Set previene que dos uploads del mismo
 * contenido estén en vuelo al mismo tiempo.
 */
const hashesEnVuelo = new Set<string>();

/*
 * Guard de ruta en vuelo: complementa hashesEnVuelo para cubrir el caso
 * donde hash es null (error de FS, archivo bloqueado, OneDrive).
 * Sin esto, dos items del mismo archivo con hash null pueden uploadear
 * en paralelo porque hashesEnVuelo no los cubre.
 */
const rutasEnVuelo = new Set<string>();

/*
 * TC2: Guard de hash pendiente para encolarArchivoInterno.
 * Problema: dos llamados concurrentes a encolarArchivoInterno calculan hash en paralelo
 * (await calcularHashParcial). Ambos pueden pasar hashesConocidos.has() y cola.some()
 * porque ninguno ha terminado de encolar aún. Este Set se marca SÍNCRONAMENTE después
 * del await del hash y antes de cola.push, cerrando la ventana de race.
 */
const hashesPendientesEncola = new Set<string>();

/*
 * QL69: Antispam — contador de detecciones por hash.
 * Si un mismo contenido (hash) se detecta mas de MAX_DETECCIONES_HASH veces,
 * el sistema deja de sincronizarlo. Previene que un archivo problematico
 * (ej: copia repetida, loop de watcher) sature la cola indefinidamente.
 * Se persiste con la cola para sobrevivir reinicios.
 * [2103A-11] Umbral subido de 6 a 25: con el watcher disparando múltiples eventos
 * por archivo, 6 era demasiado estricto para sample packs con muchos snares/kicks.
 * El contador ya no incrementa una vez alcanzado el límite (evita contadores de +20). */
const MAX_DETECCIONES_HASH = 25;
const contadorHashDetectado = new Map<string, number>();

function registrarDeteccionHash(hash: string): number {
    const actual = (contadorHashDetectado.get(hash) ?? 0) + 1;
    /* [2103A-11] Capear en MAX para que el contador no crezca indefinidamente
     * cuando el orphan analysis re-descubre el mismo archivo continuamente. */
    const capeado = Math.min(actual, MAX_DETECCIONES_HASH);
    contadorHashDetectado.set(hash, capeado);
    return actual; // retornar actual (no capeado) para el log de bloqueo
}

function esHashBloqueadoPorAntispam(hash: string): boolean {
    return (contadorHashDetectado.get(hash) ?? 0) >= MAX_DETECCIONES_HASH;
}

function normalizarRutaCola(ruta: string): string {
    return ruta.replace(/\\/g, '/');
}

function claveRutaEnCola(ruta: string): string {
    return normalizarRutaCola(ruta).toLowerCase();
}

function hashSimpleTexto(texto: string): string {
    let hash = 2166136261;
    for (let i = 0; i < texto.length; i++) {
        hash ^= texto.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}

/*
 * C6: Verifica si existe al menos un archivo activo en tracking que fue
 * subido con el hash dado. Usa hashARutas (1:N) para obtener todas las rutas
 * asociadas y verifica en tracking que alguna sigue activa (no borrada).
 * Si ninguna ruta está activa, recorre la cola completada como fallback.
 */
function existeArchivoActivoConHash(hash: string): boolean {
    const rutas = hashARutas.get(hash);
    if (rutas && rutas.size > 0 && estado.trackingModule) {
        for (const ruta of rutas) {
            const enTracking = estado.trackingModule.buscarArchivoPorRuta(ruta);
            if (enTracking && !enTracking.syncDeshabilitado) return true;
        }
    }
    /* Fallback: verificar si algún item realmente subido en cola tiene este hash.
     * Requiere sampleIdServidor para descartar items marcados 'completado' por
     * falso positivo de dedup (no tienen server ID, no son uploads reales). */
    return cola.some(i => i.hashParcial === hash && i.estado === 'completado' && !!i.sampleIdServidor);
}

function crearIdempotencyKeyDeterministica(rutaArchivo: string, nombreArchivo: string, hashParcial?: string): string {
    if (hashParcial && hashParcial.length > 0) {
        return `up-hash-${hashParcial.slice(0, 48)}`;
    }
    const rutaNorm = normalizarRutaCola(rutaArchivo);
    return `up-ruta-${hashSimpleTexto(`${rutaNorm}|${nombreArchivo.toLowerCase()}`)}`;
}

/* Semáforo de concurrencia: controla cuántos archivos se suben en paralelo.
 * El límite se lee de configAvanzada.archivosParalelos al iniciar procesarCola. */
let semaforoUpload: Semaforo | null = null;

/*
 * Inicializa la cola: carga items pendientes y hashes del store.
 */
export async function inicializarUploadQueue(): Promise<void> {
    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);

        const colaGuardada = await store.get<ItemUploadCola[]>(STORE_KEY_COLA);
        if (colaGuardada) {
            /* Restaurar solo items no completados Y dentro de la carpeta sync.
             * Items residuales de antes del fix C378 (watcher scope) se purgan aquí
             * para que no se reintenten eternamente al reiniciar la app. */
            cola = colaGuardada.filter(i => {
                if (i.estado === 'completado') return false;
                if (!estaEnCarpetaSync(i.rutaArchivo)) {
                    console.warn('[UploadQueue] Purgando item persistido fuera de carpeta sync:', i.nombreArchivo);
                    return false;
                }
                return true;
            });

            /*
             * C384: Verificar existencia física de archivos en disco.
             * Items cuyo archivo fue eliminado/movido/OneDrive cloud-only no deben
             * persistir en la cola entre reinicios. Sin esta verificación, archivos
             * fantasma se reintentan eternamente cada vez que se abre la app.
             */
            try {
                const { exists } = await import('@tauri-apps/plugin-fs');
                const verificaciones = await Promise.all(
                    cola.map(async (item) => {
                        try { return await exists(item.rutaArchivo); }
                        catch { return true; /* En caso de error FS, conservar item */ }
                    }),
                );
                const antesCount = cola.length;
                cola = cola.filter((_, idx) => {
                    if (!verificaciones[idx]) {
                        console.warn('[UploadQueue] Purgando item con archivo inexistente:', cola[idx].nombreArchivo);
                        return false;
                    }
                    return true;
                });
                if (antesCount !== cola.length) {
                    console.info(`[UploadQueue] Purgados ${antesCount - cola.length} items con archivos inexistentes`);
                }
            } catch {
                /* plugin-fs no disponible — conservar items existentes */
            }

            /* Items que estaban "subiendo" al cerrar -> volver a pendiente.
             * Migración: items de store pre-C368 no tienen idempotencyKey. */
            for (const item of cola) {
                if (item.estado === 'subiendo') {
                    item.estado = 'pendiente';
                }
                item.rutaArchivo = normalizarRutaCola(item.rutaArchivo);
                if (!item.idempotencyKey) {
                    item.idempotencyKey = crearIdempotencyKeyDeterministica(
                        item.rutaArchivo,
                        item.nombreArchivo,
                        item.hashParcial,
                    );
                }
            }
            /* Reconstruir Set de rutas para lookups O(1) */
            rutasEnCola = new Set(cola.map(i => claveRutaEnCola(i.rutaArchivo)));
        }

        const hashesGuardados = await store.get<string[]>(STORE_KEY_HASHES);
        if (hashesGuardados) {
            hashesConocidos = new Set(hashesGuardados);
        }
        /* C6: Restaurar mapa hash→rutas (1:N) para dedup cross-carpeta */
        const mapaGuardado = await store.get<Record<string, string | string[]>>('hash_a_ruta');
        if (mapaGuardado) {
            hashARutas = new Map();
            for (const [h, v] of Object.entries(mapaGuardado)) {
                hashARutas.set(h, new Set(Array.isArray(v) ? v : [v]));
            }
        }
        /* QL69: Restaurar contador antispam */
        const antispamGuardado = await store.get<Record<string, number>>('antispam_hash_contador');
        if (antispamGuardado) {
            for (const [h, c] of Object.entries(antispamGuardado)) {
                contadorHashDetectado.set(h, c);
            }
        }
    } catch {
        /* Store no disponible — usar cola en memoria */
    }

    /* Escuchar reconexión para reanudar subidas */
    window.addEventListener('online', () => { procesarCola(); });

    /* Listener cross-ventana: el sync panel (sync.html) actualiza el Tauri Store
     * directamente y emite este evento. La ventana principal recarga la cola
     * desde el Store para sincronizar su memoria con los cambios. */
    try {
        const { listen } = await import('@tauri-apps/api/event');
        void listen('reintentar-errores-upload', async () => {
            /* Recargar cola desde el Store (el sync panel ya la actualizó ahí) */
            try {
                const { load } = await import('@tauri-apps/plugin-store');
                const store = await load(STORE_FILE);
                const colaGuardada = await store.get<ItemUploadCola[]>(STORE_KEY_COLA);
                if (colaGuardada) {
                    cola = colaGuardada.filter(i => {
                        if (i.estado === 'completado') return false;
                        /* C384b: Excluir items que agotaron reintentos (archivo inexistente u
                         * otro error fatal). Con la nueva lógica subirArchivo retorna true en
                         * file-not-found → estado=completado. Pero items de versiones anteriores
                         * pueden estar como 'error' con intentos agotados en el Store. */
                        if (i.estado === 'error' && i.intentos >= MAX_REINTENTOS) return false;
                        if (!estaEnCarpetaSync(i.rutaArchivo)) return false;
                        return true;
                    });
                    rutasEnCola = new Set(cola.map(i => claveRutaEnCola(i.rutaArchivo)));
                }
            } catch {
                /* Fallback: resetear desde memoria solo items con reintentos disponibles.
                 * Items que agotaron reintentos (intentos >= MAX_REINTENTOS) fueron
                 * descartados permanentemente (archivo inexistente u otro error fatal)
                 * y NO deben resetearse — hacerlo crea el ciclo infinito de reintentos. */
                for (const item of cola) {
                    if (item.estado === 'error' && item.intentos < MAX_REINTENTOS) {
                        item.estado = 'pendiente';
                        item.intentos = 0;
                        item.ultimoError = undefined;
                        item.timestampActualizado = Date.now();
                        rutasEnCola.add(claveRutaEnCola(item.rutaArchivo));
                    }
                }
            }
            if (estaOnline() && tienePendientes()) {
                procesarCola();
            }
        });
    } catch {
        /* Entorno sin Tauri — ignorar */
    }

    /* Si hay items pendientes y estamos online, procesar */
    if (estaOnline() && tienePendientes()) {
        procesarCola();
    }
}

/*
 * Registra un callback para recibir actualizaciones de progreso.
 */
export function onProgresoUpload(cb: OnProgresoUploadFn): void {
    callbackProgreso = cb;
}

/*
 * Encola un archivo nuevo para subir al servidor.
 * Llamado por fileWatcherService cuando detecta un archivo nuevo.
 *
 * Retorna false si el archivo es duplicado (ya fue subido).
 */
export async function encolarArchivo(
    rutaArchivo: string,
    nombreArchivo: string,
    carpetas: string[],
): Promise<boolean> {
    const rutaNormalizada = normalizarRutaCola(rutaArchivo);
    const rutaClave = claveRutaEnCola(rutaNormalizada);

    /* P3: Rechazar archivos dentro de .papelera — defensa en profundidad */
    if (esRutaPapelera(rutaNormalizada)) {
        console.info('[UploadQueue] Archivo en .papelera, rechazando:', nombreArchivo);
        return false;
    }

    /* SEC-A3: Rechazar archivos que no sean audio — solo extensiones validas */
    if (!esExtensionAudioValida(nombreArchivo)) {
        logSync.warn('uploadQueue', `Archivo ignorado (no audio): ${nombreArchivo}`);
        return false;
    }

    /* Guard: rechazar archivos fuera de la carpeta de sync configurada.
     * Defensa en profundidad — complementa el guard del watcher (C378).
     * Cubre edge cases de OneDrive/Windows donde el driver FS emite rutas externas. */
    if (!estaEnCarpetaSync(rutaNormalizada)) {
        console.warn('[UploadQueue] Archivo fuera de carpeta sync, rechazando en encolamiento:', nombreArchivo, rutaNormalizada);
        return false;
    }

    /*
     * Guard síncrono: prevenir race condition entre eventos create y modify.
     * DEBE ejecutarse ANTES de cualquier await para ser efectivo.
     * Si otro llamado a encolarArchivo() ya está procesando esta ruta
     * (calculando hash, etc.), rechazar inmediatamente.
     */
    if (rutasEncolando.has(rutaClave)) {
        console.info('[UploadQueue] Archivo ya en proceso de encolamiento, ignorando:', nombreArchivo);
        return false;
    }
    rutasEncolando.add(rutaClave);

    try {
        return await encolarArchivoInterno(rutaNormalizada, nombreArchivo, carpetas);
    } finally {
        rutasEncolando.delete(rutaClave);
    }
}

/*
 * Lógica interna de encolamiento, separada para que el guard síncrono
 * de encolarArchivo() pueda usar try/finally limpiamente.
 */
async function encolarArchivoInterno(
    rutaArchivo: string,
    nombreArchivo: string,
    carpetas: string[],
): Promise<boolean> {
    /*
     * P4: Normalizar nombre (elimina prefijo timestamp de papelera) para
     * que el dedup por nombre funcione aunque el archivo haya pasado por
     * papelera y luego reaparecido con prefijo timestamp.
     */
    const nombreNormalizado = normalizarNombreParaDedup(nombreArchivo);

    /* Verificar si ya está en la cola (misma ruta) — O(1) con Set */
    const rutaClave = claveRutaEnCola(rutaArchivo);
    if (rutasEnCola.has(rutaClave) && cola.some(i => claveRutaEnCola(i.rutaArchivo) === rutaClave && i.estado !== 'error')) {
        console.info('[UploadQueue] Archivo ya en cola, ignorando:', nombreNormalizado);
        return false;
    }

    /* Calcular hash parcial para detectar duplicados por contenido */
    const hash = await calcularHashParcial(rutaArchivo);

    /*
     * QL69: Antispam — verificar si este hash ha sido detectado demasiadas veces.
     * Si un archivo se detecta 6+ veces, el sistema lo bloquea para evitar
     * saturar la cola con el mismo contenido repetidamente.
     */
    if (hash) {
        /* [2103A-11] Verificar ANTES de incrementar: si ya está bloqueado, retornar
         * inmediatamente sin seguir incrementando el contador (evita log de +20 detecciones). */
        if (esHashBloqueadoPorAntispam(hash)) {
            logSync.warn('uploadQueue', `Antispam: hash bloqueado (ya superado límite): ${nombreNormalizado}`);
            return false;
        }
        const detecciones = registrarDeteccionHash(hash);
        if (detecciones >= MAX_DETECCIONES_HASH) {
            logSync.warn('uploadQueue', `Antispam: hash bloqueado tras ${detecciones} detecciones: ${nombreNormalizado}`);
            return false;
        }
    }

    /*
     * QL66-EXTRA: Pre-check contra servidor ELIMINADO.
     * Antes, el desktop consultaba /check-duplicate y bloqueaba la subida si era
     * duplicado del mismo usuario. Ahora TODOS los archivos se suben al servidor
     * y PipelineAudio decide si es duplicado (paso 2.5, antes de IA).
     * El admin revisa en duplicados_pendientes y aprueba/rechaza.
     */

    /* TC2: Verificar si otro encolarArchivoInterno concurrente już reservó este hash.
     * Este check es síncrono e inmediatamente después del await, cerrando la ventana
     * de race entre dos llamados que calculan hash en paralelo. */
    if (hash && hashesPendientesEncola.has(hash)) {
        /* QL66-EXTRA: skip sin mover a duplicados/ — el archivo ya está siendo encolado por otro hilo concurrente */
        logSync.debug('uploadQueue', `Hash ya reservado por encola concurrente, ignorando: ${nombreNormalizado}`);
        return false;
    }
    /* Reservar hash síncronamente para que el siguiente llamado concurrente lo vea */
    if (hash) hashesPendientesEncola.add(hash);

    try {

    /* Verificar también si otro item en cola ya tiene este hash (race entre encolas). */
    if (hash && cola.some(i => i.hashParcial === hash && i.estado !== 'error' && i.estado !== 'completado')) {
        /* QL66-EXTRA: skip sin mover — evitar upload duplicado del mismo batch */
        logSync.debug('uploadQueue', `Hash ya encolado en batch actual, ignorando: ${nombreNormalizado}`);
        return false;
    }

    if (hash && hashesConocidos.has(hash)) {
        /*
         * C6 fix: Hash conocido → verificar si ALGÚN archivo activo en tracking
         * tiene ese contenido. Si existe, es duplicado confirmado (mismo contenido,
         * posiblemente nombre diferente). El servidor ya tiene este sample.
         *
         * QL106: Duplicado confirmado → borrar archivo local + log claro.
         * Hash parcial (size + primeros/últimos 8KB SHA-256) es suficientemente
         * fiable para audio. El servidor tiene dedup adicional en PipelineAudio.
         */
        if (estado.trackingModule) {
            const hayActivoConHash = existeArchivoActivoConHash(hash);
            if (!hayActivoConHash) {
                console.info('[UploadQueue] Hash conocido pero sin archivo activo en tracking, evictando hash stale:', nombreNormalizado);
                hashesConocidos.delete(hash);
                /* Continuar con encolamiento normal */
            } else {
                console.info(`[UploadQueue] Duplicado confirmado — "${nombreNormalizado}" tiene el mismo contenido que un sample ya subido. Eliminando archivo local.`);
                try {
                    const { remove } = await import('@tauri-apps/plugin-fs');
                    await remove(rutaArchivo);
                    logSync.info('uploadQueue', `Archivo duplicado eliminado de disco: ${nombreNormalizado}`);
                } catch (errBorrar) {
                    logSync.warn('uploadQueue', `No se pudo eliminar duplicado "${nombreNormalizado}": ${errBorrar instanceof Error ? errBorrar.message : String(errBorrar)}`);
                }
                return false;
            }
        } else {
            logSync.debug('uploadQueue', `Hash conocido, ignorando sin mover: ${nombreNormalizado}`);
            return false;
        }
    }

    const item: ItemUploadCola = {
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        rutaArchivo,
        nombreArchivo: nombreNormalizado,
        carpetas,
        estado: 'pendiente',
        intentos: 0,
        timestampCreado: Date.now(),
        timestampActualizado: Date.now(),
        hashParcial: hash ?? undefined,
        idempotencyKey: crearIdempotencyKeyDeterministica(rutaArchivo, nombreNormalizado, hash ?? undefined),
    };

    cola.push(item);
    rutasEnCola.add(rutaClave);
    guardarColaDebounced();

    /* Historial per-sample: entrada inicial "detectado" (se actualiza a subiendo/sincronizado) */
    actualizarEstadoSampleHistorial({
        sampleId: 0, /* Temporal: se actualiza con sampleId real tras upload exitoso */
        nombreArchivo,
        estado: 'detectado',
        rutaLocal: rutaArchivo,
    }).catch(() => { /* No bloquear encolamiento por fallo en historial */ });

    /* Historial legacy para compatibilidad */
    registrarAccionHistorial({
        tipo: 'subida_pendiente',
        descripcion: `Archivo detectado: "${nombreArchivo}"`,
    }).catch(() => { /* No bloquear encolamiento por fallo en historial */ });

    logSync.debug('uploadQueue', `Archivo encolado: ${nombreArchivo}`, {
        carpetas,
        longitudCola: cola.length,
    });

    /* Si estamos online, procesar inmediatamente */
    if (estaOnline()) {
        procesarCola();
    }

    return true;

    } finally {
        /* TC2: Liberar hash reservado ahora que el item ya está en cola
         * (rutasEnCola lo cubre a partir de aquí) o se rechazó/falló. */
        if (hash) hashesPendientesEncola.delete(hash);
    }
}

/*
 * Procesa la cola con paralelismo controlado.
 * El número de uploads simultáneos se lee de configAvanzada.archivosParalelos.
 * Incluye throttle inter-archivo si hay límite de velocidad configurado.
 */
async function procesarCola(): Promise<void> {
    if (procesando || !estaOnline()) return;

    /* Circuit breaker: si el servidor está caído, no intentar uploads */
    if (!circuitoUpload.puedeEjecutar()) {
        logSync.debug('uploadQueue', 'Circuit breaker abierto, posponiendo procesamiento');
        return;
    }

    procesando = true;

    const configAvanzada = estado.configAvanzada;
    const maxParalelos = Math.max(1, Math.min(5, configAvanzada.archivosParalelos));

    /* Crear o actualizar semáforo */
    if (!semaforoUpload || semaforoUpload.limite !== maxParalelos) {
        semaforoUpload = new Semaforo(maxParalelos);
    }

    const promesasActivas: Promise<void>[] = [];

    try {
        while (true) {
            const siguiente = cola.find(i => i.estado === 'pendiente');

            if (!siguiente) {
                /* No hay más pendientes: esperar a que terminen las activas */
                if (promesasActivas.length > 0) {
                    await Promise.race(promesasActivas);
                    continue;
                }
                break;
            }

            if (!estaOnline()) break;

            siguiente.estado = 'subiendo';
            siguiente.timestampActualizado = Date.now();
            emitirProgreso(siguiente);
            guardarColaDebounced();

            /* Historial per-sample: actualizar a "subiendo" solo en primer intento */
            if (siguiente.intentos === 0) {
                actualizarEstadoSampleHistorial({
                    sampleId: 0,
                    nombreArchivo: siguiente.nombreArchivo,
                    estado: 'subiendo',
                    rutaLocal: siguiente.rutaArchivo,
                }).catch(() => {});

                registrarAccionHistorial({
                    tipo: 'subiendo',
                    descripcion: `Subiendo: "${siguiente.nombreArchivo}"`,
                }).catch(() => {});
            }

            /* Adquirir slot del semáforo (espera si pool lleno) */
            await semaforoUpload.adquirir();

            const itemRef = siguiente;
            const promesa = procesarItemUpload(itemRef, configAvanzada)
                .finally(() => {
                    semaforoUpload!.liberar();
                    const idx = promesasActivas.indexOf(promesa);
                    if (idx !== -1) promesasActivas.splice(idx, 1);
                });

            promesasActivas.push(promesa);
        }

        /* Esperar que TODAS las activas terminen */
        await Promise.all(promesasActivas);
    } finally {
        procesando = false;
        await guardarHashes();
        await flushPersistencia('upload_cola');
    }
}

/*
 * Procesa un item individual de la cola.
 * Gestiona rethintos, backoff, y throttle inter-archivo.
 */
async function procesarItemUpload(
    item: ItemUploadCola,
    configAvanzada: { velocidadMaximaSubidaMbps: number },
): Promise<void> {
    const exito = await subirArchivo(item);

    if (exito) {
        item.estado = 'completado';
        if (item.hashParcial) {
            hashesConocidos.add(item.hashParcial);
            const rutaNorm = normalizarRutaCola(item.rutaArchivo);
            const existentes = hashARutas.get(item.hashParcial) ?? new Set<string>();
            existentes.add(rutaNorm);
            hashARutas.set(item.hashParcial, existentes);
            /* Persistir hash inmediatamente para que uploads paralelos lo vean.
             * No esperar al fin de procesarCola — previene duplicados por race condition. */
            guardarHashes().catch(() => {});
        }
        rutasEnCola.delete(claveRutaEnCola(item.rutaArchivo));

        /* QK97: Borrar archivo local tras upload exitoso si la opción está activa.
         * Se ejecuta después de registrar hash y tracking para no perder referencia.
         * Fallo de borrado NO afecta al estado del upload (ya está completado). */
        if (estado.configAvanzada.borrarAlSubirExitoso) {
            if (!tieneSubidaPersistidaConfirmada(item)) {
                logSync.warn('uploadQueue', `Borrado local omitido por falta de confirmacion persistida: ${item.nombreArchivo}`);
            } else {
                try {
                    const { remove } = await import('@tauri-apps/plugin-fs');
                    await remove(item.rutaArchivo);
                    logSync.info('uploadQueue', `Archivo local borrado tras subida: ${item.nombreArchivo}`);
                } catch (errBorrado) {
                    logSync.warn('uploadQueue', `No se pudo borrar archivo local tras subida: ${item.nombreArchivo}`, {
                        error: errBorrado instanceof Error ? errBorrado.message : String(errBorrado),
                    });
                }
            }
        }

        /* Throttle inter-archivo: si hay límite de velocidad, esperar proporcionalmente */
        if (configAvanzada.velocidadMaximaSubidaMbps > 0 && item.hashParcial) {
            const tamanoEstimadoBytes = 5 * 1024 * 1024; /* ~5MB promedio */
            const bytesPerSegundo = configAvanzada.velocidadMaximaSubidaMbps * 125_000;
            const delayMs = Math.max(0, (tamanoEstimadoBytes / bytesPerSegundo) * 1000 - 500);
            if (delayMs > 100) {
                await new Promise(r => setTimeout(r, delayMs));
            }
        }
    } else {
        item.intentos++;
        if (item.intentos >= MAX_REINTENTOS) {
            item.estado = 'error';
            rutasEnCola.delete(claveRutaEnCola(item.rutaArchivo));

            actualizarEstadoSampleHistorial({
                sampleId: 0,
                nombreArchivo: item.nombreArchivo,
                estado: 'error',
                rutaLocal: item.rutaArchivo,
                error: item.ultimoError ?? 'Máximo de reintentos alcanzado',
            }).catch(() => {});

            registrarAccionHistorial({
                tipo: 'error_subida',
                descripcion: `Error al subir: "${item.nombreArchivo}" — ${item.ultimoError ?? 'desconocido'}`,
            }).catch(() => {});

            console.error('[UploadQueue] Máximo de reintentos alcanzado:', item.nombreArchivo);
        } else {
            item.estado = 'pendiente';
            /* Backoff exponencial antes de reintentar */
            const espera = BACKOFF_BASE_MS * Math.pow(2, item.intentos - 1);
            await new Promise(r => setTimeout(r, espera));
        }
    }

    item.timestampActualizado = Date.now();
    emitirProgreso(item);
    guardarColaDebounced();
}

/*
 * Sube un archivo individual al servidor.
 *
 * Flujo:
 * 1. Verificar duplicado en tracking v2 (defensa de última línea)
 * 2. Leer archivo del disco (Tauri readFile)
 * 3. Generar título y tags desde nombre y carpetas
 * 4. Construir FormData
 * 5. POST /kamples/v1/samples/upload
 * 6. Registrar descarga en índice local
 * 7. Guardar hash inmediatamente (no esperar fin de cola)
 */
async function subirArchivo(item: ItemUploadCola): Promise<boolean> {
    const rutaClave = claveRutaEnCola(item.rutaArchivo);

    try {
        /* Guard: descartar items cuya ruta está fuera de la carpeta de sync.
         * Usa función centralizada estaEnCarpetaSync (normaliza separadores + casing). */
        if (!estaEnCarpetaSync(item.rutaArchivo)) {
            console.warn('[UploadQueue] Item fuera de carpeta sync, descartando:', item.rutaArchivo);
            return true; /* true = no reintentar, simplemente descartar */
        }

        /*
         * Guard de ruta en vuelo: previene que dos uploads del mismo archivo
         * estén en progreso simultáneamente. Complementa hashesEnVuelo para
         * cubrir el caso donde hash es null (error de FS, OneDrive lock).
         */
        if (rutasEnVuelo.has(rutaClave)) {
            console.info('[UploadQueue] Ruta en vuelo (upload paralelo), omitiendo:', item.nombreArchivo);
            return true;
        }
        rutasEnVuelo.add(rutaClave);

        /*
         * Verificación de última línea contra tracking v2: entre el momento de encolar
         * y el momento de subir puede haber pasado tiempo (backoff, semáforo, etc.).
         * Otro upload del mismo archivo podría haber terminado en ese intervalo.
         *
         * SOLO lookup por ruta (no por nombre): buscarArchivoPorNombre es demasiado
         * amplio y causa falsos positivos cuando archivos con el mismo nombre existen
         * en colecciones diferentes (ej: kick.wav en "808" y en "Drums").
         */
        if (estado.trackingModule) {
            const enTracking = estado.trackingModule.buscarArchivoPorRuta(item.rutaArchivo);
            if (enTracking && !enTracking.syncDeshabilitado) {
                console.info('[UploadQueue] Duplicado detectado en tracking pre-upload, omitiendo:', item.nombreArchivo);
                item.sampleIdServidor = enTracking.sampleId;
                /* Marcar como completado sin subir */
                return true;
            }
        }

        /* Re-verificar hash por si otro upload paralelo lo añadió.
         * Incluye evicción de hashes stale: si el sample fue borrado del servidor
         * y localmente, hashesConocidos aún retiene el hash fantasma. Verificar
         * que exista un archivo activo real antes de declarar duplicado. */
        if (item.hashParcial && hashesConocidos.has(item.hashParcial)) {
            if (estado.trackingModule) {
                const hayActivo = existeArchivoActivoConHash(item.hashParcial);
                if (!hayActivo) {
                    console.info('[UploadQueue] Hash stale en pre-upload (sin archivo activo), evictando:', item.nombreArchivo);
                    hashesConocidos.delete(item.hashParcial);
                    guardarHashes().catch(() => {});
                    /* Continuar con upload normal */
                } else {
                    console.info('[UploadQueue] Duplicado por hash detectado pre-upload:', item.nombreArchivo);
                    return true;
                }
            } else {
                console.info('[UploadQueue] Duplicado por hash detectado pre-upload (sin tracking):', item.nombreArchivo);
                return true;
            }
        }

        /*
         * Guard de hash en vuelo: si otro upload paralelo del mismo contenido
         * está en progreso, esperar a que termine en vez de subir dos veces.
         * Esto cubre la ventana entre que subirArchivo() empieza y hashesConocidos
         * se actualiza tras el POST exitoso.
         */
        if (item.hashParcial) {
            if (hashesEnVuelo.has(item.hashParcial)) {
                console.info('[UploadQueue] Hash en vuelo (upload paralelo), omitiendo:', item.nombreArchivo);
                return true;
            }
            hashesEnVuelo.add(item.hashParcial);
        }

        const { readFile, exists } = await import('@tauri-apps/plugin-fs');
        const baseUrl = obtenerBaseUrlSync();

        /*
         * P3: Verificar existencia antes de leer.
         * En entornos OneDrive el archivo puede haberse movido a papelera
         * o estar en proceso de sincronización cloud → "failed to open file".
         * Detectarlo aquí evita reintentos inútiles contra un archivo que ya no existe.
         */
        const archivoExiste = await exists(item.rutaArchivo);
        if (!archivoExiste) {
            const esOneDrive = item.rutaArchivo.includes('OneDrive');
            item.ultimoError = esOneDrive
                ? 'Archivo no encontrado (posible conflicto OneDrive/papelera)'
                : 'Archivo no encontrado en disco';
            /*
             * C384b: Retornar true (descartado) para que procesarItemUpload marque el item
             * como 'completado' y lo saque de rutasEnCola permanentemente.
             * Retornar false causaba que el item quedara como 'error' en el Store, y al
             * hacer 'Sincronizar ahora' el listener reintentar-errores-upload lo reseteaba
             * a 'pendiente' creando un ciclo infinito de reintentos fallidos.
             */
            actualizarEstadoSampleHistorial({
                sampleId: 0,
                nombreArchivo: item.nombreArchivo,
                estado: 'error',
                rutaLocal: item.rutaArchivo,
                error: item.ultimoError,
            }).catch(() => {});
            registrarAccionHistorial({
                tipo: 'error_subida',
                descripcion: `Archivo no encontrado, descartado: "${item.nombreArchivo}"`,
            }).catch(() => {});
            console.warn('[UploadQueue] Archivo no existe, descartando permanentemente:', item.rutaArchivo);
            return true; /* true = completado/descartado, no reintentar */
        }

        /*
         * Esperar a que el archivo esté disponible para lectura.
         * En Windows, el watcher emite CREATE antes de que la copia finalice.
         * Sin esta espera, readFile falla con "os error 32" (file locked).
         * El backoff corto (~9s max) evita consumir un reintento de cola por
         * una condicion temporal que se resuelve en milisegundos.
         */
        const disponible = await esperarArchivoDisponible(item.rutaArchivo);
        if (!disponible) {
            item.ultimoError = 'Archivo bloqueado por otro proceso (copia en curso o OneDrive sync)';
            logSync.warn('uploadQueue', `Archivo no disponible tras espera, reintentando via cola: ${item.nombreArchivo}`);
            return false; /* false = reintentar via backoff normal de la cola */
        }

        /* Leer el archivo de audio del disco */
        const contenidoArchivo = await readFile(item.rutaArchivo);

        /* Generar metadata desde la ruta */
        const metaRuta = extraerMetadataDeRuta(item.rutaArchivo);

        /* Generar título: nombre del archivo sin extensión, humanizado */
        const titulo = humanizarNombreArchivo(metaRuta.nombreArchivo);

        /* Generar tags desde carpetas padre y nombre */
        const tags = generarTagsDesdeContexto(metaRuta.carpetas, metaRuta.nombreArchivo);

        /* Detectar MIME type por extensión */
        const mimeType = obtenerMimeType(metaRuta.extension);

        /* Construir FormData */
        /* QL107: TS 5.9 no acepta Uint8Array<ArrayBufferLike> como BlobPart — crear vista con buffer concreto */
        const blob = new Blob([new Uint8Array(contenidoArchivo)], { type: mimeType });
        const formData = new FormData();
        formData.append('audio', blob, item.nombreArchivo);
        formData.append('titulo', titulo);
        formData.append('contenido', '');
        formData.append('origen_subida', metaRuta.carpetas.join(' / '));
        formData.append('tags', JSON.stringify(tags));
        formData.append('permitir_descarga', 'true');
        formData.append('licencia_libre', 'false');
        formData.append('es_premium', 'false');
        formData.append('mostrar_en_comunidad', 'false');
        /* [193A-4] Marcar como sync para que el servidor use la cola IA con gap (216s)
         * en vez de procesar con PipelineAudio inmediatamente. Evita consumir créditos
         * de Groq a toda velocidad cuando se sincronizan librerías enteras. */
        formData.append('sync_upload', 'true');

        /* POST al servidor — P5: incluir clave de idempotencia para evitar duplicados por timeout */
        const respuesta = await fetch(`${baseUrl}/kamples/v1/samples/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Idempotency-Key': item.idempotencyKey,
            },
            /* Content-Type se genera automáticamente con el boundary correcto */
        });

        if (!respuesta.ok) {
            const errorBody = await respuesta.json().catch(() => ({}));
            const errorMsg = (errorBody as { error?: string }).error ?? `HTTP ${respuesta.status}`;
            item.ultimoError = errorMsg;

            /* Clasificar error para estrategia de retry inteligente */
            const categoria = clasificarError(respuesta.status);
            const estrategia = obtenerEstrategia(categoria);

            if (categoria === 'permanente') {
                /* Errores permanentes (400, 404, 422): no reintentar */
                logSync.warn('uploadQueue', `Error permanente (${respuesta.status}), descartando: ${item.nombreArchivo}`, { error: errorMsg });
                item.intentos = MAX_REINTENTOS;
                return false;
            }

            if (categoria === 'autenticacion') {
                logSync.warn('uploadQueue', `Error de autenticación (${respuesta.status}): ${item.nombreArchivo}`);
            }

            /* Registrar fallo en circuit breaker para errores de servidor */
            if (categoria === 'transitorio' || categoria === 'rate_limit') {
                circuitoUpload.registrarFallo();
            }

            logSync.info('uploadQueue', `Error ${respuesta.status} (${categoria}): ${item.nombreArchivo}`, { intentos: item.intentos });
            return false;
        }

        /* Upload exitoso — registrar en circuit breaker */
        circuitoUpload.registrarExito();

        const resultado = await respuesta.json() as {
            ok: boolean;
            sample_id?: number;
            id_corto?: string;
        };

        if (!resultado.ok || !resultado.sample_id) {
            item.ultimoError = 'Respuesta inesperada del servidor';
            return false;
        }

        item.sampleIdServidor = resultado.sample_id;

        /*
         * Resolver colección real a partir del nombre de carpeta local.
         * Permite pasar coleccionId a registrarSubidaLocal para tracking correcto
         * y agregar el sample a la tabla coleccion_samples en el servidor.
         *
         * B2: Si el sample está en subcarpeta (carpetas[1]), resolver subcollección
         * y asignar a AMBAS: la colección padre Y la subcolección.
         * Así el sample aparece en la colección principal al expandirla
         * y también se puede filtrar por subcolección.
         */
        let coleccionIdResuelta: number | null = null;
        let subcoleccionIdResuelta: number | null = null;
        if (item.carpetas.length > 0) {
            const nombreCarpeta = item.carpetas[0] || '';
            if (nombreCarpeta && estado.trackingModule) {
                const coleccion = estado.trackingModule.buscarColeccionPorCarpeta(nombreCarpeta);
                if (coleccion) {
                    coleccionIdResuelta = coleccion.id;

                    /* B2: Resolver subcolección si hay segundo nivel de carpeta */
                    if (item.carpetas.length >= 2 && item.carpetas[1]) {
                        const sub = estado.trackingModule.buscarSubcoleccion(nombreCarpeta, item.carpetas[1]);
                        if (sub) {
                            subcoleccionIdResuelta = sub.id;
                        }
                    }
                }
            }
        }

        /* Registrar en tracking + historial para feedback persistente en panel.
         * B2: Usar la colección más específica (subcolección > padre) para tracking. */
        await registrarSubidaLocal(
            resultado.sample_id,
            item.rutaArchivo,
            item.nombreArchivo,
            subcoleccionIdResuelta ?? coleccionIdResuelta,
        );

        /* Rehidratación centralizada: usar snapshot /me/sync/colecciones como fuente
         * única para imagenes. Evita depender de slug/endpoint individual y mantiene
         * consistencia entre ventana main y ventana sync-panel. */
        rehidratarImagenesPendientesForzadoSync().catch(() => {
            /* No bloquear flujo de upload por fallo de rehidratación */
        });

        /*
         * Asignar sample a la colección correspondiente en el servidor.
         *
         * Con UNIQUE(usuario_id, sample_id), un sample solo puede estar en UNA
         * colección por usuario. Se asigna a la más específica: subcolección si
         * existe, padre si no. agregarSampleAColeccion usa ON CONFLICT DO UPDATE
         * que MUEVE el sample si ya estaba en otra colección.
         *
         * PUT /me/coleccionados/{id}/carpeta actualiza metadata (no coleccion_samples).
         *
         * C384: Si hay carpeta pero NO colección en tracking, crearla ahora.
         * crearColeccionDesdeLocal es idempotente.
         */
        if (item.carpetas.length > 0) {
            if (!coleccionIdResuelta && item.carpetas[0]) {
                try {
                    const { crearColeccionDesdeLocal } = await import('./syncCollectionService');
                    const idCreada = await crearColeccionDesdeLocal(item.carpetas[0]);
                    if (idCreada) {
                        coleccionIdResuelta = idCreada;
                        console.info('[UploadQueue] Colección creada/resuelta para carpeta:', item.carpetas[0], '→ id:', idCreada);
                    }
                } catch (err) {
                    console.error('[UploadQueue] Error creando colección para carpeta:', item.carpetas[0], err);
                }
            }

            /* Resolver/crear subcolección si hay segundo nivel */
            if (!subcoleccionIdResuelta && item.carpetas[1] && coleccionIdResuelta) {
                try {
                    const { crearColeccionDesdeLocal } = await import('./syncCollectionService');
                    const idSub = await crearColeccionDesdeLocal(item.carpetas[1], coleccionIdResuelta);
                    if (idSub) {
                        subcoleccionIdResuelta = idSub;
                        console.info('[UploadQueue] Subcolección creada/resuelta:', item.carpetas[1], '→ id:', idSub);
                    }
                } catch (err) {
                    console.error('[UploadQueue] Error creando subcolección:', item.carpetas[1], err);
                }
            }

            /*
             * Asignar a la colección más específica (sub > padre).
             * UNIQUE(usuario_id, sample_id) impide estar en ambas; asignar a
             * ambas causaba un MOVE implícito server-side y changelogs espurios
             * que disparaban D4.2 local moves incorrectos.
             */
            const coleccionFinal = subcoleccionIdResuelta ?? coleccionIdResuelta;
            if (coleccionFinal) {
                try {
                    const { agregarSampleAColeccion } = await import('./syncCollectionService');
                    await agregarSampleAColeccion(coleccionFinal, resultado.sample_id);
                } catch (err) {
                    console.error('[UploadQueue] Error agregando sample a colección:', err);
                }
            }

            const primaria = item.carpetas[0] || 'General';
            const secundaria = item.carpetas[1] || '';
            await moverSampleEnServidorPublico(resultado.sample_id, primaria, secundaria);
        } else {
            /*
             * Archivo estaba en la raíz de sync (sin subcarpeta).
             * Después de subirlo, moverlo a "Sin colección" para organización.
             */
            const nuevaRuta = await moverArchivoASinColeccion(
                item.rutaArchivo,
                item.nombreArchivo,
                resultado.sample_id,
            );
            if (nuevaRuta) {
                item.rutaArchivo = nuevaRuta;
            }
        }

        console.info(
            '[UploadQueue] Subido exitosamente:',
            item.nombreArchivo,
            '→ sample_id:',
            resultado.sample_id,
        );
        return true;
    } catch (err) {
        item.ultimoError = err instanceof Error ? err.message : String(err);

        if (err instanceof CircuitoBiertoError) {
            logSync.info('uploadQueue', `Circuit breaker abierto, posponiendo: ${item.nombreArchivo}`);
            return false;
        }

        if (esErrorDeRed(err)) {
            circuitoUpload.registrarFallo();
            logSync.warn('uploadQueue', `Error de red subiendo: ${item.nombreArchivo}`);
        } else {
            logSync.error('uploadQueue', `Error subiendo: ${item.nombreArchivo}`, {
                error: item.ultimoError,
            });
        }
        return false;
    } finally {
        /* Liberar guards en vuelo siempre, éxito o fallo */
        if (item.hashParcial) {
            hashesEnVuelo.delete(item.hashParcial);
        }
        rutasEnVuelo.delete(rutaClave);
    }
}

/*
 * B6: Mueve un archivo duplicado a la carpeta duplicados/ manteniendo
 * la estructura de carpetas relativa desde la raíz de sync.
 *
 * Ejemplo: sync/Hip Hop/kick.wav → sync/duplicados/Hip Hop/kick.wav
 *
 * Si el archivo destino ya existe, agrega timestamp al nombre para
 * evitar colisiones (kick_1749839234.wav).
 */
/*
 * @deprecated QL66-EXTRA: Ya no se usa. Los duplicados se suben al servidor
 * para que el admin los revise. Se conserva temporalmente por si se necesita
 * revertir el cambio.
 */
async function moverADuplicados(_rutaArchivo: string, _carpetas: string[]): Promise<boolean> {
    return false;
}

/*
 * Calcula un hash parcial del archivo para detección rápida de duplicados.
 * Lee solo: primeros 8KB + últimos 8KB + tamaño total.
 * Esto evita leer archivos completos de 50MB solo para verificar duplicados.
 */
async function calcularHashParcial(rutaArchivo: string): Promise<string | null> {
    try {
        const { stat, readFile } = await import('@tauri-apps/plugin-fs');

        const info = await stat(rutaArchivo);
        const tamano = info.size;

        if (!tamano || tamano === 0) return null;

        const CHUNK_SIZE = 8192;

        /* Leer primeros 8KB */
        const inicio = await readFile(rutaArchivo, {
            offset: 0,
            length: Math.min(CHUNK_SIZE, tamano),
        } as Parameters<typeof readFile>[1]);

        /* Leer últimos 8KB */
        let fin: Uint8Array;
        if (tamano > CHUNK_SIZE) {
            fin = await readFile(rutaArchivo, {
                offset: tamano - CHUNK_SIZE,
                length: CHUNK_SIZE,
            } as Parameters<typeof readFile>[1]);
        } else {
            fin = new Uint8Array(0);
        }

        /* Concatenar: inicio + fin + tamaño como string */
        const tamanoBytes = new TextEncoder().encode(tamano.toString());
        const combinado = new Uint8Array(inicio.length + fin.length + tamanoBytes.length);
        combinado.set(inicio, 0);
        combinado.set(fin, inicio.length);
        combinado.set(tamanoBytes, inicio.length + fin.length);

        /* Hash con Web Crypto API (disponible en Tauri webview) */
        const hashBuffer = await crypto.subtle.digest('SHA-256', combinado);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
        console.warn('[UploadQueue] No se pudo calcular hash parcial:', err);
        return null;
    }
}

/*
 * Convierte nombre de archivo a título legible.
 * "deep_sub_bass_hit" → "Deep Sub Bass Hit"
 * "808-kick-hard" → "808 Kick Hard"
 */
function humanizarNombreArchivo(nombre: string): string {
    return nombre
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(palabra => {
            if (palabra.length === 0) return '';
            /* Mantener números y siglas en mayúsculas como están */
            if (/^\d+$/.test(palabra) || /^[A-Z]{2,}$/.test(palabra)) return palabra;
            return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
        })
        .join(' ');
}

/*
 * Genera tags desde el contexto de la ruta.
 * Combina carpetas padre + palabras del nombre del archivo.
 * Garantiza mínimo 2 tags (requisito del endpoint de upload).
 *
 * Ejemplo: carpetas=['Samples', '808', 'Bass'], nombre='deep_sub_hit'
 * → ['808', 'bass', 'deep', 'sub', 'hit']
 */
function generarTagsDesdeContexto(carpetas: string[], nombreArchivo: string): string[] {
    const tagsSet = new Set<string>();

    /* Tags de carpetas (ignorar carpetas genéricas) */
    const carpetasGenericas = new Set([
        'samples', 'audio', 'music', 'sounds', 'downloads',
        'descargas', 'general', 'sync', 'kamples',
        /* Carpetas del sistema operativo y rutas comunes */
        'users', 'user', 'owner', 'documents', 'documentos',
        'desktop', 'escritorio', 'onedrive', 'dropbox',
        'google drive', 'icloud', 'home', 'library',
        'appdata', 'local', 'roaming', 'program files',
        'applications', 'volumes', 'media', 'mnt', 'tmp',
    ]);

    for (const carpeta of carpetas) {
        const normalizada = carpeta.toLowerCase().trim();
        /* Filtrar: menores a 2 chars, genéricas, y letras de unidad (C:, D:) */
        const esDriveLabel = /^[a-z]:?$/.test(normalizada);
        if (normalizada.length >= 2 && !carpetasGenericas.has(normalizada) && !esDriveLabel) {
            tagsSet.add(normalizada);
        }
    }

    /*
     * Tags del nombre del archivo.
     * B4 fix: No agregar palabras sueltas que sean fragmentos de tags ya existentes
     * (ej: si "hip hop" ya es tag de carpeta, no agregar "hip" ni "hop" por separado).
     */
    const palabras = nombreArchivo
        .replace(/[_\-\.]+/g, ' ')
        .split(/\s+/)
        .map(p => p.toLowerCase().trim())
        .filter(p => p.length >= 2 && !/^\d+$/.test(p));

    const tagsCarpetaExistentes = Array.from(tagsSet);
    for (const palabra of palabras) {
        if (tagsSet.size >= 8) break;
        const esFragmento = tagsCarpetaExistentes.some(
            tag => tag.includes(' ') && tag.includes(palabra) && tag !== palabra
        );
        if (!esFragmento) {
            tagsSet.add(palabra);
        }
    }

    /* Garantizar mínimo 2 tags */
    const resultado = Array.from(tagsSet);
    if (resultado.length < 2) {
        if (resultado.length === 0) {
            resultado.push('sample', 'audio');
        } else {
            resultado.push('sample');
        }
    }

    return resultado;
}

/*
 * Determina el MIME type por extensión de archivo.
 */
function obtenerMimeType(extension: string): string {
    const mapa: Record<string, string> = {
        wav: 'audio/wav',
        mp3: 'audio/mpeg',
        flac: 'audio/flac',
        aiff: 'audio/aiff',
        aif: 'audio/aiff',
        ogg: 'audio/ogg',
    };
    return mapa[extension.toLowerCase()] ?? 'audio/wav';
}

/*
 * Emite progreso al callback registrado.
 */
function emitirProgreso(item: ItemUploadCola): void {
    if (!callbackProgreso) return;

    const pendientes = cola.filter(i => i.estado === 'pendiente' || i.estado === 'subiendo');
    const posicion = pendientes.indexOf(item);

    callbackProgreso({
        item,
        totalEnCola: pendientes.length,
        posicionEnCola: posicion >= 0 ? posicion + 1 : 0,
    });
}

/*
 * Persiste la cola filtrando items completados viejos.
 * Se usa para guardar con urgencia (reintento, eliminación manual).
 * Para persistencia frecuente en bucle, usar guardarColaDebounced().
 */
async function guardarCola(): Promise<void> {
    if (!esDesktop()) return;
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        const paraGuardar = cola.filter(i =>
            i.estado !== 'completado' ||
            (Date.now() - i.timestampActualizado < 3600_000),
        );
        await store.set(STORE_KEY_COLA, paraGuardar);
        await store.save();
    } catch {
        /* Fallo silencioso — la cola en memoria sigue viva */
    }
}

/*
 * Versión debounced de guardarCola para uso en bucles de alta frecuencia.
 * Agrupa múltiples escrituras en una sola operación de disco.
 */
function guardarColaDebounced(): void {
    if (!esDesktop()) return;
    const paraGuardar = cola.filter(i =>
        i.estado !== 'completado' ||
        (Date.now() - i.timestampActualizado < 3600_000),
    );
    persistirConDebounce('upload_cola', STORE_FILE, STORE_KEY_COLA, paraGuardar, 2000);
}

/*
 * Persiste los hashes procesados.
 */
async function guardarHashes(): Promise<void> {
    if (!esDesktop()) return;
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        /* Limitar a últimos 5000 hashes para no crecer indefinidamente */
        const hashesArray = Array.from(hashesConocidos).slice(-5000);
        await store.set(STORE_KEY_HASHES, hashesArray);
        /* C6: Persistir mapa hash→rutas (1:N) para dedup cross-carpeta entre reinicios */
        const mapaObj: Record<string, string[]> = {};
        for (const [h, rutas] of hashARutas) mapaObj[h] = Array.from(rutas);
        await store.set('hash_a_ruta', mapaObj);
        /* QL69: Persistir contador antispam */
        const antispamObj: Record<string, number> = {};
        for (const [h, c] of contadorHashDetectado) antispamObj[h] = c;
        await store.set('antispam_hash_contador', antispamObj);
        await store.save();
    } catch {
        /* Fallo silencioso */
    }
}

/*
 * Retorna true si hay items pendientes de subir.
 */
function tienePendientes(): boolean {
    return cola.some(i => i.estado === 'pendiente');
}

/*
 * Retorna el estado actual de la cola (para UI).
 */
export function obtenerEstadoCola(): {
    items: ItemUploadCola[];
    totalPendientes: number;
    totalErrores: number;
    procesando: boolean;
} {
    return {
        items: [...cola],
        totalPendientes: cola.filter(i => i.estado === 'pendiente' || i.estado === 'subiendo').length,
        totalErrores: cola.filter(i => i.estado === 'error').length,
        procesando,
    };
}

export function obtenerResumenDebugUploadQueue(): ResumenDebugUploadQueue {
    const muestrasActivas = cola
        .filter(item => item.estado !== 'completado')
        .slice(0, 15)
        .map(item => ({
            id: item.id,
            nombreArchivo: item.nombreArchivo,
            estado: item.estado,
            intentos: item.intentos,
            rutaArchivo: item.rutaArchivo,
            sampleIdServidor: item.sampleIdServidor,
            ultimoError: item.ultimoError,
            timestampActualizado: item.timestampActualizado,
        }));

    return {
        totalItems: cola.length,
        totalPendientes: cola.filter(i => i.estado === 'pendiente').length,
        totalSubiendo: cola.filter(i => i.estado === 'subiendo').length,
        totalErrores: cola.filter(i => i.estado === 'error').length,
        totalCompletados: cola.filter(i => i.estado === 'completado').length,
        totalDuplicados: cola.filter(i => i.estado === 'duplicado').length,
        procesando,
        rutasEnCola: rutasEnCola.size,
        rutasEnVuelo: rutasEnVuelo.size,
        hashesConocidos: hashesConocidos.size,
        hashesEnVuelo: hashesEnVuelo.size,
        hashesPendientesEncola: hashesPendientesEncola.size,
        hashesMapeados: hashARutas.size,
        hashesBloqueadosAntispam: Array.from(contadorHashDetectado.values()).filter(c => c >= MAX_DETECCIONES_HASH).length,
        muestrasActivas,
    };
}

/*
 * Reintenta subir un item que falló.
 */
export async function reintentarItem(itemId: string): Promise<void> {
    const item = cola.find(i => i.id === itemId);
    if (item && item.estado === 'error') {
        item.estado = 'pendiente';
        item.intentos = 0;
        item.ultimoError = undefined;
        item.timestampActualizado = Date.now();
        rutasEnCola.add(claveRutaEnCola(item.rutaArchivo));
        await guardarCola(); /* Guardar inmediato: acción explícita del usuario */

        if (estaOnline()) {
            procesarCola();
        }
    }
}

/*
 * Reintenta todos los items que estén en estado "error".
 * Útil para cuando el usuario presiona "Sincronizar ahora".
 *
 * Arquitectura multi-ventana Tauri: el sync panel (sync.html) y la ventana
 * principal (index.html) son procesos JS separados con instancias de módulo
 * distintas. El sync panel tiene su cola vacía; la real vive en la ventana
 * principal. Por eso también emitimos el evento Tauri `reintentar-errores-upload`
 * para que el listener en inicializarUploadQueue() lo procese en la ventana correcta.
 */
export async function reintentarTodosConError(): Promise<void> {
    let algunActualizado = false;
    for (const item of cola) {
        if (item.estado === 'error') {
            item.estado = 'pendiente';
            item.intentos = 0;
            item.ultimoError = undefined;
            item.timestampActualizado = Date.now();
            rutasEnCola.add(claveRutaEnCola(item.rutaArchivo));
            algunActualizado = true;
        }
    }

    if (algunActualizado) {
        await guardarCola();
        if (estaOnline()) {
            procesarCola();
        }
    }

    /* Notificar a TODAS las ventanas Tauri (especialmente la principal
     * que tiene la cola real) para que también procesen el reintento. */
    try {
        const { emit } = await import('@tauri-apps/api/event');
        await emit('reintentar-errores-upload', {});
    } catch {
        /* Entorno sin Tauri — ignorar */
    }
}

/*
 * Elimina un item de la cola (cancelar upload).
 */
export async function eliminarItemCola(itemId: string): Promise<void> {
    const item = cola.find(i => i.id === itemId);
    if (item) {
        rutasEnCola.delete(claveRutaEnCola(item.rutaArchivo));
    }
    cola = cola.filter(i => i.id !== itemId);
    await guardarCola(); /* Guardar inmediato: acción explícita del usuario */
}

/*
 * Limpia items completados de la cola.
 */
export async function limpiarCompletados(): Promise<void> {
    /* Limpiar Set de rutas de items completados */
    for (const item of cola) {
        if (item.estado === 'completado') {
            rutasEnCola.delete(claveRutaEnCola(item.rutaArchivo));
        }
    }
    cola = cola.filter(i => i.estado !== 'completado');
    await guardarCola();
}

/*
 * Limpia todos los hashes conocidos. Necesario para force-resync:
 * sin esto, archivos previamente subidos se rechazan como duplicados
 * incluso después de resetear el tracking (ej: borrado del servidor + re-subida).
 */
export async function limpiarHashesConocidos(): Promise<void> {
    hashesConocidos.clear();
    hashARutas.clear();
    await guardarHashes();
}

/*
 * QL78: Limpieza retroactiva de archivos ya subidos exitosamente.
 * Cuando borrarAlSubirExitoso está activo, itera hashARutas (hash→rutas)
 * y elimina archivos que aún existan en disco. Cubre:
 * - Archivos subidos ANTES de que el usuario activara la opción.
 * - Archivos cuyo borrado falló en el primer intento (lock, permisos).
 * Se invoca al activar la opción y al iniciar la app si ya está activa.
 */
export async function limpiarArchivosSubidosEnDisco(): Promise<void> {
    if (!estado.configAvanzada.borrarAlSubirExitoso) return;

    try {
        const { exists, remove } = await import('@tauri-apps/plugin-fs');
        let eliminados = 0;
        let fallidos = 0;

        for (const [, rutas] of hashARutas) {
            for (const ruta of rutas) {
                try {
                    if (!tieneSubidaPersistidaConfirmada({ rutaArchivo: ruta })) continue;
                    const existe = await exists(ruta);
                    if (!existe) continue;

                    await remove(ruta);
                    eliminados++;
                    logSync.info('uploadQueue', `QL78: Archivo eliminado retroactivamente: ${ruta.split('/').pop()}`);
                } catch (err) {
                    fallidos++;
                    logSync.warn('uploadQueue', `QL78: No se pudo eliminar archivo: ${ruta.split('/').pop()}`, {
                        error: err instanceof Error ? err.message : String(err),
                    });
                }
            }
        }

        /* También limpiar archivos de items completados en cola */
        for (const item of cola) {
            if (item.estado !== 'completado') continue;
            try {
                if (!tieneSubidaPersistidaConfirmada(item)) continue;
                const existe = await exists(item.rutaArchivo);
                if (!existe) continue;
                await remove(item.rutaArchivo);
                eliminados++;
                logSync.info('uploadQueue', `QL78: Archivo de cola completada eliminado: ${item.nombreArchivo}`);
            } catch {
                fallidos++;
            }
        }

        if (eliminados > 0 || fallidos > 0) {
            logSync.info('uploadQueue', `QL78: Limpieza retroactiva finalizada`, { eliminados, fallidos });
        }
    } catch (err) {
        logSync.error('uploadQueue', 'QL78: Error en limpieza retroactiva', {
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

function tieneSubidaPersistidaConfirmada(
    item: Pick<ItemUploadCola, 'rutaArchivo' | 'sampleIdServidor'>,
): boolean {
    const rutaNorm = normalizarRutaCola(item.rutaArchivo);
    const enTracking = estado.trackingModule?.buscarArchivoPorRuta(rutaNorm);
    if (enTracking && !enTracking.syncDeshabilitado) return true;
    return typeof item.sampleIdServidor === 'number' && item.sampleIdServidor > 0;
}

