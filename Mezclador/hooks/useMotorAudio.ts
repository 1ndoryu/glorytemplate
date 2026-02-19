/*
 * useMotorAudio — Hook para controlar la reproducción del mezclador
 * Maneja scheduling preciso con Web Audio API (lookahead pattern).
 * Lee estado desde getState() para evitar stale closures en rAF.
 * C213: Soporta reprogramación en tiempo real durante stretch/config changes.
 * C308: Soporta modos PAT (loop patrón) y SONG (playlist completa).
 */

import { useRef, useCallback, useEffect } from 'react';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { usePatronesStore } from '../stores/patronesStore';
import { motorAudio } from '../services/motorAudioService';
import { compasesASegundos } from '../utils/compasUtils';
import { EVENTO_REPROGRAMAR_AUDIO } from '../types/mezclador';

export const useMotorAudio = () => {
    const tiempoInicioRef = useRef<number>(0);
    const animFrameRef = useRef<number | null>(null);
    const reproduciendo = useMezcladorStore(s => s.reproduciendo);

    /*
     * Programar todos los bloques desde una posición dada (modo SONG).
     * Lee pistas/bpm/compás desde getState() para evitar recrear este callback
     * cada vez que cambia el array de pistas (causa cascading effect).
     * C215: Soporta recorteInicio, invertido, fadeIn/fadeOut.
     * C308: También programa ClipPatron en las pistas.
     */
    const programarBloques = useCallback((desdeSegundo: number) => {
        const { pistas, bpmProyecto, compasProyecto } = useMezcladorStore.getState();
        const ctx = motorAudio.obtenerContexto();
        const ahora = ctx.currentTime;
        tiempoInicioRef.current = ahora - desdeSegundo;

        for (const pista of pistas) {
            if (pista.silenciada) continue;

            /* Bloques de audio directo (legacy) */
            for (const bloque of pista.bloques) {
                if (!bloque.audioBuffer || bloque.silenciado) continue;

                const inicioBloque = compasesASegundos(
                    bloque.compasInicio, bpmProyecto, compasProyecto
                );
                const duracionBloque = compasesASegundos(
                    bloque.duracionCompases, bpmProyecto, compasProyecto
                );

                if (inicioBloque + duracionBloque <= desdeSegundo) continue;

                const cuando = ahora + (inicioBloque - desdeSegundo);
                const offset = inicioBloque < desdeSegundo ? desdeSegundo - inicioBloque : 0;
                const duracionEfectiva = duracionBloque - offset;

                if (duracionEfectiva <= 0) continue;

                const recorteInicio = bloque.recorteInicio ?? 0;
                const duracionBufferTotal = bloque.audioBuffer.duration;
                const finRecorte = bloque.recorteFin ?? duracionBufferTotal;
                const duracionUtilBuffer = finRecorte - recorteInicio;
                const duracionBufferAjustada = duracionUtilBuffer / bloque.playbackRate;
                const duracionDisponible = duracionBufferAjustada - offset;
                const duracionFinal = Math.min(duracionEfectiva, duracionDisponible);

                if (duracionFinal <= 0.001) continue;

                const offsetBuffer = recorteInicio + (offset * bloque.playbackRate);

                motorAudio.programarReproduccion(
                    bloque.audioBuffer,
                    pista.id,
                    Math.max(cuando, ahora),
                    offsetBuffer,
                    duracionFinal,
                    bloque.playbackRate,
                    bloque.volumen * pista.volumen,
                    bloque.invertido,
                    bloque.fadeIn,
                    bloque.fadeOut,
                    bloque.detune ?? 0,
                    bloque.modoTonalidad ?? 'resample',
                    bloque.id,
                    bloque.pan ?? 0,
                    bloque.modoDeclic ?? 'none'
                );
            }

            /* C308: Clips de patrón en la playlist */
            if (pista.clipsPatron) {
                for (const clip of pista.clipsPatron) {
                    if (clip.silenciado) continue;

                    const patron = usePatronesStore.getState().obtenerPatron(clip.patronId);
                    if (!patron) continue;

                    const inicioClip = compasesASegundos(
                        clip.compasInicio, bpmProyecto, compasProyecto
                    );
                    const duracionClip = compasesASegundos(
                        clip.duracionCompases, bpmProyecto, compasProyecto
                    );

                    if (inicioClip + duracionClip <= desdeSegundo) continue;

                    /* Offset del patrón respecto al punto de inicio */
                    const offsetPatron = Math.max(0, desdeSegundo - inicioClip);

                    motorAudio.programarPatron(
                        patron,
                        bpmProyecto,
                        ahora + inicioClip - desdeSegundo - offsetPatron,
                        motorAudio.esMixerInicializado()
                    );
                }
            }
        }
    }, []);

    /*
     * C308: Programar el patrón activo en modo PAT (loop).
     * Reproduce el patrón seleccionado en el Channel Rack.
     */
    const programarPatronActivo = useCallback((desdeSegundo: number) => {
        const patron = usePatronesStore.getState().obtenerPatronActivo();
        if (!patron) return;

        const { bpmProyecto } = useMezcladorStore.getState();
        const ctx = motorAudio.obtenerContexto();
        const ahora = ctx.currentTime;
        tiempoInicioRef.current = ahora - desdeSegundo;

        motorAudio.programarPatron(
            patron,
            bpmProyecto,
            ahora - desdeSegundo,
            motorAudio.esMixerInicializado()
        );
    }, []);

    /*
     * Actualizar cursor de reproducción (visual).
     * C308: En modo PAT, loop al final del patrón.
     * En modo SONG, detener al fin del último bloque.
     */
    const actualizarCursor = useCallback(() => {
        const { pistas, bpmProyecto, compasProyecto } = useMezcladorStore.getState();
        const { modoReproduccion } = usePatronesStore.getState();
        const ctx = motorAudio.obtenerContexto();
        const tiempoTranscurrido = ctx.currentTime - tiempoInicioRef.current;

        if (modoReproduccion === 'pat') {
            /* Modo PAT: loop al final del patrón activo */
            const patron = usePatronesStore.getState().obtenerPatronActivo();
            if (!patron) {
                useMezcladorStore.getState().setReproduciendo(false);
                motorAudio.detenerTodo();
                return;
            }

            /* Duración del patrón en segundos */
            const duracionPasoReal = (60 / bpmProyecto) / 4;
            const duracionPatron = patron.totalPasos * duracionPasoReal;

            if (duracionPatron <= 0) {
                useMezcladorStore.getState().setReproduciendo(false);
                motorAudio.detenerTodo();
                return;
            }

            /* Loop: si el tiempo excede la duración, reprogramar */
            if (tiempoTranscurrido >= duracionPatron && patron.loop) {
                motorAudio.detenerTodo();
                programarPatronActivo(0);
                useMezcladorStore.getState().setTiempoActual(0);
                useMezcladorStore.getState().setPosicionCursor(0);
                animFrameRef.current = requestAnimationFrame(actualizarCursor);
                return;
            }

            if (tiempoTranscurrido >= duracionPatron && !patron.loop) {
                useMezcladorStore.getState().setReproduciendo(false);
                useMezcladorStore.getState().setPosicionCursor(0);
                useMezcladorStore.getState().setTiempoActual(0);
                motorAudio.detenerTodo();
                return;
            }

            useMezcladorStore.getState().setTiempoActual(tiempoTranscurrido);
            animFrameRef.current = requestAnimationFrame(actualizarCursor);
            return;
        }

        /* Modo SONG: detener al fin del último bloque/clip */
        let finUltimoBloque = 0;
        for (const pista of pistas) {
            for (const bloque of pista.bloques) {
                const finBloque = bloque.compasInicio + bloque.duracionCompases;
                if (finBloque > finUltimoBloque) finUltimoBloque = finBloque;
            }
            /* C308: También considerar clips de patrón */
            if (pista.clipsPatron) {
                for (const clip of pista.clipsPatron) {
                    const finClip = clip.compasInicio + clip.duracionCompases;
                    if (finClip > finUltimoBloque) finUltimoBloque = finClip;
                }
            }
        }

        const duracionReal = finUltimoBloque > 0
            ? compasesASegundos(finUltimoBloque, bpmProyecto, compasProyecto)
            : 0;

        if (tiempoTranscurrido >= duracionReal) {
            useMezcladorStore.getState().setReproduciendo(false);
            useMezcladorStore.getState().setPosicionCursor(0);
            useMezcladorStore.getState().setTiempoActual(0);
            motorAudio.detenerTodo();
            return;
        }

        useMezcladorStore.getState().setTiempoActual(tiempoTranscurrido);
        animFrameRef.current = requestAnimationFrame(actualizarCursor);
    }, [programarPatronActivo]);

    /* Play — C308: bifurca según modo PAT o SONG */
    const reproducir = useCallback(() => {
        motorAudio.iniciar();
        motorAudio.detenerTodo();

        const { posicionCursor, bpmProyecto, compasProyecto } = useMezcladorStore.getState();
        const { modoReproduccion } = usePatronesStore.getState();

        if (modoReproduccion === 'pat') {
            /* Modo PAT: reproducir patrón activo desde posición 0 */
            programarPatronActivo(0);
        } else {
            /* Modo SONG: reproducir playlist completa */
            const posInicio = compasesASegundos(posicionCursor, bpmProyecto, compasProyecto);
            programarBloques(posInicio);
        }

        useMezcladorStore.getState().setReproduciendo(true);
        animFrameRef.current = requestAnimationFrame(actualizarCursor);
    }, [programarBloques, programarPatronActivo, actualizarCursor]);

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

    /*
     * C213+C308: Escuchar evento de reprogramación en tiempo real.
     * Bifurca según modo PAT o SONG.
     */
    useEffect(() => {
        const reprogramar = (e: Event) => {
            if (!useMezcladorStore.getState().reproduciendo) return;
            const { modoReproduccion } = usePatronesStore.getState();
            const ctx = motorAudio.obtenerContexto();
            const { bpmProyecto, compasProyecto } = useMezcladorStore.getState();

            const customEvent = e as CustomEvent;
            let desdeSegundo: number;

            if (customEvent.detail?.posicionCompases !== undefined) {
                desdeSegundo = compasesASegundos(
                    customEvent.detail.posicionCompases, bpmProyecto, compasProyecto
                );
            } else {
                desdeSegundo = ctx.currentTime - tiempoInicioRef.current;
            }

            motorAudio.detenerTodo();

            if (modoReproduccion === 'pat') {
                programarPatronActivo(desdeSegundo);
            } else {
                programarBloques(desdeSegundo);
            }
        };

        window.addEventListener(EVENTO_REPROGRAMAR_AUDIO, reprogramar);
        return () => window.removeEventListener(EVENTO_REPROGRAMAR_AUDIO, reprogramar);
    }, [programarBloques, programarPatronActivo]);

    return {
        reproducir,
        detener,
        toggleReproduccion,
        seek,
        reproduciendo,
    };
};
