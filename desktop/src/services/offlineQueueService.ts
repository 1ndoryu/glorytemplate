/*
 * Queue de operaciones offline.
 * Cuando no hay conexión, las operaciones que normalmente
 * se envían al servidor (reproducciones, likes, follows)
 * se almacenan localmente y se sincronizan al reconectar.
 */

import { esDesktop, estaOnline } from './desktopService';

interface OperacionPendiente {
    id: string;
    tipo: 'reproduccion' | 'like' | 'follow' | 'descarga';
    endpoint: string;
    method: 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    timestamp: number;
}

const STORE_FILE = 'offline-queue.json';
const STORE_KEY = 'operaciones_pendientes';

let cola: OperacionPendiente[] = [];
let sincronizando = false;

/*
 * Inicializa la queue: carga operaciones pendientes del store
 * y configura listener de conectividad.
 */
export async function inicializarOfflineQueue(): Promise<void> {
    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        const guardadas = await store.get<OperacionPendiente[]>(STORE_KEY);
        if (guardadas) {
            cola = guardadas;
        }
    } catch {
        /* Store no disponible — usar queue en memoria */
    }

    /* Escuchar cambios de conectividad para sincronizar */
    window.addEventListener('online', () => { sincronizarCola(); });

    /* Si arrancamos online y hay operaciones pendientes, sincronizar */
    if (estaOnline() && cola.length > 0) {
        sincronizarCola();
    }
}

/*
 * Encola una operación para sincronizar cuando haya conexión.
 */
export async function encolarOperacion(op: Omit<OperacionPendiente, 'id' | 'timestamp'>): Promise<void> {
    const operacion: OperacionPendiente = {
        ...op,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
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
 * Ejecuta en orden FIFO. Si una falla, la deja en la cola.
 */
async function sincronizarCola(): Promise<void> {
    if (sincronizando || cola.length === 0) return;
    sincronizando = true;

    const exitosas: string[] = [];

    for (const op of cola) {
        try {
            const response = await fetch(op.endpoint, {
                method: op.method,
                headers: { 'Content-Type': 'application/json' },
                body: op.body ? JSON.stringify(op.body) : undefined,
            });

            if (response.ok || response.status === 409) {
                /* 409 = conflicto (ya existe) — considerar exitoso */
                exitosas.push(op.id);
            }
        } catch {
            /* Sin conexión o error de red — dejar en cola */
            break;
        }
    }

    /* Remover operaciones exitosas */
    if (exitosas.length > 0) {
        cola = cola.filter(op => !exitosas.includes(op.id));
        await guardarCola();
    }

    sincronizando = false;
}

/*
 * Persiste la cola en el store de Tauri.
 */
async function guardarCola(): Promise<void> {
    if (!esDesktop()) return;

    try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load(STORE_FILE);
        await store.set(STORE_KEY, cola);
        await store.save();
    } catch {
        /* Fallo silencioso — la cola en memoria sigue disponible */
    }
}

/*
 * Retorna la cantidad de operaciones pendientes (para UI).
 */
export function obtenerPendientes(): number {
    return cola.length;
}
