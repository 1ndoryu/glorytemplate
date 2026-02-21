/*
 * Hook: useComentarioAudio
 * Lógica del reproductor de audio con waveform para comentarios multimedia.
 * Genera picos client-side si no vienen del backend. Usa AbortController para cleanup.
 * Extraído de ComentarioAudio.tsx para cumplir SRP.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseComentarioAudioParams {
    src: string;
    picos?: number[];
}

export const useComentarioAudio = ({ src, picos }: UseComentarioAudioParams) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [reproduciendo, setReproduciendo] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [duracion, setDuracion] = useState(0);
    const [picosGenerados, setPicosGenerados] = useState<number[] | null>(picos ?? null);

    /* Generar picos del audio si no vienen del backend */
    useEffect(() => {
        if (picos && picos.length > 0) {
            setPicosGenerados(picos);
            return;
        }
        if (!src || typeof window === 'undefined' || !window.AudioContext) return;
        let activo = true;
        const controller = new AbortController();
        const ctx = new window.AudioContext();
        (async () => {
            try {
                const resp = await fetch(src, { signal: controller.signal });
                if (!resp.ok) return;
                const buf = await resp.arrayBuffer();
                const decoded = await ctx.decodeAudioData(buf.slice(0));
                if (!activo) return;
                const data = decoded.getChannelData(0);
                const barras = 60;
                const porBarra = Math.max(1, Math.floor(data.length / barras));
                const peaks: number[] = [];
                for (let i = 0; i < barras; i++) {
                    let max = 0;
                    for (let j = 0; j < porBarra; j++) {
                        const val = Math.abs(data[i * porBarra + j] || 0);
                        if (val > max) max = val;
                    }
                    peaks.push(max);
                }
                const maximo = Math.max(...peaks, 0.001);
                setPicosGenerados(peaks.map(p => Math.max(0.03, p / maximo)));
            } catch {
                /* Solicitud cancelada o error de decodificación — silencio intencional */
            } finally {
                ctx.close().catch(() => {});
            }
        })();
        return () => {
            activo = false;
            controller.abort();
        };
    }, [src, picos]);

    const alternarPlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (reproduciendo) {
            audio.pause();
        } else {
            audio.play();
        }
        setReproduciendo(!reproduciendo);
    }, [reproduciendo]);

    const manejarProgreso = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        setProgreso(audio.currentTime / audio.duration);
    }, []);

    const manejarSeek = useCallback((pos: number) => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        audio.currentTime = pos * audio.duration;
        setProgreso(pos);
        if (!reproduciendo) {
            audio.play();
            setReproduciendo(true);
        }
    }, [reproduciendo]);

    const manejarLoadedMetadata = useCallback(() => {
        if (audioRef.current) setDuracion(audioRef.current.duration);
    }, []);

    const manejarEnded = useCallback(() => {
        setReproduciendo(false);
        setProgreso(0);
    }, []);

    return {
        audioRef,
        reproduciendo,
        progreso,
        duracion,
        picosGenerados,
        alternarPlay,
        manejarProgreso,
        manejarSeek,
        manejarLoadedMetadata,
        manejarEnded,
    };
};
