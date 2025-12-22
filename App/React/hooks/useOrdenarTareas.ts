/*
 * Hook para gestionar el ordenamiento de tareas
 * Permite ordenar por: manual (default), inteligente, fecha, prioridad
 * Respeta la jerarquía (ordena padres y ordena hijos internamente) o modo plano
 */

import {useState, useMemo} from 'react';
import type {Tarea, NivelPrioridad} from '../types/dashboard';
import {useLocalStorage} from './useLocalStorage';

export type ModoOrdenTareas = 'manual' | 'inteligente' | 'fecha' | 'prioridad';

export interface OpcionOrdenTarea {
    id: ModoOrdenTareas;
    etiqueta: string;
    descripcion: string;
}

export const MODOS_ORDEN_TAREAS: OpcionOrdenTarea[] = [
    {id: 'manual', etiqueta: 'Manual', descripcion: 'Drag & Drop'},
    {id: 'inteligente', etiqueta: 'Inteligente', descripcion: 'Prioridad + Fecha'},
    {id: 'fecha', etiqueta: 'Fecha límite', descripcion: 'Vencimiento'},
    {id: 'prioridad', etiqueta: 'Prioridad', descripcion: 'Importancia'}
];

const KEY_ORDEN_TAREAS = 'glory_orden_tareas';

/* Mapa de prioridades a valores numéricos para ordenamiento */
const VALOR_PRIORIDAD: Record<NivelPrioridad | 'normal', number> = {
    alta: 3,
    media: 2,
    baja: 1,
    normal: 0 // Fallback
};

export function useOrdenarTareas(tareas: Tarea[]) {
    /* Persistencia del modo */
    const {valor: modoActual, setValor: setModoActual} = useLocalStorage<ModoOrdenTareas>(KEY_ORDEN_TAREAS, {
        valorPorDefecto: 'manual'
    });

    /* Funciones de comparación */
    const compararPorFecha = (a: Tarea, b: Tarea) => {
        const fechaA = a.configuracion?.fechaMaxima;
        const fechaB = b.configuracion?.fechaMaxima;
        if (!fechaA && !fechaB) return 0;
        if (!fechaA) return 1; // Sin fecha al final
        if (!fechaB) return -1;
        return fechaA.localeCompare(fechaB);
    };

    const compararPorPrioridad = (a: Tarea, b: Tarea) => {
        const pA = VALOR_PRIORIDAD[a.prioridad || 'normal'] || 0;
        const pB = VALOR_PRIORIDAD[b.prioridad || 'normal'] || 0;
        return pB - pA; // Mayor prioridad primero
    };

    const compararInteligente = (a: Tarea, b: Tarea) => {
        // 1. Prioridad
        const diffPrioridad = compararPorPrioridad(a, b);
        if (diffPrioridad !== 0) return diffPrioridad;

        // 2. Fecha
        return compararPorFecha(a, b);
    };

    /*
     * Ordenar tareas manteniendo grupos de hermanos
     * No podemos simplemente sortear todo el array porque romperíamos la asociación Id -> ParentId en la UI si usamos índices
     * Pero ListaTareas construye el árbol basado en parentId, así que el orden relativo en el array importa
     */
    const tareasOrdenadas = useMemo(() => {
        if (modoActual === 'manual') return tareas;

        // Clonar para no mutar
        const tareasCopy = [...tareas];

        switch (modoActual) {
            case 'fecha':
                return tareasCopy.sort(compararPorFecha);
            case 'prioridad':
                return tareasCopy.sort(compararPorPrioridad);
            case 'inteligente':
                return tareasCopy.sort(compararInteligente);
            default:
                return tareas;
        }
    }, [tareas, modoActual]);

    return {
        modoActual,
        cambiarModo: setModoActual,
        tareasOrdenadas,
        esOrdenManual: modoActual === 'manual',
        modosDisponibles: MODOS_ORDEN_TAREAS
    };
}
