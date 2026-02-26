/*
 * Hook: useEliminarSamples — Kamples
 * Herramientas de eliminación de samples para admin en modo dev.
 *
 * Expone:
 *   - eliminarSampleActual(sample): Elimina el sample indicado (el que está cargado en el reproductor).
 *   - pedirConfirmacionBorrarTodos(): Muestra toast de confirmación antes de borrar todo.
 *   - cargando: true mientras hay una operación en curso.
 *
 * SRP: solo gestión de eliminación. No maneja UI propia (usa toastStore).
 * Máx 120 líneas.
 */

import { useCallback, useRef, useState } from 'react';
import { eliminarSample } from '@app/services/apiSamples';
import { eliminarTodosSamples } from '@app/services/apiAdmin';
import { useToastStore } from '@app/stores/toastStore';
import { useReproductorStore } from '@app/stores/reproductorStore';

interface UseEliminarSamples {
    eliminarSampleActual: () => Promise<void>;
    pedirConfirmacionBorrarTodos: () => void;
    cargando: boolean;
}

export const useEliminarSamples = (): UseEliminarSamples => {
    const [cargando, setCargando] = useState(false);
    const agregar = useToastStore(s => s.agregar);
    const quitar = useToastStore(s => s.quitar);

    /* Ref para evitar doble-click mientras carga */
    const enProgreso = useRef(false);

    const cerrarReproductor = useReproductorStore(s => s.cerrar);
    const sampleActual = useReproductorStore(s => s.sampleActual);

    const eliminarSampleActual = useCallback(async (): Promise<void> => {
        if (!sampleActual || enProgreso.current) return;

        enProgreso.current = true;
        setCargando(true);

        const titulo = sampleActual.titulo;
        const id = sampleActual.id;

        try {
            const resp = await eliminarSample(id);

            if (!resp.ok) {
                agregar({
                    tipo: 'error',
                    mensaje: `Error al eliminar "${titulo}": ${resp.error ?? 'Error desconocido'}`,
                });
                return;
            }

            /* Limpiar reproductor si el sample eliminado era el actual */
            cerrarReproductor();

            agregar({ tipo: 'exito', mensaje: `Sample "${titulo}" eliminado correctamente.` });
        } catch {
            agregar({ tipo: 'error', mensaje: `Error inesperado eliminando "${titulo}".` });
        } finally {
            setCargando(false);
            enProgreso.current = false;
        }
    }, [sampleActual, agregar, cerrarReproductor]);

    const pedirConfirmacionBorrarTodos = useCallback((): void => {
        if (enProgreso.current) return;

        const toastId = agregar({
            tipo: 'confirmacion',
            mensaje: '¿Eliminar TODOS los samples? Esta acción no se puede deshacer.',
            acciones: [
                {
                    etiqueta: 'Eliminar todo',
                    variante: 'peligro',
                    onClick: async () => {
                        quitar(toastId);

                        if (enProgreso.current) return;
                        enProgreso.current = true;
                        setCargando(true);

                        try {
                            const resp = await eliminarTodosSamples();

                            if (!resp.ok) {
                                agregar({
                                    tipo: 'error',
                                    mensaje: `Error en borrado masivo: ${resp.error ?? 'Error desconocido'}`,
                                });
                                return;
                            }

                            const { eliminados, errores } = resp.data ?? { eliminados: 0, errores: 0 };
                            cerrarReproductor();

                            agregar({
                                tipo: errores > 0 ? 'info' : 'exito',
                                mensaje: `${eliminados} sample(s) eliminado(s).${errores > 0 ? ` ${errores} con error (ver logs).` : ''}`,
                            });
                        } catch {
                            agregar({ tipo: 'error', mensaje: 'Error inesperado durante el borrado masivo.' });
                        } finally {
                            setCargando(false);
                            enProgreso.current = false;
                        }
                    },
                },
                {
                    etiqueta: 'Cancelar',
                    variante: 'neutro',
                    onClick: () => quitar(toastId),
                },
            ],
        });
    }, [agregar, quitar, cerrarReproductor]);

    return { eliminarSampleActual, pedirConfirmacionBorrarTodos, cargando };
};
