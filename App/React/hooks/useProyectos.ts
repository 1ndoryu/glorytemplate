/*
 * useProyectos
 * Hook personalizado para la lógica de proyectos
 * Responsabilidad única: CRUD de proyectos
 */

import {useCallback} from 'react';
import type {Proyecto, NivelPrioridad} from '../types/dashboard';
import {obtenerFechaHoy} from '../utils/fecha';

export interface DatosNuevoProyecto {
    nombre: string;
    descripcion?: string;
    prioridad: NivelPrioridad;
    fechaLimite?: string;
}

export interface UseProyectosParams {
    proyectos: Proyecto[];
    setProyectos: React.Dispatch<React.SetStateAction<Proyecto[]>>;
    registrarAccion: (mensaje: string, deshacer: () => void) => void;
    mostrarMensaje?: (mensaje: string, tipo: 'exito' | 'error') => void;
}

export interface UseProyectosReturn {
    crearProyecto: (datos: DatosNuevoProyecto) => void;
    editarProyecto: (id: number, datos: Partial<Proyecto>) => void;
    eliminarProyecto: (id: number) => void;
    cambiarEstadoProyecto: (id: number, nuevoEstado: Proyecto['estado']) => void;
}

export function useProyectos({proyectos, setProyectos, registrarAccion, mostrarMensaje}: UseProyectosParams): UseProyectosReturn {
    /*
     * Crear un nuevo proyecto
     */
    const crearProyecto = useCallback(
        (datos: DatosNuevoProyecto) => {
            const hoy = obtenerFechaHoy();
            const nuevoId = Date.now();

            const nuevoProyecto: Proyecto = {
                id: nuevoId,
                nombre: datos.nombre,
                descripcion: datos.descripcion,
                prioridad: datos.prioridad,
                fechaLimite: datos.fechaLimite,
                estado: 'activo',
                fechaCreacion: hoy,
                progreso: 0
            };

            setProyectos(prev => [nuevoProyecto, ...prev]);
            mostrarMensaje?.(`Proyecto "${datos.nombre}" creado`, 'exito');

            registrarAccion(`Proyecto creado`, () => {
                setProyectos(prev => prev.filter(p => p.id !== nuevoId));
            });
        },
        [setProyectos, registrarAccion, mostrarMensaje]
    );

    /*
     * Editar un proyecto existente
     */
    const editarProyecto = useCallback(
        (id: number, datos: Partial<Proyecto>) => {
            const proyectoAnterior = proyectos.find(p => p.id === id);
            if (!proyectoAnterior) return;

            setProyectos(prev =>
                prev.map(p => {
                    if (p.id !== id) return p;
                    return {...p, ...datos};
                })
            );

            registrarAccion(`Proyecto editado`, () => {
                setProyectos(prev => prev.map(p => (p.id === id ? proyectoAnterior : p)));
            });

            mostrarMensaje?.('Proyecto actualizado', 'exito');
        },
        [proyectos, setProyectos, registrarAccion, mostrarMensaje]
    );

    /*
     * Eliminar un proyecto
     */
    const eliminarProyecto = useCallback(
        (id: number) => {
            const proyectoEliminado = proyectos.find(p => p.id === id);
            if (!proyectoEliminado) return;

            const indiceOriginal = proyectos.findIndex(p => p.id === id);

            setProyectos(prev => prev.filter(p => p.id !== id));
            mostrarMensaje?.(`Proyecto "${proyectoEliminado.nombre}" eliminado`, 'exito');

            registrarAccion(`Proyecto eliminado`, () => {
                setProyectos(prev => {
                    const nuevaLista = [...prev];
                    nuevaLista.splice(indiceOriginal, 0, proyectoEliminado);
                    return nuevaLista;
                });
            });
        },
        [proyectos, setProyectos, registrarAccion, mostrarMensaje]
    );

    /*
     * Cambiar estado de proyecto (activo, pausado, completado)
     */
    const cambiarEstadoProyecto = useCallback(
        (id: number, nuevoEstado: Proyecto['estado']) => {
            const proyecto = proyectos.find(p => p.id === id);
            if (!proyecto) return;

            const estadoAnterior = proyecto.estado;
            if (estadoAnterior === nuevoEstado) return;

            const hoy = obtenerFechaHoy();

            setProyectos(prev =>
                prev.map(p => {
                    if (p.id !== id) return p;

                    const updates: Partial<Proyecto> = {estado: nuevoEstado};

                    if (nuevoEstado === 'completado') {
                        updates.fechaCompletado = hoy;
                        updates.progreso = 100;
                    } else if (estadoAnterior === 'completado') {
                        /* Reactivando proyecto: limpiar fecha de completado */
                        updates.fechaCompletado = undefined;
                    }

                    return {...p, ...updates};
                })
            );

            registrarAccion(`Estado cambiado a ${nuevoEstado}`, () => {
                setProyectos(prev =>
                    prev.map(p => {
                        if (p.id === id) return {...p, estado: estadoAnterior, fechaCompletado: proyecto.fechaCompletado, progreso: proyecto.progreso};
                        return p;
                    })
                );
            });
        },
        [proyectos, setProyectos, registrarAccion]
    );

    return {
        crearProyecto,
        editarProyecto,
        eliminarProyecto,
        cambiarEstadoProyecto
    };
}
