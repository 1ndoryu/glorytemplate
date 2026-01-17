/**
 * Hook useHistorial
 *
 * Sistema de undo/redo para el calendario CAP.
 * Guarda snapshots del estado antes de cada cambio
 * y permite revertir al estado anterior.
 */

import {useState, useCallback, useRef} from 'react';
import type {Clase} from '../types';

/* Límite de snapshots en memoria para evitar uso excesivo */
const MAX_SNAPSHOTS = 20;

interface Snapshot {
    clases: Clase[];
    descripcion: string;
    timestamp: number;
}

interface EstadoHistorial {
    puedeDeshacer: boolean;
    puedeRehacer: boolean;
    cantidadDeshacer: number;
    cantidadRehacer: number;
    descripcionUltimo: string | null;
}

interface AccionesHistorial {
    guardarSnapshot: (clases: Clase[], descripcion: string) => void;
    deshacer: () => Clase[] | null;
    rehacer: () => Clase[] | null;
    limpiarHistorial: () => void;
}

export function useHistorial(): EstadoHistorial & AccionesHistorial {
    /* Pila de estados anteriores (para deshacer) */
    const [pilaUndo, setPilaUndo] = useState<Snapshot[]>([]);

    /* Pila de estados siguientes (para rehacer) */
    const [pilaRedo, setPilaRedo] = useState<Snapshot[]>([]);

    /* Estado calculado */
    const puedeDeshacer = pilaUndo.length > 0;
    const puedeRehacer = pilaRedo.length > 0;
    const cantidadDeshacer = pilaUndo.length;
    const cantidadRehacer = pilaRedo.length;
    const descripcionUltimo = pilaUndo.length > 0 ? pilaUndo[pilaUndo.length - 1].descripcion : null;

    /**
     * Guardar snapshot antes de un cambio
     * Se llama ANTES de aplicar el cambio, guardando el estado actual
     */
    const guardarSnapshot = useCallback((clases: Clase[], descripcion: string) => {
        const nuevoSnapshot: Snapshot = {
            clases: JSON.parse(JSON.stringify(clases)),
            descripcion,
            timestamp: Date.now()
        };

        setPilaUndo(prev => {
            /* Limitar cantidad de snapshots */
            const nueva = [...prev, nuevoSnapshot];
            if (nueva.length > MAX_SNAPSHOTS) {
                nueva.shift();
            }
            return nueva;
        });

        /* Limpiar pila de redo al hacer un nuevo cambio */
        setPilaRedo([]);
    }, []);

    /**
     * Deshacer el último cambio
     * Retorna el estado anterior para que el componente lo aplique
     */
    const deshacer = useCallback((): Clase[] | null => {
        if (pilaUndo.length === 0) {
            return null;
        }

        /* Obtener el último snapshot */
        const snapshotAnterior = pilaUndo[pilaUndo.length - 1];

        /* Remover de la pila de undo */
        setPilaUndo(prev => prev.slice(0, -1));

        /* El estado actual se guarda en redo (esto lo debe hacer el componente) */
        /* Retornamos el estado a restaurar */
        return snapshotAnterior.clases;
    }, [pilaUndo]);

    /**
     * Rehacer un cambio deshecho
     * Retorna el estado siguiente para que el componente lo aplique
     */
    const rehacer = useCallback((): Clase[] | null => {
        if (pilaRedo.length === 0) {
            return null;
        }

        /* Obtener el último snapshot de redo */
        const snapshotSiguiente = pilaRedo[pilaRedo.length - 1];

        /* Remover de la pila de redo */
        setPilaRedo(prev => prev.slice(0, -1));

        return snapshotSiguiente.clases;
    }, [pilaRedo]);

    /**
     * Guardar estado actual en pila de redo (para poder rehacer)
     * Se usa cuando se deshace un cambio
     */
    const guardarEnRedo = useCallback((clases: Clase[], descripcion: string) => {
        const nuevoSnapshot: Snapshot = {
            clases: JSON.parse(JSON.stringify(clases)),
            descripcion,
            timestamp: Date.now()
        };

        setPilaRedo(prev => {
            const nueva = [...prev, nuevoSnapshot];
            if (nueva.length > MAX_SNAPSHOTS) {
                nueva.shift();
            }
            return nueva;
        });
    }, []);

    /**
     * Limpiar todo el historial
     * Se usa al recargar datos desde el servidor
     */
    const limpiarHistorial = useCallback(() => {
        setPilaUndo([]);
        setPilaRedo([]);
    }, []);

    return {
        puedeDeshacer,
        puedeRehacer,
        cantidadDeshacer,
        cantidadRehacer,
        descripcionUltimo,
        guardarSnapshot,
        deshacer,
        rehacer,
        limpiarHistorial
    };
}

export default useHistorial;
