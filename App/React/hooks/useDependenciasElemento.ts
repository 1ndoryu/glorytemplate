import {useMemo} from 'react';
import {verificarDependencias, obtenerNombreDependencia} from '../utils/dependencias';
import type {Habito, Tarea} from '../types/dashboard';

export function useDependenciasElemento(
    tipo: 'tarea' | 'habito' | 'subhabito',
    id: number,
    padreId: number | undefined,
    dependencias: {dependencias?: {tipo: 'tarea' | 'habito' | 'subhabito'; id: number; padreId?: number}[]} | undefined,
    tareas: Tarea[],
    habitos: Habito[]
) {
    return useMemo(() => {
        const deps = dependencias?.dependencias || [];
        const {bloqueado, bloqueantes} = verificarDependencias({dependencias: deps}, tareas, habitos);
        const nombresBloqueantes = bloqueantes.map(b => obtenerNombreDependencia(b, tareas, habitos));

        return {
            bloqueado,
            bloqueantes,
            nombresBloqueantes,
            mensajeBloqueo: bloqueantes.length > 0
                ? `Debes completar primero: ${nombresBloqueantes.join(', ')}`
                : ''
        };
    }, [dependencias, tareas, habitos, tipo, id, padreId]);
}
