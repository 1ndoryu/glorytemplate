/* sentinel-disable-file limite-lineas — hook cohesivo de DnD: arrastre, preview, colision, cascada y conflictos estan intrínsecamente acoplados */
/**
 * useCalendarioDragDrop
 *
 * Hook para lógica de Drag & Drop del CalendarioSemanal.
 * Maneja estado de arrastre, preview de drop, notificaciones UI
 * y resolución de conflictos de movimiento.
 */

import {useState, useCallback} from 'react';
import type {DragStartEvent, DragEndEvent, DragMoveEvent, CollisionDetection, DroppableContainer, Collision} from '@dnd-kit/core';
import {pointerWithin, rectIntersection, closestCenter} from '@dnd-kit/core';
import type {Clase, DiaSemana} from '../types';
import {CALENDARIO_CONFIG} from '../constants/cap-constants';
import {validarMovimiento, resolverDesplazamientoCascada, horaAMinutos, encontrarHorarioDisponibleMasCercano} from '../utils/collisionUtils';

/* Parsea fecha YYYY-MM-DD como local (no UTC) */
function parsearFechaLocal(fechaStr: string): Date {
    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
}

interface UseCalendarioDragDropParams {
    clasesPorDia: Record<DiaSemana, Clase[]>;
    onMoverClase?: (claseId: number, nuevaFecha: string, horaInicio?: string, horaFin?: string) => Promise<void>;
    onMoverMultiplesClases?: (cambios: {clase: Clase; nuevoInicio: string; nuevoFin: string; nuevaFecha?: string}[]) => Promise<void>;
}

