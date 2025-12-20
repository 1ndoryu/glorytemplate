/*
 * Validadores para Datos del Dashboard
 * Funciones para validar estructura de datos desde localStorage o API
 * Responsabilidad unica: verificar integridad de datos
 */

import type {Habito, Tarea} from '../types/dashboard';

/*
 * Valida que un valor sea un array de habitos con estructura correcta
 * Verifica campos obligatorios y tipos
 */
export function validarHabitos(valor: unknown): valor is Habito[] {
    if (!Array.isArray(valor)) return false;

    return valor.every(h => {
        if (typeof h !== 'object' || h === null) return false;

        const habito = h as Record<string, unknown>;

        return typeof habito.id === 'number' && typeof habito.nombre === 'string' && ['Alta', 'Media', 'Baja'].includes(habito.importancia as string) && typeof habito.diasInactividad === 'number' && typeof habito.racha === 'number' && Array.isArray(habito.tags);
    });
}

/*
 * Valida que un valor sea un array de tareas con estructura correcta
 * Verifica campos obligatorios: id, texto, completado
 */
export function validarTareas(valor: unknown): valor is Tarea[] {
    if (!Array.isArray(valor)) return false;

    return valor.every(t => {
        if (typeof t !== 'object' || t === null) return false;

        const tarea = t as Record<string, unknown>;

        return typeof tarea.id === 'number' && typeof tarea.texto === 'string' && typeof tarea.completado === 'boolean';
    });
}

/*
 * Valida que un valor sea una cadena de texto (notas)
 */
export function validarNotas(valor: unknown): valor is string {
    return typeof valor === 'string';
}

/*
 * Valida que un valor sea un array de proyectos con estructura correcta
 */
import type {Proyecto} from '../types/dashboard';

export function validarProyectos(valor: unknown): valor is Proyecto[] {
    if (!Array.isArray(valor)) return false;

    return valor.every(p => {
        if (typeof p !== 'object' || p === null) return false;

        const proyecto = p as Record<string, unknown>;

        return typeof proyecto.id === 'number' && typeof proyecto.nombre === 'string' && typeof proyecto.estado === 'string';
    });
}
