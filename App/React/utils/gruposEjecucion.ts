import {useGruposEjecucion as useGruposEjecucionHook} from '../hooks/useGruposEjecucion';
import type {Tarea, Habito} from '../types/dashboard';

export function obtenerGruposEjecucion(tareas: Tarea[], habitos: Habito[] = [], gruposConocidos: string[] = []): string[] {
    const set = new Set<string>();
    tareas.forEach(t => t.grupoEjecucion && set.add(t.grupoEjecucion));
    habitos.forEach(h => h.grupoEjecucion && set.add(h.grupoEjecucion));
    gruposConocidos.forEach(g => set.add(g));
    return Array.from(set).sort();
}

/* Re-export hook for backwards compatibility */
export const useGruposEjecucion = useGruposEjecucionHook;
