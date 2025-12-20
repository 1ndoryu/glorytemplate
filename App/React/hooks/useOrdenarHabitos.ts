/*
 * useOrdenarHabitos
 * Hook para ordenar habitos segun diferentes criterios
 * Responsabilidad unica: proveer logica de ordenamiento para habitos
 */

import {useState, useMemo, useCallback} from 'react';
import type {Habito} from '../types/dashboard';

export type ModoOrdenHabitos = 'importancia' | 'inactividad' | 'racha' | 'nombre' | 'urgenciaPonderada';

interface ModoOrdenInfo {
    id: ModoOrdenHabitos;
    etiqueta: string;
    descripcion: string;
}

export const MODOS_ORDEN: ModoOrdenInfo[] = [
    {id: 'importancia', etiqueta: 'Importancia', descripcion: 'Alta > Media > Baja, luego por inactividad'},
    {id: 'inactividad', etiqueta: 'Urgentes', descripcion: 'Mas dias sin hacer primero'},
    {id: 'racha', etiqueta: 'Racha', descripcion: 'Rachas mas largas primero'},
    {id: 'nombre', etiqueta: 'Nombre', descripcion: 'Orden alfabetico A-Z'},
    {id: 'urgenciaPonderada', etiqueta: 'Inteligente', descripcion: 'Combina importancia + inactividad'}
];

const PESO_IMPORTANCIA: Record<Habito['importancia'], number> = {
    Alta: 3,
    Media: 2,
    Baja: 1
};

/*
 * Funciones de ordenamiento por modo
 */
function ordenarPorImportancia(a: Habito, b: Habito): number {
    const pesoA = PESO_IMPORTANCIA[a.importancia];
    const pesoB = PESO_IMPORTANCIA[b.importancia];

    if (pesoA !== pesoB) return pesoB - pesoA;

    /* Si misma importancia, ordenar por inactividad (mas dias primero) */
    return b.diasInactividad - a.diasInactividad;
}

function ordenarPorInactividad(a: Habito, b: Habito): number {
    return b.diasInactividad - a.diasInactividad;
}

function ordenarPorRacha(a: Habito, b: Habito): number {
    return b.racha - a.racha;
}

function ordenarPorNombre(a: Habito, b: Habito): number {
    return a.nombre.localeCompare(b.nombre, 'es', {sensitivity: 'base'});
}

function ordenarPorUrgenciaPonderada(a: Habito, b: Habito): number {
    /* Formula: (importancia * 2) + (diasInactividad * 1.5) - (racha > 0 ? 1 : 0) */
    const scoreA = PESO_IMPORTANCIA[a.importancia] * 2 + a.diasInactividad * 1.5 - (a.racha > 0 ? 1 : 0);
    const scoreB = PESO_IMPORTANCIA[b.importancia] * 2 + b.diasInactividad * 1.5 - (b.racha > 0 ? 1 : 0);

    return scoreB - scoreA;
}

interface UseOrdenarHabitosReturn {
    habitosOrdenados: Habito[];
    modoActual: ModoOrdenHabitos;
    cambiarModo: (modo: ModoOrdenHabitos) => void;
    modosDisponibles: ModoOrdenInfo[];
}

export function useOrdenarHabitos(habitos: Habito[], modoInicial: ModoOrdenHabitos = 'importancia'): UseOrdenarHabitosReturn {
    const [modoActual, setModoActual] = useState<ModoOrdenHabitos>(modoInicial);

    const habitosOrdenados = useMemo(() => {
        const copia = [...habitos];

        switch (modoActual) {
            case 'importancia':
                return copia.sort(ordenarPorImportancia);
            case 'inactividad':
                return copia.sort(ordenarPorInactividad);
            case 'racha':
                return copia.sort(ordenarPorRacha);
            case 'nombre':
                return copia.sort(ordenarPorNombre);
            case 'urgenciaPonderada':
                return copia.sort(ordenarPorUrgenciaPonderada);
            default:
                return copia;
        }
    }, [habitos, modoActual]);

    const cambiarModo = useCallback((modo: ModoOrdenHabitos) => {
        setModoActual(modo);
    }, []);

    return {
        habitosOrdenados,
        modoActual,
        cambiarModo,
        modosDisponibles: MODOS_ORDEN
    };
}
