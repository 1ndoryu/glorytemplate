/*
 * Servicio: syncJournal — Write-Ahead Log para operaciones de tracking.
 *
 * Garantiza que ninguna operación se pierde aunque el proceso muera a mitad
 * de un batch. Las operaciones se escriben primero al journal (append-only)
 * y periódicamente se consolidan en un checkpoint (estado completo).
 *
 * Al iniciar, si existe un journal pendiente, se re-aplican las operaciones
 * sobre el último checkpoint para recuperar el estado.
 *
 * Inspirado en: WAL de SQLite, journal de Dropbox sync engine.
 *
 * Ciclo de vida:
 *   operación → append a journal → (cada N ops o T segundos) → checkpoint
 *   inicio → cargar checkpoint → re-aplicar journal pendiente → estado recuperado
 */

import { logSync } from './syncLogger';

/* Tipos de operaciones que el journal puede registrar */
export type TipoOperacionJournal =
    | 'TRACK_FILE'
    | 'UNTRACK_FILE'
    | 'UPDATE_FILE'
    | 'ADD_COLLECTION'
    | 'RENAME_COLLECTION'
    | 'DELETE_COLLECTION'
    | 'MOVE_FILE'
    | 'MARK_DISABLED'
    | 'MARK_ENABLED'
    | 'MARK_ENABLED_ALL'
    | 'UPDATE_HISTORIAL';

export interface OperacionJournal {
    tipo: TipoOperacionJournal;
    ts: number;
    clave?: string;
    datos: unknown;
}

interface CheckpointMeta {
    timestamp: number;
    totalOperaciones: number;
    hash: string;
}

const JOURNAL_FILE = 'sync-journal.jsonl';
const CHECKPOINT_FILE = 'sync-checkpoint.json';
const BACKUP_PREFIX = 'sync-checkpoint.backup';
const MAX_BACKUPS = 3;
const CHECKPOINT_INTERVALO_OPS = 50;
const CHECKPOINT_INTERVALO_MS = 30_000;

let operacionesPendientes: OperacionJournal[] = [];
let operacionesSinCheckpoint = 0;
let ultimoCheckpoint = 0;
let checkpointTimer: ReturnType<typeof setTimeout> | null = null;
let inicializado = false;

/* Callback que el consumidor registra para aplicar operaciones */
type AplicadorOperacion = (op: OperacionJournal, estado: unknown) => unknown;
let aplicadorRegistrado: AplicadorOperacion | null = null;
let estadoActual: unknown = null;

/* Callback externo invocado tras cada checkpoint (ej: persistir en Tauri Store) */
let onCheckpointCallback: ((estado: unknown) => Promise<void>) | null = null;

/**
 * Registra el aplicador de operaciones y el estado inicial.
 * El aplicador recibe una operación y el estado actual, retorna el nuevo estado.
 */
export function registrarAplicador(aplicador: AplicadorOperacion, estadoInicial: unknown): void {
    aplicadorRegistrado = aplicador;
    estadoActual = estadoInicial;
}

/**
 * Registra callback que se ejecuta tras cada checkpoint exitoso.
 * Permite al consumidor persistir el estado en almacenamiento adicional (ej: Tauri Store).
 */
export function registrarCallbackCheckpoint(cb: (estado: unknown) => Promise<void>): void {
    onCheckpointCallback = cb;
}

/**
 * Agrega una operación al journal (append-only).
 * Si soloRegistrar=true, solo escribe al archivo sin aplicar en memoria
 * (útil cuando el caller ya mutó el estado directamente).
 */
export async function appendOperacion(op: Omit<OperacionJournal, 'ts'>, soloRegistrar = false): Promise<void> {
    const operacion: OperacionJournal = { ...op, ts: Date.now() };

    /* Aplicar en memoria solo si no estamos en modo registro puro */
    if (!soloRegistrar && aplicadorRegistrado && estadoActual !== null) {
        estadoActual = aplicadorRegistrado(operacion, estadoActual);
    }

    operacionesPendientes.push(operacion);
    operacionesSinCheckpoint++;

    /* Persistir al journal (append a archivo) */
    await escribirAlJournal(operacion);

    /* Checkpoint automático si se alcanzó el umbral */
    if (operacionesSinCheckpoint >= CHECKPOINT_INTERVALO_OPS) {
        await checkpoint();
    }
}

