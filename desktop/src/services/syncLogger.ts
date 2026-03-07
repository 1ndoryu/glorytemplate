/*
 * Servicio: syncLogger — Logger estructurado para el sistema de sync.
 *
 * Reemplaza console.log/error dispersos con un logger centralizado que:
 * - Clasifica por nivel (debug, info, warn, error)
 * - Incluye módulo de origen y timestamp
 * - Escribe a archivo rotativo para diagnóstico
 * - Es activable/desactivable desde config avanzada
 *
 * Inspirado en: los logs exportables de Dropbox sync client.
 */

type NivelLog = 'debug' | 'info' | 'warn' | 'error';

interface EntradaLog {
    ts: number;
    nivel: NivelLog;
    modulo: string;
    msg: string;
    data?: unknown;
}

const NIVELES_PRIORIDAD: Record<NivelLog, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const MAX_BUFFER = 500;
const MAX_ARCHIVO_BYTES = 5 * 1024 * 1024;
const MAX_ARCHIVOS_ROTACION = 3;
const FLUSH_INTERVALO_MS = 10_000;
const NOMBRE_LOG = 'sync-log';

let nivelActivo: NivelLog = 'info';
let buffer: EntradaLog[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let inicializado = false;
let archivoActualIdx = 0;

function debeLoguear(nivel: NivelLog): boolean {
    return NIVELES_PRIORIDAD[nivel] >= NIVELES_PRIORIDAD[nivelActivo];
}

function crearEntrada(nivel: NivelLog, modulo: string, msg: string, data?: unknown): EntradaLog {
    return { ts: Date.now(), nivel, modulo, msg, data };
}

function formatearEntrada(e: EntradaLog): string {
    const fecha = new Date(e.ts).toISOString();
    const base = `[${fecha}] [${e.nivel.toUpperCase()}] [${e.modulo}] ${e.msg}`;
    if (e.data !== undefined) {
        try {
            return `${base} ${JSON.stringify(e.data)}`;
        } catch {
            return `${base} [dato no serializable]`;
        }
    }
    return base;
}

async function escribirADisco(lineas: string[]): Promise<void> {
    try {
        const { writeTextFile, stat, BaseDirectory } = await import('@tauri-apps/plugin-fs');
        const nombreArchivo = `${NOMBRE_LOG}-${archivoActualIdx}.jsonl`;
        const contenido = lineas.join('\n') + '\n';

        await writeTextFile(nombreArchivo, contenido, {
            baseDir: BaseDirectory.AppData,
            append: true,
        });

        try {
            const info = await stat(nombreArchivo, { baseDir: BaseDirectory.AppData });
            if (info.size && info.size > MAX_ARCHIVO_BYTES) {
                archivoActualIdx = (archivoActualIdx + 1) % MAX_ARCHIVOS_ROTACION;
                /* Truncar el siguiente archivo (rotación) */
                await writeTextFile(`${NOMBRE_LOG}-${archivoActualIdx}.jsonl`, '', {
                    baseDir: BaseDirectory.AppData,
                });
            }
        } catch {
            /* stat puede fallar si el archivo acaba de crearse */
        }
    } catch {
        /* FS no disponible (ventana sin permisos) — solo consola */
    }
}

async function flush(): Promise<void> {
    if (buffer.length === 0) return;
    const lote = buffer.splice(0);
    const lineas = lote.map(formatearEntrada);
    await escribirADisco(lineas);
}

function agregarAlBuffer(entrada: EntradaLog): void {
    buffer.push(entrada);
    if (buffer.length > MAX_BUFFER) {
        buffer.splice(0, buffer.length - MAX_BUFFER);
    }

    /* También emitir a consola en desarrollo */
    const consoleFn = entrada.nivel === 'error' ? console.error
        : entrada.nivel === 'warn' ? console.warn
            : console.log;
    consoleFn(`[sync:${entrada.modulo}]`, entrada.msg, entrada.data ?? '');
}

/* API pública */

export function establecerNivelLog(nivel: NivelLog): void {
    nivelActivo = nivel;
}

export function obtenerNivelLog(): NivelLog {
    return nivelActivo;
}

export async function inicializarSyncLogger(): Promise<void> {
    if (inicializado) return;
    inicializado = true;
    flushTimer = setInterval(() => { flush().catch(() => {}); }, FLUSH_INTERVALO_MS);
}

export async function detenerSyncLogger(): Promise<void> {
    if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = null;
    }
    await flush();
    inicializado = false;
}

export async function flushLogs(): Promise<void> {
    await flush();
}

export async function exportarLogs(): Promise<string> {
    await flush();
    const lineas: string[] = [];
    try {
        const { readTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
        for (let i = 0; i < MAX_ARCHIVOS_ROTACION; i++) {
            try {
                const contenido = await readTextFile(`${NOMBRE_LOG}-${i}.jsonl`, {
                    baseDir: BaseDirectory.AppData,
                });
                if (contenido.trim()) lineas.push(contenido.trim());
            } catch {
                /* Archivo no existe todavía */
            }
        }
    } catch {
        /* FS no disponible */
    }
    return lineas.join('\n');
}

/* Loggers por nivel — API principal */

export const logSync = {
    debug(modulo: string, msg: string, data?: unknown): void {
        if (!debeLoguear('debug')) return;
        agregarAlBuffer(crearEntrada('debug', modulo, msg, data));
    },
    info(modulo: string, msg: string, data?: unknown): void {
        if (!debeLoguear('info')) return;
        agregarAlBuffer(crearEntrada('info', modulo, msg, data));
    },
    warn(modulo: string, msg: string, data?: unknown): void {
        if (!debeLoguear('warn')) return;
        agregarAlBuffer(crearEntrada('warn', modulo, msg, data));
    },
    error(modulo: string, msg: string, data?: unknown): void {
        if (!debeLoguear('error')) return;
        agregarAlBuffer(crearEntrada('error', modulo, msg, data));
    },
};
