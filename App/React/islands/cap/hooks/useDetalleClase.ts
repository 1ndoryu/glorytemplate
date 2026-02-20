/**
 * useDetalleClase
 *
 * Hook para lógica del modal de detalle/edición de clase.
 * Maneja estado de edición de hora/asignatura, detección de cambios,
 * resolución de conflictos de horario y eliminación con doble confirmación.
 */

import {useState, useCallback, useMemo} from 'react';
import type {Clase, DiaSemana, AlumnoClase} from '../types';
import {getAsignaturaPorCodigo} from '../constants';
import {detectarColision, resolverDesplazamientoCascada, encontrarHorarioDisponibleMasCercano} from '../utils/collisionUtils';

export interface CambiosClase {
    horaInicio?: string;
    horaFin?: string;
    asignaturaId?: number;
}

/* Convierte hora HH:MM a minutos totales desde medianoche */
function horaAMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
}

/* Convierte minutos totales a formato HH:MM */
function minutosAHora(minutos: number): string {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/* Quita segundos de una hora. Ej: "10:00:00" -> "10:00" */
function formatearHora(hora: string | undefined | null): string {
    if (!hora) return '08:00';
    return hora.substring(0, 5);
}

interface UseDetalleClaseParams {
    clase: Clase | null;
    onGuardar: (claseId: number, cambios: CambiosClase) => Promise<void>;
    onToggleBloqueo: (claseId: number) => void;
    onCerrar: () => void;
    onMoverMultiplesClases?: (cambios: {clase: Clase; nuevoInicio: string; nuevoFin: string; nuevaFecha?: string}[]) => Promise<void>;
    clasesPorDia?: Record<DiaSemana, Clase[]>;
    onEliminar?: (claseId: number, forzar: boolean) => Promise<void>;
}

export function useDetalleClase({clase, onGuardar, onToggleBloqueo, onCerrar, onMoverMultiplesClases, clasesPorDia, onEliminar}: UseDetalleClaseParams) {
    /* Obtener ID de asignatura inicial */
    const obtenerAsignaturaIdInicial = (): number => {
        if (!clase) return 1;
        if (typeof clase.asignaturaId === 'number') return clase.asignaturaId;
        return getAsignaturaPorCodigo(String(clase.asignaturaId))?.id || 1;
    };

    /* Duración original de la clase en minutos (para recalcular horaFin al cambiar horaInicio) */
    const duracionOriginalMinutos = useMemo(() => {
        if (!clase) return 60;
        const inicio = horaAMinutos(formatearHora(clase.horaInicio));
        const fin = horaAMinutos(formatearHora(clase.horaFin));
        return fin - inicio;
    }, [clase]);

    /* Estado local de edición: se reinicia con la key del padre al cambiar de clase */
    const [horaInicio, setHoraInicio] = useState(() => formatearHora(clase?.horaInicio));
    const [horaFin, setHoraFin] = useState(() => formatearHora(clase?.horaFin));
    const [asignaturaId, setAsignaturaId] = useState<number>(obtenerAsignaturaIdInicial);
    const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
    const [conflictoData, setConflictoData] = useState<{
        claseMoviendo: Clase;
        claseExistente: Clase;
        nuevaHoraInicio: string;
        nuevaHoraFin: string;
    } | null>(null);

    /* Cambiar hora de inicio recalculando hora fin automáticamente */
    const handleCambioHoraInicio = useCallback((nuevaHoraInicio: string) => {
        setHoraInicio(nuevaHoraInicio);
        setConflictoData(null);

        const minutosInicio = horaAMinutos(nuevaHoraInicio);
        const minutosFin = minutosInicio + duracionOriginalMinutos;
        const minutosFinLimitados = Math.min(minutosFin, 23 * 60);
        setHoraFin(minutosAHora(minutosFinLimitados));
    }, [duracionOriginalMinutos]);

    /* Detectar si hay cambios respecto a los valores originales */
    const hayCambios = useMemo(() => {
        if (!clase) return false;
        const horaInicioOriginal = formatearHora(clase.horaInicio);
        const horaFinOriginal = formatearHora(clase.horaFin);
        const asigOriginal = obtenerAsignaturaIdInicial();
        return horaInicio !== horaInicioOriginal || horaFin !== horaFinOriginal || asignaturaId !== asigOriginal;
    }, [clase, horaInicio, horaFin, asignaturaId]);

    /* Alumnos asignados a la clase (vienen precargados desde la API) */
    const alumnosClase: AlumnoClase[] = clase?.alumnosData || [];

    /* Obtener clases del mismo día para validar conflictos */
    const obtenerClasesDiaActual = useCallback((): Clase[] => {
        if (!clase || !clasesPorDia) return [];
        const fechaClase = new Date(`${clase.fecha}T00:00:00`);
        const diaIndices: Record<number, DiaSemana> = {1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes'};
        const diaKey = diaIndices[fechaClase.getDay()];
        return diaKey ? clasesPorDia[diaKey] || [] : [];
    }, [clase, clasesPorDia]);

    /* Guardar cambios validando conflictos de horario */
    const handleGuardar = useCallback(async () => {
        if (!clase || !hayCambios) return;

        const cambios: CambiosClase = {};
        const horaInicioOriginal = formatearHora(clase.horaInicio);
        const horaFinOriginal = formatearHora(clase.horaFin);
        const cambiaHorario = horaInicio !== horaInicioOriginal || horaFin !== horaFinOriginal;

        if (cambiaHorario) {
            const clasesDia = obtenerClasesDiaActual();
            const conflicto = detectarColision(horaInicio, horaFin, clasesDia, clase.id);
            if (conflicto) {
                setConflictoData({claseMoviendo: clase, claseExistente: conflicto, nuevaHoraInicio: horaInicio, nuevaHoraFin: horaFin});
                return;
            }
        }

        if (horaInicio !== horaInicioOriginal) cambios.horaInicio = horaInicio;
        if (horaFin !== horaFinOriginal) cambios.horaFin = horaFin;

        const asigOriginal = typeof clase.asignaturaId === 'number'
            ? clase.asignaturaId
            : getAsignaturaPorCodigo(String(clase.asignaturaId))?.id || 1;
        if (asignaturaId !== asigOriginal) cambios.asignaturaId = asignaturaId;

        await onGuardar(clase.id, cambios);
    }, [clase, hayCambios, horaInicio, horaFin, asignaturaId, obtenerClasesDiaActual, onGuardar]);

    /* Toggle bloqueo de la clase */
    const handleBloqueo = useCallback(() => {
        if (clase) onToggleBloqueo(clase.id);
    }, [clase, onToggleBloqueo]);

    /* Resolver conflicto desplazando clases en cascada */
    const handleDesplazarClases = useCallback(async () => {
        if (!clase || !conflictoData || !onMoverMultiplesClases) return;

        const clasesDia = obtenerClasesDiaActual();
        const cambios = resolverDesplazamientoCascada(clase, conflictoData.nuevaHoraInicio, conflictoData.nuevaHoraFin, clasesDia);

        if (!cambios) {
            setConflictoData(null);
            /* Intentar horario cercano como fallback */
            handleMoverCercano();
            return;
        }

        setConflictoData(null);
        await onMoverMultiplesClases(cambios);
        onCerrar();
    }, [clase, conflictoData, obtenerClasesDiaActual, onMoverMultiplesClases, onCerrar]);

    /* Resolver conflicto moviendo al horario disponible más cercano */
    const handleMoverCercano = useCallback(async () => {
        if (!clase || !conflictoData) return;

        const clasesDia = obtenerClasesDiaActual();
        const horario = encontrarHorarioDisponibleMasCercano(
            conflictoData.nuevaHoraInicio, conflictoData.nuevaHoraFin, clasesDia, clase.id
        );

        if (!horario) {
            setConflictoData(null);
            return;
        }

        setConflictoData(null);
        await onGuardar(clase.id, {horaInicio: horario.horaInicio, horaFin: horario.horaFin});
    }, [clase, conflictoData, obtenerClasesDiaActual, onGuardar]);

    /* Cerrar limpiando estado de conflicto */
    const handleCerrar = useCallback(() => {
        setConflictoData(null);
        onCerrar();
    }, [onCerrar]);

    /* Eliminar clase con doble confirmación */
    const handleEliminar = useCallback(async () => {
        if (!clase || !onEliminar) return;

        if (!confirmandoEliminar) {
            setConfirmandoEliminar(true);
            setTimeout(() => setConfirmandoEliminar(false), 3000);
            return;
        }

        await onEliminar(clase.id, clase.bloqueada);
    }, [clase, onEliminar, confirmandoEliminar]);

    return {
        horaInicio,
        horaFin,
        asignaturaId,
        setAsignaturaId,
        setHoraFin,
        confirmandoEliminar,
        conflictoData,
        setConflictoData,
        hayCambios,
        alumnosClase,
        duracionOriginalMinutos,
        handleCambioHoraInicio,
        handleGuardar,
        handleBloqueo,
        handleDesplazarClases,
        handleMoverCercano,
        handleCerrar,
        handleEliminar,
        formatearHora,
    };
}
