/*
 * Hook: useAudioPlayback
 * Logica de reproduccion de audio para TarjetaSample.
 * QQ49: Delega reproduccion al store global (useMotorAudio maneja el HTMLAudioElement).
 * Solo conserva: carga de waveform (picos) y puente play/pause/seek al store.
 */

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import type { SampleResumen } from '@app/types';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { extraerPicosAudio } from './utils/tarjetaSampleUtils';

interface UseAudioPlaybackOpciones {
    sample: SampleResumen;
    contexto?: SampleResumen[];
    onPlay?: (sample: SampleResumen) => void;
    onPause?: () => void;
    onSeek?: (posicion: number) => void;
}

export function useAudioPlayback(opciones: UseAudioPlaybackOpciones) {
    const { sample, contexto, onPlay, onPause, onSeek } = opciones;

    const [picosAudio, setPicosAudio] = useState<number[] | null>(null);
    const contextoRef = useRef(contexto);
    contextoRef.current = contexto;

    /* Selectores atómicos del store */
    const sampleActualId = useReproductorStore(s => s.sampleActual?.id ?? null);
    const reproduciendo = useReproductorStore(s => s.reproduciendo);
    const progresoStore = useReproductorStore(s => s.progreso);
    const reproducir = useReproductorStore(s => s.reproducir);
    const play = useReproductorStore(s => s.play);
    const pause = useReproductorStore(s => s.pause);
    const seek = useReproductorStore(s => s.seek);

    const esEste = sampleActualId === sample.id;

    /* Cargar waveform: servidor (JSON) o fallback AudioContext */
    useEffect(() => {
        let activo = true;

        const cargarWaveform = async () => {
            if (sample.rutaWaveform) {
                try {
                    /* QK59: Agregar audioHash como cache buster para refrescar waveform tras extension */
                    const urlWaveform = sample.audioHash
                        ? `${sample.rutaWaveform}?v=${sample.audioHash}`
                        : sample.rutaWaveform;
                    const respWf = await fetch(urlWaveform);
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

            const ctxAudio = new window.AudioContext();
            try {
                const respuesta = await fetch(sample.rutaPreview);
                if (!respuesta.ok) throw new Error('No se pudo cargar el audio de preview');

                const bufferAudio = await respuesta.arrayBuffer();
                const audioDecodificado = await ctxAudio.decodeAudioData(bufferAudio.slice(0));
                if (!activo) return;
                setPicosAudio(extraerPicosAudio(audioDecodificado));
            } catch {
                if (activo) setPicosAudio(null);
            } finally {
                ctxAudio.close().catch(() => undefined);
            }
        };

        cargarWaveform();
        return () => { activo = false; };
    }, [sample.rutaWaveform, sample.rutaPreview, sample.audioHash]);

    /* Play/Pause: delega al store global */
    const manejarPlayPause = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        if (esEste && reproduciendo) {
            pause();
            onPause?.();
            return;
        }
        if (esEste) {
            play();
            onPlay?.(sample);
            return;
        }
        reproducir(sample, contextoRef.current);
        onPlay?.(sample);
    }, [esEste, reproduciendo, pause, play, reproducir, sample, onPlay, onPause]);

    /* Seek en waveform: posicion 0..1 */
    const manejarSeek = useCallback((posicion: number) => {
        if (!esEste) {
            reproducir(sample, contextoRef.current);
        }
        seek(posicion);
        onSeek?.(posicion);
    }, [esEste, reproducir, seek, sample, onSeek]);

    /* Valores derivados */
    const estaActiva = esEste;
    const estaReproduciendo = esEste && reproduciendo;
    const progresoActual = esEste ? progresoStore : 0;

    return {
        picosAudio,
        reproduciendoLocal: estaReproduciendo,
        estaActiva,
        estaReproduciendo,
        progresoActual,
        manejarPlayPause,
        manejarSeek,
    };
}
