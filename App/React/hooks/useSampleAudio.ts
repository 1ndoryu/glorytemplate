/*
 * useSampleAudio — Hook para gestión de audio en SampleDetalle.
 * Maneja reproducción local, progreso, waveform y cleanup.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { enviarTrackingReproduccion } from '@app/utils/trackingReproduccion';
import type { Sample } from '@app/types';

interface SampleAudioState {
    reproduciendo: boolean;
    progreso: number;
    picosWaveform: number[] | null;
    manejarPlay: () => void;
    buscarPosicion: (pct: number) => void;
    audioRef: React.RefObject<HTMLAudioElement | null>;
}

export function useSampleAudio(sample: Sample | null): SampleAudioState {
    const [reproduciendo, setReproduciendo] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [picosWaveform, setPicosWaveform] = useState<number[] | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const rutaPreviewRef = useRef('');

    /* Cargar picos de waveform del servidor */
    useEffect(() => {
        if (!sample?.rutaWaveform) {
            setPicosWaveform(null);
            return;
        }

        const controller = new AbortController();
        const cargar = async () => {
            try {
                const resp = await fetch(sample.rutaWaveform, { signal: controller.signal });
                if (!resp.ok || controller.signal.aborted) return;
                const json = await resp.json();
                if (controller.signal.aborted) return;
                const datos = Array.isArray(json) ? json : (json.peaks ?? json.picos ?? json.data ?? null);
                if (Array.isArray(datos) && datos.length > 0) {
                    const maximo = Math.max(...datos, 0.001);
                    setPicosWaveform(maximo > 1 ? datos.map((p: number) => Math.max(0.03, p / maximo)) : datos);
                }
            } catch {
                /* Fallo silencioso, WaveformPlayer usara placeholder */
            }
        };
        cargar();
        return () => { controller.abort(); };
    }, [sample?.rutaWaveform]);

    /* Inicializar/actualizar audio element y event listeners */
    useEffect(() => {
        if (!sample) return;

        if (!audioRef.current) {
            audioRef.current = new Audio(sample.rutaPreview);
            rutaPreviewRef.current = sample.rutaPreview;
        }

        const audio = audioRef.current;
        if (rutaPreviewRef.current !== sample.rutaPreview) {
            rutaPreviewRef.current = sample.rutaPreview;
            audio.src = sample.rutaPreview;
            audio.load();
            setProgreso(0);
            setReproduciendo(false);
        }

        const actualizarProgreso = () => {
            if (!audio.duration) return;
            setProgreso(audio.currentTime / audio.duration);
        };
        const onPlay = () => setReproduciendo(true);
        const onPause = () => setReproduciendo(false);
        const onFin = () => {
            if (sample) {
                enviarTrackingReproduccion(sample.id, audio.duration || 0, true);
            }
            setReproduciendo(false);
            setProgreso(0);
            audio.currentTime = 0;
        };

        audio.addEventListener('timeupdate', actualizarProgreso);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onFin);

        return () => {
            audio.removeEventListener('timeupdate', actualizarProgreso);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onFin);
        };
    }, [sample]);

    /* Cleanup al desmontar — enviar tracking parcial si estaba reproduciendo */
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                if (!audioRef.current.paused && sample) {
                    enviarTrackingReproduccion(sample.id, audioRef.current.currentTime || 0, false);
                }
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    /* Play/pause toggle */
    const manejarPlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
            audio.play().catch(() => { setReproduciendo(false); });
            return;
        }
        if (sample) {
            enviarTrackingReproduccion(sample.id, audio.currentTime || 0, false);
        }
        audio.pause();
    }, [sample]);

    /* Seek por porcentaje */
    const buscarPosicion = useCallback((pct: number) => {
        const audio = audioRef.current;
        if (audio?.duration) {
            audio.currentTime = pct * audio.duration;
            setProgreso(pct);
        }
    }, []);

    return { reproduciendo, progreso, picosWaveform, manejarPlay, buscarPosicion, audioRef };
}
