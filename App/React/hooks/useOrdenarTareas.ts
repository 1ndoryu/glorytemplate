/*
 * Hook para gestionar el ordenamiento de tareas
 * Permite ordenar por: manual (default), inteligente, fecha, prioridad
 * Respeta la jerarquía (ordena padres y ordena hijos internamente) o modo plano
 *
 * Formula inteligente (v6.0 - Ordenamiento Inteligente 2.0):
 * - Peso total = urgencia_peso + prioridad_peso + fecha_peso + retraso_peso
 * - retraso_peso = diasRetraso * FACTOR_PONDERACION_RETRASO
 * - Mayor peso = primero
 *
 * Esto hace que tareas antiguas vencidas pesen más:
 * - Tarea media (prio 2) con 3 días de retraso > tarea media con 1 día de retraso
 */

import {useMemo} from 'react';
import {type Tarea, type NivelPrioridad, type NivelUrgencia, esTareaHabito} from '../types/dashboard';
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
    {id: 'inteligente', etiqueta: 'Inteligente', descripcion: 'Urgencia + Prioridad + Fecha + Retraso'},
    {id: 'fecha', etiqueta: 'Fecha límite', descripcion: 'Vencimiento'},
    {id: 'prioridad', etiqueta: 'Prioridad', descripcion: 'Importancia'}
];

const KEY_ORDEN_TAREAS = 'glory_orden_tareas';

/*
 * Factor de ponderación por día de retraso
 * Cada día de retraso suma 50 puntos al peso total
 * Esto permite que tareas "olvidadas" suban gradualmente en prioridad
 */
const FACTOR_PONDERACION_RETRASO = 50;

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
 * muy_alta: 500 (máxima)
 * alta: 300
 * media: 100 (default si no se especifica)
 * baja: 0
 * muy_baja: -100
 */
const PESO_PRIORIDAD: Record<NivelPrioridad | 'default', number> = {
    muy_alta: 500,
    alta: 300,
    media: 100,
    baja: 0,
    muy_baja: -100,
    default: 100
};

/*
 * Calcula los días de retraso de una tarea vencida
 * Retorna 0 si no está vencida o no tiene fecha
 */
const calcularDiasRetraso = (fechaMaxima?: string): number => {
    if (!fechaMaxima) return 0;

    const hoy = obtenerFechaHoy();
    if (fechaMaxima >= hoy) return 0;

    /* Calcular diferencia en días */
    const fechaMax = new Date(fechaMaxima + 'T00:00:00');
    const fechaHoy = new Date(hoy + 'T00:00:00');
    const diffMs = fechaHoy.getTime() - fechaMax.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDias);
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
 * Fórmula v6.0: urgencia + prioridad + fecha + (diasRetraso * factor)
 */
const calcularPesoTotal = (tarea: Tarea): number => {
    const pesoUrgencia = PESO_URGENCIA[tarea.urgencia || 'normal'];
    const pesoPrioridad = PESO_PRIORIDAD[tarea.prioridad || 'default'];
    const pesoFecha = calcularPesoFecha(tarea.configuracion?.fechaMaxima);
    const diasRetraso = calcularDiasRetraso(tarea.configuracion?.fechaMaxima);
    const pesoRetraso = diasRetraso * FACTOR_PONDERACION_RETRASO;

    let pesoTotal = pesoUrgencia + pesoPrioridad + pesoFecha + pesoRetraso;

    /* Bono por ventana de oportunidad para hábitos.
     * Bug corregido: antes se usaba *= 3, lo que empeoraba hábitos con peso base negativo
     * (ej: chill=-200 + media=100 = -100, y -100*3=-300 los mandaba al final).
     * Solución: bono fijo +2000 desde 0, garantiza que suban al tope sin importar urgencia base. */
    if (esTareaHabito(tarea) && tarea.enVentanaOportunidad) {
        pesoTotal = Math.max(0, pesoTotal) + 2000;
    }

    return pesoTotal;
};

export function useOrdenarTareas(tareas: Tarea[]) {
    /*
     * Persistencia del modo de orden
     * Por defecto: inteligente (Beta: facilita la adopción inicial)
     */
    const {valor: modoActual, setValor: setModoActual} = useLocalStorage<ModoOrdenTareas>(KEY_ORDEN_TAREAS, {
        valorPorDefecto: 'inteligente'
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

    /* [315A-1] Prioridad con orden manual como desempate.
     * Cuando dos tareas tienen la misma prioridad, se usa el campo 'orden'
     * (establecido por drag & drop) para mantener el orden personalizado.
     * Sin orden → fecha como fallback. */
    const compararPorPrioridad = (a: Tarea, b: Tarea) => {
        const pA = PESO_PRIORIDAD[a.prioridad || 'default'];
        const pB = PESO_PRIORIDAD[b.prioridad || 'default'];

        if (pB !== pA) return pB - pA;

        /* [207A-1] Desempatar por orden manual si ambos tienen.
         * Esto permite drag reorder dentro del mismo grupo de prioridad. */
        if (a.orden !== undefined && b.orden !== undefined && a.orden !== b.orden) {
            return a.orden - b.orden;
        }

        return compararPorFecha(a, b);
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
        esOrdenManual: modoActual === 'manual' || modoActual === 'prioridad',
        modosDisponibles: MODOS_ORDEN_TAREAS
    };
}
