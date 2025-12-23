/*
 * useOpcionesDashboard
 * Hook para generar las opciones de los selectores del dashboard
 * Responsabilidad única: construir arrays de opciones para badges y filtros
 */

import {useMemo} from 'react';
import {Folder, CheckSquare, LayoutList, User} from 'lucide-react';
import type {Proyecto} from '../types/dashboard';
import {MODOS_ORDEN_TAREAS} from './useOrdenarTareas';

interface UseOpcionesDashboardProps {
    proyectos: Proyecto[];
    modosOrdenHabitos: Array<{id: string; etiqueta: string; descripcion: string}>;
    contarAsignadas: number;
}

interface UseOpcionesDashboardReturn {
    opcionesOrdenHabitos: Array<{id: string; etiqueta: string; descripcion: string}>;
    opcionesOrdenProyectos: Array<{id: string; etiqueta: string; descripcion: string}>;
    opcionesOrdenTareas: Array<{id: string; etiqueta: string; descripcion: string}>;
    opcionesFiltro: Array<{id: string; etiqueta: string; icono?: JSX.Element; descripcion: string}>;
}

export function useOpcionesDashboard({proyectos, modosOrdenHabitos, contarAsignadas}: UseOpcionesDashboardProps): UseOpcionesDashboardReturn {
    /* Opciones para SelectorBadge de hábitos */
    const opcionesOrdenHabitos = useMemo(
        () =>
            modosOrdenHabitos.map(m => ({
                id: m.id,
                etiqueta: m.etiqueta,
                descripcion: m.descripcion
            })),
        [modosOrdenHabitos]
    );

    /* Opciones para SelectorBadge de proyectos */
    const opcionesOrdenProyectos = useMemo(
        () => [
            {id: 'nombre', etiqueta: 'Nombre', descripcion: 'Alfabético'},
            {id: 'fecha', etiqueta: 'Fecha Límite', descripcion: 'Vencimiento'},
            {id: 'prioridad', etiqueta: 'Prioridad', descripcion: 'Importancia'}
        ],
        []
    );

    /* Opciones para SelectorBadge de tareas */
    const opcionesOrdenTareas = useMemo(
        () =>
            MODOS_ORDEN_TAREAS.map(m => ({
                id: m.id,
                etiqueta: m.etiqueta,
                descripcion: m.descripcion
            })),
        []
    );

    /* Opciones para el filtro de tareas */
    const opcionesFiltro = useMemo(
        () => [
            {
                id: 'sueltas',
                etiqueta: 'Tareas sueltas',
                icono: <CheckSquare size={12} />,
                descripcion: 'Sin proyecto'
            },
            {
                id: 'asignadas',
                etiqueta: 'Mis asignadas',
                icono: <User size={12} />,
                descripcion: contarAsignadas > 0 ? `${contarAsignadas} pendientes` : 'Ninguna'
            },
            {
                id: 'todas',
                etiqueta: 'Todas las tareas',
                icono: <LayoutList size={12} />,
                descripcion: 'Todas'
            },
            ...proyectos.map(p => ({
                id: `proyecto-${p.id}`,
                etiqueta: p.nombre,
                icono: <Folder size={12} />,
                descripcion: (p.descripcion || '').length > 25 ? (p.descripcion || '').substring(0, 25) + '...' : p.descripcion || ''
            }))
        ],
        [proyectos, contarAsignadas]
    );

    return {
        opcionesOrdenHabitos,
        opcionesOrdenProyectos,
        opcionesOrdenTareas,
        opcionesFiltro
    };
}
