/*
 * useMotorAudio — Hook para controlar la reproducción del mezclador
 * Maneja scheduling preciso con Web Audio API (lookahead pattern)
 */

import { useRef, useCallback, useEffect } from 'react';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { motorAudio } from '../services/motorAudioService';
import { compasesASegundos } from '../utils/compasUtils';

export const useMotorAudio = () => {
    const tiempoInicioRef = useRef<number>(0);
    const schedulerRef = useRef<number | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const reproduciendo = useMezcladorStore(s => s.reproduciendo);
    const pistas = useMezcladorStore(s => s.pistas);
    const bpmProyecto = useMezcladorStore(s => s.bpmProyecto);
    const compasProyecto = useMezcladorStore(s => s.compasProyecto);
    const totalCompases = useMezcladorStore(s => s.totalCompases);
    const posicionCursor = useMezcladorStore(s => s.posicionCursor);

    /* Programar todos los bloques desde una posición dada */
    const programarBloques = useCallback((desdeSegundo: number) => {
        const ctx = motorAudio.obtenerContexto();
        const ahora = ctx.currentTime;
        tiempoInicioRef.current = ahora - desdeSegundo;

        for (const pista of pistas) {
            if (pista.silenciada) continue;

            for (const bloque of pista.bloques) {
                if (!bloque.audioBuffer || bloque.silenciado) continue;

                const inicioBloque = compasesASegundos(
                    bloque.compasInicio, bpmProyecto, compasProyecto
                );
                const duracionBloque = compasesASegundos(
                    bloque.duracionCompases, bpmProyecto, compasProyecto
                );

                /* Si el bloque ya pasó completamente, saltar */
                if (inicioBloque + duracionBloque <= desdeSegundo) continue;

                /* Calcular cuándo programar (relativo al contexto) */
                const cuando = ahora + (inicioBloque - desdeSegundo);
                const offset = inicioBloque < desdeSegundo ? desdeSegundo - inicioBloque : 0;
                const duracionEfectiva = duracionBloque - offset;

                if (duracionEfectiva <= 0) continue;

                /* Limitar duración al buffer real ajustado por playbackRate */
                const duracionBufferAjustada = bloque.audioBuffer.duration / bloque.playbackRate;
                const duracionFinal = Math.min(duracionEfectiva, duracionBufferAjustada - offset);

                if (duracionFinal <= 0) continue;

                motorAudio.programarReproduccion(
                    bloque.audioBuffer,
                    pista.id,
                    Math.max(cuando, ahora),
                    offset * bloque.playbackRate,
                    duracionFinal,
                    bloque.playbackRate,
                    bloque.volumen * pista.volumen
                );
            }
        }
    }, [pistas, bpmProyecto, compasProyecto]);

    /* Actualizar cursor de reproducción (visual) */
    const actualizarCursor = useCallback(() => {
        const ctx = motorAudio.obtenerContexto();
        const tiempoTranscurrido = ctx.currentTime - tiempoInicioRef.current;
        const duracionTotal = compasesASegundos(totalCompases, bpmProyecto, compasProyecto);

        if (tiempoTranscurrido >= duracionTotal) {
            /* Fin de la reproducción */
            useMezcladorStore.getState().setReproduciendo(false);
            useMezcladorStore.getState().setPosicionCursor(0);
            useMezcladorStore.getState().setTiempoActual(0);
            motorAudio.detenerTodo();
            return;
        }

        useMezcladorStore.getState().setTiempoActual(tiempoTranscurrido);
        animFrameRef.current = requestAnimationFrame(actualizarCursor);
    }, [totalCompases, bpmProyecto, compasProyecto]);

    /* Play */
    const reproducir = useCallback(() => {
        motorAudio.iniciar();
        motorAudio.detenerTodo();

        const posInicio = compasesASegundos(posicionCursor, bpmProyecto, compasProyecto);
        programarBloques(posInicio);

        useMezcladorStore.getState().setReproduciendo(true);
        animFrameRef.current = requestAnimationFrame(actualizarCursor);
    }, [posicionCursor, bpmProyecto, compasProyecto, programarBloques, actualizarCursor]);

    /* Stop */
    const detener = useCallback(() => {
        motorAudio.detenerTodo();
        useMezcladorStore.getState().setReproduciendo(false);

        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
    }, []);

    /* Toggle play/stop */
    const toggleReproduccion = useCallback(() => {
        if (reproduciendo) {
            detener();
        } else {
            reproducir();
        }
    }, [reproduciendo, reproducir, detener]);

    /* Seek a posición */
    const seek = useCallback((compas: number) => {
        useMezcladorStore.getState().setPosicionCursor(compas);
        const tiempo = compasesASegundos(compas, bpmProyecto, compasProyecto);
        useMezcladorStore.getState().setTiempoActual(tiempo);

        if (reproduciendo) {
            motorAudio.detenerTodo();
            programarBloques(tiempo);
            const ctx = motorAudio.obtenerContexto();
            tiempoInicioRef.current = ctx.currentTime - tiempo;
        }
    }, [bpmProyecto, compasProyecto, reproduciendo, programarBloques]);

    /* Limpiar al desmontar */
    useEffect(() => {
        return () => {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
            }
            if (schedulerRef.current) {
                clearInterval(schedulerRef.current);
            }
            motorAudio.detenerTodo();
        };
    }, []);

    return {
        reproducir,
        detener,
        toggleReproduccion,
        seek,
        reproduciendo,
    };
};
