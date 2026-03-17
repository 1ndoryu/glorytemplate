/*
 * Servicio: syncGuards — Estado compartido para coordinación entre servicios de sync.
 *
 * Centraliza:
 * - Set de rutas de descarga activas (evita que fileWatcher re-encole archivos recién descargados)
 * - Lock de sync concurrente (evita dos syncs simultáneos)
 * - URL base de la API para servicios de sync
 *
 * Separado en su propio módulo para evitar dependencias circulares:
 * syncService y syncCollectionService ambos necesitan estas utilidades.
 */

/* Descarga masiva en curso — suprime eventos de carpeta del watcher durante sync */

let descargaMasivaActiva = false;

/**
 * Activa/desactiva el modo de descarga masiva.
 * Mientras está activo, fileWatcherService ignora eventos de carpeta/subcarpeta
 * para evitar que mkdir + writeFile durante sync dispare cientos de callbacks
 * redundantes de crearColeccionDesdeLocal.
 */
export function marcarDescargaMasiva(activa: boolean): void {
    descargaMasivaActiva = activa;
}

export function esDescargaMasivaEnCurso(): boolean {
    return descargaMasivaActiva;
}

/* Descargas en curso */

const descargasEnCurso = new Set<string>();
const descargasTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const GRACIA_DESCARGA_MS = 30_000;

/**
 * Marca una ruta como descarga en curso para que el watcher la ignore.
 * La ruta se limpia automáticamente después de GRACIA_DESCARGA_MS.
 * Si se llama repetidamente para la misma ruta, cancela el timeout anterior
 * para evitar acumulación de timers (1000 descargas = 1000 timers sin este fix).
 */
export function marcarDescargaEnCurso(ruta: string): void {
    const normalizada = ruta.replace(/\\/g, '/');
    descargasEnCurso.add(normalizada);

    /* Cancelar timeout anterior para esta ruta si existe */
    const timerAnterior = descargasTimeouts.get(normalizada);
    if (timerAnterior) {
        clearTimeout(timerAnterior);
    }

    const nuevoTimer = setTimeout(() => {
        descargasEnCurso.delete(normalizada);
        descargasTimeouts.delete(normalizada);
    }, GRACIA_DESCARGA_MS);

    descargasTimeouts.set(normalizada, nuevoTimer);
}

/**
 * Verifica si una ruta está marcada como descarga en curso.
 * Usado por el callback onArchivoNuevo del watcher.
 */
export function esDescargaEnCurso(ruta: string): boolean {
    return descargasEnCurso.has(ruta.replace(/\\/g, '/'));
}

/* Movimientos internos — protege rutas origen de DELETE falsos */

/*
 * Cuando hacemos rename() interno (ej: moverArchivoASinColeccion), la ruta
 * ORIGINAL genera un evento DELETE en el watcher. Si manejarBorradoLocal la
 * procesa y borrarEnServidorAlBorrarLocal está activo, puede hacer soft-delete
 * del sample recién subido (si la actualización de tracking falló).
 *
 * Este Set marca rutas origen de moves internos para que manejarBorradoLocal
 * las ignore. TTL automático de GRACIA_MOVIMIENTO_MS.
 */
const movimientosInternos = new Set<string>();
const movimientosTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const GRACIA_MOVIMIENTO_MS = 15_000;

/**
 * Marca una ruta como origen de un movimiento interno.
 * manejarBorradoLocal la ignorará durante GRACIA_MOVIMIENTO_MS.
 */
export function marcarMovimientoInterno(ruta: string): void {
    const normalizada = ruta.replace(/\\/g, '/');
    movimientosInternos.add(normalizada);

    const timerAnterior = movimientosTimeouts.get(normalizada);
    if (timerAnterior) clearTimeout(timerAnterior);

    const nuevoTimer = setTimeout(() => {
        movimientosInternos.delete(normalizada);
        movimientosTimeouts.delete(normalizada);
    }, GRACIA_MOVIMIENTO_MS);

    movimientosTimeouts.set(normalizada, nuevoTimer);
}

/**
 * Verifica si una ruta está marcada como origen de movimiento interno.
 */
export function esMovimientoInterno(ruta: string): boolean {
    return movimientosInternos.has(ruta.replace(/\\/g, '/'));
}

/* Lock de sync concurrente */

/*
 * Previene que dos sincronizaciones masivas corran simultáneamente.
 * Si un caller intenta adquirir el lock mientras otro lo tiene,
 * recibe la misma Promise (evita trabajo duplicado).
 *
 * Patrón: el primer caller ejecuta la sync y todos los demás
 * await-ean la misma Promise. Al finalizar, el lock se libera.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let syncPromesaActiva: Promise<any> | null = null;

/**
 * Verifica si hay una sync en curso.
 */
