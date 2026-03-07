/*
 * Queue de operaciones offline.
 * Cuando no hay conexion, las operaciones que normalmente
 * se envian al servidor (reproducciones, likes, follows, moves de sync)
 * se almacenan localmente y se sincronizan al reconectar.
 *
 * Soporta deduplicacion por claveDuplicacion: si se encola una operacion
 * con la misma clave que una existente, se reemplaza en lugar de duplicar.
 * Util para moves de carpeta — solo el ultimo destino importa.
 */

import { esDesktop, estaOnline } from './desktopService';
import { clasificarError, obtenerEstrategia, extraerRetryAfterMs, esErrorDeRed } from './errorSync';
import { logSync } from './syncLogger';

/* Tipos extensibles de operacion. Agregar aqui nuevos tipos sin modificar logica base. */
type TipoOperacion = 'reproduccion' | 'like' | 'follow' | 'descarga' | 'mover_carpeta' | 'soft_delete' | 'crear_coleccion' | 'agregar_sample_coleccion' | 'renombrar_coleccion';

export interface OperacionPendiente {
    id: string;
    tipo: TipoOperacion;
    endpoint: string;
    method: 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    timestamp: number;
    /* Clave opcional para deduplicacion. Si dos operaciones comparten clave, la mas reciente reemplaza. */
    claveDuplicacion?: string;
    intentos: number;
    /** Categoría del último error para estrategia de retry inteligente */
    ultimaCategoria?: string;
    /** Timestamp del próximo retry permitido (backoff exponencial) */
    noReintentarAntesDe?: number;
}

const STORE_FILE = 'offline-queue.json';
const STORE_KEY = 'operaciones_pendientes';
const MAX_INTENTOS = 5;
/* TM5: Límite de tamaño de cola para prevenir crecimiento sin control
 * bajo condiciones patológicas (servidor caído por días). FIFO eviction. */
const MAX_COLA_SIZE = 500;

let cola: OperacionPendiente[] = [];
let sincronizando = false;

/* eslint-disable @typescript-eslint/no-explicit-any -- Tauri Store typing flexible */
let storeCache: { get: <T>(key: string) => Promise<T | null>; set: (key: string, val: unknown) => Promise<void>; save: () => Promise<void> } | null = null;

/*
 * Inicializa la queue: carga operaciones pendientes del store
 * y configura listener de conectividad.
 */
export async function inicializarOfflineQueue(): Promise<void> {
    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        storeCache = store as typeof storeCache;

        const guardadas = await storeCache!.get<OperacionPendiente[]>(STORE_KEY);
        if (guardadas) {
            /* Migrar operaciones antiguas sin campo intentos */
            cola = guardadas.map(op => ({ ...op, intentos: op.intentos ?? 0 }));
        }
    } catch (err) {
        console.warn('[OfflineQueue] Store no disponible, usando queue en memoria:', err);
    }

    /* Escuchar cambios de conectividad para sincronizar */
    window.addEventListener('online', () => { sincronizarCola(); });

    /* Listener cross-ventana: el sync panel actualiza el Store directamente
     * y emite este evento. La ventana principal recarga la cola desde Store. */
    try {
        const { listen } = await import('@tauri-apps/api/event');
        void listen('reintentar-errores-offline', async () => {
            /* Recargar cola desde el Store (el sync panel ya la actualizó ahí) */
            try {
                const { load } = await import('@tauri-apps/plugin-store');
                const store = await load(STORE_FILE);
                const guardadas = await store.get<OperacionPendiente[]>(STORE_KEY);
                if (guardadas) {
                    cola = guardadas.map(op => ({ ...op, intentos: op.intentos ?? 0 }));
                }
            } catch {
                /* Fallback: resetear desde memoria */
                for (const op of cola) {
                    if (op.intentos > 0) op.intentos = 0;
                }
            }
            if (estaOnline() && cola.length > 0) sincronizarCola();
        });
    } catch {
        /* Entorno sin Tauri — ignorar */
    }

    /* Si arrancamos online y hay operaciones pendientes, sincronizar */
    if (estaOnline() && cola.length > 0) {
        sincronizarCola();
    }
}

