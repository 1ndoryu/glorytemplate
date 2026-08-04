/**
 * dependenciasUIStore
 * Gestiona el estado visual de destello para dependencias condicionales.
 * Permite que un elemento (tarea, habito, subhabito) parpadee cuando
 * se intenta completar un elemento bloqueado.
 */

import {create} from 'zustand';

export interface DependenciaDestello {
    tipo: 'tarea' | 'habito' | 'subhabito';
    id: number;
    padreId?: number;
}

interface DependenciasUIState {
    destello: DependenciaDestello | null;
    destelloTick: number;
}

interface DependenciasUIActions {
    activarDestello: (destello: DependenciaDestello) => void;
    limpiarDestello: () => void;
}

export type DependenciasUIStore = DependenciasUIState & DependenciasUIActions;

export const useDependenciasUIStore = create<DependenciasUIStore>()(set => ({
    destello: null,
    destelloTick: 0,

    activarDestello: destello =>
        set(state => ({
            destello,
            destelloTick: state.destelloTick + 1
        })),

    limpiarDestello: () =>
        set({
            destello: null,
            destelloTick: 0
        })
}));