export function esSyncEnCurso(): boolean {
    return syncPromesaActiva !== null;
}

/**
 * Adquiere el lock de sync concurrente.
 * Si ya hay una sync en curso, retorna { adquirido: false, promesaExistente }.
 * Si no, marca el lock y retorna { adquirido: true }.
 * El caller que adquiere el lock DEBE llamar liberarLockSync() al finalizar.
 */
export function adquirirLockSync(): { adquirido: true } | { adquirido: false; promesaExistente: Promise<unknown> } {
    if (syncPromesaActiva) {
        return { adquirido: false, promesaExistente: syncPromesaActiva };
    }
    return { adquirido: true };
}

/**
 * Registra la Promise de sync activa para que otros callers puedan await-earla.
 */
export function registrarSyncActiva(promesa: Promise<unknown>): void {
    syncPromesaActiva = promesa;
}

/**
 * Libera el lock de sync concurrente.
 */
export function liberarLockSync(): void {
    syncPromesaActiva = null;
}

/* URL base API */

/**
 * URL base de la API para servicios de sync.
 * Centralizada aquí para evitar duplicación en 3 archivos.
 */
export function obtenerBaseUrlSync(): string {
    const ctx = window.GLORY_CONTEXT as { apiUrl?: string } | undefined;
    return ctx?.apiUrl ?? '/wp-json';
}

/* Headers de autenticación para sync API */

/*
 * Token JWT en memoria para sync API calls.
 * Se establece durante la inicialización (desde authDesktopService)
 * para evitar dependencia circular: syncGuards ← syncService ← authDesktop.
 * Es la misma fuente que usa el interceptor global de fetch, pero explícita.
 */
let tokenSync: string | null = null;

/**
 * Establece el token JWT para peticiones autenticadas del sync service.
 * Llamado desde inicializarSyncService() o authDesktopService
 * después de restaurar/renovar el token.
 */
export function establecerTokenSync(token: string | null): void {
    tokenSync = token;
}

/**
 * Indica si hay un token JWT disponible para hacer requests autenticados.
 * Útil para que los módulos de sync eviten requests que resultarán en 401.
 */
export function tieneTokenSync(): boolean {
    return tokenSync !== null && tokenSync.length > 0;
}

/**
 * Construye headers autenticados para peticiones del sync service.
 *
 * Envía el JWT por DOBLE vía:
 *   - Authorization: Bearer {token} (estándar RFC 6750)
 *   - X-Kamples-Auth: Bearer {token} (fallback — nginx y Local by Flywheel
 *     a veces no pasan el header Authorization a PHP-FPM, pero SÍ pasan
 *     headers custom sin filtrar)
 *
 * Esto es independiente del interceptor global de fetch (apiDesktopAdapter).
 * Si el interceptor funciona, el header Authorization se envía dos veces (sin efecto).
 * Si el interceptor no está activo (edge case en inicialización), el header
 * explícito aquí garantiza que la auth siempre llega.
 */
export function obtenerHeadersSync(incluirContentType = true): Record<string, string> {
    const headers: Record<string, string> = {};
    if (incluirContentType) {
        headers['Content-Type'] = 'application/json';
    }
    if (tokenSync) {
        headers['Authorization'] = `Bearer ${tokenSync}`;
        headers['X-Kamples-Auth'] = `Bearer ${tokenSync}`;
    }
    return headers;
}

/**
 * Construye headers de auth SIN Content-Type (para GET o requests sin body).
 */
export function obtenerHeadersSyncGet(): Record<string, string> {
    return obtenerHeadersSync(false);
}

/**
 * Extrae información de error del response body de una petición fallida.
 * Intenta parsear JSON, si falla retorna texto plano truncado.
 */
export async function extraerErrorRespuesta(resp: Response): Promise<string> {
    try {
        const texto = await resp.text();
        try {
            const json = JSON.parse(texto);
            return json?.message ?? json?.code ?? texto.slice(0, 200);
        } catch {
            return texto.slice(0, 200);
        }
    } catch {
        return `HTTP ${resp.status}`;
    }
}

/*
 * Re-exports de circuit breaker para acceso centralizado desde servicios de sync.
 * El estado del circuito se consulta antes de operaciones de red para evitar
 * martillear un servidor caído.
 */
export { circuitoSync, circuitoUpload, CircuitoBiertoError } from './circuitBreaker';
export type { CircuitBreaker } from './circuitBreaker';
