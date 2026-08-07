/**
 * Utilidades para dependencias condicionales
 * Evalua si una tarea, habito o subhabito puede marcarse como completado
 * en funcion de sus dependencias no cumplidas.
 */

import type {Habito, ReferenciaDependencia, Tarea} from '../types/dashboard';
import {fueCompletadoHoy} from './fecha';
import {tocaHoy} from './frecuenciaHabitos';

/**
 * Comprueba si una dependencia individual se considera cumplida.
 * Para habitos/subhabitos respeta la frecuencia: si no toca hoy se asume cumplida,
 * si toca hoy debe estar completado hoy.
 *
 * Modo estricto (por defecto): la dependencia debe estar cumplida en el periodo actual.
 * Modo suave: basta con que haya sido cumplida alguna vez en el pasado.
 */
export function esDependenciaCumplida(ref: ReferenciaDependencia, tareas: Tarea[], habitos: Habito[]): boolean {
    const modo = ref.modo || 'estricto';

    if (ref.tipo === 'tarea') {
        const tarea = tareas.find(t => t.id === ref.id);
        if (!tarea) return true;
        // Modo suave: la tarea debe estar completada actualmente
        if (modo === 'suave') return tarea.completado;
        return tarea.completado;
    }

    if (ref.tipo === 'habito') {
        const habito = habitos.find(h => h.id === ref.id);
        if (!habito) return true;

        if (fueCompletadoHoy(habito.ultimoCompletado, habito.historialCompletados)) {
            return true;
        }

        const frecuencia = habito.frecuencia || {tipo: 'diario'};
        const toca = tocaHoy(frecuencia, habito.ultimoCompletado);

        // Modo suave: si tiene historial de completados, consideramos cumplida aunque no sea hoy
        if (modo === 'suave' && (habito.historialCompletados?.length || habito.ultimoCompletado)) {
            return true;
        }

        return !toca;
    }

    if (ref.tipo === 'subhabito') {
        const habito = habitos.find(h => h.id === ref.padreId);
        if (!habito) return true;
        const subhabito = habito.subhabitos?.find(sh => sh.id === ref.id);
        if (!subhabito) return true;

        if (fueCompletadoHoy(subhabito.ultimoCompletado, subhabito.historialCompletados)) {
            return true;
        }

        const frecuencia = subhabito.frecuencia || habito.frecuencia || {tipo: 'diario'};
        const toca = tocaHoy(frecuencia, subhabito.ultimoCompletado);

        if (modo === 'suave' && (subhabito.historialCompletados?.length || subhabito.ultimoCompletado)) {
            return true;
        }

        return !toca;
    }

    return true;
}

/**
 * Verifica las dependencias de un elemento y retorna las que no estan cumplidas.
 */
export function verificarDependencias(
    elemento: {dependencias?: ReferenciaDependencia[]},
    tareas: Tarea[],
    habitos: Habito[]
): {bloqueado: boolean; bloqueantes: ReferenciaDependencia[]} {
    const dependencias = elemento.dependencias || [];
    const bloqueantes = dependencias.filter(dep => !esDependenciaCumplida(dep, tareas, habitos));

    return {
        bloqueado: bloqueantes.length > 0,
        bloqueantes
    };
}

/**
 * Obtiene el nombre descriptivo de una dependencia.
 * Si el elemento no existe, usa el nombre guardado en el snapshot.
 */
export function obtenerNombreDependencia(ref: ReferenciaDependencia, tareas: Tarea[], habitos: Habito[]): string {
    if (ref.tipo === 'tarea') {
        const tarea = tareas.find(t => t.id === ref.id);
        return tarea?.texto || ref.nombreSnapshot || 'Tarea eliminada';
    }

    if (ref.tipo === 'habito') {
        const habito = habitos.find(h => h.id === ref.id);
        return habito?.nombre || ref.nombreSnapshot || 'Habito eliminado';
    }

    if (ref.tipo === 'subhabito') {
        const habito = habitos.find(h => h.id === ref.padreId);
        const subhabito = habito?.subhabitos?.find(sh => sh.id === ref.id);
        return subhabito?.nombre || ref.nombreSnapshot || 'Subhabito eliminado';
    }

    return ref.nombreSnapshot || 'Elemento desconocido';
}

/**
 * Detecta si agregar nuevas dependencias crearia un ciclo.
 * Recibe el tipo e ID del elemento origen y las dependencias a evaluar.
 */
export function detectarCicloDependencias(
    tipoOrigen: 'tarea' | 'habito' | 'subhabito',
    idOrigen: number,
    padreIdOrigen: number | undefined,
    nuevasDependencias: ReferenciaDependencia[],
    tareas: Tarea[],
    habitos: Habito[]
): boolean {
    const origenKey = claveElemento(tipoOrigen, idOrigen, padreIdOrigen);
    const visitados = new Set<string>();

    function checkCiclo(deps: ReferenciaDependencia[]): boolean {
        for (const dep of deps) {
            const key = claveElemento(dep.tipo, dep.id, dep.padreId);

            if (key === origenKey) return true;
            if (visitados.has(key)) continue;
            visitados.add(key);

            const subDeps = obtenerDependenciasElemento(dep, tareas, habitos);
            if (subDeps.length > 0 && checkCiclo(subDeps)) {
                return true;
            }
        }
        return false;
    }

    return checkCiclo(nuevasDependencias);
}

function claveElemento(tipo: 'tarea' | 'habito' | 'subhabito', id: number, padreId?: number): string {
    if (tipo === 'subhabito') return `subhabito-${padreId}-${id}`;
    return `${tipo}-${id}`;
}

function obtenerDependenciasElemento(ref: ReferenciaDependencia, tareas: Tarea[], habitos: Habito[]): ReferenciaDependencia[] {
    if (ref.tipo === 'tarea') {
        return tareas.find(t => t.id === ref.id)?.dependencias || [];
    }

    if (ref.tipo === 'habito') {
        return habitos.find(h => h.id === ref.id)?.dependencias || [];
    }

    if (ref.tipo === 'subhabito') {
        const habito = habitos.find(h => h.id === ref.padreId);
        const subhabito = habito?.subhabitos?.find(sh => sh.id === ref.id);
        return subhabito?.dependencias || [];
    }

    return [];
}
