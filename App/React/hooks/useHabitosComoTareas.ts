/*
 * useHabitosComoTareas
 * Hook que convierte hábitos que "tocan hoy" en tareas virtuales para Ejecución
 * La urgencia se calcula automáticamente basada en días de inactividad
 */

import {useMemo} from 'react';
import type {Habito, TareaHabito, NivelUrgencia, NivelPrioridad} from '../types/dashboard';
import {tocaHoy} from '../utils/frecuenciaHabitos';
import {FRECUENCIA_POR_DEFECTO} from '../types/dashboard';
import {obtenerFechaHoy} from '../utils/fecha';

/*
 * Mapea importancia de hábito a prioridad de tarea
 */
const mapearImportanciaAPrioridad = (importancia: Habito['importancia']): NivelPrioridad => {
    const mapa: Record<Habito['importancia'], NivelPrioridad> = {
        Alta: 'alta',
        Media: 'media',
        Baja: 'baja'
    };
    return mapa[importancia];
};

/*
 * Calcula urgencia automática basada en días de inactividad
 * Mayor inactividad = mayor urgencia
 */
const calcularUrgenciaAutomatica = (diasInactividad: number, racha: number): NivelUrgencia => {
    /* Si tiene racha y pocos días sin hacer, es chill */
    if (racha > 0 && diasInactividad <= 1) {
        return 'chill';
    }

    /* Si lleva varios días sin hacer, aumenta la urgencia */
    if (diasInactividad >= 5) {
        return 'bloqueante';
    }
    if (diasInactividad >= 3) {
        return 'urgente';
    }
    if (diasInactividad >= 1) {
        return 'normal';
    }

    return 'chill';
};

/*
 * Genera un ID único negativo para tareas-hábito
 * Los IDs negativos evitan colisión con tareas reales
 */
const generarIdTareaHabito = (habitoId: number): number => {
    return -habitoId - 10000;
};

interface UseHabitosComoTareasParams {
    habitos: Habito[];
    mostrarHabitos: boolean;
    onToggleHabito: (habitoId: number) => void;
}

interface UseHabitosComoTareasReturn {
    tareasHabito: TareaHabito[];
    manejarToggleTareaHabito: (tareaId: number) => boolean;
}

export function useHabitosComoTareas({habitos, mostrarHabitos, onToggleHabito}: UseHabitosComoTareasParams): UseHabitosComoTareasReturn {
    const tareasHabito = useMemo<TareaHabito[]>(() => {
        if (!mostrarHabitos) return [];

        const hoy = obtenerFechaHoy();

        return habitos
            .filter(habito => {
                const frecuencia = habito.frecuencia || FRECUENCIA_POR_DEFECTO;
                /* Solo incluir hábitos que tocan hoy y no están completados hoy */
                const tocaHoyResult = tocaHoy(frecuencia, habito.ultimoCompletado);
                const completadoHoy = habito.ultimoCompletado === hoy;
                return tocaHoyResult && !completadoHoy;
            })
            .map(habito => {
                const urgenciaAutomatica = calcularUrgenciaAutomatica(habito.diasInactividad, habito.racha);

                const tareaHabito: TareaHabito = {
                    id: generarIdTareaHabito(habito.id),
                    texto: habito.nombre,
                    completado: false,
                    fechaCreacion: habito.fechaCreacion,
                    prioridad: mapearImportanciaAPrioridad(habito.importancia),
                    urgencia: urgenciaAutomatica,
                    /* Campos específicos de TareaHabito */
                    esHabito: true,
                    habitoId: habito.id,
                    habitoNombre: habito.nombre,
                    habitoRacha: habito.racha,
                    habitoImportancia: habito.importancia
                };

                return tareaHabito;
            });
    }, [habitos, mostrarHabitos]);

    /*
     * Maneja el toggle de una tarea-hábito
     * Retorna true si fue manejado (era una tarea-hábito), false si no
     */
    const manejarToggleTareaHabito = (tareaId: number): boolean => {
        /* Las tareas-hábito tienen IDs negativos */
        if (tareaId >= 0) return false;

        /* Encontrar el hábito correspondiente */
        const tareaHabito = tareasHabito.find(t => t.id === tareaId);
        if (!tareaHabito) return false;

        /* Llamar al toggle del hábito original */
        onToggleHabito(tareaHabito.habitoId);
        return true;
    };

    return {
        tareasHabito,
        manejarToggleTareaHabito
    };
}
