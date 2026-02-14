/*
 * Hook: useReproductor
 * Interfaz simplificada para controlar el reproductor global.
 * Envuelve reproductorStore + lógica de Audio API.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useReproductorStore } from '../stores/reproductorStore';
import { crearLogger } from '../services/logger';
import type { SampleResumen } from '../types/sample';

const log = crearLogger('useReproductor');

export const useReproductor = () => {
    const store = useReproductorStore();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const intervaloRef = useRef<number | null>(null);

    /* Inicializar elemento de audio una sola vez */
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.preload = 'metadata';
        }

        const audio = audioRef.current;

        const onLoadedMetadata = () => {
            store.setDuracion(audio.duration);
        };

        const onEnded = () => {
            store.siguiente();
        };

        const onError = (e: Event) => {
            log.error('Error de audio', e);
            store.setPausa();
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
            audioRef.current.volume = store.volumen;
            audioRef.current.muted = store.muted;
        }
    }, [store.volumen, store.muted]);

    /* Reproducir/Pausar según estado */
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (store.reproduciendo) {
            audio.play().catch((err) => {
                log.warn('No se pudo reproducir', err);
                store.setPausa();
            });

            /* Actualizar progreso */
            intervaloRef.current = window.setInterval(() => {
                store.setProgreso(audio.currentTime);
            }, 250);
        } else {
            audio.pause();
            if (intervaloRef.current) {
                clearInterval(intervaloRef.current);
                intervaloRef.current = null;
            }
        }
    }, [store.reproduciendo]);

    /* Cargar nuevo sample */
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !store.sampleActual) return;

        const urlAudio = store.sampleActual.rutaOptimizado ?? store.sampleActual.rutaPreview ?? '';
        if (urlAudio && audio.src !== urlAudio) {
            audio.src = urlAudio;
            audio.load();
            log.info('Cargando sample', store.sampleActual.titulo);
        }
    }, [store.sampleActual]);

    const reproducir = useCallback((sample: SampleResumen) => {
        store.setSample(sample);
        store.setReproduciendo();
    }, []);

    const seekTo = useCallback((tiempo: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = tiempo;
            store.setProgreso(tiempo);
        }
    }, []);

    return {
        sampleActual: store.sampleActual,
        reproduciendo: store.reproduciendo,
        progreso: store.progreso,
        duracion: store.duracion,
        volumen: store.volumen,
        muted: store.muted,
        cola: store.cola,
        reproducir,
        pausar: store.setPausa,
        togglePlay: store.togglePlay,
        siguiente: store.siguiente,
        anterior: store.anterior,
        seekTo,
        setVolumen: store.setVolumen,
        toggleMute: store.toggleMute,
    };
};
