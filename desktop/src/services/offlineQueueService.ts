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

/* Tipos extensibles de operacion. Agregar aqui nuevos tipos sin modificar logica base. */
type TipoOperacion = 'reproduccion' | 'like' | 'follow' | 'descarga' | 'mover_carpeta' | 'soft_delete' | 'crear_coleccion';

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
}

const STORE_FILE = 'offline-queue.json';
const STORE_KEY = 'operaciones_pendientes';
const MAX_INTENTOS = 5;

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
    await guardarCola();

    /* Si estamos online, intentar sincronizar inmediatamente */
    if (estaOnline()) {
        sincronizarCola();
    }
}

/*
 * Sincroniza todas las operaciones pendientes con el servidor.
 * Ejecuta en orden FIFO. Si una falla por red, se detiene.
 * Si falla por respuesta (4xx/5xx), incrementa intentos y continua.
 */
export async function sincronizarCola(): Promise<void> {
    if (sincronizando || cola.length === 0) return;
    sincronizando = true;

    const exitosas = new Set<string>();
    const descartadas = new Set<string>();

    try {
        for (const op of cola) {
            /* Descartar operaciones que excedieron reintentos */
            if (op.intentos >= MAX_INTENTOS) {
                console.warn('[OfflineQueue] Descartando operacion tras', MAX_INTENTOS, 'intentos:', op.tipo, op.id);
                descartadas.add(op.id);
                continue;
            }

            try {
                const response = await fetch(op.endpoint, {
                    method: op.method,
                    headers: { 'Content-Type': 'application/json' },
                    body: op.body ? JSON.stringify(op.body) : undefined,
                });

                if (response.ok || response.status === 409) {
                    /* 409 = conflicto (ya existe) — considerar exitoso */
                    exitosas.add(op.id);
                } else {
                    /* Error de servidor — incrementar intentos y continuar con la siguiente */
                    op.intentos++;
                    console.warn('[OfflineQueue] Error', response.status, 'en operacion:', op.tipo, op.id, '- intento', op.intentos);
                }
            } catch (err) {
                /* Sin conexion o error de red — detener procesamiento */
                console.warn('[OfflineQueue] Error de red, deteniendo procesamiento:', err);
                break;
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
        console.error('[OfflineQueue] Error persistiendo cola:', err);
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
 * C378: Resetea reintentos para operaciones fallidas en la cola offline y fuerza reconexión
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
}