/*
 * Encola una operacion para sincronizar cuando haya conexion.
 * Si se proporciona claveDuplicacion y ya existe una operacion con la misma clave,
 * se reemplaza el payload en lugar de encolar una nueva (solo importa el ultimo estado).
 */
export async function encolarOperacion(
    op: Omit<OperacionPendiente, 'id' | 'timestamp' | 'intentos'>,
): Promise<void> {
    /* Deduplicacion por clave */
    if (op.claveDuplicacion) {
        const idx = cola.findIndex(o => o.claveDuplicacion === op.claveDuplicacion);
        if (idx !== -1) {
            cola[idx] = {
                ...cola[idx],
                endpoint: op.endpoint,
                body: op.body,
                timestamp: Date.now(),
                intentos: 0,
            };
            await guardarCola();
            return;
        }
    }

    const operacion: OperacionPendiente = {
        ...op,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        intentos: 0,
    };

    cola.push(operacion);

    /* TM5: Evicción FIFO si la cola excede el límite */
    if (cola.length > MAX_COLA_SIZE) {
        const descartadas = cola.splice(0, cola.length - MAX_COLA_SIZE);
        logSync.warn('offlineQueue', `Cola excede ${MAX_COLA_SIZE}, descartadas ${descartadas.length} operaciones antiguas (FIFO)`);
    }

    await guardarCola();

    /* Si estamos online, intentar sincronizar inmediatamente */
    if (estaOnline()) {
        sincronizarCola();
    }
}

/*
 * Sincroniza todas las operaciones pendientes con el servidor.
 * Ejecuta en orden FIFO con clasificación inteligente de errores:
 * - Errores transitorios (502, 503, red): backoff exponencial + jitter
 * - Rate limit (429): respeta Retry-After header
 * - Errores permanentes (404, 400): descarta sin reintentar
 * - Errores de autenticación (401, 403): detiene procesamiento
 */
