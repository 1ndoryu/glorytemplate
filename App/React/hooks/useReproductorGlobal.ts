/*
 * Hook: useReproductorGlobal
 * Lógica del reproductor de audio global: audio element, play/pause,
 * volumen, seek, eventos, click fuera, conexión a reproductorStore.
 * Extraído de ReproductorGlobal para cumplir SRP.
 */

import { useCallback, useRef, useEffect, type MouseEvent } from 'react';
import { useReproductorStore } from '../stores/reproductorStore';

/* Formatear segundos a mm:ss */
const formatearTiempo = (segundos: number): string => {
    if (!segundos || isNaN(segundos)) return '0:00';
    const min = Math.floor(segundos / 60);
    const sec = Math.floor(segundos % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
};

export const useReproductorGlobal = () => {
    const sampleActual = useReproductorStore(s => s.sampleActual);
    const reproduciendo = useReproductorStore(s => s.reproduciendo);
    const volumen = useReproductorStore(s => s.volumen);
    const progreso = useReproductorStore(s => s.progreso);
    const duracion = useReproductorStore(s => s.duracion);
    const muted = useReproductorStore(s => s.muted);
    const repetir = useReproductorStore(s => s.repetir);
    const aleatorio = useReproductorStore(s => s.aleatorio);
    const pause = useReproductorStore(s => s.pause);
    const togglePlay = useReproductorStore(s => s.togglePlay);
    const setVolumen = useReproductorStore(s => s.setVolumen);
    const toggleMute = useReproductorStore(s => s.toggleMute);
    const setProgreso = useReproductorStore(s => s.setProgreso);
    const setDuracion = useReproductorStore(s => s.setDuracion);
    const toggleRepetir = useReproductorStore(s => s.toggleRepetir);
    const toggleAleatorio = useReproductorStore(s => s.toggleAleatorio);
    const siguiente = useReproductorStore(s => s.siguiente);
    const anterior = useReproductorStore(s => s.anterior);
    const cerrar = useReproductorStore(s => s.cerrar);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progresoBarraRef = useRef<HTMLDivElement>(null);
    const volumenBarraRef = useRef<HTMLDivElement>(null);
    const contenedorRef = useRef<HTMLDivElement>(null);

    /* Cerrar reproductor al hacer click fuera */
    useEffect(() => {
        if (!sampleActual) return;

        const manejarClickFuera = (e: globalThis.MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
                cerrar();
            }
        };

        document.addEventListener('mousedown', manejarClickFuera);
        return () => document.removeEventListener('mousedown', manejarClickFuera);
    }, [sampleActual, cerrar]);

    /* Crear/actualizar elemento de audio */
    useEffect(() => {
        if (!sampleActual) return;

        if (!audioRef.current) {
            audioRef.current = new Audio();
        }
        const audio = audioRef.current;

        if (audio.src !== sampleActual.rutaPreview) {
            audio.src = sampleActual.rutaPreview;
            audio.load();
        }
    }, [sampleActual]);

    /* Controlar play/pause */
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (reproduciendo) {
            audio.play().catch(() => pause());
        } else {
            audio.pause();
        }
    }, [reproduciendo, pause]);

    /* Configurar volumen */
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = muted ? 0 : volumen;
        }
    }, [volumen, muted]);

    /* Eventos del audio */
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const actualizarProgreso = () => {
            if (audio.duration) {
                setProgreso(audio.currentTime / audio.duration);
            }
        };

        const finAudio = () => {
            if (repetir) {
                audio.currentTime = 0;
                audio.play().catch(() => {});
            } else {
                siguiente();
            }
        };

        const cargarMetadata = () => {
            setDuracion(audio.duration);
        };

        audio.addEventListener('timeupdate', actualizarProgreso);
        audio.addEventListener('ended', finAudio);
        audio.addEventListener('loadedmetadata', cargarMetadata);

        return () => {
            audio.removeEventListener('timeupdate', actualizarProgreso);
            audio.removeEventListener('ended', finAudio);
            audio.removeEventListener('loadedmetadata', cargarMetadata);
        };
    }, [setProgreso, setDuracion, repetir, siguiente]);

    /* Seek en barra de progreso */
    const manejarSeekProgreso = useCallback(
        (e: MouseEvent) => {
            const barra = progresoBarraRef.current;
            const audio = audioRef.current;
            if (!barra || !audio || !audio.duration) return;

            const rect = barra.getBoundingClientRect();
            const posicion = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            audio.currentTime = posicion * audio.duration;
            setProgreso(posicion);
        },
        [setProgreso]
    );

    /* Seek en barra de volumen */
    const manejarSeekVolumen = useCallback(
        (e: MouseEvent) => {
            const barra = volumenBarraRef.current;
            if (!barra) return;

            const rect = barra.getBoundingClientRect();
            const nuevoVol = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setVolumen(nuevoVol);
        },
        [setVolumen]
    );

    return {
        /* Estado */
        sampleActual,
        reproduciendo,
        volumen,
        progreso,
        duracion,
        muted,
        repetir,
        aleatorio,
        /* Acciones */
        togglePlay,
        toggleMute,
        toggleRepetir,
        toggleAleatorio,
        siguiente,
        anterior,
        /* Handlers */
        manejarSeekProgreso,
        manejarSeekVolumen,
        /* Refs */
        progresoBarraRef,
        volumenBarraRef,
        contenedorRef,
        /* Utilidades */
        formatearTiempo,
    };
};
