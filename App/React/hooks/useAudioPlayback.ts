/*
 * Hook: useAudioPlayback
 * Logica de reproduccion de audio (play/pause/seek/waveform/progreso).
 * Extraido de useTarjetaSample para cumplir SRP.
 */

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import type { SampleResumen } from '@app/types';
import { registrarReproduccion } from '@app/services/apiReproduciones';
import { extraerPicosAudio, EVENTO_REPRODUCCION_SAMPLE } from './utils/tarjetaSampleUtils';

interface UseAudioPlaybackOpciones {
    sample: SampleResumen;
    activa: boolean;
    reproduciendo: boolean;
    progreso: number;
    onPlay?: (sample: SampleResumen) => void;
    onPause?: () => void;
    onSeek?: (posicion: number) => void;
}

export function useAudioPlayback(opciones: UseAudioPlaybackOpciones) {
    const { sample, activa, reproduciendo, progreso, onPlay, onPause, onSeek } = opciones;

    const [reproduciendoLocal, setReproduciendoLocal] = useState(false);
    const [progresoLocal, setProgresoLocal] = useState(0);
    const [picosAudio, setPicosAudio] = useState<number[] | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const rutaPreviewRef = useRef(sample.rutaPreview);

    /* Cargar waveform: servidor (JSON) o fallback AudioContext */
    useEffect(() => {
        let activo = true;

        const cargarWaveform = async () => {
            if (sample.rutaWaveform) {
                try {
                    const respWf = await fetch(sample.rutaWaveform);
                    if (respWf.ok) {
                        const json = await respWf.json();
                        if (!activo) return;
                        const picosServidor = Array.isArray(json)
                            ? json
                            : (json.peaks ?? json.picos ?? json.data ?? null);
                        if (Array.isArray(picosServidor) && picosServidor.length > 0) {
                            const maximo = Math.max(...picosServidor, 0.001);
                            const normalizados = maximo > 1
                                ? picosServidor.map((p: number) => Math.max(0.03, p / maximo))
                                : picosServidor;
                            setPicosAudio(normalizados);
                            return;
                        }
                    }
                } catch {
                    /* Fallo silencioso, se usa fallback AudioContext */
                }
            }

            if (!sample.rutaPreview) {
                if (activo) setPicosAudio(null);
                return;
            }

            if (typeof window === 'undefined' || !window.AudioContext) {
                if (activo) setPicosAudio(null);
                return;
            }

            const contexto = new window.AudioContext();
            try {
                const respuesta = await fetch(sample.rutaPreview);
                if (!respuesta.ok) throw new Error('No se pudo cargar el audio de preview');

                const bufferAudio = await respuesta.arrayBuffer();
                const audioDecodificado = await contexto.decodeAudioData(bufferAudio.slice(0));
                if (!activo) return;
                setPicosAudio(extraerPicosAudio(audioDecodificado));
            } catch {
                if (activo) setPicosAudio(null);
            } finally {
                contexto.close().catch(() => undefined);
            }
        };

        cargarWaveform();
        return () => { activo = false; };
    }, [sample.rutaWaveform, sample.rutaPreview]);

    /* Inicializar elemento de audio con event listeners */
    const inicializarAudio = useCallback((): HTMLAudioElement => {
        if (audioRef.current) return audioRef.current;

        const audio = new Audio(sample.rutaPreview);
        audio.preload = 'metadata';

        audio.addEventListener('timeupdate', () => {
            if (!audio.duration) return;
            setProgresoLocal(audio.currentTime / audio.duration);
        });
        audio.addEventListener('play', () => setReproduciendoLocal(true));
        audio.addEventListener('pause', () => setReproduciendoLocal(false));
        audio.addEventListener('ended', () => {
            setReproduciendoLocal(false);
            setProgresoLocal(0);
            audio.currentTime = 0;
        });

        audioRef.current = audio;
        return audio;
    }, [sample.rutaPreview]);

    /* Actualizar src si cambia rutaPreview */
    useEffect(() => {
        if (rutaPreviewRef.current === sample.rutaPreview) return;
        rutaPreviewRef.current = sample.rutaPreview;
        if (!audioRef.current) return;

        audioRef.current.pause();
        audioRef.current.src = sample.rutaPreview;
        audioRef.current.load();
        setProgresoLocal(0);
        setReproduciendoLocal(false);
    }, [sample.rutaPreview]);

    /* Pausar si otro sample inicia reproduccion */
    useEffect(() => {
        const pausarSiEsOtro = (event: Event) => {
            const detalle = (event as CustomEvent<{ sampleId?: number }>).detail;
            if (detalle?.sampleId === sample.id) return;
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
            }
        };

        window.addEventListener(EVENTO_REPRODUCCION_SAMPLE, pausarSiEsOtro as EventListener);
        return () => {
            window.removeEventListener(EVENTO_REPRODUCCION_SAMPLE, pausarSiEsOtro as EventListener);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [sample.id]);

    /* Play/Pause */
    const manejarPlayPause = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        const audio = inicializarAudio();
        if (!audio.paused) {
            audio.pause();
            onPause?.();
            return;
        }

        window.dispatchEvent(
            new CustomEvent(EVENTO_REPRODUCCION_SAMPLE, { detail: { sampleId: sample.id } }),
        );
        audio.play().catch(() => setReproduciendoLocal(false));
        onPlay?.(sample);
        registrarReproduccion(sample.id).catch(() => { /* silencioso */ });
    }, [inicializarAudio, onPlay, onPause, sample]);

    /* Seek en waveform */
    const manejarSeek = useCallback((posicion: number) => {
        const audio = inicializarAudio();

        const aplicarSeekYReproducir = () => {
            if (!audio.duration) return;
            audio.currentTime = posicion * audio.duration;
            setProgresoLocal(posicion);
            window.dispatchEvent(
                new CustomEvent(EVENTO_REPRODUCCION_SAMPLE, { detail: { sampleId: sample.id } }),
            );
            audio.play().catch(() => setReproduciendoLocal(false));
        };

        if (audio.duration && Number.isFinite(audio.duration)) {
            aplicarSeekYReproducir();
        } else {
            const manejarMetadata = () => {
                aplicarSeekYReproducir();
                audio.removeEventListener('loadedmetadata', manejarMetadata);
            };
            audio.addEventListener('loadedmetadata', manejarMetadata);
            audio.load();
        }

        onSeek?.(posicion);
    }, [inicializarAudio, onSeek, sample.id]);

    /* Valores computados */
    const estaActiva = activa || reproduciendoLocal;
    const estaReproduciendo = reproduciendoLocal || (activa && reproduciendo);
    const progresoActual = estaActiva
        ? reproduciendoLocal ? progresoLocal : progreso
        : 0;

    return {
        picosAudio,
        reproduciendoLocal,
        estaActiva,
        estaReproduciendo,
        progresoActual,
        manejarPlayPause,
        manejarSeek,
    };
}
