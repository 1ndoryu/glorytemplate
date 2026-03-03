/*
 * Utilidad: Semáforo de concurrencia.
 *
 * Limita la cantidad de operaciones asíncronas ejecutándose
 * simultáneamente. Usado por uploadQueueService y syncCollectionService
 * para controlar uploads/descargas paralelas.
 *
 * Patrón: const s = new Semaforo(3); await s.adquirir(); ... s.liberar();
 */

export class Semaforo {
    private concurrenciaActual = 0;
    private colaEspera: Array<() => void> = [];

    constructor(private maxConcurrentes: number) {
        if (maxConcurrentes < 1) {
            this.maxConcurrentes = 1;
        }
    }

    /**
     * Adquiere un slot del semáforo.
     * Si todos los slots están ocupados, espera hasta que uno se libere.
     */
    async adquirir(): Promise<void> {
        if (this.concurrenciaActual < this.maxConcurrentes) {
            this.concurrenciaActual++;
            return;
        }

        return new Promise<void>(resolve => {
            this.colaEspera.push(resolve);
        });
    }

    /**
     * Libera un slot del semáforo y desbloquea al siguiente en espera.
     */
    liberar(): void {
        if (this.colaEspera.length > 0) {
            const siguiente = this.colaEspera.shift()!;
            /* No decrementar: el slot pasa directamente al siguiente */
            siguiente();
        } else {
            this.concurrenciaActual--;
        }
    }

    /**
     * Cambia el límite de concurrencia en caliente.
     * Si el nuevo límite es mayor, desbloquea waiters extra.
     */
    cambiarLimite(nuevoLimite: number): void {
        const anterior = this.maxConcurrentes;
        this.maxConcurrentes = Math.max(1, nuevoLimite);

        /* Si el nuevo límite es mayor, liberar waiters acumulados */
        const slotsNuevos = this.maxConcurrentes - anterior;
        if (slotsNuevos > 0) {
            const aLiberar = Math.min(slotsNuevos, this.colaEspera.length);
            for (let i = 0; i < aLiberar; i++) {
                this.concurrenciaActual++;
                const siguiente = this.colaEspera.shift()!;
                siguiente();
            }
        }
    }

    /** Cantidad de operaciones activas actualmente */
    get activas(): number {
        return this.concurrenciaActual;
    }

    /** Cantidad de operaciones esperando un slot */
    get enEspera(): number {
        return this.colaEspera.length;
    }

    /** Límite actual de concurrencia */
    get limite(): number {
        return this.maxConcurrentes;
    }
}
