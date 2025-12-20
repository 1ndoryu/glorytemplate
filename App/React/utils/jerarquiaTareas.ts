/*
 * jerarquiaTareas
 * Utilidades para manejo de jerarquía de tareas (padre/subtareas)
 * Responsabilidad única: operaciones de árbol sobre tareas
 */

import type {Tarea} from '../types/dashboard';

/*
 * Obtener todas las subtareas directas de una tarea padre
 * Solo retorna hijos directos, no nietos (no hay más de 1 nivel)
 */
export function obtenerSubtareas(tareas: Tarea[], parentId: number): Tarea[] {
    return tareas.filter(t => t.parentId === parentId);
}

/*
 * Obtener la tarea padre de una subtarea
 * Retorna undefined si la tarea no tiene padre o no existe
 */
export function obtenerPadre(tareas: Tarea[], tareaId: number): Tarea | undefined {
    const tarea = tareas.find(t => t.id === tareaId);
    if (!tarea || !tarea.parentId) return undefined;
    return tareas.find(t => t.id === tarea.parentId);
}

/*
 * Verificar si una tarea tiene subtareas
 */
export function tieneSubtareas(tareas: Tarea[], tareaId: number): boolean {
    return tareas.some(t => t.parentId === tareaId);
}

/*
 * Contar subtareas de una tarea (total y completadas)
 */
export function contarSubtareas(tareas: Tarea[], tareaId: number): {total: number; completadas: number} {
    const subtareas = obtenerSubtareas(tareas, tareaId);
    return {
        total: subtareas.length,
        completadas: subtareas.filter(t => t.completado).length
    };
}

/*
 * Verificar si una tarea es descendiente de otra
 * Como solo hay 1 nivel de anidación, esto es equivalente a verificar parentId
 */
export function esDescendiente(tareas: Tarea[], posibleHijoId: number, posiblePadreId: number): boolean {
    const posibleHijo = tareas.find(t => t.id === posibleHijoId);
    if (!posibleHijo) return false;
    return posibleHijo.parentId === posiblePadreId;
}

/*
 * Verificar si una tarea es padre (tiene subtareas)
 */
export function esTareaPadre(tareas: Tarea[], tareaId: number): boolean {
    return tieneSubtareas(tareas, tareaId);
}

/*
 * Verificar si una tarea es subtarea
 */
export function esSubtarea(tarea: Tarea): boolean {
    return tarea.parentId !== undefined;
}

/*
 * Obtener todas las tareas principales (sin parentId)
 */
export function obtenerTareasPrincipales(tareas: Tarea[]): Tarea[] {
    return tareas.filter(t => !t.parentId);
}

/*
 * Obtener índice de una tarea en el array
 */
export function obtenerIndiceTarea(tareas: Tarea[], tareaId: number): number {
    return tareas.findIndex(t => t.id === tareaId);
}

/*
 * Obtener la tarea anterior en la lista (para indentación)
 * Retorna undefined si es la primera o no existe
 */
export function obtenerTareaAnterior(tareas: Tarea[], tareaId: number): Tarea | undefined {
    const indice = obtenerIndiceTarea(tareas, tareaId);
    if (indice <= 0) return undefined;
    return tareas[indice - 1];
}

/*
 * Validar si se puede convertir una tarea en subtarea de otra
 * Reglas:
 * - No puede ser subtarea de sí misma
 * - No puede ser subtarea de una de sus hijas
 * - El padre propuesto no puede ser ya una subtarea (máx 1 nivel)
 */
export function puedeSerSubtareaDe(tareas: Tarea[], tareaId: number, posiblePadreId: number): boolean {
    /* No puede ser subtarea de sí misma */
    if (tareaId === posiblePadreId) return false;

    /* El padre propuesto no puede ser una subtarea */
    const posiblePadre = tareas.find(t => t.id === posiblePadreId);
    if (!posiblePadre) return false;
    if (posiblePadre.parentId) return false;

    /* La tarea actual no puede ser padre del posible padre */
    if (esDescendiente(tareas, posiblePadreId, tareaId)) return false;

    return true;
}

/*
 * Mover una tarea junto con sus subtareas a una nueva posición
 * Retorna el nuevo array de tareas con la posición actualizada
 */
export function moverConHijos(tareas: Tarea[], tareaId: number, nuevaPosicion: number): Tarea[] {
    const tarea = tareas.find(t => t.id === tareaId);
    if (!tarea) return tareas;

    /* Obtener la tarea y sus subtareas */
    const subtareas = obtenerSubtareas(tareas, tareaId);
    const tareasAMover = [tarea, ...subtareas];
    const idsAMover = new Set(tareasAMover.map(t => t.id));

    /* Filtrar las tareas que no se mueven */
    const tareasRestantes = tareas.filter(t => !idsAMover.has(t.id));

    /* Insertar en la nueva posición */
    const resultado = [...tareasRestantes];
    const posicionAjustada = Math.min(nuevaPosicion, resultado.length);
    resultado.splice(posicionAjustada, 0, ...tareasAMover);

    return resultado;
}

/*
 * Calcular el nuevo parentId basado en la posición de drop y offset horizontal
 * Usado para drag & drop con gestos horizontales
 *
 * offsetX > umbralIndent: convertir en subtarea de la tarea de arriba
 * offsetX < -umbralIndent: convertir en tarea principal
 */