export async function sincronizarCola(): Promise<void> {
    if (sincronizando || cola.length === 0) return;
    sincronizando = true;

    const exitosas = new Set<string>();
    const descartadas = new Set<string>();
    const ahora = Date.now();

    try {
        for (const op of cola) {
            /* Respetar backoff: si la operación tiene un delay pendiente, saltar */
            if (op.noReintentarAntesDe && ahora < op.noReintentarAntesDe) {
                continue;
            }

            /* Descartar operaciones que excedieron reintentos */
            if (op.intentos >= MAX_INTENTOS) {
                logSync.warn('offlineQueue', `Descartando operación tras ${MAX_INTENTOS} intentos: ${op.tipo} ${op.id}`);
                descartadas.add(op.id);
                continue;
            }

            /* Descartar operaciones con error permanente clasificado */
            if (op.ultimaCategoria === 'permanente') {
                logSync.info('offlineQueue', `Descartando operación con error permanente: ${op.tipo} ${op.id}`);
                descartadas.add(op.id);
                continue;
            }

            try {
                const response = await fetch(op.endpoint, {
                    method: op.method,
                    headers: { 'Content-Type': 'application/json' },
                    body: op.body ? JSON.stringify(op.body) : undefined,
                });

                if (response.ok) {
                    exitosas.add(op.id);
                } else if (response.status === 409) {
                    /* TA2: No todo 409 es conflicto de versión benigno.
                     * Solo marcar como éxito si el body confirma conflicto_version.
                     * Otros 409 (auth disfrazada, permisos) deben re-encolarse. */
                    let esConflictoVersion = false;
                    try {
                        const body409 = await response.json() as { code?: string };
                        esConflictoVersion = body409.code === 'conflicto_version';
                    } catch {
                        /* Si no se puede parsear body, asumir conflicto benigno por retrocompat */
                        esConflictoVersion = true;
                    }
                    if (esConflictoVersion) {
                        exitosas.add(op.id);
                    } else {
                        logSync.warn('offlineQueue', `409 no-conflicto para ${op.tipo} ${op.id}, re-encolando`);
                        op.intentos++;
                        op.ultimaCategoria = 'transitorio';
                        const delay = 5000 * Math.pow(2, op.intentos - 1);
                        op.noReintentarAntesDe = Date.now() + delay;
                    }
                } else {
                    /* Clasificar error y aplicar estrategia correspondiente */
                    const categoria = clasificarError(response.status);
                    const retryAfterMs = extraerRetryAfterMs(response.headers);
                    const estrategia = obtenerEstrategia(categoria, retryAfterMs);

                    op.intentos++;
                    op.ultimaCategoria = categoria;

                    if (!estrategia.reintentar || op.intentos >= estrategia.maxReintentos) {
                        logSync.warn('offlineQueue', `Error ${response.status} (${categoria}) — descartando: ${op.tipo} ${op.id}`);
                        descartadas.add(op.id);
                    } else {
                        const delay = estrategia.calcularDelay(op.intentos);
                        op.noReintentarAntesDe = Date.now() + delay;
                        logSync.info('offlineQueue', `Error ${response.status} (${categoria}) — retry en ${Math.round(delay / 1000)}s: ${op.tipo} ${op.id}`);
                    }

                    /* Autenticación: detener toda la cola para evitar cascada de 401s */
                    if (categoria === 'autenticacion') {
                        logSync.warn('offlineQueue', 'Error de autenticación, deteniendo procesamiento de cola');
                        break;
                    }
                }
            } catch (err) {
                if (esErrorDeRed(err)) {
                    /* Sin conexión — detener procesamiento, reintentar al reconectar */
                    logSync.warn('offlineQueue', 'Error de red, deteniendo procesamiento');
                    break;
                }
                /* Error inesperado — incrementar y continuar */
                op.intentos++;
                const delay = 2000 * Math.pow(2, op.intentos);
                op.noReintentarAntesDe = Date.now() + Math.min(delay, 300_000);
                logSync.error('offlineQueue', `Error inesperado en ${op.tipo} ${op.id}`, {
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        }
    } finally {
        /* Remover operaciones exitosas y descartadas */
        const aRemover = new Set([...exitosas, ...descartadas]);
        if (aRemover.size > 0) {
            cola = cola.filter(op => !aRemover.has(op.id));
        }
        sincronizando = false;
        await guardarCola();
    }
}

/*
 * Persiste la cola en el store de Tauri.
 */
async function guardarCola(): Promise<void> {
    if (!storeCache) return;

    try {
        await storeCache.set(STORE_KEY, cola);
        await storeCache.save();
    } catch (err) {
        logSync.error('offlineQueue', 'Error persistiendo cola', { error: err instanceof Error ? err.message : String(err) });
    }
}

/*
 * Retorna la cantidad de operaciones pendientes (para UI).
 */
export function obtenerPendientes(): number {
    return cola.length;
}

/*
 * Retorna snapshot inmutable de la cola para debug/UI.
 */
export function obtenerCola(): Readonly<OperacionPendiente[]> {
    return cola;
}

/*
 * C378: Resetea reintentos para operaciones fallidas en la cola offline y fuerza reconexión.
 *
 * Arquitectura multi-ventana: también emite evento Tauri para que la ventana
 * principal (donde vive la cola real) procese el reintento.
 */
export async function reintentarErroresOffline(): Promise<void> {
    let cambios = false;
    for (const op of cola) {
        if (op.intentos > 0) {
            op.intentos = 0;
            cambios = true;
        }
    }

    if (cambios) {
        await guardarCola();
        if (estaOnline()) {
            await sincronizarCola();
        }
    }

    /* Notificar a todas las ventanas Tauri para procesar el reintento. */
    try {
        const { emit } = await import('@tauri-apps/api/event');
        await emit('reintentar-errores-offline', {});
    } catch {
        /* Entorno sin Tauri — ignorar */
    }
}
