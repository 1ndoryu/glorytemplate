/*
 * Logger — Kamples
 * Sistema de depuración por niveles.
 * En producción solo muestra errores.
 * En desarrollo muestra todo segun el nivel configurado.
 */

export enum NivelLog {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
}

interface ConfigLogger {
    nivel: NivelLog;
    prefijo: string;
    habilitado: boolean;
}

const CONFIG_POR_DEFECTO: ConfigLogger = {
    nivel: NivelLog.ERROR,
    prefijo: '[Kamples]',
    habilitado: true,
};

let configuracionActual: ConfigLogger = { ...CONFIG_POR_DEFECTO };

/*
 * Detecta si estamos en modo desarrollo.
 * Usa la variable de entorno que Glory inyecta al frontend.
 */
const esDesarrollo = (): boolean => {
    try {
        return (
            typeof window !== 'undefined' &&
            (window as unknown as Record<string, unknown>).__GLORY_DEV__ === true
        );
    } catch {
        return false;
    }
};

/* Inicialización automática: en dev se sube a DEBUG */
if (esDesarrollo()) {
    configuracionActual.nivel = NivelLog.DEBUG;
}

const formatearMensaje = (nivel: string, modulo: string, mensaje: string): string => {
    const timestamp = new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    return `${configuracionActual.prefijo} ${timestamp} [${nivel}] ${modulo}: ${mensaje}`;
};

/*
 * Estilos CSS para la consola del navegador, diferenciados por nivel.
 */
const estilosPorNivel: Record<string, string> = {
    ERROR: 'color: #ef4444; font-weight: bold;',
    WARN: 'color: #f59e0b; font-weight: bold;',
    INFO: 'color: #3b82f6;',
    DEBUG: 'color: #888888;',
};

/*
 * Crea un logger con un modulo/contexto especifico.
 * Uso: const log = crearLogger('Reproductor');
 *      log.info('Play iniciado');
 *      log.error('Fallo al cargar audio', error);
 */
export const crearLogger = (modulo: string) => {
    const debeLoguear = (nivel: NivelLog): boolean => {
        return configuracionActual.habilitado && nivel <= configuracionActual.nivel;
    };

    return {
        error: (mensaje: string, ...datos: unknown[]): void => {
            if (!debeLoguear(NivelLog.ERROR)) return;
            console.error(
                `%c${formatearMensaje('ERROR', modulo, mensaje)}`,
                estilosPorNivel.ERROR,
                ...datos
            );
        },

        warn: (mensaje: string, ...datos: unknown[]): void => {
            if (!debeLoguear(NivelLog.WARN)) return;
            console.warn(
                `%c${formatearMensaje('WARN', modulo, mensaje)}`,
                estilosPorNivel.WARN,
                ...datos
            );
        },

        info: (mensaje: string, ...datos: unknown[]): void => {
            if (!debeLoguear(NivelLog.INFO)) return;
            console.info(
                `%c${formatearMensaje('INFO', modulo, mensaje)}`,
                estilosPorNivel.INFO,
                ...datos
            );
        },

        debug: (mensaje: string, ...datos: unknown[]): void => {
            if (!debeLoguear(NivelLog.DEBUG)) return;
            console.debug(
                `%c${formatearMensaje('DEBUG', modulo, mensaje)}`,
                estilosPorNivel.DEBUG,
                ...datos
            );
        },
    };
};

/*
 * Configura el logger globalmente.
 * Usar al inicio de la app para establecer nivel personalizado.
 */
export const configurarLogger = (config: Partial<ConfigLogger>): void => {
    configuracionActual = { ...configuracionActual, ...config };
};

/*
 * Resetear a valores por defecto.
 */
export const resetearLogger = (): void => {
    configuracionActual = { ...CONFIG_POR_DEFECTO };
    if (esDesarrollo()) {
        configuracionActual.nivel = NivelLog.DEBUG;
    }
};

export type Logger = ReturnType<typeof crearLogger>;
