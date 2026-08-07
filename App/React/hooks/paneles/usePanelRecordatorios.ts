/*
 * usePanelRecordatorios
 * Hook para la lógica del panel de Recordatorios (SRP)
 * Gestiona: intervalos, mostrar aleatorio, undo de eliminación
 */

import {useState, useEffect, useCallback, useRef} from 'react';
import {useRecordatoriosStore, useRecordatorioActual} from '../../stores/recordatoriosStore';
import {useAlertas} from '../useAlertas';
import type {IntervaloRecordatorio, Recordatorio} from '../../types/recordatorios';
import type {Adjunto} from '../../types/dashboard';

const INTERVALOS_MS: Record<IntervaloRecordatorio, number> = {
    minuto: 60_000,
    hora: 3_600_000,
    dia: 86_400_000
};

const DURACION_UNDO = 5000;

export function usePanelRecordatorios() {
    const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
    const [modalListaAbierto, setModalListaAbierto] = useState(false);
    /* Estado para undo: almacena el último recordatorio eliminado con su timer */
    const [eliminadoPendiente, setEliminadoPendiente] = useState<Recordatorio | null>(null);
    const [undoRestante, setUndoRestante] = useState(0);
    const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const recordatorioActual = useRecordatorioActual();
    const recordatorios = useRecordatoriosStore(s => s.recordatorios);
    const config = useRecordatoriosStore(s => s.config);
    const ultimoCambio = useRecordatoriosStore(s => s.ultimoCambio);
    const mostrarSiguiente = useRecordatoriosStore(s => s.mostrarSiguiente);
    const eliminar = useRecordatoriosStore(s => s.eliminar);
    const restaurar = useRecordatoriosStore(s => s.restaurar);
    const cambiarIntervaloMs = useRecordatoriosStore(s => s.cambiarIntervaloMs);
    const cambiarTamanoFuente = useRecordatoriosStore(s => s.cambiarTamanoFuente);
    const actualizarConfig = useRecordatoriosStore(s => s.actualizarConfig);
    const agregar = useRecordatoriosStore(s => s.agregar);
    const agregarVarios = useRecordatoriosStore(s => s.agregarVarios);

    const {mostrarExito, confirmar} = useAlertas();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /* Motor de intervalos: usa intervaloMs (preciso) o fallback al preset */
    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (recordatorios.length <= 1) return;

        const ms = config.intervaloMs ?? INTERVALOS_MS[config.intervalo];
        intervalRef.current = setInterval(() => {
            mostrarSiguiente();
        }, ms);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [config.intervaloMs, config.intervalo, recordatorios.length, mostrarSiguiente]);

    /* Limpiar timers de undo al desmontar */
    useEffect(() => () => {
        if (undoTimerRef.current) clearInterval(undoTimerRef.current);
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }, []);

    const iniciarUndoTimer = useCallback(() => {
        /* Limpiar timers previos */
        if (undoTimerRef.current) clearInterval(undoTimerRef.current);
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

        setUndoRestante(DURACION_UNDO);

        /* Actualizar cuenta regresiva cada 100ms */
        const inicio = Date.now();
        undoTimerRef.current = setInterval(() => {
            const restante = Math.max(0, DURACION_UNDO - (Date.now() - inicio));
            setUndoRestante(restante);
        }, 100);

        /* Descartar después del tiempo */
        undoTimeoutRef.current = setTimeout(() => {
            if (undoTimerRef.current) clearInterval(undoTimerRef.current);
            undoTimerRef.current = null;
            setEliminadoPendiente(null);
            setUndoRestante(0);
        }, DURACION_UNDO);
    }, []);

    const handleSiguiente = useCallback(() => {
        mostrarSiguiente();
    }, [mostrarSiguiente]);

    const handleEliminar = useCallback((id?: string) => {
        const idEliminar = id ?? recordatorioActual?.id;
        if (!idEliminar) return;

        const eliminado = eliminar(idEliminar);
        if (eliminado) {
            setEliminadoPendiente(eliminado);
            iniciarUndoTimer();
        }
    }, [recordatorioActual, eliminar, iniciarUndoTimer]);

    const handleDeshacer = useCallback(() => {
        if (!eliminadoPendiente) return;
        restaurar(eliminadoPendiente);
        if (undoTimerRef.current) clearInterval(undoTimerRef.current);
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        undoTimerRef.current = null;
        setEliminadoPendiente(null);
        setUndoRestante(0);
        mostrarExito('Recordatorio restaurado');
    }, [eliminadoPendiente, restaurar, mostrarExito]);

    const handleDescartarUndo = useCallback(() => {
        if (undoTimerRef.current) clearInterval(undoTimerRef.current);
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        undoTimerRef.current = null;
        setEliminadoPendiente(null);
        setUndoRestante(0);
    }, []);

    const handleEliminarConConfirmacion = useCallback(async (id: string) => {
        const aceptar = await confirmar({
            titulo: 'Eliminar recordatorio',
            mensaje: '¿Estás seguro de que quieres eliminar este recordatorio?',
            textoAceptar: 'Eliminar',
            tipo: 'peligro'
        });
        if (aceptar) {
            handleEliminar(id);
        }
    }, [confirmar, handleEliminar]);

    const handleGuardarCreacion = useCallback((texto: string, adjuntos: Adjunto[], crearIndividuales: boolean) => {
        if (crearIndividuales) {
            /* Cada adjunto es un recordatorio individual */
            const items = adjuntos.map(adj => ({texto: '', adjuntos: [adj]}));
            agregarVarios(items);
            mostrarExito(`${adjuntos.length} recordatorio${adjuntos.length > 1 ? 's' : ''} creado${adjuntos.length > 1 ? 's' : ''}`);
        } else {
            agregar({texto, adjuntos});
            mostrarExito('Recordatorio creado');
        }
        setModalCrearAbierto(false);
    }, [agregar, agregarVarios, mostrarExito]);

    return {
        /* Estado */
        recordatorioActual,
        recordatorios,
        config,
        ultimoCambio,
        /* Modales */
        modalCrearAbierto,
        setModalCrearAbierto,
        modalListaAbierto,
        setModalListaAbierto,
        /* Acciones */
        handleSiguiente,
        handleEliminar,
        handleEliminarConConfirmacion,
        handleGuardarCreacion,
        cambiarIntervaloMs,
        cambiarTamanoFuente,
        actualizarConfig,
        /* Undo */
        eliminadoPendiente,
        undoRestante,
        undoTotal: DURACION_UNDO,
        handleDeshacer,
        handleDescartarUndo
    };
}
