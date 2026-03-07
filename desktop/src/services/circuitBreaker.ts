/*
 * Servicio: circuitBreaker — Protección contra cascading failures en red.
 *
 * Implementa el patrón Circuit Breaker (Michael Nygard, "Release It!"):
 * - CERRADO: operaciones fluyen normal
 * - ABIERTO: todas las operaciones se rechazan inmediatamente (servidor caído)
 * - SEMI-ABIERTO: se prueba 1 operación para verificar recuperación
 *
 * Evita martillear un servidor caído con 50 timeouts simultáneos.
 * En su lugar, detecta la caída en 3 intentos y se recupera automáticamente.
 */

import { logSync } from './syncLogger';

type EstadoCircuito = 'cerrado' | 'abierto' | 'semi_abierto';

interface ConfigCircuitBreaker {
    umbralFallos: number;
    tiempoRecuperacionMs: number;
    nombre: string;
    /* TB2: TTL de inactividad — si no hay actividad (ni éxitos ni fallos) por este
     * tiempo, el circuito se resetea automáticamente a cerrado. Previene que un
     * circuito abierto por un error puntual bloquee operaciones indefinidamente
     * si nadie ejecuta puedeEjecutar() durante un periodo largo (app idle). */
    ttlInactividadMs: number;
}

const CONFIG_DEFAULT: ConfigCircuitBreaker = {
    umbralFallos: 3,
    tiempoRecuperacionMs: 30_000,
    nombre: 'sync',
    ttlInactividadMs: 30 * 60 * 1000, /* 30 minutos */
};

export class CircuitBreaker {
    private estado: EstadoCircuito = 'cerrado';
    private fallosConsecutivos = 0;
    private ultimoFallo = 0;
    private ultimaActividad = Date.now();
    private config: ConfigCircuitBreaker;

    constructor(config?: Partial<ConfigCircuitBreaker>) {
        this.config = { ...CONFIG_DEFAULT, ...config };
    }

    /**
     * Verifica si el circuito permite ejecutar operaciones.
     * En estado abierto, verifica si ya pasó el tiempo de recuperación.
     * TB2: Si no hay actividad por ttlInactividadMs, resetea a cerrado.
     */
    puedeEjecutar(): boolean {
        /* TB2: Auto-reset por inactividad */
        if (this.estado !== 'cerrado') {
            const tiempoSinActividad = Date.now() - this.ultimaActividad;
            if (tiempoSinActividad >= this.config.ttlInactividadMs) {
                logSync.info('circuitBreaker', `[${this.config.nombre}] Auto-reset por inactividad (${Math.round(tiempoSinActividad / 60000)}min sin actividad)`);
                this.estado = 'cerrado';
                this.fallosConsecutivos = 0;
                return true;
            }
        }

        if (this.estado === 'cerrado') return true;

        if (this.estado === 'abierto') {
            const tiempoTranscurrido = Date.now() - this.ultimoFallo;
            if (tiempoTranscurrido >= this.config.tiempoRecuperacionMs) {
                this.estado = 'semi_abierto';
                logSync.info('circuitBreaker', `[${this.config.nombre}] Transición ABIERTO → SEMI-ABIERTO (probando)`);
                return true;
            }
            return false;
        }

        /* semi_abierto: permite 1 operación de prueba */
        return true;
    }

    /**
     * Registra una operación exitosa.
     * En semi-abierto, cierra el circuito (recuperación confirmada).
     */
    registrarExito(): void {
        this.ultimaActividad = Date.now();
        if (this.estado === 'semi_abierto') {
            logSync.info('circuitBreaker', `[${this.config.nombre}] Transición SEMI-ABIERTO → CERRADO (recuperado)`);
        }
        this.estado = 'cerrado';
        this.fallosConsecutivos = 0;
    }

    /**
     * Registra un fallo de red.
     * Si supera el umbral, abre el circuito.
     */
    registrarFallo(): void {
        this.fallosConsecutivos++;
        this.ultimoFallo = Date.now();
        this.ultimaActividad = Date.now();

        if (this.estado === 'semi_abierto') {
            this.estado = 'abierto';
            logSync.warn('circuitBreaker', `[${this.config.nombre}] Transición SEMI-ABIERTO → ABIERTO (fallo en prueba)`);
            return;
        }

        if (this.fallosConsecutivos >= this.config.umbralFallos) {
            this.estado = 'abierto';
            logSync.warn('circuitBreaker', `[${this.config.nombre}] Transición CERRADO → ABIERTO (${this.fallosConsecutivos} fallos consecutivos)`);
        }
    }

    /**
     * Ejecuta una operación protegida por el circuit breaker.
     * Si el circuito está abierto, lanza error sin ejecutar.
     */
    async ejecutar<T>(operacion: () => Promise<T>): Promise<T> {
        if (!this.puedeEjecutar()) {
            const tiempoRestante = this.config.tiempoRecuperacionMs - (Date.now() - this.ultimoFallo);
            throw new CircuitoBiertoError(
                `Circuit breaker [${this.config.nombre}] abierto. Reintento en ${Math.ceil(tiempoRestante / 1000)}s`,
                tiempoRestante
            );
        }

        try {
            const resultado = await operacion();
            this.registrarExito();
            return resultado;
        } catch (error) {
            this.registrarFallo();
            throw error;
        }
    }

    obtenerEstado(): EstadoCircuito {
        return this.estado;
    }

    obtenerFallosConsecutivos(): number {
        return this.fallosConsecutivos;
    }

    /**
     * Fuerza el cierre del circuito (reset manual).
     */
    resetear(): void {
        this.estado = 'cerrado';
        this.fallosConsecutivos = 0;
        logSync.info('circuitBreaker', `[${this.config.nombre}] Reset manual → CERRADO`);
    }
}

/**
 * Error específico cuando el circuit breaker está abierto.
 * Incluye el tiempo estimado de espera para la UI.
 */
export class CircuitoBiertoError extends Error {
    readonly tiempoEsperaMs: number;

    constructor(message: string, tiempoEsperaMs: number) {
        super(message);
        this.name = 'CircuitoBiertoError';
        this.tiempoEsperaMs = tiempoEsperaMs;
    }
}

/* Instancia singleton para operaciones de sync con el servidor */
export const circuitoSync = new CircuitBreaker({ nombre: 'sync-api' });

/* Instancia separada para uploads (puede tener umbrales distintos) */
export const circuitoUpload = new CircuitBreaker({
    nombre: 'upload',
    umbralFallos: 5,
    tiempoRecuperacionMs: 45_000,
});
