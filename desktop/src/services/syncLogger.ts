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

export interface EntradaLog {
    seq: number;
    sesion: string;
    ts: number;
    nivel: NivelLog;
    modulo: string;
    msg: string;
    data?: unknown;
}

export interface ReporteDiagnosticoSync {
    generadoEn: number;
    sesion: string;
    nivelActivo: NivelLog;
    config: {
        carpetaLocal: string | null;
        sincronizacionActiva: boolean;
        ultimaSync: number;
        intervaloPollingMs: number;
        ultimoCursorDelta: number;
    };
    tracking: unknown;
    colaUploads: unknown;
    journal: {
        activo: boolean;
        operacionesPendientes: number;
    };
    ultimasEntradas: EntradaLog[];
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
let secuenciaActual = 0;

const sesionLogger = crearSesionLogger();

function crearSesionLogger(): string {
    return `sync-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function debeLoguear(nivel: NivelLog): boolean {
    return NIVELES_PRIORIDAD[nivel] >= NIVELES_PRIORIDAD[nivelActivo];
}

function crearEntrada(nivel: NivelLog, modulo: string, msg: string, data?: unknown): EntradaLog {
    secuenciaActual += 1;
    return {
        seq: secuenciaActual,
        sesion: sesionLogger,
        ts: Date.now(),
        nivel,
        modulo,
        msg,
        data,
    };
}

function formatearEntrada(e: EntradaLog): string {
    const fecha = new Date(e.ts).toISOString();
    const base = `[${fecha}] [${e.nivel.toUpperCase()}] [${e.modulo}] [${e.sesion}#${e.seq}] ${e.msg}`;
    if (e.data !== undefined) {
        try {
            return `${base} ${JSON.stringify(e.data)}`;
        } catch {
            return `${base} [dato no serializable]`;
        }
    }
    return base;
}

function serializarEntradaJsonl(e: EntradaLog): string {
    return JSON.stringify(e);
}

function parsearEntradaPersistida(linea: string): EntradaLog | null {
    if (!linea.trim()) return null;

    try {
        const parsed = JSON.parse(linea) as Partial<EntradaLog>;
        if (!parsed.ts || !parsed.nivel || !parsed.modulo || !parsed.msg) return null;

        return {
            seq: typeof parsed.seq === 'number' ? parsed.seq : 0,
            sesion: typeof parsed.sesion === 'string' ? parsed.sesion : 'legacy',
            ts: parsed.ts,
            nivel: parsed.nivel,
            modulo: parsed.modulo,
            msg: parsed.msg,
            data: parsed.data,
        };
    } catch {
        return null;
    }
}

function obtenerOrdenLecturaRotacion(): number[] {
    return Array.from({ length: MAX_ARCHIVOS_ROTACION }, (_, offset) => (archivoActualIdx + offset + 1) % MAX_ARCHIVOS_ROTACION);
}

async function escribirADisco(lineas: string[]): Promise<void> {
    try {
        const { writeTextFile, stat, BaseDirectory } = await import('@tauri-apps/plugin-fs');
        const nombreArchivo = `${NOMBRE_LOG}-${archivoActualIdx}.jsonl`;
        const contenido = lineas.join('\n') + '\n';

        await writeTextFile(nombreArchivo, contenido, {
            baseDir: BaseDirectory.AppData,
            append: true,
        } as Parameters<typeof writeTextFile>[2]);

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
    const lineas = lote.map(serializarEntradaJsonl);
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
    const entradas: EntradaLog[] = [];
    try {
        const { readTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
        for (const i of obtenerOrdenLecturaRotacion()) {
            try {
                const contenido = await readTextFile(`${NOMBRE_LOG}-${i}.jsonl`, {
                    baseDir: BaseDirectory.AppData,
                });
                if (!contenido.trim()) continue;
                const entradasArchivo = contenido
                    .split('\n')
                    .map(parsearEntradaPersistida)
                    .filter((entrada): entrada is EntradaLog => entrada !== null);
                entradas.push(...entradasArchivo);
            } catch {
                /* Archivo no existe todavía */
            }
        }
    } catch {
        /* FS no disponible */
    }
    return entradas
        .sort((a, b) => (a.seq - b.seq) || (a.ts - b.ts))
        .map(formatearEntrada)
        .join('\n');
}

export async function generarReporteDiagnosticoSync(): Promise<{ nombreArchivo: string; contenido: string }> {
    await flush();

    const [{ estado }, journalModule, trackingModule, uploadQueueModule] = await Promise.all([
        import('./syncState'),
        import('./syncJournal'),
        import('./syncTrackingService'),
        import('./uploadQueueService'),
    ]);

    const reporte: ReporteDiagnosticoSync = {
        generadoEn: Date.now(),
        sesion: sesionLogger,
        nivelActivo: nivelActivo,
        config: {
            carpetaLocal: estado.config.carpetaLocal,
            sincronizacionActiva: estado.config.sincronizacionActiva,
            ultimaSync: estado.config.ultimaSync,
            intervaloPollingMs: estado.intervaloPollingMs,
            ultimoCursorDelta: estado.ultimoCursorDelta,
        },
        tracking: trackingModule.obtenerResumenDebugTracking(),
        colaUploads: uploadQueueModule.obtenerResumenDebugUploadQueue(),
        journal: {
            activo: journalModule.estaInicializado(),
            operacionesPendientes: journalModule.operacionesPendientesCount(),
        },
        ultimasEntradas: [...obtenerUltimasEntradas(200)],
    };

    const contenido = JSON.stringify(reporte, null, 2);
    const nombreArchivo = `sync-diagnostic-${new Date(reporte.generadoEn).toISOString().replace(/[:.]/g, '-')}.json`;

    try {
        const { writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
        await writeTextFile(nombreArchivo, contenido, { baseDir: BaseDirectory.AppData });
        await writeTextFile('sync-diagnostic-latest.json', contenido, { baseDir: BaseDirectory.AppData });
    } catch {
        /* FS no disponible: devolver contenido igualmente */
    }

    return { nombreArchivo, contenido };
}

/* Loggers por nivel — API principal */

/*
 * Obtener las últimas N entradas del buffer en memoria.
 * No lee de disco — solo lo que está en el buffer actual (max 500).
 */
export function obtenerUltimasEntradas(n: number): ReadonlyArray<EntradaLog> {
    return buffer.slice(-n);
}

export function obtenerSesionLogger(): string {
    return sesionLogger;
}

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
