/*
 * Servicio: transaccionSync — Operaciones compuestas con rollback automático.
 *
 * Garantiza que operaciones multi-paso (rename, move, delete) sean atómicas:
 * o todos los pasos se completan, o se revierten en orden inverso.
 *
 * Previene estados inconsistentes donde tracking local, carpeta en disco
 * y servidor quedan desincronizados por un fallo intermedio.
 */

import { logSync } from './syncLogger';

interface PasoTransaccion {
    nombre: string;
    ejecutar: () => Promise<void>;
    revertir: () => Promise<void>;
}

export class TransaccionSync {
    private pasos: PasoTransaccion[] = [];
    private nombreTransaccion: string;

    constructor(nombre: string) {
        this.nombreTransaccion = nombre;
    }

    /**
     * Agrega un paso con su función de ejecución y reversión.
     */
    agregar(nombre: string, ejecutar: () => Promise<void>, revertir: () => Promise<void>): void {
        this.pasos.push({ nombre, ejecutar, revertir });
    }

    /**
     * Ejecuta todos los pasos en orden.
     * Si alguno falla, revierte los completados en orden inverso.
     * Retorna true si todos completaron, false si hubo rollback.
     */
    async ejecutar(): Promise<boolean> {
        const completados: number[] = [];
        logSync.debug('transaccion', `Iniciando: ${this.nombreTransaccion} (${this.pasos.length} pasos)`);

        for (let i = 0; i < this.pasos.length; i++) {
            const paso = this.pasos[i];
            try {
                await paso.ejecutar();
                completados.push(i);
                logSync.debug('transaccion', `Paso ${i + 1}/${this.pasos.length} OK: ${paso.nombre}`);
            } catch (error) {
                logSync.error('transaccion', `Paso ${i + 1} FALLÓ: ${paso.nombre}`, {
                    error: error instanceof Error ? error.message : String(error),
                });

                /* Revertir en orden inverso */
                for (const idx of completados.reverse()) {
                    const pasoRevertir = this.pasos[idx];
                    try {
                        await pasoRevertir.revertir();
                        logSync.debug('transaccion', `Rollback OK: ${pasoRevertir.nombre}`);
                    } catch (errorRollback) {
                        logSync.error('transaccion', `Rollback FALLÓ: ${pasoRevertir.nombre}`, {
                            error: errorRollback instanceof Error ? errorRollback.message : String(errorRollback),
                        });
                    }
                }

                logSync.warn('transaccion', `${this.nombreTransaccion}: rollback completado (${completados.length} pasos revertidos)`);
                return false;
            }
        }

        logSync.info('transaccion', `${this.nombreTransaccion}: completada (${this.pasos.length} pasos)`);
        return true;
    }
}
