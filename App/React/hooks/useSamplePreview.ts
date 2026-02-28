/*
 * useSamplePreview — Reproducción rápida de preview de un sample.
 * Encapsula la creación del Audio element, coordinación global
 * (pausa otros samples) y limpieza al desmontar.
 * C326: Extraído para reutilizar en TarjetaSampleCuadricula.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { enviarTrackingReproduccion } from '../utils/trackingReproduccion';

const EVENTO_REPRODUCCION = 'kamples:reproduccion-sample';

export const useSamplePreview = (sampleId: number, rutaPreview: string) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [reproduciendo, setReproduciendo] = useState(false);

    const togglePlay = useCallback(() => {
        if (!audioRef.current) {
            const audio = new Audio(rutaPreview);
            audio.preload = 'metadata';
            audio.addEventListener('play', () => setReproduciendo(true));
            audio.addEventListener('pause', () => setReproduciendo(false));
            audio.addEventListener('ended', () => {
                enviarTrackingReproduccion(sampleId, audio.duration || 0, true);
                setReproduciendo(false);
                audio.currentTime = 0;
            });
            audioRef.current = audio;
        }

        const audio = audioRef.current;

        if (!audio.paused) {
            enviarTrackingReproduccion(sampleId, audio.currentTime || 0, false);
            audio.pause();
            return;
        }

        /* Pausar cualquier otro sample que esté sonando */
        window.dispatchEvent(
            new CustomEvent(EVENTO_REPRODUCCION, { detail: { sampleId } })
        );

        audio.play().catch(() => setReproduciendo(false));
    }, [sampleId, rutaPreview]);

    /* Escuchar evento global para pausar si otro sample empieza */
    useEffect(() => {
        const pausarSiEsOtro = (event: Event) => {
            const detalle = (event as CustomEvent<{ sampleId?: number }>).detail;
            if (detalle?.sampleId === sampleId) return;
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
            }
        };

        window.addEventListener(EVENTO_REPRODUCCION, pausarSiEsOtro as EventListener);
        return () => {
            window.removeEventListener(EVENTO_REPRODUCCION, pausarSiEsOtro as EventListener);
            if (audioRef.current) {
                if (!audioRef.current.paused) {
                    enviarTrackingReproduccion(sampleId, audioRef.current.currentTime || 0, false);
                }
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [sampleId]);

    return { reproduciendo, togglePlay };
};
