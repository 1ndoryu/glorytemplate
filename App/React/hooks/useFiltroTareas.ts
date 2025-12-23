/*
 * Hook para gestionar el filtrado de tareas
 * Permite filtrar por: tareas sueltas, por proyecto especifico, todas, o mis asignadas
 * Persiste la preferencia del usuario
 */

import {useMemo, useCallback} from 'react';
import type {Tarea, Proyecto} from '../types/dashboard';
import {useLocalStorage} from './useLocalStorage';

export type TipoFiltroTareas = 'sueltas' | 'todas' | 'proyecto' | 'asignadas';

export interface EstadoFiltro {
    tipo: TipoFiltroTareas;
    proyectoId?: number; // Solo si tipo === 'proyecto'
}

/* Identificador para localStorage */
const KEY_FILTRO = 'glory_filtro_tareas';

/* Obtener ID del usuario actual desde la configuración global */
function obtenerUsuarioActualId(): number | null {
    const gloryData = (window as unknown as {gloryDashboard?: {userId?: number}}).gloryDashboard;
    return gloryData?.userId ?? null;
}

export function useFiltroTareas(tareas: Tarea[], proyectos: Proyecto[] = []) {
    /* Estado persistido del filtro directamente con localStorage */
    const {valor: filtroActual, setValor: setFiltroActual} = useLocalStorage<EstadoFiltro>(KEY_FILTRO, {
        valorPorDefecto: {tipo: 'sueltas'}
    });

    /* Actualizar filtro */
    const cambiarFiltro = useCallback(
        (nuevoFiltro: EstadoFiltro) => {
            setFiltroActual(nuevoFiltro);
        },
        [setFiltroActual]
    );

    /* Tareas filtradas segun la seleccion */
    const tareasFiltradas = useMemo(() => {
        const usuarioId = obtenerUsuarioActualId();

        switch (filtroActual.tipo) {
            case 'todas':
                return tareas;

            case 'proyecto':
                if (!filtroActual.proyectoId) return tareas;
                return tareas.filter(t => t.proyectoId === filtroActual.proyectoId);

            case 'asignadas':
                if (!usuarioId) return tareas;
                return tareas.filter(t => t.asignadoA === usuarioId);

            case 'sueltas':
            default:
                // Tareas que no tienen proyecto asignado
                return tareas.filter(t => !t.proyectoId);
        }
    }, [tareas, filtroActual]);

    /* Contar tareas asignadas al usuario */
    const contarAsignadas = useMemo(() => {
        const usuarioId = obtenerUsuarioActualId();
        if (!usuarioId) return 0;
        return tareas.filter(t => t.asignadoA === usuarioId && !t.completado).length;
    }, [tareas]);

    /* Obtener informacion del filtro actual para display */
    const infoFiltro = useMemo(() => {
        if (filtroActual.tipo === 'todas') {
            return {etiqueta: 'Todas las tareas', descripcion: 'Mostrando tareas de todos los proyectos'};
        }

        if (filtroActual.tipo === 'proyecto') {
            const proyecto = proyectos.find(p => p.id === filtroActual.proyectoId);
            return {
                etiqueta: proyecto ? `Proyecto: ${proyecto.nombre}` : 'Proyecto no encontrado',
                descripcion: proyecto?.descripcion || ''
            };
        }

        if (filtroActual.tipo === 'asignadas') {
            return {etiqueta: 'Mis asignadas', descripcion: 'Tareas asignadas a mí'};
        }

        return {etiqueta: 'Tareas sueltas', descripcion: 'Tareas sin proyecto asignado'};
    }, [filtroActual, proyectos]);

    return {
        filtroActual,
        cambiarFiltro,
        tareasFiltradas,
        infoFiltro,
        contarAsignadas
    };
}