/**
 * Consolidar: escribir estado completo al checkpoint y truncar journal.
 * Es la operación que garantiza que el journal no crece indefinidamente.
 */
export async function checkpoint(): Promise<void> {
    if (estadoActual === null) return;

    try {
        /* Crear backup rotativo antes de sobreescribir */
        await crearBackup();

        /* Escribir estado completo */
        const { writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
        const meta: CheckpointMeta = {
            timestamp: Date.now(),
            totalOperaciones: operacionesSinCheckpoint,
            hash: calcularHashSimple(JSON.stringify(estadoActual)),
        };

        const payload = JSON.stringify({ meta, estado: estadoActual });
        await writeTextFile(CHECKPOINT_FILE, payload, { baseDir: BaseDirectory.AppData });

        /* TA3: Notificar al consumidor ANTES de truncar el journal.
         * Si el callback falla, el journal permanece intacto para recovery.
         * Sin esto, un fallo en la persistencia del Store deja datos stale
         * y sin journal para re-aplicar al reiniciar. */
        if (onCheckpointCallback) {
            await onCheckpointCallback(estadoActual);
        }

        /* Truncar journal DESPUÉS de que el callback confirme éxito */
        await writeTextFile(JOURNAL_FILE, '', { baseDir: BaseDirectory.AppData });

        operacionesPendientes = [];
        operacionesSinCheckpoint = 0;
        ultimoCheckpoint = Date.now();

        logSync.debug('journal', `Checkpoint completado (${meta.totalOperaciones} ops consolidadas)`);
    } catch (error) {
        logSync.error('journal', 'Error en checkpoint', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
}

/**
 * Recupera el estado después de un crash:
 * 1. Cargar último checkpoint
 * 2. Re-aplicar operaciones pendientes del journal
 * 3. Retornar estado recuperado
 */
export async function recuperar<T>(): Promise<T | null> {
    try {
        const { readTextFile, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');

        /* Intentar cargar checkpoint principal */
        let estadoCargado: T | null = null;

        const checkpointExiste = await exists(CHECKPOINT_FILE, { baseDir: BaseDirectory.AppData });
        if (checkpointExiste) {
            try {
                const contenido = await readTextFile(CHECKPOINT_FILE, { baseDir: BaseDirectory.AppData });
                const parsed = JSON.parse(contenido);
                estadoCargado = parsed.estado ?? parsed;
                logSync.info('journal', 'Checkpoint cargado correctamente');
            } catch {
                logSync.warn('journal', 'Checkpoint corrupto, intentando backups');
                estadoCargado = await intentarBackups<T>();
            }
        }

        if (!estadoCargado) {
            estadoCargado = await intentarBackups<T>();
        }

        /* Re-aplicar journal pendiente */
        const journalExiste = await exists(JOURNAL_FILE, { baseDir: BaseDirectory.AppData });
        if (journalExiste && aplicadorRegistrado) {
            try {
                const journalRaw = await readTextFile(JOURNAL_FILE, { baseDir: BaseDirectory.AppData });
                const lineas = journalRaw.trim().split('\n').filter(l => l.trim());

                if (lineas.length > 0 && estadoCargado !== null) {
                    logSync.info('journal', `Re-aplicando ${lineas.length} operaciones del journal`);
                    let estadoRecuperado: unknown = estadoCargado;
                    for (const linea of lineas) {
                        try {
                            const op = JSON.parse(linea) as OperacionJournal;
                            estadoRecuperado = aplicadorRegistrado(op, estadoRecuperado);
                        } catch {
                            logSync.warn('journal', 'Línea de journal corrupta, omitiendo');
                        }
                    }
                    estadoCargado = estadoRecuperado as T;
                }
            } catch {
                logSync.warn('journal', 'Error leyendo journal, ignorando');
            }
        }

        estadoActual = estadoCargado;
        inicializado = true;

        return estadoCargado;
    } catch (error) {
        logSync.error('journal', 'Error en recuperación', {
            error: error instanceof Error ? error.message : String(error)
        });
        return null;
    }
}

/**
 * Inicia el timer de checkpoint periódico.
 */
export function iniciarCheckpointPeriodico(): void {
    if (checkpointTimer) return;
    checkpointTimer = setInterval(() => {
        if (operacionesSinCheckpoint > 0) {
            checkpoint().catch(() => {});
        }
    }, CHECKPOINT_INTERVALO_MS);
}

/**
 * Detiene el timer y fuerza un checkpoint final.
 */
export async function detenerJournal(): Promise<void> {
    if (checkpointTimer) {
        clearInterval(checkpointTimer);
        checkpointTimer = null;
    }
    if (operacionesSinCheckpoint > 0) {
        await checkpoint();
    }
    inicializado = false;
}

/**
 * Retorna el estado actual (para lectura sincrónica).
 */
export function obtenerEstado<T>(): T | null {
    return estadoActual as T | null;
}

/**
 * Fuerza actualización del estado (para sync externo, ej: merge de otra ventana).
 */
export function establecerEstado(nuevoEstado: unknown): void {
    estadoActual = nuevoEstado;
}

export function estaInicializado(): boolean {
    return inicializado;
}

export function operacionesPendientesCount(): number {
    return operacionesSinCheckpoint;
}

/* Funciones internas */

async function escribirAlJournal(op: OperacionJournal): Promise<void> {
    try {
        const { writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
        const linea = JSON.stringify(op) + '\n';
        await writeTextFile(JOURNAL_FILE, linea, {
            baseDir: BaseDirectory.AppData,
            append: true,
        } as Parameters<typeof writeTextFile>[2]);
    } catch (error) {
        logSync.error('journal', 'Error escribiendo al journal', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
}

async function crearBackup(): Promise<void> {
    try {
        const { exists, readTextFile, writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
        const checkpointExiste = await exists(CHECKPOINT_FILE, { baseDir: BaseDirectory.AppData });
        if (!checkpointExiste) return;

        const contenido = await readTextFile(CHECKPOINT_FILE, { baseDir: BaseDirectory.AppData });

        /* Rotar: mover N-1 → N, ... , 0 → 1, escribir nuevo en 0 */
        for (let i = MAX_BACKUPS - 1; i > 0; i--) {
            const archivoOrigen = `${BACKUP_PREFIX}-${i - 1}.json`;
            const archivoDestino = `${BACKUP_PREFIX}-${i}.json`;
            const origenExiste = await exists(archivoOrigen, { baseDir: BaseDirectory.AppData });
            if (origenExiste) {
                const data = await readTextFile(archivoOrigen, { baseDir: BaseDirectory.AppData });
                await writeTextFile(archivoDestino, data, { baseDir: BaseDirectory.AppData });
            }
        }

        await writeTextFile(`${BACKUP_PREFIX}-0.json`, contenido, { baseDir: BaseDirectory.AppData });
    } catch (error) {
        logSync.warn('journal', 'Error creando backup', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
}

async function intentarBackups<T>(): Promise<T | null> {
    try {
        const { exists, readTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');

        for (let i = 0; i < MAX_BACKUPS; i++) {
            const archivo = `${BACKUP_PREFIX}-${i}.json`;
            const backupExiste = await exists(archivo, { baseDir: BaseDirectory.AppData });
            if (!backupExiste) continue;

            try {
                const contenido = await readTextFile(archivo, { baseDir: BaseDirectory.AppData });
                const parsed = JSON.parse(contenido);
                logSync.info('journal', `Recuperado desde backup-${i}`);
                return (parsed.estado ?? parsed) as T;
            } catch {
                logSync.warn('journal', `Backup-${i} corrupto, probando siguiente`);
            }
        }
    } catch {
        logSync.error('journal', 'Error accediendo a backups');
    }
    return null;
}

function calcularHashSimple(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return (hash >>> 0).toString(16);
}
