/*
 * useMotorAudio — Hook para controlar la reproducción del mezclador
 * Maneja scheduling preciso con Web Audio API (lookahead pattern).
 * Lee estado desde getState() para evitar stale closures en rAF.
 */

import { useRef, useCallback, useEffect } from 'react';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { motorAudio } from '../services/motorAudioService';
import { compasesASegundos } from '../utils/compasUtils';

export const useMotorAudio = () => {
    const tiempoInicioRef = useRef<number>(0);
    const animFrameRef = useRef<number | null>(null);
    const reproduciendo = useMezcladorStore(s => s.reproduciendo);

    /*
     * Programar todos los bloques desde una posición dada.
     * Lee pistas/bpm/compás desde getState() para evitar recrear este callback
     * cada vez que cambia el array de pistas (causa cascading effect).
     */
    const programarBloques = useCallback((desdeSegundo: number) => {
        const { pistas, bpmProyecto, compasProyecto } = useMezcladorStore.getState();
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
    }, []);

    /*
     * Actualizar cursor de reproducción (visual).
     * Lee totalCompases/bpm/compás desde getState() — evita stale closure
     * porque este callback se auto-referencia via requestAnimationFrame.
     */
    const actualizarCursor = useCallback(() => {
        const { totalCompases, bpmProyecto, compasProyecto } = useMezcladorStore.getState();
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
    }, []);

    /* Play */
    const reproducir = useCallback(() => {
        motorAudio.iniciar();
        motorAudio.detenerTodo();

        const { posicionCursor, bpmProyecto, compasProyecto } = useMezcladorStore.getState();
        const posInicio = compasesASegundos(posicionCursor, bpmProyecto, compasProyecto);
        programarBloques(posInicio);

        useMezcladorStore.getState().setReproduciendo(true);
        animFrameRef.current = requestAnimationFrame(actualizarCursor);
    }, [programarBloques, actualizarCursor]);

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
        if (useMezcladorStore.getState().reproduciendo) {
            detener();
        } else {
            reproducir();
        }
    }, [reproducir, detener]);

    /* Seek a posición */
    const seek = useCallback((compas: number) => {
        const { bpmProyecto, compasProyecto, reproduciendo: enReproduccion } = useMezcladorStore.getState();
        useMezcladorStore.getState().setPosicionCursor(compas);
        const tiempo = compasesASegundos(compas, bpmProyecto, compasProyecto);
        useMezcladorStore.getState().setTiempoActual(tiempo);

        if (enReproduccion) {
            motorAudio.detenerTodo();
            programarBloques(tiempo);
            const ctx = motorAudio.obtenerContexto();
            tiempoInicioRef.current = ctx.currentTime - tiempo;
        }
    }, [programarBloques]);

    /* Limpiar al desmontar */
    useEffect(() => {
        return () => {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
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
