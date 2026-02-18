/*
 * accionesSeleccion — Selección múltiple de bloques y modo resize global.
 * Permite Ctrl+click para toggle, limpieza y mover batch.
 */

import type { BloqueMezclador } from '../types/mezclador';
import type { SetMezclador, GetMezclador } from './tiposMezcladorStore';

export function crearAccionesSeleccion(set: SetMezclador, get: GetMezclador) {
    return {
        bloquesSeleccionados: new Set<string>(),
        modoResizeGlobal: 'stretch' as const,

        setModoResizeGlobal: (modo: 'stretch' | 'clip') => set({ modoResizeGlobal: modo }),

        toggleSeleccionBloque: (bloqueId: string, ctrlKey: boolean) => {
            set(prev => {
                const nuevaSeleccion = new Set(prev.bloquesSeleccionados);
                if (ctrlKey) {
                    if (nuevaSeleccion.has(bloqueId)) {
                        nuevaSeleccion.delete(bloqueId);
                    } else {
                        nuevaSeleccion.add(bloqueId);
                    }
                } else {
                    nuevaSeleccion.clear();
                    nuevaSeleccion.add(bloqueId);
                }
                return { bloquesSeleccionados: nuevaSeleccion };
            });
        },

        limpiarSeleccion: () => {
            set({ bloquesSeleccionados: new Set<string>() });
        },

        /*
         * Mover todos los bloques seleccionados manteniendo offsets relativos.
         * deltaCompas = diferencia respecto a la posición original del bloque principal.
         */
        moverBloquesSeleccionados: (pistaIdDestino: string, deltaCompas: number) => {
            get()._guardarSnapshot();
            set(prev => {
                const seleccionados = prev.bloquesSeleccionados;
                if (seleccionados.size === 0) return prev;

                const pistas = prev.pistas.map(p => ({
                    ...p,
                    bloques: p.bloques.map(b => {
                        if (!seleccionados.has(b.id)) return b;
                        return {
                            ...b,
                            pistaId: pistaIdDestino,
                            compasInicio: Math.max(0, b.compasInicio + deltaCompas),
                        };
                    }),
                }));

                /* Reagrupar: mover bloques seleccionados a pista destino */
                const bloquesMovidos: BloqueMezclador[] = [];
                const pistasLimpias = pistas.map(p => {
                    const noSel: BloqueMezclador[] = [];
                    for (const b of p.bloques) {
                        if (seleccionados.has(b.id)) {
                            bloquesMovidos.push(b);
                        } else {
                            noSel.push(b);
                        }
                    }
                    return { ...p, bloques: noSel };
                });

                const pistasFinales = pistasLimpias.map(p =>
                    p.id === pistaIdDestino
                        ? { ...p, bloques: [...p.bloques, ...bloquesMovidos] }
                        : p
                );

                return { pistas: pistasFinales };
            });
        },
    };
}
