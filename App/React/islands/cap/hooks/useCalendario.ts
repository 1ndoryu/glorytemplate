/**
 * Hook useCalendario — Compositor
 *
 * Orquesta los sub-hooks del calendario CAP.
 * Cada sub-hook gestiona un dominio:
 * - Navegación: cambiar semana activa
 * - Clases: cargar/bloquear clases
 * - Generación: crear calendario con conflictos
 * - Edición: modificar clases individuales
 * - Movimiento: drag & drop
 * - Eliminación: borrar clases/semana
 *
 * Split de 792 líneas a ~90 líneas (8.3 del plan anti-hardcode).
 * Los sub-hooks están en ./calendario/
 */

import {useState, useCallback} from 'react';
import type {Clase} from '../types';
import {getLunesDeSemana, getFechasSemana} from '../constants';
import {
    useCalendarioNavegacion,
    useCalendarioClases,
    useCalendarioGeneracion,
    useCalendarioEdicion,
    useCalendarioMovimiento,
    useCalendarioEliminacion
} from './calendario';
import type {EstadoBase} from './calendario';

export function useCalendario() {
    /* ── Estado compartido (base) ── */
    const [clases, setClases] = useState<Clase[]>([]);
    const [semanaActual, setSemanaActual] = useState(() => getLunesDeSemana(new Date()));
    const [error, setError] = useState<string | null>(null);
    const [historialClases, setHistorialClases] = useState<Clase[][]>([]);
    const puedeDeshacer = historialClases.length > 0;
    const fechasSemana = getFechasSemana(semanaActual);

    /* Nonce de WordPress para autenticar requests */
    const getNonce = useCallback((): string => {
        if (typeof window !== 'undefined' && (window as any).wpApiSettings?.nonce) {
            return (window as any).wpApiSettings.nonce;
        }
        return '';
    }, []);

    /* Formatear fecha para API sin conversión a UTC */
    const formatearFechaApi = useCallback((fecha: Date): string => {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    /* Normalizar hora a HH:MM */
    const normalizarHora = useCallback((hora?: string | null): string => {
        if (!hora) return '00:00';
        return hora.substring(0, 5);
    }, []);

    /* Guardar snapshot para undo (max 20) */
    const guardarSnapshot = useCallback(() => {
        setHistorialClases(prev => {
            try {
                const nuevo = [...prev, JSON.parse(JSON.stringify(clases))];
                if (nuevo.length > 20) nuevo.shift();
                return nuevo;
            } catch (err) {
                console.error('[useCalendario] Error al crear snapshot:', err);
                return prev;
            }
        });
    }, [clases]);

    const limpiarError = useCallback(() => setError(null), []);

    /* ── Objeto base compartido entre sub-hooks ── */
    const base: EstadoBase = {
        clases, setClases,
        semanaActual, setSemanaActual,
        error, setError,
        getNonce, formatearFechaApi, normalizarHora,
        guardarSnapshot,
        historialClases, setHistorialClases
    };

    /* ── Composición de sub-hooks ── */
    const navegacion = useCalendarioNavegacion({setSemanaActual});
    const clasesHook = useCalendarioClases({base});
    const generacion = useCalendarioGeneracion({base, cargarClases: clasesHook.cargarClases});
    const edicion = useCalendarioEdicion({base});
    const movimiento = useCalendarioMovimiento({base});
    const eliminacion = useCalendarioEliminacion({
        base,
        cerrarModalEdicion: edicion.cerrarModalEdicion,
        setGenerando: generacion.setGenerando
    });

    return {
        /* Estado */
        clases,
        semanaActual,
        fechasSemana,
        cargando: clasesHook.cargando,
        error,
        generando: generacion.generando,
        conflictos: generacion.conflictos,
        mostrarModalConflictos: generacion.mostrarModalConflictos,
        avisosGeneracion: generacion.avisosGeneracion,
        mostrarModalAvisos: generacion.mostrarModalAvisos,
        claseSeleccionada: edicion.claseSeleccionada,
        mostrarModalEdicion: edicion.mostrarModalEdicion,
        guardandoEdicion: edicion.guardandoEdicion,
        puedeDeshacer,
        moviendo: movimiento.moviendo,
        eliminando: eliminacion.eliminando,
        /* Acciones */
        ...navegacion,
        toggleBloqueoClase: clasesHook.toggleBloqueoClase,
        recargarClases: clasesHook.recargarClases,
        generarCalendario: generacion.generarCalendario,
        generarConExclusiones: generacion.generarConExclusiones,
        cerrarModalConflictos: generacion.cerrarModalConflictos,
        cerrarModalAvisos: generacion.cerrarModalAvisos,
        limpiarError,
        seleccionarClase: edicion.seleccionarClase,
        cerrarModalEdicion: edicion.cerrarModalEdicion,
        actualizarClase: edicion.actualizarClase,
        deshacer: edicion.deshacer,
        moverClase: movimiento.moverClase,
        moverMultiplesClases: movimiento.moverMultiplesClases,
        eliminarClase: eliminacion.eliminarClase,
        borrarSemanaCompleta: eliminacion.borrarSemanaCompleta
    };
}
