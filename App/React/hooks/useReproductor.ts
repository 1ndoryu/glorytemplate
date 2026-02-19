/*
 * Hook: useReproductor
 * Interfaz simplificada para controlar el reproductor global.
 * Envuelve reproductorStore + logica de Audio API.
 *
 * FE07: Selectores individuales en vez de suscripcion al store completo.
 * setProgreso (4x/seg) ya no causa re-renders en consumers que no leen progreso.
 * Acciones via getState() — refs estables, sin re-renders.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useReproductorStore } from '../stores/reproductorStore';
import { crearLogger } from '../services/logger';
import type { SampleResumen } from '../types/sample';

const log = crearLogger('useReproductor');

/* Acciones estables del store (nunca cambian, no causan re-render) */
const obtenerAcciones = () => useReproductorStore.getState();

export const useReproductor = () => {
    /* Selectores individuales: cada uno solo re-renderiza cuando su valor cambia */
    const sampleActual = useReproductorStore(s => s.sampleActual);
    const reproduciendo = useReproductorStore(s => s.reproduciendo);
    const progreso = useReproductorStore(s => s.progreso);
    const duracion = useReproductorStore(s => s.duracion);
    const volumen = useReproductorStore(s => s.volumen);
    const muted = useReproductorStore(s => s.muted);
    const cola = useReproductorStore(s => s.cola);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const intervaloRef = useRef<number | null>(null);

    /* Inicializar elemento de audio una sola vez */
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.preload = 'metadata';
        }

        const audio = audioRef.current;

        /* Handlers usan getState() para evitar stale closures */
        const onLoadedMetadata = () => {
            obtenerAcciones().setDuracion(audio.duration);
        };

        const onEnded = () => {
            obtenerAcciones().siguiente();
        };

        const onError = (e: Event) => {
            log.error('Error de audio', e);
            obtenerAcciones().pause();
        };

        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        return () => {
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            if (intervaloRef.current) {
                clearInterval(intervaloRef.current);
            }
        };
    }, []);

    /* Sincronizar volumen y muted */
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volumen;
            audioRef.current.muted = muted;
        }
    }, [volumen, muted]);

    /* Reproducir/Pausar segun estado */
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (reproduciendo) {
            audio.play().catch((err) => {
                log.warn('No se pudo reproducir', err);
                obtenerAcciones().pause();
            });

            /* Progreso via getState() — no re-renderiza el hook, solo actualiza el store */
            intervaloRef.current = window.setInterval(() => {
                obtenerAcciones().setProgreso(audio.currentTime);
            }, 250);
        } else {
            audio.pause();
            if (intervaloRef.current) {
                clearInterval(intervaloRef.current);
                intervaloRef.current = null;
            }
        }
    }, [reproduciendo]);

    /* Cargar nuevo sample */
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !sampleActual) return;

        const urlAudio = sampleActual.rutaPreview ?? '';
        if (urlAudio && audio.src !== urlAudio) {
            audio.src = urlAudio;
            audio.load();
            log.info('Cargando sample', sampleActual.titulo);
        }
    }, [sampleActual]);

    const reproducir = useCallback((sample: SampleResumen) => {
        obtenerAcciones().setSample(sample);
    }, []);

    const seekTo = useCallback((tiempo: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = tiempo;
            obtenerAcciones().setProgreso(tiempo);
        }
    }, []);

    return {
        sampleActual,
        reproduciendo,
        progreso,
        duracion,
        volumen,
        muted,
        cola,
        reproducir,
        pausar: obtenerAcciones().pause,
        togglePlay: obtenerAcciones().togglePlay,
        siguiente: obtenerAcciones().siguiente,
        anterior: obtenerAcciones().anterior,
        seekTo,
        setVolumen: obtenerAcciones().setVolumen,
        toggleMute: obtenerAcciones().toggleMute,
    };
};
