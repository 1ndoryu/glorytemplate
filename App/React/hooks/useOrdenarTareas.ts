/*
 * Hook para gestionar el ordenamiento de tareas
 * Permite ordenar por: manual (default), inteligente, fecha, prioridad
 * Respeta la jerarquía (ordena padres y ordena hijos internamente) o modo plano
 *
 * Formula inteligente (v5.5):
 * - Peso total = urgencia_peso + prioridad_peso + fecha_peso
 * - Mayor peso = primero
 */

import {useMemo} from 'react';
import type {Tarea, NivelPrioridad, NivelUrgencia} from '../types/dashboard';
import {useLocalStorage} from './useLocalStorage';
import {obtenerFechaHoy, sumarDias} from '../utils/fecha';

export type ModoOrdenTareas = 'manual' | 'inteligente' | 'fecha' | 'prioridad';

export interface OpcionOrdenTarea {
    id: ModoOrdenTareas;
    etiqueta: string;
    descripcion: string;
}

export const MODOS_ORDEN_TAREAS: OpcionOrdenTarea[] = [
    {id: 'manual', etiqueta: 'Manual', descripcion: 'Drag & Drop'},
    {id: 'inteligente', etiqueta: 'Inteligente', descripcion: 'Urgencia + Prioridad + Fecha'},
    {id: 'fecha', etiqueta: 'Fecha límite', descripcion: 'Vencimiento'},
    {id: 'prioridad', etiqueta: 'Prioridad', descripcion: 'Importancia'}
];

const KEY_ORDEN_TAREAS = 'glory_orden_tareas';

/*
 * Pesos de urgencia (temporalidad)
 * bloqueante: 1000 (siempre primero)
 * urgente: 500
 * normal: 0 (default)
 * chill: -200 (puede esperar)
 */
const PESO_URGENCIA: Record<NivelUrgencia, number> = {
    bloqueante: 1000,
    urgente: 500,
    normal: 0,
    chill: -200
};

/*
 * Pesos de prioridad (importancia)
 * alta: 300
 * media: 100 (default si no se especifica)
 * baja: 0
 */
const PESO_PRIORIDAD: Record<NivelPrioridad | 'default', number> = {
    alta: 300,
    media: 100,
    baja: 0,
    default: 100
};

/*
 * Calcula el peso de fecha según proximidad
 * Vencida: +400, Hoy: +300, Mañana: +200, Esta semana: +100, Sin fecha: 0
 */
const calcularPesoFecha = (fechaMaxima?: string): number => {
    if (!fechaMaxima) return 0;

    const hoy = obtenerFechaHoy();
    const manana = sumarDias(hoy, 1);
    const finSemana = sumarDias(hoy, 7);

    if (fechaMaxima < hoy) return 400;
    if (fechaMaxima === hoy) return 300;
    if (fechaMaxima === manana) return 200;
    if (fechaMaxima <= finSemana) return 100;

    return 0;
};

/*
 * Calcula el peso total de una tarea para ordenamiento
 */
const calcularPesoTotal = (tarea: Tarea): number => {
    const pesoUrgencia = PESO_URGENCIA[tarea.urgencia || 'normal'];
    const pesoPrioridad = PESO_PRIORIDAD[tarea.prioridad || 'default'];
    const pesoFecha = calcularPesoFecha(tarea.configuracion?.fechaMaxima);

    return pesoUrgencia + pesoPrioridad + pesoFecha;
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
        if (!fechaA) return 1;
        if (!fechaB) return -1;
        return fechaA.localeCompare(fechaB);
    };

    const compararPorPrioridad = (a: Tarea, b: Tarea) => {
        const pA = PESO_PRIORIDAD[a.prioridad || 'default'];
        const pB = PESO_PRIORIDAD[b.prioridad || 'default'];
        return pB - pA;
    };

    /* Comparación inteligente usando pesos totales */
    const compararInteligente = (a: Tarea, b: Tarea) => {
        const pesoA = calcularPesoTotal(a);
        const pesoB = calcularPesoTotal(b);

        /* Mayor peso primero */
        if (pesoB !== pesoA) return pesoB - pesoA;

        /* Si empatan, ordenar por fecha */
        return compararPorFecha(a, b);
    };

    /*
     * Ordenar tareas manteniendo grupos de hermanos
     * ListaTareas construye el árbol basado en parentId
     */
    const tareasOrdenadas = useMemo(() => {
        if (modoActual === 'manual') return tareas;

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
