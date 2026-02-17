/*
 * useMezclador — Hook principal que orquesta el mezclador
 * Combina motor audio, timeline, y exportación. Escucha eventos externos.
 */

import { useEffect } from 'react';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { useMotorAudio } from './useMotorAudio';
import { useTimeline } from './useTimeline';
import { useExportarMezcla } from './useExportarMezcla';
import { EVENTO_AGREGAR_MEZCLADOR } from '../types/mezclador';
import type { SampleResumen } from '@app/types';

export const useMezclador = () => {
    const abierto = useMezcladorStore(s => s.abierto);
    const pistas = useMezcladorStore(s => s.pistas);
    const bpmProyecto = useMezcladorStore(s => s.bpmProyecto);
    const compasProyecto = useMezcladorStore(s => s.compasProyecto);
    const totalCompases = useMezcladorStore(s => s.totalCompases);
    const exportando = useMezcladorStore(s => s.exportando);
    const tiempoActual = useMezcladorStore(s => s.tiempoActual);
    const cargandoBuffers = useMezcladorStore(s => s.cargandoBuffers);

    const toggle = useMezcladorStore(s => s.toggle);
    const setBpm = useMezcladorStore(s => s.setBpm);
    const agregarCompas = useMezcladorStore(s => s.agregarCompas);
    const quitarCompas = useMezcladorStore(s => s.quitarCompas);
    const agregarPista = useMezcladorStore(s => s.agregarPista);
    const eliminarPista = useMezcladorStore(s => s.eliminarPista);
    const eliminarBloque = useMezcladorStore(s => s.eliminarBloque);
    const agregarSample = useMezcladorStore(s => s.agregarSample);
    const limpiarProyecto = useMezcladorStore(s => s.limpiarProyecto);

    const motor = useMotorAudio();
    const timeline = useTimeline();
    const exportar = useExportarMezcla();

    /* Escuchar evento externo para agregar samples */
    useEffect(() => {
        const handler = (evento: Event) => {
            const customEvento = evento as CustomEvent<{ sample: SampleResumen }>;
            if (customEvento.detail?.sample) {
                agregarSample(customEvento.detail.sample);
                /* Abrir mezclador si estaba cerrado */
                if (!useMezcladorStore.getState().abierto) {
                    useMezcladorStore.getState().abrir();
                }
            }
        };

        window.addEventListener(EVENTO_AGREGAR_MEZCLADOR, handler);
        return () => window.removeEventListener(EVENTO_AGREGAR_MEZCLADOR, handler);
    }, [agregarSample]);

    /* Atajos de teclado cuando el mezclador está abierto */
    useEffect(() => {
        if (!abierto) return;

        const handler = (e: KeyboardEvent) => {
            /* No capturar si hay input activo */
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            if (e.code === 'Space') {
                e.preventDefault();
                motor.toggleReproduccion();
            }

            /* C224: Undo/Redo con Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z */
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    useMezcladorStore.getState().deshacer();
                }
                if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
                    e.preventDefault();
                    useMezcladorStore.getState().rehacer();
                }
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [abierto, motor.toggleReproduccion]);

    /* Contar bloques totales */
    const totalBloques = pistas.reduce((acc, p) => acc + p.bloques.length, 0);
    const estaCargando = cargandoBuffers.size > 0;

    return {
        /* Estado */
        abierto,
        pistas,
        bpmProyecto,
        compasProyecto,
        totalCompases,
        exportando,
        tiempoActual,
        totalBloques,
        estaCargando,

        /* Acciones del store */
        toggle,
        setBpm,
        agregarCompas,
        quitarCompas,
        agregarPista,
        eliminarPista,
        eliminarBloque,
        limpiarProyecto,

        /* Motor audio */
        ...motor,

        /* Timeline drag */
        ...timeline,

        /* Exportación */
        ...exportar,
    };
};