export function useCalendarioDragDrop({clasesPorDia, onMoverClase, onMoverMultiplesClases}: UseCalendarioDragDropParams) {
    const [claseArrastrada, setClaseArrastrada] = useState<Clase | null>(null);
    const [previewDrop, setPreviewDrop] = useState<{fecha: string; top: number; height: number} | null>(null);
    const [notificaciones, setNotificaciones] = useState<{id: string; mensaje: string}[]>([]);
    const [conflictoData, setConflictoData] = useState<{
        claseMoviendo: Clase;
        claseExistente: Clase;
        nuevaHoraInicio: string;
        nuevaHoraFin: string;
        fechaDestino: string;
    } | null>(null);

    /* Mostrar notificación temporal (toast) */
    const notificarMovimiento = useCallback((mensaje: string) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setNotificaciones(prev => [...prev, {id, mensaje}]);
        window.setTimeout(() => {
            setNotificaciones(prev => prev.filter(item => item.id !== id));
        }, 3200);
    }, []);

    /*
     * Estrategia de detección de colisiones para DnD.
     * Prioriza columnas de día sobre otros droppables.
     */
    const collisionDetection: CollisionDetection = useCallback((args: Parameters<CollisionDetection>[0]) => {
        const obtenerData = (id: string | number) =>
            args.droppableContainers.find((container: DroppableContainer) => container.id === id)?.data?.current as {type?: string} | undefined;

        const pointerCollisions = pointerWithin(args);
        const baseCollisions = pointerCollisions.length ? pointerCollisions : rectIntersection(args);
        const soloDias = baseCollisions.filter((collision: Collision) => obtenerData(collision.id)?.type === 'dia');

        if (soloDias.length > 0) return soloDias;
        return closestCenter(args).filter((collision: Collision) => obtenerData(collision.id)?.type === 'dia');
    }, []);

    /* Inicio de arrastre: guardar referencia a la clase */
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const claseData = event.active.data.current?.clase as Clase | undefined;
        if (claseData) setClaseArrastrada(claseData);
    }, []);

    /* Durante el arrastre: calcular preview de posición */
    const handleDragMove = useCallback((event: DragMoveEvent) => {
        const {active, over, delta} = event;
        const claseData = active.data.current?.clase as Clase | undefined;

        if (!claseData || claseData.bloqueada) {
            setPreviewDrop(null);
            return;
        }

        const fechaDestino = over?.data.current?.fecha as string | undefined;
        if (!fechaDestino) {
            setPreviewDrop(null);
            return;
        }

        const minutosOriginales = horaAMinutos(claseData.horaInicio) - CALENDARIO_CONFIG.HORA_INICIO_DIA * 60;
        const topOriginal = Math.max(0, minutosOriginales * CALENDARIO_CONFIG.PIXELS_POR_MINUTO);
        const duracionMinutos = horaAMinutos(claseData.horaFin) - horaAMinutos(claseData.horaInicio);
        const altura = Math.max(CALENDARIO_CONFIG.ALTO_MINIMO_CLASE, duracionMinutos * CALENDARIO_CONFIG.PIXELS_POR_MINUTO - 2);
        const nuevoTopRaw = Math.max(0, Math.min(topOriginal + delta.y, CALENDARIO_CONFIG.ALTURA_TOTAL_COLUMNA - altura));

        const fechaObj = parsearFechaLocal(fechaDestino);
        const diaIndices = {1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes'} as const;
        const diaKey = diaIndices[fechaObj.getDay() as keyof typeof diaIndices];

        if (!diaKey) {
            setPreviewDrop(null);
            return;
        }

        const clasesDestino = clasesPorDia[diaKey];
        const validacion = validarMovimiento(nuevoTopRaw, claseData, clasesDestino);
        const minutosInicio = horaAMinutos(validacion.nuevaHoraInicio) - CALENDARIO_CONFIG.HORA_INICIO_DIA * 60;
        const topSnap = Math.max(0, Math.min(minutosInicio * CALENDARIO_CONFIG.PIXELS_POR_MINUTO, CALENDARIO_CONFIG.ALTURA_TOTAL_COLUMNA - altura));

        setPreviewDrop({fecha: fechaDestino, top: topSnap, height: altura});
    }, [clasesPorDia]);

    /* Fin de arrastre: validar y ejecutar movimiento */
    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const {active, over, delta} = event;
        setClaseArrastrada(null);
        setPreviewDrop(null);

        if (!over || !onMoverClase) {
            notificarMovimiento('No se pudo mover la clase. Suelta dentro del calendario.');
            return;
        }

        const claseData = active.data.current?.clase as Clase | undefined;
        if (!claseData) return;

        const fechaDestino = over.data.current?.fecha as string | undefined;
        if (!fechaDestino) {
            notificarMovimiento('No se pudo mover la clase. Suelta dentro del día destino.');
            return;
        }

        if (claseData.bloqueada) {
            notificarMovimiento('La clase está bloqueada y no se puede mover.');
            return;
        }

        const minutosOriginales = horaAMinutos(claseData.horaInicio) - CALENDARIO_CONFIG.HORA_INICIO_DIA * 60;
        const topOriginal = Math.max(0, minutosOriginales * CALENDARIO_CONFIG.PIXELS_POR_MINUTO);
        const nuevoTop = Math.max(0, topOriginal + delta.y);

        const fechaObj = parsearFechaLocal(fechaDestino);
        const diaIndices = {1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes'} as const;
        const diaKey = diaIndices[fechaObj.getDay() as keyof typeof diaIndices];
        if (!diaKey) return;

        const clasesDestino = clasesPorDia[diaKey];
        const validacion = validarMovimiento(nuevoTop, claseData, clasesDestino);

        if (validacion.valido) {
            const mismaFecha = fechaDestino === claseData.fecha;
            const mismaHora = validacion.nuevaHoraInicio === claseData.horaInicio && validacion.nuevaHoraFin === claseData.horaFin;
            if (mismaFecha && mismaHora) return;
            await onMoverClase(claseData.id, fechaDestino, validacion.nuevaHoraInicio, validacion.nuevaHoraFin);
        } else if (validacion.conflicto) {
            setConflictoData({
                claseMoviendo: claseData,
                claseExistente: validacion.conflicto.clase,
                nuevaHoraInicio: validacion.nuevaHoraInicio,
                nuevaHoraFin: validacion.nuevaHoraFin,
                fechaDestino
            });
        } else {
            notificarMovimiento('No se pudo mover la clase a esa hora.');
        }
    }, [onMoverClase, clasesPorDia, notificarMovimiento]);

    /* Cancelar arrastre: limpiar estado */
    const handleDragCancel = useCallback(() => {
        setClaseArrastrada(null);
        setPreviewDrop(null);
    }, []);

    /* Mover clase al horario disponible más cercano */
    const moverHorarioCercano = useCallback(async () => {
        if (!conflictoData || !onMoverClase) return;

        const fechaObj = parsearFechaLocal(conflictoData.fechaDestino);
        const diaIndices = {1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes'} as const;
        const diaKey = diaIndices[fechaObj.getDay() as keyof typeof diaIndices];
        if (!diaKey) return;

        const clasesDestino = clasesPorDia[diaKey];
        const horario = encontrarHorarioDisponibleMasCercano(
            conflictoData.nuevaHoraInicio, conflictoData.nuevaHoraFin, clasesDestino, conflictoData.claseMoviendo.id
        );

        if (!horario) {
            notificarMovimiento('No hay un horario disponible cercano para mover la clase.');
            setConflictoData(null);
            return;
        }

        setConflictoData(null);
        await onMoverClase(conflictoData.claseMoviendo.id, conflictoData.fechaDestino, horario.horaInicio, horario.horaFin);
    }, [conflictoData, clasesPorDia, onMoverClase, notificarMovimiento]);

    /* Cancelar conflicto: limpiar datos */
    const cancelarConflicto = useCallback(() => {
        setConflictoData(null);
    }, []);

    /* Resolver conflicto desplazando clases en cascada (Push) */
    const resolverConflicto = useCallback(async () => {
        if (!conflictoData || !onMoverMultiplesClases) return;

        const fechaObj = parsearFechaLocal(conflictoData.fechaDestino);
        const diaIndices = {1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes'} as const;
        const diaKey = diaIndices[fechaObj.getDay() as keyof typeof diaIndices];
        if (!diaKey) return;

        const clasesDestino = clasesPorDia[diaKey];
        const cambios = resolverDesplazamientoCascada(
            conflictoData.claseMoviendo, conflictoData.nuevaHoraInicio, conflictoData.nuevaHoraFin, clasesDestino
        );

        if (!cambios) {
            notificarMovimiento('No se puede desplazar porque hay clases bloqueadas en el camino. Se buscará un horario alternativo.');
            moverHorarioCercano();
            return;
        }

        const cambiosConFecha = cambios.map(c => ({...c, nuevaFecha: conflictoData.fechaDestino}));
        setConflictoData(null);
        await onMoverMultiplesClases(cambiosConFecha);
    }, [conflictoData, onMoverMultiplesClases, clasesPorDia, notificarMovimiento, moverHorarioCercano]);

    return {
        claseArrastrada,
        previewDrop,
        notificaciones,
        conflictoData,
        collisionDetection,
        handleDragStart,
        handleDragMove,
        handleDragEnd,
        handleDragCancel,
        moverHorarioCercano,
        cancelarConflicto,
        resolverConflicto,
    };
}