export interface CalculoParentResult {
    nuevoParentId: number | undefined;
    esValido: boolean;
    razon?: string;
}

export function calcularNuevoParent(tareas: Tarea[], tareaId: number, posicionDrop: number, offsetX: number, umbralIndent: number = 30): CalculoParentResult {
    const tarea = tareas.find(t => t.id === tareaId);
    if (!tarea) {
        return {nuevoParentId: undefined, esValido: false, razon: 'Tarea no encontrada'};
    }

    /* Si el offset es negativo (izquierda), convertir en tarea principal */
    if (offsetX < -umbralIndent) {
        return {nuevoParentId: undefined, esValido: true};
    }

    /* Si el offset es positivo (derecha), intentar convertir en subtarea */
    if (offsetX > umbralIndent) {
        /* Buscar la tarea que estaría arriba en la nueva posición */
        const tareasOrdenadas = tareas.filter(t => t.id !== tareaId);
        const tareaArriba = tareasOrdenadas[posicionDrop - 1];

        if (!tareaArriba) {
            return {nuevoParentId: undefined, esValido: true}; /* Primera posición, es principal */
        }

        /* Si la tarea de arriba es una subtarea, heredar su parentId */
        if (tareaArriba.parentId) {
            return {nuevoParentId: tareaArriba.parentId, esValido: true};
        }

        /* Verificar si puede ser subtarea de la tarea de arriba */
        if (puedeSerSubtareaDe(tareas, tareaId, tareaArriba.id)) {
            return {nuevoParentId: tareaArriba.id, esValido: true};
        }

        return {
            nuevoParentId: undefined,
            esValido: false,
            razon: 'No se puede anidar: máximo 1 nivel de profundidad'
        };
    }

    /* Sin offset significativo: mantener la estructura actual o heredar del contexto */
    const tareasOrdenadas = tareas.filter(t => t.id !== tareaId);
    const tareaArriba = tareasOrdenadas[posicionDrop - 1];

    if (!tareaArriba) {
        return {nuevoParentId: undefined, esValido: true};
    }

    /* Si se suelta entre subtareas, heredar el parentId */
    if (tareaArriba.parentId) {
        return {nuevoParentId: tareaArriba.parentId, esValido: true};
    }

    /* Si se suelta después de una tarea principal, mantener como principal */
    return {nuevoParentId: undefined, esValido: true};
}

/*
 * Ordenar tareas manteniendo la jerarquía visual
 * Las subtareas siempre aparecen inmediatamente después de su padre
 */
export function ordenarConJerarquia(tareas: Tarea[]): Tarea[] {
    const resultado: Tarea[] = [];
    const principales = obtenerTareasPrincipales(tareas);

    for (const principal of principales) {
        resultado.push(principal);
        const subs = obtenerSubtareas(tareas, principal.id);
        resultado.push(...subs);
    }

    return resultado;
}

/*
 * Asignar campo orden a todas las tareas basado en su posición actual
 * Útil para persistencia consistente
 */
export function asignarOrden(tareas: Tarea[]): Tarea[] {
    return tareas.map((tarea, indice) => ({
        ...tarea,
        orden: indice
    }));
}

/*
 * Detectar el contexto de drop para una tarea
 * Usado para Fase C: conversión automática de jerarquía al soltar entre subtareas
 *
 * Reglas:
 * - Si la tarea de arriba Y abajo son subtareas del mismo padre -> heredar parentId
 * - Si la tarea de arriba es subtarea y la de abajo es principal -> mantener como principal
 * - Si la tarea de arriba es principal -> mantener como principal
 * - Primera posición -> siempre principal
 */
export interface ContextoDropResult {
    parentIdSugerido: number | undefined;
    esContextoSubtareas: boolean;
    descripcion: string;
}

export function detectarContextoDrop(tareasOrdenadas: Tarea[], posicionDrop: number, tareaArrastradaId: number): ContextoDropResult {
    /* Filtrar la tarea arrastrada de la lista */
    const tareasVisibles = tareasOrdenadas.filter(t => t.id !== tareaArrastradaId);

    /* Obtener tareas adyacentes */
    const tareaArriba = tareasVisibles[posicionDrop - 1];
    const tareaAbajo = tareasVisibles[posicionDrop];

    /* Primera posición: siempre principal */
    if (!tareaArriba) {
        return {
            parentIdSugerido: undefined,
            esContextoSubtareas: false,
            descripcion: 'Primera posición'
        };
    }

    /* Si la tarea de arriba es subtarea */
    if (tareaArriba.parentId) {
        /* Verificar si la de abajo también es subtarea del mismo padre */
        const mismoContexto = tareaAbajo?.parentId === tareaArriba.parentId;

        if (mismoContexto || !tareaAbajo || tareaAbajo.parentId) {
            /* La tarea se queda como subtarea del mismo padre */
            return {
                parentIdSugerido: tareaArriba.parentId,
                esContextoSubtareas: true,
                descripcion: `Soltar como subtarea del padre ${tareaArriba.parentId}`
            };
        }
    }

    /* Si la tarea de arriba es principal, queda como principal */
    return {
        parentIdSugerido: undefined,
        esContextoSubtareas: false,
        descripcion: 'Soltar como tarea principal'
    };
}
